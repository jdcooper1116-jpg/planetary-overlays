import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { PILOT_GAME_ID, PILOT_DATE_FROM, PILOT_DATE_TO, serializeDoc } from '../readers/pilotConstants';
import { evaluateHypothesis } from '../evidence/evaluator';
import { meetsPromotionThresholds, scoreCandidate } from './scoring';

type CandidateRow = Record<string, unknown> & {
  id: string;
  ref: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
};

export interface ValidateCandidatesResult {
  job_id: string;
  candidates_validated: number;
  validation_runs_written: number;
  errors: number;
}

export async function validateCandidates(): Promise<ValidateCandidatesResult> {
  const db = getAdminDb();

  const jobId = `VALIDATE_CANDIDATES_${Date.now()}`;
  await db.collection('jobs').doc(jobId).set({
    job_id: jobId,
    job_type: 'VALIDATE_CANDIDATES',
    status: 'running',
    triggered_by: 'phase4',
    records_processed: 0,
    records_failed: 0,
    error_summary: null,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  let candidates_validated = 0;
  let validation_runs_written = 0;
  let errors = 0;

  try {
    const candSnap = await db
      .collection('auto_hypothesis_queue')
      .where('game_id', '==', PILOT_GAME_ID)
      .where('status', 'in', ['candidate', 'testing', 'ready_for_review'])
      .get();

    const candidates: CandidateRow[] = candSnap.docs.map((d) => ({
      id: d.id,
      ref: d.ref,
      ...(serializeDoc(d.data()) as Record<string, unknown>),
    }));

    if (candidates.length === 0) {
      await db.collection('jobs').doc(jobId).update({
        status: 'completed',
        records_processed: 0,
        updated_at: FieldValue.serverTimestamp(),
      });
      return { job_id: jobId, candidates_validated: 0, validation_runs_written: 0, errors: 0 };
    }

    const featSnap = await db
      .collection('draw_symbolic_features')
      .where('game_id', '==', PILOT_GAME_ID)
      .where('draw_date', '>=', PILOT_DATE_FROM)
      .where('draw_date', '<=', PILOT_DATE_TO)
      .get();

    const features = featSnap.docs.map((d) => serializeDoc(d.data()));

    for (const candidate of candidates) {
      try {
        const trigger_logic = (candidate.trigger_logic ?? {}) as Record<string, unknown>;
        const expected_logic = (candidate.expected_logic ?? {}) as Record<string, unknown>;
        const baseline_rate = Number(candidate.baseline_rate ?? 0);

        let support_count = 0;
        let contradiction_count = 0;
        let neutral_count = 0;
        let inconclusive_count = 0;
        let trigger_fired_count = 0;

        for (const featureDoc of features) {
          const result = evaluateHypothesis(trigger_logic, expected_logic, featureDoc);

          if (result.result === 'support') {
            support_count++;
            trigger_fired_count++;
          } else if (result.result === 'contradiction') {
            contradiction_count++;
            trigger_fired_count++;
          } else if (result.result === 'neutral') {
            neutral_count++;
          } else {
            inconclusive_count++;
          }
        }

        const support_rate_on_fired =
          trigger_fired_count > 0
            ? parseFloat((support_count / trigger_fired_count).toFixed(4))
            : null;

        const contradiction_rate =
          trigger_fired_count > 0
            ? contradiction_count / trigger_fired_count
            : 0;

        const validated_lift =
          baseline_rate > 0 && support_rate_on_fired !== null
            ? parseFloat((support_rate_on_fired / baseline_rate).toFixed(4))
            : null;

        const { eligible, reason } = meetsPromotionThresholds({
          trigger_fired_count,
          support_rate_on_fired: support_rate_on_fired ?? 0,
          lift: validated_lift ?? 0,
          contradiction_rate,
        });

        let recommendation: string;
        if (trigger_fired_count === 0) {
          recommendation = 'no_trigger_fired';
        } else if (eligible) {
          recommendation = 'ready_for_review';
        } else if (
          support_rate_on_fired !== null &&
          support_rate_on_fired >= 0.55 &&
          trigger_fired_count >= 3
        ) {
          recommendation = 'borderline';
        } else {
          recommendation = 'reject';
        }

        const scoring = scoreCandidate({
          lift: validated_lift ?? 0,
          sample_size: trigger_fired_count,
          support_rate_on_fired: support_rate_on_fired ?? 0,
        });

        const validation_run_id = `vr_${String(candidate.candidate_id)}_${Date.now()}`;

        await db.collection('candidate_validation_runs').doc(validation_run_id).set({
          validation_run_id,
          candidate_id: candidate.candidate_id,
          observation_id: candidate.observation_id,
          game_id: PILOT_GAME_ID,
          draws_evaluated: features.length,
          trigger_fired_count,
          support_count,
          contradiction_count,
          neutral_count,
          inconclusive_count,
          support_rate_on_fired,
          contradiction_rate: parseFloat(contradiction_rate.toFixed(4)),
          baseline_rate,
          validated_lift,
          recommendation,
          promotion_eligible: eligible,
          promotion_ineligible_reason: eligible ? null : reason,
          confidence_score: scoring.confidence_score,
          confidence_label: scoring.confidence_label,
          created_at: FieldValue.serverTimestamp(),
        });

        validation_runs_written++;

        await candidate.ref.update({
          validation_run_count: FieldValue.increment(1),
          last_validation_id: validation_run_id,
          last_validated_at: FieldValue.serverTimestamp(),
          validated_support_count: support_count,
          validated_contradiction_count: contradiction_count,
          validated_neutral_count: neutral_count,
          validated_trigger_fired_count: trigger_fired_count,
          validated_support_rate: support_rate_on_fired,
          validated_lift,
          confidence_score: scoring.confidence_score,
          confidence_label: scoring.confidence_label,
          last_recommendation: recommendation,
          updated_at: FieldValue.serverTimestamp(),
        });

        candidates_validated++;
      } catch (err) {
        console.error('validation error for candidate', candidate.candidate_id, err);
        errors++;
      }
    }

    await db.collection('jobs').doc(jobId).update({
      status: 'completed',
      records_processed: candidates_validated,
      records_failed: errors,
      updated_at: FieldValue.serverTimestamp(),
    });

    return { job_id: jobId, candidates_validated, validation_runs_written, errors };
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
