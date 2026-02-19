export interface CreateTaskDTO {
    baby_id: number;
    created_by: number;
    assigned_to?: number | null;
    title: string;
    description?: string | null;
    due_at?: Date | null;
    status?: string | null;
}

export interface UpdateTaskDTO {
    assigned_to?: number | null;
    title?: string;
    description?: string | null;
    due_at?: Date | null;
    status?: string | null;
}

export interface TaskDTO {
    task_id: number;
    baby_id: number;
    created_by: number;
    assigned_to: number | null;
    title: string;
    description: string | null;
    due_at: Date | null;
    status: string | null;
}
