# Phase 7 Railway Research Engine Architecture

## Purpose

Phase 7 defines a Railway-first research architecture for Four Pillars lottery research.
This is an architecture-only phase. It does not migrate data, ingest new data, run
backtests, seed hypotheses, enable Pick 4 forecasts, add states, or change Lottery
Engine behavior.

## Why Firestore Is No Longer The Analytical Database

Firestore worked for the early pilot because the data volume was small and the
queries were narrow. Phase 6 evidence expansion showed that repeated historical
research scans are a different workload:

- evidence review needs wide date-window scans across many hypothesis/draw pairs
- comparison views need aggregates over `evidence_tracker` and `forecast_runs`
- backtests create one evidence record per hypothesis, draw, game, and rule version
- larger windows and more games multiply read/write volume quickly
- server-rendered dashboards can accidentally repeat expensive scans

Firestore should remain a product database for lightweight user-facing state. It
should not be the canonical analytical store for historical draws, feature builds,
evidence generation, backtest results, or large aggregate comparisons.

## Target Responsibility Split

### Railway Lottery Engine

Railway `lottery-engine` becomes the canonical historical research engine. It owns
heavy historical data, derived research artifacts, backtest execution, evidence
aggregation, and cross-pillar convergence analysis.

### planetary-overlays

`planetary-overlays` becomes the app shell, dashboard, admin console, and forecast
governance UI. It consumes Railway APIs, stores only lightweight user-facing records
in Firebase, and avoids Firestore-heavy server-rendered research pages.

### Firebase / Firestore

Firebase is reduced to auth, preferences, small saved summaries, review notes,
governance decisions, and lightweight records that are needed by the app shell.

### Sweet404Peaches

Sweet404Peaches should eventually integrate as the Dream / Symbolic Convergence
pillar. It should call the same Railway engine and share canonical draw IDs,
windows, games, and evidence summaries instead of duplicating lottery history.

## Four Pillars Convergence Model

1. Historical Draw Engine
   - Canonical draws, jurisdictions, games, draw coverage, corrections, provenance,
     and historical result windows.

2. Celestial / Mystical Overlay Engine
   - Moon phase, moon sign, sun sign, weekday ruler, planetary context, lunar
     windows, and versioned overlay calculations.

3. Statistical / Pattern Engine
   - Digit patterns, sums, roots, parity, repeats, positional behavior, baselines,
     hypothesis evidence, and backtest summaries.

4. Dream / Symbolic Convergence Engine
   - Dream windows, symbols, user or collective symbolic hits, symbolic matching,
     convergence runs, and overlap with draw/celestial/statistical evidence.

The research engine should be able to score or explain convergence across all four
pillars without requiring each app to copy the underlying historical data.

## Railway Storage Responsibilities

Railway database or Railway volume should store the heavy research state.

### Proposed Tables Or Resources

- `jurisdictions`
  - Canonical state/region records, timezone, source identifiers, and active flags.

- `games`
  - Game definitions, digit count, draw labels, schedule versions, and jurisdiction
    relationships.

- `draws`
  - Canonical historical draw records, result digits, padded result, draw label,
    draw datetime, source provenance, verification status, and correction version.

- `draw_coverage`
  - Coverage windows by jurisdiction/game/source, missing ranges, conflict status,
    and last verified timestamps.

- `celestial_overlays`
  - Versioned celestial snapshots keyed by draw or forecast context.

- `symbolic_features`
  - Versioned derived features combining draw facts, overlays, digit properties,
    labels, weekdays, and symbolic attributes.

- `hypothesis_registry`
  - Hypothesis definitions, trigger logic, expected logic, status, version,
    game scope, governance metadata, and approval state.

- `evidence_tracker`
  - One versioned evidence row per hypothesis/draw/rule version with trigger and
    outcome results.

- `backtest_runs`
  - Backtest job metadata, input window, versions, counts, status, artifacts,
    errors, and aggregate output pointers.

- `forecast_candidates`
  - Research candidate signals produced by evidence-backed context evaluation.

- `forecast_runs`
  - Governed forecast records and explanations. Pick 4 remains disabled unless a
    later governance phase explicitly enables it.

- `dream_windows`
  - Dream/symbolic windows, time ranges, source app, symbol taxonomy version, and
    participant or cohort metadata as allowed by privacy rules.

- `dream_hits`
  - Normalized symbolic hits, symbols, confidence, source, anonymized owner or
    cohort references, and related time windows.

- `convergence_runs`
  - Cross-pillar runs that connect draws, overlays, statistical evidence, and
    dream/symbolic windows into explainable summaries.

### Railway Volume Usage

Railway volume can store large artifacts that do not need OLTP-style queries:

- exported evidence batches
- JSONL/parquet research snapshots
- backtest artifact bundles
- aggregate comparison exports
- reproducibility manifests
- model or scoring input snapshots

Every artifact should be addressable from the Railway database by stable ID,
version, creation time, and checksum.

## Firebase / Firestore Reduced Role

