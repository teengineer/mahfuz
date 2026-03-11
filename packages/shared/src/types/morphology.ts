/** POS tags from Quranic Arabic Corpus */
export type PosTag =
  | "N"    // Noun
  | "PN"   // Proper Noun
  | "ADJ"  // Adjective
  | "V"    // Verb
  | "PRON" // Pronoun
  | "REL"  // Relative Pronoun
  | "DEM"  // Demonstrative
  | "P"    // Preposition
  | "CONJ" // Conjunction
  | "INTG" // Interrogative
  | "COND" // Conditional
  | "NEG"  // Negative
  | "EMPH" // Emphatic
  | "CERT" // Certainty
  | "RES"  // Restriction
  | "VOC"  // Vocative
  | "LOC"  // Location
  | "T"    // Time
  | "ACC"  // Accusative
  | "FUT"  // Future
  | "PREV" // Preventive
  | "PRO"  // Prohibition
  | "INL"  // Interrogative (lam)
  | "DET"  // Determiner
  | "ANS"  // Answer
  | "AVR"  // Aversion
  | "EXH"  // Exhortation
  | "EXP"  // Explanation
  | "INC"  // Inceptive
  | "INT"  // Intention
  | "REM"  // Remark
  | "SUP"  // Supplementary
  | "SUR"  // Surprise
  | "AMD"  // Amendment
  | "RSLT" // Result
  | "CIRC" // Circumstantial
  | "COM"  // Comitative
  | "EQ"   // Equalization
  | "EXL"  // Exclam
  | "IMPN" // Implication
  | "PRP"  // Purpose
  | "RET"  // Retraction
  | "SUB"  // Subordinating conjunction
  | string; // allow unknown tags

export interface WordMorpheme {
  /** Arabic text of this morpheme */
  ar: string;
  /** Part-of-speech tag */
  pos: PosTag;
  /** True if this is a prefix morpheme */
  prefix?: true;
  /** True if this is a suffix morpheme */
  suffix?: true;
}

export interface WordFeatures {
  /** Person: 1st, 2nd, 3rd */
  per?: 1 | 2 | 3;
  /** Gender: Masculine, Feminine */
  gen?: "M" | "F";
  /** Number: Singular, Dual, Plural */
  num?: "S" | "D" | "P";
  /** Case: Nominative, Accusative, Genitive */
  cas?: "NOM" | "ACC" | "GEN";
  /** Mood: Indicative, Subjunctive, Jussive */
  mood?: "IND" | "SUBJ" | "JUS";
  /** State: Definite, Indefinite */
  state?: "DEF" | "INDEF";
  /** Voice: Active, Passive */
  voice?: "ACT" | "PASS";
  /** Verb form (I-X) */
  form?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  /** Aspect: Perfect, Imperfect, Imperative */
  asp?: "PERF" | "IMPF" | "IMPV";
  /** Derivation: Verbal Noun, Active Participle, Passive Participle */
  der?: "VN" | "AP" | "PP";
}

export interface WordMorphology {
  /** Position in verse (1-based) */
  p: number;
  /** Full display word (Arabic) */
  ar: string;
  /** Trilateral/quadrilateral root, e.g. "كتب" */
  root?: string;
  /** Dictionary form (lemma) */
  lemma?: string;
  /** Primary POS of stem */
  pos: PosTag;
  /** Morpheme breakdown */
  morphemes: WordMorpheme[];
  /** Grammatical features */
  f: WordFeatures;
}

export interface SurahMorphologyData {
  /** Keyed by verse number as string, e.g. "1", "2" */
  verses: Record<string, WordMorphology[]>;
}

export interface RootEntry {
  /** Root letters, e.g. "كتب" */
  root: string;
  /** Spaced root letters, e.g. "ك ت ب" */
  letters: string;
  /** Meaning in TR and EN */
  meaning: { tr: string; en: string };
  /** Total occurrence count in Quran */
  count: number;
  /** Number of distinct derived forms */
  formCount: number;
  /** Verse locations, e.g. ["2:2", "2:44"] */
  locations: string[];
}

export interface RootIndex {
  roots: Record<string, RootEntry>;
}

export interface RootEnrichment {
  /** Rhetoric (balagat) notes */
  rhetoric?: { tr: string; en: string };
  /** Etymology notes */
  etymology?: { tr: string; en: string };
  /** Semantic field */
  semanticField?: { tr: string; en: string };
  /** Related root keys */
  relatedRoots?: string[];
}
