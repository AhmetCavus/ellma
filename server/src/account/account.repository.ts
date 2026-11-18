import AccountSecurityModel, {
  type AccountSecurityRecord,
} from "../models/accountSecurity.model.js";
import { Profiles, type ProfileRecord } from "../platform/yappio.js";

export type Security = AccountSecurityRecord;

export async function findSecurity(ownerId: string): Promise<Security | null> {
  return AccountSecurityModel.model.findOne({ ownerId }).lean<Security | null>();
}

export async function saveSecurity(
  ownerId: string,
  changes: Partial<Omit<Security, "ownerId" | "updatedAt">>,
): Promise<void> {
  await AccountSecurityModel.model.updateOne(
    { ownerId },
    { $set: { ...changes, updatedAt: new Date() }, $setOnInsert: { ownerId } },
    { upsert: true },
  );
}

export async function findSecurityByRecoveryHash(hash: string): Promise<Security | null> {
  return AccountSecurityModel.model
    .findOne({ recoveryTokenHash: hash, recoveryExpiresAt: { $gt: new Date() } })
    .lean<Security | null>();
}

export async function deleteSecurity(ownerId: string): Promise<void> {
  await AccountSecurityModel.model.deleteOne({ ownerId });
}

export async function findProfile(id: string): Promise<ProfileRecord | null> {
  return Profiles.model.findOne({ _id: id }).lean<ProfileRecord | null>();
}

/** Yappio stores the address as it was typed at sign-up; fall back to the lower-case form. */
export async function findProfileByEmail(email: string): Promise<ProfileRecord | null> {
  const exact = await Profiles.model.findOne({ email }).lean<ProfileRecord | null>();
  if (exact || email === email.toLowerCase()) {
    return exact;
  }
  return Profiles.model.findOne({ email: email.toLowerCase() }).lean<ProfileRecord | null>();
}

export async function setPasswordHash(id: string, hash: string): Promise<void> {
  await Profiles.model.updateOne({ _id: id }, { $set: { password: hash } });
}

/** Mirrors the state into Yappio's own flag, so its login never issues a full token alone. */
export async function setTwoFactorFlag(id: string, enabled: boolean): Promise<void> {
  await Profiles.model.updateOne({ _id: id }, { $set: { is2FA: enabled } });
}
