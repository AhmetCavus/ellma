import type { Request, RequestHandler, Response } from "express";
import { retrieveProfileFromToken } from "yappio";
import { z } from "zod";
import { findSecurity } from "../account/account.repository.js";
import { tokens } from "./yappio.js";

// Only full login tokens qualify. OTP-stage tokens ({ uid, otp }) and device API tokens are rejected.
const sessionClaimsSchema = z.object({
  apiMode: z.literal(true),
  _id: z.string().min(1),
  role: z.enum(["user", "admin", "root"]),
  otp: z.undefined(),
  uid: z.undefined(),
  iat: z.number(),
  /** Set by Ellma's own login once the second factor was checked. */
  mfa: z.boolean().optional(),
});

export type Account = { id: string; role: "user" | "admin" | "root"; name: string };

function bearer(request: Request): string {
  return request.headers.authorization?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

async function resolveAccount(request: Request): Promise<Account> {
  const claims = sessionClaimsSchema.parse(tokens.verify(bearer(request)));
  const [profile, security] = await Promise.all([
    retrieveProfileFromToken(request),
    findSecurity(claims._id),
  ]);
  if (!profile || String(profile._id) !== claims._id) {
    throw new Error("access_denied");
  }
  // Accounts with a second factor only accept tokens from Ellma's login, which checks it.
  if (security?.totpEnabledAt && claims.mfa !== true) {
    throw new Error("access_denied");
  }
  // A password change or reset signs out every token issued before it.
  if (security?.sessionsValidFrom && claims.iat * 1000 < security.sessionsValidFrom.getTime()) {
    throw new Error("access_denied");
  }
  const role = z.enum(["user", "admin", "root"]).parse(profile.role);
  return { id: claims._id, role, name: String(profile.username ?? "").slice(0, 60) };
}

export function requireAccount(adminOnly = false): RequestHandler {
  return (request, response, next) => {
    void resolveAccount(request)
      .then((account) => {
        if (adminOnly && account.role === "user") {
          throw new Error("access_denied");
        }
        response.locals.account = account;
        next();
      })
      .catch(() => {
        response.status(401).json({ success: false, error: "access_denied" });
      });
  };
}

export function ownerOf(response: Response): string {
  const account = response.locals.account as Account | undefined;
  if (!account) {
    throw new Error("Missing account; mount requireAccount first.");
  }
  return account.id;
}

export function accountOf(response: Response): Account {
  const account = response.locals.account as Account | undefined;
  if (!account) {
    throw new Error("Missing account; mount requireAccount first.");
  }
  return account;
}
