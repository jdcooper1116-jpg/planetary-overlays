import type { PatternFamily } from './patternFamilies';

/**
 * Computes baseline rates for outcome values across the full feature set.
 *
 * For 'exact':   baseline_rate(outcome_value) = count(docs where field == value) / total
 * For 'boolean': baseline_rate(true)  = count(docs where field == true) / total
 *                baseline_rate(false) = count(docs where field == false) / total
 * For 'band':    baseline_rate(band)  = count(docs where low <= field <= high) / total
 */

export interface OutcomeBaseline {
  outcome_label: string;    // e.g. "5" for digit_root=5, "low_0_9" for band
  outcome_value: string | number | boolean;
  baseline_rate: number;    // fraction of all docs where this outcome is true
  baseline_count: number;   // raw count
}

export interface BaselineStats {
  total_docs: number;
  outcomes: OutcomeBaseline[];
}

function outcomeLabel(value: string | number | boolean): string {
  return String(value);
}

function checkExact(
  doc: Record<string, unknown>,
  field: string,
  value: string | number | boolean
): boolean {
  return doc[field] === value;
}

function checkBand(
  doc: Record<string, unknown>,
  field: string,
  low: number,
  high: number
): boolean {
  const v = doc[field];
  if (typeof v !== 'number') return false;
  return v >= low && v <= high;
}

export function computeBaselineStats(
  docs: Record<string, unknown>[],
  family: PatternFamily
): BaselineStats {
  const total = docs.length;
  if (total === 0) return { total_docs: 0, outcomes: [] };

  const outcomes: OutcomeBaseline[] = [];

  if (family.outcome_type === 'exact' && family.outcome_values) {
    for (const val of family.outcome_values) {
      const count = docs.filter((d) => checkExact(d, family.outcome_field, val)).length;
      outcomes.push({
        outcome_label: outcomeLabel(val),
        outcome_value: val,
        baseline_rate: count / total,
        baseline_count: count,
      });
    }
  } else if (family.outcome_type === 'boolean') {
    for (const val of [true, false]) {
      const count = docs.filter((d) => checkExact(d, family.outcome_field, val)).length;
      outcomes.push({
        outcome_label: outcomeLabel(val),
        outcome_value: val,
        baseline_rate: count / total,
        baseline_count: count,
      });
    }
  } else if (family.outcome_type === 'band' && family.outcome_bands) {
    for (const [low, high, label] of family.outcome_bands) {
      const count = docs.filter((d) => checkBand(d, family.outcome_field, low, high)).length;
      outcomes.push({
        outcome_label: label,
        outcome_value: label,
        baseline_rate: count / total,
        baseline_count: count,
      });
    }
  }

  return { total_docs: total, outcomes };
}

/**
 * Given a doc, return which outcome label it belongs to for a given family.
 * Returns null if the doc doesn't cleanly map (e.g. field is missing).
 */
export function getDocOutcomeLabel(
  doc: Record<string, unknown>,
  family: PatternFamily
): string | null {
  if (family.outcome_type === 'exact' && family.outcome_values) {
    for (const val of family.outcome_values) {
      if (checkExact(doc, family.outcome_field, val)) return outcomeLabel(val);
    }
    return null;
  } else if (family.outcome_type === 'boolean') {
    const v = doc[family.outcome_field];
    if (v === true) return 'true';
    if (v === false) return 'false';
    return null;
  } else if (family.outcome_type === 'band' && family.outcome_bands) {
    const v = doc[family.outcome_field];
    if (typeof v !== 'number') return null;
    for (const [low, high, label] of family.outcome_bands) {
      if (v >= low && v <= high) return label;
    }
    return null;
  }
  return null;
}
