import { memo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

interface VersePickerProps {
  surahId: number;
  verseNum: number;
  maxVerse: number;
  onSurahChange: (surahId: number) => void;
  onVerseChange: (verseNum: number) => void;
}

export const VersePicker = memo(function VersePicker({
  surahId,
  verseNum,
  maxVerse,
  onSurahChange,
  onVerseChange,
}: VersePickerProps) {
  const { t, locale } = useTranslation();
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  return (
    <div className="flex items-center gap-2">
      {/* Surah select */}
      <select
        value={surahId}
        onChange={(e) => onSurahChange(Number(e.target.value))}
        className="flex-1 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-3 py-2 text-[13px] text-[var(--theme-text)] outline-none"
      >
        {chapters.map((ch) => (
          <option key={ch.id} value={ch.id}>
            {ch.id}. {getSurahName(ch.id, ch.translated_name.name, locale)}
          </option>
        ))}
      </select>

      {/* Verse select */}
      <select
        value={verseNum}
        onChange={(e) => onVerseChange(Number(e.target.value))}
        className="w-24 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-3 py-2 text-[13px] text-[var(--theme-text)] outline-none"
      >
        {Array.from({ length: maxVerse }, (_, i) => i + 1).map((v) => (
          <option key={v} value={v}>
            {t.common.verse} {v}
          </option>
        ))}
      </select>
    </div>
  );
});
