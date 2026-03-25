import { memo, useState, useRef, useEffect, useCallback } from "react";
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

const SearchIcon = () => (
  <svg
    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-tertiary)]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
  </svg>
);

export const VersePicker = memo(function VersePicker({
  surahId,
  verseNum,
  maxVerse,
  onSurahChange,
  onVerseChange,
}: VersePickerProps) {
  const { t, locale } = useTranslation();
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  const [surahOpen, setSurahOpen] = useState(false);
  const [surahQuery, setSurahQuery] = useState("");
  const [verseOpen, setVerseOpen] = useState(false);
  const [verseQuery, setVerseQuery] = useState("");

  const surahRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);
  const surahInputRef = useRef<HTMLInputElement>(null);
  const verseInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (surahRef.current && !surahRef.current.contains(e.target as Node)) {
        setSurahOpen(false);
        setSurahQuery("");
      }
      if (verseRef.current && !verseRef.current.contains(e.target as Node)) {
        setVerseOpen(false);
        setVerseQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentSurah = chapters.find((ch) => ch.id === surahId);
  const surahDisplayName = currentSurah
    ? `${currentSurah.id}. ${getSurahName(currentSurah.id, currentSurah.translated_name.name, locale)}`
    : "";

  const filteredChapters = surahQuery
    ? chapters.filter((ch) => {
        const q = surahQuery.toLowerCase();
        const name = getSurahName(ch.id, ch.translated_name.name, locale).toLowerCase();
        return (
          String(ch.id).includes(q) ||
          name.includes(q) ||
          ch.name_arabic.includes(surahQuery) ||
          ch.name_simple.toLowerCase().includes(q)
        );
      })
    : chapters;

  const verseNumbers = Array.from({ length: maxVerse }, (_, i) => i + 1);
  const filteredVerses = verseQuery
    ? verseNumbers.filter((v) => String(v).includes(verseQuery))
    : verseNumbers;

  const handleSurahSelect = useCallback(
    (id: number) => {
      onSurahChange(id);
      setSurahOpen(false);
      setSurahQuery("");
    },
    [onSurahChange],
  );

  const handleVerseSelect = useCallback(
    (v: number) => {
      onVerseChange(v);
      setVerseOpen(false);
      setVerseQuery("");
    },
    [onVerseChange],
  );

  return (
    <div className="flex items-center gap-2">
      {/* Surah picker */}
      <div ref={surahRef} className="relative flex-1">
        <SearchIcon />
        <input
          ref={surahInputRef}
          type="text"
          value={surahOpen ? surahQuery : surahDisplayName}
          onChange={(e) => setSurahQuery(e.target.value)}
          onFocus={() => {
            setSurahOpen(true);
            setSurahQuery("");
          }}
          placeholder={t.discover.searchSurah ?? "Sure ara..."}
          className="w-full rounded-xl bg-[var(--theme-input-bg)] py-3 pl-10 pr-3 text-[13px] text-[var(--theme-text)] placeholder:text-[var(--theme-text-quaternary)] outline-none transition-colors focus:ring-2 focus:ring-primary-500/30"
        />
        {surahOpen && (
          <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-elevated)] shadow-[var(--shadow-float)] scrollbar-none">
            {filteredChapters.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-[var(--theme-text-tertiary)]">
                {t.common.noResults ?? "Sonuç yok"}
              </div>
            ) : (
              filteredChapters.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSurahSelect(ch.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--theme-hover-bg)] ${
                    ch.id === surahId
                      ? "font-semibold text-primary-600"
                      : "text-[var(--theme-text)]"
                  }`}
                >
                  <span className="w-8 shrink-0 text-right text-[var(--theme-text-tertiary)]">
                    {ch.id}
                  </span>
                  <span>{getSurahName(ch.id, ch.translated_name.name, locale)}</span>
                  <span className="mr-auto arabic-text text-[14px] text-[var(--theme-text-secondary)]" dir="rtl">
                    {ch.name_arabic}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Verse picker */}
      <div ref={verseRef} className="relative w-28">
        <SearchIcon />
        <input
          ref={verseInputRef}
          type="text"
          value={verseOpen ? verseQuery : `${t.common.verse} ${verseNum}`}
          onChange={(e) => setVerseQuery(e.target.value)}
          onFocus={() => {
            setVerseOpen(true);
            setVerseQuery("");
          }}
          placeholder={t.common.verse}
          className="w-full rounded-xl bg-[var(--theme-input-bg)] py-3 pl-10 pr-3 text-[13px] text-[var(--theme-text)] placeholder:text-[var(--theme-text-quaternary)] outline-none transition-colors focus:ring-2 focus:ring-primary-500/30"
        />
        {verseOpen && (
          <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-60 overflow-y-auto rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-elevated)] shadow-[var(--shadow-float)] scrollbar-none">
            {filteredVerses.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-[var(--theme-text-tertiary)]">
                {t.common.noResults ?? "Sonuç yok"}
              </div>
            ) : (
              filteredVerses.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleVerseSelect(v)}
                  className={`w-full px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--theme-hover-bg)] ${
                    v === verseNum
                      ? "font-semibold text-primary-600"
                      : "text-[var(--theme-text)]"
                  }`}
                >
                  {t.common.verse} {v}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
});
