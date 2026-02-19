export interface CreateActivityDTO {
    baby_id: number;
    activity_type: string;
    start_time: Date;
    end_time?: Date | null;
    amount?: number | null;
    unit?: string | null;
    diaper_type?: string | null;
    side?: string | null;
    quality?: number | null;
    notes?: string | null;
    recorded_by: number;
}

export interface UpdateActivityDTO {
    activity_type?: string;
    start_time?: Date;
    end_time?: Date | null;
    amount?: number | null;
    unit?: string | null;
    diaper_type?: string | null;
    side?: string | null;
    quality?: number | null;
    notes?: string | null;
}

export interface ActivityDTO {
    activity_id: number;
    baby_id: number;
    activity_type: string;
    start_time: Date;
    end_time: Date | null;
    amount: number | null;
    unit: string | null;
    diaper_type: string | null;
    side: string | null;
    quality: number | null;
    notes: string | null;
    recorded_by: number;
}
