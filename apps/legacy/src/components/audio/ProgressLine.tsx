import { useCallback, useRef } from "react";

interface ProgressLineProps {
  currentTime: number;
  duration: number;
  onSeek: (timeMs: number) => void;
  thin?: boolean;
}

export function ProgressLine({
  currentTime,
  duration,
  onSeek,
  thin = false,
}: ProgressLineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current || duration <= 0) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek],
  );

  return (
    <div
      ref={trackRef}
      className={`audio-progress-track group cursor-pointer ${thin ? "h-[3px]" : "h-2 rounded-full bg-black/[0.06]"}`}
      onClick={handleClick}
      role="slider"
      aria-valuenow={Math.round(currentTime)}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-label="Ses ilerleme"
      tabIndex={0}
    >
      <div
        className={`h-full rounded-full bg-primary-600 transition-[width] duration-75 ${thin ? "" : "group-hover:bg-primary-700"}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
