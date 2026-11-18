import { createCollection, Provider } from "yappio";

/**
 * Security state per account. Secrets are never stored readable: the authenticator secret
 * is encrypted, backup codes and the password-reset token are stored as hashes only.
 */
export type AccountSecurityRecord = {
  ownerId: string;
  totpSecret: string | null;
  totpPendingSecret: string | null;
  totpEnabledAt: Date | null;
  /** Last accepted time step, so one code cannot be used twice. */
  totpLastCounter: number;
  backupCodeHashes: string[];
  recoveryTokenHash: string | null;
  recoveryExpiresAt: Date | null;
  /** Login tokens issued before this moment are no longer accepted. */
  sessionsValidFrom: Date | null;
  updatedAt: Date;
};

export default createCollection<AccountSecurityRecord>("EllmaAccountSecurity").withSchema({
  ownerId: { ...Provider.String, required: true, unique: true },
  totpSecret: { ...Provider.String, default: null },
  totpPendingSecret: { ...Provider.String, default: null },
  totpEnabledAt: { ...Provider.Date, default: null },
  totpLastCounter: { ...Provider.Number, default: 0 },
  backupCodeHashes: Provider.Mixed,
  recoveryTokenHash: { ...Provider.String, default: null, index: true },
  recoveryExpiresAt: { ...Provider.Date, default: null },
  sessionsValidFrom: { ...Provider.Date, default: null },
  updatedAt: { ...Provider.Date, required: true },
});
