import { readCandidates, readCandidateStats } from '@/lib/fourPillars/readers/candidateReader';
import { PATTERN_FAMILIES } from '@/lib/fourPillars/observation/patternFamilies';
import FilterBar from '@/components/phase2/FilterBar';
import Link from 'next/link';
import { Suspense } from 'react';

export const revalidate = 30;

const FAMILY_OPTIONS = PATTERN_FAMILIES.map((f) => f.family_id);
const STATUS_OPTIONS = ['candidate', 'testing', 'rejected'];
const LABEL_OPTIONS = ['weak', 'candidate', 'promising', 'strong'];
const REC_OPTIONS = ['promote_to_testing', 'reject', 'borderline', 'no_trigger_fired'];

const LABEL_STYLE: Record<string, string> = {
  weak: 'text-gray-500 border-gray-700 bg-gray-800/40',
  candidate: 'text-sky-300 border-sky-800/50 bg-sky-950/30',
  promising: 'text-amber-300 border-amber-800/50 bg-amber-950/30',
  strong: 'text-emerald-300 border-emerald-800/50 bg-emerald-950/30',
};

const STATUS_STYLE: Record<string, string> = {
  candidate: 'text-sky-400',
  testing: 'text-green-400',
  rejected: 'text-rose-400',
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    confidence_label?: string;
    family?: string;
    recommendation?: string;
  }>;
}

export default async function CandidatesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const [candidates, stats] = await Promise.all([
    readCandidates({
      status: sp.status,
      confidence_label: sp.confidence_label,
      pattern_family: sp.family,
      recommendation: sp.recommendation,
    }),
    readCandidateStats(),
  ]);

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Auto-Hypothesis Queue</h1>
        <p className="text-sm text-gray-500">
          Machine-generated candidate hypotheses from observation patterns
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-indigo-400 tabular-nums">{stats.total}</div>
          <div className="text-xs text-gray-500 font-mono">total candidates</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-green-400 tabular-nums">{stats.proposed_registry_count}</div>
          <div className="text-xs text-gray-500 font-mono">in registry (proposed)</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-rose-400 tabular-nums">{stats.rejected}</div>
          <div className="text-xs text-gray-500 font-mono">rejected</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-amber-400 tabular-nums">
            {stats.by_label['promising'] ?? 0}
          </div>
          <div className="text-xs text-gray-500 font-mono">promising</div>
        </div>
      </div>

      {stats.total === 0 && (
        <div className="mb-6 bg-amber-950/30 border border-amber-800/40 rounded-lg px-5 py-4">
          <p className="text-sm text-amber-300">
            No candidates yet. Run observation scan first, then generate candidates.
            Use the{' '}
            <Link href="/phase4/promotion" className="underline">Promotion page</Link>
            {' '}for the full workflow.
          </p>
        </div>
      )}

      <div className="mb-5">
        <Suspense fallback={<div className="h-8" />}>
          <FilterBar
            fields={[
              { key: 'status', label: 'Status', options: STATUS_OPTIONS, placeholder: 'All' },
              { key: 'confidence_label', label: 'Confidence', options: LABEL_OPTIONS, placeholder: 'All' },
              { key: 'family', label: 'Family', options: FAMILY_OPTIONS, placeholder: 'All' },
              { key: 'recommendation', label: 'Recommendation', options: REC_OPTIONS, placeholder: 'All' },
            ]}
          />
        </Suspense>
      </div>

      <div className="text-xs text-gray-600 font-mono mb-3">{candidates.length} candidates shown</div>

      <div className="space-y-3">
        {candidates.length === 0 ? (
          <p className="text-gray-600 text-sm py-8 text-center">No candidates match.</p>
        ) : (
          candidates.map((cand) => (
            <div
              key={cand.candidate_id as string}
              className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  {/* Title and badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`px-2 py-0.5 text-xs rounded border font-mono ${
                        LABEL_STYLE[cand.confidence_label as string] ?? LABEL_STYLE.weak
                      }`}
                    >
                      {cand.confidence_label as string}
                    </span>
                    <span className={`text-xs font-mono ${STATUS_STYLE[cand.status as string] ?? 'text-gray-400'}`}>
                      {cand.status as string}
                    </span>
                    {cand.last_recommendation ? (
                      <span className="text-xs text-gray-600 font-mono">
                        → {String(cand.last_recommendation)}
                      </span>
                    ) : null}
                  </div>

                  <div className="font-mono text-xs text-gray-500 mb-1">{cand.candidate_id as string}</div>
                  <div className="text-sm text-gray-200 font-medium mb-3">{cand.title as string}</div>

                  {/* Stats row */}
                  <div className="flex gap-5 flex-wrap text-xs font-mono">
                    <span>
                      lift:{' '}
                      <span className="text-emerald-300 font-semibold">
                        {cand.validated_lift !== null
                          ? `${(cand.validated_lift as number).toFixed(2)}×`
                          : `${(cand.lift as number).toFixed(2)}× (obs)`}
                      </span>
                    </span>
                    <span>
                      fired:{' '}
                      <span className="text-sky-300">
                        {String(cand.validated_trigger_fired_count ?? cand.observed_count ?? '?')}
                      </span>
                    </span>
                    <span>
                      support_rate:{' '}
                      <span className={
                        (cand.validated_support_rate as number | null) !== null &&
                        (cand.validated_support_rate as number) >= 0.62
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }>
                        {cand.validated_support_rate !== null
                          ? `${Math.round((cand.validated_support_rate as number) * 100)}%`
                          : '—'}
                      </span>
                    </span>
                    <span>
                      score:{' '}
                      <span className="text-indigo-300">
                        {(cand.confidence_score as number)?.toFixed(3) ?? '—'}
                      </span>
                    </span>
                    <span className="text-gray-600">{cand.pattern_family as string}</span>
                  </div>
                </div>

                <Link
                  href={`/phase4/candidates/${cand.candidate_id}`}
                  className="flex-shrink-0 text-xs text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  detail →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
