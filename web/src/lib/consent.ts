import { readStored, writeStored } from "./storage";

const CHOICE_KEY = "ellma-storage";
export const CACHE_PREFIX = "ellma-cache-";

/**
 * Ellma sets no cookies. Sign-in, language and theme are necessary browser storage; the
 * local copy of goals for an instant start is a comfort the person can switch off.
 */
export function comfortStorageAllowed(): boolean {
  return readStored(CHOICE_KEY) !== "necessary";
}

export function setComfortStorage(allowed: boolean): void {
  writeStored(CHOICE_KEY, allowed ? "all" : "necessary");
  if (allowed) {
    return;
  }
  try {
    const cached = Object.keys(localStorage).filter((key) => key.startsWith(CACHE_PREFIX));
    cached.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* Storage is unavailable, so nothing is cached either. */
  }
}
