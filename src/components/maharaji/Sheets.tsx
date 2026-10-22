import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Camera, Clapperboard, Heart, Play, RotateCcw, X } from "lucide-react";
import { CHALISA_LYRICS, DOCUMENTARIES, PRASAD_QUOTES } from "@/lib/maharaji";
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
      <div className={`glass-card rise-in relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-4xl sm:rounded-4xl ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}>
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

/* ---------- Daily Prasad ---------- */

export function PrasadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dayIndex = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);
  const [offset, setOffset] = useState(0);
  const quote = PRASAD_QUOTES[(dayIndex + offset) % PRASAD_QUOTES.length];
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <Overlay open={open} onClose={onClose}>
      <SheetHeader title="Daily Prasad" subtitle={today} onClose={onClose} />
      <div className="overflow-y-auto px-6 py-8">
        <div className="halo mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-primary">
          <DiyaIcon className="h-11 w-11" />
        </div>
        <blockquote className="parchment-scroll rounded-3xl px-6 py-8 text-center">
          <OmIcon className="mx-auto mb-4 h-6 w-6 text-marigold" />
          <p className="font-display text-lg leading-relaxed text-foreground-deep sm:text-xl">“{quote}”</p>
          <footer className="mt-4 text-xs font-medium tracking-[0.18em] text-walnut/70 uppercase">— In the spirit of Maharaj-ji</footer>
        </blockquote>
        <button
          onClick={() => setOffset((o) => o + 1)}
          className="mx-auto mt-6 flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron to-terracotta px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-saffron/30 transition-transform hover:scale-105"
        >
          <Heart className="h-4 w-4" /> Take another prasad
        </button>
      </div>
    </Overlay>
  );
}

/* ---------- Japa Counter (108 beads) ---------- */

export function JapaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [count, setCount] = useState(0);
  const complete = count >= 108;

  useEffect(() => {
    if (open && complete) {
      // celebrate gently, then allow a new round on reset
    }
  }, [open, complete]);

  return (
    <Overlay open={open} onClose={onClose}>
      <SheetHeader title="Japa Counter" subtitle="One Mala • 108 holy names" onClose={onClose} />
      <div className="overflow-y-auto px-6 py-6">
        <div className="mx-auto mb-5 text-center">
          <span className="font-display text-5xl font-semibold text-primary">{Math.min(count, 108)}</span>
          <span className="text-lg text-muted-foreground"> / 108</span>
          {complete && <p className="mt-1 text-sm font-semibold text-terracotta">Mala complete 🙏 Ram Ram</p>}
        </div>

        {/* Bead mala */}
        <button
          onClick={() => !complete && setCount((c) => c + 1)}
          aria-label="Count one mantra"
          className="parchment-scroll grid w-full cursor-pointer grid-cols-12 gap-2 rounded-3xl p-5 transition-transform active:scale-[0.98]"
        >
          {Array.from({ length: 108 }).map((_, i) => (
            <span
              key={i}
              className={`bead mx-auto block h-2.5 w-2.5 rounded-full ${
                i < count ? "bead-counted bg-marigold" : "bg-walnut/15"
              }`}
            />
          ))}
        </button>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => setCount((c) => Math.min(c + 1, 108))}
            className="rounded-full bg-gradient-to-r from-saffron to-terracotta px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-saffron/30 transition-transform hover:scale-105"
          >
            Count mantra
          </button>
          <button
            onClick={() => setCount(0)}
            className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-walnut transition-colors hover:bg-amber-glow hover:text-primary"
          >
            <RotateCcw className="h-4 w-4" /> New mala
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ---------- Darshan & Media drawer ---------- */

type MediaTab = "chalisa" | "docs" | "photos";

export function MediaDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<MediaTab>("chalisa");

  const TABS: { id: MediaTab; label: string; icon: React.ReactNode }[] = [
    { id: "chalisa", label: "Hanuman Chalisa", icon: <BookOpenText className="h-4 w-4" /> },
    { id: "docs", label: "Documentaries", icon: <Clapperboard className="h-4 w-4" /> },
    { id: "photos", label: "Photo Darshan", icon: <Camera className="h-4 w-4" /> },
  ];

  return (
    <Overlay open={open} onClose={onClose} wide>
      <SheetHeader title="Darshan & Media" subtitle="Chalisa, stories and sacred photographs" onClose={onClose} />

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-marigold/25 px-4 py-3 sm:px-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all sm:px-4 sm:text-sm ${
              tab === t.id ? "bg-gradient-to-r from-saffron to-terracotta text-primary-foreground shadow-md shadow-saffron/30" : "text-walnut hover:bg-secondary"
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      <div className="overflow-y-auto px-4 py-5 sm:px-6">
        {tab === "chalisa" && (
          <div className="space-y-5">
            {/* Player card */}
            <a
              href="https://www.youtube.com/results?search_query=hanuman+chalisa+slow+recitation"
              target="_blank"
              rel="noreferrer"
              className="parchment-scroll group flex items-center gap-4 rounded-3xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saffron to-terracotta text-primary-foreground shadow-lg shadow-saffron/35 transition-transform group-hover:scale-105">
                <Play className="ml-0.5 h-6 w-6" fill="currentColor" />
              </span>
              <span>
                <span className="block font-display text-lg font-semibold text-foreground-deep">Hanuman Chalisa</span>
                <span className="block text-sm text-muted-foreground">Full recitation with bilingual lyrics below</span>
              </span>
            </a>

            {/* Synced bilingual lyrics */}
            <ol className="space-y-3">
              {CHALISA_LYRICS.map((line, i) => (
                <li key={i} className="glass-card rounded-2xl px-5 py-3.5">
                  <p className="text-[0.98rem] font-semibold leading-relaxed text-foreground" style={{ fontFamily: "var(--font-deva)" }}>
                    {line.hi}
                  </p>
                  <p className="mt-1 text-sm italic leading-relaxed text-muted-foreground">{line.en}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {tab === "docs" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {DOCUMENTARIES.map((doc) => (
              <a
                key={doc.title}
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(doc.search)}`}
                target="_blank"
                rel="noreferrer"
                className="parchment-scroll group rounded-3xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-terracotta transition-colors group-hover:bg-amber-glow group-hover:text-primary">
                  <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
                </span>
                <h3 className="font-display text-base font-semibold text-foreground-deep">{doc.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{doc.blurb}</p>
              </a>
            ))}
          </div>
        )}

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
      </div>
    </Overlay>
  );
}

