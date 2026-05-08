import type {
  Pick4EvidenceAuditResult,
  Pick4HypothesisEvidenceAudit,
} from '../readers/pick4EvidenceAuditReader';

export type Pick4InterpretationStatus =
  | 'promising_needs_more_data'
  | 'weak'
  | 'insufficient_trigger_count';

export interface Pick4HypothesisInterpretation {
  hypothesis_id: string;
  interpretation_status: Pick4InterpretationStatus;
  interpretation_reason: string;
  recommended_action: string;
  forecast_ready: false;
  support_rate: number | null;
  trigger_fired_count: number;
  minimum_trigger_fired_required: number;
}

export interface Pick4NextBatchProposal {
  proposal_id: string;
  title: string;
  rationale: string;
  status: 'proposal_only_not_seeded';
}

export interface Pick4EvidenceInterpretationResult {
  interpretation_scope: Pick4EvidenceAuditResult['pilot_scope'];
  governance: {
    forecast_ready: false;
    forecasts_enabled: false;
    approvals_added: false;
    promotions_added: false;
    seeds_added: false;
  };
  thresholds: {
    minimum_trigger_fired_required: number;
    promising_support_rate: number;
  };
  interpretations: Pick4HypothesisInterpretation[];
  next_batch_proposals: Pick4NextBatchProposal[];
}

const MIN_TRIGGER_FIRED_FOR_PROMISING = 20;
const PROMISING_SUPPORT_RATE = 0.6;

function interpretRecord(record: Pick4HypothesisEvidenceAudit): Pick4HypothesisInterpretation {
  const supportRate = record.support_rate;
  const triggerCount = record.trigger_fired_count;

  if (triggerCount < MIN_TRIGGER_FIRED_FOR_PROMISING) {
    const highSupport = supportRate !== null && supportRate >= PROMISING_SUPPORT_RATE;
    return {
      hypothesis_id: record.hypothesis_id,
      interpretation_status: highSupport ? 'promising_needs_more_data' : 'insufficient_trigger_count',
      interpretation_reason: highSupport
        ? `Support rate is ${Math.round(supportRate * 100)}%, but only ${triggerCount} trigger-fired draws are available. Treat as promising, not forecast-ready.`
        : `Only ${triggerCount} trigger-fired draws are available; need at least ${MIN_TRIGGER_FIRED_FOR_PROMISING} before support rate is actionable.`,
      recommended_action: highSupport
        ? 'Keep under observation and retest with a larger Pick 4 evidence window before any approval decision.'
        : 'Collect more trigger-fired evidence before interpreting this hypothesis.',
      forecast_ready: false,
      support_rate: supportRate,
      trigger_fired_count: triggerCount,
      minimum_trigger_fired_required: MIN_TRIGGER_FIRED_FOR_PROMISING,
    };
  }

  if (supportRate !== null && supportRate >= PROMISING_SUPPORT_RATE) {
    return {
      hypothesis_id: record.hypothesis_id,
      interpretation_status: 'promising_needs_more_data',
      interpretation_reason: `Support rate is ${Math.round(supportRate * 100)}% across ${triggerCount} trigger-fired draws, but this pilot phase does not approve Pick 4 forecasts.`,
      recommended_action: 'Review in a later governance phase with additional data and explicit Pick 4 forecast approval criteria.',
      forecast_ready: false,
      support_rate: supportRate,
      trigger_fired_count: triggerCount,
      minimum_trigger_fired_required: MIN_TRIGGER_FIRED_FOR_PROMISING,
    };
  }

  return {
    hypothesis_id: record.hypothesis_id,
    interpretation_status: 'weak',
    interpretation_reason: `Support rate is ${supportRate !== null ? Math.round(supportRate * 100) + '%' : 'unavailable'} across ${triggerCount} trigger-fired draws.`,
    recommended_action: 'Do not advance; keep as a weak pilot result unless future evidence materially changes.',
    forecast_ready: false,
    support_rate: supportRate,
    trigger_fired_count: triggerCount,
    minimum_trigger_fired_required: MIN_TRIGGER_FIRED_FOR_PROMISING,
  };
}

export function interpretPick4EvidenceAudit(
  audit: Pick4EvidenceAuditResult
): Pick4EvidenceInterpretationResult {
  return {
    interpretation_scope: audit.pilot_scope,
    governance: {
      forecast_ready: false,
      forecasts_enabled: false,
      approvals_added: false,
      promotions_added: false,
      seeds_added: false,
    },
    thresholds: {
      minimum_trigger_fired_required: MIN_TRIGGER_FIRED_FOR_PROMISING,
      promising_support_rate: PROMISING_SUPPORT_RATE,
    },
    interpretations: audit.records.map(interpretRecord),
    next_batch_proposals: [
      {
        proposal_id: 'proposal_p4_libra_moon_digit4_parity_larger_window',
        title: 'Retest Libra Moon fourth-digit parity across a larger Pick 4 window',
        rationale:
          'The Libra Moon hypothesis showed promising support but only a small trigger-fired sample. A larger window can test whether the pattern persists.',
        status: 'proposal_only_not_seeded',
      },
      {
        proposal_id: 'proposal_p4_moon_sign_digit4_parity_family',
        title: 'Compare fourth-digit parity across all Moon signs',
        rationale:
          'A controlled family comparison could separate a Libra-specific signal from general fourth-position parity noise.',
        status: 'proposal_only_not_seeded',
      },
      {
        proposal_id: 'proposal_p4_waning_moon_digit_sum_bands',
        title: 'Explore Pick 4 waning Moon digit-sum bands',
        rationale:
          'The waning Moon digit-sum hypothesis had enough trigger-fired draws for review but weak support; adjacent digit-sum bands may be more informative.',
        status: 'proposal_only_not_seeded',
      },
    ],
  };
}
