import { readAllForecasts } from '@/lib/fourPillars/readers/forecastsReader';
import ForecastCard from '@/components/phase2/ForecastCard';

export const revalidate = 30;

export default async function ForecastsPage() {
  const forecasts = await readAllForecasts();

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Forecast Runs</h1>
        <p className="text-sm text-gray-500">
          NY Pick 3 · evidence-gated ·{' '}
          <span className="text-gray-300">{forecasts.length} forecast run{forecasts.length !== 1 ? 's' : ''}</span>
        </p>
      </div>

      {forecasts.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-6 py-8 text-center">
          <p className="text-gray-500 text-sm">
            No forecast runs yet. Run{' '}
            <code className="font-mono text-indigo-400">POST /api/four-pillars/refresh-forecasts</code>{' '}
            to generate the first one.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {forecasts.map((forecast, i) => (
            <div key={forecast.forecast_id as string}>
              {i > 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-gray-800" />
                  <span className="text-xs text-gray-600 font-mono">earlier run</span>
                  <div className="h-px flex-1 bg-gray-800" />
                </div>
              )}
              <ForecastCard forecast={forecast} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
        <div className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-2">About Forecasts</div>
        <p className="text-sm text-gray-400 leading-relaxed">
          Forecast candidates are evidence-backed only. The system returns{' '}
          <code className="font-mono text-amber-300 text-xs">empty_reason</code> when no hypothesis has
          accumulated enough trigger-fired evidence (minimum 3 trigger events, 60% support rate) to
          contribute to a candidate. This is correct behavior with the Phase 1 pilot window.
        </p>
      </div>
    </div>
  );
}
