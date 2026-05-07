/**
 * Phase 4.5 Forecast Engine Patch
 *
 * This file is NOT a drop-in replacement for forecastEngine.ts.
 * It shows the exact change you must make to your existing forecastEngine.ts.
 *
 * LOCATE this block in forecastEngine.ts (around the hypothesis filter loop):
 *
 * ─── BEFORE (Phase 4 version) ────────────────────────────────────────────────
 *
 *   const hypSnap = await db
 *     .collection('hypothesis_registry')
 *     .where('game_ids', 'array-contains', params.game_id)
 *     .where('status', 'in', ['testing', 'moderate_support', 'strong_support'])
 *     .get();
 *
 *   const hypotheses = hypSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
 *
 * ─── AFTER (Phase 4.5 version) ───────────────────────────────────────────────
 *
 *   const hypSnap = await db
 *     .collection('hypothesis_registry')
 *     .where('game_ids', 'array-contains', params.game_id)
 *     .where('status', 'in', ['testing', 'moderate_support', 'strong_support'])
 *     .get();
 *
 *   // Phase 4.5 hard rule: auto-generated hypotheses require explicit forecast approval.
 *   // Human-authored hypotheses (auto_generated !== true) are always eligible.
 *   const hypotheses = hypSnap.docs
 *     .map((d) => ({ id: d.id, ...d.data() }))
 *     .filter((h) => {
 *       if (h.auto_generated === true) {
 *         return h.forecast_approved === true;
 *       }
 *       return true; // human-authored: always eligible
 *     });
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * That single .filter() call is the complete Phase 4.5 forecast engine change.
 * Nothing else in forecastEngine.ts needs to change.
 *
 * You can also import and use the isForecastEligible helper from reviewEngine.ts:
 *
 *   import { isForecastEligible } from '@/lib/fourPillars/review/reviewEngine';
 *
 *   const hypotheses = hypSnap.docs
 *     .map((d) => ({ id: d.id, ...d.data() }))
 *     .filter((h) => isForecastEligible(h as Record<string, unknown>));
 */

// This export is here only so the file is valid TypeScript.
export const PHASE_4_5_FORECAST_PATCH_VERSION = '1.0.0';
