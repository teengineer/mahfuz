import { useState, useEffect, useCallback, memo } from "react";
import type { Verse } from "@mahfuz/shared/types";
import { Link } from "@tanstack/react-router";
import { WordByWord } from "./WordByWord";
import { TranslationBlock } from "./TranslationBlock";
import { usePreferencesStore, getActiveColors } from "~/stores/usePreferencesStore";
import type { ViewMode } from "~/stores/usePreferencesStore";
import { useAudioStore } from "~/stores/useAudioStore";
import { useVerseBookmarks } from "~/stores/useVerseBookmarks";
import { useTranslation } from "~/hooks/useTranslation";
import { Popover, PopoverTrigger, PopoverContent } from "~/components/ui/Popover";
import { useShallow } from "zustand/react/shallow";

interface AyahTextProps {
  verse: Verse;
  viewMode?: ViewMode;
  onPlayFromVerse?: (verseKey: string) => void;
  onTogglePlayPause?: () => void;
}

export const AyahText = memo(function AyahText({
  verse,
  viewMode: viewModeProp,
  onPlayFromVerse,
  onTogglePlayPause,
}: AyahTextProps) {
  const { t } = useTranslation();

  // Consolidated preferences selector — single subscription instead of 8
  const prefs = usePreferencesStore(useShallow((s) => ({
    viewMode: s.viewMode,
    showWordByWord: s.showWordByWord,
    colorizeWords: s.colorizeWords,
    colorPaletteId: s.colorPaletteId,
    normalArabicFontSize: s.normalArabicFontSize,
    normalTranslationFontSize: s.normalTranslationFontSize,
    normalShowTranslation: s.normalShowTranslation,
    normalShowWordHover: s.normalShowWordHover,
    normalHoverShowTranslation: s.normalHoverShowTranslation,
    normalHoverShowTransliteration: s.normalHoverShowTransliteration,
    normalHoverTextSize: s.normalHoverTextSize,
    wbwShowTranslation: s.wbwShowTranslation,
  })));

  const colors = getActiveColors({ colorPaletteId: prefs.colorPaletteId });
  const viewMode = viewModeProp ?? prefs.viewMode;
  const isWbw = viewMode === "metin" && prefs.showWordByWord;
  const showTranslation = isWbw ? prefs.wbwShowTranslation : prefs.normalShowTranslation;

  // Audio — single consolidated selector to minimize re-renders
  const audioState = useAudioStore(useCallback((s) => {
    if (s.currentVerseKey !== verse.verse_key) {
      return null;
    }
    return {
      playbackState: s.playbackState,
      wordPosition: s.playbackState === "playing" ? s.currentWordPosition : null,
    };
  }, [verse.verse_key]));
  const isCurrentVerse = audioState !== null;
  const activeWordPos = audioState?.wordPosition ?? null;
  const isAudioPlaying = audioState !== null && (audioState.playbackState === "playing" || audioState.playbackState === "paused");
  const playbackState = audioState?.playbackState ?? null;

  // Bookmark
  const isBookmarked = useVerseBookmarks((s) => s.bookmarks.some((b) => b.verseKey === verse.verse_key));
  const toggleBookmark = useVerseBookmarks((s) => s.toggleBookmark);
  const [bookmarkPop, setBookmarkPop] = useState(false);

  // Tap-to-reveal: local state for temporarily showing translation
  const [revealed, setRevealed] = useState(false);

  // Reset revealed when showTranslation becomes true
  useEffect(() => {
    if (showTranslation) setRevealed(false);
  }, [showTranslation]);

  const effectiveShowTranslation = showTranslation || revealed;

  const isPlayingThisVerse = isCurrentVerse && isAudioPlaying;

  // Copy to clipboard
  const [expandedTranslations, setExpandedTranslations] = useState<Set<number>>(
    () => new Set([0]),
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const arabicText = verse.words
      ? verse.words
          .filter((w) => w.char_type_name === "word")
          .map((w) => w.text_uthmani)
          .join(" ")
      : verse.text_uthmani;

    const parts = [verse.verse_key, "", arabicText];

    if (verse.translations) {
      const expanded = verse.translations.length === 1
        ? verse.translations
        : verse.translations.filter((_, i) => expandedTranslations.has(i));

      for (const t of expanded) {
        const plainText = t.text.replace(/<[^>]*>/g, "");
        parts.push("", `${t.resource_name}: ${plainText}`);
      }
    }

    await navigator.clipboard.writeText(parts.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [verse, expandedTranslations]);

  // Share
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const arabicText = verse.words
      ? verse.words
          .filter((w) => w.char_type_name === "word")
          .map((w) => w.text_uthmani)
          .join(" ")
      : verse.text_uthmani;

    const shareText = `${verse.verse_key}\n\n${arabicText}`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // user cancelled share — ignore
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    }
  }, [verse]);

  // Bookmark handler
  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggleBookmark(verse.verse_key);
    if (added) {
      setBookmarkPop(true);
      setTimeout(() => setBookmarkPop(false), 500);
    }
  }, [verse.verse_key, toggleBookmark]);

  // Parse surahId and verseNum from verse_key
  const [surahId, verseNum] = verse.verse_key.split(":");

  // More menu state
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div
      id={`verse-${verse.verse_key}`}
      role="article"
      aria-label={`${t.quranReader.verseLabel} ${verse.verse_key}`}
      className={`animate-fade-in group px-4 py-8 transition-colors sm:px-6 sm:py-10 ${
        isCurrentVerse && isAudioPlaying
          ? "bg-[var(--theme-highlight-bg)]"
          : "hover:bg-[var(--theme-hover-bg)]"
      } ${!showTranslation && !revealed ? "cursor-pointer" : ""}`}
      onClick={
        !showTranslation && !revealed
          ? () => setRevealed(true)
          : undefined
      }
    >
      {/* Action bar — visible on hover/focus/active verse */}
      <div className={`mb-3 flex items-center justify-between transition-opacity sm:ml-[44px] ${
        isCurrentVerse && isAudioPlaying
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
      }`}>
        {/* Left group: verse key + play + bookmark */}
        <div className="flex items-center gap-1">
          <span className="mr-1 select-all text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">
            {verse.verse_key}
          </span>
          {onPlayFromVerse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isPlayingThisVerse && onTogglePlayPause) {
                  onTogglePlayPause();
                } else {
                  onPlayFromVerse(verse.verse_key);
                }
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all sm:h-6 sm:w-6 ${
                isPlayingThisVerse
                  ? `bg-primary-600 text-white shadow-sm ${playbackState === "playing" ? "animate-pulse-ring" : ""}`
                  : "text-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-tertiary)]"
              }`}
              aria-label={
                isPlayingThisVerse
                  ? `${t.quranReader.pauseVerseAudio} ${verse.verse_key}`
                  : `${t.quranReader.playFromVerse} ${verse.verse_key}`
              }
            >
              <svg className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 24 24" fill="currentColor">
                {isPlayingThisVerse && playbackState === "playing" ? (
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                ) : (
                  <path d="M8 5.14v14l11-7-11-7z" />
                )}
              </svg>
            </button>
          )}
          <button
            onClick={handleBookmark}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all sm:h-6 sm:w-6 ${
              isBookmarked
                ? "text-amber-500"
                : "text-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-tertiary)]"
            } ${bookmarkPop ? "animate-bookmark-pop" : ""}`}
            aria-label={isBookmarked ? t.quranReader.bookmarkVerseRemove : t.quranReader.bookmarkVerse}
          >
            <svg className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {/* Right group: copy + share + more */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all sm:h-6 sm:w-6 ${
              copied
                ? "animate-copy-flash bg-green-500 text-white"
                : "text-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-tertiary)]"
            }`}
            aria-label={t.quranReader.copy}
          >
            <svg className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              {copied ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              ) : (
                <>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </>
              )}
            </svg>
          </button>
          <button
            onClick={handleShare}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all sm:h-6 sm:w-6 ${
              shared
                ? "animate-copy-flash bg-green-500 text-white"
                : "text-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-tertiary)]"
            }`}
            aria-label={t.quranReader.shareVerse}
          >
            <svg className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              {shared ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              )}
            </svg>
          </button>
          <Popover open={moreOpen} onOpenChange={setMoreOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--theme-text-quaternary)] transition-all hover:text-[var(--theme-text-tertiary)] sm:h-6 sm:w-6"
                aria-label={t.quranReader.moreActions}
              >
                <svg className="h-3.5 w-3.5 sm:h-3 sm:w-3" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1">
              <Link
                to="/$surahId/$verseNum"
                params={{ surahId: surahId!, verseNum: verseNum! }}
                onClick={() => setMoreOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.quranReader.goToVerseDetail}
              </Link>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {/* Arabic text with inline end-of-ayah marker */}
      <div className="mb-5" dir="rtl">
        {isWbw && verse.words ? (
          <WordByWord
            words={verse.words}
            colorizeWords={prefs.colorizeWords}
            colors={colors}
            activeWordPosition={activeWordPos}
          />
        ) : (
          <p className="arabic-text leading-[2.8] text-[var(--theme-text)]" style={{ fontSize: `calc(1.75rem * ${prefs.normalArabicFontSize})` }}>
            {verse.words
              ? verse.words
                  .filter((w) => w.char_type_name === "word")
                  .map((w, i) => {
                    const isActiveWord =
                      activeWordPos !== null && w.position === activeWordPos;
                    const hasTranslation = prefs.normalHoverShowTranslation && w.translation?.text;
                    const hasTransliteration = prefs.normalHoverShowTransliteration && w.transliteration?.text;
                    const hasTooltip = prefs.normalShowWordHover && (hasTranslation || hasTransliteration);
                    return (
                      <span
                        key={w.id}
                        className={`word-highlight ${isActiveWord ? "active" : ""} ${hasTooltip ? "group/word relative inline-block" : ""}`}
                        style={
                          prefs.colorizeWords && colors.length > 0
                            ? { color: isActiveWord ? undefined : colors[i % colors.length] }
                            : undefined
                        }
                      >
                        {w.text_uthmani}{" "}
                        {hasTooltip && (
                          <span className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 -translate-x-1/2 whitespace-nowrap rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-elevated)] px-3 py-2 text-center font-sans shadow-[var(--shadow-float)] transition-opacity ${isActiveWord ? "opacity-100" : "opacity-0 group-hover/word:opacity-100 group-active/word:opacity-100"}`} dir="ltr">
                            {hasTranslation && (
                              <span className="block font-medium leading-relaxed text-[var(--theme-text)]" style={{ fontSize: `calc(12px * ${prefs.normalHoverTextSize})` }}>{w.translation!.text}</span>
                            )}
                            {hasTransliteration && (
                              <span className="block leading-relaxed text-[var(--theme-text-tertiary)] italic" style={{ fontSize: `calc(11px * ${prefs.normalHoverTextSize})` }}>{w.transliteration!.text}</span>
                            )}
                          </span>
                        )}
                      </span>
                    );
                  })
              : verse.text_uthmani}
            {/* End-of-ayah marker */}
            {" "}
            <span className="verse-end-marker" aria-label={`${t.quranReader.verseLabel} ${verse.verse_number}`}>
              <span className="verse-end-number">{verse.verse_number}</span>
            </span>
          </p>
        )}
      </div>

      {/* Translation */}
      {effectiveShowTranslation && verse.translations && verse.translations.length > 0 && (
        <div className="sm:ml-[44px]">
          <TranslationBlock
            translations={verse.translations}
            fontSize={prefs.normalTranslationFontSize}
            revealed={revealed && !showTranslation}
            onExpandedChange={setExpandedTranslations}
          />
        </div>
      )}

    </div>
  );
});
