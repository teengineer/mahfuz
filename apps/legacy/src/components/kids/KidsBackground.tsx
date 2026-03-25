import { useMemo } from "react";

/**
 * Animated background for kids zone — floating stars, rainbow, trees, flowers, bugs, rocket.
 * All pure CSS animations, no JS timers.
 */
export function KidsBackground() {
  const stars = useMemo(() => generateItems(18, STAR_CHARS), []);
  const floaters = useMemo(() => generateFloaters(), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Rainbow arc at top */}
      <div className="kids-rainbow" />

      {/* Floating stars */}
      {stars.map((s) => (
        <span
          key={s.id}
          className="kids-float-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            opacity: s.opacity,
          }}
        >
          {s.char}
        </span>
      ))}

      {/* Scenery: trees, flowers, bugs */}
      {floaters.map((f) => (
        <span
          key={f.id}
          className={f.className}
          style={{
            left: `${f.x}%`,
            bottom: `${f.bottom}px`,
            fontSize: `${f.size}px`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        >
          {f.char}
        </span>
      ))}

      {/* Rocket */}
      <span className="kids-rocket">🚀</span>
    </div>
  );
}

const STAR_CHARS = ["⭐", "✨", "🌟", "💫", "⚡"];

const GROUND_ITEMS = [
  { char: "🌳", className: "kids-ground-sway", size: [28, 42] },
  { char: "🌲", className: "kids-ground-sway", size: [26, 38] },
  { char: "🌻", className: "kids-ground-bounce", size: [22, 32] },
  { char: "🌷", className: "kids-ground-bounce", size: [20, 28] },
  { char: "🌸", className: "kids-ground-bounce", size: [18, 26] },
  { char: "🌺", className: "kids-ground-bounce", size: [20, 28] },
  { char: "🐛", className: "kids-ground-crawl", size: [16, 22] },
  { char: "🐞", className: "kids-ground-crawl", size: [16, 22] },
  { char: "🦋", className: "kids-butterfly", size: [20, 28] },
  { char: "🐝", className: "kids-butterfly", size: [16, 22] },
];

interface StarItem {
  id: string;
  char: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface FloaterItem {
  id: string;
  char: string;
  className: string;
  x: number;
  bottom: number;
  size: number;
  delay: number;
  duration: number;
}

function generateItems(count: number, chars: string[]): StarItem[] {
  const items: StarItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `star-${i}`,
      char: chars[i % chars.length],
      x: (i * 37 + 11) % 95 + 2,
      y: (i * 23 + 7) % 70 + 5,
      size: 12 + (i % 4) * 4,
      delay: (i * 1.7) % 8,
      duration: 4 + (i % 5) * 1.5,
      opacity: 0.25 + (i % 3) * 0.12,
    });
  }
  return items;
}

function generateFloaters(): FloaterItem[] {
  const items: FloaterItem[] = [];
  for (let i = 0; i < GROUND_ITEMS.length; i++) {
    const g = GROUND_ITEMS[i];
    items.push({
      id: `ground-${i}`,
      char: g.char,
      className: g.className,
      x: (i * 31 + 5) % 90 + 3,
      bottom: g.className.includes("butterfly") ? 60 + (i % 3) * 80 : 8 + (i % 3) * 12,
      size: g.size[0] + ((i * 7) % (g.size[1] - g.size[0])),
      delay: (i * 2.1) % 6,
      duration: 3 + (i % 4) * 1.2,
    });
  }
  return items;
}
