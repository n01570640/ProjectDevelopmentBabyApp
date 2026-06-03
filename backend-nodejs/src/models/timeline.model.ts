import { getDb } from "../db";
import sql from "mssql";

export interface RawTimelineRow {
  id: number;
  category: string;
  description: string;
  detail: string | null;
  occurred_at: Date;
}

/**
 * Fetch a unified timeline for a baby by combining activities, growth,
 * vaccinations, symptom logs, and medications into one chronological feed.
 */
export async function findTimelineByBabyId(
  babyId: number,
  limit: number = 50,
  offset: number = 0
): Promise<{ items: RawTimelineRow[]; total: number }> {
  const db = await getDb();

  const countResult = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT SUM(cnt) AS total FROM (
        SELECT COUNT(*) AS cnt FROM activities        WHERE baby_id = @baby_id
        UNION ALL
        SELECT COUNT(*) AS cnt FROM growth_metrics    WHERE baby_id = @baby_id
        UNION ALL
        SELECT COUNT(*) AS cnt FROM baby_vaccinations WHERE baby_id = @baby_id
        UNION ALL
        SELECT COUNT(*) AS cnt FROM symptom_logs      WHERE baby_id = @baby_id
        UNION ALL
        SELECT COUNT(*) AS cnt FROM medications       WHERE baby_id = @baby_id
      ) AS counts
    `);

  const total: number = countResult.recordset[0]?.total ?? 0;

  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .input("limit", sql.Int, limit)
    .input("offset", sql.Int, offset)
    .query(`
      SELECT * FROM (
        SELECT
          activity_id       AS id,
          'activity'         AS category,
          activity_type      AS description,
          COALESCE(
            CASE
              WHEN activity_type = 'feeding' AND amount IS NOT NULL
                THEN CONCAT(CAST(amount AS VARCHAR), ' ', COALESCE(unit, 'ml'))
              WHEN activity_type = 'diaper' AND diaper_type IS NOT NULL
                THEN diaper_type
              WHEN activity_type = 'sleep' AND end_time IS NOT NULL
                THEN CONCAT(DATEDIFF(MINUTE, start_time, end_time), ' min')
              ELSE NULL
            END,
            notes
          )                  AS detail,
          start_time         AS occurred_at
        FROM activities
        WHERE baby_id = @baby_id

        UNION ALL

        SELECT
          growth_id          AS id,
          'growth'           AS category,
          'Growth recorded'  AS description,
          CONCAT_WS(', ',
            CASE WHEN weight_kg     IS NOT NULL THEN CONCAT(CAST(weight_kg AS VARCHAR), ' kg') END,
            CASE WHEN length_cm     IS NOT NULL THEN CONCAT(CAST(length_cm AS VARCHAR), ' cm') END,
            CASE WHEN head_circum_cm IS NOT NULL THEN CONCAT(CAST(head_circum_cm AS VARCHAR), ' cm head') END
          )                  AS detail,
          recorded_at        AS occurred_at
        FROM growth_metrics
        WHERE baby_id = @baby_id

        UNION ALL

        SELECT
          baby_vax_id        AS id,
          'vaccination'      AS category,
          'Vaccination'      AS description,
          clinic             AS detail,
          CAST(administered_on AS DATETIME2) AS occurred_at
        FROM baby_vaccinations
        WHERE baby_id = @baby_id

        UNION ALL

        SELECT
          symptom_log_id     AS id,
          'symptom'          AS category,
          symptom_code       AS description,
          CASE
            WHEN severity_1_5 IS NOT NULL
              THEN CONCAT('Severity ', severity_1_5, '/5')
            ELSE notes
          END                AS detail,
          started_at         AS occurred_at
        FROM symptom_logs
        WHERE baby_id = @baby_id

        UNION ALL

        SELECT
          med_id             AS id,
          'medication'       AS category,
          name               AS description,
          CONCAT_WS(' - ', dosage, form) AS detail,
          CAST(start_date AS DATETIME2)  AS occurred_at
        FROM medications
        WHERE baby_id = @baby_id
      ) AS timeline
      ORDER BY occurred_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

  return { items: result.recordset as RawTimelineRow[], total };
}
