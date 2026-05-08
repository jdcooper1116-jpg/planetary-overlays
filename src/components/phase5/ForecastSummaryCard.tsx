import Link from 'next/link';

interface ForecastSummaryCardProps {
  forecast: Record<string, unknown>;
  compact?: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  generated: 'text-sky-300 border-sky-800/50 bg-sky-950/30',
  awaiting_outcome: 'text-amber-300 border-amber-800/50 bg-amber-950/30',
  resolved: 'text-green-300 border-green-800/50 bg-green-950/30',
  draft: 'text-gray-400 border-gray-700 bg-gray-800/30',
  archived: 'text-gray-600 border-gray-800 bg-gray-900/30',
};

const HIT_STYLE: Record<string, string> = {
  straight: 'text-emerald-300 bg-emerald-950/50 border-emerald-700/60',
  box: 'text-green-300 bg-green-950/50 border-green-700/60',
  miss: 'text-rose-300 bg-rose-950/40 border-rose-700/50',
};

export default function ForecastSummaryCard({ forecast, compact = false }: ForecastSummaryCardProps) {
  const status = forecast.status as string;
  const evidenceBacked = forecast.evidence_backed as boolean;
  const hitType = forecast.hit_type as string | null;
  const candidates = forecast.candidates as Array<{ value: string }> | null;
  const triggeredCount = (forecast.triggered_hypotheses as string[] | null)?.length ?? 0;
  const usedCount = (forecast.approved_hypotheses_used as string[] | null)?.length ?? 0;

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden ${compact ? '' : ''}`}>
      <div className="px-5 py-4 border-b border-gray-800 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs font-mono text-gray-600 mb-1">{forecast.forecast_id as string}</div>
          <div className="text-sm font-semibold text-gray-100">
            {forecast.target_draw_date as string}{' '}
            <span className="text-gray-500">·</span>{' '}
            {forecast.target_draw_label as string}
          </div>
          <div className="text-xs text-gray-600 font-mono mt-0.5">
            {forecast.generated_at
              ? `Generated ${(forecast.generated_at as string).slice(0, 16).replace('T', ' ')}`
              : 'Not generated'}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
          <span className={`inline-block px-2 py-0.5 text-xs rounded border font-mono ${STATUS_STYLE[status] ?? STATUS_STYLE.draft}`}>
            {status}
          </span>
          {hitType && (
            <span className={`inline-block px-2 py-0.5 text-xs rounded border font-mono ${HIT_STYLE[hitType] ?? ''}`}>
              {hitType === 'straight' ? '★ Straight' : hitType === 'box' ? '◆ Box' : '✗ Miss'}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-b border-gray-800 flex flex-wrap gap-5 text-xs font-mono">
        <span className="text-gray-500">
          hypotheses:{' '}
          <span className="text-gray-300">{usedCount} used, {triggeredCount} triggered</span>
        </span>
        <span className="text-gray-500">
          evidence-backed:{' '}
          <span className={evidenceBacked ? 'text-green-400' : 'text-gray-600'}>
            {evidenceBacked ? 'yes' : 'no'}
          </span>
        </span>
        {forecast.actual_result ? (
          <span className="text-gray-500">
            actual: <span className="text-indigo-300 font-bold tracking-widest">{String(forecast.actual_result)}</span>
          </span>
        ) : null}
      </div>

      {candidates && candidates.length > 0 && (
        <div className="px-5 py-3 border-b border-gray-800 flex flex-wrap gap-1.5">
          {candidates.map((c) => (
            <span
              key={c.value}
              className="px-2 py-0.5 text-xs font-mono rounded bg-indigo-950/50 border border-indigo-800/50 text-indigo-200"
            >
              {c.value}
            </span>
          ))}
        </div>
      )}

      {!evidenceBacked && forecast.empty_reason && !compact ? (
        <div className="px-5 py-3 border-b border-gray-800">
          <div className="text-xs text-gray-600 font-mono leading-relaxed">{String(forecast.empty_reason)}</div>
        </div>
      ) : null}

      <div className="px-5 py-2.5 bg-gray-800/20 flex justify-end">
        <Link
          href={`/phase5/forecasts/${forecast.forecast_id}`}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-mono"
        >
          full detail →
        </Link>
      </div>
    </div>
  );
}
