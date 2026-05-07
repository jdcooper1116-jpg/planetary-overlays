import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type {
  ReviewActionPayload,
  ReviewActionResult,
  QueueReviewStatus,
  RegistryAutoStatus,
} from './reviewTypes';

// ── Shared helper — build review metadata update ──────────────────────────────

function reviewMeta(
  queueStatus: QueueReviewStatus,
  decision: string,
  notes: string | null,
  reviewedBy: string
) {
  return {
    review_status: queueStatus,
    review_decision: decision,
    review_notes: notes,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    updated_at: FieldValue.serverTimestamp(),
  };
}

// ── Resolve registry_id from candidate doc if not supplied ────────────────────

async function resolveRegistryId(
  db: FirebaseFirestore.Firestore,
  candidateId: string,
  suppliedRegistryId?: string
): Promise<string | null> {
  if (suppliedRegistryId) return suppliedRegistryId;
  const snap = await db.collection('auto_hypothesis_queue').doc(candidateId).get();
  if (!snap.exists) return null;
  return (snap.data()?.registry_id as string | undefined) ?? null;
}

// ═════════════════════════════════════════════════════════════════════════════
// ACTION 1: Approve for Forecast Use
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Sets forecast_approved=true and status=testing on the registry entry.
 * This is the ONLY pathway for an auto-generated hypothesis to enter forecasting.
 */
