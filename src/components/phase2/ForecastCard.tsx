import KeyValueBlock from './KeyValueBlock';

interface ForecastCardProps {
  forecast: Record<string, unknown>;
}

export default function ForecastCard({ forecast }: ForecastCardProps) {
  const evidenceBacked = forecast.evidence_backed as boolean;
  const candidates = forecast.recommended_candidates as string[] | null;
  const triggered = forecast.hypotheses_triggered as string[] | null;
  const emptyReason = forecast.empty_reason as string | null;
  const context = forecast.context_features as Record<string, unknown> | null;
  const celestial = forecast.celestial_snapshot as Record<string, unknown> | null;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className={`rounded-lg border px-6 py-5 ${
        evidenceBacked
          ? 'bg-green-950/40 border-green-700/50'
          : 'bg-amber-950/30 border-amber-700/40'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-lg font-bold ${evidenceBacked ? 'text-green-300' : 'text-amber-300'}`}>
            {evidenceBacked ? '✓ Evidence-Backed' : '○ No Evidence-Backed Candidates'}
          </span>
          <span className="text-xs font-mono text-gray-500 ml-auto">
            {(forecast.forecast_id as string) ?? '—'}
          </span>
        </div>

        <div className="text-sm text-gray-400 font-mono">
          Target: <span className="text-gray-200">{forecast.target_draw_date as string}</span>
          {' '}&nbsp;·&nbsp;{' '}
          <span className="text-gray-200">{forecast.target_draw_label as string}</span>
          {' '}&nbsp;·&nbsp;{' '}
          Generated: <span className="text-gray-200">
            {(forecast.generated_at as string)?.slice(0, 16).replace('T', ' ') ?? '—'}
          </span>
        </div>
      </div>

      {/* Candidates or empty reason */}
      {evidenceBacked && candidates && candidates.length > 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
          <div className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-3">
            Recommended Candidates
          </div>
          <div className="flex flex-wrap gap-2">
            {candidates.map((c) => (
              <span
                key={c}
                className="px-3 py-1.5 bg-indigo-900/50 border border-indigo-700/50 text-indigo-200 rounded font-mono text-sm"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900 border border-amber-900/40 rounded-lg px-5 py-4">
          <div className="text-xs text-amber-600 font-mono uppercase tracking-wide mb-2">
            Empty Reason
          </div>
          <p className="text-sm text-gray-300">{emptyReason ?? 'No reason recorded.'}</p>
        </div>
      )}

      {/* Triggered hypotheses */}
      {triggered && triggered.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
          <div className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-3">
            Hypotheses Triggered
          </div>
          <div className="space-y-1">
            {triggered.map((h) => (
              <div key={h} className="font-mono text-xs text-indigo-300">{h}</div>
            ))}
          </div>
        </div>
      )}

      {/* Context features + celestial snapshot side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {context && (
          <KeyValueBlock
            title="Context Features"
            rows={Object.entries(context).map(([k, v]) => ({ label: k, value: v }))}
          />
        )}
        {celestial && (
          <KeyValueBlock
            title="Celestial Snapshot"
            rows={Object.entries(celestial).map(([k, v]) => ({ label: k, value: v }))}
          />
        )}
      </div>

      {/* Version metadata */}
      <KeyValueBlock
        title="Versions"
        rows={[
          { label: 'forecast_method_version', value: forecast.forecast_method_version },
          { label: 'overlay_version', value: forecast.overlay_version },
          { label: 'symbolic_version', value: forecast.symbolic_version },
          { label: 'rule_version', value: forecast.rule_version },
        ]}
      />
    </div>
  );
}
