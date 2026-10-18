export type SupportedLanguage = 'km' | 'en' | 'zh';

export interface AdminPayload {
  id: string;
  username: string;
  role: 'superadmin' | 'admin';
  iat?: number;
  exp?: number;
}

export interface ApproveTaskRequestBody {
  userId: string;
  taskId: string;
  points?: number;
  note?: string;
  proofImageUrl?: string;
}

export interface TaskLogRecord {
  id: string;
  userId: string;
  taskId: string;
  taskName?: string;
  phoneNumber?: string;
  userFullName?: string;
  pointsAwarded: number;
  previousPoints: number;
  newPoints: number;
  status: 'approved' | 'rejected' | 'pending';
  approvedBy: string;
  note?: string;
  proofImageUrl?: string;
  createdAt: string;
  timestamp: number;
}

export interface TaskSubmission {
  id: string;
  user_id: string;
  task_id: string;
  task_name?: string;
  phone_number?: string;
  user_full_name?: string;
  proof_image_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  reward_points: number;
  created_at: string;
  updated_at?: string;
  verified_by?: string;
}

export interface PointLogRecord {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  created_at: string;
  timestamp: number;
}

