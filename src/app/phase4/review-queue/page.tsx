import Link from 'next/link';
import { readCandidates } from '@/lib/fourPillars/readers/candidateReader';
import { readReviewSummary } from '@/lib/fourPillars/review/reviewEngine';

export const revalidate = 0;

function queueCandidateFilter(c: Record<string, unknown>) {
  const status = String(c.status ?? '');
  const reviewStatus = String(c.review_status ?? '');

  return (
    status === 'ready_for_review' &&
    (reviewStatus === '' || reviewStatus === 'pending' || reviewStatus === 'returned')
  );
}

export default async function ReviewQueuePage() {
  const [summary, allReady] = await Promise.all([
    readReviewSummary(),
    readCandidates({ status: 'ready_for_review' }),
  ]);

  const queue = allReady.filter(queueCandidateFilter);

  return (
    <div className="px-8 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Review Queue</h1>
        <p className="text-sm text-gray-500">
          Candidates ready for manual review. Only approved candidates can participate in forecast generation.
        </p>
      </div>

      <div className="bg-indigo-950/20 border border-indigo-800/40 rounded-xl px-6 py-5 mb-8">
        <div className="text-xs font-mono text-indigo-300 mb-3">FORECAST GUARD RULE</div>
        <p className="text-sm text-gray-200 leading-7">
          Any hypothesis where <span className="font-mono text-indigo-300">auto_generated === true</span> is excluded from
          forecast output unless <span className="font-mono text-green-400">forecast_approved === true</span>. Approving a
          candidate here is the only way to allow it into forecasting. Evidence thresholds still apply independently.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Ready for review', value: summary.ready_for_review, cls: 'text-amber-300' },
          { label: 'Approved', value: summary.approved, cls: 'text-green-400' },
          { label: 'Rejected', value: summary.rejected, cls: 'text-rose-400' },
          { label: 'Needs data', value: summary.needs_more_data, cls: 'text-sky-400' },
          { label: 'Proposed (registry)', value: summary.proposed_in_registry, cls: 'text-gray-300' },
          { label: 'Forecast-active', value: summary.testing_approved_in_registry, cls: 'text-emerald-400' },
        ].map((card) => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-6 text-center">
            <div className={`text-2xl font-bold tabular-nums ${card.cls}`}>{card.value}</div>
            <div className="text-xs text-gray-500 font-mono mt-2">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 mb-8">
        <div className="text-sm text-gray-400 font-mono">
          Validation thresholds used to reach this queue:
          <span className="ml-4">fired ≥ 5</span>
          <span className="ml-4">support ≥ 62%</span>
          <span className="ml-4">lift ≥ 1.15×</span>
          <span className="ml-4">contra ≤ 38%</span>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
        {queue.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-lg text-gray-300 mb-2">No candidates currently awaiting review.</div>
            <div className="text-sm text-gray-500 mb-6">
              Run the Phase 4 pipeline or return a candidate to the queue to populate this page.
            </div>
            <div className="flex items-center justify-center gap-4 text-sm font-mono">
              <Link href="/phase4/promotion" className="text-indigo-400 hover:text-indigo-300">
                → Phase 4 Promotion
              </Link>
              <Link href="/phase4/candidates" className="text-indigo-400 hover:text-indigo-300">
                → All Candidates
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((cand) => {
              const detailId = String(cand.id ?? cand.candidate_id ?? '').trim();

              return (
                <div key={detailId} className="bg-gray-800/40 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="px-2 py-1 rounded border border-amber-800/50 bg-amber-950/30 text-amber-300 text-xs font-mono">
                          ready_for_review
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {String(cand.candidate_id ?? detailId)}
                        </span>
                      </div>

                      <div className="text-lg font-semibold text-gray-100 mb-2">
                        {String(cand.title ?? 'Untitled candidate')}
                      </div>

                      <div className="text-sm text-gray-400 mb-4">
                        {String(cand.description ?? '—')}
                      </div>

                      <div className="flex flex-wrap gap-6 text-sm font-mono">
                        <span className="text-emerald-400">lift: {Number(cand.validated_lift ?? 0).toFixed(2)}×</span>
                        <span className="text-gray-300">fired: {String(cand.validated_trigger_fired_count ?? 0)}</span>
                        <span className="text-green-400">
                          support_rate: {cand.validated_support_rate != null ? `${Math.round(Number(cand.validated_support_rate) * 100)}%` : '—'}
                        </span>
                        <span className="text-indigo-300">score: {String(cand.confidence_score ?? '—')}</span>
                        <span className="text-gray-500">{String(cand.pattern_family ?? '—')}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Link
                        href={detailId ? `/phase4/candidates/${encodeURIComponent(detailId)}` : '#'}
                        className="text-indigo-400 hover:text-indigo-300 font-mono"
                      >
                        detail →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
