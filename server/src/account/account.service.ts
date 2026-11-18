import QRCode from "qrcode";
import {
  formatBackupCode,
  LOCALES,
  loginRequestSchema,
  passwordChangeSchema,
  passwordProblems,
  recoveryRequestSchema,
  recoveryResetSchema,
  roleSchema,
  twoFactorConfirmSchema,
  twoFactorDisableSchema,
  twoFactorSetupRequestSchema,
  type AccountInfo,
  type AccountOptions,
  type LoginResult,
  type TwoFactorEnabled,
  type TwoFactorSetup,
} from "@ellma/shared";
import type { Account } from "../platform/access.js";
import { EllmaError, notFound } from "../platform/errors.js";
import { RateLimiter } from "../platform/rateLimit.js";
import {
  mailConfigured,
  passwords,
  sendMail,
  tokens,
  type ProfileRecord,
} from "../platform/yappio.js";
import * as repository from "./account.repository.js";
import { fingerprint, newBackupCodes, newToken, seal, unseal } from "./secrets.js";
import { generateSecret, matchCode, otpauthUrl } from "./totp.js";

const QUARTER_HOUR = 15 * 60 * 1000;
export const RECOVERY_MINUTES = 30;

const loginByAddress = new RateLimiter(40, QUARTER_HOUR);
const loginByAccount = new RateLimiter(10, QUARTER_HOUR);
const secretChecks = new RateLimiter(10, QUARTER_HOUR);
const recoveryByAddress = new RateLimiter(8, QUARTER_HOUR);
const recoveryByAccount = new RateLimiter(3, 60 * 60 * 1000);

const invalidCredentials = () => new EllmaError(401, "invalid_credentials");

/** Token lifetimes are counted in whole seconds, so "now" is too. */
function thisSecond(): Date {
  return new Date(Math.floor(Date.now() / 1000) * 1000);
}

function issueToken(profile: ProfileRecord, secondFactorPassed: boolean): string {
  return tokens.signForAuthHeader({
    _id: profile._id.toString(),
    username: profile.username,
    email: profile.email,
    role: roleSchema.parse(profile.role ?? "user"),
    ...(secondFactorPassed ? { mfa: true } : {}),
  });
}

let timingPad: Promise<string> | undefined;

/** Compares even when the account is unknown, so response time does not reveal who exists. */
async function passwordMatches(profile: ProfileRecord | null, password: string): Promise<boolean> {
  timingPad ??= passwords.hashPassword(newToken());
  const matches = await passwords.comparePassword(password, profile?.password || (await timingPad));
  return Boolean(profile?.password) && matches;
}

/** Accepts an authenticator code or an unused backup code, and uses it up. */
async function consumeSecondFactor(security: repository.Security, code: string): Promise<boolean> {
  if (!security.totpSecret) {
    return false;
  }
  if (/^\d{6}$/.test(code)) {
    const counter = matchCode(unseal(security.totpSecret), code, security.totpLastCounter);
    if (counter === null) {
      return false;
    }
    await repository.saveSecurity(security.ownerId, { totpLastCounter: counter });
    return true;
  }
  const hash = fingerprint(code);
  const remaining = (security.backupCodeHashes ?? []).filter((stored) => stored !== hash);
  if (remaining.length === (security.backupCodeHashes ?? []).length) {
    return false;
  }
  await repository.saveSecurity(security.ownerId, { backupCodeHashes: remaining });
  return true;
}

async function requireProfile(account: Account): Promise<ProfileRecord> {
  const profile = await repository.findProfile(account.id);
  if (!profile) {
    throw notFound();
  }
  return profile;
}

async function requirePassword(account: Account, password: string): Promise<ProfileRecord> {
  secretChecks.attempt(account.id);
  const profile = await requireProfile(account);
  if (!(await passwordMatches(profile, password))) {
    throw new EllmaError(403, "invalid_password");
  }
  return profile;
}

function requireStrongPassword(password: string): void {
  if (passwordProblems(password).length > 0) {
    throw new EllmaError(400, "weak_password");
  }
}

export function accountOptions(): AccountOptions {
  return { recoveryByEmail: mailConfigured() };
}

export async function login(input: unknown, address: string): Promise<LoginResult> {
  const { email, password, code } = loginRequestSchema.parse(input);
  const accountKey = email.toLowerCase();
  loginByAddress.attempt(address);
  loginByAccount.attempt(accountKey);
  const profile = await repository.findProfileByEmail(email);
  if (!(await passwordMatches(profile, password)) || !profile) {
    throw invalidCredentials();
  }
  const ownerId = profile._id.toString();
  const security = await repository.findSecurity(ownerId);
  const secondFactor = Boolean(security?.totpEnabledAt);
  if (security && secondFactor) {
    if (!code) {
      return { status: "code_required" };
    }
    if (!(await consumeSecondFactor(security, code))) {
      throw new EllmaError(401, "invalid_code");
    }
  }
  loginByAccount.clear(accountKey);
  return { status: "ok", token: issueToken(profile, secondFactor) };
}

export async function accountInfo(account: Account): Promise<AccountInfo> {
  const [profile, security] = await Promise.all([
    requireProfile(account),
    repository.findSecurity(account.id),
  ]);
  const twoFactor = Boolean(security?.totpEnabledAt);
  return {
    id: account.id,
    name: profile.username,
    email: profile.email,
    role: account.role,
    twoFactor,
    backupCodesLeft: twoFactor ? (security?.backupCodeHashes ?? []).length : 0,
  };
}

