export interface CreateActivityDTO {
    baby_id: number;
    activity_type: string;
    start_time: string;
    end_time?: string | null;
    amount?: number | null;
    unit?: string | null;
    diaper_type?: string | null;
    side?: string | null;
    quality?: number | null;
    notes?: string | null;
    recorded_by: number;
}

export interface ActivityDTO {
    activity_id: number;
    baby_id: number;
    activity_type: string;
    start_time: string;
    end_time: string | null;
    amount: number | null;
    unit: string | null;
    diaper_type: string | null;
    side: string | null;
    quality: number | null;
    notes: string | null;
    recorded_by: number;
}
