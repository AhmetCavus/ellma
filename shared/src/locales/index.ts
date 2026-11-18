import { de } from "./de.js";
import { en, type Copy } from "./en.js";

export const LOCALES = { en, de } as const;
export type Locale = keyof typeof LOCALES;
export type { Copy };

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "de";
}

export function preferredLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0];
    if (isLocale(base)) {
      return base;
    }
  }
  return "en";
}
