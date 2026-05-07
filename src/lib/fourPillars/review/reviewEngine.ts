/**
 * Phase 4.5 Review Engine
 *
 * This module:
 * 1. Patches the promotion engine's output — promoted candidates now enter
 *    hypothesis_registry as status='proposed', NOT 'testing'.
 * 2. Provides a re-promotion helper that updates a Phase 4 registry entry
 *    that was wrongly written as 'testing' to 'proposed'.
 * 3. Provides a forecast guard helper.
 */

import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { PILOT_GAME_ID, serializeDoc } from '../readers/pilotConstants';

/**
 * Scan hypothesis_registry for any auto-generated entries that are currently
 * status='testing' but do NOT have forecast_approved=true.
 *
 * These are Phase 4 promotions that happened before 4.5 was deployed.
 * Fix them by downgrading to status='proposed'.
 *
 * Safe to run multiple times (idempotent).
 */
export async function fixLegacyAutoTestingEntries(): Promise<{
  found: number;
  fixed: number;
}> {
  const db = getAdminDb();

  const snap = await db
    .collection('hypothesis_registry')
    .where('game_ids', 'array-contains', PILOT_GAME_ID)
    .where('auto_generated', '==', true)
    .where('status', '==', 'testing')
    .get();

  let fixed = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    // If it's auto_generated=true and forecast_approved is not explicitly true, demote it
    if (data.forecast_approved !== true) {
      await doc.ref.update({
        status: 'proposed',
        review_required: true,
        review_status: 'pending',
        forecast_approved: false,
        updated_at: FieldValue.serverTimestamp(),
      });
      fixed++;
    }
  }

  return { found: snap.size, fixed };
}

/**
 * Returns a summary of the review queue state.
 */
export async function readReviewSummary(): Promise<{
  ready_for_review: number;
  approved: number;
  rejected: number;
  needs_more_data: number;
  proposed_in_registry: number;
  testing_approved_in_registry: number;
}> {
  const db = getAdminDb();

  const [queueSnap, registrySnap] = await Promise.all([
    db
      .collection('auto_hypothesis_queue')
      .where('game_id', '==', PILOT_GAME_ID)
      .get(),
    db
      .collection('hypothesis_registry')
      .where('game_ids', 'array-contains', PILOT_GAME_ID)
      .where('auto_generated', '==', true)
      .get(),
  ]);

  const queueDocs = queueSnap.docs.map((d) => d.data());
  const regDocs = registrySnap.docs.map((d) => d.data());

  const ready_for_review = queueDocs.filter(
    (d) =>
      d.status === 'ready_for_review' &&
      (!d.review_status || d.review_status === 'pending' || d.review_status === 'returned')
  ).length;

  return {
    ready_for_review,
    approved: queueDocs.filter((d) => d.review_status === 'approved').length,
    rejected: queueDocs.filter((d) => d.review_status === 'rejected').length,
    needs_more_data: queueDocs.filter((d) => d.review_status === 'needs_more_data').length,
    proposed_in_registry: regDocs.filter((d) => d.status === 'proposed').length,
    testing_approved_in_registry: regDocs.filter(
      (d) => d.status === 'testing' && d.forecast_approved === true
    ).length,
  };
}

/**
 * Forecast guard: returns whether a hypothesis doc from hypothesis_registry
 * is allowed to participate in forecast generation.
 *
 * Rule: if auto_generated === true, require forecast_approved === true.
 */
export function isForecastEligible(hyp: Record<string, unknown>): boolean {
  if (hyp.auto_generated === true) {
    return hyp.forecast_approved === true;
  }
  // Human-authored hypotheses are always forecast-eligible (subject to evidence thresholds)
  return true;
}
