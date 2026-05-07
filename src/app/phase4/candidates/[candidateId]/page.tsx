import { readCandidateById } from '@/lib/fourPillars/readers/candidateReader';
import { readValidationRuns } from '@/lib/fourPillars/readers/validationRunReader';
import { readObservationById } from '@/lib/fourPillars/readers/observationReader';
import KeyValueBlock from '@/components/phase2/KeyValueBlock';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 30;

const STATUS_STYLE: Record<string, string> = {
  candidate: 'text-sky-300 border-sky-700 bg-sky-950/30',
  ready_for_review: 'text-amber-300 border-amber-700 bg-amber-950/30',
  rejected: 'text-rose-300 border-rose-700 bg-rose-950/30',
  testing: 'text-indigo-300 border-indigo-700 bg-indigo-950/30',
  proposed: 'text-green-300 border-green-700 bg-green-950/30',
};

const REC_STYLE: Record<string, string> = {
  ready_for_review: 'text-green-400',
  borderline: 'text-amber-400',
  reject: 'text-rose-400',
  no_trigger_fired: 'text-gray-500',
};

interface PageProps {
  params: Promise<{
    candidateId: string;
  }>;
}

export default async function CandidateDetailPage({ params }: PageProps) {
  const { candidateId } = await params;

  if (!candidateId) notFound();

  const candidate = (await readCandidateById(candidateId)) as (Record<string, unknown> & { id: string }) | null;
  if (!candidate) notFound();

  const observationId = candidate.observation_id ? String(candidate.observation_id) : null;

  const [validationRuns, sourceObservation] = await Promise.all([
    readValidationRuns(candidateId),
    observationId ? readObservationById(observationId) : Promise.resolve(null),
  ]);

  const vlift = Number(candidate.validated_lift ?? 0);
  const vsr = candidate.validated_support_rate as number | null;
  const vfired = Number(candidate.validated_trigger_fired_count ?? 0);

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <Link
          href="/phase4/candidates"
          className="text-sm text-indigo-400 hover:text-indigo-300 font-mono"
        >
          ← back to candidates
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <div className="text-xs text-gray-600 font-mono mb-1">{String(candidate.candidate_id ?? candidateId)}</div>
            <h1 className="text-lg font-bold text-gray-100 mb-1">{String(candidate.title ?? 'Untitled candidate')}</h1>
            <p className="text-sm text-gray-400">{String(candidate.description ?? '—')}</p>
          </div>
          <div className="flex flex-col gap-2 items-end flex-shrink-0">
            <span
              className={`px-2.5 py-1 text-xs rounded border font-mono ${
                STATUS_STYLE[String(candidate.status ?? '')] ?? 'text-gray-400 border-gray-700'
              }`}
            >
              {String(candidate.status ?? 'unknown')}
            </span>
            {candidate.last_recommendation ? (
              <span
                className={`text-xs font-mono ${
                  REC_STYLE[String(candidate.last_recommendation)] ?? 'text-gray-500'
                }`}
              >
                rec: {String(candidate.last_recommendation)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          {[
            { label: 'confidence_score', value: typeof candidate.confidence_score === 'number' ? candidate.confidence_score.toFixed(3) : '—', cls: 'text-indigo-300' },
            { label: 'confidence_label', value: String(candidate.confidence_label ?? '—'), cls: 'text-sky-300' },
            { label: 'validated_lift', value: vlift ? `${vlift.toFixed(2)}×` : '—', cls: 'text-emerald-300' },
            { label: 'support_rate', value: vsr ? `${Math.round(vsr * 100)}%` : '—', cls: 'text-green-300' },
            { label: 'trigger_fired', value: String(vfired), cls: 'text-amber-300' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-600 font-mono mb-1">{label}</div>
              <div className={`text-lg font-bold font-mono ${cls}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <KeyValueBlock
          title="Candidate"
          rows={[
            { label: 'candidate_id', value: String(candidate.candidate_id ?? '—') },
            { label: 'pattern_family', value: String(candidate.pattern_family ?? '—') },
            { label: 'status', value: String(candidate.status ?? '—') },
            { label: 'confidence_label', value: String(candidate.confidence_label ?? '—') },
            { label: 'baseline_rate', value: String(candidate.baseline_rate ?? '—') },
            { label: 'validated_support_rate', value: String(candidate.validated_support_rate ?? '—') },
            { label: 'validated_lift', value: String(candidate.validated_lift ?? '—') },
            { label: 'last_recommendation', value: String(candidate.last_recommendation ?? '—') },
            { label: 'registry_id', value: String(candidate.registry_id ?? '—') },
          ]}
        />

        <KeyValueBlock
          title="Logics"
          rows={[
            { label: 'trigger_logic', value: JSON.stringify(candidate.trigger_logic ?? {}, null, 2) },
            { label: 'expected_logic', value: JSON.stringify(candidate.expected_logic ?? {}, null, 2) },
          ]}
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5 mb-8">
        <div className="text-sm font-semibold text-gray-200 mb-3">Source Observation</div>
        {sourceObservation ? (
          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(sourceObservation, null, 2)}
          </pre>
        ) : (
          <div className="text-sm text-gray-500">No linked observation found.</div>
        )}
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
