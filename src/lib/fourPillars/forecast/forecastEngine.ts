import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { computeCelestialSnapshot } from '../overlays/celestialEngine';
import { computeSymbolicFeatures } from '../features/symbolicEngine';
import { evaluateHypothesis } from '../evidence/evaluator';
import { createJob, updateJob } from '../jobs/jobRunner';
import {
  FORECAST_METHOD_VERSION,
  OVERLAY_VERSION,
  SYMBOLIC_VERSION,
  RULE_VERSION,
} from '../constants/versions';
import { normalizePeriodLabel } from '../constants/normalization';

type HypothesisForForecast = {
  id: string;
  title?: string;
  status?: string;
  rule_version?: string | null;
  trigger_logic: Record<string, unknown>;
  expected_logic: Record<string, unknown>;
  evidence_count_total?: number;
  evidence_count_supporting?: number;
  evidence_count_contradicting?: number;
  support_rate?: number | null;
  auto_generated?: boolean;
  forecast_approved?: boolean;
};

// Minimum thresholds for a hypothesis to contribute to a forecast.
// With only 31 days of Phase 1 data, most forecasts will return honest empty_reason.
const MIN_TRIGGER_FIRED = 3;   // hypothesis trigger must have fired at least 3 times
const MIN_SUPPORT_RATE = 0.60; // at least 60% support when trigger fired

