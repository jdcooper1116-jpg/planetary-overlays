import { readDualGameEvidenceWindowPlan } from '@/lib/fourPillars/planning/dualGameEvidenceWindowPlan';

export const revalidate = 0;

type Plan = Awaited<ReturnType<typeof readDualGameEvidenceWindowPlan>>;
type GameStatus = Plan['current_status'][number];

const BADGE_CLASS =
  'rounded border border-amber-800/50 bg-amber-950/30 px-2 py-1 text-xs font-mono text-amber-300';

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded bg-gray-800/50 p-2 text-center">
      <div className="font-mono text-sm font-bold tabular-nums text-gray-100">{value}</div>
      <div className="font-mono text-xs text-gray-700">{label}</div>
    </div>
  );
}

function GameStatusCard({ game }: { game: GameStatus }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs text-gray-600">{game.game_id}</div>
          <div className="text-sm font-semibold text-gray-100">{game.display_name}</div>
          <div className="mt-1 font-mono text-xs text-gray-700">
            {game.current_window.date_from} to {game.current_window.date_to}
          </div>
        </div>
        <div className="rounded border border-indigo-800/40 bg-indigo-950/30 px-3 py-2 font-mono text-xs text-indigo-200">
          {game.forecast_policy}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <Metric label="draws" value={game.draws_mirrored} />
        <Metric label="overlays" value={game.overlays_built} />
        <Metric label="features" value={game.symbolic_features_built} />
        <Metric label="hypotheses" value={game.hypotheses_seeded} />
        <Metric label="evidence" value={game.evidence_records} />
        <Metric label="forecasts" value={game.forecast_runs} />
      </div>
    </div>
  );
}

export default async function DualGameEvidencePlanPage() {
  const plan = await readDualGameEvidenceWindowPlan();

  return (
    <div className="max-w-6xl px-8 py-8">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-100">
          Dual-Game Evidence Window Plan
        </h1>
        <p className="text-sm text-gray-500">
          Read-only Phase 6L planning for the next shared NY Pick 3 and Pick 4 evidence window.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span className={BADGE_CLASS}>No data mutation in Phase 6L</span>
        <span className={BADGE_CLASS}>No new states</span>
        <span className={BADGE_CLASS}>Pick 4 forecasts disabled</span>
        <span className={BADGE_CLASS}>No approvals or promotions</span>
        <span className={BADGE_CLASS}>No new hypotheses seeded</span>
      </div>

      <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
        <div className="mb-2 font-mono text-xs text-gray-600">recommended_window</div>
        <div className="text-xl font-semibold text-gray-100">
          {plan.recommended_window.label}: {plan.recommended_window.date_from} to{' '}
          {plan.recommended_window.date_to}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Alternate: {plan.alternate_window.label}. {plan.alternate_window.reason_not_selected}
        </div>
        <ul className="mt-4 space-y-2 text-sm text-gray-400">
          {plan.recommendation_reason.map((reason) => (
            <li key={reason}>- {reason}</li>
          ))}
        </ul>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {plan.current_status.map((game) => (
          <GameStatusCard key={game.game_id} game={game} />
        ))}
      </div>

      <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-200">Phase 6M Job Sequence</h2>
        <div className="space-y-3">
          {plan.phase6m_job_sequence.map((step) => (
            <div key={step.order} className="rounded border border-gray-800 bg-gray-950/50 px-3 py-3">
              <div className="mb-1 font-mono text-xs text-indigo-300">
                {step.order}. {step.job} ({step.games.join(', ')})
              </div>
              <div className="text-sm text-gray-500">{step.notes}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-200">Hypotheses To Retest</h2>
          {Object.entries(plan.hypotheses_to_retest).map(([gameId, hypotheses]) => (
            <div key={gameId} className="mb-4 last:mb-0">
              <div className="mb-2 font-mono text-xs text-indigo-300">{gameId}</div>
              <ul className="space-y-1 text-sm text-gray-500">
                {hypotheses.map((hypothesis) => (
                  <li key={hypothesis}>- {hypothesis}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-200">Comparison Plan</h2>
          <ul className="space-y-2 text-sm text-gray-500">
            {plan.comparison_plan.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
