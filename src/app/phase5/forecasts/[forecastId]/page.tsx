import { readForecastRunById } from '@/lib/fourPillars/phase5/forecastReaders';
import HypothesisContributionPanel from '@/components/phase5/HypothesisContributionPanel';
import ForecastCandidateTable from '@/components/phase5/ForecastCandidateTable';
import OutcomeResolutionCard from '@/components/phase5/OutcomeResolutionCard';
import KeyValueBlock from '@/components/phase2/KeyValueBlock';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { HypothesisDecision, HypothesisContribution } from '@/lib/fourPillars/phase5/forecastRunTypes';

export const revalidate = 0;

interface PageProps { params: { forecastId: string } }

const STATUS_STYLE: Record<string, string> = {
  generated: 'text-sky-300 bg-sky-950/30 border-sky-800/50',
  resolved: 'text-green-300 bg-green-950/30 border-green-800/50',
  draft: 'text-gray-400 bg-gray-800/30 border-gray-700',
  archived: 'text-gray-600 bg-gray-900/30 border-gray-800',
};

export default async function ForecastDetailPage({ params }: PageProps) {
  const { forecastId } = await params;
  const forecast = await readForecastRunById(forecastId);
  if (!forecast) notFound();

  const decisionChain = (forecast.decision_chain as HypothesisDecision[]) ?? [];
  const candidates = (forecast.candidates as Array<{ value: string; source_hypotheses: string[]; rationale: string[]; confidence_score?: number | null }>) ?? [];
  const triggeredIds = new Set<string>(forecast.triggered_hypotheses as string[] ?? []);
  const outcomeSummary = forecast.outcome_summary as {
    actual_result?: string;
    matched_candidates?: string[];
    hit_type?: string;
    hypothesis_contributions?: HypothesisContribution[];
  } | null;

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm font-mono text-gray-600">
        <Link href="/phase5/forecasts" className="text-indigo-400 hover:text-indigo-300">forecasts</Link>
        {' / '}
        <span className="text-gray-400">{forecast.forecast_id as string}</span>
      </div>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="text-xs font-mono text-gray-600 mb-1">{forecast.forecast_id as string}</div>
            <h1 className="text-xl font-bold text-gray-100">
              {forecast.target_draw_date as string}{' '}
              <span className="text-gray-500">·</span>{' '}
              {forecast.target_draw_label as string}
            </h1>
            <div className="text-sm text-gray-500 font-mono mt-1">
              Generated: {(forecast.generated_at as string | null)?.slice(0, 16).replace('T', ' ') ?? '—'}
              {forecast.resolved_at ? (
                <span> · Resolved: {String(forecast.resolved_at).slice(0, 16).replace('T', ' ')}</span>
              ) : null}
            </div>
          </div>
          <span className={`px-3 py-1.5 text-sm rounded border font-mono ${STATUS_STYLE[forecast.status as string] ?? STATUS_STYLE.draft}`}>
            {forecast.status as string}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'hypotheses used', value: (forecast.approved_hypotheses_used as string[] | null)?.length ?? 0 },
            { label: 'triggered', value: (forecast.triggered_hypotheses as string[] | null)?.length ?? 0 },
            { label: 'candidates', value: candidates.length },
            { label: 'evidence_backed', value: (forecast.evidence_backed as boolean) ? 'yes' : 'no' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold font-mono text-gray-100">{value}</div>
              <div className="text-xs text-gray-600 font-mono">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Outcome */}
      {forecast.status === 'resolved' && (
        <div className="mb-8">
          <div className="text-sm font-semibold text-gray-200 mb-3">Outcome</div>
          <OutcomeResolutionCard
            actualResult={forecast.actual_result as string | null}
            hitType={forecast.hit_type as 'straight' | 'box' | 'miss' | null}
            matchedCandidates={outcomeSummary?.matched_candidates ?? []}
            hypothesisContributions={outcomeSummary?.hypothesis_contributions ?? []}
            forecastCandidates={candidates}
          />
        </div>
      )}

      {/* Resolve action (if not yet resolved) */}
      {forecast.status === 'generated' && (
        <div className="mb-8 bg-amber-950/20 border border-amber-800/30 rounded-xl px-5 py-4">
          <div className="text-sm font-semibold text-amber-300 mb-2">Awaiting Resolution</div>
          <p className="text-xs text-gray-500 mb-3 font-mono">
            POST /api/four-pillars/phase5/resolve-forecast with{' '}
            {`{"forecast_id": "${forecast.forecast_id}"}`} — or supply actual_result manually.
          </p>
        </div>
      )}

      {/* Candidates */}
      <div className="mb-8">
        <div className="text-sm font-semibold text-gray-200 mb-3">Forecast Candidates</div>
        {forecast.evidence_backed ? (
          <ForecastCandidateTable candidates={candidates} />
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-5">
            <div className="text-sm text-amber-300 mb-2">No evidence-backed candidates</div>
            <p className="text-xs text-gray-600 font-mono leading-relaxed">
              {forecast.empty_reason as string}
            </p>
          </div>
        )}
      </div>

      {/* Context snapshot */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <KeyValueBlock
          title="Draw Context"
          rows={Object.entries((forecast.context_snapshot as Record<string, unknown>) ?? {}).map(
            ([k, v]) => ({ label: k, value: v })
          )}
        />
        <KeyValueBlock
          title="Celestial Snapshot"
          rows={Object.entries((forecast.celestial_snapshot as Record<string, unknown>) ?? {}).map(
            ([k, v]) => ({ label: k, value: v })
          )}
        />
      </div>

      {/* Decision chain */}
      <div className="mb-8">
        <div className="text-sm font-semibold text-gray-200 mb-3">
          Hypothesis Decision Chain ({decisionChain.length})
        </div>
        <HypothesisContributionPanel
          decisionChain={decisionChain}
          triggeredIds={triggeredIds}
        />
      </div>

      {/* Versions */}
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
