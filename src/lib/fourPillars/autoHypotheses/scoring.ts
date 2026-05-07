/**
 * Candidate confidence scoring for Phase 4.
 *
 * The score is a number in [0, 1] that combines:
 *   - lift (how much above baseline)
 *   - sample size (how many trigger-fired draws we have)
 *   - support rate (how often it was correct when triggered)
 *
 * This is intentionally simple and explainable.
 * It is NOT a p-value or ML confidence — it is a research prioritization score.
 *
 * Formula:
 *   lift_component   = clamp((lift - 1.0) / 1.0, 0, 1)   → 0 at 1×, 1 at 2×
 *   sample_component = clamp(sample / 20, 0, 1)           → 0 at 0, 1 at 20
 *   rate_component   = clamp((rate - 0.3) / 0.5, 0, 1)    → 0 at 30%, 1 at 80%
 *
 *   score = 0.40 * lift_component
 *         + 0.30 * sample_component
 *         + 0.30 * rate_component
 *
 * Promotion labels:
 *   score < 0.35  → weak
 *   0.35–0.55     → candidate
 *   0.55–0.70     → promising
 *   ≥ 0.70        → strong
 */

export interface ScoringInputs {
  lift: number;
  sample_size: number;          // number of trigger-fired draws
  support_rate_on_fired: number; // fraction where trigger fired AND outcome matched
}

export interface ScoringOutput {
  confidence_score: number;
  confidence_label: 'weak' | 'candidate' | 'promising' | 'strong';
  lift_component: number;
  sample_component: number;
  rate_component: number;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

export function scoreCandidate(inputs: ScoringInputs): ScoringOutput {
  const lift_component = clamp((inputs.lift - 1.0) / 1.0, 0, 1);
  const sample_component = clamp(inputs.sample_size / 20, 0, 1);
  const rate_component = clamp((inputs.support_rate_on_fired - 0.3) / 0.5, 0, 1);

  const confidence_score = parseFloat(
    (0.40 * lift_component + 0.30 * sample_component + 0.30 * rate_component).toFixed(4)
  );

  let confidence_label: ScoringOutput['confidence_label'];
  if (confidence_score < 0.35) confidence_label = 'weak';
  else if (confidence_score < 0.55) confidence_label = 'candidate';
  else if (confidence_score < 0.70) confidence_label = 'promising';
  else confidence_label = 'strong';

  return {
    confidence_score,
    confidence_label,
    lift_component: parseFloat(lift_component.toFixed(4)),
    sample_component: parseFloat(sample_component.toFixed(4)),
    rate_component: parseFloat(rate_component.toFixed(4)),
  };
}

// Promotion thresholds — used by both candidateValidator and promotionEngine
export const PROMOTION_THRESHOLDS = {
  min_trigger_fired: 5,
  min_support_rate: 0.62,
  min_lift: 1.15,
  max_contradiction_rate: 0.38,
};

export function meetsPromotionThresholds(params: {
  trigger_fired_count: number;
  support_rate_on_fired: number;
  lift: number;
  contradiction_rate: number;
}): { eligible: boolean; reason: string } {
  const t = PROMOTION_THRESHOLDS;

  if (params.trigger_fired_count < t.min_trigger_fired) {
    return {
      eligible: false,
      reason: `trigger_fired_count ${params.trigger_fired_count} < required ${t.min_trigger_fired}`,
    };
  }
  if (params.support_rate_on_fired < t.min_support_rate) {
    return {
      eligible: false,
      reason: `support_rate ${(params.support_rate_on_fired * 100).toFixed(0)}% < required ${t.min_support_rate * 100}%`,
    };
  }
  if (params.lift < t.min_lift) {
    return {
      eligible: false,
      reason: `lift ${params.lift.toFixed(2)}× < required ${t.min_lift}×`,
    };
  }
  if (params.contradiction_rate > t.max_contradiction_rate) {
    return {
      eligible: false,
      reason: `contradiction_rate ${(params.contradiction_rate * 100).toFixed(0)}% > max ${t.max_contradiction_rate * 100}%`,
    };
  }
  return { eligible: true, reason: 'All thresholds met' };
}
