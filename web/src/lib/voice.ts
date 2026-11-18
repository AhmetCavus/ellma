import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export type VoiceInputError = "unsupported" | "denied" | "failed" | null;

/** Speech-to-text through the browser. Sends the final transcript once the person pauses. */
export function useVoiceInput(lang: string, onFinal: (transcript: string) => void) {
  const supported = recognitionConstructor() !== null;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<VoiceInputError>(null);
  const recognition = useRef<Recognition | null>(null);
  const finalHandler = useRef(onFinal);
  finalHandler.current = onFinal;

  const stop = useCallback(() => {
    recognition.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Constructor = recognitionConstructor();
    if (!Constructor) {
      setError("unsupported");
      return;
    }
    recognition.current?.abort();
    const instance = new Constructor();
    instance.lang = lang;
    instance.interimResults = true;
    instance.continuous = false;
    let transcript = "";
    instance.onresult = (event) => {
      let pending = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        if (!result) {
          continue;
        }
        if (result.isFinal) {
          transcript += result[0].transcript;
        } else {
          pending += result[0].transcript;
        }
      }
      setInterim(`${transcript}${pending}`);
    };
    instance.onerror = (event) => {
      setError(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "denied"
          : event.error === "no-speech" || event.error === "aborted"
            ? null
            : "failed",
      );
    };
    instance.onend = () => {
      setListening(false);
      setInterim("");
      recognition.current = null;
      const text = transcript.trim();
      if (text) {
        finalHandler.current(text);
      }
    };
    recognition.current = instance;
    setError(null);
    setListening(true);
    try {
      instance.start();
    } catch {
      setListening(false);
      setError("failed");
    }
  }, [lang]);

  useEffect(() => () => recognition.current?.abort(), []);

  return { supported, listening, interim, error, start, stop };
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const base = lang.split("-")[0] ?? lang;
  return (
    voices.find(
      (voice) => voice.lang === lang && /natural|neural|premium|enhanced/i.test(voice.name),
    ) ??
    voices.find((voice) => voice.lang === lang) ??
    voices.find((voice) => voice.lang.startsWith(base)) ??
    null
  );
}

/** Text-to-speech queue; sentences are spoken as soon as they arrive from the stream. */
export function useSpeaker(lang: string) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const pending = useRef(0);
  const idleCallbacks = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (supported) {
      // Some browsers load voices lazily; asking once warms the list.
      window.speechSynthesis.getVoices();
    }
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  const settle = useCallback(() => {
    pending.current = Math.max(0, pending.current - 1);
    if (pending.current === 0) {
      setSpeaking(false);
      const callbacks = idleCallbacks.current;
      idleCallbacks.current = [];
      callbacks.forEach((callback) => callback());
    }
  }, []);

  const say = useCallback(
    (text: string) => {
      const clean = text.replace(/[*_#`>]/g, "").trim();
      if (!supported || !clean) {
        return;
      }
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = lang;
      utterance.rate = 1.03;
      const voice = pickVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.onend = settle;
      utterance.onerror = settle;
      pending.current += 1;
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [lang, settle, supported],
  );

  const cancel = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
    }
    pending.current = 0;
    idleCallbacks.current = [];
    setSpeaking(false);
  }, [supported]);

  /** Runs once the queue has finished speaking (immediately when silent). */
  const whenIdle = useCallback((callback: () => void) => {
    if (pending.current === 0) {
      callback();
    } else {
      idleCallbacks.current.push(callback);
    }
  }, []);

  return { supported, speaking, say, cancel, whenIdle };
}

/** A soft two-note chime for completed tasks; quiet enough for an office. */
export function playChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    const context = new AudioContextClass();
    const gain = context.createGain();
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);
    [880, 1318.5].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.09);
      oscillator.stop(context.currentTime + 0.45);
    });
    window.setTimeout(() => void context.close(), 800);
  } catch {
    /* Sound is decoration only. */
  }
}
