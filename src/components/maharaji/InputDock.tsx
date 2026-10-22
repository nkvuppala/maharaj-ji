import { useEffect, useRef, useState } from "react";
import { Check, Mic, Send, X } from "lucide-react";
import { LANGUAGES, type Lang } from "@/lib/maharaji";
import { LotusIcon } from "./icons";

interface InputDockProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onSend: (text: string) => void;
  disabled: boolean;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
}

const SPEECH_LOCALES: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
};

export default function InputDock({ lang, onLangChange, onSend, disabled }: InputDockProps) {
  const [value, setValue] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const activeLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
    requestAnimationFrame(autoResize);
  };

  const toggleListening = () => {
    if (!voiceSupported) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = SPEECH_LOCALES[lang];
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      if (transcript) setValue((v) => (v ? `${v} ${transcript}` : transcript));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="glass-card flex items-end gap-2 rounded-4xl p-2.5 sm:gap-3 sm:p-3">
          {/* Language selector */}
          <div className="relative shrink-0">
            <button
              onClick={() => setLangOpen((o) => !o)}
              aria-expanded={langOpen}
              aria-label="Choose language"
              className="flex h-11 items-center gap-1.5 rounded-full border border-marigold/40 bg-secondary/80 px-3 text-sm font-semibold text-walnut transition-colors hover:bg-secondary"
            >
              <span>{activeLang.label}</span>
              <svg viewBox="0 0 12 8" className={`h-2 w-2.5 transition-transform ${langOpen ? "rotate-180" : ""}`} aria-hidden="true">
                <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            {langOpen && (
              <>
                <button className="fixed inset-0 z-10 cursor-default" aria-label="Close language picker" onClick={() => setLangOpen(false)} />
                <ul className="glass-card absolute bottom-full left-0 z-20 mb-2 w-44 overflow-hidden rounded-2xl p-1.5 shadow-xl">
                  {LANGUAGES.map((l) => (
                    <li key={l.code}>
                      <button
                        onClick={() => {
                          onLangChange(l.code);
                          setLangOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-sm font-medium transition-colors hover:bg-secondary ${
                          l.code === lang ? "text-primary font-semibold bg-secondary/60" : "text-foreground"
                        }`}
                      >
                        {l.label}
                        {l.code === lang && <Check className="h-3.5 w-3.5 text-primary" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Voice input */}
          <button
            onClick={toggleListening}
            aria-label={listening ? "Stop listening" : `Speak your question in ${activeLang.label}`}
            title={listening ? "Stop listening" : `Speak in ${activeLang.label} (Switch language on left for Hindi)`}
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300 sm:h-12 sm:w-12 ${
              listening
                ? "mic-ripple bg-gradient-to-br from-marigold to-saffron text-primary-foreground shadow-lg shadow-marigold/40"
                : voiceSupported
                  ? "bg-secondary text-terracotta hover:bg-amber-glow hover:text-primary"
                  : "hidden"
            }`}
          >
            {listening ? <X className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Text area */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              autoResize();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={activeLang.greeting}
            className="max-h-[140px] min-h-[44px] flex-1 resize-none self-center rounded-2xl bg-transparent px-2 py-2.5 text-[0.95rem] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70"
          />

          {/* Send */}
          <button
            onClick={submit}
            disabled={disabled || !value.trim()}
            aria-label="Send your question to Maharaj-ji"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saffron to-terracotta text-primary-foreground shadow-lg shadow-saffron/35 transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            <LotusIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-center text-[0.7rem] tracking-wide text-walnut/60 sm:text-xs">
          Speak or type freely in any language.
        </p>
      </div>
    </div>
  );
}
