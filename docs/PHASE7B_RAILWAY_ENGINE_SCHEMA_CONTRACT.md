# Phase 7B Railway Engine Schema Contract

## Purpose

Phase 7B defines the storage and schema contract for the Railway research engine.
It is contract-only. It does not implement database migrations, sync data, call
Railway, call Firestore, seed hypotheses, run backtests, add states, or enable
Pick 4 forecasts.

Phase 7A established that Railway `lottery-engine` is the canonical heavy
historical research engine and that `planetary-overlays` is the app shell,
research console, dashboard, and forecast governance UI. Phase 7B makes that
boundary concrete by naming IDs, tables, required fields, query patterns,
artifacts, and versioning rules.

## Canonical ID Conventions

IDs must be deterministic where the same real-world record can be observed again.
They must preserve current Four Pillars naming where practical.

- `jurisdiction_id`
  - Lowercase jurisdiction code such as `ny`.
  - Future all-state expansion uses the same form, for example `ca` or `tx`.

- `game_type`
  - Engine-level game family such as `pick3` or `pick4`.

- `game_id`
  - `{jurisdiction_id}_{game_type}`, for example `ny_pick3` or `ny_pick4`.

- `draw_label`
  - Canonical period label: `midday`, `evening`, `night`, or `default`.

- `draw_id`
  - `{jurisdiction_id}_{game_type}_{YYYY-MM-DD}_{draw_label}`.
  - Example: `ny_pick4_2024-01-01_evening`.

- `overlay_id`
  - `{draw_id}_v{overlay_version}`.

- `feature_doc_id`
  - `{draw_id}_sym{symbolic_version}`.

- `hypothesis_id`
  - Stable slug controlled by the research registry.

- `evidence_id`
  - `{hypothesis_id}_{draw_id}_rv{rule_version}`.
  - This is the idempotency key for hypothesis evidence.

- `backtest_run_id`
  - Generated from game/window/hypothesis scope, version fields, and idempotency
    key, or assigned as a unique run ID with a separate idempotency key.

- `snapshot_id`
  - Stable data snapshot identifier for a bounded scope and version set.

- `artifact_id`
  - Stable reference to an immutable Railway volume object.

- `dream_window_id`
  - Stable identifier for a dream/symbolic time window supplied by a future
    Sweet404Peaches bridge.

- `convergence_run_id`
  - Unique run ID for cross-pillar convergence analysis.

## Railway-Owned Tables And Resources

Railway owns queryable research tables and large immutable artifacts. The table
names below are contract names; Phase 7B does not create them.

### `jurisdictions`

Required fields:

- `jurisdiction_id`
- `display_name`
- `country_code`
- `timezone`
- `source_region_codes`
- `is_active`
- `created_at`
- `updated_at`

### `games`

Required fields:

- `game_id`
- `jurisdiction_id`
- `game_type`
- `display_name`
- `digit_count`
- `draw_labels`
- `schedule_version`
- `is_active`
- `created_at`
- `updated_at`

### `draws`

Required fields:

- `draw_id`
- `engine_record_id`
- `jurisdiction_id`
- `game_id`
- `game_type`
- `draw_date`
- `draw_label`
- `draw_datetime_local`
- `draw_datetime_utc`
- `timezone`
- `result_padded`
- `numbers`
- `digit_1`
- `digit_2`
- `digit_3`
- `digit_4`
- `digit_sum`
- `digit_root`
- `source_ids`
- `primary_source_id`
- `provenance_count`
- `validation_status`
- `correction_version`
- `schedule_version`
- `data_snapshot_id`
- `created_at`
- `updated_at`

### `draw_coverage`

Required fields:

- `coverage_id`
- `jurisdiction_id`
- `game_id`
- `source_id`
- `date_from`
- `date_to`
- `draw_labels`
- `expected_draw_count`
- `observed_draw_count`
- `missing_draw_count`
- `conflict_count`
- `coverage_status`
- `last_verified_at`
- `data_snapshot_id`

### `celestial_overlays`

Required fields:

- `overlay_id`
- `draw_id`
- `jurisdiction_id`
- `game_id`
- `draw_date`
- `draw_label`
- `draw_datetime_utc`
- `overlay_version`
- `computation_version`
- `ephemeris_version`
- `zodiac_mode`
- `aspect_orb_rule_set`
- `time_confidence`
- `moon_phase_angle`
- `moon_phase_name`
- `moon_illumination_fraction`
- `is_waxing`
- `moon_ecliptic_longitude`
- `moon_sign`
- `sun_ecliptic_longitude`
- `sun_sign`
- `active_aspects`
- `computed_at`

### `symbolic_features`

Required fields:

