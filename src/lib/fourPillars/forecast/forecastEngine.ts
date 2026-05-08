/**
 * Phase 5 — Updated forecastEngine.ts
 *
 * Key changes vs Phase 4.5 version:
 * 1. Uses Phase 5 forecastGenerator for the actual generation (full decision chain).
 * 2. Existing Phase 1/2 route at /api/four-pillars/refresh-forecasts still works — it now
 *    delegates to the Phase 5 generator.
 * 3. The Phase 4.5 hard guard is PRESERVED inside forecastGenerator.ts via the .filter() call.
 *    This file just re-exports from the generator so the old route keeps working.
 *
 * GUARD VERIFICATION — look for this in forecastGenerator.ts:
 *
 *   const eligibleHyps = allHyps.filter((h) => {
 *     if (h.auto_generated === true) return h.forecast_approved === true;
 *     return true;
 *   });
 *
 * That filter is the canonical Phase 4.5 guard and must remain.
 */

import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateForecastRun } from '../phase5/forecastGenerator';
import { normalizePeriodLabel } from '../constants/normalization';

export async function refreshForecasts(params: {
  game_id: string;
  jurisdiction_id: string;
  target_draw_date: string;
  target_draw_label: string;
  target_draw_time_utc: string;
}): Promise<{
  job_id: string;
  forecast_id: string;
  evidence_backed: boolean;
  recommended_candidates: string[];
  hypotheses_triggered: string[];
  empty_reason: string | null;
}> {
  const db = getAdminDb();

  const jobId = `REFRESH_FORECASTS_${Date.now()}`;
  await db.collection('jobs').doc(jobId).set({
    job_id: jobId,
    job_type: 'REFRESH_FORECASTS',
    status: 'running',
    triggered_by: 'manual',
    records_processed: 0,
    records_failed: 0,
    error_summary: null,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  try {
    const result = await generateForecastRun(params);

    await db.collection('jobs').doc(jobId).update({
      status: 'completed',
      records_processed: 1,
      updated_at: FieldValue.serverTimestamp(),
    });

    return {
      job_id: jobId,
      forecast_id: result.forecast_id,
      evidence_backed: result.evidence_backed,
      recommended_candidates: result.candidates.map((c) => c.value),
      hypotheses_triggered: result.triggered_hypotheses,
      empty_reason: result.empty_reason,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.collection('jobs').doc(jobId).update({
      status: 'failed',
      error_summary: msg.slice(0, 500),
      updated_at: FieldValue.serverTimestamp(),
    });
    throw err;
  }
}
