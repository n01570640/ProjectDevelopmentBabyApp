/**
 * Symptoms Catalog - Seed Data
 *
 * This file is the source of truth for populating the symptoms_catalog DB table.
 * Used ONLY by the seed script (src/scripts/seed.ts).
 * At runtime, the API reads from the symptoms_catalog table directly.
 */

export interface SymptomSeedData {
  symptom_code: string;
  symptom_name: string;
  description: string;
}

export const SYMPTOMS_CATALOG: SymptomSeedData[] = [
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