- `feature_doc_id`
- `draw_id`
- `jurisdiction_id`
- `game_id`
- `draw_date`
- `draw_label`
- `symbolic_version`
- `overlay_version`
- `data_snapshot_id`
- `weekday_name`
- `weekday_index`
- `weekday_ruler`
- `month_number`
- `season`
- `moon_phase_name`
- `moon_phase_angle`
- `moon_sign`
- `sun_sign`
- `is_waxing`
- `moon_illumination_fraction`
- `digit_sum`
- `digit_root`
- `digit_1`
- `digit_2`
- `digit_3`
- `digit_4`
- `result_padded`
- `digit_1_vedic_planet`
- `digit_2_vedic_planet`
- `digit_3_vedic_planet`
- `digit_4_vedic_planet`
- `digit_sum_mod3`
- `digit_sum_mod9`
- `is_triple`
- `is_double`
- `is_fibonacci_result`

### `hypothesis_registry`

Required fields:

- `hypothesis_id`
- `title`
- `description`
- `jurisdiction_ids`
- `game_ids`
- `status`
- `family`
- `trigger_logic`
- `expected_logic`
- `rule_version`
- `created_by`
- `auto_generated`
- `forecast_approved`
- `governance_status`
- `created_at`
- `updated_at`

### `evidence_tracker`

Required fields:

- `evidence_id`
- `hypothesis_id`
- `draw_id`
- `jurisdiction_id`
- `game_id`
- `draw_date`
- `draw_label`
- `result`
- `trigger_met`
- `outcome_met`
- `trigger_snapshot`
- `outcome_snapshot`
- `rule_version`
- `overlay_version`
- `symbolic_version`
- `data_snapshot_id`
- `backtest_run_id`
- `recorded_at`

### `backtest_runs`

Required fields:

- `backtest_run_id`
- `idempotency_key`
- `jurisdiction_ids`
- `game_ids`
- `date_from`
- `date_to`
- `hypothesis_scope`
- `status`
- `rule_version`
- `overlay_version`
- `symbolic_version`
- `data_snapshot_id`
- `records_processed`
- `records_failed`
- `artifact_manifest_id`
- `error_summary`
- `created_at`
- `started_at`
- `completed_at`

### `forecast_candidates`

Required fields:

- `candidate_id`
- `jurisdiction_id`
- `game_id`
- `target_draw_date`
- `target_draw_label`
- `context_snapshot`
- `source_hypotheses`
- `candidate_value`
- `confidence_score`
- `governance_status`
- `rule_version`
- `overlay_version`
- `symbolic_version`
- `created_at`

### `forecast_runs`

Required fields:

- `forecast_id`
- `jurisdiction_id`
- `game_id`
- `target_draw_date`
- `target_draw_label`
- `status`
- `forecast_method_version`
- `rule_version`
- `overlay_version`
- `symbolic_version`
- `context_snapshot`
- `decision_chain`
- `candidates`
- `actual_draw_id`
- `actual_result`
- `outcome_summary`
- `generated_at`
- `resolved_at`

### `dream_windows`

Required fields:

- `dream_window_id`
- `source_app`
- `window_start`
- `window_end`
- `timezone`
- `symbol_taxonomy_version`
- `privacy_scope`
- `created_at`

### `dream_hits`

Required fields:

- `dream_hit_id`
- `dream_window_id`
- `source_app`
- `symbol_key`
- `symbol_label`
- `symbol_family`
- `confidence_score`
- `anonymized_subject_id`
- `recorded_at`

### `convergence_runs`

Required fields:

- `convergence_run_id`
- `dream_window_id`
- `jurisdiction_ids`
- `game_ids`
- `date_from`
- `date_to`
- `pillar_versions`
- `data_snapshot_id`
- `status`
- `summary`
- `artifact_manifest_id`
- `created_at`
- `completed_at`

## Indexes And Query Patterns

Railway indexes should support bounded queries and avoid app-side raw scans.

- `draws`
  - unique `draw_id`
  - unique `jurisdiction_id, game_id, draw_date, draw_label`
  - index `game_id, draw_date`
  - index `jurisdiction_id, game_type, draw_date`

- `draw_coverage`
  - index `jurisdiction_id, game_id, source_id`
  - index `coverage_status, last_verified_at`

- `celestial_overlays`
  - unique `overlay_id`
  - index `draw_id, overlay_version`
  - index `game_id, draw_date`

- `symbolic_features`
  - unique `feature_doc_id`
  - index `draw_id, symbolic_version`
  - index `game_id, draw_date`
  - index `moon_sign, moon_phase_name, game_id`

- `hypothesis_registry`
  - unique `hypothesis_id`
  - index `status, governance_status`
  - index `rule_version`
  - array or join support for `game_ids` and `jurisdiction_ids`

- `evidence_tracker`
  - unique `evidence_id`
  - index `game_id, draw_date, rule_version`
  - index `hypothesis_id, game_id, rule_version`
  - index `backtest_run_id`
  - index `data_snapshot_id`

- `backtest_runs`
  - index `status, created_at`
  - index `game_ids, date_from, date_to`
  - index `data_snapshot_id`

