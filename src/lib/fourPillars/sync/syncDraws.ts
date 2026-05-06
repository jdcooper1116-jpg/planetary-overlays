import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { fetchEngineDraws } from './engineClient';
import { mapEngineDraw } from './drawMapper';
import { createJob, updateJob } from '../jobs/jobRunner';
import { MIRROR_VERSION } from '../constants/versions';

export interface SyncDrawsParams {
  jurisdiction_id: string;
  game_id: string;
  state: string;
  game: string;
  date_from: string;
  date_to: string;
}

export interface SyncDrawsResult {
  job_id: string;
  total_from_engine: number;
  mirrored: number;
  updated: number;
  skipped: number;
  errors: number;
}

export async function syncDraws(params: SyncDrawsParams): Promise<SyncDrawsResult> {
  const jobId = await createJob({
    job_type: 'SYNC_DRAWS',
    jurisdiction_id: params.jurisdiction_id,
    game_id: params.game_id,
    date_from: params.date_from,
    date_to: params.date_to,
    mirror_version: MIRROR_VERSION,
  });

  await updateJob(jobId, { status: 'running' });

  const db = getAdminDb();
  const now = new Date();
  let mirrored = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const engineResponse = await fetchEngineDraws({
      state: params.state,
      game: params.game,
      from: params.date_from,
      to: params.date_to,
    });

    const draws = engineResponse.draws ?? [];

    // Batch writes — Firestore limit is 500 per batch
    const BATCH_SIZE = 400;
    for (let i = 0; i < draws.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const slice = draws.slice(i, i + BATCH_SIZE);

      for (const engineDraw of slice) {
        try {
          const mirrored_draw = mapEngineDraw(engineDraw, now);
          const ref = db.collection('draws').doc(mirrored_draw.draw_id);
          const snap = await ref.get();

          if (!snap.exists) {
            batch.set(ref, {
              ...mirrored_draw,
              created_at: FieldValue.serverTimestamp(),
              updated_at: FieldValue.serverTimestamp(),
            });
            mirrored++;
          } else {
            const existing = snap.data()!;
            const correctionBumped =
              (mirrored_draw.correction_version ?? 0) >
              (existing.correction_version ?? 0);
            const resultChanged =
              mirrored_draw.result_padded !== existing.result_padded;

            if (correctionBumped || resultChanged) {
              // Correction detected — mark all downstream stale
              batch.update(ref, {
                ...mirrored_draw,
                overlay_stale: true,
                features_stale: true,
                evidence_stale: true,
                forecast_stale: true,
                updated_at: FieldValue.serverTimestamp(),
              });
              updated++;
            } else {
              // No material change — touch sync timestamp only
              batch.update(ref, {
                sync_received_at: now.toISOString(),
                updated_at: FieldValue.serverTimestamp(),
              });
              skipped++;
            }
          }
        } catch (err) {
          console.error('mapEngineDraw error', engineDraw.id, err);
          errors++;
        }
      }

      await batch.commit();
    }

    await updateJob(jobId, {
      status: 'completed',
      records_processed: mirrored + updated + skipped,
      records_failed: errors,
    });

    return {
      job_id: jobId,
      total_from_engine: draws.length,
      mirrored,
      updated,
      skipped,
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateJob(jobId, { status: 'failed', error_summary: msg.slice(0, 500) });
    throw err;
  }
}
