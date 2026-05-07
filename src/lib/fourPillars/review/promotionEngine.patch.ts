/**
 * Phase 4.5 Promotion Engine Patch
 *
 * This file documents the change needed in promotionEngine.ts.
 * It is NOT a standalone file to deploy — apply the change directly.
 *
 * In promotionEngine.ts, locate the block that writes to hypothesis_registry.
 * It currently contains:
 *
 * ─── BEFORE ──────────────────────────────────────────────────────────────────
 *
 *   await regRef.set({
 *     hypothesis_id: registry_id,
 *     ...
 *     status: 'testing',               ← WRONG
 *     auto_generated: true,
 *     ...
 *   });
 *
 *   // Update candidate status
 *   await cand.ref.update({
 *     status: 'testing',               ← WRONG
 *     promotion_decision: 'promoted_to_testing',
 *
 * ─── AFTER ───────────────────────────────────────────────────────────────────
 *
 *   await regRef.set({
 *     hypothesis_id: registry_id,
 *     ...
 *     status: 'proposed',              ← CORRECT: proposed, not testing
 *     forecast_approved: false,        ← ADD: explicitly blocked until reviewed
 *     review_required: true,           ← ADD: signals review queue
 *     review_status: 'pending',        ← ADD
 *     auto_generated: true,
 *     ...
 *   });
 *
 *   // Update candidate status
 *   await cand.ref.update({
 *     status: 'proposed',              ← CORRECT: proposed, not testing
 *     promotion_decision: 'promoted_as_proposed',
 *     review_status: 'pending',        ← ADD
 *     forecast_approved: false,        ← ADD
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Also update the return value:
 *
 * ─── BEFORE ──────────────────────────────────────────────────────────────────
 *   promoted_to_testing++
 *   promoted_ids.push(cand.candidate_id as string);
 *
 * ─── AFTER ───────────────────────────────────────────────────────────────────
 *   promoted_to_proposed++;             ← rename counter for clarity
 *   promoted_ids.push(cand.candidate_id as string);
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The complete updated promotionEngine.ts section for the registry write is:
 */

export const PHASE_4_5_PROMOTION_PATCH_VERSION = '1.0.0';

/*
  if (eligible) {
    const registry_id = `auto_${cand.candidate_id}`;
    const regRef = db.collection('hypothesis_registry').doc(registry_id);
    const regSnap = await regRef.get();

    if (!regSnap.exists) {
      await regRef.set({
        hypothesis_id: registry_id,
        source: 'auto_observation',
        candidate_id: cand.candidate_id,
        observation_id: cand.observation_id,
        title: cand.title,
        description: cand.description,
        system_family: `auto_${cand.pattern_family}`,
        system_name: cand.pattern_family,
        jurisdiction_ids: ['ny'],
        game_ids: [PILOT_GAME_ID],
        draw_labels: ['midday', 'evening'],
        trigger_logic: cand.trigger_logic,
        expected_logic: cand.expected_logic,
        rule_version: RULE_VERSION,

        // Phase 4.5: enter as proposed, NOT testing
        status: 'proposed',
        forecast_approved: false,
        review_required: true,
        review_status: 'pending',

        auto_generated: true,
        confidence_score: cand.confidence_score,
        confidence_label: cand.confidence_label,
        validated_support_rate: support_rate,
        validated_lift: lift,
        evidence_count_supporting: 0,
        evidence_count_contradicting: 0,
        evidence_count_neutral: 0,
        evidence_count_total: 0,
        support_rate: null,
        last_tested_at: null,
        promoted_at: FieldValue.serverTimestamp(),
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
    }

    // Update candidate status
    await cand.ref.update({
      status: 'proposed',
      promotion_decision: 'promoted_as_proposed',
      promotion_reason: reason,
      registry_id,
      review_status: 'pending',
      forecast_approved: false,
      promoted_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });

    promoted_to_proposed++;
    promoted_ids.push(cand.candidate_id as string);
  }
*/