export async function approveCandidate(
  payload: ReviewActionPayload
): Promise<ReviewActionResult> {
  const db = getAdminDb();
  const { candidate_id, notes = null, reviewed_by = 'researcher' } = payload;
  const registry_id = await resolveRegistryId(db, candidate_id, payload.registry_id);

  // Update queue record
  await db.collection('auto_hypothesis_queue').doc(candidate_id).update({
    ...reviewMeta('approved', 'approve_for_forecast', notes, reviewed_by),
    status: 'testing',
    forecast_approved: true,
  });

  // Update registry record if it exists
  if (registry_id) {
    const regRef = db.collection('hypothesis_registry').doc(registry_id);
    const regSnap = await regRef.get();
    if (regSnap.exists) {
      await regRef.update({
        forecast_approved: true,
        review_required: false,
        status: 'testing',
        review_status: 'approved',
        review_decision: 'approve_for_forecast',
        review_notes: notes,
        reviewed_by,
        reviewed_at: new Date().toISOString(),
        approval_source: 'manual_phase4_5',
        updated_at: FieldValue.serverTimestamp(),
      });
    }
  }

  return {
    ok: true,
    action: 'approve_for_forecast',
    candidate_id,
    registry_id,
    queue_status: 'approved',
    registry_status: 'testing',
    forecast_approved: true,
    message: `Candidate ${candidate_id} approved. forecast_approved=true, status=testing. Now eligible for forecast evaluation under evidence thresholds.`,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ACTION 2: Reject Permanently
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Marks the candidate and registry entry as rejected.
 * forecast_approved remains false. Record is kept for audit — never deleted.
 */
export async function rejectCandidate(
  payload: ReviewActionPayload
): Promise<ReviewActionResult> {
  const db = getAdminDb();
  const { candidate_id, notes = null, reviewed_by = 'researcher' } = payload;
  const registry_id = await resolveRegistryId(db, candidate_id, payload.registry_id);

  await db.collection('auto_hypothesis_queue').doc(candidate_id).update({
    ...reviewMeta('rejected', 'reject_permanently', notes, reviewed_by),
    status: 'rejected',
    forecast_approved: false,
    rejected_at: FieldValue.serverTimestamp(),
  });

  if (registry_id) {
    const regRef = db.collection('hypothesis_registry').doc(registry_id);
    const regSnap = await regRef.get();
    if (regSnap.exists) {
      await regRef.update({
        forecast_approved: false,
        status: 'rejected',
        review_required: false,
        review_status: 'rejected',
        review_decision: 'reject_permanently',
        review_notes: notes,
        reviewed_by,
        reviewed_at: new Date().toISOString(),
        updated_at: FieldValue.serverTimestamp(),
      });
    }
  }

  return {
    ok: true,
    action: 'reject_permanently',
    candidate_id,
    registry_id,
    queue_status: 'rejected',
    registry_status: 'rejected',
    forecast_approved: false,
    message: `Candidate ${candidate_id} rejected permanently. Kept in queue for audit. forecast_approved=false.`,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ACTION 3: Return to Queue
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Sends the candidate back to 'candidate' status for re-evaluation.
 * Does NOT remove the registry entry — leaves it as 'proposed' (not-forecast-active).
 * forecast_approved stays false.
 */
export async function returnCandidateToQueue(
  payload: ReviewActionPayload
): Promise<ReviewActionResult> {
  const db = getAdminDb();
  const { candidate_id, notes = null, reviewed_by = 'researcher' } = payload;
  const registry_id = await resolveRegistryId(db, candidate_id, payload.registry_id);

  await db.collection('auto_hypothesis_queue').doc(candidate_id).update({
    ...reviewMeta('returned', 'return_to_queue', notes, reviewed_by),
    status: 'candidate',
    forecast_approved: false,
  });

  // Leave registry as 'proposed' — still not forecast-active
  if (registry_id) {
    const regRef = db.collection('hypothesis_registry').doc(registry_id);
    const regSnap = await regRef.get();
    if (regSnap.exists) {
      await regRef.update({
        forecast_approved: false,
        review_status: 'returned',
        review_decision: 'return_to_queue',
        review_notes: notes,
        reviewed_by,
        reviewed_at: new Date().toISOString(),
        updated_at: FieldValue.serverTimestamp(),
      });
    }
  }

  return {
    ok: true,
    action: 'return_to_queue',
    candidate_id,
    registry_id,
    queue_status: 'returned',
    registry_status: 'proposed',
    forecast_approved: false,
    message: `Candidate ${candidate_id} returned to queue for re-evaluation. Registry entry remains as 'proposed' (not forecast-active).`,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// ACTION 4: Mark Needs More Data
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Marks the candidate as needing more evidence before it can be reviewed.
 * Useful when trigger_fired_count is marginal — re-run backtest with more data.
 * forecast_approved stays false.
 */
export async function markCandidateNeedsMoreData(
  payload: ReviewActionPayload
): Promise<ReviewActionResult> {
  const db = getAdminDb();
  const { candidate_id, notes = null, reviewed_by = 'researcher' } = payload;
  const registry_id = await resolveRegistryId(db, candidate_id, payload.registry_id);

  await db.collection('auto_hypothesis_queue').doc(candidate_id).update({
    ...reviewMeta('needs_more_data', 'needs_more_data', notes, reviewed_by),
    status: 'needs_more_data',
    forecast_approved: false,
  });

  if (registry_id) {
    const regRef = db.collection('hypothesis_registry').doc(registry_id);
    const regSnap = await regRef.get();
    if (regSnap.exists) {
      await regRef.update({
        forecast_approved: false,
        review_status: 'needs_more_data',
        review_decision: 'needs_more_data',
        review_notes: notes,
        reviewed_by,
        reviewed_at: new Date().toISOString(),
        updated_at: FieldValue.serverTimestamp(),
      });
    }
  }

  return {
    ok: true,
    action: 'needs_more_data',
    candidate_id,
    registry_id,
    queue_status: 'needs_more_data',
    registry_status: 'needs_more_data',
    forecast_approved: false,
    message: `Candidate ${candidate_id} flagged as needs_more_data. Run more backtest data before re-reviewing. forecast_approved=false.`,
  };
}

// ── Read helper: load review-ready candidates ─────────────────────────────────

export async function readReviewQueueCandidates(): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();

  const { serializeDoc, PILOT_GAME_ID } = await import('../readers/pilotConstants');

  // Candidates with last_recommendation = promote_to_testing
  // and review_status = pending (or not yet set)
  const snap = await db
    .collection('auto_hypothesis_queue')
    .where('game_id', '==', PILOT_GAME_ID)
    .where('last_recommendation', '==', 'promote_to_testing')
    .get();

  const docs = snap.docs.map((d) => serializeDoc(d.data()));

  // Filter to only those not yet reviewed (or returned)
  return docs.filter(
    (d) =>
      !d.review_status ||
      d.review_status === 'pending' ||
      d.review_status === 'returned' ||
      d.review_status === 'needs_more_data'
  );
}
