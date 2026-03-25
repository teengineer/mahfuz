import { memo } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { ROLE_COLORS } from "./SyntaxLegend";

interface ExampleCard {
  role: string;
  titleKey: string;
  surahId: number;
  verseNum: number;
  highlightPosition: number;
  arabic: string;
  highlightWord: string;
  descriptionKey: string;
  ref: string;
}

const EXAMPLES: ExampleCard[] = [
  {
    role: "mubtada",
    titleKey: "exMubteda",
    surahId: 1,
    verseNum: 2,
    highlightPosition: 1,
    arabic: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
    highlightWord: "ٱلْحَمْدُ",
    descriptionKey: "exMubtedaDesc",
    ref: "1:2",
  },
  {
    role: "jar-majrur",
    titleKey: "exJarMajrur",
    surahId: 1,
    verseNum: 1,
    highlightPosition: 1,
    arabic: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    highlightWord: "بِسْمِ",
    descriptionKey: "exJarMajrurDesc",
    ref: "1:1",
  },
  {
    role: "fiil",
    titleKey: "exFiil",
    surahId: 1,
    verseNum: 6,
    highlightPosition: 1,
    arabic: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
    highlightWord: "ٱهْدِنَا",
    descriptionKey: "exFiilDesc",
    ref: "1:6",
  },
  {
    role: "mafool",
    titleKey: "exMafool",
    surahId: 1,
    verseNum: 6,
    highlightPosition: 2,
    arabic: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
    highlightWord: "ٱلصِّرَٰطَ",
    descriptionKey: "exMafoolDesc",
    ref: "1:6",
  },
  {
    role: "naat",
    titleKey: "exNaat",
    surahId: 1,
    verseNum: 6,
    highlightPosition: 3,
    arabic: "ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ",
    highlightWord: "ٱلْمُسْتَقِيمَ",
    descriptionKey: "exNaatDesc",
    ref: "1:6",
  },
  {
    role: "mudaf-ilayh",
    titleKey: "exIzafet",
    surahId: 1,
    verseNum: 4,
    highlightPosition: 2,
    arabic: "مَـٰلِكِ يَوْمِ ٱلدِّينِ",
    highlightWord: "يَوْمِ",
    descriptionKey: "exIzafetDesc",
    ref: "1:4",
  },
  {
    role: "khabar",
    titleKey: "exHaber",
    surahId: 112,
    verseNum: 4,
    highlightPosition: 4,
    arabic: "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ",
    highlightWord: "كُفُوًا",
    descriptionKey: "exHaberDesc",
    ref: "112:4",
  },
];

interface IrabExamplesProps {
  onSelect: (surahId: number, verseNum: number, highlightPosition: number, explanation: string) => void;
}

export const IrabExamples = memo(function IrabExamples({ onSelect }: IrabExamplesProps) {
  const { t } = useTranslation();
  const roles = t.discover.roles as Record<string, string>;
  const examples = t.discover.examples as Record<string, string> | undefined;

  return (
    <div>
      <h3 className="mb-1 text-[13px] font-semibold text-[var(--theme-text)]">
        {examples?.title ?? "Başlangıç Örnekleri"}
      </h3>
      <p className="mb-3 text-[11px] text-[var(--theme-text-tertiary)]">
        {examples?.subtitle ?? "Temel gramer yapılarını tanıyın"}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {EXAMPLES.map((ex) => {
          const roleColor = ROLE_COLORS[ex.role] || "#6b7280";
          const roleLabel = roles[ex.role] || ex.role;
          const title = examples?.[ex.titleKey] ?? ex.titleKey;
          const desc = examples?.[ex.descriptionKey] ?? ex.descriptionKey;

          // Build snippet with highlighted word
          const parts = ex.arabic.split(ex.highlightWord);

          return (
            <button
              key={ex.titleKey}
              type="button"
              onClick={() => onSelect(ex.surahId, ex.verseNum, ex.highlightPosition, desc)}
              className="flex min-w-[220px] flex-shrink-0 flex-col gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-3.5 text-left transition-all hover:border-[var(--theme-border-hover)] hover:shadow-[var(--shadow-card)] active:scale-[0.98]"
            >
              {/* Role dot + title */}
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: roleColor }} />
                <span className="text-[13px] font-semibold text-[var(--theme-text)]">{title}</span>
                <span
                  className="ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: roleColor }}
                >
                  {roleLabel}
                </span>
              </div>

              {/* Arabic snippet */}
              <p className="arabic-text text-[20px] leading-relaxed text-[var(--theme-text-secondary)]" dir="rtl">
                {parts.length > 1 ? (
                  <>
                    {parts[0]}
                    <span className="font-bold text-[var(--theme-text)]">{ex.highlightWord}</span>
                    {parts[1]}
                  </>
                ) : (
                  ex.arabic
                )}
              </p>

              {/* Description */}
              <p className="text-[11px] leading-snug text-[var(--theme-text-tertiary)]">{desc}</p>

              {/* Ref */}
              <span className="text-[10px] text-[var(--theme-text-quaternary)]">{ex.ref}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