- `forecast_candidates`
  - index `game_id, target_draw_date, target_draw_label`
  - index `governance_status, created_at`

- `forecast_runs`
  - index `game_id, target_draw_date, target_draw_label`
  - index `status, generated_at`

- `dream_windows`, `dream_hits`, `convergence_runs`
  - index `dream_window_id`
  - index `source_app, window_start, window_end`
  - index `symbol_family`
  - index `data_snapshot_id`

## Leading-Zero Preservation Rules

Lottery results are identifiers, not numbers.

- Store `result_padded` as a string.
- Store `numbers` as an ordered string array.
- Store positional digits as nullable strings.
- Never coerce a result into a number for storage or display.
- Use `digit_count` from `games` to validate expected length.
- Preserve leading zeroes in artifacts, API responses, summaries, and UI payloads.
- Numeric derivations such as `digit_sum`, `digit_root`, and modulo fields must be
  derived from the string digits and stored separately.

## Versioning And Snapshot Fields

Derived records must include enough version metadata to explain and reproduce
research output.

Required version fields by domain:

- `schema_version`
- `engine_version`
- `data_snapshot_id`
- `mirror_version`
- `schedule_version`
- `overlay_version`
- `symbolic_version`
- `rule_version`
- `forecast_method_version`
- `ephemeris_version`
- `computation_version`
- `artifact_manifest_version`

Snapshot rules:

- A `data_snapshot_id` identifies the exact draw/source/coverage state used by
  derived records.
- Backtests must record the snapshot and all version fields used to produce
  evidence.
- Evidence rows are append-only for a given `evidence_id`.
- Corrections create new snapshot contexts instead of silently rewriting
  historical conclusions.

## Railway Volume And Artifact Paths

Railway database stores queryable state. Railway volume stores large immutable
artifacts.

Proposed paths:

- `/artifacts/backtests/{backtest_run_id}/manifest.json`
- `/artifacts/backtests/{backtest_run_id}/evidence.jsonl`
- `/artifacts/backtests/{backtest_run_id}/summary.json`
- `/artifacts/evidence/{snapshot_id}/evidence.parquet`
- `/artifacts/coverage/{snapshot_id}/coverage.json`
- `/artifacts/convergence/{convergence_run_id}/manifest.json`
- `/artifacts/convergence/{convergence_run_id}/matches.jsonl`
- `/artifacts/exports/{artifact_id}/payload.jsonl`

Each manifest should include:

- `artifact_id`
- `artifact_type`
- `path`
- `checksum_sha256`
- `byte_size`
- `row_count`
- `schema_version`
- `data_snapshot_id`
- `produced_by_run_id`
- `created_at`

## Migration-Readiness Rules

Phase 7B does not migrate data. It defines readiness gates for later migration.

- Every migrated draw must map to one canonical `draw_id`.
- Source counts must reconcile by jurisdiction, game, date window, and draw label.
- Leading-zero results must match before and after migration.
- Sample records must compare field-by-field against current app records.
- Artifact checksums and row counts must be generated before any cutover.
- Railway summaries must be compared against existing Firestore pilot summaries.
- App reads should move to summary/adapters only after contract validation.
- Firestore-heavy pages must not be expanded during migration.

## Firebase Reduced-Role Mapping

Firebase keeps product and governance state only:

- auth-linked user records
- preferences and saved views
- review notes
- governance decisions
- lightweight forecast summaries
- small admin annotations
- pointers to Railway `run_id`, `snapshot_id`, `summary_id`, and `artifact_id`

Firebase should not own:

- all-state historical draws
- full evidence history
- raw backtest outputs
- full convergence output
- large analytical summaries
- repeated server-rendered research scans

## All-State Pick 3 And Pick 4 Support

The schema supports all-state deep dives by making jurisdiction, game, draw date,
draw label, and version fields first-class. Railway can schedule heavy research
for Pick 3 and Pick 4 across many jurisdictions while `planetary-overlays`
continues to show bounded summaries and governance views.

All-state support in this contract does not add states to the app and does not
enable any new ingestion.

## Sweet404Peaches Compatibility

Sweet404Peaches can later integrate as the Dream / Symbolic Convergence pillar by
writing or reading `dream_windows`, `dream_hits`, and `convergence_runs`.

Compatibility rules:

- Sweet404Peaches references Railway `draw_id`, `game_id`, `jurisdiction_id`, and
  window IDs.
- It does not duplicate lottery history.
- Dream symbols use versioned taxonomies.
- Privacy scope is explicit on dream-window records.
- Convergence outputs are artifacts or summaries owned by Railway.

No Sweet404Peaches code integration is part of Phase 7B.

## Guardrails

- Contract/static-only.
- No Firestore reads added.
- No Railway calls.
- No API routes.
- No dynamic evidence pages.
- No migrations.
- No sync or ingestion.
- No backtests.
- No hypothesis seeding.
- No Pick 4 forecasts.
- No new states.
- No Sweet404Peaches code integration.
