# Four Pillars — Phase 2 Dashboard

Internal research dashboard for the NY Pick 3 January 2024 pilot.
Drop all files into your `planetary-overlays` repo. No new dependencies required.

## File layout

```
src/
  lib/fourPillars/readers/
    pilotConstants.ts        ← shared constants + Firestore serializer
    statusReader.ts
    drawsReader.ts
    overlaysReader.ts
    featuresReader.ts
    hypothesesReader.ts
    evidenceReader.ts
    forecastsReader.ts

  app/api/four-pillars/      ← read-only JSON endpoints
    status/route.ts
    draws/route.ts
    draws/[drawId]/route.ts
    overlays/route.ts
    features/route.ts
    hypotheses/route.ts
    evidence/route.ts
    forecasts/latest/route.ts

  app/phase2/                ← dashboard pages (Server Components)
    layout.tsx               ← sidebar nav
    page.tsx                 ← redirects to /status
    status/page.tsx
    draws/page.tsx
    draws/[drawId]/page.tsx  ← full pipeline trace per draw
    overlays/page.tsx
    features/page.tsx
    hypotheses/page.tsx
    evidence/page.tsx
    forecasts/page.tsx

  components/phase2/
    DashboardShell.tsx       ← sidebar navigation (client)
    StatCard.tsx
    DrawTable.tsx
    EvidenceTable.tsx
    ForecastCard.tsx
    KeyValueBlock.tsx
    FilterBar.tsx            ← URL-param-based filters (client)
```

## Running locally

```bash
npm run dev
# Navigate to:
open http://localhost:3000/phase2/status
```

## Validation checklist

### /phase2/status
- [ ] All 6 stat counts match Firestore totals
- [ ] Pipeline completeness shows ≥95% for draws → overlays and draws → features
- [ ] Latest forecast shows evidence_backed or empty_reason
- [ ] Recent draws table shows leading zeroes (e.g. "028", not "28")

### /phase2/draws
- [ ] Result column preserves leading zeroes in font-mono
- [ ] Filter by date narrows to correct date
- [ ] Filter by label (midday/evening) works
- [ ] "inspect →" links go to /phase2/draws/[drawId]

### /phase2/draws/[drawId]
- [ ] Hero shows result_padded correctly (e.g. "028")
- [ ] draw_datetime_local and draw_datetime_utc both present
- [ ] _time_confidence shows "exact" or "derived"
- [ ] Overlay section populated (moon_sign, sun_sign, moon_phase_name)
- [ ] Features section populated (weekday_name correct for local date, not UTC rollover)
- [ ] Evidence section shows all hypothesis rows for this draw

### /phase2/overlays
- [ ] sun_sign is Capricorn for Jan 1–19, Aquarius for Jan 20–31
- [ ] is_waxing correct (↑ green / ↓ red)
- [ ] Illumination percentage looks reasonable for phase name

### /phase2/features
- [ ] weekday_name matches the local draw date (key fix from Phase 1)
- [ ] weekday_ruler maps correctly (Mon → Moon, Sat → Saturn, etc.)
- [ ] Season is "Winter" for all January rows
- [ ] Double/triple/fibonacci flags fire on correct results

### /phase2/hypotheses
- [ ] All 3 pilot hypotheses visible
- [ ] evidence_count_total, supporting, contradicting, neutral all non-zero
- [ ] support_rate bar rendered correctly
- [ ] trigger_logic and expected_logic JSON displayed

### /phase2/evidence
- [ ] Result summary counts (support / contradiction / neutral / inconclusive) visible
- [ ] Filter by hypothesis narrows correctly
- [ ] Filter by result works
- [ ] "draw →" links navigate to draw detail

### /phase2/forecasts
- [ ] Shows evidence_backed: true/false correctly
- [ ] If false: empty_reason explains why (insufficient evidence history is correct)
- [ ] celestial_snapshot and context_features rendered
- [ ] Version metadata (forecast_method_version, overlay_version, etc.) shown

## API endpoints (read-only)

```bash
BASE=http://localhost:3000

curl $BASE/api/four-pillars/status
curl $BASE/api/four-pillars/draws
curl "$BASE/api/four-pillars/draws?label=midday&date=2024-01-15"
curl $BASE/api/four-pillars/draws/ny_pick3_2024-01-15_midday
curl $BASE/api/four-pillars/overlays
curl $BASE/api/four-pillars/features
curl $BASE/api/four-pillars/hypotheses
curl "$BASE/api/four-pillars/evidence?result=support"
curl $BASE/api/four-pillars/forecasts/latest
```

## Notes

- All pages use `revalidate = 30` (Next.js ISR — re-fetches Firestore at most every 30s)
- FilterBar components are client components using URL search params (no JS state, fully SSR-compatible)
- No new Firestore collections are created in Phase 2
- No Phase 1 pipeline logic is modified
