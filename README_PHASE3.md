# Four Pillars — Phase 3

Research usability upgrade + expanded hypothesis set for the NY Pick 3 January 2024 pilot.

## What's new in Phase 3

### New hypothesis seeding
- 8 new starter hypotheses in `starterHypothesesPhase3.ts`
- Covered areas: Friday/Venus digit root 6, Wednesday/Mercury digit root 5, Thursday/Jupiter digit root 3 or 9, Capricorn Moon pos1=8, Pisces Moon digit root 3 or 7, waning moon digit sum ≤12, New/Waxing Crescent → double, Aquarius Sun digit root 4

### New pages
- `/phase3/jobs` — run pipeline steps from the UI (seed, overlays, features, backtest, forecast)
- `/phase3/research` — cross-collection search with richer filters
- `/phase3/forecast-debug` — full hypothesis decision chain for any forecast

### Updated pages
- `/phase2/hypotheses/[hypothesisId]` — hypothesis detail with evidence breakdown and cross-links
- `DashboardShell.tsx` — updated nav with Phase 2 + Phase 3 sections

### New API routes
- `POST /api/four-pillars/jobs/run-seed-hypotheses`
- `POST /api/four-pillars/jobs/run-build-overlays`
- `POST /api/four-pillars/jobs/run-build-features`
- `POST /api/four-pillars/jobs/run-backtest`
- `POST /api/four-pillars/jobs/run-refresh-forecast`

### Updated evaluator
- `evaluator.ts` — added explicit boolean matching + confirmed `_in` operator handles `digit_root_in` and `moon_phase_name_in` for Phase 3 hypotheses

## Drop path

All files go into your existing `planetary-overlays` repo at the paths shown.

The `src/components/phase2/DashboardShell.tsx` **replaces** the Phase 2 version — copy it over.
The `src/lib/fourPillars/evidence/evaluator.ts` **replaces** the Phase 1 version.
All other files are new additions.

## Run order after install

```bash
# 1. Seed Phase 1 + Phase 3 hypotheses (idempotent)
curl -X POST http://localhost:3000/api/four-pillars/jobs/run-seed-hypotheses

# 2. Build overlays (skip if already complete)
curl -X POST http://localhost:3000/api/four-pillars/jobs/run-build-overlays

# 3. Build features (skip if already complete)
curl -X POST http://localhost:3000/api/four-pillars/jobs/run-build-features

# 4. Run backtest — this picks up Phase 3 hypotheses and writes new evidence records
curl -X POST http://localhost:3000/api/four-pillars/jobs/run-backtest

# 5. Refresh forecast
curl -X POST http://localhost:3000/api/four-pillars/jobs/run-refresh-forecast

# Check forecast debug
open http://localhost:3000/phase3/forecast-debug
```

Or do all of the above from the UI: `/phase3/jobs`

## Validation checklist

### /phase3/jobs
- [ ] All 5 job cards visible
- [ ] Clicking Run shows spinner, then result JSON
- [ ] Recent job log shows jobs in correct order
- [ ] Failed jobs show error text in rose

### /phase3/research
- [ ] View switcher changes between draws / overlays / features / evidence
- [ ] Draws view: filter by digit_root narrows correctly
- [ ] Draws view: doubles_only=true returns only double-digit results
- [ ] Overlays view: moon_sign filter works, is_waxing filter works
- [ ] Features view: ruler filter works (e.g. Saturn → Saturdays)
- [ ] Evidence view: trigger_met=true returns only trigger-fired rows

### /phase3/forecast-debug
- [ ] Summary banner shows correct decision (evidence_backed or empty_reason)
- [ ] Each hypothesis has correct ✓ / – / ✗ indicator
- [ ] threshold_failure_reason text explains why hypotheses failed
- [ ] Passed hypotheses show support rate
- [ ] Evidence-backed ones show candidate contributions
- [ ] "detail →" links work to hypothesis detail page

### /phase2/hypotheses/[hypothesisId]
- [ ] Breadcrumb works
- [ ] Trigger logic and expected logic shown as JSON
- [ ] Evidence breakdown split by support / contradiction / neutral / inconclusive
- [ ] "draw →" links in evidence rows go to draw detail
- [ ] "Filter evidence" cross-link goes to /phase2/evidence with hypothesis_id pre-set
- [ ] Support rate bar renders

### Phase 3 hypotheses (after backtest)
- [ ] All 8 Phase 3 hypotheses appear in /phase2/hypotheses list
- [ ] evidence_count_total is non-zero after backtest
- [ ] At least some have trigger_fired_count > 0
- [ ] No fake candidates appear in forecasts (evidence threshold must be met)

## Evaluator operator notes

Phase 3 hypotheses use `digit_root_in` and `moon_phase_name_in` in their logic objects.
The evaluator handles these via the `_in` suffix: `features["digit_root"]` is checked against the array.
Confirm the updated `evaluator.ts` is in place before running the backtest.
