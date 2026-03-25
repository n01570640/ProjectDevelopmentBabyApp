/**
 * DTOs for vaccine guidelines
 */

// Vaccine from catalog
export interface VaccineDTO {
  vaccine_id: number;
  vaccine_name: string;
  schedule_weeks: number;
  schedule_age_display: string; //readable age ("2 months")
  notes: string;
}

/**
 * Convert weeks to human-readable age
 */
export function weeksToAgeDisplay(weeks: number): string {
  if (weeks === 0) {
    return "At birth";
  }

  if (weeks < 4) {
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  }

  const months = Math.round(weeks / 4.345);
  const remainingWeeks = weeks % 4;

  if (months < 12) {
    if (remainingWeeks === 0) {
      return `${months} month${months > 1 ? "s" : ""}`;
    }
    return `${months}-${months + 1} months`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return `${years} year${years > 1 ? "s" : ""}`;
  }

  return `${years} year${years > 1 ? "s" : ""} ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
}
