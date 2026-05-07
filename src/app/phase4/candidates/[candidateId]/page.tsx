import { readCandidateById } from '@/lib/fourPillars/readers/candidateReader';
import { readValidationRuns } from '@/lib/fourPillars/readers/validationRunReader';
import { readObservationById } from '@/lib/fourPillars/readers/observationReader';
import KeyValueBlock from '@/components/phase2/KeyValueBlock';
import CandidateApprovalBadge from '@/components/phase4/CandidateApprovalBadge';
import ReviewActionPanel from '@/components/phase4/ReviewActionPanel';
import ReviewNotesForm from '@/components/phase4/ReviewNotesForm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PROMOTION_THRESHOLDS } from '@/lib/fourPillars/autoHypotheses/scoring';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ candidateId: string }>;
}

const STATUS_STYLE: Record<string, string> = {
  candidate: 'text-sky-300 bg-sky-950/40 border-sky-800/50',
  testing: 'text-green-300 bg-green-950/40 border-green-800/50',
  rejected: 'text-rose-300 bg-rose-950/40 border-rose-800/50',
  proposed: 'text-amber-300 bg-amber-950/40 border-amber-800/50',
  ready_for_review: 'text-emerald-300 bg-emerald-950/40 border-emerald-800/50',
  needs_more_data: 'text-gray-400 bg-gray-800/40 border-gray-700',
};

const REC_STYLE: Record<string, string> = {
  ready_for_review: 'text-green-400',
  borderline: 'text-amber-400',
  reject: 'text-rose-400',
  no_trigger_fired: 'text-gray-500',
};

