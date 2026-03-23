import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { useKidsStore } from "~/stores/useKidsStore";
import { useKidsAvatarStore } from "~/stores/useKidsAvatarStore";
import { KIDS_BADGES, AVATAR_ITEMS, KIDS_LEVELS } from "~/lib/kids-constants";
import type { AvatarItemCategory } from "~/lib/kids-constants";

export const Route = createFileRoute("/kids/rewards")({
  component: KidsRewards,
});

function KidsRewards() {
  const { t } = useTranslation();
  const stars = useKidsStore((s) => s.stars);
  const gems = useKidsStore((s) => s.gems);
  const level = useKidsStore((s) => s.level);
  const spendGems = useKidsStore((s) => s.spendGems);
  const [tab, setTab] = useState<"badges" | "shop">("badges");

  const { ownedItems, unlockItem, equipItem } = useKidsAvatarStore();
  const currentLevel = KIDS_LEVELS.find((l) => l.id === level) ?? KIDS_LEVELS[0];

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Stats Row */}
      <div className="mb-6 flex items-center justify-center gap-6 rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-500">⭐ {stars}</div>
          <div className="text-[12px] text-gray-400">{t.kids.rewards.stars}</div>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-400">💎 {gems}</div>
          <div className="text-[12px] text-gray-400">{t.kids.rewards.gems}</div>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="text-center">
          <div
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: currentLevel.color }}
          >
            {level}
          </div>
          <div className="text-[12px] text-gray-400">
            {t.kids.levels[currentLevel.key as keyof typeof t.kids.levels]}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("badges")}
          className={`flex-1 rounded-xl py-2.5 text-[14px] font-bold transition-all ${
            tab === "badges"
              ? "bg-emerald-500 text-white shadow-md"
              : "bg-white text-gray-500"
          }`}
        >
          {t.kids.rewards.badges}
        </button>
        <button
          onClick={() => setTab("shop")}
          className={`flex-1 rounded-xl py-2.5 text-[14px] font-bold transition-all ${
            tab === "shop"
              ? "bg-indigo-500 text-white shadow-md"
              : "bg-white text-gray-500"
          }`}
        >
          {t.kids.rewards.avatarShop}
        </button>
      </div>

      {/* Badge Grid */}
      {tab === "badges" && (
        <div className="grid grid-cols-3 gap-3">
          {KIDS_BADGES.map((badge) => {
            const unlocked = false; // TODO: Check from DB/store
            return (
              <div
                key={badge.id}
                className={`flex flex-col items-center gap-1.5 rounded-2xl p-4 ${
                  unlocked ? "bg-white shadow-sm" : "bg-gray-50 opacity-50"
                }`}
              >
                <span className="text-3xl">{badge.icon}</span>
                <span className="text-center text-[11px] font-semibold text-gray-600">
                  {t.kids.badges[badge.id as keyof typeof t.kids.badges] ?? badge.id}
                </span>
                {!unlocked && (
                  <span className="text-[10px] text-gray-400">
                    {t.kids.rewards.locked}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Avatar Shop */}
      {tab === "shop" && (
        <div className="space-y-4">
          {(["hat", "background", "frame", "accessory"] as AvatarItemCategory[]).map((category) => {
            const items = AVATAR_ITEMS.filter((i) => i.category === category);
            return (
              <div key={category}>
                <h3 className="mb-2 text-[13px] font-bold capitalize text-gray-500">{category}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((item) => {
                    const owned = ownedItems.some((o) => o.itemId === item.id);
                    const equipped = ownedItems.some((o) => o.itemId === item.id && o.equipped);

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (equipped) return;
                          if (owned) {
                            equipItem(item.id);
                          } else if (spendGems(item.gemCost)) {
                            unlockItem(item.id, item.category);
                            equipItem(item.id);
                          }
                        }}
                        className={`flex items-center justify-between rounded-xl p-3 text-left transition-transform active:scale-95 ${
                          equipped
                            ? "bg-indigo-100 ring-2 ring-indigo-300"
                            : owned
                              ? "bg-white shadow-sm"
                              : "bg-gray-50"
                        }`}
                      >
                        <span className="text-[13px] font-medium text-gray-700">
                          {item.id.replace(/^(hat|bg|frame|acc)-/, "")}
                        </span>
                        {equipped ? (
                          <span className="text-[11px] font-bold text-indigo-500">
                            {t.kids.rewards.equipped}
                          </span>
                        ) : owned ? (
                          <span className="text-[11px] font-bold text-emerald-500">
                            {t.kids.rewards.equip}
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[11px] font-bold text-indigo-400">
                            💎 {item.gemCost}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
