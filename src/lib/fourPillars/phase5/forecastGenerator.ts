import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { serializeDoc, PILOT_GAME_ID } from '../readers/pilotConstants';
import { computeCelestialSnapshot } from '../overlays/celestialEngine';
import { computeSymbolicFeatures } from '../features/symbolicEngine';
import { evaluateHypothesis } from '../evidence/evaluator';
import { normalizePeriodLabel } from '../constants/normalization';
import {
  FORECAST_MIN_TRIGGER_FIRED,
  FORECAST_MIN_SUPPORT_RATE,
  FORECAST_METHOD_VERSION,
  OVERLAY_VERSION,
  SYMBOLIC_VERSION,
  RULE_VERSION,
  buildForecastId,
} from './forecastConstants';
import type {
  ForecastRun,
  ForecastCandidate,
  HypothesisDecision,
  ForecastStatus,
} from './forecastRunTypes';

type ForecastHypothesisRow = Record<string, unknown> & {
  id: string;
};

export interface GenerateForecastParams {
  game_id: string;
  jurisdiction_id: string;
  target_draw_date: string;
  target_draw_label: string;
  target_draw_time_utc: string;
}

export interface GenerateForecastResult {
  forecast_id: string;
  status: ForecastStatus;
  evidence_backed: boolean;
  candidates: ForecastCandidate[];
  triggered_hypotheses: string[];
  empty_reason: string | null;
  decision_chain_length: number;
}

