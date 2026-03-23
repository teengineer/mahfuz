import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useKidsProgressStore } from "~/stores/useKidsProgressStore";
import { KIDS_SURAHS } from "~/lib/kids-constants";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "~/lib/query-keys";
import type { Chapter } from "@mahfuz/shared/types";

export const Route = createFileRoute("/kids/surahs")({
  component: KidsSurahs,
});

function KidsSurahs() {
  const { t } = useTranslation();
  const surahProgress = useKidsProgressStore((s) => s.surahs);

  const { data: chapters } = useQuery<Chapter[]>({
    queryKey: QUERY_KEYS.chapters(),
  });

  const completedCount = Object.values(surahProgress).filter((s) => s.memorized).length;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-purple-700">{t.kids.surahs.title}</h1>
        <p className="mt-1 text-[14px] text-purple-500">{t.kids.surahs.subtitle}</p>
        <p className="mt-2 text-[13px] font-semibold text-purple-400">
          {completedCount}/{KIDS_SURAHS.length}
        </p>
      </div>

      {/* Difficulty Groups */}
      {(["easy", "medium", "hard"] as const).map((difficulty) => {
        const group = KIDS_SURAHS.filter((s) => s.difficulty === difficulty);
        if (group.length === 0) return null;

        return (
          <div key={difficulty} className="mb-6">
            <h2
              className={`mb-3 text-[14px] font-bold ${
                difficulty === "easy"
                  ? "text-emerald-600"
                  : difficulty === "medium"
                    ? "text-amber-600"
                    : "text-red-500"
              }`}
            >
              {t.kids.surahs.difficulty[difficulty]}
            </h2>
            <div className="space-y-2">
              {group.map((kidsSurah) => {
                const chapter = chapters?.find((c) => c.id === kidsSurah.id);
                const progress = surahProgress[kidsSurah.id];
                const steps = [
                  progress?.listened,
                  progress?.repeated,
                  progress?.ordered,
                  progress?.filled,
                  progress?.memorized,
                ].filter(Boolean).length;

                return (
                  <button
                    key={kidsSurah.id}
                    className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left shadow-sm transition-transform active:scale-[0.97] ${
                      progress?.memorized
                        ? "bg-emerald-50 ring-2 ring-emerald-200"
                        : "bg-white"
                    }`}
                  >
                    {/* Surah number */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[14px] font-bold text-purple-600">
                      {kidsSurah.id}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-gray-800">
                          {chapter?.name_simple ?? `Sure ${kidsSurah.id}`}
                        </span>
                        {progress?.certificateAt && (
                          <span className="text-[12px]">📜</span>
                        )}
                      </div>
                      <span className="text-[12px] text-gray-400">
                        {kidsSurah.verseCount} {t.common.verse}
                      </span>
                    </div>

                    {/* Progress dots */}
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-2 rounded-full ${
                            i < steps ? "bg-emerald-400" : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
