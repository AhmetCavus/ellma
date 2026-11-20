import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  formatDuration,
  localIntent,
  reminderTaskId,
  startOfWeek,
  takeSentences,
  toApiError,
  todayKey,
  type AssistantAction,
  type AssistantMessage,
  type AssistantView,
  type Guide,
  type LocalIntent,
} from "@ellma/shared";
import type { EllmaPhase } from "../components/EllmaOrb";
import { GoalGuide } from "../components/GoalGuide";
import { useGuide } from "./guide";
import { celebrate } from "./motion";
import { usePreferences } from "./preferences";
import { navigate, useRoute } from "./router";
import type { Session } from "./session";
import { isPlainShortcut, SHORTCUTS_EVENT } from "./shortcuts";
import { readStored, writeStored } from "./storage";
import { useStore } from "./store";
import { useAwayReminder, useFocusAmbience } from "./presence";
import { playSound } from "./sound";
import { useSpeaker, useVoiceInput } from "./voice";

/** The latest thing said to Ellma and her answer. Older turns live in the history. */
export type Exchange = {
  question: string;
  reply: string;
  actions: AssistantAction[];
  pending: boolean;
};

type Ellma = {
  phase: EllmaPhase;
  exchange: Exchange | null;
  messages: AssistantMessage[];
  problem: string;
  interim: string;
  voiceSupported: boolean;
  speakerSupported: boolean;
  speakReplies: boolean;
  handsFree: boolean;
  writing: boolean;
  /** Goal that the inline "add a step" field belongs to. */
  composeFor: string | null;
  guide: Guide & { today: string };
  cheer: string;
  /** Counts finished interactions, so the orb can play its short "done" animation. */
  success: number;
  intro: number | null;
  view: AssistantView;
  send: (text: string, viaVoice?: boolean) => Promise<void>;
  talk: () => void;
  stop: () => void;
  dismiss: () => void;
  brief: () => void;
  clearHistory: () => Promise<void>;
  toggleSpeak: () => void;
  setHandsFree: (on: boolean) => void;
  setWriting: (on: boolean) => void;
  setComposeFor: (goalId: string | null) => void;
  advanceIntro: () => void;
  skipIntro: () => void;
  startGoalGuide: () => void;
};

const EllmaContext = createContext<Ellma | null>(null);

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const INTERACTIVE =
  "button, a, input, textarea, select, summary, [role='button'], [contenteditable='true']";

/**
 * Ellma lives above every signed-in page: she listens (hold Space), answers, acts on the
 * user's goals and always knows the next best step. Pages talk to her through `useEllma()`.
 */
