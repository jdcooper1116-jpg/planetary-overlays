interface KeyValueBlockProps {
  title: string;
  rows: { label: string; value: unknown }[];
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

export default function KeyValueBlock({ title, rows }: KeyValueBlockProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold text-gray-200">
        {title}
      </div>
      <div className="divide-y divide-gray-800">
        {rows.map((row) => (
          <div key={row.label} className="px-4 py-2.5 flex gap-4">
            <span className="text-xs text-gray-500 font-mono w-44 flex-shrink-0 pt-0.5">
              {row.label}
            </span>
            <span className="text-sm text-gray-100 font-mono break-all whitespace-pre-wrap">
              {formatValue(row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
