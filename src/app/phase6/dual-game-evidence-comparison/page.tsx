import { readDualGameEvidenceComparison } from '@/lib/fourPillars/readers/dualGameEvidenceComparisonReader';
import { NY_DUAL_GAME_JAN_MAR_2024_WINDOW_ID } from '@/lib/fourPillars/readers/pilotConstants';

export const revalidate = 0;

type Comparison = Awaited<ReturnType<typeof readDualGameEvidenceComparison>>;
type GameSummary = Comparison['games'][keyof Comparison['games']];

const BADGE_CLASS =
  'rounded border border-amber-800/50 bg-amber-950/30 px-2 py-1 text-xs font-mono text-amber-300';

function pct(value: number | null): string {
  return value === null ? '-' : `${Math.round(value * 100)}%`;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded bg-gray-800/50 p-2 text-center">
      <div className="font-mono text-sm font-bold tabular-nums text-gray-100">{value}</div>
      <div className="font-mono text-xs text-gray-700">{label}</div>
    </div>
  );
}

function HypothesisSummary({
  label,
  hypothesis,
}: {
  label: string;
  hypothesis: GameSummary['strongest_hypothesis'];
}) {
  return (
    <div className="rounded border border-gray-800 bg-gray-950/50 px-3 py-3">
      <div className="mb-1 font-mono text-xs text-gray-600">{label}</div>
      {hypothesis ? (
        <>
          <div className="font-mono text-xs text-indigo-300">{hypothesis.hypothesis_id}</div>
          <div className="mt-1 text-sm text-gray-300">{hypothesis.title ?? 'Untitled'}</div>
          <div className="mt-2 font-mono text-xs text-gray-600">
            support_rate {pct(hypothesis.support_rate)} / fired {hypothesis.trigger_fired_count}
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-700">No trigger-fired evidence.</div>
      )}
    </div>
  );
}

function GameCard({ summary }: { summary: GameSummary }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-xs text-gray-600">{summary.game_id}</div>
          <div className="text-sm font-semibold text-gray-100">{summary.display_name}</div>
          <div className="mt-1 font-mono text-xs text-gray-700">
            {summary.date_from} to {summary.date_to}
          </div>
        </div>
        <div className="rounded border border-indigo-800/40 bg-indigo-950/30 px-3 py-2 font-mono text-xs text-indigo-200">
          {summary.forecast_policy}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Metric label="evidence" value={summary.total_evidence_records} />
        <Metric label="hypotheses" value={summary.hypothesis_count} />
        <Metric label="support" value={summary.support_count} />
        <Metric label="contradict" value={summary.contradiction_count} />
        <Metric label="neutral" value={summary.neutral_count} />
        <Metric label="triggered" value={summary.trigger_fired_count} />
        <Metric label="support rate" value={pct(summary.support_rate_triggered)} />
        <Metric label="forecasts" value={summary.forecast_runs} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <HypothesisSummary label="strongest hypothesis" hypothesis={summary.strongest_hypothesis} />
        <HypothesisSummary label="weakest hypothesis" hypothesis={summary.weakest_hypothesis} />
      </div>
    </div>
  );
}

export default async function DualGameEvidenceComparisonPage() {
  const comparison = await readDualGameEvidenceComparison({
    expansion_window_id: NY_DUAL_GAME_JAN_MAR_2024_WINDOW_ID,
  });
  const pick4Interpretation = comparison.pick4_interpretation_summary.libra_moon;

  return (
    <div className="max-w-6xl px-8 py-8">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-100">
          Dual-Game Evidence Comparison
        </h1>
        <p className="text-sm text-gray-500">
          NY Pick 3 and Pick 4 evidence compared under the shared Jan-Mar 2024 controlled window.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span className={BADGE_CLASS}>No data mutation</span>
        <span className={BADGE_CLASS}>Pick 4 forecasts disabled</span>
        <span className={BADGE_CLASS}>No approvals or promotions</span>
        <span className={BADGE_CLASS}>No new states</span>
      </div>

      <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
        <div className="mb-1 font-mono text-xs text-gray-600">comparison_scope</div>
        <div className="text-sm font-semibold text-gray-200">
          {comparison.comparison_scope.expansion_window_id}: {comparison.comparison_scope.date_from} to{' '}
          {comparison.comparison_scope.date_to}
        </div>
      </div>

      <div className="mb-8 grid gap-4 xl:grid-cols-2">
        <GameCard summary={comparison.games.ny_pick3} />
        <GameCard summary={comparison.games.ny_pick4} />
      </div>

      <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-200">Pick 4 Interpretation Focus</h2>
        <div className="rounded border border-emerald-800/50 bg-emerald-950/20 px-3 py-3">
          <div className="font-mono text-xs text-emerald-300">
            {pick4Interpretation.hypothesis_id}
          </div>
          <div className="mt-1 text-sm text-gray-300">
            status: {pick4Interpretation.interpretation_status ?? '-'} / forecast_ready:{' '}
            {String(pick4Interpretation.forecast_ready)}
          </div>
          <div className="mt-2 font-mono text-xs text-gray-500">
            support_rate {pct(pick4Interpretation.support_rate)} / fired{' '}
            {pick4Interpretation.trigger_fired_count ?? '-'}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {pick4Interpretation.recommended_action ?? 'No recommendation available.'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-200">Comparison Notes</h2>
        <ul className="space-y-2 text-sm text-gray-500">
          {comparison.comparison_notes.map((note) => (
            <li key={note}>- {note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
