import { BADGE_DEFINITIONS } from "@mahfuz/gamification";
import type { UserBadgeEntry } from "@mahfuz/db";
import { useTranslation } from "~/hooks/useTranslation";
import { EmojiIcon } from "~/components/icons/EmojiIcon";

interface BadgeGridProps {
  badges: UserBadgeEntry[];
}

export function BadgeGrid({ badges }: BadgeGridProps) {
  const { t } = useTranslation();
  const unlockedSet = new Map(badges.map((b) => [b.badgeId, b.unlockedAt]));

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-base font-semibold text-[var(--theme-text)]">
        {t.memorize.badges.title}
      </h3>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {BADGE_DEFINITIONS.map((badge) => {
          const unlockedAt = unlockedSet.get(badge.id);
          const isUnlocked = !!unlockedAt;
          const badgeName = (t.memorize.badges.names as Record<string, string>)[badge.id] || badge.id;

          return (
            <div
              key={badge.id}
              className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all ${
                isUnlocked
                  ? "bg-[var(--theme-hover-bg)]"
                  : "opacity-40 grayscale"
              }`}
              title={badgeName}
            >
              <EmojiIcon emoji={badge.icon} className="h-6 w-6" />
              <span className="text-[11px] font-medium leading-tight text-[var(--theme-text-secondary)]">
                {badgeName}
              </span>
              {isUnlocked && (
                <span className="text-[10px] text-[var(--theme-text-quaternary)]">
                  {new Date(unlockedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
