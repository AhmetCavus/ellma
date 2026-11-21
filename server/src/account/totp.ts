import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** Time-based one-time passwords (RFC 6238): SHA-1, six digits, 30-second steps. */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;
/** One step of clock drift in either direction is tolerated. */
const WINDOW = 1;

export function encodeBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function decodeBase32(text: string): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const character of text.replace(/[\s=]/g, "").toUpperCase()) {
    const index = ALPHABET.indexOf(character);
    if (index < 0) {
      throw new Error("invalid_base32");
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateSecret(): string {
  return encodeBase32(randomBytes(20));
}

export function codeAt(secret: string, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeUInt32BE(Math.floor(counter / 0x1_0000_0000), 0);
  message.writeUInt32BE(counter % 0x1_0000_0000, 4);
  const digest = createHmac("sha1", decodeBase32(secret)).update(message).digest();
  const offset = (digest[digest.length - 1] ?? 0) & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7fff_ffff;
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

export function currentCounter(now = Date.now()): number {
  return Math.floor(now / 1000 / STEP_SECONDS);
}

/**
 * Returns the time step a code belongs to, or null when it is wrong. Steps at or before
 * `lastCounter` are refused, so an observed code cannot be replayed.
 */
export function matchCode(
  secret: string,
  code: string,
  lastCounter = 0,
  now = Date.now(),
): number | null {
  if (!/^\d{6}$/.test(code)) {
    return null;
  }
  const given = Buffer.from(code);
  const current = currentCounter(now);
  for (let counter = current - WINDOW; counter <= current + WINDOW; counter++) {
    if (counter > lastCounter && timingSafeEqual(given, Buffer.from(codeAt(secret, counter)))) {
      return counter;
    }
  }
  return null;
}

/** The address authenticator apps read from the QR code. */
export function otpauthUrl(secret: string, account: string, issuer = "ellma"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const query = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${query}`;
}
