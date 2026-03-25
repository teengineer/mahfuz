import { useState, useEffect, useCallback } from "react";

export type MascotMood = "happy" | "thinking" | "celebrating" | "surprised" | "sleeping";

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
  onClick?: () => void;
}

const MOOD_COLORS: Record<MascotMood, { body: string; belly: string; cheek: string }> = {
  happy: { body: "#10B981", belly: "#6EE7B7", cheek: "#FBBF24" },
  thinking: { body: "#3B82F6", belly: "#93C5FD", cheek: "#FCD34D" },
  celebrating: { body: "#F59E0B", belly: "#FDE68A", cheek: "#FB923C" },
  surprised: { body: "#8B5CF6", belly: "#C4B5FD", cheek: "#F9A8D4" },
  sleeping: { body: "#6B7280", belly: "#D1D5DB", cheek: "#FDE68A" },
};

const MOOD_ANIMATIONS: Record<MascotMood, string> = {
  happy: "animate-[bounce_2s_ease-in-out_infinite]",
  thinking: "animate-[pulse_3s_ease-in-out_infinite]",
  celebrating: "animate-[spin_1s_ease-in-out_1]",
  surprised: "animate-[ping_0.5s_ease-in-out_1]",
  sleeping: "animate-[pulse_4s_ease-in-out_infinite]",
};

