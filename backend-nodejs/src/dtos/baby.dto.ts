export interface CreateBabyDTO {
    display_name: string;
    date_of_birth: string;
    sex?: string;
    blood_type?: string;
    notes?: string;
}

export interface BabyDTO {
    baby_id: number;
    display_name: string;
    date_of_birth: string;
    sex: string | null;
    blood_type: string | null;
    notes: string | null;
    created_at: string;
}
