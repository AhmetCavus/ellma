import { createRequire } from "node:module";
import path from "node:path";
import type { Request, RequestHandler, Response } from "express";
import { retrieveProfileFromToken } from "yappio";
import { z } from "zod";

const require = createRequire(import.meta.url);
// Yappio 1.3.1 does not export its verifier; isolate the pinned platform adapter here.
const tokenModule: { default: { verify: (token: string) => unknown } } = require(
  path.join(path.dirname(require.resolve("yappio")), "src/core/services/token.service.js"),
);

// Only full login tokens qualify. OTP-stage tokens ({ uid, otp }) and device API tokens are rejected.
const sessionClaimsSchema = z.object({
  apiMode: z.literal(true),
  _id: z.string().min(1),
  role: z.enum(["user", "admin", "root"]),
  otp: z.undefined(),
  uid: z.undefined(),
});

export type Account = { id: string; role: "user" | "admin" | "root"; name: string };

function bearer(request: Request): string {
  return request.headers.authorization?.replace(/^Bearer\s+/i, "").trim() ?? "";
}

async function resolveAccount(request: Request): Promise<Account> {
  const claims = sessionClaimsSchema.parse(tokenModule.default.verify(bearer(request)));
  const profile = await retrieveProfileFromToken(request);
  if (!profile || String(profile._id) !== claims._id) {
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
