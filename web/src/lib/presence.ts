import { useEffect, useRef } from "react";
import { isRemindable, reminderDueAt, type GuideStep } from "@ellma/shared";
import { useSettings } from "./settings";
import { playSound, startAmbience, stopAmbience } from "./sound";

/** Plays the focus soundscape for as long as a session runs and the person wants it. */
export function useFocusAmbience(focusing: boolean): void {
  const { ambience } = useSettings();
  useEffect(() => {
    if (!focusing || !ambience) {
      return;
    }
    startAmbience();
    return stopAmbience;
  }, [ambience, focusing]);
}

function isAway(): boolean {
  return document.hidden || !document.hasFocus();
}

/**
 * When the person has left the tab for a while and a step is waiting, Ellma plays a soft
 * sound and puts the step into the tab title. Coming back clears it and resets the count.
 */
export function useAwayReminder(step: GuideStep, title: string): void {
  const { reminders } = useSettings();
  const latest = useRef({ step, title });
  latest.current = { step, title };

  useEffect(() => {
    if (!reminders) {
      return;
    }
    let awaySince: number | null = isAway() ? Date.now() : null;
    let sent = 0;
    let originalTitle: string | null = null;

    const restoreTitle = () => {
      if (originalTitle !== null) {
        document.title = originalTitle;
        originalTitle = null;
      }
    };
    const onPresenceChange = () => {
      if (!isAway()) {
        awaySince = null;
        sent = 0;
        restoreTitle();
      } else if (awaySince === null) {
        awaySince = Date.now();
      }
    };
    // Background tabs throttle timers to about once a minute, which is precise enough here.
    const timer = window.setInterval(() => {
      if (awaySince === null) {
        return;
      }
      const due = reminderDueAt(awaySince, sent);
      if (due === null || Date.now() < due || !isRemindable(latest.current.step)) {
        return;
      }
      sent += 1;
      playSound("reminder");
      if (originalTitle === null) {
        originalTitle = document.title;
      }
      document.title = latest.current.title;
    }, 20_000);

    document.addEventListener("visibilitychange", onPresenceChange);
    window.addEventListener("blur", onPresenceChange);
    window.addEventListener("focus", onPresenceChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onPresenceChange);
      window.removeEventListener("blur", onPresenceChange);
      window.removeEventListener("focus", onPresenceChange);
      restoreTitle();
    };
  }, [reminders]);
}
