import * as analyticsModel from "../models/analytics.model";
import { BabySummaryDTO, BabyGraphsDTO } from "../dtos/analytics.dto";

/**
 * Get dashboard summary for a baby
 */
export async function getBabySummary(babyId: number): Promise<BabySummaryDTO> {
  // Run all queries in parallel for performance
  const [
    totalActivities,
    activitiesLast7,
    activityBreakdown,
    latestGrowth,
    totalGrowthRecords,
    symptomCounts,
    medicationCounts,
    totalVaccinations,
    upcomingTasks,
    upcomingReminders,
  ] = await Promise.all([
    analyticsModel.getTotalActivities(babyId),
    analyticsModel.getActivitiesLastNDays(babyId, 7),
    analyticsModel.getActivityBreakdown(babyId),
    analyticsModel.getLatestGrowth(babyId),
    analyticsModel.getTotalGrowthRecords(babyId),
    analyticsModel.getSymptomCounts(babyId),
    analyticsModel.getMedicationCounts(babyId),
    analyticsModel.getTotalVaccinations(babyId),
    analyticsModel.getUpcomingTasksCount(babyId),
    analyticsModel.getUpcomingRemindersCount(babyId),
  ]);

  return {
    baby_id: babyId,
    total_activities: totalActivities,
    activities_last_7_days: activitiesLast7,
    activity_breakdown: activityBreakdown,
    latest_growth: latestGrowth,
    total_growth_records: totalGrowthRecords,
    total_symptom_logs: symptomCounts.total,
    symptoms_last_7_days: symptomCounts.last_7_days,
    symptoms_last_30_days: symptomCounts.last_30_days,
    active_medications: medicationCounts.active,
    total_medications: medicationCounts.total,
    total_vaccinations: totalVaccinations,
    upcoming_tasks: upcomingTasks,
    upcoming_reminders: upcomingReminders,
  };
}

/**
 * Get graph/chart data for a baby
 */
export async function getBabyGraphs(babyId: number): Promise<BabyGraphsDTO> {
  // Run all graph queries in parallel
  const [growthOverTime, activityFrequency, symptomFrequency] = await Promise.all([
    analyticsModel.getGrowthOverTime(babyId),
    analyticsModel.getActivityFrequency(babyId),
    analyticsModel.getSymptomFrequency(babyId),
  ]);

  return {
    baby_id: babyId,
    growth_over_time: growthOverTime,
    activity_frequency: activityFrequency,
    symptom_frequency: symptomFrequency,
  };
}
