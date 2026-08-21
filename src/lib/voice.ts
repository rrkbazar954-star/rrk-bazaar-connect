import { SPEECH_GREETING } from "./i18n";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported() {
  return getRecognitionCtor() !== null;
}

/** Speaks the RRK Bazaar welcome line in a warm Indian Hindi voice. */
export function speakGreeting(text = SPEECH_GREETING) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    const voices = synth.getVoices();
    const preferred =
      voices.find((v) => v.lang === "hi-IN" && /female|woman|kalpana|swara/i.test(v.name)) ??
      voices.find((v) => v.lang === "hi-IN") ??
      voices.find((v) => v.lang?.startsWith("en-IN"));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    synth.speak(utterance);
    // Safety net: never block the mic if TTS stalls.
    window.setTimeout(() => resolve(), 6000);
  });
}

export function listenOnce(locale: string): Promise<string> {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return Promise.reject(new Error("unsupported"));
  return new Promise((resolve, reject) => {
    const recognition = new Ctor();
    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = false;
    let settled = false;
    recognition.onresult = (event) => {
      settled = true;
      resolve(event.results[0]?.[0]?.transcript ?? "");
    };
    recognition.onerror = (event) => {
      settled = true;
      reject(new Error(event.error ?? "speech_error"));
    };
    recognition.onend = () => {
      if (!settled) reject(new Error("no_speech"));
    };
    recognition.start();
  });
}