export function Mascot({ mood = "happy", size = 80, className = "", onClick }: MascotProps) {
  const colors = MOOD_COLORS[mood];
  const anim = mood === "celebrating" ? "animate-[bounce_0.5s_ease-in-out_3]" : MOOD_ANIMATIONS[mood];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex shrink-0 items-center justify-center transition-transform active:scale-90 ${anim} ${className}`}
      style={{ width: size, height: size }}
      aria-label="Hafız"
    >
      <svg viewBox="0 0 100 100" width={size} height={size} fill="none">
        {/* Body */}
        <ellipse cx="50" cy="55" rx="32" ry="35" fill={colors.body} />
        {/* Belly */}
        <ellipse cx="50" cy="62" rx="20" ry="22" fill={colors.belly} />
        {/* Left wing */}
        <ellipse cx="22" cy="50" rx="10" ry="16" fill={colors.body} transform="rotate(-15 22 50)" opacity={0.8} />
        {/* Right wing */}
        <ellipse cx="78" cy="50" rx="10" ry="16" fill={colors.body} transform="rotate(15 78 50)" opacity={0.8} />
        {/* Head */}
        <circle cx="50" cy="30" r="22" fill={colors.body} />
        {/* Face circle (lighter) */}
        <circle cx="50" cy="32" r="16" fill={colors.belly} opacity={0.5} />
        {/* Eyes */}
        {mood === "sleeping" ? (
          <>
            <path d="M40 28 L36 30 L40 32" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M60 28 L56 30 L60 32" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" fill="none" />
          </>
        ) : mood === "surprised" ? (
          <>
            <circle cx="40" cy="28" r="5" fill="white" />
            <circle cx="60" cy="28" r="5" fill="white" />
            <circle cx="40" cy="28" r="3" fill="#1F2937" />
            <circle cx="60" cy="28" r="3" fill="#1F2937" />
          </>
        ) : (
          <>
            <circle cx="40" cy="28" r="4" fill="white" />
            <circle cx="60" cy="28" r="4" fill="white" />
            <circle cx="41" cy="29" r="2.5" fill="#1F2937" />
            <circle cx="61" cy="29" r="2.5" fill="#1F2937" />
            {/* Eye sparkle */}
            <circle cx="42.5" cy="27.5" r="1" fill="white" />
            <circle cx="62.5" cy="27.5" r="1" fill="white" />
          </>
        )}
        {/* Beak */}
        <path d="M46 35 L50 40 L54 35" fill="#F59E0B" stroke="#D97706" strokeWidth="0.5" />
        {/* Cheeks */}
        <circle cx="34" cy="34" r="4" fill={colors.cheek} opacity={0.5} />
        <circle cx="66" cy="34" r="4" fill={colors.cheek} opacity={0.5} />
        {/* Crown/hat (celebrating) */}
        {mood === "celebrating" && (
          <>
            <path d="M35 12 L42 18 L50 8 L58 18 L65 12 L62 22 L38 22 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="0.5" />
            <circle cx="42" cy="14" r="2" fill="#EF4444" />
            <circle cx="50" cy="10" r="2" fill="#3B82F6" />
            <circle cx="58" cy="14" r="2" fill="#10B981" />
          </>
        )}
        {/* Thought bubble (thinking) */}
        {mood === "thinking" && (
          <>
            <circle cx="75" cy="18" r="3" fill="white" opacity={0.8} />
            <circle cx="80" cy="12" r="4" fill="white" opacity={0.8} />
            <circle cx="87" cy="6" r="5" fill="white" opacity={0.8} />
          </>
        )}
        {/* Zzz (sleeping) */}
        {mood === "sleeping" && (
          <text x="68" y="20" fontSize="12" fontWeight="bold" fill="#6B7280" opacity={0.6}>
            zzz
          </text>
        )}
        {/* Feet */}
        <ellipse cx="40" cy="88" rx="8" ry="4" fill="#F59E0B" />
        <ellipse cx="60" cy="88" rx="8" ry="4" fill="#F59E0B" />
        {/* Tail feathers */}
        <path d="M50 85 Q45 92 38 95" stroke={colors.body} strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M50 85 Q55 92 62 95" stroke={colors.body} strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    </button>
  );
}

// ── Mascot Speech Bubble ────────────────────────────────────────

interface MascotSpeechProps {
  message: string;
  mood?: MascotMood;
  mascotSize?: number;
  visible?: boolean;
  onDismiss?: () => void;
  position?: "left" | "right" | "center";
}

export function MascotSpeech({
  message,
  mood = "happy",
  mascotSize = 64,
  visible = true,
  onDismiss,
  position = "left",
}: MascotSpeechProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [typing, setTyping] = useState(true);

  // Typewriter effect
  useEffect(() => {
    if (!visible) {
      setDisplayedText("");
      setTyping(true);
      return;
    }
    setDisplayedText("");
    setTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i <= message.length) {
        setDisplayedText(message.slice(0, i));
      } else {
        setTyping(false);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [message, visible]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  if (!visible) return null;

  const posClass =
    position === "left"
      ? "flex-row"
      : position === "right"
        ? "flex-row-reverse"
        : "flex-col items-center";

  return (
    <div className={`flex items-end gap-2 ${posClass}`} onClick={handleDismiss}>
      <Mascot mood={mood} size={mascotSize} />
      <div className="relative max-w-[240px] rounded-2xl bg-white px-4 py-3 shadow-lg">
        {/* Speech pointer */}
        <div
          className={`absolute bottom-3 h-3 w-3 rotate-45 bg-white ${
            position === "right" ? "right-[-6px]" : "left-[-6px]"
          }`}
        />
        <p className="relative text-[14px] font-medium leading-snug text-gray-700">
          {displayedText}
          {typing && <span className="ml-0.5 inline-block animate-pulse text-emerald-400">|</span>}
        </p>
      </div>
    </div>
  );
}

// ── Floating Mascot (for layout corner) ─────────────────────────

interface FloatingMascotProps {
  messages: string[];
  mood?: MascotMood;
  intervalMs?: number;
}

export function FloatingMascot({ messages, mood = "happy", intervalMs = 30000 }: FloatingMascotProps) {
  const [showSpeech, setShowSpeech] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  // Show speech periodically
  useEffect(() => {
    if (messages.length === 0) return;
    // Show first message after 3s
    const initialTimer = setTimeout(() => {
      setShowSpeech(true);
    }, 3000);

    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % messages.length);
      setShowSpeech(true);
    }, intervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [messages, intervalMs]);

  // Auto-hide after 5s
  useEffect(() => {
    if (!showSpeech) return;
    const timer = setTimeout(() => setShowSpeech(false), 6000);
    return () => clearTimeout(timer);
  }, [showSpeech, msgIndex]);

  return (
    <div className="fixed bottom-[140px] left-3 z-20 lg:bottom-6 lg:left-4">
      {showSpeech && messages.length > 0 ? (
        <MascotSpeech
          message={messages[msgIndex]}
          mood={mood}
          mascotSize={56}
          visible
          onDismiss={() => setShowSpeech(false)}
          position="left"
        />
      ) : (
        <Mascot
          mood={mood}
          size={48}
          onClick={() => {
            setShowSpeech(true);
            setMsgIndex((i) => (i + 1) % Math.max(messages.length, 1));
          }}
        />
      )}
    </div>
  );
}
