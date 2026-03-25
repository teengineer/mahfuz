import { useEffect, useState } from "react";
import { BADGE_DEFINITIONS } from "@mahfuz/gamification";
import { useTranslation } from "~/hooks/useTranslation";
import { EmojiIcon } from "~/components/icons/EmojiIcon";

interface BadgeUnlockToastProps {
  badgeIds: string[];
  onDismiss: () => void;
}

export function BadgeUnlockToast({ badgeIds, onDismiss }: BadgeUnlockToastProps) {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (badgeIds.length > 0) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [badgeIds, onDismiss]);

  if (badgeIds.length === 0) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--theme-bg-elevated)] px-5 py-3 shadow-[var(--shadow-float)]">
        <div className="flex -space-x-1">
          {badgeIds.map((id) => {
            const badge = BADGE_DEFINITIONS.find((b) => b.id === id);
            return (
              <EmojiIcon key={id} emoji={badge?.icon || "🏅"} className="h-6 w-6" />
            );
          })}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[var(--theme-text)]">
            {t.memorize.badges.unlocked}
          </p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">
            {badgeIds
              .map((id) => (t.memorize.badges.names as Record<string, string>)[id] || id)
              .join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}
