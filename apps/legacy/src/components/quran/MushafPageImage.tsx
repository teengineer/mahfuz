import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  qcfPageQueryOptions,
  loadQcfFont,
  getQcfFontFamily,
  useQcfPreload,
  type QcfWord,
} from "~/hooks/useQcfPage";
import { useAudioStore } from "~/stores/useAudioStore";
import { getJuzForPage } from "@mahfuz/shared";

interface MushafPageImageProps {
  pageNumber: number;
  onVerseTap?: (verseKey: string) => void;
  /** Hide page/juz footer (e.g. when shown in a spread with external info) */
  hideFooter?: boolean;
}

interface TooltipInfo {
  translation: string;
  transliteration: string;
  rect: DOMRect;
}

export function MushafPageImage({ pageNumber, onVerseTap, hideFooter }: MushafPageImageProps) {
  const { data, isLoading, error } = useQuery(qcfPageQueryOptions(pageNumber));
  const [fontReady, setFontReady] = useState(false);
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load the QCF font for this page
  useEffect(() => {
    setFontReady(false);
    loadQcfFont(pageNumber).then(
      () => setFontReady(true),
      () => setFontReady(true),
    );
  }, [pageNumber]);

  // Preload adjacent pages
  useQcfPreload(pageNumber);

  const fontFamily = getQcfFontFamily(pageNumber);

  const handleWordClick = useCallback(
    (word: QcfWord, el: HTMLElement) => {
      if (word.char_type_name === "word" || word.char_type_name === "end") {
        onVerseTap?.(word.verse_key);
      }
      // Show tooltip on tap (mobile)
      if (word.char_type_name === "word" && (word.translation || word.transliteration)) {
        const rect = el.getBoundingClientRect();
        setTooltip({
          translation: word.translation?.text ?? "",
          transliteration: word.transliteration?.text ?? "",
          rect,
        });
      }
    },
    [onVerseTap],
  );

  const handleWordHover = useCallback((word: QcfWord, el: HTMLElement) => {
    if (word.char_type_name !== "word") return;
    if (!word.translation && !word.transliteration) return;
    const rect = el.getBoundingClientRect();
    setTooltip({
      translation: word.translation?.text ?? "",
      transliteration: word.transliteration?.text ?? "",
      rect,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  // Clear tooltip on click outside
  useEffect(() => {
    if (!tooltip) return;
    const handler = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTooltip(null);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [tooltip]);

  // Build line numbers array
  const lineNumbers = useMemo(() => {
    if (!data) return [];
    return Array.from(data.lines.keys()).sort((a, b) => a - b);
  }, [data]);

  // Detect surah boundaries — which lines start a new surah
  const surahHeaders = useMemo(() => {
    if (!data) return new Map<number, string>();
    const headers = new Map<number, string>();
    let prevSurahId = "";
    for (const lineNum of lineNumbers) {
      const words = data.lines.get(lineNum) ?? [];
      for (const word of words) {
        const surahId = word.verse_key.split(":")[0];
        if (surahId !== prevSurahId) {
          // New surah starts on this line
          if (prevSurahId !== "") {
            // Not the first surah on this page — show header
            headers.set(lineNum, surahId);
          }
          prevSurahId = surahId;
        }
      }
    }
    return headers;
  }, [data, lineNumbers]);

  const juzNumber = getJuzForPage(pageNumber);

  // Skeleton while loading
  if (isLoading || !fontReady || !data) {
    return (
      <div className="mushaf-page">
        <div className="mushaf-cetvel-outer">
          <div className="mushaf-tezhip-band">
            <div className="mushaf-hatayi-pattern" />
            <div className="mushaf-cetvel-inner">
              <div className="mushaf-qcf-content" style={{ direction: "rtl" }}>
                {Array.from({ length: 15 }, (_, i) => (
                  <div key={i} className="mushaf-qcf-line-skeleton skeleton" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--theme-text-tertiary)]">
        <p>Sayfa yüklenemedi.</p>
      </div>
    );
  }

  return (
    <div className="mushaf-page" ref={containerRef}>
      <div className="mushaf-cetvel-outer">
        <div className="mushaf-tezhip-band">
          <div className="mushaf-hatayi-pattern" />
          <div className="mushaf-cetvel-inner">
            <div className="mushaf-qcf-content" style={{ direction: "rtl" }}>
              {lineNumbers.map((lineNum) => {
                const words = data.lines.get(lineNum) ?? [];
                const newSurahId = surahHeaders.get(lineNum);
                return (
                  <div key={lineNum}>
                    {newSurahId && (
                      <div className="mushaf-qcf-surah-divider">
                        <span className="mushaf-qcf-surah-badge">
                          سورة {toArabicSurahName(Number(newSurahId))}
                        </span>
                      </div>
                    )}
                    <p
                      className="mushaf-qcf-line"
                      style={{ fontFamily: `"${fontFamily}", "KFGQPC Uthmani Hafs", serif` }}
                    >
                      {words.map((word) => {
                        const isActive = currentVerseKey === word.verse_key;
                        return (
                          <span
                            key={word.id}
                            className={`mushaf-qcf-word${isActive ? " mushaf-qcf-word-active" : ""}`}
                            onClick={(e) => handleWordClick(word, e.currentTarget)}
                            onMouseEnter={(e) => handleWordHover(word, e.currentTarget)}
                            onMouseLeave={handleMouseLeave}
                            data-verse-key={word.verse_key}
                            data-char-type={word.char_type_name}
                          >
                            {word.code_v2}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Page/Juz info footer */}
      {!hideFooter && (
        <div className="mt-1.5 flex items-center justify-between px-2 text-[10px] text-[var(--theme-text-quaternary)]">
          <span>Cüz {juzNumber}</span>
          <span>{pageNumber}</span>
        </div>
      )}

      {/* Floating tooltip */}
      {tooltip && (tooltip.translation || tooltip.transliteration) && typeof document !== "undefined" &&
        createPortal(
          <div
            className="mushaf-tooltip mushaf-tooltip-visible"
            style={{ top: tooltip.rect.top - 8, left: tooltip.rect.left + tooltip.rect.width / 2 }}
          >
            {tooltip.translation && (
              <span className="block font-medium text-[var(--theme-text)]" style={{ fontSize: "13px" }}>
                {tooltip.translation}
              </span>
            )}
            {tooltip.transliteration && (
              <span className="block italic text-[var(--theme-text-tertiary)]" style={{ fontSize: "11px" }}>
                {tooltip.transliteration}
              </span>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

/** Minimal Arabic surah name lookup (first word of each surah name) */
const ARABIC_SURAH_NAMES: Record<number, string> = {
  1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 4: "النساء", 5: "المائدة",
  6: "الأنعام", 7: "الأعراف", 8: "الأنفال", 9: "التوبة", 10: "يونس",
  11: "هود", 12: "يوسف", 13: "الرعد", 14: "إبراهيم", 15: "الحجر",
  16: "النحل", 17: "الإسراء", 18: "الكهف", 19: "مريم", 20: "طه",
  21: "الأنبياء", 22: "الحج", 23: "المؤمنون", 24: "النور", 25: "الفرقان",
  26: "الشعراء", 27: "النمل", 28: "القصص", 29: "العنكبوت", 30: "الروم",
  31: "لقمان", 32: "السجدة", 33: "الأحزاب", 34: "سبأ", 35: "فاطر",
  36: "يس", 37: "الصافات", 38: "ص", 39: "الزمر", 40: "غافر",
  41: "فصلت", 42: "الشورى", 43: "الزخرف", 44: "الدخان", 45: "الجاثية",
  46: "الأحقاف", 47: "محمد", 48: "الفتح", 49: "الحجرات", 50: "ق",
  51: "الذاريات", 52: "الطور", 53: "النجم", 54: "القمر", 55: "الرحمن",
  56: "الواقعة", 57: "الحديد", 58: "المجادلة", 59: "الحشر", 60: "الممتحنة",
  61: "الصف", 62: "الجمعة", 63: "المنافقون", 64: "التغابن", 65: "الطلاق",
  66: "التحريم", 67: "الملك", 68: "القلم", 69: "الحاقة", 70: "المعارج",
  71: "نوح", 72: "الجن", 73: "المزمل", 74: "المدثر", 75: "القيامة",
  76: "الإنسان", 77: "المرسلات", 78: "النبأ", 79: "النازعات", 80: "عبس",
  81: "التكوير", 82: "الانفطار", 83: "المطففين", 84: "الانشقاق", 85: "البروج",
  86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
  91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين",
  96: "العلق", 97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات",
  101: "القارعة", 102: "التكاثر", 103: "العصر", 104: "الهمزة", 105: "الفيل",
  106: "قريش", 107: "الماعون", 108: "الكوثر", 109: "الكافرون", 110: "النصر",
  111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس",
};

function toArabicSurahName(surahId: number): string {
  return ARABIC_SURAH_NAMES[surahId] ?? `${surahId}`;
}
