import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export type JobType =
  | 'SYNC_DRAWS'
  | 'BUILD_OVERLAYS'
  | 'BUILD_SYMBOLIC_FEATURES'
  | 'RUN_BACKTEST'
  | 'EVALUATE_INCREMENTAL'
  | 'REFRESH_FORECASTS'
  | 'SEED_CONFIG';

export interface JobPayload {
  job_type: JobType;
  jurisdiction_id?: string;
  game_id?: string;
  date_from?: string;
  date_to?: string;
  mirror_version?: string;
  overlay_version?: string;
  symbolic_version?: string;
  rule_version?: string;
  [key: string]: unknown;
}

export async function createJob(payload: JobPayload): Promise<string> {
  const db = getAdminDb();
  const jobId = `${payload.job_type}_${Date.now()}`;
  await db.collection('jobs').doc(jobId).set({
    job_id: jobId,
    ...payload,
    status: 'queued',
    triggered_by: 'manual',
    records_processed: 0,
    records_failed: 0,
    error_summary: null,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });
  return jobId;
}

export async function updateJob(
  jobId: string,
  update: {
    status?: JobStatus;
    records_processed?: number;
    records_failed?: number;
    error_summary?: string | null;
    cursor?: string;
    [key: string]: unknown;
  }
): Promise<void> {
  const db = getAdminDb();
  await db.collection('jobs').doc(jobId).update({
    ...update,
    updated_at: FieldValue.serverTimestamp(),
  });
}
