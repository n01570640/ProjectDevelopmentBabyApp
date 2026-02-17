/**
 * CDC Recommended Vaccine Schedule for Infants and Children
 * Source: CDC Immunization Schedule (simplified for app use)
 *
 * schedule_weeks: Recommended age in weeks for administration
 * Notes follow CDC guidelines
 */

export interface VaccineData {
  vaccine_id: number;
  vaccine_name: string;
  schedule_weeks: number;
  notes: string;
}

export const VACCINES_CATALOG: VaccineData[] = [
  // Birth
  {
    vaccine_id: 1,
    vaccine_name: "Hepatitis B (HepB) - 1st dose",
    schedule_weeks: 0,
    notes: "Administer at birth, before hospital discharge",
  },

  // 1-2 months
  {
    vaccine_id: 2,
    vaccine_name: "Hepatitis B (HepB) - 2nd dose",
    schedule_weeks: 4,
    notes: "1-2 months; minimum interval 4 weeks from 1st dose",
  },

  // 2 months
  {
    vaccine_id: 3,
    vaccine_name: "DTaP (Diphtheria, Tetanus, Pertussis) - 1st dose",
    schedule_weeks: 8,
    notes: "2 months",
  },
  {
    vaccine_id: 4,
    vaccine_name: "Hib (Haemophilus influenzae type b) - 1st dose",
    schedule_weeks: 8,
    notes: "2 months",
  },
  {
    vaccine_id: 5,
    vaccine_name: "IPV (Polio) - 1st dose",
    schedule_weeks: 8,
    notes: "2 months",
  },
  {
    vaccine_id: 6,
    vaccine_name: "PCV13 (Pneumococcal) - 1st dose",
    schedule_weeks: 8,
    notes: "2 months",
  },
  {
    vaccine_id: 7,
    vaccine_name: "RV (Rotavirus) - 1st dose",
    schedule_weeks: 8,
    notes: "2 months; Rotarix (2 doses) or RotaTeq (3 doses)",
  },

  // 4 months
  {
    vaccine_id: 8,
    vaccine_name: "DTaP - 2nd dose",
    schedule_weeks: 16,
    notes: "4 months",
  },
  {
    vaccine_id: 9,
    vaccine_name: "Hib - 2nd dose",
    schedule_weeks: 16,
    notes: "4 months",
  },
  {
    vaccine_id: 10,
    vaccine_name: "IPV - 2nd dose",
    schedule_weeks: 16,
    notes: "4 months",
  },
  {
    vaccine_id: 11,
    vaccine_name: "PCV13 - 2nd dose",
    schedule_weeks: 16,
    notes: "4 months",
  },
  {
    vaccine_id: 12,
    vaccine_name: "RV - 2nd dose",
    schedule_weeks: 16,
    notes: "4 months",
  },

  // 6 months
  {
    vaccine_id: 13,
    vaccine_name: "DTaP - 3rd dose",
    schedule_weeks: 24,
    notes: "6 months",
  },
  {
    vaccine_id: 14,
    vaccine_name: "Hib - 3rd dose (if applicable)",
    schedule_weeks: 24,
    notes: "6 months; depends on vaccine brand",
  },
  {
    vaccine_id: 15,
    vaccine_name: "PCV13 - 3rd dose",
    schedule_weeks: 24,
    notes: "6 months",
  },
  {
    vaccine_id: 16,
    vaccine_name: "RV - 3rd dose (RotaTeq only)",
    schedule_weeks: 24,
    notes: "6 months; only if using RotaTeq (3-dose series)",
  },
  {
    vaccine_id: 17,
    vaccine_name: "Influenza (Flu) - Annual",
    schedule_weeks: 24,
    notes: "6 months and older; 2 doses first season, then annual",
  },

  // 6-18 months
  {
    vaccine_id: 18,
    vaccine_name: "Hepatitis B (HepB) - 3rd dose",
    schedule_weeks: 26,
    notes: "6-18 months; minimum age 24 weeks",
  },
  {
    vaccine_id: 19,
    vaccine_name: "IPV - 3rd dose",
    schedule_weeks: 26,
    notes: "6-18 months",
  },

  // 12-15 months
  {
    vaccine_id: 20,
    vaccine_name: "Hib - Final dose",
    schedule_weeks: 52,
    notes: "12-15 months",
  },
  {
    vaccine_id: 21,
    vaccine_name: "PCV13 - 4th dose",
    schedule_weeks: 52,
    notes: "12-15 months",
  },
  {
    vaccine_id: 22,
    vaccine_name: "MMR (Measles, Mumps, Rubella) - 1st dose",
    schedule_weeks: 52,
    notes: "12-15 months",
  },
  {
    vaccine_id: 23,
    vaccine_name: "Varicella (Chickenpox) - 1st dose",
    schedule_weeks: 52,
    notes: "12-15 months",
  },
  {
    vaccine_id: 24,
    vaccine_name: "Hepatitis A (HepA) - 1st dose",
    schedule_weeks: 52,
    notes: "12-23 months; 2-dose series",
  },

  // 15-18 months
  {
    vaccine_id: 25,
    vaccine_name: "DTaP - 4th dose",
    schedule_weeks: 65,
    notes: "15-18 months",
  },

  // 18 months
  {
    vaccine_id: 26,
    vaccine_name: "Hepatitis A (HepA) - 2nd dose",
    schedule_weeks: 78,
    notes: "18 months minimum; 6 months after 1st dose",
  },

  // 4-6 years (for reference)
  {
    vaccine_id: 27,
    vaccine_name: "DTaP - 5th dose",
    schedule_weeks: 208,
    notes: "4-6 years (before school entry)",
  },
  {
    vaccine_id: 28,
    vaccine_name: "IPV - 4th dose",
    schedule_weeks: 208,
    notes: "4-6 years (before school entry)",
  },
  {
    vaccine_id: 29,
    vaccine_name: "MMR - 2nd dose",
    schedule_weeks: 208,
    notes: "4-6 years (before school entry)",
  },
  {
    vaccine_id: 30,
    vaccine_name: "Varicella - 2nd dose",
    schedule_weeks: 208,
    notes: "4-6 years (before school entry)",
  },
];

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
  return VACCINES_CATALOG.find((v) => v.vaccine_id === id);
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
