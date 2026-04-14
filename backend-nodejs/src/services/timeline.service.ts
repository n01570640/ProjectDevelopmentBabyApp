import * as timelineModel from "../models/timeline.model";
import { TimelineItemDTO, TimelineResponseDTO } from "../dtos/timeline.dto";

export async function getBabyTimeline(
  babyId: number,
  limit: number = 50,
  offset: number = 0
): Promise<TimelineResponseDTO> {
  const { items, total } = await timelineModel.findTimelineByBabyId(babyId, limit, offset);

  const mapped: TimelineItemDTO[] = items.map((row) => ({
    id: row.id,
    category: row.category as TimelineItemDTO["category"],
    description: row.description,
    detail: row.detail,
    occurred_at: row.occurred_at,
  }));

  return { baby_id: babyId, items: mapped, total };
}
