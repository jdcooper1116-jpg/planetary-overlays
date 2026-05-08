import { readResolvedForecastRuns, readForecastSummaryStats } from '@/lib/fourPillars/phase5/forecastReaders';
import PerformanceStatCard from '@/components/phase5/PerformanceStatCard';
import Link from 'next/link';

export const revalidate = 0;

const HIT_STYLE: Record<string, { cls: string; icon: string }> = {
  straight: { cls: 'text-emerald-300 bg-emerald-950/40 border-emerald-700/50', icon: '★' },
  box: { cls: 'text-green-300 bg-green-950/40 border-green-700/50', icon: '◆' },
  miss: { cls: 'text-rose-300 bg-rose-950/30 border-rose-700/40', icon: '✗' },
};

export default async function OutcomesPage() {
  const [resolved, stats] = await Promise.all([
    readResolvedForecastRuns(),
    readForecastSummaryStats(),
  ]);

  const hitRate = stats.hit_rate !== null ? `${Math.round(stats.hit_rate * 100)}%` : '—';

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Forecast Outcomes</h1>
        <p className="text-sm text-gray-500">
          Resolved forecasts with actual results, hit types, and candidate matching.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <PerformanceStatCard label="Resolved" value={stats.resolved} color="indigo" />
        <PerformanceStatCard label="Straight" value={stats.straight_hits} color="emerald" />
        <PerformanceStatCard label="Box" value={stats.box_hits} color="green" />
        <PerformanceStatCard
          label="Hit Rate"
          value={hitRate}
          sub="evidence-backed forecasts only"
          color={stats.hit_rate !== null && stats.hit_rate >= 0.5 ? 'emerald' : 'amber'}
        />
      </div>

      {resolved.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-8 text-center">
          <p className="text-gray-600 text-sm mb-3">No resolved forecasts yet.</p>
          <p className="text-gray-700 text-xs font-mono">
            Generate forecasts, then resolve them with POST /api/four-pillars/phase5/resolve-forecast
            or use the backfill route.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resolved.map((run) => {
            const hitType = run.hit_type as string | null;
            const hitConfig = hitType ? HIT_STYLE[hitType] : null;
            const candidates = (run.candidates as Array<{ value: string }>) ?? [];
            const matched = (run.outcome_summary as { matched_candidates?: string[] } | null)
              ?.matched_candidates ?? [];

            return (
              <div
                key={run.forecast_id as string}
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4"
              >
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Hit type indicator */}
                  <div className="flex-shrink-0 w-8 text-center pt-0.5">
                    {hitConfig ? (
                      <span className={`inline-block text-lg ${hitConfig.cls.split(' ')[0]}`}>
                        {hitConfig.icon}
                      </span>
                    ) : (
                      <span className="text-gray-700">○</span>
                    )}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="font-mono text-sm text-gray-200">
                        {run.target_draw_date as string}
                      </span>
                      <span className="text-gray-600 font-mono text-xs">{run.target_draw_label as string}</span>
                      {hitConfig && (
                        <span className={`px-2 py-0.5 text-xs rounded border font-mono ${hitConfig.cls}`}>
                          {hitType}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-xs font-mono flex-wrap">
                      <span className="text-gray-500">
                        actual:{' '}
                        <span className="font-bold text-indigo-300 tracking-widest">
                          {run.actual_result as string}
                        </span>
                      </span>
                      {candidates.length > 0 && (
                        <span className="text-gray-600">
                          candidates: {candidates.map((c) => c.value).join(', ')}
                        </span>
                      )}
                      {matched.length > 0 && (
                        <span className="text-green-400">
                          ✓ matched: {matched.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/phase5/forecasts/${run.forecast_id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex-shrink-0"
                  >
                    detail →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
