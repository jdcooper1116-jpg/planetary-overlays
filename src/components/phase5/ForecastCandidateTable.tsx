interface ForecastCandidate {
  value: string;
  source_hypotheses: string[];
  rationale: string[];
  confidence_score?: number | null;
}

export default function ForecastCandidateTable({ candidates }: { candidates: ForecastCandidate[] }) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-6 text-center">
        <p className="text-gray-600 text-sm font-mono">No candidates generated for this forecast.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800 text-xs font-mono text-gray-500 uppercase tracking-wide">
        Forecast Candidates ({candidates.length})
      </div>
      <div className="divide-y divide-gray-800/50">
        {candidates.map((cand) => (
          <div key={cand.value} className="px-5 py-4">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="font-mono text-base font-bold text-indigo-300 min-w-[120px]">
                {cand.value}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {cand.source_hypotheses.map((h) => (
                    <span key={h} className="px-2 py-0.5 text-xs font-mono rounded bg-gray-800 border border-gray-700 text-gray-400 truncate max-w-[200px]">
                      {h}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  {cand.rationale?.join(' | ')}
                </div>
              </div>
              {cand.confidence_score !== null && cand.confidence_score !== undefined && (
                <div className="text-xs font-mono text-indigo-400 flex-shrink-0">
                  {cand.confidence_score.toFixed(3)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
