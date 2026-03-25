import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const defaults: IconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PenIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

export function HighlighterIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="m9 11-6 6v3h9l3-3" />
      <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
    </svg>
  );
}

export function EraserIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  );
}

export function StickyNoteIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
      <path d="M15 3v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

export function PageJumpIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 12h4" />
      <path d="M10 16h4" />
    </svg>
  );
}

export function ExitIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

export function MushafViewIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M2 2.5h4.5a1.5 1.5 0 0 1 1.5 1.5v10S6.5 13 4.25 13 2 14 2 14V2.5z" />
      <path d="M14 2.5H9.5A1.5 1.5 0 0 0 8 4v10s1.5-1 3.75-1S14 14 14 14V2.5z" />
    </svg>
  );
}

export function FlowingViewIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M3 5h12M3 9h8M3 13h12M3 17h8" />
    </svg>
  );
}

export function FontSizeIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </svg>
  );
}

export function FocusModeIcon(props: IconProps) {
  return (
    <svg {...defaults} {...props}>
      <rect x="3" y="2" width="18" height="20" rx="2" />
      <path d="M7 7h10" />
      <path d="M7 11h7" />
      <path d="M7 15h10" />
      <path d="M17 17l4 4" strokeWidth="2" />
    </svg>
  );
}
