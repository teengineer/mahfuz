import { useState, useCallback } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { syntaxQueryOptions } from "~/hooks/useDiscover";
import { useTranslation } from "~/hooks/useTranslation";
import { VersePicker } from "./VersePicker";
import { SyntaxTree } from "./SyntaxTree";
import { SyntaxLegend } from "./SyntaxLegend";
import { IrabExamples } from "./IrabExamples";

export function IrabTab() {
  const { t } = useTranslation();
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  const [surahId, setSurahId] = useState(1);
  const [verseNum, setVerseNum] = useState(1);
  const [highlightPos, setHighlightPos] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  const chapter = chapters.find((c) => c.id === surahId);
  const maxVerse = chapter?.verses_count ?? 7;

  const { data: syntaxData, isLoading } = useQuery(syntaxQueryOptions(surahId));
  const verseNodes = syntaxData?.verses?.[String(verseNum)];

  const handleSurahChange = (id: number) => {
    setSurahId(id);
    setVerseNum(1);
    setHighlightPos(null);
    setExplanation(null);
  };

  const handleVerseChange = (v: number) => {
    setVerseNum(v);
    setHighlightPos(null);
    setExplanation(null);
  };

  const handleExampleSelect = useCallback((sid: number, vn: number, hp: number, exp: string) => {
    setSurahId(sid);
    setVerseNum(vn);
    setHighlightPos(hp);
    setExplanation(exp);
  }, []);

  const dismissExplanation = () => {
    setExplanation(null);
    setHighlightPos(null);
  };

  return (
    <div className="space-y-5">
      <IrabExamples onSelect={handleExampleSelect} />

      <VersePicker
        surahId={surahId}
        verseNum={verseNum}
        maxVerse={maxVerse}
        onSurahChange={handleSurahChange}
        onVerseChange={handleVerseChange}
      />

      <SyntaxLegend />

      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-[14px] text-[var(--theme-text-tertiary)]">{t.common.loading}</p>
        </div>
      ) : verseNodes && verseNodes.length > 0 ? (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-5 shadow-[var(--shadow-card)]">
          {/* Explanation banner */}
          {explanation && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-[var(--theme-primary-light,rgba(59,130,246,0.08))] px-4 py-3">
              <p className="flex-1 text-[13px] leading-snug text-[var(--theme-text)]">{explanation}</p>
              <button
                type="button"
                onClick={dismissExplanation}
                className="flex-shrink-0 rounded-md p-0.5 text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text)]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
          <SyntaxTree nodes={verseNodes} highlightPosition={highlightPos} />
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-[14px] text-[var(--theme-text-tertiary)]">{t.discover.noData}</p>
        </div>
      )}
    </div>
  );
}
