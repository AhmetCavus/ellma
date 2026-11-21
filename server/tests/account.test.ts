import assert from "node:assert/strict";
import { test } from "node:test";
import { canManageAccount, loginRequestSchema, recoveryResetSchema } from "@ellma/shared";
import { fingerprint, newBackupCodes, newToken, seal, unseal } from "../src/account/secrets.ts";
import {
  codeAt,
  currentCounter,
  decodeBase32,
  encodeBase32,
  generateSecret,
  matchCode,
  otpauthUrl,
} from "../src/account/totp.ts";
import { RateLimiter } from "../src/platform/rateLimit.ts";

process.env.JWT_SECRET ??= "unit-test-only-secret-0123456789abcdef";

// RFC 6238 appendix B uses the ASCII secret "12345678901234567890".
const RFC_SECRET = encodeBase32(Buffer.from("12345678901234567890"));

test("authenticator codes match the RFC 6238 test vectors", () => {
  assert.equal(RFC_SECRET, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  assert.equal(codeAt(RFC_SECRET, currentCounter(59_000)), "287082");
  assert.equal(codeAt(RFC_SECRET, currentCounter(1_111_111_109_000)), "081804");
  assert.equal(codeAt(RFC_SECRET, currentCounter(1_234_567_890_000)), "005924");
  assert.equal(codeAt(RFC_SECRET, currentCounter(20_000_000_000_000)), "353130");
});

test("base32 round-trips and secrets are 160 bits", () => {
  const secret = generateSecret();
  assert.match(secret, /^[A-Z2-7]{32}$/);
  assert.equal(encodeBase32(decodeBase32(secret)), secret);
  assert.throws(() => decodeBase32("not base32!"));
});

test("codes tolerate one step of drift and cannot be replayed", () => {
  const now = 1_700_000_000_000;
  const counter = currentCounter(now);
  const code = codeAt(RFC_SECRET, counter);
  assert.equal(matchCode(RFC_SECRET, code, 0, now), counter);
  assert.equal(matchCode(RFC_SECRET, code, 0, now + 30_000), counter);
  assert.equal(matchCode(RFC_SECRET, code, 0, now + 90_000), null);
  // Once a step was accepted, it and everything before it is refused.
  assert.equal(matchCode(RFC_SECRET, code, counter, now), null);
  assert.equal(matchCode(RFC_SECRET, "abcdef", 0, now), null);
  assert.equal(matchCode(RFC_SECRET, "12345", 0, now), null);
});

test("the QR address names Ellma and the account", () => {
  const url = new URL(otpauthUrl(RFC_SECRET, "mia@example.test"));
  assert.equal(url.protocol, "otpauth:");
  assert.equal(url.host, "totp");
  assert.equal(decodeURIComponent(url.pathname), "/ellma:mia@example.test");
  assert.equal(url.searchParams.get("secret"), RFC_SECRET);
  assert.equal(url.searchParams.get("issuer"), "ellma");
});

test("stored secrets are encrypted, tokens and codes only fingerprinted", () => {
  const sealed = seal(RFC_SECRET);
  assert.ok(!sealed.includes(RFC_SECRET));
  assert.notEqual(seal(RFC_SECRET), sealed, "every encryption uses a fresh nonce");
  assert.equal(unseal(sealed), RFC_SECRET);
  assert.throws(() => unseal(`${sealed.slice(0, -2)}xx`), "tampering must not decrypt");

  const token = newToken();
  assert.ok(recoveryResetSchema.safeParse({ token, password: "x" }).success);
  assert.equal(fingerprint(token), fingerprint(token));
  assert.notEqual(fingerprint(token), fingerprint(newToken()));

  const codes = newBackupCodes();
  assert.equal(new Set(codes).size, 8);
  codes.forEach((code) => assert.match(code, /^[A-HJ-NP-Z2-9]{10}$/));
});

test("second factors are normalized before they are checked", () => {
  const login = (code: string) =>
    loginRequestSchema.safeParse({ email: "mia@example.test", password: "secret", code });
  assert.equal(login("123 456").data?.code, "123456");
  assert.equal(login("abcde-fghjk").data?.code, "ABCDEFGHJK");
  assert.ok(!login("12345").success);
  assert.ok(!login("abcde-fghj").success);
});

test("attempt limits count per key and reset after the window", () => {
  const limiter = new RateLimiter(2, 1000);
  assert.ok(limiter.allow("a", 0));
  assert.ok(limiter.allow("a", 10));
  assert.ok(!limiter.allow("a", 20));
  assert.ok(limiter.allow("b", 20), "other keys are unaffected");
  assert.ok(limiter.allow("a", 1001), "a new window starts");
  limiter.clear("a");
  assert.ok(limiter.allow("a", 1002) && limiter.allow("a", 1003));
});

test("admins manage users, only root manages admins, nobody manages root or themselves", () => {
  const user = { id: "u", role: "user" as const };
  const admin = { id: "a", role: "admin" as const };
  const otherAdmin = { id: "b", role: "admin" as const };
  const root = { id: "r", role: "root" as const };
  assert.ok(canManageAccount(admin, user));
  assert.ok(!canManageAccount(admin, otherAdmin));
  assert.ok(canManageAccount(root, admin));
  assert.ok(!canManageAccount(admin, root));
  assert.ok(!canManageAccount(admin, admin));
  assert.ok(!canManageAccount(user, { id: "x", role: "user" }));
});
