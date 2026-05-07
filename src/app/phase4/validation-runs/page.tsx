import { readValidationRuns } from '@/lib/fourPillars/readers/validationRunReader';
import Link from 'next/link';

export const revalidate = 30;

const REC_STYLE: Record<string, string> = {
  promote_to_testing: 'text-green-400 bg-green-950/30 border-green-800/50',
  borderline: 'text-amber-400 bg-amber-950/30 border-amber-800/50',
  reject: 'text-rose-400 bg-rose-950/30 border-rose-800/50',
  no_trigger_fired: 'text-gray-500 bg-gray-800/40 border-gray-700/40',
};

export default async function ValidationRunsPage() {
  const runs = await readValidationRuns();

  // Aggregate stats
  const promoted = runs.filter((r) => r.recommendation === 'promote_to_testing').length;
  const rejected = runs.filter((r) => r.recommendation === 'reject').length;
  const borderline = runs.filter((r) => r.recommendation === 'borderline').length;
  const no_fire = runs.filter((r) => r.recommendation === 'no_trigger_fired').length;

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Candidate Validation Runs</h1>
        <p className="text-sm text-gray-500">
          Each run records a full backtest of one candidate against the pilot dataset
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-indigo-400 tabular-nums">{runs.length}</div>
          <div className="text-xs text-gray-500 font-mono">total runs</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-green-400 tabular-nums">{promoted}</div>
          <div className="text-xs text-gray-500 font-mono">promote rec</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-amber-400 tabular-nums">{borderline}</div>
          <div className="text-xs text-gray-500 font-mono">borderline</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-rose-400 tabular-nums">{rejected}</div>
          <div className="text-xs text-gray-500 font-mono">reject rec</div>
        </div>
      </div>

      {runs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-8 text-center">
          <p className="text-gray-500 text-sm">
            No validation runs yet. Run <span className="font-mono text-indigo-400">validate-candidates</span> from the
            Promotion page.
          </p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Candidate', 'Draws', 'Fired', 'Support', 'Contra', 'Rate%', 'Lift', 'Confidence', 'Recommendation'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs text-gray-600 font-mono font-normal uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {runs.map((vr) => (
                  <tr key={vr.validation_run_id as string} className="hover:bg-gray-800/30">
                    <td className="px-3 py-2.5 max-w-[180px]">
                      <Link
                        href={`/phase4/candidates/${vr.candidate_id}`}
                        className="font-mono text-xs text-indigo-300 hover:text-indigo-200 truncate block"
                      >
                        {(vr.candidate_id as string).replace('cand_', '').slice(0, 30)}…
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{String(vr.draws_evaluated)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-sky-400">{String(vr.trigger_fired_count)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-green-400">{String(vr.support_count)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-rose-400">{String(vr.contradiction_count)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-200">
                      {vr.support_rate_on_fired !== null
                        ? `${Math.round((vr.support_rate_on_fired as number) * 100)}%`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-emerald-300">
                      {vr.validated_lift !== null ? `${(vr.validated_lift as number).toFixed(2)}×` : '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-indigo-300">
                      {vr.confidence_score !== null ? (vr.confidence_score as number).toFixed(3) : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded border font-mono ${
                        REC_STYLE[vr.recommendation as string] ?? 'text-gray-400 border-gray-700'
                      }`}>
                        {vr.recommendation as string}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
