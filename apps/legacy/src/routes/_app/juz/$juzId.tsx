import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { versesByJuzQueryOptions } from "~/hooks/useVerses";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { Loading } from "~/components/ui/Loading";
import { TOTAL_JUZ } from "@mahfuz/shared/constants";
import { usePageLayout, getPagesForJuzByLayout } from "~/lib/page-layout";
import { useTranslation } from "~/hooks/useTranslation";
import { UnifiedReader } from "~/components/reader/UnifiedReader";

export const Route = createFileRoute("/_app/juz/$juzId")({
  loader: ({ context, params }) => {
    const juzId = Number(params.juzId);
    return Promise.all([
      context.queryClient.ensureQueryData(versesByJuzQueryOptions(juzId, 1)),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
    ]);
  },
  pendingComponent: () => <Loading text="Cüz yükleniyor..." />,
  head: ({ params }) => ({
    meta: [{ title: `Cüz ${params.juzId} | Mahfuz` }],
  }),
  component: JuzView,
});

function JuzView() {
  const { juzId } = Route.useParams();
  const juzNumber = Number(juzId);
  const navigate = useNavigate();
  const layout = usePageLayout();
  const { t } = useTranslation();

  const { data } = useSuspenseQuery(versesByJuzQueryOptions(juzNumber));
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  return (
    <UnifiedReader
      source="juz"
      verses={data.verses}
      chapters={chapters}
      currentId={juzNumber}
      totalCount={TOTAL_JUZ}
      picker={({ onClose }) => (
        <JuzPicker
          currentJuz={juzNumber}
          t={t}
          layout={layout}
          onSelect={(juz) => {
            onClose();
            navigate({ to: "/juz/$juzId", params: { juzId: String(juz) } });
          }}
          onClose={onClose}
        />
      )}
    />
  );
}

// -- Juz Picker Overlay --

function JuzPicker({
  currentJuz,
  onSelect,
  onClose,
  t,
  layout,
}: {
  currentJuz: number;
  onSelect: (juz: number) => void;
  onClose: () => void;
  t: ReturnType<typeof import("~/hooks/useTranslation").useTranslation>["t"];
  layout: import("@mahfuz/shared/constants").PageLayout;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="mx-auto mt-10 flex w-[92%] max-w-[440px] animate-scale-in flex-col overflow-hidden rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-modal)] sm:mt-14">
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[var(--theme-text)]">
            {t.quranReader.goToJuz}
          </h2>
          <button onClick={onClose} className="text-[13px] font-medium text-primary-600">
            {t.common.close}
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2 p-4">
          {Array.from({ length: 30 }, (_, i) => {
            const juz = i + 1;
            const isCurrent = juz === currentJuz;
            const [start, end] = getPagesForJuzByLayout(juz, layout);
            return (
              <button
                key={juz}
                type="button"
                onClick={() => onSelect(juz)}
                className={`flex flex-col items-center rounded-xl px-1 py-3 transition-all ${
                  isCurrent
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-[var(--theme-hover-bg)]/60 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                }`}
              >
                <span className="text-[16px] font-semibold tabular-nums leading-tight">{juz}</span>
                <span className={`mt-1 text-[9px] leading-tight ${isCurrent ? "text-white/70" : "text-[var(--theme-text-quaternary)]"}`}>
                  {start}–{end}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
