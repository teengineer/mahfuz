import { useEffect, useState } from "react";

type CelebrationType = "confetti" | "stars" | "levelUp" | "badge";

interface CelebrationOverlayProps {
  type: CelebrationType;
  visible: boolean;
  onComplete?: () => void;
  message?: string;
}

const CONFETTI_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#EF4444", "#14B8A6"];
const STAR_CHARS = ["⭐", "🌟", "✨", "💫"];

export function CelebrationOverlay({ type, visible, onComplete, message }: CelebrationOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) { setShow(false); return; }
    setShow(true);
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, type === "levelUp" ? 3000 : 2000);
    return () => clearTimeout(timer);
  }, [visible, type, onComplete]);

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Confetti / Stars particles */}
      {(type === "confetti" || type === "stars" || type === "badge") && (
        <div className="absolute inset-0">
          {Array.from({ length: type === "stars" ? 12 : 24 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.5;
            const duration = 1.5 + Math.random();
            const size = type === "stars" ? 20 + Math.random() * 16 : 8 + Math.random() * 8;
            const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];

            return type === "stars" || type === "badge" ? (
              <span
                key={i}
                className="absolute animate-[fall_var(--dur)_ease-out_var(--delay)_forwards] opacity-0"
                style={{
                  left: `${left}%`,
                  top: "-20px",
                  fontSize: size,
                  "--delay": `${delay}s`,
                  "--dur": `${duration}s`,
                } as React.CSSProperties}
              >
                {STAR_CHARS[i % STAR_CHARS.length]}
              </span>
            ) : (
              <div
                key={i}
                className="absolute animate-[fall_var(--dur)_ease-out_var(--delay)_forwards] rounded-sm opacity-0"
                style={{
                  left: `${left}%`,
                  top: "-20px",
                  width: size,
                  height: size * (0.6 + Math.random() * 0.8),
                  backgroundColor: color,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  "--delay": `${delay}s`,
                  "--dur": `${duration}s`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      {/* Level up burst */}
      {type === "levelUp" && (
        <div className="flex h-full items-center justify-center">
          <div className="animate-[scaleIn_0.5s_ease-out_forwards] text-center opacity-0">
            <div className="text-7xl">🎉</div>
            {message && (
              <div className="mt-4 rounded-2xl bg-white/90 px-8 py-4 shadow-xl backdrop-blur-sm">
                <p className="text-xl font-bold text-emerald-700">{message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS keyframes injected via style tag */}
      <style>{`
        @keyframes fall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
