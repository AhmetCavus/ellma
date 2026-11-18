import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

// Keys are derived from JWT_SECRET, which index.ts requires to be at least 32 characters.
function key(purpose: string): Buffer {
  return Buffer.from(
    hkdfSync("sha256", process.env.JWT_SECRET ?? "", "ellma-account-security", purpose, 32),
  );
}

/** Encrypts a value that must be read back later (the authenticator secret). */
export function seal(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key("seal"), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), body]
    .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
    .join(".");
}

export function unseal(sealed: string): string {
  const [version, iv, tag, body] = sealed.split(".");
  if (version !== "v1" || !iv || !tag || !body) {
    throw new Error("unreadable_secret");
  }
  const decipher = createDecipheriv("aes-256-gcm", key("seal"), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(body, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/** Keyed fingerprint for values that only ever need comparing (reset tokens, backup codes). */
export function fingerprint(value: string): string {
  return createHmac("sha256", key("fingerprint")).update(value).digest("hex");
}

/** A 256-bit URL-safe token (43 characters). */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

// No I, O, 0 or 1, so a code is easy to copy from paper.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    Array.from(randomBytes(10), (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join(""),
  );
}
