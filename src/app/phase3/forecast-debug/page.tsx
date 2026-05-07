import { buildForecastDebugReport } from '@/lib/fourPillars/readers/forecastDebugReader';
import ForecastDebugPanel from '@/components/phase3/ForecastDebugPanel';
import Link from 'next/link';

export const revalidate = 0; // always fresh for debug

interface PageProps {
  searchParams: { forecast_id?: string };
}

export default async function ForecastDebugPage({ searchParams }: PageProps) {
  const report = await buildForecastDebugReport(searchParams.forecast_id);

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Forecast Debug</h1>
        <p className="text-sm text-gray-500">
          Full decision chain — every hypothesis evaluated, why it passed or failed thresholds,
          whether its trigger fired, and what it contributed.
        </p>
      </div>

      {/* Forecast selector */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <span className="text-xs text-gray-500 font-mono">
          {searchParams.forecast_id
            ? `Showing: ${searchParams.forecast_id}`
            : 'Showing: latest forecast'}
        </span>
        <Link
          href="/phase3/forecast-debug"
          className="text-xs text-indigo-400 hover:text-indigo-300 font-mono"
        >
          ← latest
        </Link>
        <Link
          href="/phase3/jobs"
          className="text-xs text-gray-500 hover:text-gray-300 font-mono ml-auto"
        >
          + run new forecast →
        </Link>
      </div>

      {report.forecast === null ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-6 py-8 text-center">
          <p className="text-gray-500 text-sm mb-3">No forecast runs found.</p>
          <Link
            href="/phase3/jobs"
            className="text-sm text-indigo-400 hover:text-indigo-300 font-mono"
          >
            Go to Jobs → run refresh-forecast
          </Link>
        </div>
      ) : (
        <ForecastDebugPanel report={report} />
      )}

      {/* Help text */}
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 space-y-2">
        <div className="text-xs text-gray-500 font-mono uppercase tracking-wide">Reading this page</div>
        <div className="text-xs text-gray-400 space-y-1">
          <p><span className="text-green-400">✓</span> — hypothesis passed thresholds AND its trigger fired for the target draw context → contributed candidates</p>
          <p><span className="text-sky-400">–</span> — hypothesis passed thresholds but trigger did NOT fire for this context</p>
          <p><span className="text-gray-700">✗</span> — hypothesis did NOT pass thresholds (insufficient evidence history)</p>
        </div>
        <p className="text-xs text-gray-600 font-mono pt-1">
          Thresholds: ≥3 trigger-fired draws in evidence ledger AND ≥60% support rate on those fired draws.
          Run the backtest after seeding new hypotheses to build evidence.
        </p>
      </div>
    </div>
  );
}
