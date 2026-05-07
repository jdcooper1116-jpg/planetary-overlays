import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { PILOT_GAME_ID, serializeDoc } from '../readers/pilotConstants';
import { scoreCandidate } from './scoring';
import { RULE_VERSION } from '../constants/versions';

// Minimum lift to be promoted from observation → candidate hypothesis
const MIN_LIFT_FOR_CANDIDATE = 1.20;
const MIN_SAMPLE_FOR_CANDIDATE = 3;
const MIN_OBSERVED_RATE_FOR_CANDIDATE = 0.30;

export interface GenerateCandidatesResult {
  job_id: string;
  observations_scanned: number;
  candidates_created: number;
  candidates_skipped_existing: number;
  candidates_below_threshold: number;
  errors: number;
}

function buildCandidateId(observationId: string): string {
  return `cand_${observationId.replace(/^obs_/, '')}`;
}

/**
 * Translates an observation's (trigger_field, trigger_value, outcome_field, outcome_label)
 * into a trigger_logic and expected_logic dict.
 *
 * Examples:
 *   trigger_field="weekday_name", trigger_value="Friday"
 *   → trigger_logic = { weekday_name: "Friday" }
 *
 *   outcome_field="digit_root", outcome_label="6"
 *   → expected_logic = { digit_root: 6 }   (number)
 *
 *   outcome_field="digit_1", outcome_label="8"
 *   → expected_logic = { digit_1: "8" }    (string)
 *
 *   outcome_field="is_double", outcome_label="true"
 *   → expected_logic = { is_double: true }  (boolean)
 *
 *   outcome_type="band", outcome_label="low_0_9"
 *   → expected_logic = { digit_sum_lte: 9 } (derived from band)
 */
function buildLogic(obs: Record<string, unknown>): {
  trigger_logic: Record<string, unknown>;
  expected_logic: Record<string, unknown>;
} {
  const trigger_logic: Record<string, unknown> = {};
  const expected_logic: Record<string, unknown> = {};

  // Trigger: always exact match on trigger_field
  const tf = obs.trigger_field as string;
  const tv = obs.trigger_value as string;

  // Determine trigger value type
  if (tv === 'true') trigger_logic[tf] = true;
  else if (tv === 'false') trigger_logic[tf] = false;
  else if (!isNaN(Number(tv)) && tf !== 'weekday_name' && tf !== 'weekday_ruler' && tf !== 'moon_sign' && tf !== 'sun_sign' && tf !== 'moon_phase_name' && tf !== 'draw_label') {
    trigger_logic[tf] = Number(tv);
  } else {
    trigger_logic[tf] = tv;
  }

  // Outcome
  const of_ = obs.outcome_field as string;
  const ol = obs.outcome_label as string;
  const ot = obs.outcome_type as string;

  if (ot === 'boolean') {
    expected_logic[of_] = ol === 'true';
  } else if (ot === 'exact') {
    // digit_root and digit_sum are numbers; digit_1/2/3 are strings
    const numericOutcomeFields = ['digit_root', 'digit_sum', 'digit_sum_mod3', 'digit_sum_mod9'];
    if (numericOutcomeFields.includes(of_)) {
      expected_logic[of_] = Number(ol);
    } else {
      expected_logic[of_] = ol;
    }
  } else if (ot === 'band') {
    // Parse band label like "low_0_9", "mid_10_16", "high_17_27"
    const parts = ol.split('_');
    if (parts.length >= 3) {
      const lo = parseInt(parts[parts.length - 2], 10);
      const hi = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lo) && !isNaN(hi)) {
        expected_logic[`${of_}_gte`] = lo;
        expected_logic[`${of_}_lte`] = hi;
      }
    }
  }

  return { trigger_logic, expected_logic };
}

function buildTitle(obs: Record<string, unknown>): string {
  const tf = obs.trigger_field as string;
  const tv = obs.trigger_value as string;
  const of_ = obs.outcome_field as string;
  const ol = obs.outcome_label as string;
  const lift = (obs.lift as number).toFixed(2);
  return `AUTO: ${tf}=${tv} → ${of_}=${ol} (${lift}× lift)`;
}

function buildDescription(obs: Record<string, unknown>): string {
  const sample = obs.sample_size as number;
  const count = obs.observed_count as number;
  const rate = Math.round((obs.observed_rate as number) * 100);
  const base = Math.round((obs.baseline_rate as number) * 100);
  const lift = (obs.lift as number).toFixed(2);
  return (
    `Auto-discovered: when ${obs.trigger_field}=${obs.trigger_value}, outcome ${obs.outcome_field}=${obs.outcome_label} ` +
    `appears ${rate}% of the time (${count}/${sample} draws) vs baseline ${base}%. ` +
    `Lift: ${lift}×. Source observation: ${obs.observation_id}.`
  );
}

