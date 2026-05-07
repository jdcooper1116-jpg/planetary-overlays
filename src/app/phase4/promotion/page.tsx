import { readCandidateStats } from '@/lib/fourPillars/readers/candidateReader';
import { readObservationStats } from '@/lib/fourPillars/readers/observationReader';
import { readValidationRuns } from '@/lib/fourPillars/readers/validationRunReader';
import JobRunnerCard from '@/components/phase3/JobRunnerCard';
import Link from 'next/link';
import { PROMOTION_THRESHOLDS } from '@/lib/fourPillars/autoHypotheses/scoring';

export const revalidate = 0;

const PIPELINE_STEPS = [
  {
    order: 'Step 1',
    title: 'Run Observation Scan',
    description:
      'Scans all symbolic feature docs and detects repeated (trigger → outcome) patterns ' +
      'with lift ≥1.20 over baseline. Writes to observation_log. Idempotent — re-running updates stats.',
    endpoint: '/api/four-pillars/phase4/run-observation-scan',
    color: 'indigo' as const,
  },
  {
    order: 'Step 2',
    title: 'Generate Candidates',
    description:
      'Converts top observations into structured candidate hypotheses in auto_hypothesis_queue. ' +
      'Builds trigger_logic and expected_logic from observation data. Idempotent — existing candidates are updated.',
    endpoint: '/api/four-pillars/phase4/generate-candidates',
    color: 'sky' as const,
  },
  {
    order: 'Step 3',
    title: 'Validate Candidates',
    description:
      'Backtests all candidate-status entries against the 62 pilot draws. Writes candidate_validation_runs ' +
      'and updates support_rate, lift, and recommendation on each candidate.',
    endpoint: '/api/four-pillars/phase4/validate-candidates',
    color: 'amber' as const,
  },
  {
    order: 'Step 4',
    title: 'Run Promotion Engine',
    description:
      'Evaluates validated candidates against promotion thresholds. Eligible candidates enter ' +
      'hypothesis_registry as status=proposed and remain forecast-blocked until manually approved.',
    endpoint: '/api/four-pillars/phase4/promote-candidates',
    color: 'green' as const,
  },
];

export default async function PromotionPage() {
  const [obsStats, candStats, latestRuns] = await Promise.all([
    readObservationStats(),
    readCandidateStats(),
    readValidationRuns(),
  ]);

  const t = PROMOTION_THRESHOLDS;
  const reviewRuns = latestRuns.filter((r) => r.recommendation === 'ready_for_review');

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Phase 4 Promotion & Review</h1>
        <p className="text-sm text-gray-500">
          Run all four steps in order. Each step feeds the next.
          Eligible candidates enter hypothesis_registry as status=proposed and require manual review before forecast use.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5 mb-8">
        <div className="text-sm font-semibold text-gray-200 mb-4">Pipeline Status</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Observations', value: obsStats.total, color: 'text-indigo-400', href: '/phase4/observations' },
            { label: 'Candidates', value: candStats.total, color: 'text-sky-400', href: '/phase4/candidates' },
            { label: 'Validation Runs', value: latestRuns.length, color: 'text-amber-400', href: '/phase4/validation-runs' },
            { label: 'In Registry (Proposed)', value: candStats.proposed_registry_count, color: 'text-green-400', href: '/phase4/candidates?status=ready_for_review' },
          ].map(({ label, value, color, href }) => (
            <Link key={label} href={href} className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors text-center">
              <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 font-mono mt-1">{label}</div>
            </Link>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs font-mono">
          {Object.entries(candStats.by_status).map(([status, count]) => (
            <span key={status} className="text-gray-500">
              {status}: <span className="text-gray-300">{String(count)}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-indigo-900/40 rounded-xl px-6 py-4 mb-8">
        <div className="text-sm font-semibold text-gray-200 mb-3">Promotion Thresholds</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          {[
            { label: 'min trigger_fired', value: `≥ ${t.min_trigger_fired}` },
            { label: 'min support_rate', value: `≥ ${Math.round(t.min_support_rate * 100)}%` },
            { label: 'min lift', value: `≥ ${t.min_lift}×` },
            { label: 'max contradiction', value: `≤ ${Math.round(t.max_contradiction_rate * 100)}%` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-800/50 rounded p-2.5">
              <div className="text-gray-600 mb-0.5">{label}</div>
              <div className="text-indigo-300 font-semibold">{value}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-600">
          Candidates that don&apos;t meet all four thresholds are marked rejected and kept for audit.
          They are never approved for forecast use automatically.
        </p>
      </div>

      {reviewRuns.length > 0 && (
        <div className="bg-green-950/20 border border-green-800/40 rounded-xl px-6 py-4 mb-8">
          <div className="text-sm font-semibold text-green-300 mb-3">
            Candidates Ready for Review ({reviewRuns.length})
          </div>
          <div className="space-y-2">
            {reviewRuns.slice(0, 5).map((vr) => (
              <div key={vr.validation_run_id as string} className="flex items-center gap-3 text-xs font-mono">
                <span className="text-green-400">✓</span>
                <Link
                  href={`/phase4/candidates/${vr.candidate_id}`}
                  className="text-indigo-300 hover:text-indigo-200 truncate"
                >
                  {(vr.candidate_id as string).replace('cand_', '')}
                </Link>
                <span className="text-gray-600 ml-auto">
                  rate {vr.support_rate_on_fired !== null ? `${Math.round((vr.support_rate_on_fired as number) * 100)}%` : '—'} ·
                  lift {vr.validated_lift !== null ? `${(vr.validated_lift as number).toFixed(2)}×` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {PIPELINE_STEPS.map((step) => (
          <div key={step.order}>
            <div className="text-xs text-gray-600 font-mono mb-1.5">{step.order}</div>
            <JobRunnerCard
              title={step.title}
              description={step.description}
              endpoint={step.endpoint}
              color={step.color}
              order={step.order}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/phase4/observations', label: '→ Observations' },
          { href: '/phase4/candidates', label: '→ Candidates' },
          { href: '/phase4/validation-runs', label: '→ Validation Runs' },
          { href: '/phase2/hypotheses', label: '→ Hypothesis Registry' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-sm text-center px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-gray-200 hover:border-gray-600 font-mono transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
