export const dynamic = 'force-static';

const guardrails = [
  'Contract/static-only',
  'Adapters disabled by default',
  'No Firestore reads',
  'No Railway calls',
  'No API routes',
  'No adapter implementation',
  'No forecasts enabled',
  'No new states',
  'Sweet404Peaches documented only',
];

const futureModules = [
  'src/lib/fourPillars/railway/client.ts',
  'src/lib/fourPillars/railway/types.ts',
  'src/lib/fourPillars/railway/errors.ts',
  'src/lib/fourPillars/railway/adapters/coverage.ts',
  'src/lib/fourPillars/railway/adapters/evidenceSummary.ts',
  'src/lib/fourPillars/railway/adapters/forecastCandidates.ts',
  'src/lib/fourPillars/railway/adapters/forecastExplain.ts',
  'src/lib/fourPillars/railway/adapters/jobs.ts',
  'src/lib/fourPillars/railway/adapters/convergence.ts',
  'src/lib/fourPillars/railway/adapters/dreamWindowBacktest.ts',
];

const envVars = [
  'RAILWAY_ENGINE_BASE_URL',
  'RAILWAY_ENGINE_API_TOKEN',
  'FOUR_PILLARS_CLIENT_ID',
  'FOUR_PILLARS_ENGINE_CONTRACT_VERSION',
  'FOUR_PILLARS_DEFAULT_DATA_SNAPSHOT_ID',
  'FOUR_PILLARS_ENABLE_RAILWAY_ADAPTERS=false',
];

const allowedEndpointFamilies = [
  '/coverage',
  '/evidence/summary',
  '/forecast/candidates',
  '/forecast/explain',
  '/jobs/{job_id}',
  '/backtest/{backtest_run_id}',
  '/convergence/run',
  '/convergence/{convergence_run_id}',
  '/dream-window/backtest',
  '/artifacts/{artifact_id}',
  '/snapshots/{snapshot_id}',
];

const migration = [
  'Phase 7D adapter contract',
  'Phase 7E Sweet404Peaches bridge contract',
  'Phase 7F historical migration dry-run contract',
  'Phase 7G adapter implementation scaffold',
  'Phase 7H first read-only Railway status adapter',
  'Phase 7I evidence summary adapter pilot',
  'Phase 7J forecast candidate adapter pilot',
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

export default function AppShellAdapterContractPage() {
  return (
    <div className="max-w-6xl px-8 py-8">
      <header className="mb-8">
        <div className="mb-2 font-mono text-xs uppercase text-indigo-400">Phase 7D</div>
        <h1 className="mb-3 text-3xl font-bold text-gray-100">
          App-Shell Railway Adapter Contract
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Static contract for the future planetary-overlays adapter layer that will
          consume bounded Railway summaries, job status, forecast explanations, and
          convergence outputs while keeping Firebase lightweight.
        </p>
      </header>

      <TagList items={guardrails} />

      <Section title="Adapter Purpose">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          The adapter layer will isolate Railway API details from dashboard and
          governance UI. It will normalize request envelopes, response envelopes,
          errors, snapshots, and view models before data reaches app-shell pages.
        </p>
      </Section>

      <Section title="Future Modules">
        <div className="grid gap-2 md:grid-cols-2">
          {futureModules.map((modulePath) => (
            <div
              key={modulePath}
              className="rounded border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-sm text-gray-300"
            >
              {modulePath}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Environment Variables">
        <TagList items={envVars} />
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
          Phase 7D documents these only. No code reads them in this phase, and
          adapters remain disabled by default.
        </p>
      </Section>

      <Section title="Allowed Endpoint Families">
        <div className="grid gap-2 md:grid-cols-3">
          {allowedEndpointFamilies.map((endpoint) => (
            <div
              key={endpoint}
              className="rounded border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-sm text-gray-300"
            >
              {endpoint}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Error Strategy">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">Honest states</h3>
            <p className="text-sm leading-6 text-gray-400">
              UI should distinguish live, cached, snapshot, and error states. It must
              preserve request_id in debug output and never substitute hardcoded
              evidence as live data.
            </p>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">Retry rules</h3>
            <p className="text-sm leading-6 text-gray-400">
              Retry only when retryable is true, use bounded backoff with jitter, and
              never retry job creation with a new idempotency key.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Caching And Snapshot Strategy">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          The app shell may cache bounded summaries by endpoint, scope, versions, and
          data_snapshot_id. Every cached summary must show data_snapshot_id and
          generated_at. Firebase may store lightweight cached summary pointers only;
          cache must not become the source of truth.
        </p>
      </Section>

      <Section title="Firebase Reduced Role">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Firebase remains limited to preferences, saved views, review notes,
          governance decisions, lightweight summary pointers, and Railway IDs. It
          must not store raw evidence scans, full backtest output, all-state draw
          mirrors, or full convergence output.
        </p>
      </Section>

      <Section title="Governance Boundaries">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Pick 4 forecasts remain disabled until explicit governance approval.
          Research games and forecast-enabled games must use separate allowlists.
          Forecast candidate and explanation endpoints do not generate or approve
          forecasts.
        </p>
      </Section>

      <Section title="Sweet404Peaches Compatibility">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Sweet404Peaches can later use the same adapter pattern for convergence and
          dream-window workflows, referencing Railway canonical draw IDs, game IDs,
          jurisdiction IDs, dream window IDs, snapshots, and versions. Phase 7D adds
          no bridge code.
        </p>
      </Section>

      <Section title="Migration Sequence">
        <ol className="space-y-2">
          {migration.map((item) => (
            <li key={item} className="rounded border border-gray-800 bg-gray-900 p-3 text-sm text-gray-300">
              {item}
            </li>
          ))}
        </ol>
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
