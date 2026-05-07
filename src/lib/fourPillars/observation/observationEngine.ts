import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { PILOT_GAME_ID, PILOT_DATE_FROM, PILOT_DATE_TO, serializeDoc } from '../readers/pilotConstants';
import { PATTERN_FAMILIES } from './patternFamilies';
import { computeBaselineStats, getDocOutcomeLabel } from './baselineStats';

// ── Thresholds for writing an observation ─────────────────────────────────────
// Observations that don't meet these are just noise — not worth storing.
export const OBS_MIN_SAMPLE = 3;         // trigger must appear at least 3 times
export const OBS_MIN_LIFT = 1.20;        // observed rate must be ≥20% above baseline
export const OBS_MIN_OBSERVED_RATE = 0.30; // raw observed rate must be ≥30%
export const OBS_MAX_PER_FAMILY = 20;   // cap per family to avoid spam

export interface ObservationScanResult {
  job_id: string;
  total_docs_scanned: number;
  families_scanned: number;
  observations_written: number;
  observations_skipped_existing: number;
  low_lift_skipped: number;
  errors: number;
}

function buildObservationId(familyId: string, triggerValue: string, outcomeLabel: string): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  return `obs_${safe(familyId)}_${safe(triggerValue)}_${safe(outcomeLabel)}`;
}

export async function runObservationScan(): Promise<ObservationScanResult> {
  const db = getAdminDb();

  // Create a job record
  const jobId = `OBS_SCAN_${Date.now()}`;
  await db.collection('jobs').doc(jobId).set({
    job_id: jobId,
    job_type: 'OBSERVATION_SCAN',
    status: 'running',
    triggered_by: 'phase4',
    records_processed: 0,
    records_failed: 0,
    error_summary: null,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  let observations_written = 0;
  let observations_skipped_existing = 0;
  let low_lift_skipped = 0;
  let errors = 0;

  try {
    // Load all feature docs for the pilot
    const featSnap = await db
      .collection('draw_symbolic_features')
      .where('game_id', '==', PILOT_GAME_ID)
      .where('draw_date', '>=', PILOT_DATE_FROM)
      .where('draw_date', '<=', PILOT_DATE_TO)
      .get();

    const docs = featSnap.docs.map((d) => serializeDoc(d.data()));
    const total_docs_scanned = docs.length;

    if (total_docs_scanned === 0) {
      await db.collection('jobs').doc(jobId).update({
        status: 'failed',
        error_summary: 'No symbolic feature docs found. Run build-features first.',
        updated_at: FieldValue.serverTimestamp(),
      });
      return {
        job_id: jobId,
        total_docs_scanned: 0,
        families_scanned: 0,
        observations_written: 0,
        observations_skipped_existing: 0,
        low_lift_skipped: 0,
        errors: 1,
      };
    }

    for (const family of PATTERN_FAMILIES) {
      try {
        // Compute baseline rates across all docs
        const baseline = computeBaselineStats(docs, family);

        // Build a map of baseline by outcome label
        const baselineByLabel = new Map<string, number>(
          baseline.outcomes.map((o) => [o.outcome_label, o.baseline_rate])
        );

        // Group docs by trigger value
        const triggerGroups = new Map<string, Record<string, unknown>[]>();
        for (const doc of docs) {
          const tv = doc[family.trigger_field];
          if (tv === undefined || tv === null) continue;
          const key = String(tv);
          const group = triggerGroups.get(key) ?? [];
          group.push(doc);
          triggerGroups.set(key, group);
        }

        let familyWritten = 0;

        for (const [triggerValue, group] of triggerGroups.entries()) {
          if (group.length < family.min_trigger_sample) continue;

          // Count outcomes within this trigger group
          const outcomeCount = new Map<string, number>();
          for (const doc of group) {
            const label = getDocOutcomeLabel(doc, family);
            if (label === null) continue;
            outcomeCount.set(label, (outcomeCount.get(label) ?? 0) + 1);
          }

          for (const [outcomeLabel, count] of outcomeCount.entries()) {
            if (familyWritten >= OBS_MAX_PER_FAMILY) break;

            const observed_rate = count / group.length;
            const baseline_rate = baselineByLabel.get(outcomeLabel) ?? 0;

            // Skip if baseline is 0 (can't compute lift meaningfully)
            if (baseline_rate === 0) continue;

            const lift = observed_rate / baseline_rate;

            if (
              lift < OBS_MIN_LIFT ||
              observed_rate < OBS_MIN_OBSERVED_RATE ||
              count < OBS_MIN_SAMPLE
            ) {
              low_lift_skipped++;
              continue;
            }

            const observation_id = buildObservationId(
              family.family_id,
              triggerValue,
              outcomeLabel
            );

            const obsRef = db.collection('observation_log').doc(observation_id);
            const obsSnap = await obsRef.get();

            if (obsSnap.exists) {
              // Update with fresh stats (data may have changed after more backtesting)
              await obsRef.update({
                sample_size: group.length,
                observed_count: count,
                observed_rate: parseFloat(observed_rate.toFixed(4)),
                baseline_rate: parseFloat(baseline_rate.toFixed(4)),
                lift: parseFloat(lift.toFixed(4)),
                updated_at: FieldValue.serverTimestamp(),
              });
              observations_skipped_existing++;
            } else {
              await obsRef.set({
                observation_id,
                pattern_family: family.family_id,
                family_description: family.description,
                trigger_field: family.trigger_field,
                trigger_value: triggerValue,
                outcome_field: family.outcome_field,
                outcome_label: outcomeLabel,
                outcome_type: family.outcome_type,
                sample_size: group.length,           // how many draws had this trigger
                observed_count: count,                // how many of those had the outcome
                observed_rate: parseFloat(observed_rate.toFixed(4)),
                baseline_rate: parseFloat(baseline_rate.toFixed(4)),
                lift: parseFloat(lift.toFixed(4)),
                total_pilot_draws: total_docs_scanned,
                game_id: PILOT_GAME_ID,
                pilot_window_from: PILOT_DATE_FROM,
                pilot_window_to: PILOT_DATE_TO,
                notes: `${triggerValue} → ${outcomeLabel}: ${Math.round(observed_rate * 100)}% vs baseline ${Math.round(baseline_rate * 100)}% (lift ${lift.toFixed(2)}×)`,
                candidate_status: 'observed',  // starts as raw observation
                created_at: FieldValue.serverTimestamp(),
                updated_at: FieldValue.serverTimestamp(),
              });
              observations_written++;
              familyWritten++;
            }
          }
        }
      } catch (err) {
        console.error('observation scan error for family', family.family_id, err);
        errors++;
      }
    }

    await db.collection('jobs').doc(jobId).update({
      status: 'completed',
      records_processed: observations_written + observations_skipped_existing,
      records_failed: errors,
      updated_at: FieldValue.serverTimestamp(),
    });

    return {
      job_id: jobId,
      total_docs_scanned,
      families_scanned: PATTERN_FAMILIES.length,
      observations_written,
      observations_skipped_existing,
      low_lift_skipped,
      errors,
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
