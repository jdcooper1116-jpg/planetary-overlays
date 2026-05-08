interface PerformanceStatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'green' | 'rose' | 'amber' | 'sky' | 'indigo' | 'emerald' | 'gray';
}

const COLOR_MAP: Record<string, string> = {
  green: 'text-green-400',
  rose: 'text-rose-400',
  amber: 'text-amber-400',
  sky: 'text-sky-400',
  indigo: 'text-indigo-400',
  emerald: 'text-emerald-400',
  gray: 'text-gray-500',
};

export default function PerformanceStatCard({
  label, value, sub, color = 'indigo',
}: PerformanceStatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-4">
      <div className="text-xs text-gray-600 font-mono uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-3xl font-bold tabular-nums ${COLOR_MAP[color]}`}>{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-1 font-mono">{sub}</div>}
    </div>
  );
}
