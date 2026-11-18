import { createRequire } from "node:module";
import {
  adminRoleChangeSchema,
  canManageAccount,
  roleSchema,
  type AdminOverview,
  type AdminUser,
  type Role,
} from "@ellma/shared";
import { z } from "zod";
import * as accounts from "../account/account.repository.js";
import { clearTwoFactor, sendRecoveryMail } from "../account/account.service.js";
import { ollamaSettings } from "../assistant/ollama.client.js";
import AccountSecurityModel from "../models/accountSecurity.model.js";
import AssistantMessageModel from "../models/assistantMessage.model.js";
import DailyNoteModel from "../models/dailyNote.model.js";
import FocusSessionModel from "../models/focusSession.model.js";
import GoalModel from "../models/goal.model.js";
import TaskModel from "../models/task.model.js";
import type { Account } from "../platform/access.js";
import { EllmaError, notFound } from "../platform/errors.js";
import { ApiTokens, mailConfigured, Profiles, type ProfileRecord } from "../platform/yappio.js";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const version = (createRequire(import.meta.url)("../../package.json") as { version: string })
  .version;

type OwnerRow = { _id: string; count: number; seconds?: number; last?: Date | null };

function roleOf(profile: ProfileRecord): Role {
  return roleSchema.catch("user").parse(profile.role);
}

