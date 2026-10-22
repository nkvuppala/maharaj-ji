import { useRef, useState } from "react";
import { Copy, Share2, Volume2 } from "lucide-react";
import { DiyaIcon, HandsIcon, LotusIcon, MarigoldIcon, OmIcon, TempleIcon } from "./icons";
import { SUGGESTIONS, type Message } from "@/lib/maharaji";

interface ChatStreamProps {
  messages: Message[];
  typing: boolean;
  onSuggestion: (text: string) => void;
}

const SUGGESTION_ICONS: Record<string, React.ReactNode> = {
  lotus: <LotusIcon className="h-5 w-5" />,
  hands: <HandsIcon className="h-5 w-5" />,
  om: <OmIcon className="h-5 w-5" />,
  temple: <TempleIcon className="h-5 w-5" />,
};

function WaveBars() {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="wave-bar block w-[3px] rounded-full bg-current"
          style={{ height: "100%", animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

function renderFormattedText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={lineIdx} className="block">
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={i} className="font-semibold text-foreground-deep">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </span>
    );
  });
}

export default function ChatStream({ messages, typing, onSuggestion }: ChatStreamProps) {
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const currentUtterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stopAudio = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
    setIsPaused(false);
    currentUtterRef.current = null;
  };

  const pauseAudio = () => {
    if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeAudio = () => {
    if ("speechSynthesis" in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const playSpeech = (msg: Message) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    // Clean text for speech
    const clean = msg.text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/[🙏🕉️🌸✨🔔•]/g, "")
      .trim();

    const utter = new SpeechSynthesisUtterance(clean);

    // Multilingual speech detection (Hindi / Dev / Tamil / Telugu / Indian English)
    if (/[\u0900-\u097F]/.test(msg.text)) {
      utter.lang = "hi-IN";
    } else if (/[\u0C00-\u0C7F]/.test(msg.text)) {
      utter.lang = "te-IN";
    } else if (/[\u0B80-\u0BFF]/.test(msg.text)) {
      utter.lang = "ta-IN";
    } else {
      utter.lang = "en-IN";
    }

    utter.rate = 0.88;
    utter.pitch = 0.96;

    utter.onend = () => {
      setSpeakingId(null);
      setIsPaused(false);
      currentUtterRef.current = null;
    };
    utter.onerror = () => {
      setSpeakingId(null);
      setIsPaused(false);
      currentUtterRef.current = null;
    };

    currentUtterRef.current = utter;
    setSpeakingId(msg.id);
    setIsPaused(false);
    window.speechSynthesis.speak(utter);
  };

  const restartAudio = (msg: Message) => {
    stopAudio();
    setTimeout(() => playSpeech(msg), 60);
  };

  const copyQuote = async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.text);
    } catch {
      /* clipboard blocked */
    }
  };

  const shareBlessing = async (msg: Message) => {
    const shareData = {
      title: "A blessing from Maharaj-ji 🙏",
      text: `${msg.text}\n- Neem Karoli Baba, Sub Ek`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      /* user cancelled or unsupported */
    }
    try {
      await navigator.clipboard.writeText(`${msg.text}\n- In the spirit of Neem Karoli Baba, Sub Ek 🙏`);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-36 pt-4 sm:px-6 sm:pt-6 sm:pb-40">
      {messages.length === 0 && !typing && (
        <section className="rise-in flex flex-col items-center py-3 text-center sm:py-6">
          {/* Diya */}
          <div className="halo mb-3 flex h-16 w-16 items-center justify-center rounded-full text-primary sm:h-20 sm:w-20">
            <DiyaIcon className="h-10 w-10 sm:h-14 sm:w-14" />
          </div>

          <h2 className="max-w-xl font-display text-xl font-semibold leading-relaxed text-foreground-deep sm:text-3xl">
            Radhe Radhe, my child.
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground sm:text-base">
            What weighs on your heart today?
          </p>

          {/* Parchment suggestion scrolls - perfectly aligned grid */}
          <div className="mt-4 grid w-full grid-cols-1 gap-2.5 sm:mt-6 sm:grid-cols-2 items-stretch">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.text}
                onClick={() => onSuggestion(s.text)}
                className="parchment-scroll group flex h-full items-center gap-3 rounded-2xl p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-4"
              >
                <span className="shrink-0 text-terracotta transition-colors group-hover:text-primary">
                  {SUGGESTION_ICONS[s.icon] ?? <LotusIcon className="h-5 w-5" />}
                </span>
                <span className="text-sm font-medium leading-snug text-foreground sm:text-[0.95rem]">{s.text}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Conversation stream */}
      <div className="flex flex-col gap-5" aria-live="polite">
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="rise-in flex justify-end">
              <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-gradient-to-br from-saffron to-terracotta px-5 py-3.5 text-[0.95rem] leading-relaxed text-primary-foreground shadow-lg shadow-saffron/25 sm:max-w-[75%]">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="rise-in flex items-start gap-3">
              <span className="halo mt-1 hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-marigold/50 bg-secondary text-marigold sm:flex">
                <MarigoldIcon className="h-5 w-5" />
              </span>
              <div className="max-w-[88%] sm:max-w-[80%]">
                <div className="glass-card rounded-3xl rounded-tl-lg border-marigold/50 px-5 py-4">
                  <div className="text-[0.98rem] leading-[1.85] text-foreground">
                    {renderFormattedText(m.text)}
                  </div>
                </div>

                {/* Voice & action controls */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-1">
                  {speakingId === m.id ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-secondary/80 p-1 border border-marigold/40">
                      {isPaused ? (
                        <button
                          onClick={resumeAudio}
                          className="flex items-center gap-1 rounded-full bg-saffron px-3 py-1 text-xs font-semibold text-primary-foreground shadow transition-transform hover:scale-105"
                          title="Resume speaking"
                        >
                          ▶ Resume
                        </button>
                      ) : (
                        <button
                          onClick={pauseAudio}
                          className="flex items-center gap-1 rounded-full bg-amber-glow px-3 py-1 text-xs font-semibold text-walnut transition-colors hover:bg-secondary"
                          title="Pause voice"
                        >
                          ⏸ Pause
                        </button>
                      )}
                      <button
                        onClick={stopAudio}
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-walnut transition-colors hover:text-destructive"
                        title="Stop audio"
                      >
                        ⏹ Stop
                      </button>
                      <button
                        onClick={() => restartAudio(m)}
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-walnut transition-colors hover:text-primary"
                        title="Restart from beginning"
                      >
                        🔄 Restart
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => playSpeech(m)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-walnut/80 transition-colors hover:bg-secondary hover:text-primary"
                    >
                      <Volume2 className="h-3.5 w-3.5" /> Listen
                    </button>
                  )}

                  <button
                    onClick={() => copyQuote(m)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-walnut/80 transition-colors hover:bg-secondary hover:text-primary"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy Quote
                  </button>
                  <button
                    onClick={() => shareBlessing(m)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-walnut/80 transition-colors hover:bg-secondary hover:text-primary"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share Blessing
                  </button>
                </div>
              </div>
            </div>
          ),
        )}

        {typing && (
          <div className="flex items-center gap-3">
            <span className="halo flex h-9 w-9 items-center justify-center rounded-full border border-marigold/50 bg-secondary text-marigold">
              <MarigoldIcon className="h-5 w-5" />
            </span>
            <div className="glass-card flex items-center gap-1.5 rounded-3xl rounded-tl-lg px-5 py-4" aria-label="Maharaj-ji is composing a blessing">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="typing-dot block h-2 w-2 rounded-full bg-marigold"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Feather({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M19 5c-6.5 0-11 4.5-11 11l-.5 3M19 5c.8 6-2.5 11-9 11.5M19 5l-9.5 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