export async function refreshForecasts(params: {
  game_id: string;
  jurisdiction_id: string;
  target_draw_date: string;
  target_draw_label: string;
  target_draw_time_utc: string;
}): Promise<{
  job_id: string;
  forecast_id: string;
  evidence_backed: boolean;
  recommended_candidates: string[];
  hypotheses_triggered: string[];
  empty_reason: string | null;
}> {
  const jobId = await createJob({
    job_type: 'REFRESH_FORECASTS',
    game_id: params.game_id,
    jurisdiction_id: params.jurisdiction_id,
  });

  await updateJob(jobId, { status: 'running' });
  const db = getAdminDb();

  const draw_label = normalizePeriodLabel(params.target_draw_label);
  const forecast_id = `${params.game_id}_${params.target_draw_date}_${draw_label}_fmv${FORECAST_METHOD_VERSION}`;

  try {
    // 1. Compute celestial + symbolic context for the target draw
    const targetUTC = new Date(params.target_draw_time_utc);
    const celestial = computeCelestialSnapshot(targetUTC);

    // Build synthetic draw/overlay objects for feature computation
    // Digits are unknown (this is a future draw), so we only compute calendar/celestial features
    const syntheticDraw: Record<string, unknown> = {
      draw_id: `forecast_target_${params.target_draw_date}_${draw_label}`,
      game_id: params.game_id,
      jurisdiction_id: params.jurisdiction_id,
      draw_date: params.target_draw_date,
      draw_label,
      draw_datetime_utc: params.target_draw_time_utc,
      digit_1: null,
      digit_2: null,
      digit_3: null,
      digit_sum: 0,
      digit_root: 0,
      result_padded: '???',
      numbers: [],
    };

    const syntheticOverlay: Record<string, unknown> = {
      moon_phase_name: celestial.moon_phase_name,
      moon_phase_angle: celestial.moon_phase_angle,
      moon_sign: celestial.moon_sign,
      sun_sign: celestial.sun_sign,
      is_waxing: celestial.is_waxing,
      moon_illumination_fraction: celestial.moon_illumination_fraction,
    };

    const contextFeatures = computeSymbolicFeatures(syntheticDraw, syntheticOverlay);

    // 2. Load hypotheses eligible for forecasting
    const hypSnap = await db
      .collection('hypothesis_registry')
      .where('game_ids', 'array-contains', params.game_id)
      .where('status', 'in', ['testing', 'moderate_support', 'strong_support'])
      .get();

    const hypotheses: HypothesisForForecast[] = hypSnap.docs
      .map((d) => {
        const data = d.data() as Omit<HypothesisForForecast, 'id'>;
        return { id: d.id, ...data };
      })
      .filter((h) => !h.auto_generated || h.forecast_approved === true);

    // 3. Filter to hypotheses that trigger on today's context AND meet evidence thresholds
    const triggered: Array<{
      id: string;
      expected_logic: Record<string, unknown>;
      support_rate: number;
    }> = [];

    for (const hyp of hypotheses) {
      const total = (hyp.evidence_count_total as number) ?? 0;
      const supporting = (hyp.evidence_count_supporting as number) ?? 0;
      const contradicting = (hyp.evidence_count_contradicting as number) ?? 0;
      const trigger_fired_count = supporting + contradicting;
      const support_rate = trigger_fired_count > 0 ? supporting / trigger_fired_count : 0;

      if (trigger_fired_count < MIN_TRIGGER_FIRED) continue;
      if (support_rate < MIN_SUPPORT_RATE) continue;

      // Check if trigger fires for today's context
      const eval_result = evaluateHypothesis(
        hyp.trigger_logic as Record<string, unknown>,
        {}, // pass empty expected — we just need trigger
        contextFeatures as unknown as Record<string, unknown>
      );

      if (eval_result.trigger_met) {
        triggered.push({
          id: hyp.id,
          expected_logic: hyp.expected_logic as Record<string, unknown>,
          support_rate,
        });
      }
    }

    // 4. Assemble candidate hints from expected_logic of triggered hypotheses
    const candidates: string[] = [];
    const hypotheses_triggered = triggered.map((h) => h.id);

    for (const h of triggered) {
      for (const [key, value] of Object.entries(h.expected_logic)) {
        if (key === 'digit_root') candidates.push(`digit_root:${value}`);
        else if (key === 'digit_1') candidates.push(`pos1:${value}`);
        else if (key === 'digit_2') candidates.push(`pos2:${value}`);
        else if (key === 'digit_3') candidates.push(`pos3:${value}`);
        else if (key === 'digit_sum_gte') candidates.push(`digit_sum_gte:${value}`);
        else if (key === 'digit_sum_lte') candidates.push(`digit_sum_lte:${value}`);
      }
    }

    const evidence_backed = candidates.length > 0;

    const empty_reason = evidence_backed
      ? null
      : hypotheses_triggered.length === 0
      ? 'No hypotheses triggered for this draw context given current celestial and calendar conditions.'
      : `${hypotheses_triggered.length} hypothesis/hypotheses triggered but insufficient evidence history. ` +
        `Required: ≥${MIN_TRIGGER_FIRED} trigger-fired draws with ≥${MIN_SUPPORT_RATE * 100}% support rate. ` +
        `Run more historical data through the backtest to build evidence.`;

    // 5. Write forecast document
    await db
      .collection('forecast_runs')
      .doc(forecast_id)
      .set(
        {
          forecast_id,
          game_id: params.game_id,
          jurisdiction_id: params.jurisdiction_id,
          target_draw_date: params.target_draw_date,
          target_draw_label: draw_label,
          generated_at: new Date().toISOString(),
          forecast_method_version: FORECAST_METHOD_VERSION,
          overlay_version: OVERLAY_VERSION,
          symbolic_version: SYMBOLIC_VERSION,
          rule_version: RULE_VERSION,
          evidence_backed,
          recommended_candidates: candidates,
          hypotheses_triggered,
          empty_reason,
          celestial_snapshot: syntheticOverlay,
          context_features: {
            weekday_name: contextFeatures.weekday_name,
            weekday_ruler: contextFeatures.weekday_ruler,
            moon_phase_name: contextFeatures.moon_phase_name,
            moon_sign: contextFeatures.moon_sign,
            sun_sign: contextFeatures.sun_sign,
            season: contextFeatures.season,
          },
          created_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    await updateJob(jobId, { status: 'completed', records_processed: 1 });

    return {
      job_id: jobId,
      forecast_id,
      evidence_backed,
      recommended_candidates: candidates,
      hypotheses_triggered,
      empty_reason,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateJob(jobId, { status: 'failed', error_summary: msg.slice(0, 500) });
    throw err;
  }
}
