import type { Request } from "express";
import { EllmaError } from "./errors.js";

type Bucket = { count: number; resetAt: number };

/**
 * Fixed-window attempt counter kept in memory. Ellma runs as one API process, so this is
 * enough to slow down password, code and reset-token guessing.
 */
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Counts one attempt and reports whether it is still within the limit. */
  allow(key: string, now = Date.now()): boolean {
    if (this.buckets.size > 20_000) {
      for (const [stored, bucket] of this.buckets) {
        if (bucket.resetAt <= now) {
          this.buckets.delete(stored);
        }
      }
    }
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    bucket.count += 1;
    return bucket.count <= this.limit;
  }

  attempt(key: string): void {
    if (!this.allow(key)) {
      throw new EllmaError(429, "too_many_attempts");
    }
  }

  clear(key: string): void {
    this.buckets.delete(key);
  }
}

/** The caller's address as reported by Cloudflare or the proxy in front of the API. */
export function clientAddress(request: Request): string {
  const forwarded = request.headers["cf-connecting-ip"] ?? request.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  return first || request.socket.remoteAddress || "unknown";
}