export function EllmaProvider({ session, children }: { session: Session; children: ReactNode }) {
  const { copy, locale, toggleTheme } = usePreferences();
  const store = useStore();
  const route = useRoute();
  const guide = useGuide();
  /**
   * Ellma finished something or has news: one soft sound, the apple's short hop and a text
   * that screen readers announce. `announce` is false when the dock already shows the text.
   */
  const acknowledge = useCallback(
    (message: string, announce = true) => {
      if (announce) {
        store.notify(message);
      }
      playSound("notification");
      setSuccess((count) => count + 1);
      celebrate(document.querySelector(".orb"));
    },
    [store],
  );
  const reminderTask = store.tasks.find((task) => task.id === reminderTaskId(guide.step));
  useFocusAmbience(Boolean(store.active));
  useAwayReminder(guide.step, copy.reminder.tabTitle(reminderTask?.title ?? ""));
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [problem, setProblem] = useState("");
  const [speakReplies, setSpeakReplies] = useState(() => readStored("ellma-speak") === "on");
  const [handsFree, setHandsFree] = useState(false);
  const [writing, setWriting] = useState(false);
  const [composeFor, setComposeFor] = useState<string | null>(null);
  const [cheer, setCheer] = useState("");
  const [success, setSuccess] = useState(0);
  const [intro, setIntro] = useState<number | null>(() =>
    readStored("ellma-intro") === "done" ? null : 0,
  );
  const [goalGuide, setGoalGuide] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const pendingSpeech = useRef("");
  const spaceHeldSince = useRef(0);
  const sendRef = useRef<(text: string, viaVoice?: boolean) => Promise<void>>(async () => {});
  const speaker = useSpeaker(copy.speechLocale);
  const voice = useVoiceInput(
    copy.speechLocale,
    (transcript) => void sendRef.current(transcript, true),
  );

  const [section, id] = route.segments;
  const activeGoalId =
    store.active?.goalId ??
    store.tasks.find((task) => task.id === store.active?.taskId)?.goalId ??
    null;
  const view = useMemo<AssistantView>(() => {
    if (section === "goals" && id && OBJECT_ID.test(id)) {
      return { page: "goal", goalId: id };
    }
    if (section === "focus") {
      return { page: "focus", goalId: activeGoalId };
    }
    return { page: section === "today" || section === "progress" ? section : "goals" };
  }, [activeGoalId, id, section]);

  useEffect(() => {
    let cancelled = false;
    void session.api
      .assistantMessages()
      .then((history) => !cancelled && setMessages(history))
      .catch(() => undefined);
    return () => {
      cancelled = true;
      abort.current?.abort();
    };
  }, [session.api]);

  const say = useCallback(
    (text: string, aloud: boolean) => {
      if (aloud) {
        speaker.say(text);
      }
    },
    [speaker],
  );

  /** Commands Ellma can carry out instantly. Returns false when the model should answer. */
  const runIntent = useCallback(
    async (intent: LocalIntent): Promise<string | false> => {
      switch (intent.kind) {
        case "navigate":
          navigate(`/${intent.page}`);
          return copy.dock.intents[intent.page];
        case "new_goal":
          setGoalGuide(true);
          return copy.dock.intents.newGoal;
        case "theme":
          toggleTheme();
          return copy.dock.intents.theme;
        case "help":
          window.dispatchEvent(new Event(SHORTCUTS_EVENT));
          return copy.dock.intents.help;
        case "stop_focus":
        case "complete_focus": {
          if (!store.active) {
            return false;
          }
          const complete = intent.kind === "complete_focus" && Boolean(store.active.taskId);
          const result = await store.stopFocus(complete);
          if (!result) {
            return false;
          }
          if (route.segments[0] === "focus") {
            navigate("/today");
          }
          return result.completed
            ? copy.dock.intents.completed
            : copy.dock.intents.stopped(formatDuration(result.seconds));
        }
      }
    },
    [copy, route.segments, store, toggleTheme],
  );

  const send = useCallback(
    async (text: string, viaVoice = false) => {
      const message = text.trim();
      if (!message || abort.current) {
        return;
      }
      setProblem("");
      setWriting(false);
      setComposeFor(null);
      setCheer("");
      speaker.cancel();
      pendingSpeech.current = "";
      const speak = speakReplies || viaVoice;

      const intent = localIntent(message);
      if (intent) {
        const answer = await runIntent(intent);
        if (answer !== false) {
          setExchange({ question: message, reply: answer, actions: [], pending: false });
          say(answer, speak);
          return;
        }
      }

      setExchange({ question: message, reply: "", actions: [], pending: true });
      const controller = new AbortController();
      abort.current = controller;
      const actions: AssistantAction[] = [];
      try {
        await session.api.chat(
          {
            message,
            locale,
            today: todayKey(),
            utcOffsetMinutes: new Date().getTimezoneOffset(),
            voice: viaVoice,
            view,
          },
          (event) => {
            if (event.type === "token") {
              setExchange(
                (previous) => previous && { ...previous, reply: previous.reply + event.text },
              );
              if (speak) {
                const { sentences, rest } = takeSentences(pendingSpeech.current + event.text);
                pendingSpeech.current = rest;
                sentences.forEach(speaker.say);
              }
            } else if (event.type === "action") {
              actions.push(event.action);
              setExchange(
                (previous) =>
                  previous && { ...previous, actions: [...previous.actions, event.action] },
              );
            } else if (event.type === "done") {
              setMessages((previous) => [
                ...previous,
                {
                  id: `local-${Date.now()}`,
                  role: "user",
                  content: message,
                  actions: [],
                  createdAt: new Date().toISOString(),
                },
                event.message,
              ]);
              setExchange(
                (previous) => previous && { ...previous, reply: event.message.content.trim() },
              );
            } else {
              setProblem(event.code === "assistant_busy" ? copy.dock.busy : copy.dock.unavailable);
            }
          },
          controller.signal,
        );
        if (speak && pendingSpeech.current.trim()) {
          speaker.say(pendingSpeech.current);
        }
      } catch (failure) {
        const error = toApiError(failure);
        if (error.isUnauthorized) {
          session.signOut(copy.common.sessionExpired);
          return;
        }
        if (!controller.signal.aborted) {
          setProblem(
            error.code === "assistant_busy"
              ? copy.dock.busy
              : error.isNetwork
                ? copy.common.offline
                : copy.dock.unavailable,
          );
        }
      } finally {
        abort.current = null;
        pendingSpeech.current = "";
        setExchange((previous) =>
          previous && (previous.reply || previous.actions.length > 0)
            ? { ...previous, pending: false }
            : null,
        );
      }
      if (actions.length > 0) {
        await store.refresh();
        // A guide takes you there: follow what she just did.
        const focus = actions.find((action) => action.kind === "focus_started");
        const created = actions.find((action) => action.kind === "goal_created");
        if (focus) {
          navigate("/focus");
        } else if (created?.targetId) {
          navigate(`/goals/${created.targetId}`);
        }
        // One interaction, one confirmation, however many tools ran.
        const kinds = [...new Set(actions.map((action) => action.kind))];
        acknowledge(kinds.map((kind) => copy.dock.actions[kind]).join(" · "));
      }
      if (viaVoice && handsFree) {
        speaker.whenIdle(() => window.setTimeout(() => voice.start(), 250));
      }
    },
    [
      acknowledge,
      copy,
      handsFree,
      locale,
      runIntent,
      say,
      session,
      speakReplies,
      speaker,
      store,
      view,
      voice,
    ],
  );
  sendRef.current = send;

  const stop = useCallback(() => {
    abort.current?.abort();
    speaker.cancel();
    voice.stop();
  }, [speaker, voice]);

  const talk = useCallback(() => {
    speaker.cancel();
    if (voice.listening) {
      voice.stop();
    } else {
      setWriting(false);
      voice.start();
    }
  }, [speaker, voice]);

  const toggleSpeak = useCallback(() => {
    setSpeakReplies((previous) => {
      writeStored("ellma-speak", previous ? null : "on");
      if (previous) {
        speaker.cancel();
      }
      return !previous;
    });
  }, [speaker]);

  const brief = useCallback(() => {
    if (abort.current) {
      return;
    }
    setProblem("");
    setExchange({ question: copy.dock.brief, reply: "", actions: [], pending: true });
    void session.api
      .dailyNote({ locale, today: todayKey(), utcOffsetMinutes: new Date().getTimezoneOffset() })
      .then((note) => {
        setExchange({ question: copy.dock.brief, reply: note.text, actions: [], pending: false });
        say(note.text, speakReplies);
      })
      .catch(() => {
        setExchange(null);
        setProblem(copy.dock.unavailable);
      });
  }, [copy, locale, say, session.api, speakReplies]);

  const finishIntro = useCallback(() => {
    writeStored("ellma-intro", "done");
    setIntro(null);
  }, []);

  // Cheer when a step gets done, and when a goal's week turns ripe.
  const doneBefore = useRef<number | null>(null);
  useEffect(() => {
    const before = doneBefore.current;
    doneBefore.current = guide.doneToday;
    if (before !== null && guide.doneToday > before && store.status === "ready") {
      const line = copy.dock.cheers[guide.doneToday % copy.dock.cheers.length] ?? "";
      setCheer(`${line} ${copy.dock.cheerCount(guide.doneToday)}`.trim());
    }
  }, [copy, guide.doneToday, store.status]);

  const weekLoaded = store.sessionsByWeek[startOfWeek(guide.today)] !== undefined;
  const ratiosBefore = useRef<Map<string, number> | null>(null);
  useEffect(() => {
    if (!weekLoaded || store.status !== "ready") {
      return;
    }
    const before = ratiosBefore.current;
    ratiosBefore.current = new Map(guide.pulses.map((pulse) => [pulse.goal.id, pulse.ratio]));
    const ripened = guide.pulses.find(
      (pulse) =>
        pulse.targetSeconds > 0 && pulse.ratio >= 1 && (before?.get(pulse.goal.id) ?? 1) < 1,
    );
    // The first pass only records where things stand; loading data must not throw a party.
    if (before && before.size > 0 && ripened) {
      setCheer(copy.dock.ripe(ripened.goal.title));
      acknowledge(copy.dock.ripe(ripened.goal.title), false);
    }
  }, [acknowledge, copy, guide.pulses, store.status, weekLoaded]);

  useEffect(() => {
    if (!cheer) {
      return;
    }
    const timer = window.setTimeout(() => setCheer(""), 6000);
    return () => window.clearTimeout(timer);
  }, [cheer]);

  // A finished answer steps aside for the next piece of guidance, unless it asked something.
  useEffect(() => {
    if (!exchange || exchange.pending || speaker.speaking || voice.listening) {
      return;
    }
    if (exchange.reply.trim().endsWith("?")) {
      return;
    }
    const timer = window.setTimeout(
      () => setExchange(null),
      Math.min(40_000, 9000 + exchange.reply.length * 60),
    );
    return () => window.clearTimeout(timer);
  }, [exchange, speaker.speaking, voice.listening]);

  // Keys that reach Ellma from anywhere. Registered in the capture phase so Esc silences
  // her before a page reacts to it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        talk();
        return;
      }
      if (event.key === "Escape") {
        const active = abort.current || speaker.speaking || voice.listening;
        if (active || writing || composeFor || exchange) {
          event.preventDefault();
          event.stopPropagation();
          stop();
          setWriting(false);
          setComposeFor(null);
          if (!active) {
            setExchange(null);
          }
        }
        return;
      }
      if (!isPlainShortcut(event)) {
        return;
      }
      if (event.code === "Space") {
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest(INTERACTIVE)) {
          return;
        }
        // Space belongs to Ellma here; without this the page would scroll.
        event.preventDefault();
        if (!event.repeat && !voice.listening && !abort.current) {
          spaceHeldSince.current = Date.now();
          speaker.cancel();
          voice.start();
        }
        return;
      }
      if (event.key === "/") {
        event.preventDefault();
        setWriting(true);
      } else if (event.key.toLowerCase() === "v" && speaker.supported) {
        event.preventDefault();
        toggleSpeak();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space" || !spaceHeldSince.current) {
        return;
      }
      const held = Date.now() - spaceHeldSince.current;
      spaceHeldSince.current = 0;
      // A quick tap keeps listening until the user pauses; a real hold ends on release.
      if (held > 400) {
        voice.stop();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  });

  const voiceProblem =
    voice.error === "unsupported"
      ? copy.dock.voiceUnsupported
      : voice.error === "denied"
        ? copy.dock.micDenied
        : voice.error
          ? copy.common.error
          : "";
  const phase: EllmaPhase = voice.listening
    ? "listening"
    : exchange?.pending
      ? exchange.reply
        ? "answering"
        : "thinking"
      : speaker.speaking
        ? "speaking"
        : "idle";

  const value: Ellma = {
    phase,
    exchange,
    messages,
    problem: problem || voiceProblem,
    interim: voice.interim,
    voiceSupported: voice.supported,
    speakerSupported: speaker.supported,
    speakReplies,
    handsFree,
    writing,
    composeFor,
    guide,
    cheer,
    success,
    intro,
    view,
    send,
    talk,
    stop,
    dismiss: () => setExchange(null),
    brief,
    clearHistory: async () => {
      await session.api.clearAssistantMessages();
      setMessages([]);
      setExchange(null);
    },
    toggleSpeak,
    setHandsFree,
    setWriting: (on) => {
      setWriting(on);
      if (on) {
        setComposeFor(null);
      }
    },
    setComposeFor: (goalId) => {
      setComposeFor(goalId);
      if (goalId) {
        setWriting(false);
      }
    },
    advanceIntro: () => {
      if (intro !== null && intro < copy.intro.steps.length - 1) {
        setIntro(intro + 1);
      } else {
        finishIntro();
        if (guide.step.kind === "first_goal") {
          setGoalGuide(true);
        }
      }
    },
    skipIntro: finishIntro,
    startGoalGuide: () => setGoalGuide(true),
  };

  return (
    <EllmaContext.Provider value={value}>
      {children}
      {goalGuide && <GoalGuide onClose={() => setGoalGuide(false)} />}
    </EllmaContext.Provider>
  );
}

export function useEllma(): Ellma {
  const value = useContext(EllmaContext);
  if (!value) {
    throw new Error("useEllma must be used inside EllmaProvider.");
  }
  return value;
}
