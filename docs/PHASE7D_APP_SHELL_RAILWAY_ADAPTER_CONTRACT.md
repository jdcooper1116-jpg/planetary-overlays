# Phase 7D App-Shell Railway Adapter Contract

## Purpose

Phase 7D defines the future `planetary-overlays` app-shell adapter layer for
Railway research-engine APIs. It is contract/static-only. It does not implement
adapter modules, add Railway client code, add API routes, call Railway, call
Firestore, mutate data, migrate data, run ingestion, run backtests, seed
hypotheses, enable Pick 4 forecasts, add states, or integrate Sweet404Peaches
code.

The adapter layer will eventually let `planetary-overlays` consume bounded
Railway summaries, job status, coverage, forecast candidate explanations, and
convergence outputs while keeping Firestore limited to lightweight app state.

## What The Adapter May Call Later

Future adapters may call these Railway endpoint families after an explicit
implementation phase:

- `/status`
- `/coverage`
- `/evidence/summary`
- `/forecast/candidates`
- `/forecast/explain`
- `/jobs/{job_id}`
- `/backtest/{backtest_run_id}`
- `/convergence/run`
- `/convergence/{convergence_run_id}`
- `/dream-window/backtest`
- `/artifacts/{artifact_id}`
- `/snapshots/{snapshot_id}`

Every heavy call must be bounded by jurisdiction, game, and date window.

## What The Adapter Must Not Do

- Must not call Railway while adapters are disabled.
- Must not call Firestore as a fallback for heavy research scans.
- Must not expose raw evidence scans to UI pages.
- Must not silently replace live data with hardcoded evidence.
- Must not generate forecasts.
- Must not enable Pick 4 forecasts.
- Must not add states or widen research scope without explicit governance.
- Must not run ingestion, backtests, or convergence jobs without the required
  idempotency key and governance phase.

## Future Module Boundaries

These paths are documentation-only in Phase 7D. Do not create them until an
explicit implementation phase.

- `src/lib/fourPillars/railway/client.ts`
  - Low-level Railway HTTP client, headers, timeout, and response envelope parser.

- `src/lib/fourPillars/railway/types.ts`
  - Shared request envelopes, response envelopes, scopes, versions, pagination,
    artifacts, snapshots, and endpoint DTOs.

- `src/lib/fourPillars/railway/errors.ts`
  - Normalized adapter error type and Railway error mapping.

- `src/lib/fourPillars/railway/adapters/coverage.ts`
  - Future `/coverage` adapter for coverage dashboards.

- `src/lib/fourPillars/railway/adapters/evidenceSummary.ts`
  - Future `/evidence/summary` adapter for evidence archive and research
    dashboards.

- `src/lib/fourPillars/railway/adapters/forecastCandidates.ts`
  - Future `/forecast/candidates` adapter for governed forecast candidate views.

- `src/lib/fourPillars/railway/adapters/forecastExplain.ts`
  - Future `/forecast/explain` adapter for forecast explanation views.

- `src/lib/fourPillars/railway/adapters/jobs.ts`
  - Future `/jobs/{job_id}` adapter for async job status.

- `src/lib/fourPillars/railway/adapters/convergence.ts`
  - Future `/convergence/run` and `/convergence/{convergence_run_id}` adapter.

- `src/lib/fourPillars/railway/adapters/dreamWindowBacktest.ts`
  - Future `/dream-window/backtest` adapter after bridge governance.

## Environment Variables

These are future documented variables only. Phase 7D does not read them.

- `RAILWAY_ENGINE_BASE_URL`
- `RAILWAY_ENGINE_API_TOKEN`
- `FOUR_PILLARS_CLIENT_ID`
- `FOUR_PILLARS_ENGINE_CONTRACT_VERSION`
- `FOUR_PILLARS_DEFAULT_DATA_SNAPSHOT_ID`
- `FOUR_PILLARS_ENABLE_RAILWAY_ADAPTERS=false`

Adapters must remain disabled by default until a later explicit implementation
phase changes the flag and adds tested client code.

## Auth And Header Handling

Future adapter calls should construct headers from Phase 7C:

- `Authorization: Bearer <ENGINE_API_TOKEN>`
- `X-Four-Pillars-Client: <FOUR_PILLARS_CLIENT_ID>`
- `X-Request-Id`
- `X-Idempotency-Key` for job-creating endpoints
- `X-Data-Snapshot-Id` when relevant
- `X-Engine-Version` when relevant
- `Content-Type: application/json`
- `Accept: application/json`

