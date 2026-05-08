import { readAllForecastRuns, readForecastSummaryStats } from '@/lib/fourPillars/phase5/forecastReaders';
import ForecastSummaryCard from '@/components/phase5/ForecastSummaryCard';
import PerformanceStatCard from '@/components/phase5/PerformanceStatCard';
import JobRunnerCard from '@/components/phase3/JobRunnerCard';
import {
  buildPilotDefaultForecastTimeUtc,
  PILOT_DEFAULT_FORECAST_DRAW_LABEL,
  PILOT_GAME_ID,
  PILOT_JURISDICTION_ID,
} from '@/lib/fourPillars/readers/pilotConstants';

export const revalidate = 0;

export default async function Phase5ForecastsPage() {
  const [runs, stats] = await Promise.all([
    readAllForecastRuns(),
    readForecastSummaryStats(),
  ]);

  const hitRate = stats.hit_rate !== null ? `${Math.round(stats.hit_rate * 100)}%` : '—';
  const todayDate = new Date().toISOString().slice(0, 10);
  const todayUTC = buildPilotDefaultForecastTimeUtc(todayDate);

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Forecast Runs</h1>
        <p className="text-sm text-gray-500">
          Phase 5 governed forecasts — only approved hypotheses, fully auditable, outcome-tracked.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <PerformanceStatCard label="Total Forecasts" value={stats.total} color="indigo" />
        <PerformanceStatCard label="Resolved" value={stats.resolved} color="green" />
        <PerformanceStatCard label="Evidence-backed" value={stats.evidence_backed} color="sky" />
        <PerformanceStatCard
          label="Hit Rate"
          value={hitRate}
          sub={`${stats.straight_hits} straight · ${stats.box_hits} box · ${stats.misses} miss`}
          color={stats.hit_rate !== null && stats.hit_rate > 0.5 ? 'emerald' : 'amber'}
        />
      </div>

      {/* Generate forecast */}
      <div className="mb-8">
        <div className="text-sm font-semibold text-gray-300 mb-3">Generate Forecast</div>
        <JobRunnerCard
          title="Generate Today's Midday Forecast"
          description={`Generate a forecast for ${todayDate} midday draw using all approved hypotheses. The decision chain shows every hypothesis checked.`}
          endpoint="/api/four-pillars/phase5/generate-forecast"
          order="Generate Forecast"
          body={{
            game_id: PILOT_GAME_ID,
            jurisdiction_id: PILOT_JURISDICTION_ID,
            target_draw_date: todayDate,
            target_draw_label: PILOT_DEFAULT_FORECAST_DRAW_LABEL,
            target_draw_time_utc: todayUTC,
          }}
          color="indigo"
        />
      </div>

      {/* Backfill */}
      <div className="mb-8">
        <JobRunnerCard
          title="Backfill Outcomes"
          description="Resolve all generated forecasts whose target draw date now exists in the draws collection."
          endpoint="/api/four-pillars/phase5/backfill-forecast-outcomes"
          order="Backfill Outcomes"
          body={{ game_id: PILOT_GAME_ID }}
          color="amber"
        />
      </div>

      {/* Forecast list */}
      <div>
        <div className="text-sm font-semibold text-gray-300 mb-3">
          All Runs ({runs.length})
        </div>
        {runs.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-8 text-center">
            <p className="text-gray-600 text-sm">No forecast runs yet. Generate one above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => (
              <ForecastSummaryCard key={run.forecast_id as string} forecast={run} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
