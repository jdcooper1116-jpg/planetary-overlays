import { readHypothesisDetail } from '@/lib/fourPillars/readers/researchReader';
import HypothesisBreakdown from '@/components/phase3/HypothesisBreakdown';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 30;

const STATUS_COLORS: Record<string, string> = {
  testing: 'text-amber-300 bg-amber-900/30 border-amber-700/40',
  proposed: 'text-sky-300 bg-sky-900/30 border-sky-700/40',
  queued: 'text-sky-300 bg-sky-900/30 border-sky-700/40',
  moderate_support: 'text-green-300 bg-green-900/30 border-green-700/40',
  strong_support: 'text-emerald-300 bg-emerald-900/30 border-emerald-700/40',
  contradicted: 'text-rose-300 bg-rose-900/30 border-rose-700/40',
  retired: 'text-gray-500 bg-gray-800 border-gray-700',
};

interface PageProps {
  params: { hypothesisId: string };
}

export default async function HypothesisDetailPage({ params }: PageProps) {
  const detail = await readHypothesisDetail(params.hypothesisId);
  if (!detail) notFound();

  const { hypothesis, evidence_by_result, totals } = detail;

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-600 font-mono">
        <Link href="/phase2/hypotheses" className="text-indigo-400 hover:text-indigo-300">
          hypotheses
        </Link>
        {' '}/{' '}
        <span className="text-gray-300">{hypothesis.hypothesis_id as string}</span>
      </div>

      {/* Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <div className="text-xs text-gray-600 font-mono mb-1">{hypothesis.hypothesis_id as string}</div>
            <h1 className="text-xl font-bold text-gray-100">{hypothesis.title as string}</h1>
          </div>
          <span className={`px-2.5 py-1 text-xs rounded border font-mono flex-shrink-0 ${
            STATUS_COLORS[hypothesis.status as string] ?? STATUS_COLORS.testing
          }`}>
            {hypothesis.status as string}
          </span>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed mb-4">
          {hypothesis.description as string}
        </p>
        <div className="flex gap-4 text-xs font-mono text-gray-600 flex-wrap">
          <span>system: <span className="text-gray-400">{hypothesis.system_name as string}</span></span>
          <span>family: <span className="text-gray-400">{hypothesis.system_family as string}</span></span>
          <span>rule_version: <span className="text-gray-400">{hypothesis.rule_version as string}</span></span>
          <span>game: <span className="text-gray-400">{(hypothesis.game_ids as string[])?.join(', ')}</span></span>
        </div>
      </div>

      {/* Cross-links */}
      <div className="mb-8 flex gap-3 flex-wrap">
        <Link
          href={`/phase2/evidence?hypothesis_id=${hypothesis.hypothesis_id}`}
          className="px-4 py-2 text-sm bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors font-mono"
        >
          📋 Filter evidence for this hypothesis →
        </Link>
        <Link
          href={`/phase3/forecast-debug`}
          className="px-4 py-2 text-sm bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg text-gray-300 hover:text-white transition-colors font-mono"
        >
          🎯 See forecast decision chain →
        </Link>
      </div>

      {/* Breakdown */}
      <HypothesisBreakdown
        hypothesis={hypothesis}
        evidenceByResult={evidence_by_result as unknown as Parameters<typeof HypothesisBreakdown>[0]['evidenceByResult']}
        totals={totals}
      />
    </div>
  );
}
