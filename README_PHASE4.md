# Four Pillars — Phase 4: Observation Engine + Auto-Hypothesis Discovery

## What Phase 4 builds

A self-scanning research engine that detects repeated patterns in the pilot data,
converts them into structured hypotheses, backtests them, scores them, and promotes
only the strongest into the hypothesis registry — with explicit guardrails throughout.

## No new dependencies required.

## File layout (all new additions)

```
src/
  lib/fourPillars/
    observation/
      patternFamilies.ts       ← defines 11 (trigger, outcome) pattern families to scan
      baselineStats.ts         ← computes baseline rates across all pilot draws
      observationEngine.ts     ← scans features → writes observation_log
    autoHypotheses/
      candidateGenerator.ts    ← observations → auto_hypothesis_queue
      candidateValidator.ts    ← backtests candidates → candidate_validation_runs
      promotionEngine.ts       ← guarded promotion to hypothesis_registry
      scoring.ts               ← confidence score + promotion thresholds

    readers/
      observationReader.ts
      candidateReader.ts
      validationRunReader.ts

  app/
    api/four-pillars/phase4/
      run-observation-scan/route.ts
      generate-candidates/route.ts
      validate-candidates/route.ts
      promote-candidates/route.ts

    phase4/
      layout.tsx
      promotion/page.tsx          ← control center: all 4 steps + pipeline status
      observations/page.tsx       ← raw observation log
      candidates/page.tsx         ← candidate queue list
      candidates/[candidateId]/page.tsx  ← candidate detail + validation history
      validation-runs/page.tsx    ← all validation run records

  components/phase2/
    DashboardShell.tsx            ← REPLACES Phase 3 version (adds Phase 4 nav)
```

## New Firestore collections

- `observation_log` — raw detected patterns
- `auto_hypothesis_queue` — machine-generated candidate hypotheses
- `candidate_validation_runs` — backtest runs per candidate

These never break existing collections (`draws`, `hypothesis_registry`, `evidence_tracker`, etc.)

## Promotion thresholds

```
min trigger_fired_count  ≥ 5
min support_rate_on_fired ≥ 62%
min lift                 ≥ 1.15×
max contradiction_rate   ≤ 38%
```

All four must pass for a candidate to be promoted. Rejected candidates stay in the queue
with `status=rejected` for audit — they are never deleted.

## Confidence score formula

```
lift_component   = clamp((lift - 1.0) / 1.0, 0, 1)   [40% weight]
sample_component = clamp(sample / 20, 0, 1)            [30% weight]
rate_component   = clamp((rate - 0.3) / 0.5, 0, 1)    [30% weight]

score = 0.40 * lift_component + 0.30 * sample_component + 0.30 * rate_component

Labels: weak (<0.35), candidate (0.35–0.55), promising (0.55–0.70), strong (≥0.70)
```

## Pattern families scanned (11)

- weekday_name → digit_root
- weekday_ruler → digit_root
- moon_sign → digit_root
- moon_sign → digit_1 (positional)
- moon_sign → digit_3 (positional)
- moon_phase_name → is_double
- moon_phase_name → digit_sum band (low/mid/high)
- is_waxing → digit_sum band
- sun_sign → digit_root
- weekday_name → is_double
- draw_label → digit_root

## Run order

Go to `/phase4/promotion` and run all 4 steps in order, OR use curl:

```bash
BASE=http://localhost:3000

# Step 1 — scan pilot features and detect patterns
curl -X POST $BASE/api/four-pillars/phase4/run-observation-scan

# Step 2 — convert top observations into candidate hypotheses
curl -X POST $BASE/api/four-pillars/phase4/generate-candidates

# Step 3 — backtest all candidates against pilot draws
curl -X POST $BASE/api/four-pillars/phase4/validate-candidates

# Step 4 — run promotion engine (guarded — won't promote weak candidates)
curl -X POST $BASE/api/four-pillars/phase4/promote-candidates

# Then inspect:
open http://localhost:3000/phase4/promotion
open http://localhost:3000/phase4/observations
open http://localhost:3000/phase4/candidates
open http://localhost:3000/phase4/validation-runs
```

## Validation checklist

### After Step 1 (observation scan)
- [ ] /phase4/observations shows records with lift > 1.20
- [ ] Observations include diverse pattern families
- [ ] Notes field is a readable summary string
- [ ] No observations with lift < 1.20 appear

### After Step 2 (generate candidates)
- [ ] /phase4/candidates shows candidates with trigger_logic and expected_logic
- [ ] candidate_id starts with "cand_"
- [ ] trigger_logic and expected_logic are valid JSON dicts
- [ ] confidence_score is between 0 and 1
- [ ] confidence_label is one of: weak, candidate, promising, strong
- [ ] auto_generated is true on all Phase 4 candidates

### After Step 3 (validate candidates)
- [ ] /phase4/validation-runs shows one run per candidate
- [ ] validated_support_rate and validated_lift are populated on candidates
- [ ] recommendation is one of: promote_to_testing, reject, borderline, no_trigger_fired
- [ ] Candidates with no trigger fires get recommendation=no_trigger_fired

### After Step 4 (promotion)
- [ ] Candidates meeting all 4 thresholds → status=testing, appear in hypothesis_registry
- [ ] Promoted entries in hypothesis_registry have auto_generated=true, source=auto_observation
- [ ] Rejected candidates → status=rejected, kept in queue with promotion_reason
- [ ] /phase2/hypotheses shows any newly promoted hypotheses alongside Phase 1/3 ones

### Guardrail verification
- [ ] Candidates with trigger_fired < 5 are NOT promoted
- [ ] Candidates with support_rate < 62% are NOT promoted
- [ ] No candidates with lift < 1.15 are promoted
- [ ] No candidates with contradiction_rate > 38% are promoted
- [ ] Nothing auto-fires in forecasts without passing the separate forecast threshold check

## Important: replace DashboardShell.tsx

The updated `src/components/phase2/DashboardShell.tsx` adds the Phase 4 nav section.
This file **replaces** the Phase 3 version. Copy it over before running.
