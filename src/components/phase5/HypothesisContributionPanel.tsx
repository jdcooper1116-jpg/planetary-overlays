import type { HypothesisDecision } from '@/lib/fourPillars/phase5/forecastRunTypes';
import Link from 'next/link';

interface HypothesisContributionPanelProps {
  decisionChain: HypothesisDecision[];
  triggeredIds?: Set<string>;
}

const RESULT_ICON: Record<string, string> = {
  contributed_hit: '★',
  contributed_miss: '✗',
  neutral: '○',
};

export default function HypothesisContributionPanel({
  decisionChain,
  triggeredIds = new Set(),
}: HypothesisContributionPanelProps) {
  if (!decisionChain || decisionChain.length === 0) {
    return <p className="text-gray-600 text-sm font-mono py-4">No decision chain available.</p>;
  }

  return (
    <div className="space-y-2">
      {decisionChain.map((h) => {
        const triggered = h.trigger_fired_for_context === true;
        const passed = h.passed_evidence_threshold;

        let rowColor = 'border-gray-800';
        if (triggered && passed) rowColor = 'border-green-800/50 bg-green-950/10';
        else if (passed && !triggered) rowColor = 'border-sky-800/30 bg-sky-950/10';

        return (
          <div key={h.hypothesis_id} className={`rounded-lg border px-4 py-3 ${rowColor}`}>
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-shrink-0 w-5 pt-0.5 text-sm">
                {triggered && passed ? (
                  <span className="text-green-400">✓</span>
                ) : passed ? (
                  <span className="text-sky-400">–</span>
                ) : (
                  <span className="text-gray-700">✗</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 font-medium mb-0.5 truncate">{h.title}</div>
                <div className="font-mono text-xs text-gray-600 mb-1.5">{h.hypothesis_id}</div>

                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <span className={`px-1.5 py-0.5 rounded border text-xs ${passed ? 'text-green-400 border-green-800/50' : 'text-gray-600 border-gray-800'}`}>
                    {passed ? 'threshold ✓' : 'threshold ✗'}
                  </span>
                  {h.threshold_failure_reason && (
                    <span className="text-gray-600">↳ {h.threshold_failure_reason}</span>
                  )}
                  {triggered && (
                    <span className="text-green-300 px-1.5 py-0.5 rounded border border-green-800/40 bg-green-950/30">
                      context trigger fired
                    </span>
                  )}
                  <span className="text-gray-600">
                    fired: {h.trigger_fired_count} ·{' '}
                    rate: {h.support_rate !== null ? `${Math.round(h.support_rate * 100)}%` : '—'}
                  </span>
                </div>

                {h.candidate_contributions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {h.candidate_contributions.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 text-xs font-mono rounded bg-indigo-950/50 border border-indigo-800/50 text-indigo-200"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href={`/phase2/hypotheses/${h.hypothesis_id}`}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex-shrink-0"
              >
                detail →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
