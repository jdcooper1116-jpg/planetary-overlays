import Link from 'next/link';

interface DrawTableProps {
  draws: Record<string, unknown>[];
}

export default function DrawTable({ draws }: DrawTableProps) {
  if (draws.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">No draws match the current filters.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-left">
            {['Date', 'Label', 'Result', 'D1', 'D2', 'D3', 'Local Time', 'UTC', 'Confidence', ''].map((h) => (
              <th key={h} className="px-3 py-2.5 text-xs text-gray-500 font-mono uppercase tracking-wide font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {draws.map((draw) => (
            <tr key={draw.draw_id as string} className="hover:bg-gray-800/40 transition-colors">
              <td className="px-3 py-2.5 font-mono text-gray-200 whitespace-nowrap">
                {draw.draw_date as string}
              </td>
              <td className="px-3 py-2.5">
                <LabelBadge label={draw.draw_label as string} />
              </td>
              <td className="px-3 py-2.5 font-mono text-lg font-bold text-indigo-300 tracking-widest">
                {draw.result_padded as string}
              </td>
              <td className="px-3 py-2.5 font-mono text-gray-300">{draw.digit_1 as string}</td>
              <td className="px-3 py-2.5 font-mono text-gray-300">{draw.digit_2 as string}</td>
              <td className="px-3 py-2.5 font-mono text-gray-300">{draw.digit_3 as string}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-gray-400 whitespace-nowrap">
                {(draw.draw_datetime_local as string)?.slice(0, 16).replace('T', ' ') ?? '—'}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-gray-500 whitespace-nowrap">
                {(draw.draw_datetime_utc as string)?.slice(0, 16).replace('T', ' ') ?? '—'}
              </td>
              <td className="px-3 py-2.5">
                <ConfidenceBadge value={draw._time_confidence as string} />
              </td>
              <td className="px-3 py-2.5 text-right">
                <Link
                  href={`/phase2/draws/${draw.draw_id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  inspect →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LabelBadge({ label }: { label: string }) {
  const colors: Record<string, string> = {
    midday: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
    evening: 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50',
    night: 'bg-violet-900/50 text-violet-300 border-violet-700/50',
    default: 'bg-gray-800 text-gray-400 border-gray-700',
  };
  const cls = colors[label] ?? colors.default;
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded border font-mono ${cls}`}>
      {label}
    </span>
  );
}

function ConfidenceBadge({ value }: { value: string }) {
  if (value === 'exact') {
    return <span className="text-xs text-green-500 font-mono">exact</span>;
  }
  if (value === 'schedule_derived') {
    return <span className="text-xs text-amber-500 font-mono">derived</span>;
  }
  return <span className="text-xs text-gray-600 font-mono">{value ?? '—'}</span>;
}
