/**
 * Ontario Publicly Funded Immunization Schedule — Birth through Grade 7 (~age 12)
 * Source: Ontario Ministry of Health (ontario.ca/page/ontarios-routine-immunization-schedule)
 *         Publicly Funded Immunization Schedules for Ontario (June 2022, updated Jan 2024)
 *         Simcoe Muskoka District Health Unit Quick Reference (March 2025)
 *         Ontario School Immunization Program (ontario.ca/page/vaccines-children-school)
 *
 * schedule_weeks: Recommended age in weeks for administration
 *
 * IMPORTANT NOTES:
 * - Ontario uses combination vaccines (e.g., DTaP-IPV-Hib is a 5-in-1)
 * - Ontario uses Rotarix (2-dose series), NOT RotaTeq (3-dose)
 * - Hepatitis B is school-based (Grade 7) in Ontario, NOT given at birth
 * - Hepatitis A is NOT part of Ontario's routine schedule
 * - Grade 7 vaccines (HB, HPV, Men-C-ACYW) are delivered through school clinics
 * - This data is for informational purposes only — not a substitute for medical advice
 * - Always consult your healthcare provider for your child's immunization needs
 */

export interface VaccineData {
  vaccine_id: number;
  vaccine_name: string;
  schedule_weeks: number;
  notes: string;
}

