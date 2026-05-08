import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { serializeDoc } from '../readers/pilotConstants';
import { hintHit } from './forecastConstants';
import type { HitType, HypothesisContribution, OutcomeSummary } from './forecastRunTypes';

export interface ResolveForecastParams {
  forecast_id: string;
  actual_result?: string;     // override — if not supplied, look up from draws collection
  actual_draw_id?: string;    // override
}

export interface ResolveForecastResult {
  forecast_id: string;
  actual_result: string | null;
  hit_type: HitType;
  matched_candidates: string[];
  hypothesis_contributions: HypothesisContribution[];
  already_resolved: boolean;
}

// ── Box check: does actual result contain all digits in candidates (any order)? ──

function isBoxHit(candidateHints: string[], digits: string[]): boolean {
  // Collect all positional digit expectations from candidates
  const pos_digits: Map<number, string[]> = new Map();
  for (const hint of candidateHints) {
    if (hint.startsWith('pos1:')) {
      const existing = pos_digits.get(1) ?? [];
      existing.push(hint.slice(5));
      pos_digits.set(1, existing);
    } else if (hint.startsWith('pos2:')) {
      const existing = pos_digits.get(2) ?? [];
      existing.push(hint.slice(5));
      pos_digits.set(2, existing);
    } else if (hint.startsWith('pos3:')) {
      const existing = pos_digits.get(3) ?? [];
      existing.push(hint.slice(5));
      pos_digits.set(3, existing);
    }
  }
  if (pos_digits.size === 0) return false;

  // Check if any permutation of the expected digits matches the actual digits
  const expected_digits = Array.from(pos_digits.values()).flat();
  const actual = [...digits];
  // Sort both and compare
  return expected_digits.sort().join('') === actual.sort().join('');
}

function computeHitType(
  candidates: Array<{ value: string }>,
  digits: string[],
  digitRoot: number,
  digitSum: number,
  actualResult: string
): { hit_type: HitType; matched_candidates: string[] } {
  if (candidates.length === 0) return { hit_type: null, matched_candidates: [] };

  const candidateValues = candidates.map((c) => c.value);

  // Check each candidate hint
  const matched: string[] = [];
  for (const hint of candidateValues) {
    if (hintHit(hint, actualResult, digits, digitRoot, digitSum)) {
      matched.push(hint);
    }
  }

  if (matched.length === 0) return { hit_type: 'miss', matched_candidates: [] };

  // Straight: if a positional candidate exactly matched
  const hasPositionalHit = matched.some((h) => h.startsWith('pos'));
  if (hasPositionalHit) {
    // If ALL positional candidates match → straight (all positions correct)
    const positionalCandidates = candidateValues.filter((h) => h.startsWith('pos'));
    const allPositionalHit = positionalCandidates.every((h) => matched.includes(h));
    if (allPositionalHit && positionalCandidates.length >= 2) {
      return { hit_type: 'straight', matched_candidates: matched };
    }
  }

  // Box: box hit check (any ordering)
  if (isBoxHit(matched, digits)) {
    return { hit_type: 'box', matched_candidates: matched };
  }

  // Partial hit — return as 'box' (partial match is still a research win)
  if (matched.length > 0) {
    return { hit_type: 'box', matched_candidates: matched };
  }

  return { hit_type: 'miss', matched_candidates: [] };
}

