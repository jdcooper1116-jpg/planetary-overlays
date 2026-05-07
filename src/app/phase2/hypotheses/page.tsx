import { readHypotheses } from '@/lib/fourPillars/readers/hypothesesReader';
import KeyValueBlock from '@/components/phase2/KeyValueBlock';

export const revalidate = 30;

const STATUS_COLORS: Record<string, string> = {
  testing: 'text-amber-300 bg-amber-900/30 border-amber-700/40',
  proposed: 'text-sky-300 bg-sky-900/30 border-sky-700/40',
  queued: 'text-sky-300 bg-sky-900/30 border-sky-700/40',
  weak_support: 'text-yellow-300 bg-yellow-900/30 border-yellow-700/40',
  moderate_support: 'text-green-300 bg-green-900/30 border-green-700/40',
  strong_support: 'text-emerald-300 bg-emerald-900/30 border-emerald-700/40',
  contradicted: 'text-rose-300 bg-rose-900/30 border-rose-700/40',
  retired: 'text-gray-500 bg-gray-800 border-gray-700',
};

export default async function HypothesesPage() {
  const hypotheses = await readHypotheses();

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Hypothesis Registry</h1>
        <p className="text-sm text-gray-500">
          {hypotheses.length} hypothesis{hypotheses.length !== 1 ? 'es' : ''} · NY Pick 3 pilot
        </p>
      </div>

      <div className="space-y-6">
        {hypotheses.map((hyp) => {
          const total = (hyp.evidence_count_total as number) ?? 0;
          const supporting = (hyp.evidence_count_supporting as number) ?? 0;
          const contradicting = (hyp.evidence_count_contradicting as number) ?? 0;
          const neutral = (hyp.evidence_count_neutral as number) ?? 0;
          const supportRate = hyp.support_rate != null
            ? `${Math.round((hyp.support_rate as number) * 100)}%`
            : '—';

          // Support rate bar width
          const barPct = hyp.support_rate != null
            ? Math.round((hyp.support_rate as number) * 100)
            : 0;

          return (
            <div key={hyp.hypothesis_id as string} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-800 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs font-mono text-gray-500 mb-1">{hyp.hypothesis_id as string}</div>
                  <div className="text-base font-semibold text-gray-100">{hyp.title as string}</div>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs rounded border font-mono flex-shrink-0 ${
                    STATUS_COLORS[hyp.status as string] ?? STATUS_COLORS.testing
                  }`}
                >
                  {hyp.status as string}
                </span>
              </div>

              {/* Description */}
              <div className="px-5 py-3 border-b border-gray-800">
                <p className="text-sm text-gray-400 leading-relaxed">{hyp.description as string}</p>
              </div>

              {/* Evidence counters */}
              <div className="px-5 py-4 border-b border-gray-800">
                <div className="flex items-center gap-6 flex-wrap mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-100 tabular-nums">{total}</div>
                    <div className="text-xs text-gray-500 font-mono">total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 tabular-nums">{supporting}</div>
                    <div className="text-xs text-gray-500 font-mono">support</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-rose-400 tabular-nums">{contradicting}</div>
                    <div className="text-xs text-gray-500 font-mono">contradiction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-500 tabular-nums">{neutral}</div>
                    <div className="text-xs text-gray-500 font-mono">neutral</div>
                  </div>
                  <div className="text-center ml-auto">
                    <div className="text-2xl font-bold text-indigo-300 tabular-nums">{supportRate}</div>
                    <div className="text-xs text-gray-500 font-mono">support rate</div>
                  </div>
                </div>

                {/* Support rate bar */}
                {total > 0 && (
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full transition-all"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Logic */}
              <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-2">Trigger Logic</div>
                  <pre className="text-xs text-indigo-300 font-mono bg-gray-800/60 rounded p-3 overflow-auto">
                    {JSON.stringify(hyp.trigger_logic, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-2">Expected Logic</div>
                  <pre className="text-xs text-green-300 font-mono bg-gray-800/60 rounded p-3 overflow-auto">
                    {JSON.stringify(hyp.expected_logic, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Metadata footer */}
              <div className="px-5 py-3 bg-gray-800/30 flex gap-6 flex-wrap text-xs font-mono text-gray-500">
                <span>rule_version: <span className="text-gray-400">{hyp.rule_version as string}</span></span>
                <span>system: <span className="text-gray-400">{hyp.system_name as string}</span></span>
                <span>family: <span className="text-gray-400">{hyp.system_family as string}</span></span>
                <span>draw_labels: <span className="text-gray-400">{(hyp.draw_labels as string[])?.join(', ')}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