export default async function CandidateDetailPage({ params }: PageProps) {
  const { candidateId } = await params;

  const candidate = await readCandidateById(candidateId);
  if (!candidate) notFound();

  const queueCandidateId = String(candidate.candidate_id ?? candidateId);
  const validationRuns = await readValidationRuns(queueCandidateId);

  const obs_id = candidate.observation_id ? String(candidate.observation_id) : null;
  const observation = obs_id ? await readObservationById(obs_id) : null;

  const t = PROMOTION_THRESHOLDS;
  const vsr = candidate.validated_support_rate as number | null;
  const vlift = candidate.validated_lift as number | null;
  const vfired = Number(candidate.validated_trigger_fired_count ?? 0);
  const vcontra = Number(candidate.validated_contradiction_count ?? 0);
  const contra_rate = vfired > 0 ? vcontra / vfired : 0;
  const registryId = (candidate.registry_id as string | null) ?? null;

  const checks = [
    { label: `trigger_fired ≥ ${t.min_trigger_fired}`, passed: vfired >= t.min_trigger_fired, value: String(vfired) },
    { label: `support_rate ≥ ${t.min_support_rate * 100}%`, passed: vsr !== null && vsr >= t.min_support_rate, value: vsr !== null ? `${Math.round(vsr * 100)}%` : '—' },
    { label: `lift ≥ ${t.min_lift}×`, passed: vlift !== null && vlift >= t.min_lift, value: vlift !== null ? `${vlift.toFixed(2)}×` : '—' },
    { label: `contradiction_rate ≤ ${t.max_contradiction_rate * 100}%`, passed: contra_rate <= t.max_contradiction_rate, value: `${Math.round(contra_rate * 100)}%` },
  ];
  const allPassed = checks.every((c) => c.passed);

  const reviewStatus = candidate.review_status as string | null | undefined;
  const forecastApproved = candidate.forecast_approved as boolean | null | undefined;

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-6 text-sm font-mono text-gray-600">
        <Link href="/phase4/review-queue" className="text-indigo-400 hover:text-indigo-300">review-queue</Link>
        {' / '}
        <Link href="/phase4/candidates" className="text-indigo-400 hover:text-indigo-300">candidates</Link>
        {' / '}
        <span className="text-gray-400">{String(candidate.candidate_id ?? candidate.id)}</span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-600 font-mono mb-1">{String(candidate.candidate_id ?? candidate.id)}</div>
            <h1 className="text-lg font-bold text-gray-100 mb-2">{String(candidate.title ?? 'Untitled candidate')}</h1>
            <p className="text-sm text-gray-400">{String(candidate.description ?? '—')}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={`px-2 py-1 rounded border text-xs font-mono ${STATUS_STYLE[String(candidate.status ?? '')] ?? 'text-gray-300 border-gray-700'}`}>
              {String(candidate.status ?? 'unknown')}
            </span>
            {candidate.last_recommendation ? (
              <span className={`text-xs font-mono ${REC_STYLE[String(candidate.last_recommendation) as keyof typeof REC_STYLE] ?? 'text-gray-500'}`}>
                rec: {String(candidate.last_recommendation)}
              </span>
            ) : null}
            <CandidateApprovalBadge
              status={String(candidate.status ?? '')}
              forecastApproved={forecastApproved === true}
              reviewStatus={reviewStatus ?? null}
              autoGenerated={candidate.auto_generated === true}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {checks.map((c) => (
            <div key={c.label} className="bg-gray-800/40 rounded-lg p-3">
              <div className="text-xs text-gray-500 font-mono">{c.label}</div>
              <div className={`mt-1 text-sm font-semibold ${c.passed ? 'text-green-400' : 'text-rose-400'}`}>
                {c.value}
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${allPassed ? 'border-green-800/50 bg-green-950/20 text-green-300' : 'border-amber-800/50 bg-amber-950/20 text-amber-300'}`}>
          {allPassed
            ? 'This candidate passes all promotion thresholds.'
            : 'This candidate does not pass all promotion thresholds yet.'}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <ReviewActionPanel
          candidateId={queueCandidateId}
          registryId={registryId}
          reviewStatus={reviewStatus ?? null}
          forecastApproved={forecastApproved === true}
        />
        <ReviewNotesForm
          candidateId={queueCandidateId}
          existingNotes={String(candidate.review_notes ?? '')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <KeyValueBlock
          title="Candidate"
          rows={[
            { label: 'doc_id', value: String(candidate.id) },
            { label: 'candidate_id', value: String(candidate.candidate_id ?? '—') },
            { label: 'pattern_family', value: String(candidate.pattern_family ?? '—') },
            { label: 'status', value: String(candidate.status ?? '—') },
            { label: 'review_status', value: String(candidate.review_status ?? '—') },
            { label: 'forecast_approved', value: String(candidate.forecast_approved ?? 'false') },
            { label: 'confidence_label', value: String(candidate.confidence_label ?? '—') },
            { label: 'baseline_rate', value: String(candidate.baseline_rate ?? '—') },
            { label: 'validated_support_rate', value: String(candidate.validated_support_rate ?? '—') },
            { label: 'validated_lift', value: String(candidate.validated_lift ?? '—') },
            { label: 'last_recommendation', value: String(candidate.last_recommendation ?? '—') },
            { label: 'registry_id', value: String(candidate.registry_id ?? '—') },
          ]}
        />

        <KeyValueBlock
          title="Review / Audit"
          rows={[
            { label: 'reviewed_by', value: String(candidate.reviewed_by ?? '—') },
            { label: 'reviewed_at', value: String(candidate.reviewed_at ?? '—') },
            { label: 'review_decision', value: String(candidate.review_decision ?? '—') },
            { label: 'review_notes', value: String(candidate.review_notes ?? '—') },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <KeyValueBlock
          title="Trigger / Expected Logic"
          rows={[
            { label: 'trigger_logic', value: JSON.stringify(candidate.trigger_logic ?? {}, null, 2) },
            { label: 'expected_logic', value: JSON.stringify(candidate.expected_logic ?? {}, null, 2) },
          ]}
        />

        <KeyValueBlock
          title="Observation"
          rows={[
            { label: 'observation_id', value: String(candidate.observation_id ?? '—') },
            { label: 'observation_loaded', value: observation ? 'yes' : 'no' },
          ]}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
        <div className="text-sm font-semibold text-gray-200 mb-3">
          Validation Runs ({validationRuns.length})
        </div>

        {validationRuns.length === 0 ? (
          <div className="text-sm text-gray-500">No validation runs found.</div>
        ) : (
          <div className="space-y-3">
            {validationRuns.map((run) => (
              <div key={String(run.validation_run_id)} className="bg-gray-800/40 rounded-lg p-4">
                <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-400 mb-2">
                  <span>{String(run.validation_run_id)}</span>
                  <span>fired: {String(run.trigger_fired_count ?? 0)}</span>
                  <span>support: {String(run.support_count ?? 0)}</span>
                  <span>contradiction: {String(run.contradiction_count ?? 0)}</span>
                  <span>lift: {String(run.validated_lift ?? '—')}</span>
                  <span>rec: {String(run.recommendation ?? '—')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
