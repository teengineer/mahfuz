import { useKidsAvatarStore } from "~/stores/useKidsAvatarStore";
import { KIDS_LEVELS } from "~/lib/kids-constants";
import type { BaseAvatarId } from "~/lib/kids-constants";

interface AvatarDisplayProps {
  name: string;
  avatarId: string;
  level: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLevel?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 40, text: "text-lg", badge: 14, badgeText: "text-[8px]" },
  md: { container: 64, text: "text-3xl", badge: 20, badgeText: "text-[10px]" },
  lg: { container: 96, text: "text-5xl", badge: 26, badgeText: "text-[12px]" },
  xl: { container: 128, text: "text-6xl", badge: 32, badgeText: "text-[14px]" },
} as const;

// Background patterns for purchased bg items
const BG_PATTERNS: Record<string, string> = {
  "bg-meadow": "from-green-200 to-emerald-300",
  "bg-sky": "from-sky-200 to-blue-300",
  "bg-desert": "from-amber-200 to-orange-300",
  "bg-ocean": "from-cyan-200 to-blue-400",
};

// Frame styles
const FRAME_STYLES: Record<string, string> = {
  "frame-gold": "ring-4 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.4)]",
  "frame-silver": "ring-4 ring-gray-300 shadow-[0_0_12px_rgba(156,163,175,0.4)]",
  "frame-stars": "ring-4 ring-purple-400 shadow-[0_0_12px_rgba(167,139,250,0.4)]",
};

// Hat emoji mappings
const HAT_EMOJIS: Record<string, string> = {
  "hat-crown": "👑",
  "hat-star": "⭐",
  "hat-flower": "🌸",
  "hat-moon": "🌙",
};

// Accessory emoji mappings
const ACC_EMOJIS: Record<string, string> = {
  "acc-book": "📖",
  "acc-lamp": "🏮",
  "acc-crescent": "☪️",
};

// Base avatar color schemes
const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  "avatar-1": { bg: "#10B981", text: "#ECFDF5" },
  "avatar-2": { bg: "#3B82F6", text: "#EFF6FF" },
  "avatar-3": { bg: "#F59E0B", text: "#FFFBEB" },
  "avatar-4": { bg: "#8B5CF6", text: "#F5F3FF" },
  "avatar-5": { bg: "#EC4899", text: "#FDF2F8" },
  "avatar-6": { bg: "#14B8A6", text: "#F0FDFA" },
  "avatar-7": { bg: "#F97316", text: "#FFF7ED" },
  "avatar-8": { bg: "#6366F1", text: "#EEF2FF" },
};

export function AvatarDisplay({
  name,
  avatarId,
  level,
  size = "md",
  showLevel = true,
  className = "",
}: AvatarDisplayProps) {
  const { ownedItems } = useKidsAvatarStore();

  const s = SIZE_MAP[size];
  const levelData = KIDS_LEVELS.find((l) => l.id === level) ?? KIDS_LEVELS[0];

  const equippedBg = ownedItems.find((i) => i.category === "background" && i.equipped);
  const equippedFrame = ownedItems.find((i) => i.category === "frame" && i.equipped);
  const equippedHat = ownedItems.find((i) => i.category === "hat" && i.equipped);
  const equippedAcc = ownedItems.find((i) => i.category === "accessory" && i.equipped);

  const avatarColor = AVATAR_COLORS[avatarId] ?? AVATAR_COLORS["avatar-1"];
  const bgGradient = equippedBg ? BG_PATTERNS[equippedBg.itemId] : null;
  const frameStyle = equippedFrame ? FRAME_STYLES[equippedFrame.itemId] : "";
  const hatEmoji = equippedHat ? HAT_EMOJIS[equippedHat.itemId] : null;
  const accEmoji = equippedAcc ? ACC_EMOJIS[equippedAcc.itemId] : null;

  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {/* Main avatar circle */}
      <div
        className={`flex items-center justify-center rounded-full font-bold shadow-md ${frameStyle} ${bgGradient ? `bg-gradient-to-br ${bgGradient}` : ""} ${s.text}`}
        style={{
          width: s.container,
          height: s.container,
          backgroundColor: bgGradient ? undefined : avatarColor.bg,
          color: avatarColor.text,
        }}
      >
        {initial}
      </div>

      {/* Hat (top-center) */}
      {hatEmoji && (
        <span
          className="absolute left-1/2 -translate-x-1/2 drop-shadow-sm"
          style={{
            top: size === "sm" ? -6 : size === "md" ? -8 : size === "lg" ? -10 : -14,
            fontSize: s.container * 0.35,
          }}
        >
          {hatEmoji}
        </span>
      )}

      {/* Accessory (bottom-right) */}
      {accEmoji && (
        <span
          className="absolute drop-shadow-sm"
          style={{
            bottom: -2,
            right: -2,
            fontSize: s.container * 0.25,
          }}
        >
          {accEmoji}
        </span>
      )}

      {/* Level badge (bottom-left) */}
      {showLevel && (
        <div
          className={`absolute -bottom-0.5 -left-0.5 flex items-center justify-center rounded-full font-bold text-white shadow-sm ${s.badgeText}`}
          style={{
            width: s.badge,
            height: s.badge,
            backgroundColor: levelData.color,
          }}
        >
          {level}
        </div>
      )}
    </div>
  );
}
