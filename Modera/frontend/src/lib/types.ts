export type VerdictStatus = "Approved" | "Flagged" | "Blocked" | "Error";

export interface ModerationScore {
  detected: boolean;
  confidence: number;
  reason: string;
}

export type ModerationScoreValue = number | ModerationScore;

export interface UploadAnalysis {
  reasoning?: string;
  error?: string;
  [key: string]: ModerationScoreValue | string | undefined;
}

export interface UploadResult {
  message: string;
  upload_id: string;
  filename: string;
  image_url: string;
  ai_analysis: UploadAnalysis;
  final_verdict: VerdictStatus;
}

export interface AppealItem {
  id: string;
  upload_id: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requested_by: string;
  created_at: string;
  updated_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  image_url?: string;
  final_verdict?: VerdictStatus;
  filename?: string;
}

export interface Policy {
  _id?: string;
  category: string;
  flag_threshold: number;
  block_threshold: number;
}

export interface QueueItem {
  _id: string;
  image_url: string;
  ai_scores: UploadAnalysis;
  final_verdict: VerdictStatus;
}
