/** localStorage can be unavailable (private mode, blocked site data); never let that break the app. */
export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    /* Storage is a convenience only. */
  }
}

/** The goal a visitor typed on the landing page; the guided setup picks it up after sign-up. */
export const SEED_GOAL_KEY = "ellma-seed-goal";
