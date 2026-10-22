import { Bell, MonitorPlay, Settings, Flower2, FileText } from "lucide-react";
import { JapaIcon } from "./icons";
import portrait from "@/assets/maharaji-portrait.jpg";

interface HeaderProps {
  ambientOn: boolean;
  onToggleAmbient: () => void;
  onOpen: (kind: "prasad" | "japa" | "media" | "settings" | "proposal") => void;
}

const WAVE_BARS = [0, 1, 2, 3];

function HeaderPill({
  icon,
  label,
  onClick,
  active,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`glass-card group flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:px-4 ${
        active ? "ring-2 ring-marigold" : ""
      }`}
    >
      <span className={`transition-colors duration-300 ${active ? "text-primary" : "text-terracotta group-hover:text-primary"}`}>
        {icon}
      </span>
      {children}
      <span className="hidden text-walnut md:inline">{label}</span>
    </button>
  );
}

export default function Header({ ambientOn, onToggleAmbient, onOpen }: HeaderProps) {
  return (
    <header className="glass-card sticky top-0 z-40 mx-auto mt-3 flex w-[calc(100%-1.5rem)] max-w-5xl items-center justify-between gap-3 rounded-4xl px-4 py-3 sm:px-6">
      {/* Portrait with halo */}
      <div className="halo flex shrink-0 items-center">
        <img
          src={portrait}
          alt="Portrait of Maharaj-ji wrapped in his warm blanket"
          width={1024}
          height={1024}
          className="h-12 w-12 rounded-full border-2 border-marigold/70 object-cover object-top shadow-md sm:h-14 sm:w-14"
        />
      </div>

      {/* Title */}
      <div className="min-w-0 text-center">
        <h1 className="truncate font-display text-lg font-semibold tracking-wide text-foreground-deep sm:text-2xl">
          Maharaj-ji Speaks
        </h1>
        <p className="truncate text-[0.7rem] font-medium tracking-[0.14em] text-walnut/80 uppercase sm:text-xs">
          Sub Ek • Love • Serve • Remember God
        </p>
      </div>

      {/* Quick access pills */}
      <nav aria-label="Devotion tools" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <HeaderPill icon={<Flower2 className="h-4 w-4" />} label="Daily Prasad" onClick={() => onOpen("prasad")}>
          <span className="text-marigold md:hidden" aria-hidden="true">🌸</span>
        </HeaderPill>

        <HeaderPill icon={<Bell className="h-4 w-4" />} label="Ambient Sound" onClick={onToggleAmbient} active={ambientOn}>
          {ambientOn && (
            <span className="flex h-4 items-end gap-[2px]" aria-hidden="true">
              {WAVE_BARS.map((i) => (
                <span
                  key={i}
                  className="sound-wave block w-[3px] rounded-full bg-primary"
                  style={{ height: "100%", animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          )}
        </HeaderPill>

        <HeaderPill icon={<JapaIcon className="h-4 w-4" />} label="Japa Counter" onClick={() => onOpen("japa")} />

        <HeaderPill icon={<MonitorPlay className="h-4 w-4" />} label="Darshan & Media" onClick={() => onOpen("media")} />

        <HeaderPill icon={<FileText className="h-4 w-4" />} label="Proposal Roadmap" onClick={() => onOpen("proposal")}>
          <span className="rounded-full bg-saffron/20 border border-saffron/40 px-1.5 py-0.5 text-[9px] font-bold text-saffron uppercase">
            Demo
          </span>
        </HeaderPill>

        <HeaderPill icon={<Settings className="h-4 w-4" />} label="Settings" onClick={() => onOpen("settings")} />
      </nav>
    </header>
  );
}
