import { getSettings } from "./settings";

/**
 * Action sounds are made in the browser with Web Audio; the focus sound plays pendulum
 * pieces that ship with the app. Nothing is loaded from elsewhere. Sound is decoration
 * only, so every failure is swallowed.
 */
export type SoundName = "complete" | "focusStart" | "focusEnd" | "reminder" | "notification";

type Note = { frequency: number; at: number; length: number; peak: number };

/** Soft sine notes, quiet enough for an office. */
const SOUNDS: Record<SoundName, Note[]> = {
  complete: [
    { frequency: 880, at: 0, length: 0.45, peak: 0.07 },
    { frequency: 1318.5, at: 0.09, length: 0.4, peak: 0.07 },
  ],
  // A calm step up: settling in.
  focusStart: [
    { frequency: 392, at: 0, length: 0.7, peak: 0.06 },
    { frequency: 587.33, at: 0.16, length: 0.9, peak: 0.055 },
  ],
  // The same step back down: letting go.
  focusEnd: [
    { frequency: 587.33, at: 0, length: 0.6, peak: 0.055 },
    { frequency: 392, at: 0.16, length: 0.9, peak: 0.06 },
  ],
  // Ellma finished something for you: one warm, rounded note with a soft overtone.
  notification: [
    { frequency: 659.25, at: 0, length: 0.7, peak: 0.055 },
    { frequency: 987.77, at: 0.11, length: 0.6, peak: 0.03 },
  ],
  // Three slow bell notes, far apart from the action sounds so it is recognisable.
  reminder: [
    { frequency: 659.25, at: 0, length: 1.3, peak: 0.06 },
    { frequency: 783.99, at: 0.28, length: 1.3, peak: 0.055 },
    { frequency: 987.77, at: 0.56, length: 1.7, peak: 0.05 },
  ],
};

let context: AudioContext | null = null;
let unlockAttached = false;

function audio(): AudioContext | null {
  try {
    if (!context) {
      const AudioContextClass =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        return null;
      }
      context = new AudioContextClass();
    }
    if (!unlockAttached) {
      // Browsers keep audio suspended until the person has interacted with the page.
      unlockAttached = true;
      const unlock = () => {
        if (context?.state === "suspended") {
          void context.resume().catch(() => undefined);
        }
      };
      window.addEventListener("pointerdown", unlock, true);
      window.addEventListener("keydown", unlock, true);
    }
    if (context.state === "suspended") {
      void context.resume().catch(() => undefined);
    }
    return context;
  } catch {
    return null;
  }
}

/** Notifications and reminders follow their own switch; everything else is an action sound. */
const NOTIFYING: ReadonlySet<SoundName> = new Set(["notification", "reminder"]);
/** One interaction, one sound: a notification right after another sound stays quiet. */
const QUIET_AFTER_SOUND_MS = 2500;
let lastSoundAt = 0;

export function playSound(name: SoundName): void {
  const settings = getSettings();
  if (NOTIFYING.has(name) ? !settings.notificationSounds : !settings.sounds) {
    return;
  }
  const now = Date.now();
  if (name === "notification" && now - lastSoundAt < QUIET_AFTER_SOUND_MS) {
    return;
  }
  lastSoundAt = now;
  const output = audio();
  if (!output) {
    return;
  }
  try {
    const start = output.currentTime + 0.02;
    for (const note of SOUNDS[name]) {
      const from = start + note.at;
      const gain = output.createGain();
      gain.gain.setValueAtTime(0.0001, from);
      gain.gain.exponentialRampToValueAtTime(note.peak, from + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, from + note.length);
      gain.connect(output.destination);
      const oscillator = output.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = note.frequency;
      oscillator.connect(gain);
      oscillator.start(from);
      oscillator.stop(from + note.length + 0.05);
      oscillator.onended = () => gain.disconnect();
    }
  } catch {
    /* Decoration only. */
  }
}

/** The chime for finished steps and reached milestones. */
export function playChime(): void {
  playSound("complete");
}

/**
 * The focus sound is a set of calm pendulum pieces with quiet stretches of their own. They
 * ship with the app in `public/sounds`. A session plays them one after another in a shuffled
 * order that suits the time of day, with a short pause between pieces.
 */
export const PENDULUM_TRACKS = [
  "pendulum",
  "bright",
  "melodic",
  "vintage",
  "warm",
  "night",
] as const;
export type PendulumTrack = (typeof PENDULUM_TRACKS)[number];

const TRACK_FILES: Record<PendulumTrack, string> = {
  pendulum: "pendulum.mp3",
  bright: "pendulum-bright.mp3",
  melodic: "pendulum-melodic.mp3",
  vintage: "pendulum-vintage.mp3",
  warm: "pendulum-warm.mp3",
  night: "pendulum-night.mp3",
};

/** Brighter pieces in the morning, softer ones in the evening and at night. */
export function tracksForHour(hour: number): PendulumTrack[] {
  if (hour >= 5 && hour < 11) {
    return ["bright", "pendulum", "melodic", "warm"];
  }
  if (hour >= 11 && hour < 18) {
    return ["pendulum", "melodic", "vintage", "bright", "warm"];
  }
  return ["night", "warm", "vintage"];
}

