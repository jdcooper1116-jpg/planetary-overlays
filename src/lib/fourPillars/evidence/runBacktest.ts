import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { evaluateHypothesis, EvidenceResult } from './evaluator';
import { createJob, updateJob } from '../jobs/jobRunner';
import {
  RULE_VERSION,
  OVERLAY_VERSION,
  SYMBOLIC_VERSION,
  MIRROR_VERSION,
} from '../constants/versions';

type HypothesisForBacktest = {
  id: string;
  title?: string;
  status?: string;
  rule_version?: string | null;
  trigger_logic: Record<string, unknown>;
  expected_logic: Record<string, unknown>;
};

export async function runBacktest(params: {
  game_id: string;
  date_from: string;
  date_to: string;
}): Promise<{
  job_id: string;
  draws_evaluated: number;
  evidence_written: number;
  errors: number;
}> {
  const jobId = await createJob({
    job_type: 'RUN_BACKTEST',
    game_id: params.game_id,
    date_from: params.date_from,
    date_to: params.date_to,
    rule_version: RULE_VERSION,
  });

  await updateJob(jobId, { status: 'running' });
  const db = getAdminDb();
  let draws_evaluated = 0;
  let evidence_written = 0;
  let errors = 0;

  try {
    // Load active hypotheses for this game
    const hypSnap = await db
      .collection('hypothesis_registry')
      .where('game_ids', 'array-contains', params.game_id)
      .where('status', 'in', ['testing', 'proposed', 'queued'])
      .get();

    const hypotheses: HypothesisForBacktest[] = hypSnap.docs.map((d) => {
      const data = d.data() as Omit<HypothesisForBacktest, 'id'>;
      return { id: d.id, ...data };
    });

    if (hypotheses.length === 0) {
      await updateJob(jobId, { status: 'completed', records_processed: 0 });
      return { job_id: jobId, draws_evaluated: 0, evidence_written: 0, errors: 0 };
    }

    // Load symbolic feature docs for the date range
    const featuresSnap = await db
      .collection('draw_symbolic_features')
      .where('game_id', '==', params.game_id)
      .where('draw_date', '>=', params.date_from)
      .where('draw_date', '<=', params.date_to)
      .get();

    for (const featureDoc of featuresSnap.docs) {
      const features = featureDoc.data() as Record<string, unknown>;
      const draw_id = features.draw_id as string;
      const draw_date = features.draw_date as string;
      const draw_label = features.draw_label as string;
      const jurisdiction_id = features.jurisdiction_id as string;

      for (const hyp of hypotheses) {
        // evidence_id is the idempotency key: one record per hypothesis + draw + rule_version
        const evidence_id = `${hyp.id}_${draw_id}_rv${RULE_VERSION}`;
        const evidenceRef = db.collection('evidence_tracker').doc(evidence_id);

        const evidenceSnap = await evidenceRef.get();
        if (evidenceSnap.exists) continue; // already recorded for this rule_version

        try {
          const evaluation = evaluateHypothesis(
            hyp.trigger_logic as Record<string, unknown>,
            hyp.expected_logic as Record<string, unknown>,
            features
          );

          await evidenceRef.set({
            evidence_id,
            hypothesis_id: hyp.id,
            draw_id,
            game_id: params.game_id,
            jurisdiction_id,
            draw_date,
            draw_label,
            result: evaluation.result,
            rule_version: RULE_VERSION,
            overlay_version: OVERLAY_VERSION,
            symbolic_version: SYMBOLIC_VERSION,
            mirror_version: MIRROR_VERSION,
            trigger_met: evaluation.trigger_met,
            outcome_met: evaluation.outcome_met,
            trigger_snapshot: hyp.trigger_logic,
            outcome_snapshot: hyp.expected_logic,
            recorded_at: new Date().toISOString(),
            created_at: FieldValue.serverTimestamp(),
          });

          evidence_written++;

          // Increment hypothesis counters
          const counterUpdate: Record<string, unknown> = {
            evidence_count_total: FieldValue.increment(1),
            last_tested_at: FieldValue.serverTimestamp(),
            updated_at: FieldValue.serverTimestamp(),
          };

          const r = evaluation.result as EvidenceResult;
          if (r === 'support') {
            counterUpdate.evidence_count_supporting = FieldValue.increment(1);
          } else if (r === 'contradiction') {
            counterUpdate.evidence_count_contradicting = FieldValue.increment(1);
          } else if (r === 'neutral') {
            counterUpdate.evidence_count_neutral = FieldValue.increment(1);
          }

          await db
            .collection('hypothesis_registry')
            .doc(hyp.id)
            .update(counterUpdate);
        } catch (err) {
          console.error('evidence error', evidence_id, err);
          errors++;
        }
      }

      draws_evaluated++;
    }

    // Clear evidence_stale on all in-scope draws
    const batch = db.batch();
    for (const featureDoc of featuresSnap.docs) {
      const drawRef = db
        .collection('draws')
        .doc(featureDoc.data().draw_id as string);
      batch.update(drawRef, {
        evidence_stale: false,
        updated_at: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    // Recompute support_rate on all tested hypotheses
    for (const hyp of hypotheses) {
      const hypRef = db.collection('hypothesis_registry').doc(hyp.id);
      const hypSnap2 = await hypRef.get();
      const hypData = hypSnap2.data()!;
      const total = (hypData.evidence_count_total as number) ?? 0;
      const supporting = (hypData.evidence_count_supporting as number) ?? 0;
      if (total > 0) {
        await hypRef.update({
          support_rate: parseFloat((supporting / total).toFixed(4)),
          updated_at: FieldValue.serverTimestamp(),
        });
      }
    }

    await updateJob(jobId, {
      status: 'completed',
      records_processed: draws_evaluated,
      records_failed: errors,
    });

    return { job_id: jobId, draws_evaluated, evidence_written, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateJob(jobId, { status: 'failed', error_summary: msg.slice(0, 500) });
    throw err;
  }
}
