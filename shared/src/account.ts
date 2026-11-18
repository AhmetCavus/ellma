import { z } from "zod";
import { identifier, isoTimestamp } from "./contracts.js";

/** Contracts for signing in, account security, password recovery and the admin panel. */

export const ROLES = ["user", "admin", "root"] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

const email = z.string().trim().min(1).max(254);
const password = z.string().min(1).max(72);
/** A six-digit authenticator code or a backup code; spaces and dashes are ignored. */
const secondFactor = z
  .string()
  .max(40)
  .transform((value) => value.replace(/[\s-]/g, "").toUpperCase())
  .pipe(z.string().regex(/^(\d{6}|[A-Z2-9]{10})$/, "invalid_code"));
const authenticatorCode = z
  .string()
  .max(20)
  .transform((value) => value.replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{6}$/, "invalid_code"));

export const loginRequestSchema = z.object({
  email,
  password,
  code: secondFactor.optional(),
});
export type LoginRequest = z.input<typeof loginRequestSchema>;

export const loginResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok"), token: z.string().min(1) }),
  z.object({ status: z.literal("code_required") }),
]);
export type LoginResult = z.infer<typeof loginResultSchema>;

export const sessionTokenSchema = z.object({ token: z.string().min(1) });

export const accountSchema = z.object({
  id: identifier,
  name: z.string(),
  email: z.string(),
  role: roleSchema,
  twoFactor: z.boolean(),
  backupCodesLeft: z.number().int().min(0),
});
export type AccountInfo = z.infer<typeof accountSchema>;

export const accountOptionsSchema = z.object({ recoveryByEmail: z.boolean() });
export type AccountOptions = z.infer<typeof accountOptionsSchema>;

export const passwordChangeSchema = z.object({
  currentPassword: password,
  newPassword: password,
});
export type PasswordChange = z.infer<typeof passwordChangeSchema>;

export const twoFactorSetupRequestSchema = z.object({ password });
export const twoFactorSetupSchema = z.object({
  secret: z.string().min(16),
  otpauthUrl: z.string().startsWith("otpauth://"),
  qrCode: z.string().startsWith("data:image/"),
});
export type TwoFactorSetup = z.infer<typeof twoFactorSetupSchema>;

export const twoFactorConfirmSchema = z.object({ code: authenticatorCode });
export const twoFactorEnabledSchema = z.object({
  token: z.string().min(1),
  backupCodes: z.array(z.string()),
});
export type TwoFactorEnabled = z.infer<typeof twoFactorEnabledSchema>;

export const twoFactorDisableSchema = z.object({ password, code: secondFactor });
export type TwoFactorDisable = z.input<typeof twoFactorDisableSchema>;

export const recoveryRequestSchema = z.object({
  email,
  locale: z.enum(["en", "de"]).default("en"),
});
export type RecoveryRequest = z.input<typeof recoveryRequestSchema>;

export const recoveryResetSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "invalid_token"),
  password,
});
export type RecoveryReset = z.infer<typeof recoveryResetSchema>;

export const acknowledgedSchema = z.object({ ok: z.literal(true) });

export const adminOverviewSchema = z.object({
  users: z.number(),
  admins: z.number(),
  twoFactorUsers: z.number(),
  newUsersThisWeek: z.number(),
  activeUsersThisWeek: z.number(),
  goals: z.number(),
  tasks: z.number(),
  tasksDone: z.number(),
  focusSeconds: z.number(),
  focusSecondsThisWeek: z.number(),
  assistantMessages: z.number(),
  system: z.object({
    version: z.string(),
    model: z.string(),
    modelReachable: z.boolean(),
    mailConfigured: z.boolean(),
  }),
});
export type AdminOverview = z.infer<typeof adminOverviewSchema>;

export const adminUserSchema = z.object({
  id: identifier,
  name: z.string(),
  email: z.string(),
  role: roleSchema,
  twoFactor: z.boolean(),
  createdAt: isoTimestamp,
  lastActiveAt: isoTimestamp.nullable(),
  goals: z.number(),
  tasks: z.number(),
  focusSeconds: z.number(),
  /** Whether the signed-in administrator may change or delete this account. */
  manageable: z.boolean(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminRoleChangeSchema = z.object({ role: z.enum(["user", "admin"]) });
export type AdminRoleChange = z.infer<typeof adminRoleChangeSchema>;

/**
 * Who may manage whom: nobody manages themselves here or a root account; admins manage
 * users; only root manages other admins.
 */
export function canManageAccount(
  actor: { id: string; role: Role },
  target: { id: string; role: Role },
): boolean {
  if (actor.id === target.id || target.role === "root" || actor.role === "user") {
    return false;
  }
  return target.role === "user" || actor.role === "root";
}

/** Backup codes are shown in two groups of five. */
export function formatBackupCode(code: string): string {
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}
