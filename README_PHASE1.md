# Four Pillars — Phase 1 Micro-Pilot Files

## What's in this package

All files go into your existing `four-pillars-app` repo.
Drop each file into the path shown — do not rename or move them.

## First: install the new dependency

```bash
npm install astronomy-engine
```

## If you hit edge-runtime errors, add to next.config.js

```js
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ['astronomy-engine'],
  },
};
```

## File layout

```
src/
  lib/
    fourPillars/
      constants/
        versions.ts
        normalization.ts
      jobs/
        jobRunner.ts
      seed/
        seedData.ts
      sync/
        engineClient.ts
        drawMapper.ts
        syncDraws.ts
      overlays/
        celestialEngine.ts
        buildOverlays.ts
      features/
        symbolicEngine.ts
        buildSymbolicFeatures.ts
      hypotheses/
        starterHypotheses.ts
        seedHypotheses.ts
      evidence/
        evaluator.ts
        runBacktest.ts
      forecast/
        forecastEngine.ts
  app/
    api/
      four-pillars/
        seed/route.ts
        sync-draws/route.ts
        build-overlays/route.ts
        build-features/route.ts
        seed-hypotheses/route.ts
        run-backtest/route.ts
        refresh-forecasts/route.ts
        pilot-status/route.ts
```

## Required .env.local values

```
LOTTERY_ENGINE_URL=https://lottery-engine-production.up.railway.app
LOTTERY_ENGINE_TOKEN=your_token_if_needed
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
```

## Run order (localhost:3000)

```bash
# 1. Seed NY jurisdiction + ny_pick3 game
curl -X POST http://localhost:3000/api/four-pillars/seed

# 2. Mirror NY Pick 3 Jan 2024 from lottery-engine
curl -X POST http://localhost:3000/api/four-pillars/sync-draws \
  -H "Content-Type: application/json" \
  -d '{"state":"NY","game":"pick3","date_from":"2024-01-01","date_to":"2024-01-31"}'

# 3. Build celestial overlays
curl -X POST http://localhost:3000/api/four-pillars/build-overlays \
  -H "Content-Type: application/json" \
  -d '{"game_id":"ny_pick3","date_from":"2024-01-01","date_to":"2024-01-31"}'

# 4. Build symbolic features
curl -X POST http://localhost:3000/api/four-pillars/build-features \
  -H "Content-Type: application/json" \
  -d '{"game_id":"ny_pick3","date_from":"2024-01-01","date_to":"2024-01-31"}'

# 5. Seed starter hypotheses
curl -X POST http://localhost:3000/api/four-pillars/seed-hypotheses

# 6. Run backtest
curl -X POST http://localhost:3000/api/four-pillars/run-backtest \
  -H "Content-Type: application/json" \
  -d '{"game_id":"ny_pick3","date_from":"2024-01-01","date_to":"2024-01-31"}'

# 7. Generate forecast for Feb 1 midday
curl -X POST http://localhost:3000/api/four-pillars/refresh-forecasts \
  -H "Content-Type: application/json" \
  -d '{"game_id":"ny_pick3","jurisdiction_id":"ny","target_draw_date":"2024-02-01","target_draw_label":"midday","target_draw_time_utc":"2024-02-01T17:20:00Z"}'

# Check status at any point
curl http://localhost:3000/api/four-pillars/pilot-status
```

## Scaffolding notes (be honest about these)

- `active_aspects` in overlays is always [] — aspect computation is Phase 2
- `recommended_candidates` returns positional hints (e.g. "pos3:8"), not full 3-digit picks
- With only 31 days of Jan 2024 data, most forecasts will return an honest empty_reason
- That is correct Phase 1 behavior — evidence must be built before forecasts can fire