/* ---------- Settings (respectful key manager + accessibility) ---------- */

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
    } catch { /* storage unavailable */ }
  }, [open]);

  const toggle = (key: keyof Prefs) => onPrefs({ ...prefs, [key]: !prefs[key] });

  const Toggle = ({ label, description, on, onClick }: { label: string; description: string; on: boolean; onClick: () => void }) => (
    <button onClick={onClick} className="glass-card flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-colors hover:bg-card/80">
      <span>
        <span className="block text-sm font-semibold text-foreground-deep">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-walnut/20"}`} aria-hidden="true">
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[1.4rem]" : "left-0.5"}`} />
      </span>
    </button>
  );

  return (
    <Overlay open={open} onClose={onClose}>
      <SheetHeader title="Settings" subtitle="Tuned with care, like a temple bell" onClose={onClose} />
      <div className="space-y-3 overflow-y-auto px-6 py-5">
        <h3 className="text-xs font-semibold tracking-[0.16em] text-walnut/70 uppercase">Elder-Friendly Mode</h3>
        <Toggle label="Large, gentle text" description="Raises every font size for easy reading" on={prefs.elder} onClick={() => toggle("elder")} />
        <Toggle label="Boosted contrast" description="Deeper text and clearer outlines" on={prefs.contrast} onClick={() => toggle("contrast")} />
        <Toggle label="Reduce motion" description="Calms all animations and glows" on={prefs.reduceMotion} onClick={() => toggle("reduceMotion")} />

        <h3 className="pt-3 text-xs font-semibold tracking-[0.16em] text-walnut/70 uppercase">Key Manager</h3>
        <div className="glass-card rounded-2xl px-5 py-4">
          <label htmlFor="api-key" className="block text-sm font-semibold text-foreground-deep">
            Your own service key
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">Stored only on this device, never sent anywhere without your blessing.</p>
          <div className="mt-3 flex gap-2">
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setSaved(false);
              }}
              placeholder="Paste your key..."
              className="min-w-0 flex-1 rounded-xl border border-marigold/40 bg-background/70 px-3.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-marigold"
            />
            <button
              onClick={() => {
                try {
                  if (apiKey) localStorage.setItem(KEY_STORE, apiKey);
                  else localStorage.removeItem(KEY_STORE);
                } catch { /* storage unavailable */ }
                setSaved(true);
              }}
              className="rounded-xl bg-gradient-to-r from-saffron to-terracotta px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition-transform hover:scale-105"
            >
              {saved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </div>

        <h3 className="pt-3 text-xs font-semibold tracking-[0.16em] text-walnut/70 uppercase">Conversation</h3>
        <button
          onClick={onClearChat}
          className="glass-card w-full rounded-2xl px-5 py-4 text-left text-sm font-semibold text-terracotta transition-colors hover:bg-secondary"
        >
          Clear this conversation
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Begin again with a quiet heart</span>
        </button>
      </div>
    </Overlay>
  );
}
