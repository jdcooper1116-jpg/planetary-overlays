import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  PILOT_DRAW_LABELS,
  PILOT_GAME_ID,
  PILOT_JURISDICTION_ID,
  serializeDoc,
} from '../readers/pilotConstants';
import { meetsPromotionThresholds } from './scoring';
import { RULE_VERSION } from '../constants/versions';

type CandidatePromotionRow = Record<string, unknown> & {
  ref: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
};

export interface PromotionResult {
  job_id: string;
  candidates_evaluated: number;
  promoted_to_review: number;
  rejected: number;
  skipped_no_validation: number;
  errors: number;
  promoted_ids: string[];
  rejected_ids: string[];
}

function stringArrayOrFallback(value: unknown, fallback: readonly string[]): string[] {
  if (Array.isArray(value)) {
    const values = value.filter((item): item is string => typeof item === 'string' && item.length > 0);
    if (values.length > 0) return values;
  }
  return [...fallback];
}

export async function runPromotionEngine(): Promise<PromotionResult> {
  const db = getAdminDb();

  const jobId = `PROMOTE_CANDIDATES_${Date.now()}`;
  await db.collection('jobs').doc(jobId).set({
    job_id: jobId,
    job_type: 'PROMOTE_CANDIDATES',
    status: 'running',
    triggered_by: 'phase4',
    records_processed: 0,
    records_failed: 0,
    error_summary: null,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  let candidates_evaluated = 0;
  let promoted_to_review = 0;
  let rejected = 0;
  let skipped_no_validation = 0;
  let errors = 0;
  const promoted_ids: string[] = [];
  const rejected_ids: string[] = [];

  try {
    const candSnap = await db
      .collection('auto_hypothesis_queue')
      .where('game_id', '==', PILOT_GAME_ID)
      .where('status', '==', 'candidate')
      .get();

    const candidates: CandidatePromotionRow[] = candSnap.docs.map((d) => ({
      ref: d.ref,
      ...(serializeDoc(d.data()) as Record<string, unknown>),
    }));

    for (const cand of candidates) {
      candidates_evaluated++;

      if (!cand.last_validation_id || cand.validated_trigger_fired_count === undefined) {
        skipped_no_validation++;
        continue;
      }

      const trigger_fired = Number(cand.validated_trigger_fired_count ?? 0);
      const support_rate = cand.validated_support_rate as number | null;
      const lift = cand.validated_lift as number | null;
      const contradiction_count = Number(cand.validated_contradiction_count ?? 0);

      if (trigger_fired === 0 || support_rate === null || lift === null) {
        await cand.ref.update({
          promotion_decision: 'insufficient_data',
          promotion_reason: 'Trigger never fired in pilot dataset.',
          updated_at: FieldValue.serverTimestamp(),
        });
        continue;
      }

      const contradiction_rate = trigger_fired > 0 ? contradiction_count / trigger_fired : 0;

      const { eligible, reason } = meetsPromotionThresholds({
        trigger_fired_count: trigger_fired,
        support_rate_on_fired: support_rate,
        lift,
        contradiction_rate,
      });

      try {
        if (eligible) {
          const registry_id = `auto_${String(cand.candidate_id)}`;
          const regRef = db.collection('hypothesis_registry').doc(registry_id);
          const regSnap = await regRef.get();

          if (!regSnap.exists) {
            const gameIds = stringArrayOrFallback(cand.game_ids, [String(cand.game_id ?? PILOT_GAME_ID)]);
            const jurisdictionIds = stringArrayOrFallback(cand.jurisdiction_ids, [
              String(cand.jurisdiction_id ?? PILOT_JURISDICTION_ID),
            ]);
            const drawLabels = stringArrayOrFallback(cand.draw_labels, PILOT_DRAW_LABELS);

            await regRef.set({
              hypothesis_id: registry_id,
              source: 'auto_observation',
              candidate_id: cand.candidate_id,
              observation_id: cand.observation_id,
              title: cand.title,
              description: cand.description,
              system_family: `auto_${String(cand.pattern_family)}`,
              system_name: cand.pattern_family,
              jurisdiction_ids: jurisdictionIds,
              game_ids: gameIds,
              draw_labels: drawLabels,
              trigger_logic: cand.trigger_logic,
              expected_logic: cand.expected_logic,
              rule_version: RULE_VERSION,
              status: 'proposed',
              auto_generated: true,
              forecast_approved: false,
              review_required: true,
              confidence_score: cand.confidence_score,
              confidence_label: cand.confidence_label,
              validated_support_rate: support_rate,
              validated_lift: lift,
              evidence_count_supporting: 0,
              evidence_count_contradicting: 0,
              evidence_count_neutral: 0,
              evidence_count_total: 0,
              support_rate: null,
              last_tested_at: null,
              promoted_at: FieldValue.serverTimestamp(),
              created_at: FieldValue.serverTimestamp(),
              updated_at: FieldValue.serverTimestamp(),
            });
          }

          await cand.ref.update({
            status: 'ready_for_review',
            promotion_decision: 'promoted_to_registry_pending_review',
            promotion_reason: reason,
            registry_id,
            promoted_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
          });

          promoted_to_review++;
          promoted_ids.push(String(cand.candidate_id));
        } else {
          await cand.ref.update({
            status: 'rejected',
            promotion_decision: 'rejected',
            promotion_reason: reason,
            rejected_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
          });

          rejected++;
          rejected_ids.push(String(cand.candidate_id));
        }
      } catch (err) {
        console.error('promotion error', cand.candidate_id, err);
        errors++;
      }
    }

    await db.collection('jobs').doc(jobId).update({
      status: 'completed',
      records_processed: candidates_evaluated,
      records_failed: errors,
      updated_at: FieldValue.serverTimestamp(),
    });

    return {
      job_id: jobId,
      candidates_evaluated,
      promoted_to_review,
      rejected,
      skipped_no_validation,
      errors,
      promoted_ids,
      rejected_ids,
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
