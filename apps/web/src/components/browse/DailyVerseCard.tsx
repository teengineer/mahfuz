import { useQuery } from "@tanstack/react-query";
import { verseByKeyQueryOptions } from "~/hooks/useVerses";
import { useTranslatedVerses } from "~/hooks/useTranslatedVerses";
import { useTranslation } from "~/hooks/useTranslation";

const CURATED_VERSES = [
  "2:255","2:286","3:26","3:139","6:162","10:62","13:28","14:7","16:97",
  "17:82","20:114","23:115","24:35","25:74","27:62","29:69","33:56",
  "36:58","39:53","40:60","42:11","48:29","51:56","55:13","56:10",
  "57:4","59:22","67:1","93:5","94:6","96:1","97:1","112:1","113:1","114:1",
  "2:152","2:186","3:159","7:56","8:46","11:6","15:9","21:87","28:88",
  "31:17","35:2","41:30","49:13","55:26","65:3","73:8",
];

function getDailyVerseKey(): string {
  const dayIndex = Math.floor(Date.now() / 86400000) % CURATED_VERSES.length;
  return CURATED_VERSES[dayIndex];
}

export function DailyVerseCard() {
  const { t } = useTranslation();
  const verseKey = getDailyVerseKey();
  const { data: rawVerse } = useQuery(verseByKeyQueryOptions(verseKey));
  const translated = useTranslatedVerses(rawVerse ? [rawVerse] : []);
  const verse = translated[0] ?? rawVerse;

  if (!verse) return null;

  const arabicText = verse.words
    ? verse.words.filter((w) => w.char_type_name === "word").map((w) => w.text_uthmani).join(" ")
    : verse.text_uthmani;

  const translationText = verse.translations?.[0]?.text?.replace(/<[^>]*>/g, "");

  const handleShare = async () => {
    const text = `${verse.verse_key}\n${arabicText}${translationText ? `\n\n${translationText}` : ""}`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-5 text-white shadow-[var(--shadow-elevated)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wider opacity-80">{t.browse.dailyVerse}</span>
        <button onClick={handleShare} className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm transition-colors hover:bg-white/25">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
          {t.browse.shareVerse}
        </button>
      </div>
      <p dir="rtl" className="arabic-text mb-3 text-[20px] leading-[2.2] text-white/95">{arabicText}</p>
      {translationText && (
        <p className="mb-2 text-[13px] leading-relaxed text-white/80">{translationText}</p>
      )}
      <span className="text-[11px] font-medium text-white/60">{verse.verse_key}</span>
    </div>
  );
}
