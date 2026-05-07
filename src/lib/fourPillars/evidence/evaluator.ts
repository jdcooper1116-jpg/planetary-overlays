export type EvidenceResult = 'support' | 'contradiction' | 'neutral' | 'inconclusive';

/**
 * Simple condition evaluator for trigger_logic and expected_logic.
 *
 * Supported operators:
 *   { "key": "value" }        → exact string match
 *   { "key": 9 }              → exact number match
 *   { "key": true/false }     → exact boolean match
 *   { "key_gte": 15 }         → features[key] >= 15
 *   { "key_lte": 5 }          → features[key] <= 5
 *   { "key_in": ["a","b"] }   → features[key] is in array (strings)
 *   { "key_in": [3, 9] }      → features[key] is in array (numbers)
 *
 * Phase 3 additions — these use the _in suffix:
 *   digit_root_in: [3, 9]        → features.digit_root in [3, 9]
 *   moon_phase_name_in: [...]    → features.moon_phase_name in [...]
 *
 * Returns:
 *   true  → all conditions matched
 *   false → at least one condition failed
 *   null  → a required feature key was missing (inconclusive)
 */
function evaluateConditions(
  conditions: Record<string, unknown>,
  features: Record<string, unknown>
): true | false | null {
  for (const [condKey, condValue] of Object.entries(conditions)) {
    if (condKey.endsWith('_gte')) {
      const fk = condKey.slice(0, -4);
      if (features[fk] === undefined || features[fk] === null) return null;
      if ((features[fk] as number) < (condValue as number)) return false;
    } else if (condKey.endsWith('_lte')) {
      const fk = condKey.slice(0, -4);
      if (features[fk] === undefined || features[fk] === null) return null;
      if ((features[fk] as number) > (condValue as number)) return false;
    } else if (condKey.endsWith('_in')) {
      const fk = condKey.slice(0, -3);
      if (features[fk] === undefined || features[fk] === null) return null;
      if (!(condValue as unknown[]).includes(features[fk])) return false;
    } else {
      // Exact match (string, number, or boolean)
      if (features[condKey] === undefined) return null;
      if (features[condKey] !== condValue) return false;
    }
  }
  return true;
}

export function evaluateHypothesis(
  triggerLogic: Record<string, unknown>,
  expectedLogic: Record<string, unknown>,
  features: Record<string, unknown>
): {
  result: EvidenceResult;
  trigger_met: boolean | null;
  outcome_met: boolean | null;
} {
  const triggerResult = evaluateConditions(triggerLogic, features);

  if (triggerResult === null) {
    return { result: 'inconclusive', trigger_met: null, outcome_met: null };
  }

  if (triggerResult === false) {
    // Trigger not met → hypothesis does not apply to this draw
    return { result: 'neutral', trigger_met: false, outcome_met: null };
  }

  // Trigger fired → check expected outcome
  const outcomeResult = evaluateConditions(expectedLogic, features);

  if (outcomeResult === null) {
    return { result: 'inconclusive', trigger_met: true, outcome_met: null };
  }

  return {
    result: outcomeResult ? 'support' : 'contradiction',
    trigger_met: true,
    outcome_met: outcomeResult,
  };
}
