interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'indigo' | 'green' | 'amber' | 'rose' | 'sky' | 'violet';
}

const colorMap = {
  indigo: 'text-indigo-400',
  green: 'text-green-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  sky: 'text-sky-400',
  violet: 'text-violet-400',
};

export default function StatCard({ label, value, sub, color = 'indigo' }: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide font-mono mb-1">{label}</div>
      <div className={`text-3xl font-bold tabular-nums ${colorMap[color]}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
