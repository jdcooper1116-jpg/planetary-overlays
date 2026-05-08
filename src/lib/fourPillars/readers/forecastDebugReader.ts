import { getAdminDb } from '@/lib/firebase/admin';
import { PILOT_GAME_ID, serializeDoc } from './pilotConstants';
import {
  FORECAST_MIN_SUPPORT_RATE,
  FORECAST_MIN_TRIGGER_FIRED,
} from '@/lib/fourPillars/phase5/forecastConstants';

export interface HypothesisCheckResult {
  hypothesis_id: string;
  title: string;
  status: string;
  evidence_count_total: number;
  evidence_count_supporting: number;
  evidence_count_contradicting: number;
  trigger_fired_count: number;
  support_rate_on_fired: number | null;
  // Why it did or didn't contribute
  passed_threshold: boolean;
  threshold_failure_reason: string | null;
  // Whether its trigger fired for the target context
  trigger_fired_for_target: boolean | null;
  // What it would have contributed
  candidate_contributions: string[];
}

export interface ForecastDebugReport {
  forecast: Record<string, unknown> | null;
  hypotheses_checked: HypothesisCheckResult[];
  summary: {
    total_hypotheses: number;
    passed_threshold: number;
    trigger_fired: number;
    contributed_candidates: number;
    final_decision: 'evidence_backed' | 'empty_reason';
    empty_reason: string | null;
  };
}

export async function buildForecastDebugReport(forecastId?: string): Promise<ForecastDebugReport> {
  const db = getAdminDb();

  // Get the target forecast
  let forecastDoc: Record<string, unknown> | null = null;
  if (forecastId) {
    const snap = await db.collection('forecast_runs').doc(forecastId).get();
    if (snap.exists) forecastDoc = serializeDoc(snap.data()!);
  } else {
    const snap = await db
      .collection('forecast_runs')
      .where('game_id', '==', PILOT_GAME_ID)
      .orderBy('generated_at', 'desc')
      .limit(1)
      .get();
    if (!snap.empty) forecastDoc = serializeDoc(snap.docs[0].data());
  }

  // Load all hypotheses for the pilot game
  const hypSnap = await db
    .collection('hypothesis_registry')
    .where('game_ids', 'array-contains', PILOT_GAME_ID)
    .get();

  const hypotheses = hypSnap.docs.map((d) => serializeDoc(d.data()));

  // The hypotheses that actually triggered (from the forecast doc)
  const triggeredIds = new Set<string>(
    (forecastDoc?.hypotheses_triggered as string[] | null) ?? []
  );

  const hypotheses_checked: HypothesisCheckResult[] = hypotheses.map((hyp) => {
    const total = (hyp.evidence_count_total as number) ?? 0;
    const supporting = (hyp.evidence_count_supporting as number) ?? 0;
    const contradicting = (hyp.evidence_count_contradicting as number) ?? 0;
    const trigger_fired_count = supporting + contradicting;
    const support_rate_on_fired =
      trigger_fired_count > 0 ? parseFloat((supporting / trigger_fired_count).toFixed(4)) : null;

    // Threshold check
    let passed_threshold = true;
    let threshold_failure_reason: string | null = null;

    if (trigger_fired_count < FORECAST_MIN_TRIGGER_FIRED) {
      passed_threshold = false;
      threshold_failure_reason = `Only ${trigger_fired_count} trigger-fired draws (need ≥${FORECAST_MIN_TRIGGER_FIRED})`;
    } else if (support_rate_on_fired === null || support_rate_on_fired < FORECAST_MIN_SUPPORT_RATE) {
      passed_threshold = false;
      threshold_failure_reason = `Support rate ${support_rate_on_fired !== null ? Math.round(support_rate_on_fired * 100) + '%' : 'N/A'} (need ≥${Math.round(FORECAST_MIN_SUPPORT_RATE * 100)}%)`;
    }

    // Did it trigger for the target context?
    const trigger_fired_for_target = triggeredIds.has(hyp.hypothesis_id as string) ? true : null;

    // What would it contribute?
    const candidate_contributions: string[] = [];
    if (passed_threshold && triggeredIds.has(hyp.hypothesis_id as string)) {
      const expected = hyp.expected_logic as Record<string, unknown>;
      for (const [key, value] of Object.entries(expected)) {
        if (key === 'digit_root') candidate_contributions.push(`digit_root:${value}`);
        else if (key === 'digit_root_in') candidate_contributions.push(`digit_root_in:[${(value as number[]).join(',')}]`);
        else if (key === 'digit_1') candidate_contributions.push(`pos1:${value}`);
        else if (key === 'digit_2') candidate_contributions.push(`pos2:${value}`);
        else if (key === 'digit_3') candidate_contributions.push(`pos3:${value}`);
        else if (key === 'digit_sum_gte') candidate_contributions.push(`digit_sum_gte:${value}`);
        else if (key === 'digit_sum_lte') candidate_contributions.push(`digit_sum_lte:${value}`);
        else if (key === 'is_double') candidate_contributions.push('structure:double');
      }
    }

    return {
      hypothesis_id: hyp.hypothesis_id as string,
      title: hyp.title as string,
      status: hyp.status as string,
      evidence_count_total: total,
      evidence_count_supporting: supporting,
      evidence_count_contradicting: contradicting,
      trigger_fired_count,
      support_rate_on_fired,
      passed_threshold,
      threshold_failure_reason,
      trigger_fired_for_target,
      candidate_contributions,
    };
  });

  // Sort: passed threshold first, then by trigger_fired_count desc
  hypotheses_checked.sort((a, b) => {
    if (a.passed_threshold !== b.passed_threshold) return a.passed_threshold ? -1 : 1;
    return b.trigger_fired_count - a.trigger_fired_count;
  });

  const passed = hypotheses_checked.filter((h) => h.passed_threshold);
  const triggered = hypotheses_checked.filter((h) => h.trigger_fired_for_target === true);
  const contributed = hypotheses_checked.filter((h) => h.candidate_contributions.length > 0);

  const evidenceBacked = (forecastDoc?.evidence_backed as boolean | null) ?? false;

  return {
    forecast: forecastDoc,
    hypotheses_checked,
    summary: {
      total_hypotheses: hypotheses_checked.length,
      passed_threshold: passed.length,
      trigger_fired: triggered.length,
      contributed_candidates: contributed.length,
      final_decision: evidenceBacked ? 'evidence_backed' : 'empty_reason',
      empty_reason: (forecastDoc?.empty_reason as string | null) ?? null,
    },
  };
}

// Lighter read: just load recent jobs
export async function readRecentJobs(limit = 20): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();
  const snap = await db
    .collection('jobs')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => serializeDoc(d.data()));
}
