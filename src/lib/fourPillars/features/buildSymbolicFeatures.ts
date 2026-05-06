import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { computeSymbolicFeatures } from './symbolicEngine';
import { createJob, updateJob } from '../jobs/jobRunner';
import { SYMBOLIC_VERSION, OVERLAY_VERSION } from '../constants/versions';

export async function buildSymbolicFeatures(params: {
  game_id: string;
  date_from: string;
  date_to: string;
}): Promise<{ job_id: string; built: number; skipped: number; errors: number }> {
  const jobId = await createJob({
    job_type: 'BUILD_SYMBOLIC_FEATURES',
    game_id: params.game_id,
    date_from: params.date_from,
    date_to: params.date_to,
    symbolic_version: SYMBOLIC_VERSION,
    overlay_version: OVERLAY_VERSION,
  });

  await updateJob(jobId, { status: 'running' });
  const db = getAdminDb();
  let built = 0, skipped = 0, errors = 0;

  try {
    const drawsSnap = await db
      .collection('draws')
      .where('game_id', '==', params.game_id)
      .where('draw_date', '>=', params.date_from)
      .where('draw_date', '<=', params.date_to)
      .get();

    for (const drawDoc of drawsSnap.docs) {
      const draw = drawDoc.data();
      const featureDocId = `${draw.draw_id}_sym${SYMBOLIC_VERSION}`;
      const featureRef = db.collection('draw_symbolic_features').doc(featureDocId);

      const featureSnap = await featureRef.get();
      if (featureSnap.exists && !draw.features_stale) {
        skipped++;
        continue;
      }

      try {
        const overlayId = `${draw.draw_id}_v${OVERLAY_VERSION}`;
        const overlaySnap = await db
          .collection('celestial_overlays')
          .doc(overlayId)
          .get();

        if (!overlaySnap.exists) {
          console.warn(`No overlay for ${draw.draw_id} — build overlays first`);
          errors++;
          continue;
        }

        const overlay = overlaySnap.data()!;
        const features = computeSymbolicFeatures(draw, overlay);

        await featureRef.set({
          ...features,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        });

        await drawDoc.ref.update({
          features_stale: false,
          updated_at: FieldValue.serverTimestamp(),
        });

        built++;
      } catch (err) {
        console.error('feature build error', draw.draw_id, err);
        errors++;
      }
    }

    await updateJob(jobId, {
      status: 'completed',
      records_processed: built + skipped,
      records_failed: errors,
    });

    return { job_id: jobId, built, skipped, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateJob(jobId, { status: 'failed', error_summary: msg.slice(0, 500) });
    throw err;
  }
}