async function modelReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${ollamaSettings().url}/api/version`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Totals only: the panel never shows what a person wrote, planned or said to Ellma. */
export async function overview(): Promise<AdminOverview> {
  const since = new Date(Date.now() - WEEK);
  const [
    profiles,
    twoFactorUsers,
    goals,
    tasks,
    tasksDone,
    focus,
    assistantMessages,
    activeOwners,
    reachable,
  ] = await Promise.all([
    Profiles.model.find().select("role").lean<ProfileRecord[]>(),
    AccountSecurityModel.model.countDocuments({ totpEnabledAt: { $ne: null } }),
    GoalModel.model.countDocuments(),
    TaskModel.model.countDocuments(),
    TaskModel.model.countDocuments({ doneAt: { $ne: null } }),
    FocusSessionModel.model.aggregate<{ _id: boolean; ms: number }>([
      { $match: { endedAt: { $ne: null } } },
      {
        $group: {
          _id: { $gte: ["$startedAt", since] },
          ms: { $sum: { $subtract: ["$endedAt", "$startedAt"] } },
        },
      },
    ]),
    AssistantMessageModel.model.countDocuments({ role: "user" }),
    Promise.all([
      FocusSessionModel.model.distinct("ownerId", { startedAt: { $gte: since } }),
      TaskModel.model.distinct("ownerId", { createdAt: { $gte: since } }),
      AssistantMessageModel.model.distinct("ownerId", { createdAt: { $gte: since } }),
    ]),
    modelReachable(),
  ]);
  const recentMs = focus.find((row) => row._id)?.ms ?? 0;
  const earlierMs = focus.find((row) => !row._id)?.ms ?? 0;
  return {
    users: profiles.length,
    admins: profiles.filter((profile) => roleOf(profile) !== "user").length,
    twoFactorUsers,
    newUsersThisWeek: profiles.filter((profile) => profile._id.getTimestamp() >= since).length,
    activeUsersThisWeek: new Set(activeOwners.flat().map(String)).size,
    goals,
    tasks,
    tasksDone,
    focusSeconds: Math.floor((recentMs + earlierMs) / 1000),
    focusSecondsThisWeek: Math.floor(recentMs / 1000),
    assistantMessages,
    system: {
      version,
      model: ollamaSettings().model,
      modelReachable: reachable,
      mailConfigured: mailConfigured(),
    },
  };
}

function byOwner(rows: OwnerRow[]): Map<string, OwnerRow> {
  return new Map(rows.map((row) => [row._id, row]));
}

function latest(...dates: (Date | null | undefined)[]): string | null {
  const times = dates.filter((date): date is Date => date instanceof Date).map(Number);
  return times.length > 0 ? new Date(Math.max(...times)).toISOString() : null;
}

async function toAdminUsers(actor: Account, profiles: ProfileRecord[]): Promise<AdminUser[]> {
  const owners = profiles.map((profile) => profile._id.toString());
  const match = { $match: { ownerId: { $in: owners } } };
  const [goals, tasks, sessions, messages, secured] = await Promise.all([
    GoalModel.model.aggregate<OwnerRow>([
      match,
      { $group: { _id: "$ownerId", count: { $sum: 1 }, last: { $max: "$updatedAt" } } },
    ]),
    TaskModel.model.aggregate<OwnerRow>([
      match,
      { $group: { _id: "$ownerId", count: { $sum: 1 }, last: { $max: "$createdAt" } } },
    ]),
    FocusSessionModel.model.aggregate<OwnerRow>([
      match,
      {
        $group: {
          _id: "$ownerId",
          count: { $sum: 1 },
          last: { $max: "$startedAt" },
          seconds: {
            $sum: {
              $cond: [
                { $ifNull: ["$endedAt", false] },
                { $divide: [{ $subtract: ["$endedAt", "$startedAt"] }, 1000] },
                0,
              ],
            },
          },
        },
      },
    ]),
    AssistantMessageModel.model.aggregate<OwnerRow>([
      match,
      { $group: { _id: "$ownerId", count: { $sum: 1 }, last: { $max: "$createdAt" } } },
    ]),
    AccountSecurityModel.model.distinct("ownerId", {
      ownerId: { $in: owners },
      totpEnabledAt: { $ne: null },
    }),
  ]);
  const [goalRows, taskRows, sessionRows, messageRows] = [goals, tasks, sessions, messages].map(
    byOwner,
  );
  const twoFactor = new Set(secured.map(String));
  return profiles.map((profile) => {
    const id = profile._id.toString();
    const role = roleOf(profile);
    return {
      id,
      name: profile.username,
      email: profile.email,
      role,
      twoFactor: twoFactor.has(id),
      createdAt: profile._id.getTimestamp().toISOString(),
      lastActiveAt: latest(
        goalRows?.get(id)?.last,
        taskRows?.get(id)?.last,
        sessionRows?.get(id)?.last,
        messageRows?.get(id)?.last,
      ),
      goals: goalRows?.get(id)?.count ?? 0,
      tasks: taskRows?.get(id)?.count ?? 0,
      focusSeconds: Math.floor(sessionRows?.get(id)?.seconds ?? 0),
      manageable: canManageAccount(actor, { id, role }),
    };
  });
}

export async function listUsers(actor: Account): Promise<AdminUser[]> {
  const profiles = await Profiles.model
    .find()
    .select("username email role")
    .sort({ _id: -1 })
    .limit(2000)
    .lean<ProfileRecord[]>();
  return toAdminUsers(actor, profiles);
}

async function manageable(actor: Account, id: string): Promise<ProfileRecord> {
  const profile = await accounts.findProfile(id);
  if (!profile) {
    throw notFound();
  }
  if (!canManageAccount(actor, { id, role: roleOf(profile) })) {
    throw new EllmaError(403, "not_allowed");
  }
  return profile;
}

function record(actor: Account, action: string, targetId: string): void {
  // Identifiers only; names and addresses do not belong in the server log.
  console.log(`Ellma admin action: ${action} by ${actor.id} on ${targetId}`);
}

async function single(actor: Account, id: string): Promise<AdminUser> {
  const profile = await accounts.findProfile(id);
  if (!profile) {
    throw notFound();
  }
  const [user] = await toAdminUsers(actor, [profile]);
  if (!user) {
    throw notFound();
  }
  return user;
}

export async function setRole(actor: Account, id: string, input: unknown): Promise<AdminUser> {
  const { role } = adminRoleChangeSchema.parse(input);
  await manageable(actor, id);
  await Profiles.model.updateOne({ _id: id }, { $set: { role } });
  // The role is part of the login token, so the account signs in again to pick it up.
  await accounts.saveSecurity(id, { sessionsValidFrom: new Date() });
  record(actor, `role:${role}`, id);
  return single(actor, id);
}

/** For someone who lost their authenticator and backup codes. */
export async function resetTwoFactor(actor: Account, id: string): Promise<AdminUser> {
  await manageable(actor, id);
  await clearTwoFactor(id);
  record(actor, "reset-two-factor", id);
  return single(actor, id);
}

export async function sendRecovery(actor: Account, id: string, input: unknown) {
  const { locale } = z.object({ locale: z.enum(["en", "de"]).default("en") }).parse(input);
  const profile = await manageable(actor, id);
  if (!mailConfigured() || !profile.email.includes("@")) {
    throw new EllmaError(409, "mail_unavailable");
  }
  try {
    await sendRecoveryMail(profile, locale);
  } catch {
    throw new EllmaError(502, "mail_failed");
  }
  record(actor, "recovery-mail", id);
  return { ok: true as const };
}

/** Removes the account together with everything it owns. */
export async function deleteUser(actor: Account, id: string) {
  await manageable(actor, id);
  const owned = { ownerId: id };
  await Promise.all([
    GoalModel.model.deleteMany(owned),
    TaskModel.model.deleteMany(owned),
    FocusSessionModel.model.deleteMany(owned),
    AssistantMessageModel.model.deleteMany(owned),
    DailyNoteModel.model.deleteMany(owned),
    AccountSecurityModel.model.deleteMany(owned),
    ApiTokens.model.deleteMany({ uid: id }),
  ]);
  await Profiles.model.deleteOne({ _id: id });
  record(actor, "delete", id);
  return { id };
}
