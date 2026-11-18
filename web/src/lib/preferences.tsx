import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isLocale, LOCALES, preferredLocale, type Copy, type Locale } from "@ellma/shared";
import { readStored, writeStored } from "./storage";

export type ThemeChoice = "system" | "light" | "dark";

type Preferences = {
  locale: Locale;
  copy: Copy;
  theme: ThemeChoice;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemeChoice) => void;
  toggleTheme: () => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

function initialLocale(): Locale {
  const stored = readStored("ellma-locale");
  return isLocale(stored) ? stored : preferredLocale(navigator.languages ?? [navigator.language]);
}

function initialTheme(): ThemeChoice {
  const stored = readStored("ellma-theme");
  return stored === "light" || stored === "dark" ? stored : "system";
}

function prefersDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [theme, setThemeState] = useState<ThemeChoice>(initialTheme);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = theme;
    }
  }, [theme]);

  const value = useMemo<Preferences>(() => {
    const setLocale = (next: Locale) => {
      writeStored("ellma-locale", next);
      setLocaleState(next);
    };
    const setTheme = (next: ThemeChoice) => {
      writeStored("ellma-theme", next === "system" ? null : next);
      setThemeState(next);
    };
    return {
      locale,
      copy: LOCALES[locale],
      theme,
      setLocale,
      setTheme,
      toggleTheme: () => {
        const dark = theme === "dark" || (theme === "system" && prefersDark());
        setTheme(dark ? "light" : "dark");
      },
    };
  }, [locale, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): Preferences {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error("usePreferences must be used inside PreferencesProvider.");
  }
  return value;
}
