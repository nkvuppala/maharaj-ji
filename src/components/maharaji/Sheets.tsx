import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpenText,
  Camera,
  Clapperboard,
  ExternalLink,
  Heart,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Bell,
  Music,
  Waves,
  Flame,
  X,
  Check,
} from "lucide-react";
import {
  AMBIENT_SOUND_OPTIONS,
  CHALISA_LYRICS,
  EMBEDDED_VIDEOS,
  PRASAD_QUOTES,
  PRASAD_STORIES,
  SACRED_RESOURCES,
  playTempleBell,
  type AmbientSoundId,
  type VideoMedia,
} from "@/lib/maharaji";
import { DiyaIcon, OmIcon } from "./icons";
import darshanAshram from "@/assets/darshan-ashram.jpg";
import darshanSatsang from "@/assets/darshan-satsang.jpg";
import darshanBlessing from "@/assets/darshan-blessing.jpg";

/* ---------- Shared overlay shell ---------- */

function Overlay({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-walnut/40 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div className={`glass-card rise-in relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-4xl sm:rounded-4xl ${wide ? "sm:max-w-3xl" : "sm:max-w-xl"}`}>
        {children}
      </div>
    </div>
  );
}

function SheetHeader({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-marigold/25 px-6 py-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-foreground-deep">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-walnut transition-colors hover:bg-amber-glow hover:text-primary"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ---------- Daily Prasad (Quote & Miracle Lila) ---------- */

export function PrasadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"quote" | "story">("quote");
  const [speaking, setSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  const dayIndex = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);

  const quote = PRASAD_QUOTES[dayIndex % PRASAD_QUOTES.length];
  const story = PRASAD_STORIES[dayIndex % PRASAD_STORIES.length];
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  useEffect(() => {
    if (!open && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setIsPaused(false);
    }
  }, [open]);

  const stopAudio = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setIsPaused(false);
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

  const readAloud = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const text = mode === "quote" ? quote : `${story.title}. ${story.story} Lesson: ${story.moral}`;
    const utter = new SpeechSynthesisUtterance(text);
    if (/[\u0900-\u097F]/.test(text)) {
      utter.lang = "hi-IN";
    } else {
      utter.lang = "en-IN";
    }
    utter.rate = 0.88;
    utter.pitch = 0.96;
    utter.onend = () => {
      setSpeaking(false);
      setIsPaused(false);
    };
    utter.onerror = () => {
      setSpeaking(false);
      setIsPaused(false);
    };
    setSpeaking(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utter);
  };

  const sharePrasad = async () => {
    const textToShare =
      mode === "quote"
        ? `🌸 Daily Prasad from Maharaj-ji:\n“${quote}”\n- Neem Karoli Baba, Sub Ek 🙏`
        : `✨ Miracle Story (Lila) of Maharaj-ji:\n“${story.title}”\n\n${story.story}\n\nLesson: “${story.moral}”\n- Sub Ek, Love Serve Remember 🙏`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Daily Prasad • Neem Karoli Baba",
          text: textToShare,
        });
        return;
      }
    } catch {
      /* fallback to clipboard */
    }

    try {
      await navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <Overlay open={open} onClose={onClose}>
      <SheetHeader title="Daily Prasad" subtitle={today} onClose={onClose} />

      {/* Mode Selector */}
      <div className="flex justify-center border-b border-marigold/20 bg-secondary/30 px-6 py-2.5">
        <div className="inline-flex rounded-full bg-secondary/80 p-1 border border-marigold/30">
          <button
            onClick={() => {
              stopAudio();
              setMode("quote");
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              mode === "quote"
                ? "bg-gradient-to-r from-saffron to-terracotta text-primary-foreground shadow"
                : "text-walnut hover:text-primary"
            }`}
          >
            🌸 Daily Teaching
          </button>
          <button
            onClick={() => {
              stopAudio();
              setMode("story");
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              mode === "story"
                ? "bg-gradient-to-r from-saffron to-terracotta text-primary-foreground shadow"
                : "text-walnut hover:text-primary"
            }`}
          >
            ✨ Miracle Story (Lila)
          </button>
        </div>
      </div>

      <div className="overflow-y-auto px-6 py-6">
        {mode === "quote" ? (
          <div>
            <div className="halo mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-primary">
              <DiyaIcon className="h-10 w-10" />
            </div>
            <blockquote className="parchment-scroll rounded-3xl px-6 py-6 text-center shadow-sm">
              <OmIcon className="mx-auto mb-3 h-5 w-5 text-marigold" />
              <p className="font-display text-lg leading-relaxed text-foreground-deep sm:text-xl">“{quote}”</p>
              <footer className="mt-4 text-xs font-medium tracking-[0.18em] text-walnut/70 uppercase">
                - Neem Karoli Baba
              </footer>
            </blockquote>
          </div>
        ) : (
          <div className="parchment-scroll rounded-3xl p-6">
            <div className="flex items-center justify-between border-b border-marigold/20 pb-3 mb-3">
              <div>
                <h3 className="font-display text-base font-semibold text-foreground-deep">{story.title}</h3>
                <span className="text-xs text-muted-foreground">📍 {story.location}</span>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-terracotta">
                Lila
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{story.story}</p>
            <div className="mt-4 rounded-2xl bg-secondary/60 p-3 border border-marigold/30">
              <p className="text-xs font-medium italic text-walnut">“{story.moral}”</p>
            </div>
          </div>
        )}

        {/* Audio & Share Prasad Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {speaking ? (
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/90 p-1 border border-marigold/40">
              {isPaused ? (
                <button
                  onClick={resumeAudio}
                  className="rounded-full bg-saffron px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow"
                >
                  ▶ Resume
                </button>
              ) : (
                <button
                  onClick={pauseAudio}
                  className="rounded-full bg-amber-glow px-3 py-1.5 text-xs font-semibold text-walnut"
                >
                  ⏸ Pause
                </button>
              )}
              <button
                onClick={stopAudio}
                className="rounded-full px-2.5 py-1.5 text-xs font-medium text-walnut hover:text-destructive"
              >
                ⏹ Stop
              </button>
            </div>
          ) : (
            <button
              onClick={readAloud}
              className="flex items-center gap-1.5 rounded-full border border-marigold/40 bg-secondary px-4 py-2 text-xs font-semibold text-walnut transition-colors hover:bg-amber-glow hover:text-primary"
            >
              <Volume2 className="h-4 w-4" /> Listen
            </button>
          )}

          <button
            onClick={sharePrasad}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-saffron to-terracotta px-5 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-saffron/30 transition-transform hover:scale-105"
          >
            <Heart className="h-3.5 w-3.5" /> {copied ? "Prasad Copied! ✨" : "Share Prasad"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/**
 * Subtle sacred wood/chime audio click on each bead increment
 */
function playBeadClick() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    // Gentle melodic wood-block bell tone (G5 784Hz -> C5 523Hz)
    osc.frequency.setValueAtTime(784, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(523, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 200);
  } catch {
    /* audio blocked */
  }
}

export const JAPA_MANTRAS = [
  { id: "ram_ram", label: "राम राम", name: "Ram Ram (Pair)", desc: "Each 'Ram Ram' = 1 bead" },
  { id: "sita_ram", label: "सीता राम", name: "Sita Ram", desc: "Each 'Sita Ram' = 1 bead" },
  { id: "jai_hanuman", label: "जय हनुमान", name: "Jai Hanuman", desc: "Each 'Jai Hanuman' = 1 bead" },
  { id: "ram_single", label: "राम", name: "Ram (Single)", desc: "Each single 'Ram' = 1 bead" },
  { id: "om_namah_shivaya", label: "ॐ नमः शिवाय", name: "Om Namah Shivaya", desc: "Each chant = 1 bead" },
  { id: "hare_krishna", label: "हरे कृष्ण", name: "Hare Krishna", desc: "Each chant = 1 bead" },
  { id: "auto", label: "सभी नाम", name: "Auto Detect", desc: "Smart detection for all holy names" },
] as const;

export type MantraId = (typeof JAPA_MANTRAS)[number]["id"];

/**
 * Intelligent mantra parser:
 * Accurately detects complete chant units without overcounting syllables.
 * E.g., in 'ram_ram' mode, 26 words of 'ram' or 13 'Ram Ram' phrases = exactly 13 beads!
 */
export interface ChantParseResult {
  totalBeads: number;
  leftoverTokens: number;
  lastChantUnit: string | null;
}

/**
 * Robust mantra and bead stream parser.
 * Accurately calculates beads across continuous chanting streams without losing
 * words across speech recognition index splits or reconnect boundaries.
 */
export function parseBeadsFromText(
  rawText: string,
  mantraId: MantraId = "ram_ram",
  leftoverSeed: number = 0
): ChantParseResult {
  if (!rawText || !rawText.trim()) {
    return {
      totalBeads: Math.floor(leftoverSeed / 2),
      leftoverTokens: leftoverSeed % 2,
      lastChantUnit: null,
    };
  }

  const text = rawText.trim();
  const lower = text.toLowerCase();

  if (mantraId === "ram_ram") {
    let workingL = lower;
    let workingD = text;

    // 1. Complete phrases that count as 1 full bead (2 tokens)
    const invocationRegex = /(?:जय\s*)?(?:श्री|सिया|सीता)\s*राम|jai\s*(?:shree|sri|sia|sita)?\s*ram|हरे\s*राम|hare\s*rama/gi;
    const invMatches = workingL.match(invocationRegex) || workingD.match(invocationRegex) || [];
    const invocationBeads = invMatches.length;

    // Remove matched invocations to prevent double counting
    workingL = workingL.replace(invocationRegex, " ");
    workingD = workingD.replace(invocationRegex, " ");

    // 2. Count explicit Ram tokens (Devanagari and Latin phonetic variations)
    // Common real-world speech recognition outputs for Ram: राम, रामा, राँम, रोम, राम्, आराम
    const devaTokens = (workingD.match(/(राम|रामा|राँम|रोम|राम्)/g) || []).length;
    const latinTokens = (workingL.match(/\b(ram|rama|raam|raama|rom|roma|roam|rum|ran)\b/gi) || []).length;
    const singleTokens = Math.max(devaTokens, latinTokens);

    const totalTokens = leftoverSeed + (invocationBeads * 2) + singleTokens;
    const totalBeads = Math.floor(totalTokens / 2);
    const leftoverTokens = totalTokens % 2;

    return { totalBeads, leftoverTokens, lastChantUnit: "राम राम" };
  }

  if (mantraId === "jai_hanuman") {
    const invocationRegex = /(?:जय\s*)?(?:बजरंग\s*बली|बजरंगबली|हनुमान\s*जी|पवनपुत्र\s*हनुमान|महावीर\s*हनुमान)|(?:jai|jay)\s*(?:hanuman|bajrang\s*bali|bajrangbali)|(?:shri|shree|sri)\s*hanuman/gi;
    const invMatches = lower.match(invocationRegex) || text.match(invocationRegex) || [];
    const devaTokens = (text.match(/(हनुमान|बजरंगबली|बजरंगली|पवनपुत्र)/g) || []).length;
    const latinTokens = (lower.match(/\b(hanuman|bajrangbali|bajrang|mahavir)\b/gi) || []).length;
    const singleTokens = Math.max(devaTokens, latinTokens);
    const totalBeads = leftoverSeed + Math.max(invMatches.length, singleTokens);
    return { totalBeads, leftoverTokens: 0, lastChantUnit: "जय हनुमान" };
  }

  if (mantraId === "ram_single") {
    const devaTokens = (text.match(/(राम|रामा|राँम|रोम|राम्)/g) || []).length;
    const latinTokens = (lower.match(/\b(ram|rama|raam|raama|rom|roma|roam|rum|ran)\b/gi) || []).length;
    const totalBeads = leftoverSeed + Math.max(devaTokens, latinTokens);
    return { totalBeads, leftoverTokens: 0, lastChantUnit: "राम" };
  }

  if (mantraId === "sita_ram") {
    const regex = /\b(sita\s*ram|siya\s*ram|sitaram|siyaram|seeta\s*ram|seetaram)\b|(सीता\s*राम|सिया\s*राम|सीताराम|सियाराम|सीता-राम|सिया-राम)/gi;
    const matches = lower.match(regex) || text.match(regex) || [];
    const sitaWords = (lower.match(/\b(sita|siya|seeta)\b/g) || []).length + (text.match(/(सीता|सिया)/g) || []).length;
    const ramWords = (lower.match(/\b(ram|rama|raam)\b/g) || []).length + (text.match(/(राम)/g) || []).length;
    const splitBeads = Math.min(sitaWords, ramWords);
    const totalBeads = Math.max(matches.length, splitBeads);
    return { totalBeads, leftoverTokens: 0, lastChantUnit: "सीता राम" };
  }

  if (mantraId === "om_namah_shivaya") {
    const regex = /\b(om\s*namah\s*shivay[a]?|har\s*har\s*mahadev|shiva|shivaya)\b|(ॐ\s*नमः\s*शिवाय|नमः\s*शिवाय|हर\s*हर\s*महादेव|हर\s*हर\s*शंभू|ओम\s*नमः\s*शिवाय|शिव)/gi;
    const matches = lower.match(regex) || text.match(regex) || [];
    return { totalBeads: matches.length, leftoverTokens: 0, lastChantUnit: "ॐ नमः शिवाय" };
  }

  if (mantraId === "hare_krishna") {
    const regex = /\b(hare\s*krishna|hare\s*rama|radhe\s*krishna|radhe\s*radhe)\b|(हरे\s*कृष्ण|हरे\s*राम|राधे\s*कृष्ण|राधे\s*राधे)/gi;
    const matches = lower.match(regex) || text.match(regex) || [];
    return { totalBeads: matches.length, leftoverTokens: 0, lastChantUnit: "हरे कृष्ण" };
  }

  // AUTO Mode: Combines any holy chants
  const rPair = (text.match(/(राम\s*राम|रामराम)/g) || lower.match(/(?:ram|rama)\s+(?:ram|rama)/g) || []).length;
  const sita = (text.match(/(सीता\s*राम|सिया\s*राम)/g) || lower.match(/\b(sita\s*ram|siya\s*ram)\b/g) || []).length;
  const hanuman = (text.match(/(जय\s*हनुमान|जय\s*बजरंगबली|हनुमान)/g) || lower.match(/\b(jai\s*hanuman|hanuman|bajrangbali)\b/g) || []).length;
  const shiv = (text.match(/(ॐ\s*नमः\s*शिवाय|हर\s*हर\s*महादेव)/g) || lower.match(/\b(om\s*namah\s*shivay[a]?|har\s*har\s*mahadev)\b/g) || []).length;
  const krish = (text.match(/(हरे\s*कृष्ण|हरे\s*राम|राधे\s*कृष्ण)/g) || lower.match(/\b(hare\s*krishna|hare\s*rama)\b/g) || []).length;
  const single = (text.match(/(राम|कृष्ण|शिव)/g) || lower.match(/\b(ram|krishna|shiva)\b/g) || []).length;
  const autoBeads = rPair + sita + hanuman + shiv + krish + Math.floor(single / 2);
  return { totalBeads: autoBeads, leftoverTokens: 0, lastChantUnit: "राम राम" };
}

// Backwards compatible helper
export function parseChants(rawText: string, mantraId: MantraId = "ram_ram"): string[] {
  const result = parseBeadsFromText(rawText, mantraId);
  return Array(result.totalBeads).fill(result.lastChantUnit || "राम राम");
}

export function JapaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [count, setCount] = useState(0);
  const [selectedMantra, setSelectedMantra] = useState<MantraId>("ram_ram");
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [lastMantra, setLastMantra] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [debugTranscript, setDebugTranscript] = useState<string>("");

  const complete = count >= 108;
  const countRef = useRef<number>(0);
  const selectedMantraRef = useRef<MantraId>("ram_ram");
  const voiceActiveRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  // Cumulative stream tracking across SpeechRecognition cycles
  const streamCreditedBeadsRef = useRef<number>(0);
  const leftoverSeedRef = useRef<number>(0);
  const currentStreamLeftoverRef = useRef<number>(0);
  const lastBeadTimeRef = useRef<number>(0);
  const restartAttemptsRef = useRef<number>(0);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    selectedMantraRef.current = selectedMantra;
  }, [selectedMantra]);

  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  // Cleanup speech recognition on modal close or unmount
  useEffect(() => {
    if (!open && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
      setVoiceActive(false);
      setLastMantra(null);
      setDebugTranscript("");
      streamCreditedBeadsRef.current = 0;
      leftoverSeedRef.current = 0;
      currentStreamLeftoverRef.current = 0;
    }
  }, [open]);

  const countBead = (amount: number = 1, mantraName?: string) => {
    setCount((prev) => {
      if (prev >= 108) return 108;
      const next = Math.min(prev + amount, 108);
      countRef.current = next;

      // Soft haptic feedback
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(25);
      }
      // Instant melodic bead audio feedback
      playBeadClick();

      if (next === 108) {
        playTempleBell();
        setVoiceActive(false);
        try {
          recognitionRef.current?.abort();
        } catch {}
        recognitionRef.current = null;
      }
      return next;
    });

    if (mantraName) {
      setLastMantra(mantraName);
      setTimeout(() => setLastMantra(null), 2000);
    }
  };

  const startRecognition = () => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    try {
      try {
        recognitionRef.current?.abort();
      } catch {}

      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "hi-IN";
      rec.maxAlternatives = 1;

      // Reset stream credited beads for this fresh connection
      streamCreditedBeadsRef.current = 0;
      currentStreamLeftoverRef.current = 0;

      rec.onresult = (event: any) => {
        const finalizedParts: string[] = [];
        let interimPart = "";

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || "";
          if (res.isFinal) {
            if (transcript.trim()) finalizedParts.push(transcript.trim());
          } else {
            interimPart = transcript.trim();
          }
        }

        // Display current active hearing to devotee
        const liveDisplay = interimPart || (finalizedParts.length > 0 ? finalizedParts[finalizedParts.length - 1] : "");
        if (liveDisplay) {
          setDebugTranscript(liveDisplay);
        }

        // Full continuous stream transcript across all speech events in this connection
        const fullStreamText = [...finalizedParts, interimPart].filter(Boolean).join(" ");
        if (!fullStreamText) return;

        // Parse beads using cumulative stream plus leftover seed from previous reconnect
        const { totalBeads, leftoverTokens, lastChantUnit } = parseBeadsFromText(
          fullStreamText,
          selectedMantraRef.current,
          leftoverSeedRef.current
        );

        currentStreamLeftoverRef.current = leftoverTokens;

        const previouslyCredited = streamCreditedBeadsRef.current;
        const diff = totalBeads - previouslyCredited;

        if (diff > 0) {
          const now = Date.now();
          if (now - lastBeadTimeRef.current >= 150) {
            countBead(diff, lastChantUnit || undefined);
            streamCreditedBeadsRef.current = totalBeads;
            lastBeadTimeRef.current = now;
            restartAttemptsRef.current = 0;
          }
        }
      };

      rec.onerror = (e: any) => {
        console.warn("[JapaVoice] recognition error:", e.error);
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setVoiceError("Microphone access blocked. Please allow mic permissions in your browser settings.");
          setVoiceActive(false);
          return;
        }
        if (e.error === "no-speech") {
          return; // Silent restart on onend
        }
        if (e.error === "network") {
          setVoiceError("Network error: speech recognition requires internet. Reconnecting...");
          return;
        }
      };

      rec.onend = () => {
        // Carry over any unpaired chant tokens to the next reconnect cycle
        leftoverSeedRef.current = currentStreamLeftoverRef.current;

        // Reconnect smoothly if user is still chanting and mala not finished
        if (voiceActiveRef.current && countRef.current < 108) {
          const delay = Math.min(150 * Math.pow(1.3, restartAttemptsRef.current), 1500);
          restartAttemptsRef.current++;
          setTimeout(() => {
            if (voiceActiveRef.current && countRef.current < 108) {
              startRecognition();
            }
          }, delay);
        } else {
          setVoiceActive(false);
        }
      };

      rec.start();
      recognitionRef.current = rec;
      setVoiceActive(true);
      setVoiceError(null);
      restartAttemptsRef.current = 0;
    } catch (err) {
      console.error("[JapaVoice] start error:", err);
      setVoiceError("Could not start microphone. Please try again.");
      setVoiceActive(false);
    }
  };

  const toggleVoiceMode = () => {
    if (!voiceSupported) {
      setVoiceError("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (voiceActive) {
      setVoiceActive(false);
      voiceActiveRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {}
      recognitionRef.current = null;
      setDebugTranscript("");
      streamCreditedBeadsRef.current = 0;
      leftoverSeedRef.current = 0;
      currentStreamLeftoverRef.current = 0;
      return;
    }

    streamCreditedBeadsRef.current = 0;
    leftoverSeedRef.current = 0;
    currentStreamLeftoverRef.current = 0;
    restartAttemptsRef.current = 0;
    startRecognition();
  };

  return (
    <Overlay open={open} onClose={onClose}>
      <SheetHeader title="Japa Counter" subtitle="One Mala • 108 Holy Names" onClose={onClose} />
      <div className="overflow-y-auto px-6 py-6">
        <div className="mx-auto mb-3 text-center">
          <span className="font-display text-5xl font-semibold text-primary">{Math.min(count, 108)}</span>
          <span className="text-lg text-muted-foreground"> / 108</span>
          {complete ? (
            <p className="mt-1 text-sm font-semibold text-terracotta animate-pulse">🙏 108 Mala Complete • Ram Ram Sita Ram</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Chant live with voice auto-count, or tap beads manually
            </p>
          )}
        </div>

        {/* Live Chant Detection Pill */}
        {lastMantra && (
          <div className="mx-auto mb-3 flex items-center justify-center gap-1.5 animate-bounce">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron/15 border border-saffron/40 px-3.5 py-1 text-xs font-semibold text-saffron shadow-sm">
              ✨ Live Chant: "{lastMantra}" (+1)
            </span>
          </div>
        )}

        {/* Live heard transcript */}
        {voiceActive && debugTranscript && (
          <div className="mx-auto mb-3 max-w-sm text-center">
            <p className="text-[11px] text-muted-foreground/80 italic truncate font-medium">
              🎙️ Hearing: "{debugTranscript}"
            </p>
          </div>
        )}

        {/* Mantra Selector Pills */}
        <div className="mx-auto mb-4 w-full max-w-md">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-medium text-muted-foreground">Chant Target:</span>
            <span className="text-[11px] font-semibold text-primary">
              {JAPA_MANTRAS.find((m) => m.id === selectedMantra)?.desc}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {JAPA_MANTRAS.map((m) => {
              const active = selectedMantra === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMantra(m.id);
                    selectedMantraRef.current = m.id;
                    streamCreditedBeadsRef.current = 0;
                    leftoverSeedRef.current = 0;
                    currentStreamLeftoverRef.current = 0;
                    setLastMantra(null);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    active
                      ? "bg-gradient-to-r from-saffron to-terracotta text-primary-foreground shadow-sm scale-105"
                      : "bg-secondary text-walnut/80 border border-marigold/30 hover:bg-amber-glow/60 hover:text-primary"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-auto mb-4 h-2 w-full max-w-sm rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-marigold to-saffron transition-all duration-200"
            style={{ width: `${(Math.min(count, 108) / 108) * 100}%` }}
          />
        </div>

        {/* Bead mala grid */}
        <button
          onClick={() => countBead(1)}
          aria-label="Count one mantra bead"
          className="parchment-scroll grid w-full cursor-pointer grid-cols-12 gap-2 rounded-3xl p-5 transition-transform active:scale-[0.98]"
        >
          {Array.from({ length: 108 }).map((_, i) => (
            <span
              key={i}
              className={`bead mx-auto block h-2.5 w-2.5 rounded-full transition-colors ${
                i < count ? "bead-counted bg-marigold shadow-sm" : "bg-walnut/15"
              }`}
            />
          ))}
        </button>

        {/* Voice Chanting Feature Bar */}
        <div className="mt-5 parchment-scroll rounded-2xl p-3.5 border border-marigold/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  voiceActive
                    ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30"
                    : "bg-secondary text-walnut"
                }`}
              >
                {voiceActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </span>
              <div>
                <span className="block text-xs font-semibold text-foreground-deep">
                  {voiceActive ? "Voice Chanting Active (Live) 🎙️" : "Voice Chanting Mode"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {voiceActive ? "Increments live as you speak each chant" : "Auto-increments beads live as you chant"}
                </span>
              </div>
            </div>
            <button
              onClick={toggleVoiceMode}
              disabled={complete}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                voiceActive
                  ? "bg-red-500 text-white shadow hover:bg-red-600"
                  : "bg-secondary text-walnut border border-marigold/40 hover:bg-amber-glow hover:text-primary"
              }`}
            >
              {voiceActive ? "Stop Voice" : "Start Voice"}
            </button>
          </div>
          {voiceError && <p className="mt-2 text-[11px] text-destructive">⚠️ {voiceError}</p>}
          {voiceActive && !voiceError && (
            <p className="mt-2 text-[10px] text-muted-foreground/70">
              💡 Chanting is live! Each repetition ticks the mala instantly with gentle sound feedback.
            </p>
          )}
        </div>

        {/* Manual Buttons */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => countBead(1)}
            disabled={complete}
            className="flex-1 max-w-[180px] rounded-full bg-gradient-to-r from-saffron to-terracotta py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-saffron/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {complete ? "Complete" : "Count Bead (+1)"}
          </button>
          <button
            onClick={() => {
              setCount(0);
              countRef.current = 0;
              streamCreditedBeadsRef.current = 0;
              leftoverSeedRef.current = 0;
              currentStreamLeftoverRef.current = 0;
              setLastMantra(null);
              setDebugTranscript("");
            }}
            className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-walnut transition-colors hover:bg-amber-glow hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ---------- Darshan & Media drawer ---------- */

type MediaTab = "chalisa" | "videos" | "photos" | "links";

export function MediaDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<MediaTab>("chalisa");
  const [activeVideoId, setActiveVideoId] = useState<string>("xJ3vatsNQDU");

  const TABS: { id: MediaTab; label: string; icon: React.ReactNode }[] = [
    { id: "chalisa", label: "Hanuman Chalisa", icon: <BookOpenText className="h-4 w-4" /> },
    { id: "videos", label: "Videos & Films", icon: <Clapperboard className="h-4 w-4" /> },
    { id: "photos", label: "Photo Darshan", icon: <Camera className="h-4 w-4" /> },
    { id: "links", label: "Sacred Links", icon: <ExternalLink className="h-4 w-4" /> },
  ];

  return (
    <Overlay open={open} onClose={onClose} wide>
      <SheetHeader title="Darshan & Media" subtitle="Hanuman Chalisa, documentaries and sacred archives" onClose={onClose} />

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-marigold/25 px-4 py-3 sm:px-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
              tab === t.id
                ? "bg-gradient-to-r from-saffron to-terracotta text-primary-foreground shadow-md shadow-saffron/30"
                : "text-walnut hover:bg-secondary"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="overflow-y-auto px-4 py-5 sm:px-6">
        {/* Hanuman Chalisa Player & Lyrics */}
        {tab === "chalisa" && (
          <div className="space-y-5">
            {/* Embedded Interactive YouTube Player */}
            <div className="overflow-hidden rounded-3xl border border-marigold/40 shadow-lg bg-black">
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=0&rel=0`}
                  title="Hanuman Chalisa"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </div>

            {/* Version Switcher */}
            <div className="flex items-center justify-between parchment-scroll rounded-2xl p-3">
              <span className="text-xs font-semibold text-foreground-deep">Select Recitation:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveVideoId("xJ3vatsNQDU")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    activeVideoId === "xJ3vatsNQDU"
                      ? "bg-saffron text-white shadow"
                      : "bg-secondary text-walnut hover:bg-amber-glow"
                  }`}
                >
                  Traditional Chant
                </button>
                <button
                  onClick={() => setActiveVideoId("AETFvQonfV8")}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    activeVideoId === "AETFvQonfV8"
                      ? "bg-saffron text-white shadow"
                      : "bg-secondary text-walnut hover:bg-amber-glow"
                  }`}
                >
                  Gulshan Kumar
                </button>
              </div>
            </div>

            {/* Synced bilingual lyrics */}
            <div>
              <h3 className="font-display text-sm font-semibold text-foreground-deep mb-3">Hanuman Chalisa Verses:</h3>
              <ol className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {CHALISA_LYRICS.map((line, i) => (
                  <li key={i} className="glass-card rounded-2xl px-4 py-3">
                    <p className="text-[0.95rem] font-semibold text-foreground" style={{ fontFamily: "var(--font-deva)" }}>
                      {line.hi}
                    </p>
                    <p className="mt-0.5 text-xs italic text-muted-foreground">{line.en}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Video Documentaries */}
        {tab === "videos" && (
          <div className="space-y-4">
            {/* Main Video Embed */}
            <div className="overflow-hidden rounded-3xl border border-marigold/40 shadow-lg bg-black">
              <div className="aspect-video w-full">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=0&rel=0`}
                  title="Documentary Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </div>

            {/* Video List */}
            <div className="grid gap-3 sm:grid-cols-2">
              {EMBEDDED_VIDEOS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVideoId(v.id)}
                  className={`parchment-scroll group rounded-3xl p-4 text-left transition-all hover:-translate-y-0.5 ${
                    activeVideoId === v.id ? "ring-2 ring-saffron bg-secondary/80" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-terracotta group-hover:bg-amber-glow group-hover:text-primary">
                      <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
                    </span>
                    <div>
                      <h4 className="font-display text-sm font-semibold text-foreground-deep leading-snug">{v.title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{v.blurb}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {tab === "photos" && (
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { src: darshanSatsang, alt: "Maharaj-ji sitting in satsang with devotees", caption: "Satsang in the early years" },
              { src: darshanAshram, alt: "Kainchi Dham temple beside the mountain river", caption: "Kainchi Dham, Kumaon hills" },
              { src: darshanBlessing, alt: "Maharaj-ji blessing a young devotee", caption: "A blessing, given quietly" },
            ].map((p) => (
              <figure key={p.caption} className="group">
                <div className="overflow-hidden rounded-3xl border border-marigold/40 shadow-lg">
                  <img
                    src={p.src}
                    alt={p.alt}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <figcaption className="mt-2 text-center font-display text-sm text-walnut">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        )}

        {/* Sacred External Resources */}
        {tab === "links" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-2">Explore authorized books, ashram websites, and memoirs:</p>
            {SACRED_RESOURCES.map((r) => (
              <a
                key={r.title}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="parchment-scroll group flex items-start justify-between rounded-2xl p-4 transition-all hover:shadow-md"
              >
                <div>
                  <h4 className="font-display text-sm font-semibold text-foreground-deep flex items-center gap-1.5">
                    {r.title}
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </Overlay>
  );
}

/* ---------- Settings (key manager + accessibility) ---------- */

interface Prefs {
  elder: boolean;
  contrast: boolean;
  reduceMotion: boolean;
}

export function SettingsSheet({
  open,
  onClose,
  prefs,
  onPrefs,
  onClearChat,
}: {
  open: boolean;
  onClose: () => void;
  prefs: Prefs;
  onPrefs: (p: Prefs) => void;
  onClearChat: () => void;
}) {
  const toggle = (key: keyof Prefs) => onPrefs({ ...prefs, [key]: !prefs[key] });

  const Toggle = ({ label, description, on, onClick }: { label: string; description: string; on: boolean; onClick: () => void }) => (
    <button onClick={onClick} className="glass-card flex w-full items-center justify-between rounded-2xl px-5 py-3.5 text-left transition-colors hover:bg-card/80">
      <span>
        <span className="block text-sm font-semibold text-foreground-deep">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
      <span className={`h-6 w-11 rounded-full transition-colors flex items-center p-1 ${on ? "bg-saffron" : "bg-secondary"}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );

  return (
    <Overlay open={open} onClose={onClose}>
      <SheetHeader title="Settings & Accessibility" subtitle="Personalize your sanctuary experience" onClose={onClose} />
      <div className="overflow-y-auto px-6 py-6 space-y-5">
        {/* Accessibility toggles */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase px-1">Accessibility Modes</h3>
          <Toggle
            label="Elder-Friendly (Bada Akshar)"
            description="Increases text size and spacing for comfortable reading"
            on={prefs.elder}
            onClick={() => toggle("elder")}
          />
          <Toggle
            label="High Contrast"
            description="Darkens text and borders for sharp visibility"
            on={prefs.contrast}
            onClick={() => toggle("contrast")}
          />
          <Toggle
            label="Reduce Animations"
            description="Disables floating and pulse animations"
            on={prefs.reduceMotion}
            onClick={() => toggle("reduceMotion")}
          />
        </div>

        {/* Clear chat */}
        <div className="pt-2">
          <button
            onClick={onClearChat}
            className="w-full rounded-2xl border border-destructive/30 bg-destructive/10 py-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
          >
            Clear Conversation History
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ---------- Ashram Soundscapes Modal ---------- */

export function SoundModal({
  open,
  onClose,
  ambientOn,
  onToggleAmbient,
  selectedSound,
  onSelectSound,
  volume,
  onVolumeChange,
}: {
  open: boolean;
  onClose: () => void;
  ambientOn: boolean;
  onToggleAmbient: () => void;
  selectedSound: AmbientSoundId;
  onSelectSound: (id: AmbientSoundId) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}) {
  return (
    <Overlay open={open} onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-marigold/30 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="halo flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground-deep">
                Ashram Soundscapes (आश्रम नाद)
              </h2>
              <p className="text-xs text-muted-foreground">
                Sacred meditative sounds synthesized with pure Web Audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sound modal"
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Master Power Switch Card */}
        <div className="flex items-center justify-between rounded-2xl bg-secondary/70 p-4 border border-marigold/40">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                ambientOn
                  ? "bg-gradient-to-br from-saffron to-terracotta text-white shadow-md shadow-saffron/30"
                  : "bg-walnut/10 text-walnut/50"
              }`}
            >
              {ambientOn ? <Waves className="h-6 w-6 animate-pulse" /> : <VolumeX className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold text-foreground">
                  Ambient Audio: {ambientOn ? "Active" : "Silent"}
                </span>
                {ambientOn && (
                  <span className="inline-flex items-center rounded-full bg-saffron/15 px-2 py-0.5 text-[10px] font-bold text-saffron uppercase">
                    Playing
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ambientOn
                  ? `Vibrating with ${AMBIENT_SOUND_OPTIONS.find((s) => s.id === selectedSound)?.name}`
                  : "Tap turn on to immerse your room in peaceful ashram vibrations"}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleAmbient}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all shadow-sm ${
              ambientOn
                ? "bg-amber-glow text-walnut border border-marigold/60 hover:bg-amber-glow/80"
                : "bg-gradient-to-r from-saffron to-terracotta text-white hover:brightness-105 hover:scale-105"
            }`}
          >
            {ambientOn ? "Mute Silence" : "Turn On"}
          </button>
        </div>

        {/* Volume Slider Card */}
        <div className="rounded-2xl bg-secondary/40 p-3.5 border border-marigold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Volume2 className="h-4 w-4 text-primary" /> Volume Level
            </span>
            <span className="text-xs font-bold text-primary">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-saffron cursor-pointer"
            aria-label="Ambient volume"
          />
        </div>

        {/* Sound Selection Grid */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Select Soundscape
            </span>
            <span className="text-[11px] text-muted-foreground">
              Instant offline synthesis
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {AMBIENT_SOUND_OPTIONS.map((opt) => {
              const active = selectedSound === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSelectSound(opt.id);
                    if (!ambientOn) onToggleAmbient();
                  }}
                  className={`flex items-start justify-between rounded-2xl p-3.5 text-left transition-all border ${
                    active
                      ? "bg-amber-glow/60 border-marigold shadow-md scale-[1.01]"
                      : "bg-card border-marigold/20 hover:bg-secondary/60 hover:border-marigold/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                        active
                          ? "bg-gradient-to-br from-saffron to-terracotta text-white shadow-sm"
                          : "bg-secondary text-primary"
                      }`}
                    >
                      {opt.id === "tanpura" && <Music className="h-4 w-4" />}
                      {opt.id === "om" && <OmIcon className="h-4 w-4" />}
                      {opt.id === "bells" && <Bell className="h-4 w-4" />}
                      {opt.id === "river" && <Waves className="h-4 w-4" />}
                      {opt.id === "aarti" && <Flame className="h-4 w-4" />}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-foreground">
                          {opt.name}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground/80">
                          ({opt.hindiName})
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-walnut/70 uppercase">
                      {opt.badge}
                    </span>
                    {active && ambientOn && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-saffron animate-pulse">
                        <Check className="h-3.5 w-3.5" /> Playing
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Spiritual Note */}
        <div className="rounded-xl bg-secondary/30 p-3 text-center border border-marigold/20">
          <p className="text-xs text-muted-foreground italic">
            "Sub Ek. In holy silence or sacred sound, keep Ram in your heart." [Neem Karoli Baba] 🙏
          </p>
        </div>
      </div>
    </Overlay>
  );
}


