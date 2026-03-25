export type FontGroup = "mushaf" | "naskh" | "modern" | "kufi" | "handwriting";
export type ColorPaletteId = "vivid" | "pastel" | "earth" | "ocean";

export interface ArabicFont {
  id: string;
  name: string;
  family: string;
  source: "local" | "google";
  googleUrl?: string;
  group: FontGroup;
  desc: string;
}

export interface ColorPalette {
  id: ColorPaletteId;
  name: string;
  colors: string[];
}

export const FONT_GROUPS: { id: FontGroup; labelKey: string }[] = [
  { id: "mushaf", labelKey: "mushaf" },
  { id: "naskh", labelKey: "naskh" },
  { id: "modern", labelKey: "modern" },
  { id: "kufi", labelKey: "kufi" },
  { id: "handwriting", labelKey: "handwriting" },
];

export const ARABIC_FONTS: ArabicFont[] = [
  { id: "uthmani-hafs", name: "Uthmani Hafs", family: '"KFGQPC Uthmani Hafs"', source: "local", group: "mushaf", desc: "Mushaf geleneğine sadık dijital bir hat." },
  { id: "amiri-quran", name: "Amiri Quran", family: '"Amiri Quran"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap", group: "mushaf", desc: "Mushaf baskılarına uygun özel tasarım." },
  { id: "me-quran", name: "Me Quran", family: '"me_quran"', source: "local", group: "mushaf", desc: "Medine Mushafı'na sadık özel bir tasarım." },
  { id: "uthman-taha-naskh", name: "Uthman Taha Naskh", family: '"KFGQPC Uthman Taha Naskh"', source: "local", group: "naskh", desc: "Kral Fahd Mushaf Basımevi'nin Osman Taha hattına sadık Nesih tasarımı." },
  { id: "scheherazade-new", name: "Scheherazade New", family: '"Scheherazade New"', source: "local", group: "naskh", desc: "Nesih geleneğinden beslenen zarif bir tasarım." },
  { id: "amiri", name: "Amiri", family: '"Amiri"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&display=swap", group: "naskh", desc: "Mısır Bulak matbaasının ruhunu taşıyan klasik Nesih." },
  { id: "lateef", name: "Lateef", family: '"Lateef"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Lateef:wght@400;700&display=swap", group: "naskh", desc: "Nastaliq etkili zarif bir Nesih hattı." },
  { id: "noto-naskh-arabic", name: "Noto Naskh Arabic", family: '"Noto Naskh Arabic"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap", group: "modern", desc: "Berrak ve tutarlı bir okuma deneyimi." },
  { id: "noto-sans-arabic", name: "Noto Sans Arabic", family: '"Noto Sans Arabic"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap", group: "modern", desc: "Ekran okumalarında mükemmel netlik." },
  { id: "cairo", name: "Cairo", family: '"Cairo"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap", group: "modern", desc: "Temiz çizgileri ve modern havası." },
  { id: "tajawal", name: "Tajawal", family: '"Tajawal"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap", group: "modern", desc: "Minimal ve şık çok yönlü bir tasarım." },
  { id: "reem-kufi", name: "Reem Kufi", family: '"Reem Kufi"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&display=swap", group: "kufi", desc: "Kûfi geleneğini çağdaş çizgilerle yorumlar." },
  { id: "noto-kufi-arabic", name: "Noto Kufi Arabic", family: '"Noto Kufi Arabic"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap", group: "kufi", desc: "Geometrik ve dengeli Kûfi varyantı." },
  { id: "playpen-sans-arabic", name: "Playpen Sans Arabic", family: '"Playpen Sans Arabic"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Playpen+Sans+Arabic:wght@400;500;600;700&display=swap", group: "handwriting", desc: "El yazısının sıcaklığını dijitale taşıyan hat." },
  { id: "mada", name: "Mada", family: '"Mada"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Mada:wght@400;500;600;700&display=swap", group: "handwriting", desc: "Yumuşak hatları ve doğal akışıyla rahat okuma." },
  { id: "gulzar", name: "Gulzar", family: '"Gulzar"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Gulzar&display=swap", group: "handwriting", desc: "Nastaliq geleneğinden ilham alan zarif hat." },
  { id: "mirza", name: "Mirza", family: '"Mirza"', source: "google", googleUrl: "https://fonts.googleapis.com/css2?family=Mirza:wght@400;700&display=swap", group: "handwriting", desc: "Nastaliq etkili dekoratif bir hat." },
];

export const COLOR_PALETTES: ColorPalette[] = [
  { id: "pastel", name: "زهريّ • Zarif", colors: ["#e8a435", "#d45d5d", "#4db89a", "#9b6dcc", "#e07840", "#5b9ec9", "#d46a8e", "#6db85e"] },
  { id: "ocean", name: "بَرق • Işık", colors: ["#e6197e", "#06b44e", "#2ba5dd", "#e8590c", "#9333ea", "#ca9215", "#0694a2", "#d63384"] },
  { id: "earth", name: "جَوهَر • Cevher", colors: ["#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#6366f1"] },
  { id: "vivid", name: "حِبر • Mürekkep", colors: ["#c4265e", "#5c8a18", "#0e7a8a", "#c96510", "#6f42c1", "#998a15", "#d94070", "#3e8948"] },
];

export function getArabicFont(id: string): ArabicFont {
  return ARABIC_FONTS.find((f) => f.id === id) ?? ARABIC_FONTS[3]; // default Scheherazade New
}

export function getColorPalette(id: ColorPaletteId): ColorPalette {
  return COLOR_PALETTES.find((p) => p.id === id) ?? COLOR_PALETTES[0];
}

export function getActiveColors(colorizeWords: boolean, colorPaletteId: ColorPaletteId): string[] {
  if (!colorizeWords) return [];
  return getColorPalette(colorPaletteId).colors;
}
