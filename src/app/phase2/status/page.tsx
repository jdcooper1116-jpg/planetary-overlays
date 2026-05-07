import { readPilotStatus } from '@/lib/fourPillars/readers/statusReader';
import StatCard from '@/components/phase2/StatCard';
import Link from 'next/link';

export const revalidate = 30; // re-fetch from Firestore at most every 30s

const JOB_STATUS_COLORS: Record<string, string> = {
  completed: 'text-green-400',
  running: 'text-amber-400',
  failed: 'text-rose-400',
  queued: 'text-sky-400',
  cancelled: 'text-gray-500',
};

export default async function StatusPage() {
  const status = await readPilotStatus();

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Pilot Status</h1>
        <p className="text-sm text-gray-500">
          NY Pick 3 · January 2024 · read from Firestore
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-10">
        <StatCard label="Draws Mirrored" value={status.draws_mirrored} sub="target ≈ 62" color="indigo" />
        <StatCard label="Overlays Built" value={status.overlays_built} color="sky" />
        <StatCard label="Features Built" value={status.features_built} color="violet" />
        <StatCard label="Hypotheses" value={status.hypotheses_total} color="amber" />
        <StatCard label="Evidence Records" value={status.evidence_records} color="green" />
        <StatCard label="Forecast Runs" value={status.forecast_runs} color="rose" />
      </div>

      {/* Pipeline completeness check */}
      <div className="mb-10 bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
        <div className="text-sm font-semibold text-gray-200 mb-3">Pipeline Completeness</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Draws → Overlays', a: status.draws_mirrored, b: status.overlays_built },
            { label: 'Draws → Features', a: status.draws_mirrored, b: status.features_built },
            {
              label: 'Evidence / Draw×Hyp',
              a: status.draws_mirrored * status.hypotheses_total,
              b: status.evidence_records,
            },
          ].map(({ label, a, b }) => {
            const pct = a > 0 ? Math.round((b / a) * 100) : 0;
            const ok = pct >= 95;
            return (
              <div key={label} className="bg-gray-800/50 rounded p-3">
                <div className="text-xs text-gray-500 font-mono mb-1">{label}</div>
                <div className={`text-xl font-bold tabular-nums ${ok ? 'text-green-400' : 'text-amber-400'}`}>
                  {pct}%
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  {b} / {a}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latest forecast */}
      {status.latest_forecast && (
        <div className="mb-8">
          <div className="text-sm font-semibold text-gray-300 mb-3">Latest Forecast</div>
          <div
            className={`rounded-lg border px-5 py-4 ${
              status.latest_forecast.evidence_backed
                ? 'bg-green-950/30 border-green-700/40'
                : 'bg-amber-950/20 border-amber-700/30'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-mono text-sm text-gray-300">
                {status.latest_forecast.target_draw_date as string}{' '}
                <span className="text-gray-500">·</span>{' '}
                {status.latest_forecast.target_draw_label as string}
              </div>
              <div
                className={`text-sm font-semibold ${
                  status.latest_forecast.evidence_backed ? 'text-green-300' : 'text-amber-300'
                }`}
              >
                {status.latest_forecast.evidence_backed ? '✓ Evidence-backed' : '○ Empty reason'}
              </div>
            </div>
            {!status.latest_forecast.evidence_backed && (
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {status.latest_forecast.empty_reason as string}
              </p>
            )}
            <div className="mt-2 text-right">
              <Link href="/phase2/forecasts" className="text-xs text-indigo-400 hover:text-indigo-300 font-mono">
                view forecasts →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent draws */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-300">Recent Draws</div>
          <Link href="/phase2/draws" className="text-xs text-indigo-400 hover:text-indigo-300 font-mono">
            view all →
          </Link>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-800">
              {status.recent_draws.map((d) => (
                <tr key={d.draw_id as string} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3 font-mono text-gray-400">{d.draw_date as string}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.draw_label as string}</td>
                  <td className="px-4 py-3 font-mono text-xl font-bold text-indigo-300 tracking-widest">
                    {d.result_padded as string}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/phase2/draws/${d.draw_id}`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-mono"
                    >
                      inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent jobs */}
      <div>
        <div className="text-sm font-semibold text-gray-300 mb-3">Recent Jobs</div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Job ID', 'Type', 'Status', 'Processed', 'Failed'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs text-gray-600 font-mono uppercase font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {status.latest_jobs.map((job) => (
                <tr key={job.job_id as string} className="hover:bg-gray-800/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500 max-w-[180px] truncate">
                    {job.job_id as string}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-300">{job.job_type as string}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`font-mono text-xs ${
                        JOB_STATUS_COLORS[job.status as string] ?? 'text-gray-400'
                      }`}
                    >
                      {job.status as string}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                    {String(job.records_processed ?? 0)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    {(job.records_failed as number) > 0 ? (
                      <span className="text-rose-400">{String(job.records_failed)}</span>
                    ) : (
                      <span className="text-gray-700">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