export async function resolveForecast(
  params: ResolveForecastParams
): Promise<ResolveForecastResult> {
  const db = getAdminDb();

  const forecastRef = db.collection('forecast_runs').doc(params.forecast_id);
  const forecastSnap = await forecastRef.get();

  if (!forecastSnap.exists) {
    throw new Error(`Forecast ${params.forecast_id} not found`);
  }

  const forecast = serializeDoc(forecastSnap.data()!);

  // Idempotency
  if (forecast.status === 'resolved') {
    return {
      forecast_id: params.forecast_id,
      actual_result: forecast.actual_result as string | null,
      hit_type: forecast.hit_type as HitType,
      matched_candidates: (forecast.outcome_summary as { matched_candidates?: string[] } | null)
        ?.matched_candidates ?? [],
      hypothesis_contributions: (forecast.outcome_summary as { hypothesis_contributions?: HypothesisContribution[] } | null)
        ?.hypothesis_contributions ?? [],
      already_resolved: true,
    };
  }

  // Find actual draw
  let actual_result: string | null = params.actual_result ?? null;
  let actual_draw_id: string | null = params.actual_draw_id ?? null;

  if (!actual_result) {
    // Search for the draw in the draws collection
    const drawSnap = await db
      .collection('draws')
      .where('game_id', '==', forecast.game_id)
      .where('draw_date', '==', forecast.target_draw_date)
      .where('draw_label', '==', forecast.target_draw_label)
      .limit(1)
      .get();

    if (drawSnap.empty) {
      throw new Error(
        `No draw found for ${forecast.game_id} on ${forecast.target_draw_date} ${forecast.target_draw_label}. ` +
        `Sync that date first or supply actual_result manually.`
      );
    }

    const draw = drawSnap.docs[0].data();
    actual_result = draw.result_padded as string;
    actual_draw_id = draw.draw_id as string;
  }

  // Parse actual result
  const digits = actual_result.split('');
  const digit_sum = digits.reduce((s, d) => s + parseInt(d, 10), 0);
  let digit_root = digit_sum;
  while (digit_root >= 10) {
    digit_root = String(digit_root).split('').reduce((s, d) => s + parseInt(d, 10), 0);
  }

  // Evaluate candidates
  const candidates = (forecast.candidates as Array<{ value: string; source_hypotheses: string[] }>) ?? [];
  const { hit_type, matched_candidates } = computeHitType(
    candidates, digits, digit_root, digit_sum, actual_result
  );

  // Build hypothesis contributions
  const triggered = new Set<string>(forecast.triggered_hypotheses as string[] ?? []);
  const hypothesis_contributions: HypothesisContribution[] = [];

  for (const hypId of (forecast.approved_hypotheses_used as string[] ?? [])) {
    if (!triggered.has(hypId)) continue; // only score hypotheses that triggered

    // Did this hypothesis contribute any matched candidates?
    const hypCandidates = candidates
      .filter((c) => c.source_hypotheses?.includes(hypId))
      .map((c) => c.value);

    const contributed_hit =
      hit_type !== 'miss' &&
      hit_type !== null &&
      hypCandidates.some((hint) => matched_candidates.includes(hint));

    const contributed_miss =
      (hit_type === 'miss' || !contributed_hit) && hypCandidates.length > 0;

    const neutral = hypCandidates.length === 0;

    hypothesis_contributions.push({
      hypothesis_id: hypId,
      contributed_hit,
      contributed_miss,
      neutral,
    });
  }

  const outcome_summary: OutcomeSummary = {
    actual_result,
    matched_candidates,
    hit_type,
    hypothesis_contributions,
  };

  // Update forecast run
  await forecastRef.update({
    status: 'resolved',
    actual_result,
    actual_draw_id,
    hit_type,
    outcome_summary,
    resolved_at: new Date().toISOString(),
    updated_at: FieldValue.serverTimestamp(),
  });

  return {
    forecast_id: params.forecast_id,
    actual_result,
    hit_type,
    matched_candidates,
    hypothesis_contributions,
    already_resolved: false,
  };
}

export async function backfillForecastOutcomes(gameId: string): Promise<{
  found: number;
  resolved: number;
  errors: number;
  details: Array<{ forecast_id: string; result: string; hit_type: HitType }>;
}> {
  const db = getAdminDb();

  // Find all generated (unresolved) forecasts
  const snap = await db
    .collection('forecast_runs')
    .where('game_id', '==', gameId)
    .where('status', '==', 'generated')
    .get();

  const forecasts = snap.docs.map((d) => serializeDoc(d.data()));
  let resolved = 0;
  let errors = 0;
  const details: Array<{ forecast_id: string; result: string; hit_type: HitType }> = [];

  for (const forecast of forecasts) {
    try {
      const result = await resolveForecast({ forecast_id: forecast.forecast_id as string });
      if (!result.already_resolved && result.actual_result) {
        resolved++;
        details.push({
          forecast_id: forecast.forecast_id as string,
          result: result.actual_result,
          hit_type: result.hit_type,
        });
      }
    } catch (err) {
      // Draw may not be synced yet — skip
      errors++;
      console.warn('backfill skip', forecast.forecast_id, err instanceof Error ? err.message : err);
    }
  }

  return { found: forecasts.length, resolved, errors, details };
}
