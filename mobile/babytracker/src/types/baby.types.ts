export interface Baby {
  id: number;
  name: string;
  dob: string;
  sex: string;
  role: "PRIMARY" | "SECONDARY";
  canShare: boolean;
}

export interface Caregiver {
  id: number;
  email: string;
  name: string;
  role: "PRIMARY" | "SECONDARY";
  status: "ACTIVE" | "PENDING" | "INACTIVE";
}

export interface HistoryItem {
  id: number;
  babyId: number;
  type:
    | "FEEDING"
    | "SLEEP"
    | "DIAPER"
    | "VACCINATION"
    | "GUIDELINE"
    | "PLAY"
    | "OTHER";
  icon: string;
  description: string;
  timestamp: string;
  createdBy?: string;
}
