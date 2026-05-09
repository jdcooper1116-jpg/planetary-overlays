export const dynamic = 'force-static';

const guardrails = [
  'Contract/static-only',
  'No Firestore reads',
  'No Railway calls',
  'No API routes',
  'No migrations',
  'No ingestion',
  'No backtests',
  'No Pick 4 forecasts',
  'No new states',
];

const idConventions = [
  ['jurisdiction_id', 'Lowercase jurisdiction code such as ny.'],
  ['game_id', 'jurisdiction_id plus game_type, such as ny_pick3 or ny_pick4.'],
  ['draw_id', 'jurisdiction_id, game_type, date, and draw_label.'],
  ['overlay_id', 'draw_id plus overlay_version.'],
  ['feature_doc_id', 'draw_id plus symbolic_version.'],
  ['evidence_id', 'hypothesis_id plus draw_id plus rule_version.'],
  ['snapshot_id', 'Stable identifier for a bounded data and version scope.'],
  ['artifact_id', 'Immutable Railway volume object reference.'],
];

const tables = [
  {
    name: 'jurisdictions',
    fields: 'jurisdiction_id, display_name, country_code, timezone, source_region_codes, is_active',
  },
  {
    name: 'games',
    fields: 'game_id, jurisdiction_id, game_type, display_name, digit_count, draw_labels, schedule_version',
  },
  {
    name: 'draws',
    fields: 'draw_id, jurisdiction_id, game_id, draw_date, draw_label, result_padded, numbers, digits, provenance, correction_version',
  },
  {
    name: 'draw_coverage',
    fields: 'coverage_id, jurisdiction_id, game_id, source_id, date range, expected/observed counts, gaps',
  },
  {
    name: 'celestial_overlays',
    fields: 'overlay_id, draw_id, overlay_version, moon fields, sun fields, computation metadata',
  },
  {
    name: 'symbolic_features',
    fields: 'feature_doc_id, draw_id, symbolic_version, calendar fields, digit fields, celestial-derived fields',
  },
  {
    name: 'hypothesis_registry',
    fields: 'hypothesis_id, title, game_ids, jurisdiction_ids, status, trigger_logic, expected_logic, governance fields',
  },
  {
    name: 'evidence_tracker',
    fields: 'evidence_id, hypothesis_id, draw_id, result, trigger/outcome fields, versions, snapshots',
  },
  {
    name: 'backtest_runs',
    fields: 'backtest_run_id, scope, status, versions, counts, artifact_manifest_id',
  },
  {
    name: 'forecast_candidates / forecast_runs',
    fields: 'candidate or forecast IDs, context, decision chain, source hypotheses, outcomes, governance status',
  },
  {
    name: 'dream_windows / dream_hits / convergence_runs',
    fields: 'dream windows, symbols, taxonomy versions, privacy scope, convergence artifacts',
  },
];

const queryPatterns = [
  'draws by jurisdiction_id, game_id, draw_date, draw_label',
  'coverage by jurisdiction_id, game_id, source_id',
  'overlays and features by draw_id plus version',
  'evidence by game_id, draw_date window, rule_version',
  'evidence by hypothesis_id, game_id, rule_version',
  'backtest runs by status, created_at, data_snapshot_id',
  'forecast records by game_id, target draw date, target draw label',
  'dream and convergence records by dream_window_id, symbol family, data_snapshot_id',
];

const artifactPaths = [
  '/artifacts/backtests/{backtest_run_id}/manifest.json',
  '/artifacts/backtests/{backtest_run_id}/evidence.jsonl',
  '/artifacts/evidence/{snapshot_id}/evidence.parquet',
  '/artifacts/coverage/{snapshot_id}/coverage.json',
  '/artifacts/convergence/{convergence_run_id}/manifest.json',
  '/artifacts/convergence/{convergence_run_id}/matches.jsonl',
];

const versionFields = [
  'schema_version',
  'engine_version',
  'data_snapshot_id',
  'mirror_version',
  'schedule_version',
  'overlay_version',
  'symbolic_version',
  'rule_version',
  'forecast_method_version',
  'ephemeris_version',
  'computation_version',
  'artifact_manifest_version',
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
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

export default function EngineSchemaContractPage() {
  return (
    <div className="max-w-6xl px-8 py-8">
      <header className="mb-8">
        <div className="mb-2 font-mono text-xs uppercase text-indigo-400">Phase 7B</div>
        <h1 className="mb-3 text-3xl font-bold text-gray-100">
          Railway Engine Schema Contract
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Static storage contract for Railway-owned Four Pillars research data,
          artifact storage, versioning, migration readiness, and app-shell boundaries.
        </p>
      </header>

      <TagList items={guardrails} />

      <Section title="Canonical ID Conventions">
        <div className="grid gap-3 md:grid-cols-2">
          {idConventions.map(([name, description]) => (
            <div key={name} className="rounded border border-gray-800 bg-gray-900 p-4">
              <div className="mb-1 font-mono text-sm text-indigo-300">{name}</div>
              <p className="text-sm leading-6 text-gray-400">{description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Railway-Owned Tables And Required Fields">
        <div className="space-y-3">
          {tables.map((table) => (
            <div key={table.name} className="rounded border border-gray-800 bg-gray-900 p-4">
              <div className="mb-1 font-mono text-sm text-gray-100">{table.name}</div>
              <p className="text-sm leading-6 text-gray-400">{table.fields}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Indexes And Query Patterns">
        <ul className="grid gap-2 md:grid-cols-2">
          {queryPatterns.map((pattern) => (
            <li key={pattern} className="rounded border border-gray-800 bg-gray-900 p-3 text-sm text-gray-300">
              {pattern}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Leading-Zero Preservation">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Lottery results are identifiers, not numbers. Store `result_padded` as a
          string, preserve `numbers` as ordered string digits, keep positional digits
          as nullable strings, and derive numeric fields separately.
        </p>
      </Section>

      <Section title="Versioning And Snapshots">
        <TagList items={versionFields} />
      </Section>

      <Section title="Railway Volume Artifact Paths">
        <div className="grid gap-2 md:grid-cols-2">
          {artifactPaths.map((path) => (
            <div key={path} className="rounded border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-sm text-gray-300">
              {path}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Migration Readiness">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Later migrations must reconcile counts by jurisdiction, game, date window,
          and draw label; compare sample records field-by-field; verify leading-zero
          results; generate artifact checksums; and keep app reads on bounded summaries.
        </p>
      </Section>

      <Section title="Firebase Reduced Role">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Firebase keeps auth-linked records, preferences, saved views, review notes,
          governance decisions, lightweight summaries, and pointers to Railway run,
          snapshot, summary, or artifact IDs. It does not own full historical draws,
          evidence history, raw backtest output, or all-state analytical summaries.
        </p>
      </Section>

      <Section title="Sweet404Peaches Compatibility">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Sweet404Peaches can later integrate through dream windows, dream hits, and
          convergence runs that reference Railway canonical draw, game, jurisdiction,
          and window IDs. Phase 7B adds no Sweet404Peaches code integration.
        </p>
      </Section>

      <Section title="Static Page Contract">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          This page is static reference content. It does not call Firestore, Railway,
          internal APIs, ingestion jobs, backtests, forecast generation, or migration
          code.
        </p>
      </Section>
    </div>
  );
}
