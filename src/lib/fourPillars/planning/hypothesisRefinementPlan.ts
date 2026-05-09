import {
  readDualGameEvidenceComparison,
  type DualGameEvidenceComparisonInput,
  type HypothesisEvidenceComparison,
} from '../readers/dualGameEvidenceComparisonReader';
import { NY_PICK4_GAME_ID, PILOT_GAME_ID } from '../readers/pilotConstants';

export type Pick4RefinementClassification =
  | 'keep_testing'
  | 'promising_needs_larger_window'
  | 'weak_retest_before_retirement'
  | 'candidate_for_retirement_later';

export interface Pick4HypothesisRefinement {
  hypothesis_id: string;
  title: string | null;
  classification: Pick4RefinementClassification;
  classification_reason: string;
  recommended_action: string;
  forecast_ready: false;
  total_evidence_records: number;
  support_count: number;
  contradiction_count: number;
  neutral_count: number;
  inconclusive_count: number;
  trigger_fired_count: number;
  support_rate: number | null;
}

export interface NextBatchProposalIdea {
  proposal_id: string;
  title: string;
  rationale: string;
  status: 'proposal_only_not_seeded';
}

export interface HypothesisRefinementPlan {
  plan_id: 'phase6o_hypothesis_refinement_plan';
  scope: {
    expansion_window_id: string;
    date_from: string;
    date_to: string;
    game_ids: [typeof PILOT_GAME_ID, typeof NY_PICK4_GAME_ID];
  };
  guardrails: {
    mutates_firestore: false;
    forecasts_enabled: false;
    pick4_forecasts_enabled: false;
    hypotheses_seeded: false;
    approvals_or_promotions_added: false;
    new_states_added: false;
  };
  pick3_summary: {
    game_id: typeof PILOT_GAME_ID;
    total_evidence_records: number;
    hypothesis_count: number;
    support_count: number;
    contradiction_count: number;
    neutral_count: number;
    trigger_fired_count: number;
    support_rate_triggered: number | null;
    strongest_hypothesis: HypothesisEvidenceComparison | null;
    weakest_hypothesis: HypothesisEvidenceComparison | null;
    forecast_runs: number;
    forecast_policy: string;
    research_direction: string[];
  };
  pick4_summary: {
    game_id: typeof NY_PICK4_GAME_ID;
    total_evidence_records: number;
    hypothesis_count: number;
    support_count: number;
    contradiction_count: number;
    neutral_count: number;
    trigger_fired_count: number;
    support_rate_triggered: number | null;
    forecast_runs: number;
    forecast_policy: 'disabled_research_backtest_only';
    forecast_ready: false;
  };
  pick4_refinements: Pick4HypothesisRefinement[];
  next_batch_proposals: NextBatchProposalIdea[];
  research_direction: string[];
}

const PROMISING_SUPPORT_RATE = 0.6;
const WEAK_SUPPORT_RATE = 0.45;
const RETIREMENT_CANDIDATE_SUPPORT_RATE = 0.2;
const MIN_TRIGGER_FOR_CLASSIFICATION = 20;

function formatPct(value: number | null): string {
  return value === null ? 'unavailable' : `${Math.round(value * 100)}%`;
}

