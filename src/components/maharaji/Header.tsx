import { Bell, MonitorPlay, Settings, Flower2, FileText } from "lucide-react";
import { JapaIcon } from "./icons";
import portrait from "@/assets/maharaji-portrait.jpg";

interface HeaderProps {
  ambientOn: boolean;
  onToggleAmbient: () => void;
  onOpen: (kind: "prasad" | "japa" | "media" | "settings" | "proposal" | "sound") => void;
}

const WAVE_BARS = [0, 1, 2, 3];

function HeaderPill({
  icon,
  label,
  onClick,
  active,
  highlight,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  highlight?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`glass-card group flex items-center gap-1.5 rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 shrink-0 hover:-translate-y-0.5 hover:shadow-md ${
        highlight
          ? "bg-saffron/15 border border-saffron/50 text-saffron font-semibold shadow-xs"
          : active
          ? "ring-2 ring-marigold bg-amber-glow/40"
          : "hover:bg-amber-glow/30"
      }`}
    >
      <span className={`transition-colors duration-200 ${highlight ? "text-saffron" : active ? "text-primary" : "text-terracotta group-hover:text-primary"}`}>
        {icon}
      </span>
      {children}
      <span className="hidden xl:inline text-walnut whitespace-nowrap">{label}</span>
    </button>
  );
}

export default function Header({ ambientOn, onToggleAmbient, onOpen }: HeaderProps) {
  return (
    <header className="glass-card sticky top-0 z-40 mx-auto mt-2 sm:mt-3 flex w-[calc(100%-1rem)] sm:w-[calc(100%-1.5rem)] max-w-5xl items-center justify-between gap-2 sm:gap-4 rounded-3xl sm:rounded-4xl px-3 sm:px-5 py-2.5 sm:py-3 shadow-md">
      {/* Left: Portrait + Title Brand (always grouped, never squished) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="halo flex shrink-0 items-center">
          <img
            src={portrait}
            alt="Portrait of Maharaj-ji"
            width={1024}
            height={1024}
            className="h-9 w-9 sm:h-12 sm:w-12 rounded-full border-2 border-marigold/70 object-cover object-top shadow-md"
          />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-sm sm:text-lg font-semibold tracking-wide text-foreground-deep leading-tight truncate">
            Maharaj-ji Speaks
          </h1>
          <p className="text-[9px] sm:text-[11px] font-medium tracking-wide text-walnut/70 uppercase truncate hidden sm:block">
            Sub Ek • Love, Serve, Remember
          </p>
        </div>
      </div>

      {/* Right: Quick access pills (scrollable on narrow mobile screens) */}
      <nav aria-label="Devotion tools" className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-[65%] sm:max-w-none">
        <HeaderPill icon={<Flower2 className="h-4 w-4" />} label="Prasad" onClick={() => onOpen("prasad")}>
          <span className="text-[11px] text-walnut font-medium hidden md:inline xl:hidden">Prasad</span>
        </HeaderPill>

        <HeaderPill icon={<Bell className="h-4 w-4" />} label="Sound" onClick={() => onOpen("sound")} active={ambientOn}>
          {ambientOn && (
            <span className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
              {WAVE_BARS.map((i) => (
                <span
                  key={i}
                  className="sound-wave block w-[2.5px] rounded-full bg-primary"
                  style={{ height: "100%", animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          )}
          <span className="text-[11px] text-walnut font-medium hidden md:inline xl:hidden">Sound</span>
        </HeaderPill>

        <HeaderPill icon={<JapaIcon className="h-4 w-4" />} label="Japa" onClick={() => onOpen("japa")}>
          <span className="text-[11px] text-walnut font-medium hidden md:inline xl:hidden">Japa</span>
        </HeaderPill>

        <HeaderPill icon={<MonitorPlay className="h-4 w-4" />} label="Media" onClick={() => onOpen("media")}>
          <span className="text-[11px] text-walnut font-medium hidden md:inline xl:hidden">Media</span>
        </HeaderPill>

        <HeaderPill
          icon={<FileText className="h-4 w-4" />}
          label="Proposal"
          onClick={() => onOpen("proposal")}
          highlight={true}
        >
          <span className="text-[11px] text-saffron font-bold md:inline">Proposal</span>
          <span className="rounded-full bg-saffron text-white px-1.5 py-0.2 text-[9px] font-extrabold uppercase shadow-xs">
            Demo
          </span>
        </HeaderPill>

        <HeaderPill icon={<Settings className="h-4 w-4" />} label="Settings" onClick={() => onOpen("settings")} />
      </nav>
    </header>
  );
}
