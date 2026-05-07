import { readFeatures } from '@/lib/fourPillars/readers/featuresReader';
import FilterBar from '@/components/phase2/FilterBar';
import Link from 'next/link';
import { Suspense } from 'react';

export const revalidate = 30;

const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ZODIAC_SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];

interface PageProps {
  searchParams: Promise<{
    date?: string;
    label?: string;
    weekday?: string;
    moon_sign?: string;
  }>;
}

function Flag({ active, label }: { active: boolean; label: string }) {
  return active ? (
    <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-violet-900/50 text-violet-300 border border-violet-700/50 font-mono mr-1">
      {label}
    </span>
  ) : null;
}

export default async function FeaturesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const features = await readFeatures({
    date: sp.date,
    label: sp.label,
    weekday: sp.weekday,
    moon_sign: sp.moon_sign,
  });

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Symbolic Features</h1>
        <p className="text-sm text-gray-500">
          NY Pick 3 · January 2024 ·{' '}
          <span className="text-gray-300">{features.length} feature rows</span>
        </p>
      </div>

      <div className="mb-5">
        <Suspense fallback={<div className="h-8" />}>
          <FilterBar
            fields={[
              { key: 'label', label: 'Label', options: ['midday', 'evening'], placeholder: 'All labels' },
              { key: 'weekday', label: 'Weekday', options: WEEKDAYS, placeholder: 'All weekdays' },
              { key: 'moon_sign', label: 'Moon Sign', options: ZODIAC_SIGNS, placeholder: 'All signs' },
            ]}
          />
        </Suspense>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {features.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No features match current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Date', 'Label', 'Weekday', 'Ruler', 'Sum', 'Root', 'Moon Sign', 'Moon Phase', 'Season', 'Flags', ''].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs text-gray-500 font-mono uppercase tracking-wide font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {features.map((f) => (
                  <tr key={f.feature_doc_id as string} className="hover:bg-gray-800/40">
                    <td className="px-3 py-2.5 font-mono text-gray-200">{f.draw_date as string}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{f.draw_label as string}</td>
                    <td className="px-3 py-2.5 text-gray-300">{f.weekday_name as string}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-amber-300">{f.weekday_ruler as string}</td>
                    <td className="px-3 py-2.5 font-mono text-indigo-200 font-semibold">
                      {String(f.digit_sum ?? '—')}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-violet-300 font-semibold">
                      {String(f.digit_root ?? '—')}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sky-300">{f.moon_sign as string}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400">{f.moon_phase_name as string}</td>
                    <td className="px-3 py-2.5 text-xs text-green-400">{f.season as string}</td>
                    <td className="px-3 py-2.5">
                      <Flag active={f.is_triple as boolean} label="triple" />
                      <Flag active={f.is_double as boolean} label="double" />
                      <Flag active={f.is_fibonacci_result as boolean} label="fib" />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/phase2/draws/${f.draw_id}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-mono"
                      >
                        draw →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