function classifyPick4Hypothesis(
  hypothesis: HypothesisEvidenceComparison
): Pick4HypothesisRefinement {
  const supportRate = hypothesis.support_rate;
  const triggerCount = hypothesis.trigger_fired_count;

  if (
    hypothesis.hypothesis_id === 'hyp_p4_libra_moon_digit4_even' ||
    (supportRate !== null &&
      supportRate >= PROMISING_SUPPORT_RATE &&
      triggerCount >= MIN_TRIGGER_FOR_CLASSIFICATION)
  ) {
    return {
      ...baseRefinement(hypothesis),
      classification: 'promising_needs_larger_window',
      classification_reason: `Support rate is ${formatPct(supportRate)} across ${triggerCount} trigger-fired draws. This is promising for research, but still too small for Pick 4 forecast governance.`,
      recommended_action:
        'Keep testing over a larger window such as Jan-Jun before any governance review.',
    };
  }

  if (
    hypothesis.hypothesis_id === 'hyp_p4_mercury_day_digit_root_in_5_8' ||
    (supportRate !== null &&
      supportRate <= RETIREMENT_CANDIDATE_SUPPORT_RATE &&
      triggerCount >= MIN_TRIGGER_FOR_CLASSIFICATION)
  ) {
    return {
      ...baseRefinement(hypothesis),
      classification: 'candidate_for_retirement_later',
      classification_reason: `Support rate is ${formatPct(supportRate)} across ${triggerCount} trigger-fired draws, making this the weakest current Pick 4 starter claim.`,
      recommended_action:
        'Retest once in the next larger window, then consider retiring or replacing if the weak signal persists.',
    };
  }

  if (
    hypothesis.hypothesis_id === 'hyp_p4_waning_moon_digit_sum_gte_18' ||
    hypothesis.hypothesis_id === 'hyp_p4_digit4_vedic_saturn_repeat' ||
    (supportRate !== null &&
      supportRate < WEAK_SUPPORT_RATE &&
      triggerCount >= MIN_TRIGGER_FOR_CLASSIFICATION)
  ) {
    return {
      ...baseRefinement(hypothesis),
      classification: 'weak_retest_before_retirement',
      classification_reason: `Support rate is ${formatPct(supportRate)} across ${triggerCount} trigger-fired draws, below the useful threshold for advancing.`,
      recommended_action:
        'Keep as a weak/testing hypothesis and retest before any retirement decision.',
    };
  }

  return {
    ...baseRefinement(hypothesis),
    classification: 'keep_testing',
    classification_reason:
      triggerCount < MIN_TRIGGER_FOR_CLASSIFICATION
        ? `Only ${triggerCount} trigger-fired draws are available; more evidence is needed before classification is stable.`
        : `Support rate is ${formatPct(supportRate)} across ${triggerCount} trigger-fired draws.`,
    recommended_action: 'Keep testing without approval, promotion, or forecast use.',
  };
}

function baseRefinement(hypothesis: HypothesisEvidenceComparison) {
  return {
    hypothesis_id: hypothesis.hypothesis_id,
    title: hypothesis.title,
    forecast_ready: false as const,
    total_evidence_records: hypothesis.total_evidence_records,
    support_count: hypothesis.support_count,
    contradiction_count: hypothesis.contradiction_count,
    neutral_count: hypothesis.neutral_count,
    inconclusive_count: hypothesis.inconclusive_count,
    trigger_fired_count: hypothesis.trigger_fired_count,
    support_rate: hypothesis.support_rate,
  };
}

function nextBatchProposals(): NextBatchProposalIdea[] {
  return [
    {
      proposal_id: 'proposal_p4_retest_libra_digit4_parity_jan_jun',
      title: 'Retest Libra Moon fourth-digit parity over Jan-Jun',
      rationale:
        'Libra Moon is the only current Pick 4 starter hypothesis with a promising Jan-Mar support rate, but it needs a larger trigger-fired sample before governance review.',
      status: 'proposal_only_not_seeded',
    },
    {
      proposal_id: 'proposal_p4_libra_digit4_even_vs_baseline',
      title: 'Compare Libra Moon fourth-digit evenness against odd/even baseline',
      rationale:
        'A baseline parity comparison can separate a Libra-specific signal from ordinary final-digit evenness rates.',
      status: 'proposal_only_not_seeded',
    },
    {
      proposal_id: 'proposal_p4_venus_libra_final_digit_parity',
      title: 'Test Venus/Libra influence on Pick 4 final digit parity',
      rationale:
        'Libra is Venus-ruled, so a controlled Venus/Libra family test may be more coherent than a single Moon-sign claim.',
      status: 'proposal_only_not_seeded',
    },
    {
      proposal_id: 'proposal_p4_moon_sign_element_digit4_behavior',
      title: 'Test Moon sign groups by element for Pick 4 digit 4 behavior',
      rationale:
        'Element-level grouping may produce higher trigger counts than individual signs while preserving a celestial hypothesis structure.',
      status: 'proposal_only_not_seeded',
    },
    {
      proposal_id: 'proposal_p4_waning_moon_digit_sum_bands',
      title: 'Test waning Moon digit-sum bands instead of only >=18',
      rationale:
        'The current >=18 claim is weak, but adjacent Pick 4 digit-sum bands may better describe any waning Moon relationship.',
      status: 'proposal_only_not_seeded',
    },
    {
      proposal_id: 'proposal_p4_mercury_day_digit_root_alternatives',
      title: 'Test Mercury day Pick 4 digit-root alternatives',
      rationale:
        'The 5/8 digit-root claim performed weakly; alternatives should be proposed only as a later batch, not seeded in Phase 6O.',
      status: 'proposal_only_not_seeded',
    },
  ];
}

