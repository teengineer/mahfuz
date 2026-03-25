/**
 * Build concept ontology from topic-index-expanded.ts data.
 *
 * Output: apps/legacy/public/discover/concepts.json
 *
 * Usage: npx tsx scripts/build-concepts.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const OUT_DIR = join(ROOT_DIR, "apps/legacy/public/discover");
const OUT_FILE = join(OUT_DIR, "concepts.json");

// Inline the topic data to avoid TypeScript import issues with .ts source
interface TopicEntry {
  topic: string;
  topicEn: string;
  icon: string;
  refs: string[];
}

interface TopicCategory {
  id: string;
  label: string;
  labelEn: string;
  icon: string;
  topics: TopicEntry[];
}

// Categories with concepts based on Quranic ontology
const CATEGORIES: Array<{
  id: string;
  label: { tr: string; en: string };
  icon: string;
  concepts: Array<{
    id: string;
    name: { tr: string; en: string };
    description: { tr: string; en: string };
    refs: string[];
    icon?: string;
    relatedConcepts?: string[];
    relatedRoots?: string[];
  }>;
}> = [
  {
    id: "ibadetler",
    label: { tr: "İbadetler", en: "Worship" },
    icon: "🕌",
    concepts: [
      { id: "namaz", name: { tr: "Namaz", en: "Prayer (Salah)" }, description: { tr: "Kur'an'da namaz ibadeti ve önemi", en: "The prayer worship in the Quran and its importance" }, refs: ["2:43", "2:238", "4:103", "11:114", "17:78", "20:14", "29:45", "62:9-10"], icon: "🕌", relatedRoots: ["صلو"], relatedConcepts: ["dua", "husu"] },
      { id: "oruc", name: { tr: "Oruç", en: "Fasting (Sawm)" }, description: { tr: "Ramazan orucu ve faziletleri", en: "Ramadan fasting and its virtues" }, refs: ["2:183", "2:184", "2:185", "2:187"], icon: "🌅", relatedRoots: ["صوم"], relatedConcepts: ["ramazan", "sabir"] },
      { id: "zekat", name: { tr: "Zekât", en: "Charity (Zakat)" }, description: { tr: "Mali ibadet olarak zekât", en: "Zakat as a financial worship" }, refs: ["2:43", "2:110", "2:177", "2:277", "9:60", "27:3"], icon: "💰", relatedRoots: ["زكو"], relatedConcepts: ["sadaka", "infak"] },
      { id: "hac", name: { tr: "Hac", en: "Pilgrimage (Hajj)" }, description: { tr: "Hac ibadeti ve menasiki", en: "Hajj pilgrimage and its rituals" }, refs: ["2:196", "2:197", "2:198", "3:97", "22:27-29"], icon: "🕋", relatedConcepts: ["umre", "kabe"] },
      { id: "dua", name: { tr: "Dua", en: "Supplication" }, description: { tr: "Allah'a yakarış ve dua", en: "Supplication and calling upon God" }, refs: ["2:186", "40:60", "7:55", "7:56", "25:77"], icon: "🤲", relatedRoots: ["دعو"], relatedConcepts: ["namaz", "zikir"] },
      { id: "zikir", name: { tr: "Zikir", en: "Remembrance" }, description: { tr: "Allah'ı anmak ve zikir", en: "Remembrance and mention of God" }, refs: ["2:152", "13:28", "33:41", "39:22-23", "62:10"], icon: "📿", relatedRoots: ["ذكر"], relatedConcepts: ["dua", "tesbih"] },
    ],
  },
  {
    id: "iman",
    label: { tr: "İman Esasları", en: "Pillars of Faith" },
    icon: "💡",
    concepts: [
      { id: "tevhid", name: { tr: "Tevhid", en: "Monotheism (Tawhid)" }, description: { tr: "Allah'ın birliği inancı", en: "Belief in the oneness of God" }, refs: ["2:163", "2:255", "3:18", "112:1-4", "59:22-24"], icon: "☝️", relatedRoots: ["وحد"], relatedConcepts: ["allah-isimleri", "sirk"] },
      { id: "melekler", name: { tr: "Melekler", en: "Angels" }, description: { tr: "Meleklere iman", en: "Belief in angels" }, refs: ["2:30-34", "2:97-98", "2:285", "16:2", "35:1", "66:6"], icon: "👼", relatedConcepts: ["cebrail", "vahiy"] },
      { id: "kitaplar", name: { tr: "Semavi Kitaplar", en: "Divine Books" }, description: { tr: "İndirilen kitaplara iman", en: "Belief in revealed books" }, refs: ["2:2-4", "2:87", "2:136", "3:3-4", "5:44-48"], icon: "📖", relatedRoots: ["كتب"], relatedConcepts: ["kuran", "tevrat", "incil"] },
      { id: "peygamberler", name: { tr: "Peygamberler", en: "Prophets" }, description: { tr: "Peygamberlere iman", en: "Belief in prophets" }, refs: ["2:136", "2:285", "3:33-34", "4:163-165", "6:83-90"], icon: "🌟", relatedConcepts: ["muhammed", "ibrahim", "musa", "isa"] },
      { id: "ahiret", name: { tr: "Ahiret", en: "Hereafter" }, description: { tr: "Ölüm sonrası hayat", en: "Life after death" }, refs: ["2:4", "2:28", "23:99-100", "50:19-35", "56:1-56"], icon: "⚖️", relatedConcepts: ["cennet", "cehennem", "hesap"] },
      { id: "kader", name: { tr: "Kader", en: "Divine Decree" }, description: { tr: "Kadere iman, ilahi takdir", en: "Belief in divine decree" }, refs: ["3:145", "9:51", "54:49", "57:22-23", "64:11"], icon: "🔮", relatedRoots: ["قدر"], relatedConcepts: ["irade", "tevekkul"] },
    ],
  },
  {
    id: "ahlak",
    label: { tr: "Ahlak", en: "Ethics & Morality" },
    icon: "🌿",
    concepts: [
      { id: "sabir", name: { tr: "Sabır", en: "Patience" }, description: { tr: "Sabır ve metanet", en: "Patience and perseverance" }, refs: ["2:45", "2:153", "2:155-157", "3:200", "16:126-127", "39:10", "103:3"], icon: "🏔️", relatedRoots: ["صبر"], relatedConcepts: ["tevekkul", "sukur"] },
      { id: "sukur", name: { tr: "Şükür", en: "Gratitude" }, description: { tr: "Nimete şükretmek", en: "Being grateful for blessings" }, refs: ["2:152", "14:7", "16:114", "31:12", "54:35"], icon: "🙏", relatedRoots: ["شكر"], relatedConcepts: ["sabir", "nimet"] },
      { id: "adalet", name: { tr: "Adalet", en: "Justice" }, description: { tr: "Adil olmak ve hakkaniyetle davranmak", en: "Being just and fair in dealings" }, refs: ["4:58", "4:135", "5:8", "16:90", "49:9"], icon: "⚖️", relatedRoots: ["عدل"], relatedConcepts: ["ihsan", "zulm"] },
      { id: "ihsan", name: { tr: "İhsan", en: "Excellence" }, description: { tr: "İyilik ve güzel davranış", en: "Excellence and good conduct" }, refs: ["2:195", "4:36", "16:90", "55:60"], icon: "✨", relatedConcepts: ["adalet", "takva"] },
      { id: "takva", name: { tr: "Takva", en: "God-Consciousness" }, description: { tr: "Allah'a karşı sorumluluk bilinci", en: "Being conscious and mindful of God" }, refs: ["2:197", "3:102", "49:13", "65:2-3"], icon: "🛡️", relatedConcepts: ["iman", "ihsan"] },
      { id: "tevazu", name: { tr: "Tevazu", en: "Humility" }, description: { tr: "Alçakgönüllülük ve kibir karşıtlığı", en: "Humility and being free from arrogance" }, refs: ["17:37", "25:63", "31:18-19", "49:11"], icon: "🌾", relatedConcepts: ["kibir", "ihsan"] },
    ],
  },
  {
    id: "kuran",
    label: { tr: "Kur'an ve Vahiy", en: "Quran & Revelation" },
    icon: "📖",
    concepts: [
      { id: "vahiy", name: { tr: "Vahiy", en: "Revelation" }, description: { tr: "İlahi vahiy kavramı", en: "The concept of divine revelation" }, refs: ["42:51-52", "53:1-18", "96:1-5", "2:97", "16:102"], icon: "💫", relatedConcepts: ["cebrail", "kuran"] },
      { id: "kuran-mucize", name: { tr: "Kur'an'ın Mucizeliği", en: "Inimitability of Quran" }, description: { tr: "Kur'an'ın eşsizliği ve meydan okuması", en: "The inimitability and challenge of the Quran" }, refs: ["2:23-24", "10:38", "11:13", "17:88", "52:33-34"], icon: "🌟", relatedConcepts: ["vahiy"] },
      { id: "tedebbur", name: { tr: "Tedebbür", en: "Contemplation" }, description: { tr: "Kur'an üzerinde düşünmek", en: "Reflecting upon the Quran" }, refs: ["4:82", "23:68", "38:29", "47:24"], icon: "🤔", relatedConcepts: ["hikmet", "ilim"] },
    ],
  },
  {
    id: "toplum",
    label: { tr: "Toplum ve Hukuk", en: "Society & Law" },
    icon: "🏛️",
    concepts: [
      { id: "aile", name: { tr: "Aile", en: "Family" }, description: { tr: "Aile kurumu ve ilişkiler", en: "Family institution and relations" }, refs: ["2:228-237", "4:1-4", "4:34-35", "30:21", "65:1-7"], icon: "👨‍👩‍👧‍👦", relatedConcepts: ["nikah", "cocuklar"] },
      { id: "infak", name: { tr: "İnfak", en: "Charitable Spending" }, description: { tr: "Allah yolunda harcamak", en: "Spending in the way of God" }, refs: ["2:261-274", "3:92", "57:7", "63:10", "64:16"], icon: "🤝", relatedRoots: ["نفق"], relatedConcepts: ["zekat", "sadaka"] },
      { id: "emr-maruf", name: { tr: "Emr-i Maruf", en: "Enjoining Good" }, description: { tr: "İyiliği emretmek, kötülükten sakındırmak", en: "Enjoining good and forbidding evil" }, refs: ["3:104", "3:110", "7:157", "9:71", "22:41"], icon: "📢", relatedConcepts: ["adalet", "toplum"] },
    ],
  },
  {
    id: "kissa",
    label: { tr: "Kıssalar", en: "Stories" },
    icon: "📚",
    concepts: [
      { id: "adem", name: { tr: "Hz. Âdem", en: "Prophet Adam" }, description: { tr: "İlk insan ve ilk peygamber", en: "The first human and first prophet" }, refs: ["2:30-39", "7:11-25", "15:26-44", "20:115-124", "38:71-85"], icon: "🌿" },
      { id: "nuh", name: { tr: "Hz. Nuh", en: "Prophet Noah" }, description: { tr: "Nuh peygamber ve tufan", en: "Prophet Noah and the flood" }, refs: ["7:59-64", "11:25-49", "23:23-30", "71:1-28"], icon: "🚢" },
      { id: "ibrahim", name: { tr: "Hz. İbrahim", en: "Prophet Abraham" }, description: { tr: "İbrahim peygamber ve hanif din", en: "Prophet Abraham and the pure faith" }, refs: ["2:124-132", "2:258-260", "6:74-83", "14:35-41", "21:51-73", "37:83-113"], icon: "🔥" },
      { id: "musa", name: { tr: "Hz. Musa", en: "Prophet Moses" }, description: { tr: "Musa peygamber ve Firavun", en: "Prophet Moses and Pharaoh" }, refs: ["2:49-61", "7:103-162", "10:75-92", "20:9-99", "26:10-68", "28:3-46"], icon: "🌊" },
      { id: "isa", name: { tr: "Hz. İsa", en: "Prophet Jesus" }, description: { tr: "İsa peygamber ve mucizeleri", en: "Prophet Jesus and his miracles" }, refs: ["3:42-63", "5:110-120", "19:16-40", "43:57-65"], icon: "🌟" },
      { id: "yusuf", name: { tr: "Hz. Yusuf", en: "Prophet Joseph" }, description: { tr: "Yusuf peygamberin kıssası", en: "The story of Prophet Joseph" }, refs: ["12:1-111"], icon: "🌙" },
    ],
  },
  {
    id: "tabiat",
    label: { tr: "Tabiat ve Yaratılış", en: "Nature & Creation" },
    icon: "🌍",
    concepts: [
      { id: "yaratilis", name: { tr: "Yaratılış", en: "Creation" }, description: { tr: "Göklerin ve yerin yaratılışı", en: "Creation of the heavens and earth" }, refs: ["2:29", "6:73", "7:54", "10:3", "21:30", "41:9-12", "51:47-49"], icon: "🌌", relatedRoots: ["خلق"] },
      { id: "insan-yaratilisi", name: { tr: "İnsanın Yaratılışı", en: "Human Creation" }, description: { tr: "İnsanın topraktan ve nutfeden yaratılışı", en: "Human creation from clay and a drop" }, refs: ["15:26-29", "22:5", "23:12-16", "32:7-9", "76:1-3", "96:1-2"], icon: "🧬", relatedConcepts: ["yaratilis"] },
      { id: "tabiat-ayetleri", name: { tr: "Tabiat Ayetleri", en: "Signs in Nature" }, description: { tr: "Doğadaki ilahi işaretler", en: "Divine signs in nature" }, refs: ["2:164", "3:190-191", "10:5-6", "16:10-18", "30:20-27", "45:3-6"], icon: "🌿", relatedConcepts: ["yaratilis", "tefekkur"] },
    ],
  },
  {
    id: "ahiret-hayat",
    label: { tr: "Ahiret Hayatı", en: "Afterlife" },
    icon: "⚡",
    concepts: [
      { id: "kiyamet", name: { tr: "Kıyamet", en: "Day of Judgment" }, description: { tr: "Kıyamet günü ve alametleri", en: "The Day of Judgment and its signs" }, refs: ["22:1-7", "56:1-6", "69:13-37", "75:1-15", "81:1-14", "99:1-8"], icon: "⚡", relatedConcepts: ["hesap", "mizan"] },
      { id: "cennet", name: { tr: "Cennet", en: "Paradise" }, description: { tr: "Ahiret yurdu cennet", en: "Paradise in the hereafter" }, refs: ["2:25", "3:15", "4:57", "9:72", "47:15", "55:46-78", "56:10-40"], icon: "🏞️", relatedRoots: ["جنن"], relatedConcepts: ["ahiret"] },
      { id: "cehennem", name: { tr: "Cehennem", en: "Hellfire" }, description: { tr: "Cehennem azabı ve uyarısı", en: "Hellfire punishment and warning" }, refs: ["2:24", "3:131", "4:56", "14:16-17", "22:19-22", "56:41-56", "67:6-11"], icon: "🔥", relatedConcepts: ["ahiret"] },
    ],
  },
];

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const categories = CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    count: c.concepts.length,
  }));

  const concepts = CATEGORIES.flatMap((c) =>
    c.concepts.map((concept) => ({
      ...concept,
      categoryId: c.id,
    })),
  );

  writeFileSync(OUT_FILE, JSON.stringify({ categories, concepts }));

  console.log(`Done! ${categories.length} categories, ${concepts.length} concepts`);
  console.log(`Output: ${OUT_FILE}`);
}

main();