Request IDs must be preserved in UI debug output and error states.

## Typed Request And Response Boundaries

Future adapter types should separate Railway DTOs from app-shell view models.

Recommended type groups:

- `EngineScope`
- `EngineVersions`
- `EngineRequestEnvelope<TParams>`
- `EngineResponseEnvelope<TData>`
- `EnginePagination`
- `EngineArtifactRef`
- `EngineSnapshotRef`
- `EngineError`
- endpoint-specific DTOs
- UI-specific summary view models

Typing rules:

- `result_padded` remains a string.
- Digit values remain strings or nullable strings.
- Snapshot/version fields are explicit.
- Raw endpoint DTOs are normalized before reaching UI components.
- UI components receive bounded summaries, not raw scan results.

## Error Handling

The future adapter should normalize errors and expose honest app states.

Rules:

- Show an engine unavailable/error state when Railway fails.
- Never substitute hardcoded evidence as live data.
- Distinguish `live`, `cached`, `snapshot`, and `error` states.
- Preserve `request_id` in UI/debug output.
- Retry only when `retryable` is `true`.
- Use bounded retry with backoff and jitter.
- Do not retry job creation with a new idempotency key.
- Distinguish "no evidence" from "engine unavailable."

## Caching And Snapshot Strategy

The app shell may cache bounded summaries only.

Rules:

- Cache keys include endpoint, scope, versions, and `data_snapshot_id`.
- Every cached summary must display `data_snapshot_id` and `generated_at`.
- Cache must not become the source of truth.
- Manual refresh asks Railway for a new bounded summary.
- Firebase may store lightweight cached summary pointers only.
- Do not cache mutation/job creation responses without idempotency metadata.
- Do not mix data from multiple snapshots in one UI summary.

## Firebase Reduced Role

Firebase may keep:

- user preferences
- saved views
- lightweight cached summary pointers
- review notes
- governance decisions
- Railway `job_id`, `run_id`, `snapshot_id`, `summary_id`, and `artifact_id`
  pointers

Firebase must not keep:

- raw all-state historical draw mirrors
- raw evidence scans
- full backtest outputs
- full convergence outputs
- analytical datasets that belong in Railway

## Governance Boundaries

Forecast governance remains protected by the app shell before any future Railway
call.

- Pick 4 forecasts remain disabled until explicit governance approval.
- Research games and forecast-enabled games must be separate allowlists.
- `/forecast/candidates` is not forecast generation.
- `/forecast/explain` is not forecast approval.
- Adapter methods must carry `forecast_policy` in view models.
- Blocked forecast requests should fail locally with a governance error before
  any engine call.

## Sweet404Peaches Bridge Compatibility

Sweet404Peaches can later use the same adapter pattern for convergence and
dream-window workflows.

Future compatible endpoint families:

- `/convergence/run`
- `/convergence/{convergence_run_id}`
- `/dream-window/backtest`
- `/artifacts/{artifact_id}`
- `/snapshots/{snapshot_id}`

Compatibility rules:

- Sweet404Peaches references Railway `draw_id`, `game_id`, `jurisdiction_id`,
  `dream_window_id`, `data_snapshot_id`, and version fields.
- Sweet404Peaches should call Railway for hit scans and convergence.
- Sweet404Peaches should not store duplicate lottery history.
- Bridge workflows require explicit governance before live adapter calls.

No Sweet404Peaches code integration is part of Phase 7D.

## Migration Sequence

- Phase 7D adapter contract
- Phase 7E Sweet404Peaches bridge contract
- Phase 7F historical migration dry-run contract
- Phase 7G adapter implementation scaffold
- Phase 7H first read-only Railway status adapter
- Phase 7I evidence summary adapter pilot
- Phase 7J forecast candidate adapter pilot

## Guardrails

- Contract/static-only.
- Adapters disabled by default.
- No Railway calls from static pages.
- No Firestore reads added.
- No live Railway client code.
- No functional API routes.
- No adapter implementation.
- No migrations.
- No sync or ingestion.
- No backtests.
- No hypothesis seeding.
- No forecasts enabled.
- No new states.
- No Sweet404Peaches code integration.
