export interface CreateReminderDTO {
    baby_id: number;
    created_by: number;
    title: string;
    body?: string | null;
    due_at: string;
    rrule?: string | null;
}

export interface ReminderDTO {
    reminder_id: number;
    baby_id: number;
    created_by: number;
    title: string;
    body: string | null;
    due_at: string;
    rrule: string | null;
    is_active: boolean;
    last_sent_at: string | null;
}
