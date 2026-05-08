// Phase 5 forecast thresholds
// Hypotheses must meet both of these to contribute to a forecast candidate.
export const FORECAST_MIN_TRIGGER_FIRED = 3;
export const FORECAST_MIN_SUPPORT_RATE = 0.60;

// Version strings
export const FORECAST_METHOD_VERSION = '2.0.0';   // bumped for Phase 5 schema
export const OVERLAY_VERSION = '1.0.0';
export const SYMBOLIC_VERSION = '1.0.0';
export const RULE_VERSION = '1.0.0';

// NY Pick 3 draw schedule (UTC equivalents in winter EST, i.e. UTC-5)
export const NY_PICK3_DRAW_TIMES_UTC: Record<string, string> = {
  midday: '17:20:00',    // 12:20 EST
  evening: '03:30:00',   // 22:30 EST  (next calendar day UTC)
  night: '04:00:00',
};

// How to build a forecast_id
export function buildForecastId(
  gameId: string,
  drawDate: string,
  drawLabel: string
): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '_');
  return `fp5_${safe(gameId)}_${drawDate}_${drawLabel}`;
}

// Candidate hint parsers — e.g. "pos4:8" → { position: 4, digit: '8' }
export function parseCandidateHint(hint: string): {
  type: 'positional' | 'digit_root' | 'digit_sum_gte' | 'digit_sum_lte' | 'structure';
  position?: number;
  value: string | number;
} | null {
  const positional = /^pos([1-9]\d*):(.+)$/.exec(hint);
  if (positional) {
    return { type: 'positional', position: Number(positional[1]), value: positional[2] };
  }
  if (hint.startsWith('digit_root:')) return { type: 'digit_root', value: parseInt(hint.slice(11), 10) };
  if (hint.startsWith('digit_sum_gte:')) return { type: 'digit_sum_gte', value: parseInt(hint.slice(14), 10) };
  if (hint.startsWith('digit_sum_lte:')) return { type: 'digit_sum_lte', value: parseInt(hint.slice(14), 10) };
  if (hint.startsWith('structure:')) return { type: 'structure', value: hint.slice(10) };
  if (hint.startsWith('digit_root_in:')) return { type: 'digit_root', value: hint.slice(14) };
  return null;
}

/**
 * Evaluate whether a hint "hit" given the actual result.
 * actual_result: e.g. "028"
 * digits: e.g. ['0','2','8']
 */
export function hintHit(
  hint: string,
  actualResult: string,
  digits: string[],
  digitRoot: number,
  digitSum: number
): boolean {
  const parsed = parseCandidateHint(hint);
  if (!parsed) return false;

  switch (parsed.type) {
    case 'positional': {
      const pos = (parsed.position as number) - 1;
      return digits[pos] === String(parsed.value);
    }
    case 'digit_root': {
      const val = parsed.value;
      if (typeof val === 'string' && val.startsWith('[')) {
        // digit_root_in:[3,9]
        try {
          const arr = JSON.parse(val) as number[];
          return arr.includes(digitRoot);
        } catch { return false; }
      }
      return digitRoot === Number(val);
    }
    case 'digit_sum_gte':
      return digitSum >= Number(parsed.value);
    case 'digit_sum_lte':
      return digitSum <= Number(parsed.value);
    case 'structure': {
      const v = String(parsed.value);
      if (v === 'double') {
        const freq: Record<string, number> = {};
        digits.forEach((d) => { freq[d] = (freq[d] ?? 0) + 1; });
        return Object.values(freq).some((c) => c === 2) && !Object.values(freq).some((c) => c === 3);
      }
      if (v === 'triple') {
        const freq: Record<string, number> = {};
        digits.forEach((d) => { freq[d] = (freq[d] ?? 0) + 1; });
        return Object.values(freq).some((c) => c === 3);
      }
      return false;
    }
    default:
      return false;
  }
}
