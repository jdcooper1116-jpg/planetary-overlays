/**
 * Phase 4.5 Review Types
 *
 * Lifecycle for auto-generated candidates:
 *
 *   candidate → validated → ready_for_review → [human decision]
 *     ├─ approved      → registry: proposed → testing, forecast_approved: true
 *     ├─ rejected      → registry: rejected,             forecast_approved: false
 *     ├─ returned      → queue: candidate (re-queued),   forecast_approved: false
 *     └─ needs_more_data → queue: needs_more_data,       forecast_approved: false
 *
 * Hard rule:
 *   auto_generated === true AND forecast_approved !== true → excluded from forecasts.
 *   This is enforced in forecastEngine.ts. Phase 4.5 does NOT change that rule —
 *   it only provides the UI pathway to set forecast_approved = true via human action.
 */

// ── Queue-side review status ──────────────────────────────────────────────────

export type QueueReviewStatus =
  | 'pending'         // not yet reviewed
  | 'approved'        // human approved — forecast_approved set on registry
  | 'rejected'        // human rejected — archived in queue
  | 'needs_more_data' // returned with more-data flag
  | 'returned';       // sent back to candidate queue without rejection

// ── Registry-side status for auto-generated entries ──────────────────────────

export type RegistryAutoStatus =
  | 'proposed'           // entered from Phase 4 promotion — NOT forecast-active
  | 'testing'            // human-approved — forecast-active under evidence thresholds
  | 'rejected'           // human-rejected — archived
  | 'needs_more_data';   // flagged for more evidence before re-review

// ── Review decision ───────────────────────────────────────────────────────────

export type ReviewDecision =
  | 'approve_for_forecast'
  | 'reject_permanently'
  | 'return_to_queue'
  | 'needs_more_data';

// ── Review action payloads ────────────────────────────────────────────────────

export interface ReviewActionPayload {
  candidate_id: string;         // ID in auto_hypothesis_queue
  registry_id?: string;         // ID in hypothesis_registry (if already promoted)
  notes?: string;               // reviewer notes (optional for all actions)
  reviewed_by?: string;         // reviewer identifier (optional, defaults to 'researcher')
}

// ── Review metadata written to both collections ───────────────────────────────

export interface ReviewMetadata {
  review_status: QueueReviewStatus;
  review_decision: ReviewDecision;
  review_notes: string | null;
  reviewed_by: string;
  reviewed_at: string; // ISO string — set server-side
}

// ── Action outcome ────────────────────────────────────────────────────────────

export interface ReviewActionResult {
  ok: true;
  action: ReviewDecision;
  candidate_id: string;
  registry_id: string | null;
  queue_status: QueueReviewStatus;
  registry_status: RegistryAutoStatus | null;
  forecast_approved: boolean;
  message: string;
}
