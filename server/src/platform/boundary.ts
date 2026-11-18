import type { Express, RequestHandler } from "express";
import type { YappioServer } from "yappio";
import { requireAccount } from "./access.js";
import { clientAddress, RateLimiter } from "./rateLimit.js";

// Yappio's generic management API would expose every user's records; only admins may use it.
const PLATFORM_MANAGEMENT =
  /^\/(collection|collections|profile|token|channel|media|appsettings)(\/|$)/;
// Signing in calls this for any role, so it stays public; Yappio verifies the token itself.
const SESSION_INITIALIZATION = "/profile/initialize";
// Yappio's own recovery, mail-code and authenticator routes skip Ellma's checks (reset links
// to the wrong host, codes without attempt limits, passwordless sign-in). Ellma replaces them
// under /api/ellma/account, so they are closed here.
const REPLACED_BY_ELLMA = /^\/(password|otp|totp|email)(\/|$)|^\/authenticate\/totp\/?$/;
// Account security records hold secrets; not even admins read them through the generic API.
const SEALED_COLLECTIONS = /^\/collection\/ellmaaccountsecurity(\/|$)/i;
const PLATFORM_LOGIN = /^\/authenticate\/?$/;
const platformLogins = new RateLimiter(40, 15 * 60 * 1000);

export function installBoundaryFirst(server: YappioServer, allowedOrigins: string[]): void {
  const boundary: RequestHandler = (request, response, next) => {
    response.removeHeader("Access-Control-Allow-Origin");
    response.setHeader("Cache-Control", "no-store");
    response.vary("Origin");
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      response.status(403).json({ success: false, error: "origin_denied" });
      return;
    }
    if (origin) {
      response.setHeader("Access-Control-Allow-Origin", origin);
    }
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (request.method === "OPTIONS") {
      response.sendStatus(204);
      return;
    }
    // Yappio's middleware runs later. Restore our exact-origin policy before headers are sent.
    const originalWriteHead = response.writeHead;
    response.writeHead = function (...args: Parameters<typeof originalWriteHead>) {
      response.removeHeader("Access-Control-Allow-Origin");
      if (origin) {
        response.setHeader("Access-Control-Allow-Origin", origin);
      }
      return originalWriteHead.apply(response, args);
    } as typeof originalWriteHead;

    if (REPLACED_BY_ELLMA.test(request.path) || SEALED_COLLECTIONS.test(request.path)) {
      response.status(404).json({ success: false, error: "not_found" });
      return;
    }
    if (
      request.method === "POST" &&
      PLATFORM_LOGIN.test(request.path) &&
      !platformLogins.allow(clientAddress(request))
    ) {
      response.status(429).json({ success: false, error: "too_many_attempts" });
      return;
    }
    if (request.path === SESSION_INITIALIZATION && request.method === "POST") {
      next();
      return;
    }
    if (PLATFORM_MANAGEMENT.test(request.path)) {
      requireAccount(true)(request, response, next);
      return;
    }
    next();
  };
  const app = server as Express;
  app.use(boundary);
  // Prepend after Express initialization because Yappio installs wildcard CORS in its constructor.
  const stack = app._router.stack as unknown[];
  stack.splice(2, 0, ...stack.splice(-1));
}
