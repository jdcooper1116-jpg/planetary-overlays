import Link from 'next/link';

interface EvidenceTableProps {
  evidence: Record<string, unknown>[];
  showDrawLink?: boolean;
}

const RESULT_STYLES: Record<string, string> = {
  support: 'bg-green-900/40 text-green-300 border-green-700/50',
  contradiction: 'bg-rose-900/40 text-rose-300 border-rose-700/50',
  neutral: 'bg-gray-800 text-gray-400 border-gray-700',
  inconclusive: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
};

export default function EvidenceTable({ evidence, showDrawLink = true }: EvidenceTableProps) {
  if (evidence.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">No evidence records match.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left">
            {['Date', 'Label', 'Hypothesis', 'Result', 'Trigger', 'Outcome', ''].map((h) => (
              <th key={h} className="px-3 py-2.5 text-xs text-gray-500 font-mono uppercase tracking-wide font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {evidence.map((ev) => (
            <tr key={ev.evidence_id as string} className="hover:bg-gray-800/40 transition-colors">
              <td className="px-3 py-2.5 font-mono text-gray-300 whitespace-nowrap">
                {ev.draw_date as string}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-gray-500">
                {ev.draw_label as string}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-gray-400 max-w-[200px] truncate">
                {ev.hypothesis_id as string}
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={`inline-block px-2 py-0.5 text-xs rounded border font-mono ${
                    RESULT_STYLES[ev.result as string] ?? RESULT_STYLES.neutral
                  }`}
                >
                  {ev.result as string}
                </span>
              </td>
              <td className="px-3 py-2.5 font-mono text-xs">
                <BoolBadge value={ev.trigger_met} />
              </td>
              <td className="px-3 py-2.5 font-mono text-xs">
                <BoolBadge value={ev.outcome_met} />
              </td>
              <td className="px-3 py-2.5 text-right">
                {showDrawLink && (
                  <Link
                    href={`/phase2/draws/${ev.draw_id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-mono"
                  >
                    draw →
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BoolBadge({ value }: { value: unknown }) {
  if (value === true) return <span className="text-green-400">✓ yes</span>;
  if (value === false) return <span className="text-rose-400">✗ no</span>;
  return <span className="text-gray-600">—</span>;
}
