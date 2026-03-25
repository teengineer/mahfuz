import type { IconProps } from "./types";

export function FontIcon({ className = "w-[18px] h-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14l4.5-10h3L15 14" />
      <path d="M5.5 9.5h7" />
    </svg>
  );
}

export function DropletIcon({ className = "w-[18px] h-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2.5C9 2.5 4 8 4 11a5 5 0 0010 0c0-3-5-8.5-5-8.5z" />
    </svg>
  );
}

export function MicrophoneIcon({ className = "w-[18px] h-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6.5" y="2" width="5" height="9" rx="2.5" />
      <path d="M4 9a5 5 0 0010 0" />
      <path d="M9 14v2.5" />
    </svg>
  );
}

export function PaletteIcon({ className = "w-[18px] h-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="7" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="1.5" />
    </svg>
  );
}

export function BookOpenIcon({ className = "w-[18px] h-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3.5h5.5a1.5 1.5 0 011.5 1.5v10a1 1 0 00-1-1H2V3.5z" />
      <path d="M16 3.5h-5.5a1.5 1.5 0 00-1.5 1.5v10a1 1 0 011-1H16V3.5z" />
    </svg>
  );
}

export function GlobeIcon({ className = "w-[18px] h-[18px]" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="7" />
      <path d="M2 9h14" />
      <path d="M9 2a11.5 11.5 0 013 7 11.5 11.5 0 01-3 7 11.5 11.5 0 01-3-7 11.5 11.5 0 013-7z" />
    </svg>
  );
}
