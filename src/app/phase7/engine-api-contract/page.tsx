export const dynamic = 'force-static';

const guardrails = [
  'Contract/static-only',
  'No Firestore reads',
  'No Railway calls',
  'No API routes',
  'No engine implementation',
  'No migrations',
  'No backtests',
  'No Pick 4 forecasts',
  'No new states',
];

const headers = [
  'Authorization: Bearer <ENGINE_API_TOKEN>',
  'X-Four-Pillars-Client',
  'X-Request-Id',
  'X-Idempotency-Key',
  'X-Data-Snapshot-Id',
  'X-Engine-Version',
  'Content-Type: application/json',
  'Accept: application/json',
];

const responseFields = [
  'ok',
  'request_id',
  'meta.engine_version',
  'meta.schema_version',
  'meta.data_snapshot_id',
  'meta.generated_at',
  'data',
  'pagination',
  'warnings',
  'error',
];

const errorFields = [
  'code',
  'message',
  'details',
  'retryable',
  'suggested_action',
  'request_id',
];

const endpoints = [
  {
    method: 'GET',
    path: '/status',
    purpose: 'Engine health, module availability, scheduler state, and version metadata.',
    params: 'none required',
    response: 'status, engine_version, schema_version, available_modules, latest_snapshots',
    notes: 'Lightweight health endpoint.',
  },
  {
    method: 'GET',
    path: '/coverage',
    purpose: 'Draw coverage by jurisdiction, game, source, and date window.',
    params: 'jurisdiction_ids, game_ids, date_from, date_to, source_id',
    response: 'coverage, missing_ranges, conflict_count, last_verified_at, data_snapshot_id',
    notes: 'Bounded by jurisdiction/game/date window; may paginate by source.',
  },
  {
    method: 'POST',
    path: '/draws/query',
    purpose: 'Bounded canonical draw query.',
    params: 'scope, draw_labels, include_provenance',
    response: 'draws, coverage_summary, data_snapshot_id',
    notes: 'Paginated; result_padded and digits remain strings.',
  },
  {
    method: 'POST',
    path: '/overlays/build',
    purpose: 'Queue celestial overlay build job.',
    params: 'scope, overlay_version, engine_version',
    response: 'job_id, status, poll_url, scope, versions',
    notes: 'Async; requires X-Idempotency-Key.',
  },
  {
    method: 'POST',
    path: '/features/build',
    purpose: 'Queue symbolic feature build job.',
    params: 'scope, symbolic_version, overlay_version, data_snapshot_id',
    response: 'job_id, status, poll_url, scope, versions',
    notes: 'Async; requires X-Idempotency-Key.',
  },
  {
    method: 'GET',
    path: '/hypotheses',
    purpose: 'Query hypothesis registry records.',
    params: 'jurisdiction_ids, game_ids, status, family, governance_status, rule_version',
    response: 'hypotheses, counts_by_status',
    notes: 'Paginated; does not imply forecast approval.',
  },
  {
    method: 'POST',
    path: '/backtest',
    purpose: 'Queue bounded backtest job.',
    params: 'scope, hypothesis_ids, hypothesis_scope, rule/overlay/symbolic versions',
    response: 'backtest_run_id, job_id, status, poll_url, scope, versions',
    notes: 'Async; requires X-Idempotency-Key; reproducible by snapshot/version fields.',
  },
  {
    method: 'GET',
    path: '/backtest/{backtest_run_id}',
    purpose: 'Read backtest status, summary, errors, and artifacts.',
    params: 'backtest_run_id',
    response: 'backtest_run_id, status, summary, records_processed, artifacts, error',
    notes: 'No raw evidence scan required for dashboards.',
  },
  {
    method: 'GET',
    path: '/evidence/summary',
    purpose: 'Pre-aggregated evidence summaries.',
    params: 'jurisdiction_ids, game_ids, date window, hypothesis_ids, rule_version',
    response: 'summary, hypothesis_summaries, support counts, trigger_fired_count, support_rate',
    notes: 'Preferred dashboard endpoint; avoids raw evidence scans.',
  },
  {
    method: 'GET',
    path: '/forecast/candidates',
    purpose: 'Evidence-backed forecast candidate signals for governed contexts.',
    params: 'jurisdiction_id, game_id, target_draw_date, target_draw_label',
    response: 'candidates, source_hypotheses, context_snapshot, governance_status',
    notes: 'Pick 4 forecasts remain disabled unless later governance enables them.',
  },
  {
    method: 'GET',
    path: '/forecast/explain',
    purpose: 'Explain forecast or candidate decision chains.',
    params: 'forecast_id or candidate_id',
    response: 'context_snapshot, decision_chain, source_hypotheses, evidence_summary, versions',
    notes: 'Explanation only; does not generate or approve forecasts.',
  },
  {
    method: 'POST',
    path: '/convergence/run',
    purpose: 'Queue cross-pillar convergence run.',
    params: 'scope, dream_window_ids, symbol_families, versions',
    response: 'convergence_run_id, job_id, status, poll_url, scope, versions',
    notes: 'Async; requires X-Idempotency-Key; reproducible by snapshot/version fields.',
  },
  {
    method: 'GET',
    path: '/convergence/{convergence_run_id}',
    purpose: 'Read convergence run summary and artifacts.',
    params: 'convergence_run_id',
    response: 'convergence_run_id, status, summary, matched_pillars, artifacts, versions',
    notes: 'Supports planetary-overlays and future Sweet404Peaches bridge.',
  },
  {
    method: 'POST',
    path: '/dream-window/backtest',
    purpose: 'Queue dream-window historical test.',
    params: 'scope, dream_window_ids, symbol_filters, versions',
    response: 'job_id, status, poll_url, scope, versions',
    notes: 'Async; requires X-Idempotency-Key.',
  },
  {
    method: 'GET',
    path: '/jobs/{job_id}',
    purpose: 'Generic job status.',
    params: 'job_id',
    response: 'job_id, job_type, status, records_processed, records_failed, artifacts, error',
    notes: 'Optional support endpoint; poll with bounded intervals.',
  },
  {
    method: 'GET',
    path: '/artifacts/{artifact_id}',
    purpose: 'Artifact metadata and access reference.',
    params: 'artifact_id',
    response: 'artifact_id, artifact_type, path, checksum_sha256, row_count, access reference',
    notes: 'Optional support endpoint; verify checksums for audit workflows.',
  },
  {
    method: 'GET',
    path: '/snapshots/{snapshot_id}',
    purpose: 'Snapshot metadata and reproducibility context.',
    params: 'snapshot_id',
    response: 'snapshot_id, scope, versions, source_counts, checksum_summary, created_at',
    notes: 'Optional support endpoint for migration and reproducibility audits.',
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-gray-800 py-8">
      <h2 className="mb-4 text-xl font-semibold text-gray-100">{title}</h2>
      {children}
    </section>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded border border-gray-700 bg-gray-900 px-2.5 py-1 font-mono text-xs text-gray-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default function EngineApiContractPage() {
  return (
    <div className="max-w-6xl px-8 py-8">
      <header className="mb-8">
        <div className="mb-2 font-mono text-xs uppercase text-indigo-400">Phase 7C</div>
        <h1 className="mb-3 text-3xl font-bold text-gray-100">
          Railway Engine API Contract
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Static contract for Railway research-engine request envelopes, response
          envelopes, auth headers, idempotency, async jobs, artifacts, endpoint
          shapes, errors, and app-shell integration boundaries.
        </p>
      </header>

      <TagList items={guardrails} />

      <Section title="Required Headers">
        <TagList items={headers} />
      </Section>

      <Section title="Standard Request Envelope">
        <div className="rounded border border-gray-800 bg-gray-900 p-4 font-mono text-xs leading-6 text-gray-300">
          request_id, scope, versions, params. Heavy scopes include jurisdiction_ids,
          game_ids, date_from, date_to, and optional draw_labels.
        </div>
      </Section>

      <Section title="Standard Response Envelope">
        <TagList items={responseFields} />
      </Section>

      <Section title="Error Shape">
        <TagList items={errorFields} />
      </Section>

      <Section title="Pagination And Idempotency">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">Pagination</h3>
            <p className="text-sm leading-6 text-gray-400">
              Large lists use cursor pagination with limit, cursor, next_cursor, and
              has_more. Summary endpoints should return aggregates instead of raw scans.
            </p>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">Idempotency</h3>
            <p className="text-sm leading-6 text-gray-400">
              Job-creating endpoints require X-Idempotency-Key. Same key plus same
              normalized request returns the existing job; mismatched bodies return an
              idempotency conflict.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Endpoint Contracts">
        <div className="space-y-3">
          {endpoints.map((endpoint) => (
            <article key={`${endpoint.method} ${endpoint.path}`} className="rounded border border-gray-800 bg-gray-900 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded border border-indigo-800/50 bg-indigo-950/30 px-2 py-1 font-mono text-xs text-indigo-200">
                  {endpoint.method}
                </span>
                <span className="font-mono text-sm text-gray-100">{endpoint.path}</span>
              </div>
              <p className="mb-3 text-sm leading-6 text-gray-400">{endpoint.purpose}</p>
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div>
                  <div className="mb-1 font-mono text-xs text-gray-600">major request params</div>
                  <p className="leading-6 text-gray-400">{endpoint.params}</p>
                </div>
                <div>
                  <div className="mb-1 font-mono text-xs text-gray-600">major response fields</div>
                  <p className="leading-6 text-gray-400">{endpoint.response}</p>
                </div>
                <div>
                  <div className="mb-1 font-mono text-xs text-gray-600">notes</div>
                  <p className="leading-6 text-gray-400">{endpoint.notes}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Async Jobs And Artifacts">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">Async job contract</h3>
            <p className="text-sm leading-6 text-gray-400">
              Job responses include job_id or run_id, status, submitted_at, scope,
              versions, and poll_url. Status values are queued, running, completed,
              failed, and cancelled.
            </p>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">Artifact reference</h3>
            <p className="text-sm leading-6 text-gray-400">
              Large outputs return artifact_id, artifact_type, path, checksum_sha256,
              byte_size, row_count, schema_version, data_snapshot_id, and created_at.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Rate Limit And Retry Guidance">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Retry only when retryable is true, use exponential backoff with jitter,
          respect Retry-After, keep the same idempotency key for retried job
          submissions, and poll async jobs with bounded intervals.
        </p>
      </Section>

      <Section title="Snapshot And Version Requirements">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Backtests and convergence runs must persist schema_version, engine_version,
          data_snapshot_id, rule_version, overlay_version, symbolic_version, and any
          forecast or computation versions used to produce output.
        </p>
      </Section>

      <Section title="Adapter And Bridge Guidance">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">planetary-overlays</h3>
            <p className="text-sm leading-6 text-gray-400">
              Use bounded summary, job status, coverage, and explanation endpoints.
              Store lightweight Firebase summaries and Railway pointers only.
            </p>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">Sweet404Peaches</h3>
            <p className="text-sm leading-6 text-gray-400">
              Future bridge uses convergence and dream-window endpoints with Railway
              canonical draw IDs, game IDs, jurisdiction IDs, snapshots, and versions.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Static Page Contract">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          This page is static reference content. It does not call Firestore, Railway,
          internal APIs, dynamic data sources, ingestion jobs, backtests, forecast
          generation, or migration code.
        </p>
      </Section>
    </div>
  );
}
