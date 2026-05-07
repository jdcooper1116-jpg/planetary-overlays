import Link from 'next/link';
import type { ForecastDebugReport } from '@/lib/fourPillars/readers/forecastDebugReader';

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function ForecastDebugPanel({ report }: { report: ForecastDebugReport }) {
  const forecast = (report.forecast ?? null) as Record<string, unknown> | null;
  const hypothesesChecked = report.hypotheses_checked ?? [];
  const summary = report.summary as {
    final_decision: string;
    total_hypotheses: number;
    passed_threshold: number;
    trigger_fired: number;
    contributed_candidates: number;
    empty_reason?: string | null;
  };

  const THRESHOLD_REQS = 'Need ≥3 trigger-fired draws AND ≥60% support rate on fired';

  const contextFeatures =
    forecast &&
    typeof forecast.context_features === 'object' &&
    forecast.context_features !== null
      ? Object.entries(forecast.context_features as Record<string, unknown>)
      : [];

  const recommendedCandidates =
    forecast && Array.isArray(forecast.recommended_candidates)
      ? (forecast.recommended_candidates as string[])
      : [];

  return (
    <div className="space-y-8">
      <div
        className={`rounded-xl border px-6 py-5 ${
          summary.final_decision === 'evidence_backed'
            ? 'bg-green-950/40 border-green-700/50'
            : 'bg-amber-950/30 border-amber-700/40'
        }`}
      >
        <div className="text-lg font-bold text-gray-100 mb-2">
          {summary.final_decision === 'evidence_backed'
            ? '✓ Evidence-backed candidates generated'
            : '○ No evidence-backed candidates'}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            { label: 'Hypotheses evaluated', value: summary.total_hypotheses },
            { label: 'Passed thresholds', value: summary.passed_threshold },
            { label: 'Triggered for context', value: summary.trigger_fired },
            { label: 'Contributed candidates', value: summary.contributed_candidates },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-gray-100 tabular-nums">{renderValue(value)}</div>
              <div className="text-xs text-gray-500 font-mono">{label}</div>
            </div>
          ))}
        </div>

        {summary.empty_reason ? (
          <p className="mt-4 text-sm text-gray-400 bg-gray-900/40 rounded p-3">
            {summary.empty_reason}
          </p>
        ) : null}
      </div>

      {forecast ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
          <div className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-3">
            Target Draw Context
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {contextFeatures.length > 0
              ? contextFeatures.map(([k, v]) => (
                  <div key={k} className="bg-gray-800/50 rounded p-2.5">
                    <div className="text-xs text-gray-500 font-mono mb-0.5">{k}</div>
                    <div className="text-sm text-gray-100 font-mono">{renderValue(v)}</div>
                  </div>
                ))
              : null}
          </div>
        </div>
      ) : null}

      <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-3">
        <div className="text-xs text-gray-500 font-mono">
          Evidence threshold for forecast eligibility:{' '}
          <span className="text-gray-300">{THRESHOLD_REQS}</span>
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-200 mb-3">
          Hypothesis Decision Chain ({hypothesesChecked.length})
        </div>

        <div className="space-y-3">
          {hypothesesChecked.map((h) => {
            const triggerFiredForTarget = h.trigger_fired_for_target === true;
            const passedThreshold = h.passed_threshold === true;
            const candidateContributions = Array.isArray(h.candidate_contributions)
              ? (h.candidate_contributions as string[])
              : [];

            const rowColor = triggerFiredForTarget && passedThreshold
              ? 'border-green-800/50 bg-green-950/20'
              : passedThreshold
              ? 'border-sky-800/40 bg-sky-950/10'
              : 'border-gray-800';

            return (
              <div
                key={String(h.hypothesis_id)}
                className={`rounded-lg border px-4 py-3 ${rowColor}`}
              >
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-shrink-0 w-6 pt-0.5">
                    {triggerFiredForTarget && passedThreshold ? (
                      <span className="text-green-400 text-lg">✓</span>
                    ) : passedThreshold ? (
                      <span className="text-sky-400 text-lg">–</span>
                    ) : (
                      <span className="text-gray-700 text-lg">✗</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 font-medium mb-0.5 truncate">
                      {renderValue(h.title ?? h.hypothesis_id)}
                    </div>
                    <div className="font-mono text-xs text-gray-500 mb-1">
                      {renderValue(h.hypothesis_id)}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded border ${
                          passedThreshold
                            ? 'text-green-400 border-green-800 bg-green-950/30'
                            : 'text-gray-600 border-gray-800'
                        }`}
                      >
                        {passedThreshold ? 'threshold ✓' : 'threshold ✗'}
                      </span>

                      <span className="text-gray-500">
                        {renderValue(h.trigger_fired_count)} fired ·{' '}
                        {h.support_rate_on_fired !== null && h.support_rate_on_fired !== undefined
                          ? `${Math.round(Number(h.support_rate_on_fired) * 100)}% support`
                          : 'no data'}
                      </span>

                      {triggerFiredForTarget ? (
                        <span className="px-1.5 py-0.5 rounded border text-green-300 border-green-800 bg-green-950/30">
                          triggers for context
                        </span>
                      ) : null}
                    </div>

                    {h.threshold_failure_reason ? (
                      <div className="mt-1 text-xs text-gray-600 font-mono">
                        ↳ {renderValue(h.threshold_failure_reason)}
                      </div>
                    ) : null}

                    {candidateContributions.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {candidateContributions.map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 text-xs font-mono rounded bg-indigo-900/50 border border-indigo-700/50 text-indigo-200"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <Link
                    href={`/phase2/hypotheses/${renderValue(h.hypothesis_id)}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex-shrink-0"
                  >
                    detail →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {recommendedCandidates.length > 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
          <div className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-3">
            Final Candidates
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendedCandidates.map((c) => (
              <span
                key={c}
                className="px-3 py-1.5 text-sm font-mono rounded bg-indigo-900/60 border border-indigo-700/60 text-indigo-200"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
