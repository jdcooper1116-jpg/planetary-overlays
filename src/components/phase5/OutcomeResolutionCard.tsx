import type { HypothesisContribution, HitType } from '@/lib/fourPillars/phase5/forecastRunTypes';

interface OutcomeResolutionCardProps {
  actualResult: string | null;
  hitType: HitType;
  matchedCandidates: string[];
  hypothesisContributions: HypothesisContribution[];
  forecastCandidates: Array<{ value: string; source_hypotheses: string[] }>;
}

const HIT_CONFIG: Record<string, { label: string; cls: string; icon: string }> = {
  straight: { label: 'Straight Hit', cls: 'text-emerald-300 bg-emerald-950/50 border-emerald-700/60', icon: '★' },
  box: { label: 'Box Hit', cls: 'text-green-300 bg-green-950/50 border-green-700/60', icon: '◆' },
  miss: { label: 'Miss', cls: 'text-rose-300 bg-rose-950/40 border-rose-700/50', icon: '✗' },
};

export default function OutcomeResolutionCard({
  actualResult,
  hitType,
  matchedCandidates,
  hypothesisContributions,
  forecastCandidates,
}: OutcomeResolutionCardProps) {
  if (!actualResult) {
    return (
      <div className="bg-gray-900 border border-amber-900/40 rounded-xl px-6 py-5">
        <div className="text-sm text-amber-400 font-mono">Outcome not yet resolved.</div>
        <p className="text-xs text-gray-600 mt-2">
          Run POST /api/four-pillars/phase5/resolve-forecast to resolve once the draw result is available.
        </p>
      </div>
    );
  }

  const hitConfig = hitType ? HIT_CONFIG[hitType] : null;

  return (
    <div className="space-y-4">
      {/* Hit type banner */}
      <div className={`rounded-xl border px-6 py-5 ${hitConfig?.cls ?? 'border-gray-800 bg-gray-900'}`}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-3xl">{hitConfig?.icon ?? '○'}</div>
          <div>
            <div className="text-lg font-bold text-gray-100">{hitConfig?.label ?? 'Unknown'}</div>
            <div className="flex items-center gap-4 mt-1">
              <div>
                <div className="text-xs text-gray-500 font-mono">Actual Result</div>
                <div className="text-2xl font-bold font-mono text-indigo-300 tracking-widest">
                  {actualResult}
                </div>
              </div>
              {matchedCandidates.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 font-mono">Matched Candidates</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {matchedCandidates.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 text-xs font-mono rounded bg-green-950/60 border border-green-700/50 text-green-200"
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Candidate evaluation */}
      {forecastCandidates.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-wide mb-3">
            Forecast Candidates vs Actual
          </div>
          <div className="space-y-1.5">
            {forecastCandidates.map((cand) => {
              const hit = matchedCandidates.includes(cand.value);
              return (
                <div key={cand.value} className="flex items-center gap-3 text-sm">
                  <span className={hit ? 'text-green-400' : 'text-rose-400/60'}>{hit ? '✓' : '✗'}</span>
                  <span className="font-mono text-xs text-gray-300">{cand.value}</span>
                  <span className="text-xs text-gray-600 font-mono">
                    from: {cand.source_hypotheses.slice(0, 2).join(', ')}
                    {cand.source_hypotheses.length > 2 && ` +${cand.source_hypotheses.length - 2}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hypothesis contribution breakdown */}
      {hypothesisContributions.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
          <div className="text-xs font-mono text-gray-500 uppercase tracking-wide mb-3">
            Hypothesis Contributions
          </div>
          <div className="space-y-1.5">
            {hypothesisContributions.map((contrib) => (
              <div key={contrib.hypothesis_id} className="flex items-center gap-3 text-sm">
                <span className={
                  contrib.contributed_hit ? 'text-green-400' :
                  contrib.contributed_miss ? 'text-rose-400' :
                  'text-gray-600'
                }>
                  {contrib.contributed_hit ? '★' : contrib.contributed_miss ? '✗' : '○'}
                </span>
                <span className="font-mono text-xs text-gray-400 flex-1 truncate">
                  {contrib.hypothesis_id}
                </span>
                <span className="text-xs font-mono text-gray-600">
                  {contrib.contributed_hit ? 'hit' : contrib.contributed_miss ? 'miss' : 'neutral'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
