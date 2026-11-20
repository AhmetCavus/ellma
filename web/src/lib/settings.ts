import { useSyncExternalStore } from "react";
import { readStored, writeStored } from "./storage";

/** How Ellma behaves by default on this device. Chosen by the person, kept in the browser. */
export type Settings = {
  /** Short sounds for actions such as starting focus or finishing a step. */
  sounds: boolean;
  /** The quiet soundscape that plays while a focus session runs. */
  ambience: boolean;
  /** A kind reminder when the tab has been left alone for a while. */
  reminders: boolean;
  /** The soft sound when Ellma finished something for you or has news (reminders too). */
  notificationSounds: boolean;
};

const KEY = "ellma-settings";
const DEFAULTS: Settings = {
  sounds: true,
  ambience: true,
  reminders: true,
  notificationSounds: true,
};
const listeners = new Set<() => void>();

function load(): Settings {
  try {
    const stored: unknown = JSON.parse(readStored(KEY) ?? "{}");
    const record = (stored && typeof stored === "object" ? stored : {}) as Record<string, unknown>;
    const flag = (name: keyof Settings) =>
      typeof record[name] === "boolean" ? (record[name] as boolean) : DEFAULTS[name];
    return {
      sounds: flag("sounds"),
      ambience: flag("ambience"),
      reminders: flag("reminders"),
      notificationSounds: flag("notificationSounds"),
    };
  } catch {
    return DEFAULTS;
  }
}

let current = load();

export function getSettings(): Settings {
  return current;
}

export function updateSettings(change: Partial<Settings>): void {
  current = { ...current, ...change };
  writeStored(KEY, JSON.stringify(current));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings);
}
