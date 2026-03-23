/**
 * Common Baby Symptoms Catalog
 * Static reference data for symptom tracking.
 * Stored in-memory (not database) — same pattern as vaccines.data.ts
 */

export interface SymptomData {
  symptom_code: string;
  symptom_name: string;
  description: string;
}

export const SYMPTOMS_CATALOG: SymptomData[] = [
  {
    symptom_code: "FEVER",
    symptom_name: "Fever",
    description: "Elevated body temperature above 38°C (100.4°F)",
  },
  {
    symptom_code: "RASH",
    symptom_name: "Rash",
    description: "Skin irritation, redness, bumps, or hives on the body",
  },
  {
    symptom_code: "COUGH",
    symptom_name: "Cough",
    description: "Persistent or intermittent coughing",
  },
  {
    symptom_code: "VOMITING",
    symptom_name: "Vomiting",
    description: "Forceful expulsion of stomach contents",
  },
  {
    symptom_code: "DIARRHEA",
    symptom_name: "Diarrhea",
    description: "Loose or watery stools, more frequent than normal",
  },
  {
    symptom_code: "CONGESTION",
    symptom_name: "Congestion",
    description: "Nasal stuffiness or runny nose",
  },
  {
    symptom_code: "EAR_PAIN",
    symptom_name: "Ear Pain",
    description: "Pulling at ears, fussiness, or signs of ear discomfort",
  },
  {
    symptom_code: "FUSSINESS",
    symptom_name: "Fussiness / Irritability",
    description: "Unusual crying, irritability, or difficulty soothing",
  },
  {
    symptom_code: "POOR_FEEDING",
    symptom_name: "Poor Feeding",
    description: "Reduced appetite, refusing feeds, or eating less than usual",
  },
  {
    symptom_code: "LETHARGY",
    symptom_name: "Lethargy",
    description: "Unusual sleepiness, low energy, or decreased activity",
  },
  {
    symptom_code: "SWELLING",
    symptom_name: "Swelling",
    description: "Localized or general swelling on the body",
  },
  {
    symptom_code: "BREATHING_DIFFICULTY",
    symptom_name: "Breathing Difficulty",
    description: "Rapid breathing, wheezing, or labored respiration",
  },
  {
    symptom_code: "EYE_DISCHARGE",
    symptom_name: "Eye Discharge",
    description: "Watery, yellow, or crusty discharge from the eyes",
  },
  {
    symptom_code: "SKIN_IRRITATION",
    symptom_name: "Skin Irritation",
    description: "Dry skin, eczema patches, or diaper rash",
  },
  {
    symptom_code: "OTHER",
    symptom_name: "Other",
    description: "Other symptom not listed above",
  },
];

// Pre-computed map for O(1) lookups by code
const SYMPTOMS_MAP = new Map<string, SymptomData>(
  SYMPTOMS_CATALOG.map((s) => [s.symptom_code, s])
);

// Set of valid symptom codes for validation
export const VALID_SYMPTOM_CODES = SYMPTOMS_CATALOG.map((s) => s.symptom_code);

/**
 * Get all symptoms from catalog
 */
export function getAllSymptoms(): SymptomData[] {
  return SYMPTOMS_CATALOG;
}

/**
 * Get symptom by code
 */
export function getSymptomByCode(code: string): SymptomData | undefined {
  return SYMPTOMS_MAP.get(code);
}

// ─── Trigger Types ──────────────────────────────────────────────

export interface TriggerTypeData {
  code: string;
  label: string;
}

export const TRIGGER_TYPES: TriggerTypeData[] = [
  { code: "MEDICATION", label: "Medication Reaction" },
  { code: "FOOD", label: "Food/Formula Reaction" },
  { code: "WEATHER", label: "Weather Related" },
  { code: "ENVIRONMENT", label: "Environmental" },
  { code: "VACCINATION", label: "Post-Vaccination" },
  { code: "OTHER", label: "Other" },
];

export const VALID_TRIGGER_TYPES = TRIGGER_TYPES.map((t) => t.code);

/**
 * Get all trigger types
 */
export function getAllTriggerTypes(): TriggerTypeData[] {
  return TRIGGER_TYPES;
}
