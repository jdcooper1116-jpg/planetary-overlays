import { readEvidence } from '@/lib/fourPillars/readers/evidenceReader';
import { readHypotheses } from '@/lib/fourPillars/readers/hypothesesReader';
import EvidenceTable from '@/components/phase2/EvidenceTable';
import FilterBar from '@/components/phase2/FilterBar';
import { Suspense } from 'react';

export const revalidate = 30;

const RESULT_OPTIONS = ['support', 'contradiction', 'neutral', 'inconclusive'];

interface PageProps {
  searchParams: {
    hypothesis_id?: string;
    result?: string;
    date?: string;
    label?: string;
  };
}

// Result summary counts
function ResultSummary({ evidence }: { evidence: Record<string, unknown>[] }) {
  const counts: Record<string, number> = { support: 0, contradiction: 0, neutral: 0, inconclusive: 0 };
  for (const e of evidence) {
    const r = e.result as string;
    if (r in counts) counts[r]++;
  }
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {Object.entries(counts).map(([result, count]) => {
        const colorMap: Record<string, string> = {
          support: 'text-green-400',
          contradiction: 'text-rose-400',
          neutral: 'text-gray-500',
          inconclusive: 'text-amber-400',
        };
        return (
          <div key={result} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-center">
            <div className={`text-2xl font-bold tabular-nums ${colorMap[result]}`}>{count}</div>
            <div className="text-xs text-gray-500 font-mono">{result}</div>
          </div>
        );
      })}
    </div>
  );
}

export default async function EvidencePage({ searchParams }: PageProps) {
  const [evidence, hypotheses] = await Promise.all([
    readEvidence({
      hypothesis_id: searchParams.hypothesis_id,
      result: searchParams.result,
      date: searchParams.date,
      label: searchParams.label,
    }),
    readHypotheses(),
  ]);

  const hypOptions = hypotheses.map((h) => h.hypothesis_id as string);

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Evidence Ledger</h1>
        <p className="text-sm text-gray-500">
          NY Pick 3 · append-only ·{' '}
          <span className="text-gray-300">{evidence.length} records shown</span>
        </p>
      </div>

      <ResultSummary evidence={evidence} />

      <div className="mb-5">
        <Suspense fallback={<div className="h-8" />}>
          <FilterBar
            fields={[
              { key: 'hypothesis_id', label: 'Hypothesis', options: hypOptions, placeholder: 'All hypotheses' },
              { key: 'result', label: 'Result', options: RESULT_OPTIONS, placeholder: 'All results' },
              { key: 'label', label: 'Label', options: ['midday', 'evening'], placeholder: 'All labels' },
            ]}
          />
        </Suspense>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <EvidenceTable evidence={evidence} showDrawLink />
      </div>

      <p className="mt-3 text-xs text-gray-600 font-mono">
        Evidence records are append-only. Each record is keyed by hypothesis_id + draw_id + rule_version.
      </p>
    </div>
  );
}
