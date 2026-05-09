# Phase 7C Railway Engine API Contract

## Purpose

Phase 7C defines the HTTP API contract for the Railway research engine. It is
contract-only. It does not implement Railway client code, add app API routes, call
Railway, call Firestore, mutate data, migrate data, run ingestion, run backtests,
seed hypotheses, enable Pick 4 forecasts, add states, or integrate
Sweet404Peaches code.

The contract sits on top of:

- Phase 7A Railway-first research architecture
- Phase 7B Railway engine schema and storage contract

Railway remains the canonical heavy historical research engine.
`planetary-overlays` remains the app shell, research console, dashboard, and
forecast governance UI.

## API Principles

- Heavy research endpoints must be bounded by jurisdiction, game, and date window.
- Lottery results are identifiers, not numbers.
- Leading-zero results must remain strings in requests, responses, artifacts, and
  UI payloads.
- Async job endpoints must be idempotent.
- Backtests and convergence runs must be reproducible by snapshot and version
  fields.
- `planetary-overlays` should consume bounded summaries, job status, explanations,
  and artifact pointers instead of raw analytical scans.
- Firebase should store only lightweight summaries, review notes, preferences, and
  Railway pointers.
- Sweet404Peaches should call Railway for hit scans and convergence instead of
  storing duplicate lottery history.

## Required Headers

All requests:

- `Authorization: Bearer <ENGINE_API_TOKEN>`
- `X-Four-Pillars-Client: planetary-overlays | sweet404peaches | internal-research`
- `X-Request-Id: <client-generated-request-id>`
- `Accept: application/json`

JSON requests:

- `Content-Type: application/json`

Job-creating or mutation-like requests:

- `X-Idempotency-Key: <stable-client-key>`

Snapshot/version-scoped requests when relevant:

- `X-Data-Snapshot-Id: <snapshot-id>`
- `X-Engine-Version: <engine-version>`

## Standard Request Envelope

POST endpoints should use this envelope:

```json
{
  "request_id": "req_20260509_001",
  "scope": {
    "jurisdiction_ids": ["ny"],
    "game_ids": ["ny_pick3"],
    "date_from": "2024-01-01",
    "date_to": "2024-03-31",
    "draw_labels": ["midday", "evening"]
  },
  "versions": {
    "schema_version": "1.0.0",
    "engine_version": "1.0.0",
    "data_snapshot_id": "snapshot_ny_pick3_2024q1_v1",
    "rule_version": "1.0.0",
    "overlay_version": "1.0.0",
    "symbolic_version": "1.0.0"
  },
  "params": {}
}
```

GET endpoints should carry equivalent fields as query parameters or headers.

## Standard Response Envelope

Every response should use the same top-level shape:

```json
{
  "ok": true,
  "request_id": "req_20260509_001",
  "meta": {
    "engine_version": "1.0.0",
    "schema_version": "1.0.0",
    "data_snapshot_id": "snapshot_ny_pick3_2024q1_v1",
    "generated_at": "2026-05-09T00:00:00.000Z"
  },
  "data": {},
  "pagination": null,
  "warnings": [],
  "error": null
}
```

Required response fields:

- `ok`
- `request_id`
- `meta.engine_version`
- `meta.schema_version`
- `meta.data_snapshot_id`
- `meta.generated_at`
- `data`
- `pagination`
- `warnings`
- `error`

## Pagination

Large list endpoints should use cursor pagination:

Request parameters:

- `limit`
- `cursor`

Response shape:

```json
{
  "pagination": {
    "limit": 100,
    "next_cursor": "cursor_abc",
    "has_more": true
  }
}
```

Bounded summary endpoints should return aggregates instead of forcing clients to
page through raw evidence rows.

## Idempotency

All mutation/job endpoints require `X-Idempotency-Key`.

Rules:

- Same key plus same normalized request body returns the existing job/run.
- Same key plus different normalized request body returns
  `IDEMPOTENCY_CONFLICT`.
- The response should include the relevant `job_id`, `backtest_run_id`, or
  `convergence_run_id`.
- Idempotency records should include request hash, created time, current status,
  and final response pointer where applicable.