/** The pieces are levelled alike, and louder than the old recordings; this keeps them soft. */
const AMBIENCE_LEVEL = 0.45;
/** Background tabs run timers about once a minute, so playback is scheduled well ahead. */
const SCHEDULE_AHEAD_SECONDS = 150;

const recordings = new Map<string, Promise<AudioBuffer | null>>();

function recording(output: AudioContext, file: string): Promise<AudioBuffer | null> {
  let loading = recordings.get(file);
  if (!loading) {
    loading = fetch(`${import.meta.env.BASE_URL}sounds/${file}`)
      .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(response)))
      .then((bytes) => output.decodeAudioData(bytes))
      .catch(() => {
        recordings.delete(file);
        return null;
      });
    recordings.set(file, loading);
  }
  return loading;
}

type Ambience = { gain: GainNode; stop: () => void };
let ambience: Ambience | null = null;
let currentTrack: PendulumTrack | null = null;
const trackListeners = new Set<() => void>();

function setCurrentTrack(track: PendulumTrack | null): void {
  currentTrack = track;
  trackListeners.forEach((listener) => listener());
}

/** The piece that is playing (or about to), for the caption in focus mode. */
export function playingTrack(): PendulumTrack | null {
  return currentTrack;
}

export function onTrackChange(listener: () => void): () => void {
  trackListeners.add(listener);
  return () => trackListeners.delete(listener);
}

const between = (low: number, high: number) => low + Math.random() * (high - low);

function shuffled<T>(list: readonly T[]): T[] {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other] as T, copy[index] as T];
  }
  return copy;
}

export function startAmbience(): void {
  if (ambience) {
    return;
  }
  const output = audio();
  if (!output) {
    return;
  }
  try {
    const gain = output.createGain();
    gain.gain.setValueAtTime(0.0001, output.currentTime);
    gain.gain.exponentialRampToValueAtTime(AMBIENCE_LEVEL, output.currentTime + 2);
    gain.connect(output.destination);
    const sources = new Set<AudioBufferSourceNode>();
    const timers = new Set<number>();
    let stopped = false;
    let queue: PendulumTrack[] = [];
    let previous: PendulumTrack | null = null;

    const nextTrack = (at: Date): PendulumTrack => {
      if (queue.length === 0) {
        queue = shuffled(tracksForHour(at.getHours()));
        // Never the same piece twice in a row across a reshuffle.
        if (queue[0] === previous && queue.length > 1) {
          queue.push(queue.shift() as PendulumTrack);
        }
      }
      previous = queue.shift() ?? "pendulum";
      return previous;
    };

    const play = (buffer: AudioBuffer, at: number, track: PendulumTrack) => {
      const source = output.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.start(at);
      sources.add(source);
      const delay = Math.max(0, (at - output.currentTime) * 1000);
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        setCurrentTrack(track);
      }, delay);
      timers.add(timer);
      source.onended = () => {
        sources.delete(source);
        source.disconnect();
      };
    };

    let scheduledUntil = output.currentTime + 0.4;
    let busy = false;
    const fill = async () => {
      if (busy) {
        return;
      }
      busy = true;
      try {
        while (!stopped && scheduledUntil < output.currentTime + SCHEDULE_AHEAD_SECONDS) {
          const from = Math.max(scheduledUntil, output.currentTime + 0.3);
          const track = nextTrack(new Date(Date.now() + (from - output.currentTime) * 1000));
          const buffer = await recording(output, TRACK_FILES[track]);
          if (stopped) {
            return;
          }
          if (!buffer) {
            // Offline or blocked: stay silent and try again later.
            scheduledUntil = output.currentTime + 60;
            return;
          }
          const start = Math.max(from, output.currentTime + 0.1);
          play(buffer, start, track);
          scheduledUntil = start + buffer.duration + between(6, 14);
        }
      } finally {
        busy = false;
      }
    };
    void fill();
    const timer = window.setInterval(() => void fill(), 15_000);

    ambience = {
      gain,
      stop: () => {
        stopped = true;
        window.clearInterval(timer);
        timers.forEach((pending) => window.clearTimeout(pending));
        timers.clear();
        setCurrentTrack(null);
        sources.forEach((source) => {
          source.onended = null;
          try {
            source.stop();
          } catch {
            /* Already over. */
          }
          source.disconnect();
        });
        sources.clear();
        gain.disconnect();
      },
    };
  } catch {
    ambience = null;
  }
}

export function stopAmbience(): void {
  const running = ambience;
  if (!running || !context) {
    return;
  }
  ambience = null;
  try {
    const now = context.currentTime;
    running.gain.gain.cancelScheduledValues(now);
    running.gain.gain.setValueAtTime(Math.max(running.gain.gain.value, 0.0001), now);
    running.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    window.setTimeout(() => {
      try {
        running.stop();
      } catch {
        /* Already stopped. */
      }
    }, 900);
  } catch {
    /* Decoration only. */
  }
}