export const VACCINES_CATALOG: VaccineData[] = [
  // ===== 2 Months =====
  {
    vaccine_id: 1,
    vaccine_name: "DTaP-IPV-Hib (5-in-1) - 1st dose",
    schedule_weeks: 8,
    notes:
      "2 months; protects against diphtheria, tetanus, pertussis, polio, and Haemophilus influenzae type b",
  },
  {
    vaccine_id: 2,
    vaccine_name: "Pneu-C (Pneumococcal Conjugate) - 1st dose",
    schedule_weeks: 8,
    notes: "2 months; Pneu-C-15 for healthy children",
  },
  {
    vaccine_id: 3,
    vaccine_name: "Rotavirus (Rotarix) - 1st dose",
    schedule_weeks: 8,
    notes:
      "2 months; given orally; 1st dose must be given before 15 weeks of age",
  },

  // ===== 4 Months =====
  {
    vaccine_id: 4,
    vaccine_name: "DTaP-IPV-Hib (5-in-1) - 2nd dose",
    schedule_weeks: 16,
    notes: "4 months",
  },
  {
    vaccine_id: 5,
    vaccine_name: "Pneu-C (Pneumococcal Conjugate) - 2nd dose",
    schedule_weeks: 16,
    notes: "4 months",
  },
  {
    vaccine_id: 6,
    vaccine_name: "Rotavirus (Rotarix) - 2nd dose",
    schedule_weeks: 16,
    notes:
      "4 months; final dose; minimum 4 weeks after 1st dose; all doses must be completed by 25 weeks of age",
  },

  // ===== 6 Months =====
  {
    vaccine_id: 7,
    vaccine_name: "DTaP-IPV-Hib (5-in-1) - 3rd dose",
    schedule_weeks: 24,
    notes: "6 months",
  },
  {
    vaccine_id: 8,
    vaccine_name: "Influenza (Flu) - Annual",
    schedule_weeks: 24,
    notes:
      "6 months and older; 2 doses in first flu season (4 weeks apart), then 1 dose annually each fall",
  },

  // ===== 12 Months =====
  {
    vaccine_id: 9,
    vaccine_name: "Pneu-C (Pneumococcal Conjugate) - 3rd dose (booster)",
    schedule_weeks: 52,
    notes: "12 months; must be given no earlier than 1st birthday",
  },
  {
    vaccine_id: 10,
    vaccine_name: "Men-C-C (Meningococcal Conjugate) - 1st dose",
    schedule_weeks: 52,
    notes:
      "12 months; must be given no earlier than 1st birthday; protects against meningococcal disease (C strain); required for school attendance",
  },
  {
    vaccine_id: 11,
    vaccine_name: "MMR (Measles, Mumps, Rubella) - 1st dose",
    schedule_weeks: 52,
    notes:
      "12 months; must be given no earlier than 1st birthday; required for school attendance in Ontario",
  },

  // ===== 15 Months =====
  {
    vaccine_id: 12,
    vaccine_name: "Varicella (Chickenpox) - 1st dose",
    schedule_weeks: 65,
    notes:
      "15 months; required for school attendance in Ontario (children born on or after Jan 1, 2010)",
  },

  // ===== 18 Months =====
  {
    vaccine_id: 13,
    vaccine_name: "DTaP-IPV-Hib (5-in-1) - 4th dose",
    schedule_weeks: 78,
    notes: "18 months",
  },

  // ===== 4-6 Years (before school entry) =====
  {
    vaccine_id: 14,
    vaccine_name: "Tdap-IPV (4-in-1 booster)",
    schedule_weeks: 208,
    notes:
      "4-6 years; booster for tetanus, diphtheria, pertussis, and polio; do not give before 4th birthday; required for school attendance",
  },
  {
    vaccine_id: 15,
    vaccine_name: "MMRV (Measles, Mumps, Rubella, Varicella) - 2nd dose",
    schedule_weeks: 208,
    notes:
      "4-6 years; combined vaccine for 2nd doses of MMR and varicella; approved for ages 4 to <13 years; required for school attendance",
  },

  // ===== Grade 7 (~age 12, school-based program) =====
  {
    vaccine_id: 16,
    vaccine_name: "Men-C-ACYW (Meningococcal Quadrivalent)",
    schedule_weeks: 624,
    notes:
      "Grade 7 (~age 12); single dose; covers strains A, C, Y, W-135; different from Men-C-C given at 12 months; required for school attendance under ISPA",
  },
  {
    vaccine_id: 17,
    vaccine_name: "Hepatitis B (HB) - 1st dose",
    schedule_weeks: 624,
    notes:
      "Grade 7 (~age 12); school-based program; 2-dose series for students aged 11-15; strongly recommended but not required for school attendance",
  },
  {
    vaccine_id: 18,
    vaccine_name: "HPV-9 (Human Papillomavirus) - 1st dose",
    schedule_weeks: 624,
    notes:
      "Grade 7 (~age 12); school-based program; 2-dose series (0, 6 months) for healthy students under 15; protects against 9 types of HPV; strongly recommended but not required for school attendance",
  },
  {
    vaccine_id: 19,
    vaccine_name: "Hepatitis B (HB) - 2nd dose",
    schedule_weeks: 650,
    notes:
      "6 months after 1st dose; completes 2-dose series for students aged 11-15; students 16+ require a 3-dose series",
  },
  {
    vaccine_id: 20,
    vaccine_name: "HPV-9 (Human Papillomavirus) - 2nd dose",
    schedule_weeks: 650,
    notes:
      "6 months after 1st dose; completes 2-dose series for healthy students under 15; students 15+ or immunocompromised require a 3-dose series",
  },
];

// Pre-computed map for O(1) lookups by ID
const VACCINES_MAP = new Map<number, VaccineData>(
  VACCINES_CATALOG.map((v) => [v.vaccine_id, v])
);

/**
 * Get all vaccines from catalog
 */
export function getAllVaccines(): VaccineData[] {
  return VACCINES_CATALOG;
}

/**
 * Get vaccine by ID
 */
export function getVaccineById(id: number): VaccineData | undefined {
  return VACCINES_MAP.get(id);
}

/**
 * Get vaccines due by age (in weeks)
 */
export function getVaccinesDueByAge(ageWeeks: number): VaccineData[] {
  return VACCINES_CATALOG.filter((v) => v.schedule_weeks <= ageWeeks);
}

/**
 * Get upcoming vaccines for age (in weeks)
 */
export function getUpcomingVaccines(
  ageWeeks: number,
  lookAheadWeeks: number = 8
): VaccineData[] {
  return VACCINES_CATALOG.filter(
    (v) =>
      v.schedule_weeks > ageWeeks &&
      v.schedule_weeks <= ageWeeks + lookAheadWeeks
  );
}