export async function generateForecastRun(
  params: GenerateForecastParams
): Promise<GenerateForecastResult> {
  if (params.game_id !== PILOT_GAME_ID) {
    throw new Error(
      `Forecast generation is currently supported only for ${PILOT_GAME_ID}. ` +
      `${params.game_id} remains research/backtest-only until forecast support is explicitly approved.`
    );
  }

  const db = getAdminDb();
  const draw_label = normalizePeriodLabel(params.target_draw_label);
  const forecast_id = buildForecastId(params.game_id, params.target_draw_date, draw_label);

  // 1. Compute celestial + symbolic context for the target draw
  const targetUTC = new Date(params.target_draw_time_utc);
  const celestial = computeCelestialSnapshot(targetUTC);

  const syntheticDraw: Record<string, unknown> = {
    draw_id: `forecast_ctx_${params.target_draw_date}_${draw_label}`,
    game_id: params.game_id,
    jurisdiction_id: params.jurisdiction_id,
    draw_date: params.target_draw_date,
    draw_label,
    draw_datetime_utc: params.target_draw_time_utc,
    // Digits unknown — forecast context only
    digit_1: null, digit_2: null, digit_3: null, digit_4: null,
    digit_sum: 0, digit_root: 0,
    result_padded: '???', numbers: [],
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

  const context_snapshot: Record<string, unknown> = {
    weekday_name: contextFeatures.weekday_name,
    weekday_ruler: contextFeatures.weekday_ruler,
    moon_phase_name: contextFeatures.moon_phase_name,
    moon_sign: contextFeatures.moon_sign,
    sun_sign: contextFeatures.sun_sign,
    season: contextFeatures.season,
    is_waxing: contextFeatures.is_waxing,
    draw_label,
  };

  const celestial_snapshot: Record<string, unknown> = {
    moon_phase_angle: celestial.moon_phase_angle,
    moon_phase_name: celestial.moon_phase_name,
    moon_illumination_fraction: celestial.moon_illumination_fraction,
    moon_ecliptic_longitude: celestial.moon_ecliptic_longitude,
    moon_sign: celestial.moon_sign,
    sun_ecliptic_longitude: celestial.sun_ecliptic_longitude,
    sun_sign: celestial.sun_sign,
    is_waxing: celestial.is_waxing,
  };

  // 2. Load all eligible hypotheses
  // Eligible = status in testing/moderate_support/strong_support
  //          + if auto_generated, must have forecast_approved=true
  const hypSnap = await db
    .collection('hypothesis_registry')
    .where('game_ids', 'array-contains', params.game_id)
    .where('status', 'in', ['testing', 'moderate_support', 'strong_support'])
    .get();

  const allHyps: ForecastHypothesisRow[] = hypSnap.docs.map((d) => ({
    id: d.id,
    ...(serializeDoc(d.data()) as Record<string, unknown>),
  }));

  // Phase 4.5 hard rule filter
  const eligibleHyps = allHyps.filter((h) => {
    if (h.auto_generated === true) return h.forecast_approved === true;
    return true;
  });

  // 3. Build decision chain — evaluate every eligible hypothesis
  const decision_chain: HypothesisDecision[] = [];
  const triggered_hypotheses: string[] = [];
  const candidates_map = new Map<string, ForecastCandidate>();
  const approved_hypotheses_used: string[] = [];

  for (const hyp of eligibleHyps) {
    approved_hypotheses_used.push(hyp.id as string);

    const total = (hyp.evidence_count_total as number) ?? 0;
    const supporting = (hyp.evidence_count_supporting as number) ?? 0;
    const contradicting = (hyp.evidence_count_contradicting as number) ?? 0;
    const trigger_fired_count = supporting + contradicting;
    const support_rate = trigger_fired_count > 0 ? supporting / trigger_fired_count : null;

    // Threshold check
    let passed_evidence_threshold = true;
    let threshold_failure_reason: string | null = null;

    if (trigger_fired_count < FORECAST_MIN_TRIGGER_FIRED) {
      passed_evidence_threshold = false;
      threshold_failure_reason = `Only ${trigger_fired_count} trigger-fired draws (need ≥${FORECAST_MIN_TRIGGER_FIRED})`;
    } else if (support_rate === null || support_rate < FORECAST_MIN_SUPPORT_RATE) {
      passed_evidence_threshold = false;
      threshold_failure_reason = `Support rate ${support_rate !== null ? Math.round(support_rate * 100) + '%' : 'N/A'} (need ≥${Math.round(FORECAST_MIN_SUPPORT_RATE * 100)}%)`;
    }

    // Context trigger evaluation
    let trigger_fired_for_context: boolean | null = null;
    const candidate_contributions: string[] = [];

    if (passed_evidence_threshold) {
      const evalResult = evaluateHypothesis(
        hyp.trigger_logic as Record<string, unknown>,
        {},
        contextFeatures as unknown as Record<string, unknown>
      );

      trigger_fired_for_context = evalResult.trigger_met === true;

      if (trigger_fired_for_context) {
        triggered_hypotheses.push(hyp.id as string);

        // Extract candidate contributions from expected_logic
        const expected = hyp.expected_logic as Record<string, unknown>;
        for (const [key, value] of Object.entries(expected)) {
          let hint: string | null = null;
          if (key === 'digit_root') hint = `digit_root:${value}`;
          else if (key === 'digit_root_in') hint = `digit_root_in:${JSON.stringify(value)}`;
          else if (/^digit_[1-9]\d*$/.test(key)) hint = `pos${key.slice(6)}:${value}`;
          else if (key === 'digit_sum_gte') hint = `digit_sum_gte:${value}`;
          else if (key === 'digit_sum_lte') hint = `digit_sum_lte:${value}`;
          else if (key === 'is_double' && value === true) hint = 'structure:double';
          else if (key === 'is_triple' && value === true) hint = 'structure:triple';

          if (hint) {
            candidate_contributions.push(hint);

            // Accumulate into candidates_map
            const existing = candidates_map.get(hint);
            if (existing) {
              existing.source_hypotheses.push(hyp.id as string);
              existing.rationale.push(`${hyp.title}: ${hyp.trigger_field}=${hyp.trigger_value}`);
            } else {
              candidates_map.set(hint, {
                value: hint,
                source_hypotheses: [hyp.id as string],
                rationale: [`${hyp.title}`],
                confidence_score: (hyp.confidence_score as number | null) ?? null,
              });
            }
          }
        }
      }
    }

    decision_chain.push({
      hypothesis_id: hyp.id as string,
      title: hyp.title as string,
      auto_generated: (hyp.auto_generated as boolean) ?? false,
      forecast_approved: (hyp.forecast_approved as boolean) ?? false,
      status: hyp.status as string,
      trigger_fired_count,
      support_rate: support_rate !== null ? parseFloat(support_rate.toFixed(4)) : null,
      passed_evidence_threshold,
      threshold_failure_reason,
      trigger_fired_for_context,
      candidate_contributions,
    });
  }

  const candidates = Array.from(candidates_map.values());
  const evidence_backed = candidates.length > 0;

  const empty_reason = evidence_backed
    ? null
    : triggered_hypotheses.length === 0
    ? `No hypotheses triggered for this context (${params.target_draw_date} ${draw_label}). ` +
      `Context: weekday=${contextFeatures.weekday_name}, moon=${contextFeatures.moon_sign}, phase=${contextFeatures.moon_phase_name}.`
    : `${triggered_hypotheses.length} hypothesis/hypotheses triggered but none met evidence thresholds ` +
      `(need ≥${FORECAST_MIN_TRIGGER_FIRED} trigger-fired draws at ≥${Math.round(FORECAST_MIN_SUPPORT_RATE * 100)}% support rate).`;

  // 4. Persist forecast run
  const forecastDoc: Omit<ForecastRun, 'forecast_id'> & { forecast_id: string } = {
    forecast_id,
    game_id: params.game_id,
    jurisdiction_id: params.jurisdiction_id,
    target_draw_date: params.target_draw_date,
    target_draw_label: draw_label,
    target_draw_time_utc: params.target_draw_time_utc,
    status: 'generated',
    generated_at: new Date().toISOString(),
    resolved_at: null,
    approved_hypotheses_used,
    triggered_hypotheses,
    candidates,
    evidence_backed,
    empty_reason,
    context_snapshot,
    celestial_snapshot,
    decision_chain,
    actual_result: null,
    actual_draw_id: null,
    hit_type: null,
    outcome_summary: null,
    forecast_method_version: FORECAST_METHOD_VERSION,
    overlay_version: OVERLAY_VERSION,
    symbolic_version: SYMBOLIC_VERSION,
    rule_version: RULE_VERSION,
  };

  await db
    .collection('forecast_runs')
    .doc(forecast_id)
    .set({ ...forecastDoc, created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp() }, { merge: true });

  return {
    forecast_id,
    status: 'generated',
    evidence_backed,
    candidates,
    triggered_hypotheses,
    empty_reason,
    decision_chain_length: decision_chain.length,
  };
}
