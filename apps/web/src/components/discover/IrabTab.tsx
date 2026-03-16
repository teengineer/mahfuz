import { useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { syntaxQueryOptions } from "~/hooks/useDiscover";
import { useTranslation } from "~/hooks/useTranslation";
import { VersePicker } from "./VersePicker";
import { SyntaxTree } from "./SyntaxTree";
import { SyntaxLegend } from "./SyntaxLegend";

export function IrabTab() {
  const { t } = useTranslation();
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  const [surahId, setSurahId] = useState(1);
  const [verseNum, setVerseNum] = useState(1);

  const chapter = chapters.find((c) => c.id === surahId);
  const maxVerse = chapter?.verses_count ?? 7;

  const { data: syntaxData, isLoading } = useQuery(syntaxQueryOptions(surahId));
  const verseNodes = syntaxData?.verses?.[String(verseNum)];

  const handleSurahChange = (id: number) => {
    setSurahId(id);
    setVerseNum(1);
  };

  return (
    <div className="space-y-4">
      <VersePicker
        surahId={surahId}
        verseNum={verseNum}
        maxVerse={maxVerse}
        onSurahChange={handleSurahChange}
        onVerseChange={setVerseNum}
      />

      <SyntaxLegend />

      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-[14px] text-[var(--theme-text-tertiary)]">{t.common.loading}</p>
        </div>
      ) : verseNodes && verseNodes.length > 0 ? (
        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-4">
          <SyntaxTree nodes={verseNodes} />
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-[14px] text-[var(--theme-text-tertiary)]">{t.discover.noData}</p>
        </div>
      )}
    </div>
  );
}
