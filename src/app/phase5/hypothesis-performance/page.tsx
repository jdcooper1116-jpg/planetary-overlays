import { computeHypothesisPerformance } from '@/lib/fourPillars/phase5/hypothesisPerformance';
import PerformanceStatCard from '@/components/phase5/PerformanceStatCard';
import Link from 'next/link';

export const revalidate = 0;

const RECENT_STYLE: Record<string, string> = {
  hit: 'bg-green-600',
  miss: 'bg-rose-700',
  neutral: 'bg-gray-700',
};

export default async function HypothesisPerformancePage() {
  const records = await computeHypothesisPerformance();

  // Sort: most participated first, then by hit_rate
  const sorted = [...records].sort((a, b) => {
    if (b.forecasts_participated !== a.forecasts_participated)
      return b.forecasts_participated - a.forecasts_participated;
    return (b.hit_rate ?? 0) - (a.hit_rate ?? 0);
  });

  const active = sorted.filter((r) => r.forecasts_participated > 0);
  const inactive = sorted.filter((r) => r.forecasts_participated === 0);

  const totalHits = records.reduce((s, r) => s + r.hit_contributions, 0);
  const totalMisses = records.reduce((s, r) => s + r.miss_contributions, 0);

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Hypothesis Performance</h1>
        <p className="text-sm text-gray-500">
          Per-hypothesis contribution to forecast hits and misses across all resolved runs.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <PerformanceStatCard label="Total Hypotheses" value={records.length} color="indigo" />
        <PerformanceStatCard label="Active in Forecasts" value={active.length} color="sky" />
        <PerformanceStatCard label="Total Hit Contributions" value={totalHits} color="emerald" />
        <PerformanceStatCard label="Total Miss Contributions" value={totalMisses} color="rose" />
      </div>

      {records.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-8 text-center">
          <p className="text-gray-600 text-sm">
            No hypothesis performance data yet. Generate and resolve forecasts first.
          </p>
        </div>
      ) : (
        <>
          {/* Active hypotheses */}
          {active.length > 0 && (
            <div className="mb-8">
              <div className="text-sm font-semibold text-gray-300 mb-3">
                Active in Forecasts ({active.length})
              </div>
              <div className="space-y-3">
                {active.map((rec) => (
                  <HypothesisPerformanceRow key={rec.hypothesis_id} rec={rec} />
                ))}
              </div>
            </div>
          )}

          {/* Inactive hypotheses */}
          {inactive.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-3">
                Not yet participated ({inactive.length})
              </div>
              <div className="space-y-2">
                {inactive.map((rec) => (
                  <div
                    key={rec.hypothesis_id}
                    className="bg-gray-900/50 border border-gray-800/50 rounded-lg px-5 py-3 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-500 truncate">{rec.title}</div>
                      <div className="text-xs text-gray-700 font-mono">{rec.hypothesis_id}</div>
                    </div>
                    <span className="text-xs text-gray-700 font-mono">{rec.status}</span>
                    <Link
                      href={`/phase2/hypotheses/${rec.hypothesis_id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-400 font-mono flex-shrink-0"
                    >
                      detail →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HypothesisPerformanceRow({ rec }: { rec: Awaited<ReturnType<typeof computeHypothesisPerformance>>[number] }) {
  const hitRatePct = rec.hit_rate !== null ? Math.round(rec.hit_rate * 100) : null;
  const evidenceRatePct = rec.evidence_support_rate !== null
    ? Math.round(rec.evidence_support_rate * 100)
    : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-600 font-mono mb-0.5">{rec.hypothesis_id}</div>
          <div className="text-sm font-semibold text-gray-100 mb-1">{rec.title}</div>
          <div className="flex gap-2 flex-wrap text-xs font-mono">
            <span className={`px-1.5 py-0.5 rounded border ${rec.auto_generated ? 'text-amber-400 border-amber-800/40' : 'text-indigo-400 border-indigo-800/40'}`}>
              {rec.auto_generated ? 'auto' : 'human'}
            </span>
            <span className="text-gray-600">{rec.status}</span>
          </div>
        </div>
        <Link
          href={`/phase2/hypotheses/${rec.hypothesis_id}`}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex-shrink-0"
        >
          detail →
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
        {[
          { label: 'participated', value: rec.forecasts_participated, cls: 'text-gray-300' },
          { label: 'triggered', value: rec.forecasts_triggered, cls: 'text-sky-300' },
          { label: 'hits', value: rec.hit_contributions, cls: 'text-emerald-400' },
          { label: 'misses', value: rec.miss_contributions, cls: 'text-rose-400' },
          {
            label: 'hit rate',
            value: hitRatePct !== null ? `${hitRatePct}%` : '—',
            cls: hitRatePct !== null && hitRatePct >= 50 ? 'text-green-400' : 'text-gray-400',
          },
          {
            label: 'evidence rate',
            value: evidenceRatePct !== null ? `${evidenceRatePct}%` : '—',
            cls: 'text-indigo-300',
          },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-gray-800/50 rounded p-2 text-center">
            <div className={`text-sm font-bold tabular-nums font-mono ${cls}`}>{value}</div>
            <div className="text-xs text-gray-700 font-mono">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent form */}
      {rec.recent_results.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-mono">recent:</span>
          <div className="flex gap-1">
            {rec.recent_results.map((r, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-sm ${RECENT_STYLE[r] ?? 'bg-gray-700'}`}
                title={r}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
