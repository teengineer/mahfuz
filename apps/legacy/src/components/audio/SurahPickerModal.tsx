import { useState, useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { useTranslation } from "~/hooks/useTranslation";
import { useI18nStore } from "~/stores/useI18nStore";
import { getSurahName } from "~/lib/surah-name";
import {
  Dialog,
  DialogSheet,
  DialogTitle,
  DialogClose,
} from "~/components/ui/Dialog";

/** Strip diacritics so "karia" matches "Kâria", "maide" matches "Mâide" etc. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

interface SurahPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (surahId: number, nameAr: string, nameTr: string, versesCount: number) => void;
}

export function SurahPickerModal({ open, onClose, onSelect }: SurahPickerModalProps) {
  const { t } = useTranslation();
  const locale = useI18nStore((s) => s.locale);
  const [search, setSearch] = useState("");
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  const filtered = useMemo(() => {
    if (!search.trim()) return chapters;
    const q = normalize(search);
    return chapters.filter(
      (c) =>
        normalize(c.name_simple).includes(q) ||
        c.name_arabic.includes(search.trim()) ||
        normalize(getSurahName(c.id, c.translated_name.name, locale)).includes(q) ||
        String(c.id) === search.trim(),
    );
  }, [chapters, search, locale]);

  const handleSelect = (ch: typeof chapters[number]) => {
    onSelect(
      ch.id,
      ch.name_arabic,
      getSurahName(ch.id, ch.translated_name.name, locale),
      ch.verses_count,
    );
    setSearch("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setSearch(""); onClose(); } }}>
      <DialogSheet>
        <div className="relative z-10 w-full max-w-lg animate-slide-up rounded-t-2xl bg-[var(--theme-bg-primary)] p-5 shadow-modal sm:rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle className="text-[17px] font-semibold text-[var(--theme-text)]">
              {t.playlist.selectSurah}
            </DialogTitle>
            <DialogClose
              className="rounded-full p-1 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label={t.common.close}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </DialogClose>
          </div>

          <input
            type="text"
            placeholder={t.playlist.searchSurah}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-4 py-2.5 text-[14px] text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-quaternary)] focus:border-primary-500/40 focus:ring-2 focus:ring-primary-500/20"
          />

          <div className="max-h-[50vh] overflow-y-auto">
            {filtered.length > 0 ? (
              <div className="space-y-0.5">
                {filtered.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => handleSelect(ch)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--theme-hover-bg)]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-[13px] font-semibold text-primary-700 dark:bg-primary-900/30">
                      {ch.id}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px] font-medium text-[var(--theme-text)]">
                        {getSurahName(ch.id, ch.translated_name.name, locale)}
                      </span>
                      <span className="block text-[12px] text-[var(--theme-text-tertiary)]">
                        {ch.verses_count} {t.common.verse.toLowerCase()} · <span className="arabic-text text-[11px]">{ch.name_arabic}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-[13px] text-[var(--theme-text-tertiary)]">
                {t.common.noResults}
              </p>
            )}
          </div>
        </div>
      </DialogSheet>
    </Dialog>
  );
}
