import type { PaginationMeta } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { t } = useTranslation();
  const { current_page, total_pages } = pagination;

  if (total_pages <= 1) return null;

  return (
    <div className="mt-10 flex items-center justify-center gap-3">
      <button
        onClick={() => onPageChange(current_page - 1)}
        disabled={current_page <= 1}
        className="rounded-full bg-[var(--theme-bg-primary)] px-5 py-2 text-[13px] font-medium text-[var(--theme-text)] shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elevated)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30"
      >
        {t.quranReader.prev}
      </button>
      <span className="min-w-[60px] text-center text-[13px] tabular-nums text-[var(--theme-text-tertiary)]">
        {current_page} / {total_pages}
      </span>
      <button
        onClick={() => onPageChange(current_page + 1)}
        disabled={!pagination.next_page}
        className="rounded-full bg-[var(--theme-bg-primary)] px-5 py-2 text-[13px] font-medium text-[var(--theme-text)] shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elevated)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30"
      >
        {t.quranReader.next}
      </button>
    </div>
  );
}
