export interface CreateReminderDTO {
    baby_id: number;
    created_by: number;
    title: string;
    body?: string | null;
    due_at: Date;
    rrule?: string | null;
}

export interface UpdateReminderDTO {
    title?: string;
    body?: string | null;
    due_at?: Date;
    rrule?: string | null;
    is_active?: boolean;
}

export interface ReminderDTO {
    reminder_id: number;
    baby_id: number;
    created_by: number;
    title: string;
    body: string | null;
    due_at: Date;
    rrule: string | null;
    is_active: boolean;
    last_sent_at: Date | null;
}
