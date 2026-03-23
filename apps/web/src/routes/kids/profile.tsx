import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { useKidsStore, useActiveKidsProfile } from "~/stores/useKidsStore";
import { useKidsProgressStore } from "~/stores/useKidsProgressStore";
import { AvatarDisplay } from "~/components/kids/AvatarDisplay";
import { BASE_AVATARS, KIDS_LEVELS } from "~/lib/kids-constants";
import type { KidsProfile } from "~/stores/useKidsStore";

export const Route = createFileRoute("/kids/profile")({
  component: KidsProfile,
});

function KidsProfile() {
  const { t } = useTranslation();
  const profile = useActiveKidsProfile();
  const level = useKidsStore((s) => s.level);
  const stars = useKidsStore((s) => s.stars);
  const gems = useKidsStore((s) => s.gems);
  const streak = useKidsStore((s) => s.streak);
  const completedLetterCount = useKidsProgressStore((s) => s.completedLetterCount);
  const completedSurahCount = useKidsProgressStore((s) => s.completedSurahCount);

  const currentLevel = KIDS_LEVELS.find((l) => l.id === level) ?? KIDS_LEVELS[0];

  if (!profile) {
    return <ProfileSelector />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Avatar + Name */}
      <div className="mb-6 flex flex-col items-center">
        <AvatarDisplay name={profile.name} avatarId={profile.avatarId} level={level} size="lg" />
        <h1 className="mt-3 text-xl font-bold text-emerald-800">{profile.name}</h1>
        <p className="text-[14px] text-emerald-500">
          {t.kids.levels[currentLevel.key as keyof typeof t.kids.levels]}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label={t.kids.rewards.stars} value={`⭐ ${stars}`} color="bg-amber-50 text-amber-700" />
        <StatCard label={t.kids.rewards.gems} value={`💎 ${gems}`} color="bg-indigo-50 text-indigo-700" />
        <StatCard label={t.kids.parent.lettersLearned} value={`${completedLetterCount()}`} color="bg-blue-50 text-blue-700" />
        <StatCard label={t.kids.parent.surahsMemorized} value={`${completedSurahCount()}`} color="bg-purple-50 text-purple-700" />
        <StatCard label={t.kids.streak.current} value={`🔥 ${streak}`} color="bg-orange-50 text-orange-700" />
        <StatCard label={t.kids.rewards.level} value={`${level}`} color="bg-emerald-50 text-emerald-700" />
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Link
          to="/kids/avatar"
          className="block w-full rounded-2xl bg-white p-4 text-center text-[15px] font-semibold text-indigo-600 shadow-sm active:scale-[0.97]"
        >
          {t.kids.nav.avatar}
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-2xl p-3 text-center ${color}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[12px]">{label}</div>
    </div>
  );
}

function ProfileSelector() {
  const { t } = useTranslation();
  const profiles = useKidsStore((s) => s.profiles);
  const setActiveProfile = useKidsStore((s) => s.setActiveProfile);
  const addProfile = useKidsStore((s) => s.addProfile);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState(2018);
  const [selectedAvatar, setSelectedAvatar] = useState(BASE_AVATARS[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    const profile: KidsProfile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      birthYear,
      avatarId: selectedAvatar,
      ageGroup: new Date().getFullYear() - birthYear <= 7 ? "small" : "big",
    };
    addProfile(profile);
    setActiveProfile(profile);
    setShowForm(false);
    setName("");
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-center text-2xl font-bold text-emerald-700">
        {t.kids.profile.title}
      </h1>

      {/* Existing profiles */}
      {profiles.length > 0 && (
        <div className="mb-6 space-y-3">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProfile(p)}
              className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-transform active:scale-[0.97]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-600">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-[16px] font-semibold text-gray-800">{p.name}</div>
                <div className="text-[13px] text-gray-400">{p.birthYear}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add child */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-5 text-[15px] font-bold text-emerald-600 active:scale-95"
        >
          <span className="text-xl">+</span>
          {t.kids.profile.addChild}
        </button>
      ) : (
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-emerald-700">{t.kids.profile.addChild}</h2>

          {/* Name */}
          <label className="mb-1 block text-[13px] font-semibold text-gray-600">
            {t.kids.profile.name}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            placeholder="Ayse, Ali..."
            autoFocus
          />

          {/* Birth Year */}
          <label className="mb-1 block text-[13px] font-semibold text-gray-600">
            {t.kids.profile.birthYear}
          </label>
          <input
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(Number(e.target.value))}
            min={2010}
            max={2024}
            className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-[15px] focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />

          {/* Avatar Selection */}
          <label className="mb-2 block text-[13px] font-semibold text-gray-600">
            {t.kids.profile.selectAvatar}
          </label>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {BASE_AVATARS.map((av) => (
              <button
                key={av}
                onClick={() => setSelectedAvatar(av)}
                className={`flex h-14 w-14 items-center justify-center rounded-xl text-xl transition-transform active:scale-90 ${
                  selectedAvatar === av
                    ? "bg-emerald-200 ring-2 ring-emerald-400"
                    : "bg-gray-100"
                }`}
              >
                {av.replace("avatar-", "").padStart(1)}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-[14px] font-semibold text-gray-500"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="flex-1 rounded-xl bg-emerald-500 py-3 text-[14px] font-bold text-white shadow-md disabled:opacity-50"
            >
              {t.kids.profile.save}
            </button>
          </div>
        </div>
      )}

      {/* Back to main app */}
      <Link
        to="/browse"
        className="mt-6 block text-center text-[14px] font-medium text-gray-400"
      >
        {t.kids.nav.backToApp}
      </Link>
    </div>
  );
}