export async function readHypothesisRefinementPlan(
  input: DualGameEvidenceComparisonInput = {}
): Promise<HypothesisRefinementPlan> {
  const comparison = await readDualGameEvidenceComparison(input);
  return buildPlanFromComparison(comparison);
}

function buildPlanFromComparison(
  comparison: Awaited<ReturnType<typeof readDualGameEvidenceComparison>>
): HypothesisRefinementPlan {
  const pick3 = comparison.games[PILOT_GAME_ID];
  const pick4 = comparison.games[NY_PICK4_GAME_ID];

  return {
    plan_id: 'phase6o_hypothesis_refinement_plan',
    scope: comparison.comparison_scope,
    guardrails: {
      mutates_firestore: false,
      forecasts_enabled: false,
      pick4_forecasts_enabled: false,
      hypotheses_seeded: false,
      approvals_or_promotions_added: false,
      new_states_added: false,
    },
    pick3_summary: {
      game_id: PILOT_GAME_ID,
      total_evidence_records: pick3.total_evidence_records,
      hypothesis_count: pick3.hypothesis_count,
      support_count: pick3.support_count,
      contradiction_count: pick3.contradiction_count,
      neutral_count: pick3.neutral_count,
      trigger_fired_count: pick3.trigger_fired_count,
      support_rate_triggered: pick3.support_rate_triggered,
      strongest_hypothesis: pick3.strongest_hypothesis,
      weakest_hypothesis: pick3.weakest_hypothesis,
      forecast_runs: pick3.forecast_runs,
      forecast_policy: pick3.forecast_policy,
      research_direction: [
        'Keep Pick 3 governed forecasts unchanged while using Jan-Mar evidence to identify which research families remain useful.',
        'Compare Pick 3 and Pick 4 only at the evidence-pattern level; do not require shared hypothesis IDs.',
        'Use Pick 3 stronger and weaker hypotheses as context for selecting future cross-game celestial-condition tests.',
      ],
    },
    pick4_summary: {
      game_id: NY_PICK4_GAME_ID,
      total_evidence_records: pick4.total_evidence_records,
      hypothesis_count: pick4.hypothesis_count,
      support_count: pick4.support_count,
      contradiction_count: pick4.contradiction_count,
      neutral_count: pick4.neutral_count,
      trigger_fired_count: pick4.trigger_fired_count,
      support_rate_triggered: pick4.support_rate_triggered,
      forecast_runs: pick4.forecast_runs,
      forecast_policy: 'disabled_research_backtest_only',
      forecast_ready: false,
    },
    pick4_refinements: pick4.hypotheses.map(classifyPick4Hypothesis),
    next_batch_proposals: nextBatchProposals(),
    research_direction: [
      'Prioritize larger-window retests for the existing Pick 4 starter set before seeding replacements.',
      'Treat Libra Moon as the only promising Pick 4 pilot lead, but keep it research-only until a larger window and explicit governance review exist.',
      'Use weak Mercury, Saturn, and waning Moon results to refine hypothesis families rather than promote current claims.',
      'Keep Pick 4 forecasts disabled; Phase 6O proposes research direction only.',
    ],
  };
}
