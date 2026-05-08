/**
 * Pattern families define which (trigger_field, outcome_field) pairs the
 * Observation Engine will scan.
 *
 * Each family produces one observation per unique (trigger_value, outcome_value)
 * combination that exceeds the minimum sample and lift thresholds.
 *
 * outcome_type:
 *   'exact'  — outcome_field must equal outcome_value exactly
 *   'band'   — outcome_field is numeric and falls in a range [low, high]
 *   'boolean' — outcome_field is true or false
 */

export type OutcomeType = 'exact' | 'band' | 'boolean';

export interface PatternFamily {
  family_id: string;
  description: string;
  trigger_field: string;
  outcome_field: string;
  outcome_type: OutcomeType;
  // For 'exact': enumerate all outcome values to check
  outcome_values?: (string | number)[];
  // For 'band': list of [low, high, label] bands
  outcome_bands?: [number, number, string][];
  // For 'boolean': always true/false
  min_trigger_sample: number; // minimum trigger-value sample size to even scan
}

// Digit roots 0–9
const DIGIT_ROOTS: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Digit values 0–9 as strings
const DIGITS: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Digit sum bands: low (≤9), mid (10–16), high (≥17)
const DIGIT_SUM_BANDS: [number, number, string][] = [
  [0, 9, 'low_0_9'],
  [10, 16, 'mid_10_16'],
  [17, 27, 'high_17_27'],
];

function moonSignDigitFamily(position: number): PatternFamily {
  return {
    family_id: `moon_sign_digit_${position}`,
    description: `Moon sign → position ${position} digit of result`,
    trigger_field: 'moon_sign',
    outcome_field: `digit_${position}`,
    outcome_type: 'exact',
    outcome_values: DIGITS,
    min_trigger_sample: 3,
  };
}

// Readiness only: this helper can produce position 4 families later, but Phase 6B
// keeps the active Pick 3 observation set unchanged.
const ACTIVE_POSITIONAL_DIGIT_POSITIONS = [1, 3];

export const PATTERN_FAMILIES: PatternFamily[] = [
  // ── Weekday → digit root ────────────────────────────────────────────────────
  {
    family_id: 'weekday_digit_root',
    description: 'Weekday name → digit root of result',
    trigger_field: 'weekday_name',
    outcome_field: 'digit_root',
    outcome_type: 'exact',
    outcome_values: DIGIT_ROOTS,
    min_trigger_sample: 4,
  },

  // ── Weekday ruler → digit root ───────────────────────────────────────────────
  {
    family_id: 'weekday_ruler_digit_root',
    description: 'Weekday planetary ruler → digit root',
    trigger_field: 'weekday_ruler',
    outcome_field: 'digit_root',
    outcome_type: 'exact',
    outcome_values: DIGIT_ROOTS,
    min_trigger_sample: 4,
  },

  // ── Moon sign → digit root ──────────────────────────────────────────────────
  {
    family_id: 'moon_sign_digit_root',
    description: 'Moon sign → digit root of result',
    trigger_field: 'moon_sign',
    outcome_field: 'digit_root',
    outcome_type: 'exact',
    outcome_values: DIGIT_ROOTS,
    min_trigger_sample: 3,
  },

  // ── Moon sign → positional digits ───────────────────────────────────────────
  ...ACTIVE_POSITIONAL_DIGIT_POSITIONS.map(moonSignDigitFamily),

  // ── Moon phase → doubles ────────────────────────────────────────────────────
  {
    family_id: 'moon_phase_is_double',
    description: 'Moon phase name → result is a double',
    trigger_field: 'moon_phase_name',
    outcome_field: 'is_double',
    outcome_type: 'boolean',
    min_trigger_sample: 3,
  },

  // ── Moon phase → digit sum bands ────────────────────────────────────────────
  {
    family_id: 'moon_phase_digit_sum_band',
    description: 'Moon phase name → digit sum band (low/mid/high)',
    trigger_field: 'moon_phase_name',
    outcome_field: 'digit_sum',
    outcome_type: 'band',
    outcome_bands: DIGIT_SUM_BANDS,
    min_trigger_sample: 3,
  },

  // ── Waxing/waning → digit sum bands ─────────────────────────────────────────
  {
    family_id: 'waxing_digit_sum_band',
    description: 'Is waxing moon → digit sum band',
    trigger_field: 'is_waxing',
    outcome_field: 'digit_sum',
    outcome_type: 'band',
    outcome_bands: DIGIT_SUM_BANDS,
    min_trigger_sample: 8,
  },

  // ── Sun sign → digit root ───────────────────────────────────────────────────
  {
    family_id: 'sun_sign_digit_root',
    description: 'Sun sign → digit root',
    trigger_field: 'sun_sign',
    outcome_field: 'digit_root',
    outcome_type: 'exact',
    outcome_values: DIGIT_ROOTS,
    min_trigger_sample: 5,
  },

  // ── Weekday → doubles ───────────────────────────────────────────────────────
  {
    family_id: 'weekday_is_double',
    description: 'Weekday name → result is a double',
    trigger_field: 'weekday_name',
    outcome_field: 'is_double',
    outcome_type: 'boolean',
    min_trigger_sample: 4,
  },

  // ── Draw label → digit root ─────────────────────────────────────────────────
  {
    family_id: 'draw_label_digit_root',
    description: 'Draw label (midday/evening) → digit root',
    trigger_field: 'draw_label',
    outcome_field: 'digit_root',
    outcome_type: 'exact',
    outcome_values: DIGIT_ROOTS,
    min_trigger_sample: 10,
  },
];
