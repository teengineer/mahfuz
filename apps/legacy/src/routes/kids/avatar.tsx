import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useKidsStore, useActiveKidsProfile } from "~/stores/useKidsStore";
import { useKidsAvatarStore } from "~/stores/useKidsAvatarStore";
import { AvatarDisplay } from "~/components/kids/AvatarDisplay";
import { BASE_AVATARS, AVATAR_ITEMS, KIDS_LEVELS } from "~/lib/kids-constants";
import type { AvatarItemCategory } from "~/lib/kids-constants";

export const Route = createFileRoute("/kids/avatar")({
  component: KidsAvatar,
});

function KidsAvatar() {
  const { t } = useTranslation();
  const profile = useActiveKidsProfile();
  const level = useKidsStore((s) => s.level);
  const updateProfile = useKidsStore((s) => s.updateProfile);
  const { ownedItems, getEquippedByCategory } = useKidsAvatarStore();

  const currentLevel = KIDS_LEVELS.find((l) => l.id === level) ?? KIDS_LEVELS[0];

  if (!profile) return null;

  const equippedHat = getEquippedByCategory("hat");
  const equippedBg = getEquippedByCategory("background");
  const equippedFrame = getEquippedByCategory("frame");
  const equippedAcc = getEquippedByCategory("accessory");

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-center text-2xl font-bold text-indigo-700">
        {t.kids.nav.avatar}
      </h1>

      {/* Avatar Preview */}
      <div className="mb-6 flex flex-col items-center">
        <AvatarDisplay name={profile.name} avatarId={profile.avatarId} level={level} size="xl" />
        <p className="mt-3 text-lg font-semibold text-gray-700">{profile.name}</p>

        {/* Equipped items summary */}
        {ownedItems.filter((i) => i.equipped).length > 0 && (
          <div className="mt-2 flex gap-2">
            {ownedItems
              .filter((i) => i.equipped)
              .map((i) => (
                <span
                  key={i.itemId}
                  className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-500"
                >
                  {i.itemId.replace(/^(hat|bg|frame|acc)-/, "")}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Base Avatar Picker */}
      <div className="mb-6">
        <h3 className="mb-2 text-[13px] font-bold text-gray-500">
          {t.kids.profile.selectAvatar}
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {BASE_AVATARS.map((av) => (
            <button
              key={av}
              onClick={() => updateProfile(profile.id, { avatarId: av })}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold transition-transform active:scale-90 ${
                profile.avatarId === av
                  ? "bg-indigo-200 ring-2 ring-indigo-400 text-indigo-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {av.replace("avatar-", "")}
            </button>
          ))}
        </div>
      </div>

      {/* Link to shop */}
      <Link
        to="/kids/rewards"
        className="block w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 text-center text-[15px] font-bold text-white shadow-lg active:scale-95"
      >
        {t.kids.rewards.avatarShop} →
      </Link>
    </div>
  );
}
