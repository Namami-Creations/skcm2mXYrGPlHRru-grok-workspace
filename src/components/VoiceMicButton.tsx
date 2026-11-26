import { Mic, MicOff } from "lucide-react";
import { useRef, useState } from "react";
import type { Language } from "@/lib/types";

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function VoiceMicButton({
  lang,
  onTranscript,
  label,
}: {
  lang: Language;
  onTranscript: (text: string) => void;
  label?: string;
}) {
  const [listening, setListening] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  function toggleVoice() {
    if (listening && recRef.current) {
      recRef.current.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setUnsupported(true);
      setTimeout(() => setUnsupported(false), 2500);
      return;
    }
    const rec = new Ctor();
    rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript;
      if (text) onTranscript(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <button
      type="button"
      onClick={toggleVoice}
      title={
        unsupported
          ? "Voice recognition unavailable in this browser"
          : lang === "hi"
            ? "हिंदी या अंग्रेज़ी में बोलकर लिखें"
            : "Speak in Hindi or English (Voice Input)"
      }
      className={`flex items-center gap-1 rounded border px-2 py-1 font-mono text-[10px] transition-colors ${
        listening
          ? "border-crimson bg-crimson/15 text-crimson font-bold animate-pulse"
          : unsupported
            ? "border-line bg-bg text-muted"
            : "border-line bg-surface text-fg hover:border-primary"
      }`}
    >
      {listening ? <MicOff className="size-3" /> : <Mic className="size-3 text-primary" />}
      <span>{unsupported ? "No Mic" : listening ? "Listening..." : label ?? "Voice"}</span>
    </button>
  );
}
