/** Concept category in the Quranic ontology */
export interface ConceptCategory {
  /** Unique identifier, e.g. "ibadetler" */
  id: string;
  /** Display label */
  label: { tr: string; en: string };
  /** Emoji icon */
  icon: string;
  /** Number of concepts in this category */
  count: number;
}

/** A single concept in the ontology */
export interface Concept {
  /** Unique identifier */
  id: string;
  /** Concept name */
  name: { tr: string; en: string };
  /** Category ID */
  categoryId: string;
  /** Short description */
  description: { tr: string; en: string };
  /** Verse references, e.g. ["2:255", "3:18"] */
  refs: string[];
  /** Related concept IDs */
  relatedConcepts?: string[];
  /** Related root keys */
  relatedRoots?: string[];
  /** Emoji icon */
  icon?: string;
}

/** Full concept index */
export interface ConceptIndex {
  categories: ConceptCategory[];
  concepts: Concept[];
}
