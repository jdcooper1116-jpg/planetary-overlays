import { readAllForecastRuns, readForecastSummaryStats } from '@/lib/fourPillars/phase5/forecastReaders';
import JobRunnerCard from '@/components/phase3/JobRunnerCard';
import Link from 'next/link';

export const revalidate = 0;

const DATES_TO_TRY = [
  { date: '2024-01-15', label: 'midday', utc: '2024-01-15T17:20:00Z', note: 'Full Moon period' },
  { date: '2024-01-22', label: 'evening', utc: '2024-01-23T03:30:00Z', note: 'Aquarius Sun begins' },
  { date: '2024-01-06', label: 'midday', utc: '2024-01-06T17:20:00Z', note: 'Waxing Crescent' },
  { date: '2024-01-13', label: 'midday', utc: '2024-01-13T17:20:00Z', note: 'Saturn day (Saturday)' },
];

export default async function ExperimentsPage() {
  const [runs, stats] = await Promise.all([
    readAllForecastRuns(),
    readForecastSummaryStats(),
  ]);

  const resolvedIds = new Set(runs.filter((r) => r.status === 'resolved').map((r) => r.forecast_id));

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Forecast Experiments</h1>
        <p className="text-sm text-gray-500">
          Generate forecasts for specific pilot dates to test hypothesis coverage.
          All dates below are within the Jan 2024 pilot window.
        </p>
      </div>

      {/* Stats quick view */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 mb-8">
        <div className="flex flex-wrap gap-6 text-xs font-mono">
          <span className="text-gray-500">
            total runs: <span className="text-gray-200">{stats.total}</span>
          </span>
          <span className="text-gray-500">
            resolved: <span className="text-gray-200">{stats.resolved}</span>
          </span>
          <span className="text-gray-500">
            evidence-backed: <span className="text-green-400">{stats.evidence_backed}</span>
          </span>
          <span className="text-gray-500">
            hits: <span className="text-emerald-400">{stats.straight_hits + stats.box_hits}</span>
          </span>
          <Link href="/phase5/forecasts" className="text-indigo-400 hover:text-indigo-300 ml-auto">
            all runs →
          </Link>
        </div>
      </div>

      {/* Suggested experiments */}
      <div className="mb-8">
        <div className="text-sm font-semibold text-gray-200 mb-4">Suggested Pilot Experiments</div>
        <p className="text-xs text-gray-600 font-mono mb-4">
          These are interesting pilot dates based on astronomical events. Generate a forecast,
          then resolve it against the actual draw from the mirrored draws collection.
        </p>
        <div className="space-y-4">
          {DATES_TO_TRY.map((exp) => {
            const forecastId = `fp5_ny_pick3_${exp.date}_${exp.label}`;
            const alreadyResolved = resolvedIds.has(forecastId);

            return (
              <div key={forecastId} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-sm text-gray-200">{exp.date}</span>
                  <span className="text-gray-600 font-mono text-xs">{exp.label}</span>
                  <span className="text-xs text-amber-400 font-mono">{exp.note}</span>
                  {alreadyResolved && (
                    <Link
                      href={`/phase5/forecasts/${forecastId}`}
                      className="text-xs text-green-400 font-mono ml-auto"
                    >
                      resolved — view →
                    </Link>
                  )}
                </div>
                <div className="px-5 py-4">
                  <JobRunnerCard
                    title={`Generate ${exp.date} ${exp.label}`}
                    description={`${exp.note}. Then resolve it with POST /resolve-forecast {"forecast_id": "${forecastId}"} — the draw is already in your mirrored draws collection.`}
                    endpoint="/api/four-pillars/phase5/generate-forecast"
                    order={`${exp.date} ${exp.label}`}
                    body={{
                      game_id: 'ny_pick3',
                      jurisdiction_id: 'ny',
                      target_draw_date: exp.date,
                      target_draw_label: exp.label,
                      target_draw_time_utc: exp.utc,
                    }}
                    color="indigo"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resolve all */}
      <div>
        <div className="text-sm font-semibold text-gray-200 mb-3">Backfill All Generated Forecasts</div>
        <JobRunnerCard
          title="Backfill Outcomes"
          description="Find all generated forecasts and resolve them against the mirrored draws collection. Safe to run multiple times."
          endpoint="/api/four-pillars/phase5/backfill-forecast-outcomes"
          order="Backfill Outcomes"
          body={{ game_id: 'ny_pick3' }}
          color="amber"
        />
      </div>
    </div>
  );
}
