import { createRequire } from "node:module";
import path from "node:path";
import type { Model } from "mongoose";

const require = createRequire(import.meta.url);
const core = path.join(path.dirname(require.resolve("yappio")), "src/core");

// Yappio 1.3.1 does not export these services; this file is the only place that reaches
// into the pinned package, so an upgrade has one adapter to check.
function load<T>(file: string): T {
  return (require(path.join(core, file)) as { default: T }).default;
}

export type ProfileRecord = {
  _id: { toString(): string; getTimestamp(): Date };
  username: string;
  email: string;
  password: string;
  role?: string;
  is2FA?: boolean;
};

export const tokens = load<{
  verify(token: string): unknown;
  /** Signs a 24-hour login token; extra claims in the payload are kept. */
  signForAuthHeader(payload: Record<string, unknown>): string;
}>("services/token.service.js");

export const passwords = load<{
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}>("services/encryption.service.js");

const mailService = load<{
  sendEmail(mail: { to: string; subject: string; text: string; html?: string }): Promise<void>;
}>("services/mail.service.js");

export const Profiles = load<{ model: Model<ProfileRecord> }>("models/profile.model.js");
export const ApiTokens = load<{ model: Model<{ uid: unknown }> }>("models/token.model.js");

/** Mail goes through Yappio's mailer, which reads MAIL_* (SMTP over TLS, usually port 465). */
export function mailConfigured(): boolean {
  return Boolean(
    process.env.MAIL_HOST &&
    process.env.MAIL_PORT &&
    process.env.MAIL_USER &&
    process.env.MAIL_PASS &&
    process.env.MAIL_SENDER,
  );
}

export async function sendMail(mail: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  await mailService.sendEmail(mail);
}