Firestore should keep:

- user auth-linked profile settings
- saved dashboard filters and preferences
- lightweight forecast summaries
- review notes and governance annotations
- small admin decisions
- pointers to Railway `job_id`, `run_id`, `snapshot_id`, or `summary_id`
- small user-facing records that need low-latency UI reads

Firestore should not keep:

- large historical draw mirrors for repeated research scanning
- full evidence history at expanding window scale
- full backtest output rows
- large comparison datasets
- all-state analytical result tables
- server-rendered pages that trigger wide analytical scans

## planetary-overlays App Shell Role

The app should be organized as UI and governance layers over Railway:

- User-facing Oracle / Forecast Studio
  - Forecast presentation, explanation, saved readings, and governed user-facing
    outcomes.

- Admin / Research Console
  - Research job controls, job status, read-only summaries, hypothesis governance,
    and promotion review.

- Evidence Archive
  - Paginated and filtered Railway summaries, not raw Firestore scans.

- Celestial Weather
  - Current and upcoming celestial context from Railway or lightweight cached
    summaries.

- Dream Convergence
  - Sweet404Peaches-facing convergence summaries and dream-window research views.

planetary-overlays should call Railway APIs from server-side adapters or route
handlers, then render bounded summary payloads. The UI should not run ingestion,
backtests, or large evidence scans directly.

## Proposed Railway API Endpoints

- `GET /status`
  - Engine health, versions, available resources, scheduler state, and data snapshot.

- `GET /coverage`
  - Coverage by jurisdiction, game, source, date window, and missing ranges.

- `POST /draws/query`
  - Bounded draw query with pagination, game filters, date windows, and provenance.

- `POST /overlays/build`
  - Async overlay build job for a bounded game/window/version.

- `POST /features/build`
  - Async feature build job for a bounded game/window/version.

- `GET /hypotheses`
  - Hypothesis registry query by game, status, family, version, or governance state.

- `POST /backtest`
  - Async backtest job request with idempotency key, game/window, hypothesis scope,
    and rule versions.

- `GET /evidence/summary`
  - Pre-aggregated evidence summary by game, hypothesis, window, and version.

- `GET /forecast/candidates`
  - Evidence-backed forecast candidates for a governed game/context.

- `GET /forecast/explain`
  - Forecast or candidate explanation with decision chain and source evidence.

- `POST /convergence/run`
  - Cross-pillar convergence run over draw, celestial, statistical, and dream
    inputs.

- `POST /dream-window/backtest`
  - Dream-window historical test against canonical draw and overlay data.

All endpoints should include explicit version fields where relevant:
`engine_version`, `data_snapshot_id`, `rule_version`, `overlay_version`,
`symbolic_version`, `feature_version`, and `schema_version`.

## App Consumption Pattern

planetary-overlays should use a bounded adapter layer:

1. UI page requests a small summary or job status.
2. App route or server helper calls Railway with auth and version headers.
3. Railway returns paginated rows, summary aggregates, or async job metadata.
4. App renders the result and optionally stores lightweight review/governance notes
   in Firestore.

This keeps heavy research state in Railway while preserving Firebase for product
state and governance records.

## Sweet404Peaches Future Integration

Sweet404Peaches should integrate through Railway APIs:

- submit dream windows and symbolic hits to Railway
- query convergence summaries by dream window, draw window, or symbol family
- reuse canonical `draws`, `games`, `jurisdictions`, and `celestial_overlays`
- avoid maintaining a separate lottery-history database
- participate in `convergence_runs` as the Dream / Symbolic Convergence Engine

No Sweet404Peaches code integration is part of Phase 7A.

## Migration Phases

- Phase 7A architecture
  - Static plan, dashboard reference page, and guardrails.

- Phase 7B engine schema
  - Define Railway database schema, migrations, resource naming, indexes, and
    artifact storage conventions.

- Phase 7C engine API contract
  - Specify request/response contracts, authentication, pagination, idempotency,
    version fields, and error shapes.

- Phase 7D app-shell adapter layer
  - Add planetary-overlays adapters that call Railway summaries without changing
    existing forecast behavior.

- Phase 7E Sweet404Peaches bridge
  - Define dream-window and symbolic-hit contracts, then add a bridge to Railway.

- Phase 7F historical migration dry run
  - Dry-run migration/export validation only. Compare checksums, counts, versions,
    and sample records before any production cutover.

- Phase 7G all-state research scheduler
  - Railway-owned scheduler for all-state research jobs, bounded windows,
    rate limits, observability, and recovery.

## Guardrails

- Architecture-only in Phase 7A.
- No Firestore mutation.
- No data migration.
- No ingestion.
- No backtests.
- No hypothesis seeding.
- No Pick 4 forecasts.
- No new states.
- No Lottery Engine behavior changes.
- No Firebase rules changes.
- No Firestore-heavy server-rendered pages.
- No Sweet404Peaches code integration yet.
- Any static internal page must not call Firestore, Railway, or app APIs.
