export const dynamic = 'force-static';

const guardrails = [
  'Architecture-only',
  'No Firestore reads',
  'No Railway calls',
  'No data migration',
  'No ingestion',
  'No backtests',
  'No Pick 4 forecasts',
  'No new states',
];

const pillars = [
  {
    title: 'Historical Draw Engine',
    body: 'Canonical draws, jurisdictions, games, coverage, corrections, provenance, and historical result windows.',
  },
  {
    title: 'Celestial / Mystical Overlay Engine',
    body: 'Moon phase, moon sign, sun sign, weekday ruler, planetary context, lunar windows, and versioned overlay calculations.',
  },
  {
    title: 'Statistical / Pattern Engine',
    body: 'Digit patterns, sums, roots, parity, repeats, positional behavior, baselines, hypothesis evidence, and backtest summaries.',
  },
  {
    title: 'Dream / Symbolic Convergence Engine',
    body: 'Dream windows, symbols, symbolic hits, convergence runs, and overlap with draw, celestial, and statistical evidence.',
  },
];

const railwayResources = [
  'draws',
  'jurisdictions',
  'games',
  'draw_coverage',
  'celestial_overlays',
  'symbolic_features',
  'hypothesis_registry',
  'evidence_tracker',
  'backtest_runs',
  'forecast_candidates',
  'forecast_runs',
  'dream_windows',
  'dream_hits',
  'convergence_runs',
];

const endpoints = [
  '/status',
  '/coverage',
  '/draws/query',
  '/overlays/build',
  '/features/build',
  '/hypotheses',
  '/backtest',
  '/evidence/summary',
  '/forecast/candidates',
  '/forecast/explain',
  '/convergence/run',
  '/dream-window/backtest',
];

const appLayers = [
  'User-facing Oracle / Forecast Studio',
  'Admin / Research Console',
  'Evidence Archive',
  'Celestial Weather',
  'Dream Convergence',
];

const phases = [
  ['Phase 7A architecture', 'Static plan, dashboard reference page, and guardrails.'],
  ['Phase 7B engine schema', 'Define Railway schema, resource naming, indexes, and artifact storage conventions.'],
  ['Phase 7C engine API contract', 'Specify request/response contracts, auth, pagination, idempotency, versions, and errors.'],
  ['Phase 7D app-shell adapter layer', 'Add bounded planetary-overlays adapters for Railway summaries.'],
  ['Phase 7E Sweet404Peaches bridge', 'Define dream-window and symbolic-hit contracts, then bridge through Railway.'],
  ['Phase 7F historical migration dry run', 'Validate counts, checksums, versions, and sample records before cutover.'],
  ['Phase 7G all-state research scheduler', 'Railway-owned scheduler with bounded windows, rate limits, observability, and recovery.'],
];

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-gray-800 py-8">
      {eyebrow ? <div className="mb-2 font-mono text-xs uppercase text-indigo-400">{eyebrow}</div> : null}
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

export default function RailwayResearchArchitecturePage() {
  return (
    <div className="max-w-6xl px-8 py-8">
      <header className="mb-8">
        <div className="mb-2 font-mono text-xs uppercase text-indigo-400">Phase 7A</div>
        <h1 className="mb-3 text-3xl font-bold text-gray-100">
          Railway Research Engine Architecture
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          Static architecture reference for moving heavy Four Pillars research work out
          of Firestore and into Railway as the canonical historical research engine.
        </p>
      </header>

      <TagList items={guardrails} />

      <Section title="Why Firestore Is No Longer The Analytical Database">
        <div className="grid gap-4 md:grid-cols-2">
          <p className="text-sm leading-6 text-gray-400">
            Firestore remains useful for product state, review notes, preferences, and
            lightweight records. Phase 6 showed that repeated historical evidence scans
            are a heavy analytical workload: wide date windows, many hypothesis/draw
            pairs, aggregate comparisons, and backtest outputs quickly multiply reads
            and writes.
          </p>
          <p className="text-sm leading-6 text-gray-400">
            The target design keeps Firestore away from large evidence history,
            historical draw mirrors at scale, full backtest outputs, and server-rendered
            pages that trigger broad analytical scans.
          </p>
        </div>
      </Section>

      <Section title="Target Responsibility Split">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">Railway lottery-engine</h3>
            <p className="text-sm leading-6 text-gray-400">
              Canonical historical research engine for draws, overlays, features,
              hypotheses, evidence, backtests, aggregate summaries, and convergence runs.
            </p>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">planetary-overlays</h3>
            <p className="text-sm leading-6 text-gray-400">
              App shell, dashboard, admin console, forecast governance surface, and
              bounded consumer of Railway summaries.
            </p>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">Firebase / Firestore</h3>
            <p className="text-sm leading-6 text-gray-400">
              Auth, preferences, lightweight saved summaries, review notes, governance
              decisions, and small user-facing records.
            </p>
          </div>
          <div className="rounded border border-gray-800 bg-gray-900 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">Sweet404Peaches</h3>
            <p className="text-sm leading-6 text-gray-400">
              Future Dream / Symbolic Convergence pillar that calls Railway APIs and
              shares canonical draw history instead of duplicating lottery data.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Four Pillars Convergence Model">
        <div className="grid gap-4 md:grid-cols-2">
          {pillars.map((pillar, index) => (
            <div key={pillar.title} className="rounded border border-gray-800 bg-gray-900 p-4">
              <div className="mb-2 font-mono text-xs text-gray-600">0{index + 1}</div>
              <h3 className="mb-2 text-sm font-semibold text-gray-100">{pillar.title}</h3>
              <p className="text-sm leading-6 text-gray-400">{pillar.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Railway Storage Responsibilities">
        <p className="mb-4 max-w-3xl text-sm leading-6 text-gray-400">
          Railway database should own queryable research data. Railway volume should
          hold larger artifacts such as exported evidence batches, JSONL or parquet
          snapshots, reproducibility manifests, and backtest artifact bundles.
        </p>
        <TagList items={railwayResources} />
      </Section>

      <Section title="Proposed Railway API Endpoints">
        <div className="grid gap-2 md:grid-cols-3">
          {endpoints.map((endpoint) => (
            <div
              key={endpoint}
              className="rounded border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-sm text-gray-300"
            >
              {endpoint}
            </div>
          ))}
        </div>
      </Section>

      <Section title="App Shell Layers">
        <div className="grid gap-3 md:grid-cols-5">
          {appLayers.map((layer) => (
            <div key={layer} className="rounded border border-gray-800 bg-gray-900 p-3 text-sm text-gray-300">
              {layer}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Migration Phases">
        <div className="space-y-3">
          {phases.map(([phase, detail]) => (
            <div key={phase} className="rounded border border-gray-800 bg-gray-900 p-4">
              <h3 className="mb-1 text-sm font-semibold text-gray-100">{phase}</h3>
              <p className="text-sm leading-6 text-gray-400">{detail}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Static Page Contract">
        <p className="max-w-3xl text-sm leading-6 text-gray-400">
          This page is static reference content. It does not call Firestore, Railway,
          internal APIs, ingestion jobs, backtests, forecast generation, or
          Sweet404Peaches integrations.
        </p>
      </Section>
    </div>
  );
}
