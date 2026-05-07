# Four Pillars — Phase 4.5: Manual Review & Approval Layer

## Purpose

Phase 4 introduced observation discovery, candidate generation, validation, and guarded promotion.
Phase 4.5 adds the missing human layer: **review, approval, rejection, and audit trail**.

Auto-generated hypotheses are permanently blocked from forecast output unless you explicitly
approve them. This file explains every piece of the layer.

---

## Hard rule (unchanged from Phase 4, now enforced in UI and engine)

```
auto_generated === true AND forecast_approved !== true → excluded from all forecasts
```

This is enforced in `forecastEngine.ts` via a `.filter()` on the hypothesis list.
See `src/lib/fourPillars/review/forecastEngine.patch.ts` for the exact lines to add.

---

## Lifecycle (corrected from Phase 4)

```
candidate → validated → proposed (registry) → [human review] → testing (forecast_approved=true)
                                                             → rejected (forecast_approved=false)
                                                             → returned (back to candidate queue)
                                                             → needs_more_data
```

**Phase 4 had a wording error:** promoted candidates entered registry as `status=testing`.
**Phase 4.5 fixes this:** they now enter as `status=proposed`. Only human approval sets `status=testing`.

---

## File layout (all new or replaced)

```
src/
  lib/fourPillars/review/
    reviewTypes.ts              ← type definitions for the review workflow
    reviewActions.ts            ← 4 atomic review operations + read helper
    reviewEngine.ts             ← fix legacy entries + review summary + isForecastEligible
    forecastEngine.patch.ts     ← documents the exact lines to change in forecastEngine.ts
    promotionEngine.patch.ts    ← documents the exact lines to change in promotionEngine.ts

  app/
    api/four-pillars/phase4/
      approve-candidate/route.ts
      reject-candidate/route.ts
      return-candidate-to-queue/route.ts
      mark-candidate-needs-more-data/route.ts

    phase4/
      review-queue/page.tsx          ← NEW: focused review queue
      candidates/[candidateId]/page.tsx  ← REPLACES Phase 4 version (adds ReviewActionPanel)
      promotion/page.tsx             ← REPLACES Phase 4 version (corrected wording)

  components/phase4/
    CandidateApprovalBadge.tsx      ← shows review/approval status clearly
    ReviewActionPanel.tsx            ← 4 action buttons with notes input (client component)
    ReviewNotesForm.tsx              ← read-only review history display

  components/phase2/
    DashboardShell.tsx              ← REPLACES Phase 4 version (adds Review Queue nav item)
```

---

## Files that replace existing Phase 4 files

| File | Action |
|---|---|
| `src/components/phase2/DashboardShell.tsx` | Replace Phase 4 version |
| `src/app/phase4/candidates/[candidateId]/page.tsx` | Replace Phase 4 version |
| `src/app/phase4/promotion/page.tsx` | Replace Phase 4 version |

---

## Required manual patches (apply by hand)

### 1. forecastEngine.ts

In the hypothesis filter loop, add `.filter()` after `.map()`:

```typescript
// Phase 4.5 hard rule
const hypotheses = hypSnap.docs
  .map((d) => ({ id: d.id, ...d.data() }))
  .filter((h) => {
    if (h.auto_generated === true) {
      return h.forecast_approved === true;
    }
    return true;
  });
```

### 2. promotionEngine.ts

Change `status: 'testing'` → `status: 'proposed'` in the `regRef.set()` call.
Add `forecast_approved: false`, `review_required: true`, `review_status: 'pending'`.
See `promotionEngine.patch.ts` for the complete updated block.

---

## Review actions table

| Action | queue status | registry status | forecast_approved |
|---|---|---|---|
| Approve for Forecast Use | approved | testing | true |
| Reject Permanently | rejected | rejected | false |
| Return to Queue | returned | proposed | false |
| Needs More Data | needs_more_data | needs_more_data | false |

---

## Run instructions

### If you have existing Phase 4 promotions in the registry as status=testing

Run the legacy fix helper first:

```bash
# Add a temporary API route or run this in a script:
import { fixLegacyAutoTestingEntries } from '@/lib/fourPillars/review/reviewEngine';
const result = await fixLegacyAutoTestingEntries();
console.log(`Fixed ${result.fixed} of ${result.found} entries`);
```

### Normal flow

1. Navigate to `/phase4/promotion`
2. Run Steps 1–4 (or use existing Phase 4 data)
3. Navigate to `/phase4/review-queue`
4. For each candidate, click **Review this candidate →**
5. On the detail page, read the trigger/expected logic, stats, and source observation
6. Use the Review Action Panel to approve, reject, return, or flag

### Approve via API

```bash
curl -X POST http://localhost:3000/api/four-pillars/phase4/approve-candidate \
  -H "Content-Type: application/json" \
  -d '{"candidate_id":"cand_weekday_digit_root_Friday_6","notes":"Strong lift, clean signal."}'
```

---

## Validation checklist

### /phase4/review-queue
- [ ] Only shows candidates with last_recommendation=promote_to_testing
- [ ] Pending and returned candidates appear; approved/rejected do not
- [ ] Stats (fired, support rate, lift, confidence) are correct
- [ ] "Review this candidate →" links to the detail page
- [ ] Summary counters match queue state

### /phase4/candidates/[candidateId]
- [ ] CandidateApprovalBadge shows correct review status
- [ ] "forecast-blocked" badge shown for unapproved auto-generated candidates
- [ ] "🎯 forecast-active" badge shown only when forecast_approved=true
- [ ] ReviewActionPanel shows 4 buttons
- [ ] Approve button triggers confirm dialog
- [ ] After approval: result JSON shows forecast_approved=true
- [ ] After rejection: result JSON shows forecast_approved=false
- [ ] Reload shows updated status without stale cache (revalidate=0)
- [ ] ReviewNotesForm shows decision, reviewer, timestamp, and notes after action

### /phase4/promotion
- [ ] Lifecycle diagram shows proposed (not testing) as the output of Step 4
- [ ] Hard rule callout explains that proposed ≠ forecast-active
- [ ] "Ready for review" counter is correct
- [ ] Step 4 description says "enters as status=proposed"
- [ ] Step 5 callout links to Review Queue

### Forecast engine guard
- [ ] After approval: approved candidate appears in forecast decision chain on /phase3/forecast-debug
- [ ] Before approval: auto_generated candidates with forecast_approved=false do NOT appear in candidates
- [ ] Human-authored hypotheses (auto_generated !== true) are not affected by this filter

### hypothesis_registry (Firestore)
- [ ] Promoted auto-generated entries have status=proposed, forecast_approved=false, review_required=true
- [ ] After approval: status=testing, forecast_approved=true, approval_source=manual_phase4_5
- [ ] After rejection: status=rejected, forecast_approved=false
- [ ] review_notes, reviewed_by, reviewed_at all populated after any review action
