import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Camera, Clapperboard, ExternalLink, Heart, Play, RotateCcw, Sparkles, Volume2, X } from "lucide-react";
import {
  CHALISA_LYRICS,
  EMBEDDED_VIDEOS,
  PRASAD_QUOTES,
  PRASAD_STORIES,
  SACRED_RESOURCES,
  playTempleBell,
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
  const dayIndex = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);
  const [offset, setOffset] = useState(0);
  const quote = PRASAD_QUOTES[(dayIndex + offset) % PRASAD_QUOTES.length];
  const story = PRASAD_STORIES[(dayIndex + offset) % PRASAD_STORIES.length];
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const readAloud = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.88;
    utter.pitch = 0.95;
    window.speechSynthesis.speak(utter);
  };

  return (
    <Overlay open={open} onClose={onClose}>
      <SheetHeader title="Daily Prasad" subtitle={today} onClose={onClose} />
      
      {/* Mode Selector */}
      <div className="flex justify-center border-b border-marigold/20 bg-secondary/30 px-6 py-2.5">
        <div className="inline-flex rounded-full bg-secondary/80 p-1 border border-marigold/30">
          <button
            onClick={() => setMode("quote")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              mode === "quote"
                ? "bg-gradient-to-r from-saffron to-terracotta text-primary-foreground shadow"
                : "text-walnut hover:text-primary"
            }`}
          >
            🌸 Daily Teaching
          </button>
          <button
            onClick={() => setMode("story")}
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
              <footer className="mt-4 text-xs font-medium tracking-[0.18em] text-walnut/70 uppercase">— Neem Karoli Baba</footer>
            </blockquote>
          </div>
        ) : (
          <div className="parchment-scroll rounded-3xl p-6">
            <div className="flex items-center justify-between border-b border-marigold/20 pb-3 mb-3">
              <div>
                <h3 className="font-display text-base font-semibold text-foreground-deep">{story.title}</h3>
                <span className="text-xs text-muted-foreground">📍 {story.location}</span>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-terracotta">Lila</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{story.story}</p>
            <div className="mt-4 rounded-2xl bg-secondary/60 p-3 border border-marigold/30">
              <p className="text-xs font-medium italic text-walnut">“{story.moral}”</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => readAloud(mode === "quote" ? quote : `${story.title}. ${story.story}`)}
            className="flex items-center gap-1.5 rounded-full border border-marigold/40 bg-secondary px-4 py-2 text-xs font-semibold text-walnut transition-colors hover:bg-amber-glow hover:text-primary"
          >
            <Volume2 className="h-4 w-4" /> Listen
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron to-terracotta px-5 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-saffron/30 transition-transform hover:scale-105"
          >
            <Sparkles className="h-3.5 w-3.5" /> Another Prasad
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ---------- Japa Counter (108 beads) ---------- */

export function JapaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [count, setCount] = useState(0);
  const complete = count >= 108;

  const countBead = () => {
    if (complete) return;
    const next = count + 1;
    setCount(next);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(20);
    }
    if (next === 108) {
      playTempleBell();
    }
  };

  return (
    <Overlay open={open} onClose={onClose}>
      <SheetHeader title="Japa Counter" subtitle="One Mala • 108 Holy Names" onClose={onClose} />
      <div className="overflow-y-auto px-6 py-6">
        <div className="mx-auto mb-4 text-center">
          <span className="font-display text-5xl font-semibold text-primary">{Math.min(count, 108)}</span>
          <span className="text-lg text-muted-foreground"> / 108</span>
          {complete ? (
            <p className="mt-1 text-sm font-semibold text-terracotta animate-pulse">🙏 108 Mala Complete • Ram Ram Sita Ram</p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Repeat "Ram Ram" or your Guru Mantra with each tap</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mx-auto mb-5 h-2 w-full max-w-sm rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-marigold to-saffron transition-all duration-200"
            style={{ width: `${(Math.min(count, 108) / 108) * 100}%` }}
          />
        </div>

        {/* Bead mala grid */}
        <button
          onClick={countBead}
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

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={countBead}
            disabled={complete}
            className="flex-1 max-w-[180px] rounded-full bg-gradient-to-r from-saffron to-terracotta py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-saffron/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {complete ? "Complete" : "Count Bead"}
          </button>
          <button
            onClick={() => setCount(0)}
            className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-walnut transition-colors hover:bg-amber-glow hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" /> New Mala
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

const KEY_STORE = "maharaji.apiKey";

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
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      setApiKey(localStorage.getItem(KEY_STORE) ?? "");
    } catch {
      /* storage unavailable */
    }
  }, [open]);

  const toggle = (key: keyof Prefs) => onPrefs({ ...prefs, [key]: !prefs[key] });

  const saveKey = () => {
    try {
      if (apiKey.trim()) {
        localStorage.setItem(KEY_STORE, apiKey.trim());
      } else {
        localStorage.removeItem(KEY_STORE);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* storage unavailable */
    }
  };

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
        {/* API Key management */}
        <div className="parchment-scroll rounded-3xl p-5">
          <label className="block text-sm font-semibold text-foreground-deep mb-1">
            Groq API Key (Optional)
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Leave blank to use the built-in offline wisdom engine, or paste your own free key from console.groq.com for limitless generative AI.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_..."
              className="flex-1 rounded-xl border border-marigold/40 bg-card px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron"
            />
            <button
              onClick={saveKey}
              className="rounded-xl bg-gradient-to-r from-saffron to-terracotta px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition-transform hover:scale-105"
            >
              {saved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </div>

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
