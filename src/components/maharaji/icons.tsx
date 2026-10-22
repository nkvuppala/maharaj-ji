/**
 * Hand-crafted, delicate line-art icons with warm devotional character.
 * All icons inherit currentColor for stroke and use soft saffron fills.
 */

interface IconProps {
  className?: string;
}

export function LotusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 4c1.6 1.8 2.4 3.8 2.4 6S13.6 14.4 12 16c-1.6-1.6-2.4-3.8-2.4-6S10.4 5.8 12 4Z"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M12 16c-1.2-2.6-3.2-4.3-6-4.8.4 3 2.3 5 6 4.8Zm0 0c1.2-2.6 3.2-4.3 6-4.8-.4 3-2.3 5-6 4.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M4 13.5c1.2 3.6 4.2 5.5 8 5.5s6.8-1.9 8-5.5c-2 1.6-4.8 2.4-8 2.4s-6-.8-8-2.4Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function DiyaIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path className="flame" d="M12 2.5c1.7 1.7 2.5 3.1 2.5 4.6a2.5 2.5 0 1 1-5 0c0-1.5.8-2.9 2.5-4.6Z" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M4 14.5h16c0 2.8-2.4 5-8 5s-8-2.2-8-5Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.5 12.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function JapaIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="6" r="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="17.7" cy="9" r="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="17.7" cy="15" r="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="18" r="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6.3" cy="15" r="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6.3" cy="9" r="2" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 8.2c-1.1 1-1.7 2.2-1.7 3.8s.6 2.8 1.7 3.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="1 2.4" />
    </svg>
  );
}

export function OmIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5.5 8.5c1.4-1.6 3.4-1.8 4.6-.5.9 1 .8 2.4-.2 3.3-1 .9-2.4.9-3.3 0M10 11.3c1.5.2 2.6 1.4 2.6 3 0 1.9-1.5 3.4-3.5 3.4-2.2 0-3.6-1.4-3.6-3.4 0-1.5.8-2.7 2.2-3.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12.6 14.3c.5-2.8 2.3-4.6 4.8-4.9-.5 1.4-.2 2.6.8 3.4 1.4 1.1 2.3 2.4 2.3 4 0 2-1.6 3.5-3.7 3.5-1.6 0-2.9-.8-3.5-2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 4.5l1.4 1.4L20 4.5M17 6.7l1.4 1.4L20 6.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function TempleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2.5v2M12 4.5l3 4H9l3-4Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6 8.5h12l1.5 3h-15l1.5-3Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M4.5 11.5v9h15v-9M9.5 20.5v-5h5v5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M3 20.5h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function HandsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8.5 12V5.8a1.3 1.3 0 0 1 2.6 0V11m0-1V4.3a1.3 1.3 0 0 1 2.6 0V11m0-.8V6.2a1.3 1.3 0 0 1 2.6 0v6.3c0 4-2.4 6.8-5.8 6.8-3 0-5.5-2.3-5.5-5.5v-3.3a1.3 1.3 0 0 1 2.6 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 14.5c1.5 1.2 3 1.2 4.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3c3.5 0 5.5 2.5 5.5 6 0 4.5 1.5 6 2 7H4.5c.5-1 2-2.5 2-7 0-3.5 2-6 5.5-6Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 3V1.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function MarigoldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const cx = 12 + Math.cos(angle) * 4.6;
        const cy = 12 + Math.sin(angle) * 4.6;
        return <circle key={i} cx={cx} cy={cy} r="3.4" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1" />;
      })}
      <circle cx="12" cy="12" r="2.6" fill="currentColor" fillOpacity="0.55" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function FeatherIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M19 5c-6.5 0-11 4.5-11 11l-.5 3M19 5c.8 6-2.5 11-9 11.5M19 5l-9.5 11M7 16c3.5 0 6-2 7-5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
