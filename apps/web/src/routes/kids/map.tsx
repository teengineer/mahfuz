import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useActiveKidsProfile, useKidsStore } from "~/stores/useKidsStore";
import { useKidsProgressStore } from "~/stores/useKidsProgressStore";
import { ARABIC_LETTERS, KIDS_SURAHS, KIDS_LEVELS, getLevelForStars } from "~/lib/kids-constants";

export const Route = createFileRoute("/kids/map")({
  component: KidsMap,
});

function KidsMap() {
  const { t } = useTranslation();
  const profile = useActiveKidsProfile();
  const level = useKidsStore((s) => s.level);
  const stars = useKidsStore((s) => s.stars);
  const letters = useKidsProgressStore((s) => s.letters);
  const surahs = useKidsProgressStore((s) => s.surahs);

  const completedLetters = Object.values(letters).filter((l) => l.completed).length;
  const completedSurahs = Object.values(surahs).filter((s) => s.memorized).length;
  const currentLevel = KIDS_LEVELS.find((l) => l.id === level) ?? KIDS_LEVELS[0];

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Welcome */}
      <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-md"
            style={{ backgroundColor: currentLevel.color }}
          >
            {profile?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-emerald-800">
              {t.kids.mascot.welcome.replace("Hafiz", profile?.name ?? "")}
            </h1>
            <p className="text-[14px] text-emerald-600">
              {t.kids.levels[currentLevel.key as keyof typeof t.kids.levels]} — ⭐ {stars}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link
          to="/kids/letters"
          className="flex flex-col items-center gap-2 rounded-2xl bg-blue-50 p-4 shadow-sm active:scale-95"
        >
          <span className="text-3xl">🔤</span>
          <span className="text-[15px] font-bold text-blue-700">
            {t.kids.letters.title}
          </span>
          <span className="text-[13px] text-blue-500">
            {completedLetters}/{ARABIC_LETTERS.length}
          </span>
        </Link>

        <Link
          to="/kids/surahs"
          className="flex flex-col items-center gap-2 rounded-2xl bg-purple-50 p-4 shadow-sm active:scale-95"
        >
          <span className="text-3xl">📖</span>
          <span className="text-[15px] font-bold text-purple-700">
            {t.kids.surahs.title}
          </span>
          <span className="text-[13px] text-purple-500">
            {completedSurahs}/{KIDS_SURAHS.length}
          </span>
        </Link>
      </div>

      {/* Action Cards */}
      <div className="space-y-3">
        <Link
          to="/kids/quests"
          className="flex items-center gap-4 rounded-2xl bg-amber-50 p-4 shadow-sm active:scale-95"
        >
          <span className="text-3xl">⭐</span>
          <div>
            <h3 className="text-[15px] font-bold text-amber-700">{t.kids.quests.title}</h3>
            <p className="text-[13px] text-amber-500">{t.kids.quests.daily}</p>
          </div>
          <svg className="ml-auto h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        <Link
          to="/kids/quizzes"
          className="flex items-center gap-4 rounded-2xl bg-emerald-50 p-4 shadow-sm active:scale-95"
        >
          <span className="text-3xl">🧠</span>
          <div>
            <h3 className="text-[15px] font-bold text-emerald-700">{t.kids.quizzes.title}</h3>
            <p className="text-[13px] text-emerald-500">{t.kids.quizzes.categories.prophets}, {t.kids.quizzes.categories.prayer}...</p>
          </div>
          <svg className="ml-auto h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        <Link
          to="/kids/rewards"
          className="flex items-center gap-4 rounded-2xl bg-indigo-50 p-4 shadow-sm active:scale-95"
        >
          <span className="text-3xl">🏆</span>
          <div>
            <h3 className="text-[15px] font-bold text-indigo-700">{t.kids.rewards.title}</h3>
            <p className="text-[13px] text-indigo-500">{t.kids.rewards.badges}, {t.kids.rewards.avatarShop}</p>
          </div>
          <svg className="ml-auto h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
