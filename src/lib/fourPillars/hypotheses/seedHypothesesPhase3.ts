import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { PHASE3_HYPOTHESES } from './starterHypothesesPhase3';

/**
 * Seeds Phase 3 hypotheses idempotently.
 * Does not touch Phase 1 hypotheses already in hypothesis_registry.
 *
 * NOTE: The evaluator.ts supports these operators used by Phase 3 hypotheses:
 *   digit_root_in  → mapped to "key_in" suffix pattern
 *   moon_phase_name_in → mapped to "key_in" suffix pattern
 *   is_waxing: false → exact boolean match (already supported)
 *
 * Before running the backtest, confirm evaluator.ts has the "_in" operator support.
 * If not, the evaluator already supports it via the `condKey.endsWith('_in')` branch.
 */
export async function seedPhase3Hypotheses(): Promise<{
  seeded: number;
  existing: number;
  ids: string[];
}> {
  const db = getAdminDb();
  let seeded = 0;
  let existing = 0;
  const ids: string[] = [];

  for (const hyp of PHASE3_HYPOTHESES) {
    const ref = db.collection('hypothesis_registry').doc(hyp.hypothesis_id);
    const snap = await ref.get();

    if (!snap.exists) {
      await ref.set({
        ...hyp,
        evidence_count_supporting: 0,
        evidence_count_contradicting: 0,
        evidence_count_neutral: 0,
        evidence_count_total: 0,
        support_rate: null,
        last_tested_at: null,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
      seeded++;
      ids.push(hyp.hypothesis_id);
    } else {
      existing++;
    }
  }

  return { seeded, existing, ids };
}

export async function getPhase3HypothesisIds(): Promise<string[]> {
  return PHASE3_HYPOTHESES.map((h) => h.hypothesis_id);
}
