/**
 * Phase 5 — Forecast Run Types
 *
 * The forecast_runs collection was started in Phase 1 with a simpler shape.
 * Phase 5 extends it with outcome tracking and a richer decision chain.
 *
 * Backwards compatibility: Phase 1/2 forecast docs are valid — they just
 * won't have the Phase 5 fields (status, decision_chain, outcome_summary, etc.)
 * Those fields are optional so existing reads don't break.
 */

export type ForecastStatus =
  | 'draft'
  | 'generated'
  | 'awaiting_outcome'
  | 'resolved'
  | 'archived';

export type HitType = 'straight' | 'box' | 'miss' | null;

export interface ForecastCandidate {
  value: string;                    // e.g. "pos3:8" or "digit_root:6"
  source_hypotheses: string[];      // hypothesis_ids that contributed this
  rationale: string[];              // human-readable explanation per source
  confidence_score: number | null;
}

export interface HypothesisDecision {
  hypothesis_id: string;
  title: string;
  auto_generated: boolean;
  forecast_approved: boolean;
  status: string;
  // Threshold checks
  trigger_fired_count: number;
  support_rate: number | null;
  passed_evidence_threshold: boolean;
  threshold_failure_reason: string | null;
  // Context evaluation
  trigger_fired_for_context: boolean | null;
  // What it contributed
  candidate_contributions: string[];
}

export interface HypothesisContribution {
  hypothesis_id: string;
  contributed_hit: boolean;
  contributed_miss: boolean;
  neutral: boolean;
}

export interface OutcomeSummary {
  actual_result: string;            // e.g. "028"
  matched_candidates: string[];     // which candidate hints matched
  hit_type: HitType;
  hypothesis_contributions: HypothesisContribution[];
}

export interface ForecastRun {
  forecast_id: string;
  game_id: string;
  jurisdiction_id: string;
  target_draw_date: string;
  target_draw_label: string;
  target_draw_time_utc: string;

  status: ForecastStatus;
  generated_at: string | null;
  resolved_at: string | null;

  // Hypothesis evaluation
  approved_hypotheses_used: string[];   // all hypotheses checked
  triggered_hypotheses: string[];       // those whose trigger fired for context

  // Output
  candidates: ForecastCandidate[];
  evidence_backed: boolean;
  empty_reason: string | null;

  // Context at generation time
  context_snapshot: Record<string, unknown>;   // weekday, moon_sign, etc.
  celestial_snapshot: Record<string, unknown>; // moon_phase_angle, moon_sign, etc.

  // Full decision chain (one entry per hypothesis evaluated)
  decision_chain: HypothesisDecision[];

  // Outcome (set after resolution)
  actual_result: string | null;
  actual_draw_id: string | null;
  hit_type: HitType;
  outcome_summary: OutcomeSummary | null;

  // Versions
  forecast_method_version: string;
  overlay_version: string;
  symbolic_version: string;
  rule_version: string;
}