/** Changes the password and signs every other device out. */
export async function changePassword(account: Account, input: unknown) {
  const { currentPassword, newPassword } = passwordChangeSchema.parse(input);
  requireStrongPassword(newPassword);
  const profile = await requirePassword(account, currentPassword);
  await repository.setPasswordHash(account.id, await passwords.hashPassword(newPassword));
  const security = await repository.findSecurity(account.id);
  await repository.saveSecurity(account.id, {
    sessionsValidFrom: thisSecond(),
    recoveryTokenHash: null,
    recoveryExpiresAt: null,
  });
  return { token: issueToken(profile, Boolean(security?.totpEnabledAt)) };
}

export async function setupTwoFactor(account: Account, input: unknown): Promise<TwoFactorSetup> {
  const { password } = twoFactorSetupRequestSchema.parse(input);
  const profile = await requirePassword(account, password);
  if ((await repository.findSecurity(account.id))?.totpEnabledAt) {
    throw new EllmaError(409, "already_enabled");
  }
  const secret = generateSecret();
  await repository.saveSecurity(account.id, { totpPendingSecret: seal(secret) });
  const url = otpauthUrl(secret, profile.email);
  return {
    secret,
    otpauthUrl: url,
    qrCode: await QRCode.toDataURL(url, { margin: 1, width: 240 }),
  };
}

/** Switches the second factor on once the authenticator proves it has the secret. */
export async function enableTwoFactor(account: Account, input: unknown): Promise<TwoFactorEnabled> {
  const { code } = twoFactorConfirmSchema.parse(input);
  secretChecks.attempt(account.id);
  const security = await repository.findSecurity(account.id);
  if (security?.totpEnabledAt) {
    throw new EllmaError(409, "already_enabled");
  }
  if (!security?.totpPendingSecret) {
    throw new EllmaError(409, "setup_required");
  }
  const counter = matchCode(unseal(security.totpPendingSecret), code);
  if (counter === null) {
    throw new EllmaError(403, "invalid_code");
  }
  const backupCodes = newBackupCodes();
  await repository.saveSecurity(account.id, {
    totpSecret: security.totpPendingSecret,
    totpPendingSecret: null,
    totpEnabledAt: new Date(),
    totpLastCounter: counter,
    backupCodeHashes: backupCodes.map(fingerprint),
  });
  await repository.setTwoFactorFlag(account.id, true);
  return {
    token: issueToken(await requireProfile(account), true),
    backupCodes: backupCodes.map(formatBackupCode),
  };
}

export async function clearTwoFactor(ownerId: string): Promise<void> {
  await repository.saveSecurity(ownerId, {
    totpSecret: null,
    totpPendingSecret: null,
    totpEnabledAt: null,
    totpLastCounter: 0,
    backupCodeHashes: [],
  });
  await repository.setTwoFactorFlag(ownerId, false);
}

export async function disableTwoFactor(account: Account, input: unknown) {
  const { password, code } = twoFactorDisableSchema.parse(input);
  const profile = await requirePassword(account, password);
  const security = await repository.findSecurity(account.id);
  if (!security?.totpEnabledAt) {
    throw new EllmaError(409, "not_enabled");
  }
  if (!(await consumeSecondFactor(security, code))) {
    throw new EllmaError(403, "invalid_code");
  }
  await clearTwoFactor(account.id);
  return { token: issueToken(profile, false) };
}

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? "",
  );
}

/** Stores a one-time reset token (as a fingerprint) and mails the link. */
export async function sendRecoveryMail(profile: ProfileRecord, locale: "en" | "de") {
  const token = newToken();
  await repository.saveSecurity(profile._id.toString(), {
    recoveryTokenHash: fingerprint(token),
    recoveryExpiresAt: new Date(Date.now() + RECOVERY_MINUTES * 60 * 1000),
  });
  const base = (process.env.ELLMA_WEB_URL ?? "https://ellma.yappai.de").replace(/\/$/, "");
  // The token travels in the fragment, which browsers never send to a server or log.
  const link = `${base}/reset-password#${token}`;
  const text = LOCALES[locale].mail.recovery;
  const lines = text.body(profile.username, link, RECOVERY_MINUTES);
  await sendMail({
    to: profile.email,
    subject: text.subject,
    text: lines.join("\n\n"),
    html: lines
      .map((line) =>
        line === link
          ? `<p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>`
          : `<p>${escapeHtml(line)}</p>`,
      )
      .join(""),
  });
}

/**
 * Always answers the same way, whether or not the address belongs to an account, and does
 * not wait for the mail server, so neither the reply nor its timing reveals who has one.
 */
export async function requestRecovery(input: unknown, address: string) {
  const { email, locale } = recoveryRequestSchema.parse(input);
  recoveryByAddress.attempt(address);
  if (mailConfigured() && recoveryByAccount.allow(email.toLowerCase())) {
    void repository
      .findProfileByEmail(email)
      .then((profile) => (profile?.email.includes("@") ? sendRecoveryMail(profile, locale) : null))
      .catch((error: unknown) => {
        console.error(
          "Ellma recovery mail failed",
          error instanceof Error ? error.name : "unknown",
        );
      });
  }
  return { ok: true as const };
}

/** Sets a new password from a reset link. The second factor, if any, stays switched on. */
export async function resetPassword(input: unknown, address: string) {
  recoveryByAddress.attempt(address);
  const { token, password } = recoveryResetSchema.parse(input);
  requireStrongPassword(password);
  const security = await repository.findSecurityByRecoveryHash(fingerprint(token));
  if (!security) {
    throw new EllmaError(400, "invalid_token");
  }
  await repository.setPasswordHash(security.ownerId, await passwords.hashPassword(password));
  await repository.saveSecurity(security.ownerId, {
    recoveryTokenHash: null,
    recoveryExpiresAt: null,
    sessionsValidFrom: thisSecond(),
  });
  return { ok: true as const };
}
