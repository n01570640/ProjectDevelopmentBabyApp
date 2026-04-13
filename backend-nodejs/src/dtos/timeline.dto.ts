export interface TimelineItemDTO {
  id: number;
  category: "activity" | "growth" | "vaccination" | "symptom" | "medication";
  description: string;
  detail: string | null;
  occurred_at: Date;
}

export interface TimelineResponseDTO {
  baby_id: number;
  items: TimelineItemDTO[];
  total: number;
}