export async function generateCandidates(): Promise<GenerateCandidatesResult> {
  const db = getAdminDb();

  const jobId = `GEN_CANDIDATES_${Date.now()}`;
  await db.collection('jobs').doc(jobId).set({
    job_id: jobId,
    job_type: 'GENERATE_CANDIDATES',
    status: 'running',
    triggered_by: 'phase4',
    records_processed: 0,
    records_failed: 0,
    error_summary: null,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  let candidates_created = 0;
  let candidates_skipped_existing = 0;
  let candidates_below_threshold = 0;
  let errors = 0;

  try {
    // Load all observations sorted by lift desc
    const obsSnap = await db
      .collection('observation_log')
      .where('game_id', '==', PILOT_GAME_ID)
      .orderBy('lift', 'desc')
      .get();

    const observations = obsSnap.docs.map((d) => serializeDoc(d.data()));
    let observations_scanned = 0;

    for (const obs of observations) {
      observations_scanned++;
      const lift = obs.lift as number;
      const sample = obs.observed_count as number; // trigger-fired count
      const observed_rate = obs.observed_rate as number;

      // Check if it meets the bar for generating a candidate
      if (
        lift < MIN_LIFT_FOR_CANDIDATE ||
        sample < MIN_SAMPLE_FOR_CANDIDATE ||
        observed_rate < MIN_OBSERVED_RATE_FOR_CANDIDATE
      ) {
        candidates_below_threshold++;
        continue;
      }

      const candidate_id = buildCandidateId(obs.observation_id as string);
      const candRef = db.collection('auto_hypothesis_queue').doc(candidate_id);
      const candSnap = await candRef.get();

      if (candSnap.exists) {
        // Update scoring with fresh observation data
        const scoring = scoreCandidate({
          lift,
          sample_size: obs.sample_size as number,
          support_rate_on_fired: observed_rate,
        });
        await candRef.update({
          lift: obs.lift,
          sample_size: obs.sample_size,
          observed_rate: obs.observed_rate,
          baseline_rate: obs.baseline_rate,
          confidence_score: scoring.confidence_score,
          confidence_label: scoring.confidence_label,
          updated_at: FieldValue.serverTimestamp(),
        });
        candidates_skipped_existing++;
        continue;
      }

      try {
        const { trigger_logic, expected_logic } = buildLogic(obs);
        const scoring = scoreCandidate({
          lift,
          sample_size: obs.sample_size as number,
          support_rate_on_fired: observed_rate,
        });

        await candRef.set({
          candidate_id,
          observation_id: obs.observation_id,
          title: buildTitle(obs),
          description: buildDescription(obs),
          pattern_family: obs.pattern_family,
          trigger_field: obs.trigger_field,
          trigger_value: obs.trigger_value,
          outcome_field: obs.outcome_field,
          outcome_label: obs.outcome_label,
          outcome_type: obs.outcome_type,
          trigger_logic,
          expected_logic,
          rule_version: RULE_VERSION,
          game_id: PILOT_GAME_ID,
          game_ids: [PILOT_GAME_ID],
          jurisdiction_ids: ['ny'],
          draw_labels: ['midday', 'evening'],
          // Observation-derived stats
          sample_size: obs.sample_size,
          observed_count: obs.observed_count,
          observed_rate: obs.observed_rate,
          baseline_rate: obs.baseline_rate,
          lift: obs.lift,
          // Scoring
          confidence_score: scoring.confidence_score,
          confidence_label: scoring.confidence_label,
          lift_component: scoring.lift_component,
          sample_component: scoring.sample_component,
          rate_component: scoring.rate_component,
          // Status
          status: 'candidate',
          promotion_decision: null,
          promotion_reason: null,
          // Validation (filled in by candidateValidator)
          validation_run_count: 0,
          last_validation_id: null,
          last_validated_at: null,
          validated_support_count: 0,
          validated_contradiction_count: 0,
          validated_neutral_count: 0,
          validated_trigger_fired_count: 0,
          validated_support_rate: null,
          validated_lift: null,
          // Metadata
          auto_generated: true,
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        });

        candidates_created++;
      } catch (err) {
        console.error('candidate generation error', obs.observation_id, err);
        errors++;
      }
    }

    await db.collection('jobs').doc(jobId).update({
      status: 'completed',
      records_processed: candidates_created + candidates_skipped_existing,
      records_failed: errors,
      updated_at: FieldValue.serverTimestamp(),
    });

    return {
      job_id: jobId,
      observations_scanned,
      candidates_created,
      candidates_skipped_existing,
      candidates_below_threshold,
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