## Async Job Contract

Async endpoints return immediately with job/run metadata:

```json
{
  "job_id": "job_123",
  "status": "queued",
  "submitted_at": "2026-05-09T00:00:00.000Z",
  "scope": {},
  "versions": {},
  "poll_url": "/jobs/job_123"
}
```

Statuses:

- `queued`
- `running`
- `completed`
- `failed`
- `cancelled`

Completed jobs should expose summaries and artifact references. Failed jobs
should expose the standard error shape.

## Artifact Reference Contract

Large outputs should be returned as artifact pointers:

```json
{
  "artifact_id": "artifact_123",
  "artifact_type": "evidence_jsonl",
  "path": "/artifacts/backtests/run_123/evidence.jsonl",
  "checksum_sha256": "...",
  "byte_size": 123456,
  "row_count": 1000,
  "schema_version": "1.0.0",
  "data_snapshot_id": "snapshot_123",
  "created_at": "2026-05-09T00:00:00.000Z"
}
```

Clients should render summaries first and request artifacts only for download,
audit, or reproducibility workflows.

## Error Shape

```json
{
  "ok": false,
  "request_id": "req_20260509_001",
  "meta": {
    "engine_version": "1.0.0",
    "schema_version": "1.0.0",
    "data_snapshot_id": null,
    "generated_at": "2026-05-09T00:00:00.000Z"
  },
  "data": null,
  "pagination": null,
  "warnings": [],
  "error": {
    "code": "INVALID_SCOPE",
    "message": "The requested game is outside the allowed scope.",
    "details": {},
    "retryable": false,
    "suggested_action": "Use a supported jurisdiction_id and game_id.",
    "request_id": "req_20260509_001"
  }
}
```

Required error fields:

- `code`
- `message`
- `details`
- `retryable`
- `suggested_action`
- `request_id`

Recommended error codes:

