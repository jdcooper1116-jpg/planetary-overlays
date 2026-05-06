import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { computeCelestialSnapshot } from './celestialEngine';
import { createJob, updateJob } from '../jobs/jobRunner';
import {
  OVERLAY_VERSION,
  COMPUTATION_VERSION,
  ZODIAC_MODE,
  ASPECT_ORB_RULE_SET,
} from '../constants/versions';

export interface BuildOverlaysParams {
  game_id: string;
  date_from: string;
  date_to: string;
}

export async function buildOverlays(params: BuildOverlaysParams): Promise<{
  job_id: string;
  built: number;
  skipped: number;
  errors: number;
}> {
  const jobId = await createJob({
    job_type: 'BUILD_OVERLAYS',
    game_id: params.game_id,
    date_from: params.date_from,
    date_to: params.date_to,
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
      const overlayId = `${draw.draw_id}_v${OVERLAY_VERSION}`;
      const overlayRef = db.collection('celestial_overlays').doc(overlayId);

      // Idempotency: skip if overlay exists and draw is not stale
      const overlaySnap = await overlayRef.get();
      if (overlaySnap.exists && !draw.overlay_stale) {
        skipped++;
        continue;
      }

      try {
        const utcStr: string | null = draw.draw_datetime_utc;
        if (!utcStr) {
          console.warn(`No UTC datetime for ${draw.draw_id}, skipping overlay`);
          errors++;
          continue;
        }

        const utcDate = new Date(utcStr);
        const time_confidence = draw._time_confidence ?? 'exact';
        const celestial = computeCelestialSnapshot(utcDate);

        await overlayRef.set({
          overlay_id: overlayId,
          draw_id: draw.draw_id,
          game_id: draw.game_id,
          jurisdiction_id: draw.jurisdiction_id,
          draw_date: draw.draw_date,
          draw_label: draw.draw_label,
          draw_datetime_utc: draw.draw_datetime_utc,
          overlay_version: OVERLAY_VERSION,
          computation_method: celestial.computation_method,
          ephemeris_version: celestial.ephemeris_version,
          computation_version: COMPUTATION_VERSION,
          zodiac_mode: ZODIAC_MODE,
          aspect_orb_rule_set: ASPECT_ORB_RULE_SET,
          time_confidence,
          is_stale: false,
          computed_at: new Date().toISOString(),
          moon_phase_angle: celestial.moon_phase_angle,
          moon_phase_name: celestial.moon_phase_name,
          moon_illumination_fraction: celestial.moon_illumination_fraction,
          is_waxing: celestial.is_waxing,
          moon_ecliptic_longitude: celestial.moon_ecliptic_longitude,
          moon_sign: celestial.moon_sign,
          sun_ecliptic_longitude: celestial.sun_ecliptic_longitude,
          sun_sign: celestial.sun_sign,
          // Phase 1: aspect computation deferred
          active_aspects: [],
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        });

        // Clear overlay_stale on the draw
        await drawDoc.ref.update({
          overlay_stale: false,
          updated_at: FieldValue.serverTimestamp(),
        });
        built++;
      } catch (err) {
        console.error('overlay error', draw.draw_id, err);
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