- `INVALID_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `INVALID_SCOPE`
- `UNSUPPORTED_JURISDICTION`
- `UNSUPPORTED_GAME`
- `INVALID_VERSION`
- `SNAPSHOT_NOT_FOUND`
- `IDEMPOTENCY_CONFLICT`
- `RATE_LIMITED`
- `JOB_NOT_FOUND`
- `ARTIFACT_NOT_FOUND`
- `ENGINE_UNAVAILABLE`
- `INTERNAL_ERROR`

## Rate Limits And Retry Guidance

- Retry only when `error.retryable` is `true`.
- Prefer exponential backoff with jitter.
- Respect `Retry-After` when present.
- Do not retry idempotent job submissions with a new idempotency key.
- Poll async jobs with bounded intervals.
- Use summary endpoints instead of raw scans for dashboards.

Suggested headers:

- `Retry-After`
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Snapshot And Version Requirements

Research outputs must be reproducible. Responses should include:

- `schema_version`
- `engine_version`
- `data_snapshot_id`
- `rule_version` when hypothesis logic is used
- `overlay_version` when celestial overlays are used
- `symbolic_version` when symbolic features are used
- `forecast_method_version` when forecast logic is used

Backtests and convergence runs must persist the full version set used to produce
their outputs.

## Endpoint Contracts

### `GET /status`

Purpose:

- Report engine health, version metadata, available modules, scheduler status, and
  current snapshot hints.

Major request params:

- none required

Major response fields:

- `status`
- `engine_version`
- `schema_version`
- `available_modules`
- `latest_snapshots`
- `scheduler_status`

Notes:

- Lightweight health endpoint.
- No pagination.

### `GET /coverage`

Purpose:

- Return draw coverage by jurisdiction, game, source, and date window.

Major request params:

- `jurisdiction_ids`
- `game_ids`
- `date_from`
- `date_to`
- `source_id`

Major response fields:

- `coverage`
- `missing_ranges`
- `conflict_count`
- `last_verified_at`
- `data_snapshot_id`

Notes:

- Must be bounded by jurisdiction/game/date window.
- May paginate by jurisdiction/game/source.

### `POST /draws/query`

Purpose:

- Query canonical draws without exposing app clients to database-specific scans.

Major request params:

- `scope.jurisdiction_ids`
- `scope.game_ids`
- `scope.date_from`
- `scope.date_to`
- `scope.draw_labels`
- `params.include_provenance`

Major response fields:

- `draws`
- `coverage_summary`
- `data_snapshot_id`

Notes:

- Paginated.
- `result_padded` and digit fields must remain strings.
- Must be bounded by jurisdiction/game/date window.

### `POST /overlays/build`

Purpose:

- Queue a bounded celestial overlay build job.

Major request params:

- `scope`
- `versions.overlay_version`
- `versions.engine_version`

Major response fields:

- `job_id`
- `status`
- `poll_url`
- `scope`
- `versions`

Notes:

- Async.
- Requires `X-Idempotency-Key`.
- Must be reproducible by version fields.

### `POST /features/build`

Purpose:

- Queue a bounded symbolic feature build job.

Major request params:

- `scope`
- `versions.symbolic_version`
- `versions.overlay_version`
- `versions.data_snapshot_id`

Major response fields:

- `job_id`
- `status`
- `poll_url`
- `scope`
- `versions`

Notes:

- Async.
- Requires `X-Idempotency-Key`.

### `GET /hypotheses`

Purpose:

- Query hypothesis registry records by game, jurisdiction, status, family, or
  governance state.

Major request params:

- `jurisdiction_ids`
- `game_ids`
- `status`
- `family`
- `governance_status`
- `rule_version`

Major response fields:

- `hypotheses`
- `counts_by_status`

Notes:

- Paginated.
- Should not imply forecast approval.

### `POST /backtest`

Purpose:

- Queue a bounded backtest job.

Major request params:

- `scope`
- `params.hypothesis_ids`
- `params.hypothesis_scope`
- `versions.rule_version`
- `versions.overlay_version`
- `versions.symbolic_version`
- `versions.data_snapshot_id`

Major response fields:

- `backtest_run_id`
- `job_id`
- `status`
- `poll_url`
- `scope`
- `versions`

Notes:

- Async.
- Requires `X-Idempotency-Key`.
- Must be bounded by jurisdiction/game/date window.
- Must be reproducible by snapshot/version fields.

### `GET /backtest/{backtest_run_id}`

Purpose:

- Return backtest run status, summary, errors, and artifact references.

Major request params:

- `backtest_run_id`

Major response fields:

- `backtest_run_id`
- `status`
- `scope`
- `versions`
- `records_processed`
- `records_failed`
- `summary`
- `artifacts`
- `error`

Notes:

- No raw evidence scan required for dashboard use.

### `GET /evidence/summary`

Purpose:

- Return pre-aggregated evidence summaries.

Major request params:

- `jurisdiction_ids`
- `game_ids`
- `date_from`
- `date_to`
- `hypothesis_ids`
- `rule_version`
- `data_snapshot_id`

Major response fields:

- `summary`
- `hypothesis_summaries`
- `support_count`
- `contradiction_count`
- `neutral_count`
- `inconclusive_count`
- `trigger_fired_count`
- `support_rate`

Notes:

- Preferred dashboard endpoint.
- Avoid raw evidence scans in `planetary-overlays`.

### `GET /forecast/candidates`

Purpose:

- Return evidence-backed forecast candidate signals for governed contexts.

Major request params:

- `jurisdiction_id`
- `game_id`
- `target_draw_date`
- `target_draw_label`
- `forecast_method_version`

Major response fields:

- `candidates`
- `source_hypotheses`
- `context_snapshot`
- `governance_status`

Notes:

- Pick 4 forecasts remain disabled unless later governance explicitly enables
  them.

### `GET /forecast/explain`

Purpose:

- Explain a forecast run or candidate decision chain.

Major request params:

- `forecast_id` or `candidate_id`

Major response fields:

- `context_snapshot`
- `decision_chain`
- `source_hypotheses`
- `evidence_summary`
- `versions`

Notes:

- Explanation endpoint only.
- Does not generate or approve forecasts.

### `POST /convergence/run`

Purpose:

- Queue a cross-pillar convergence run over historical, celestial, statistical,
  and dream/symbolic inputs.

Major request params:

- `scope`
- `params.dream_window_ids`
- `params.symbol_families`
- `versions`

Major response fields:

- `convergence_run_id`
- `job_id`
- `status`
- `poll_url`
- `scope`
- `versions`

Notes:

- Async.
- Requires `X-Idempotency-Key`.
- Must be reproducible by snapshot/version fields.

### `GET /convergence/{convergence_run_id}`

Purpose:

- Return convergence run status, summary, matched pillars, and artifact
  references.

Major request params:

- `convergence_run_id`

Major response fields:

- `convergence_run_id`
- `status`
- `scope`
- `summary`
- `matched_pillars`
- `artifacts`
- `versions`
- `error`

Notes:

- Used by `planetary-overlays` and future Sweet404Peaches bridge.

### `POST /dream-window/backtest`

Purpose:

- Queue historical testing of dream windows against canonical draws and derived
  research features.

Major request params:

- `scope`
- `params.dream_window_ids`
- `params.symbol_filters`
- `versions`

Major response fields:

- `job_id`
- `status`
- `poll_url`
- `scope`
- `versions`

Notes:

- Async.
- Requires `X-Idempotency-Key`.
- Sweet404Peaches should use Railway for this instead of storing lottery history.

### `GET /jobs/{job_id}`

Purpose:

- Return generic job status.

Major request params:

- `job_id`

Major response fields:

- `job_id`
- `job_type`
- `status`
- `scope`
- `records_processed`
- `records_failed`
- `artifacts`
- `error`

Notes:

- Optional support endpoint.
- Poll with bounded intervals.

### `GET /artifacts/{artifact_id}`

Purpose:

- Return artifact metadata and an authorized access reference.

Major request params:

- `artifact_id`

Major response fields:

- `artifact_id`
- `artifact_type`
- `path`
- `checksum_sha256`
- `byte_size`
- `row_count`
- `schema_version`
- `data_snapshot_id`
- `access_url` or `download_token`

Notes:

- Optional support endpoint.
- Clients should verify checksums for audit workflows.

### `GET /snapshots/{snapshot_id}`

Purpose:

- Return snapshot metadata and reproducibility context.

Major request params:

- `snapshot_id`

Major response fields:

- `snapshot_id`
- `scope`
- `versions`
- `source_counts`
- `checksum_summary`
- `created_at`

Notes:

- Optional support endpoint.
- Required for migration and reproducibility audits.

## planetary-overlays Adapter Guidance

`planetary-overlays` should use a bounded adapter layer:

- call `/status`, `/coverage`, `/evidence/summary`, job status, and explanation
  endpoints for UI pages
- store only lightweight summaries, review notes, governance actions, and Railway
  pointers in Firebase
- avoid raw evidence scans for server-rendered dashboards
- never use API contracts to bypass forecast governance

## Sweet404Peaches Future Bridge Compatibility

Sweet404Peaches should use:

- `/convergence/run`
- `/convergence/{convergence_run_id}`
- `/dream-window/backtest`
- `/draws/query` for bounded canonical references only
- `/artifacts/{artifact_id}` for audit exports

It should reference Railway `draw_id`, `game_id`, `jurisdiction_id`,
`dream_window_id`, `data_snapshot_id`, and version fields rather than storing
duplicate lottery history.

No Sweet404Peaches code integration is part of Phase 7C.

## API Guardrails

- No endpoint should silently coerce lottery results into numbers.
- Leading zeros must remain strings.
- All heavy endpoints must be bounded by jurisdiction/game/date window.
- All mutation/job endpoints require `X-Idempotency-Key`.
- Backtests and convergence runs must be reproducible by snapshot/version fields.
- Pick 4 forecasts remain disabled unless explicit governance later enables them.
- `planetary-overlays` should call bounded summary endpoints, not raw scans.
- Firebase should store only lightweight summaries and pointers.
- Sweet404Peaches should call Railway for hit scans and convergence instead of
  storing lottery history.
- Phase 7C adds no functional API routes, Railway clients, data mutation, or
  engine implementation.
