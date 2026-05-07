import { readOverlays } from '@/lib/fourPillars/readers/overlaysReader';
import FilterBar from '@/components/phase2/FilterBar';
import Link from 'next/link';
import { Suspense } from 'react';

export const revalidate = 30;

const ZODIAC_SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];

interface PageProps {
  searchParams: { date?: string; label?: string; moon_sign?: string };
}

export default async function OverlaysPage({ searchParams }: PageProps) {
  const overlays = await readOverlays({
    date: searchParams.date,
    label: searchParams.label,
    moon_sign: searchParams.moon_sign,
  });

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Celestial Overlays</h1>
        <p className="text-sm text-gray-500">
          NY Pick 3 · January 2024 ·{' '}
          <span className="text-gray-300">{overlays.length} overlays</span>
        </p>
      </div>

      <div className="mb-5">
        <Suspense fallback={<div className="h-8" />}>
          <FilterBar
            fields={[
              { key: 'label', label: 'Label', options: ['midday', 'evening'], placeholder: 'All labels' },
              { key: 'moon_sign', label: 'Moon Sign', options: ZODIAC_SIGNS, placeholder: 'All signs' },
            ]}
          />
        </Suspense>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {overlays.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No overlays match current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Date', 'Label', 'Moon Phase', 'Moon Sign', 'Sun Sign', 'Waxing', 'Illumination', 'Confidence', ''].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs text-gray-500 font-mono uppercase tracking-wide font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {overlays.map((o) => (
                  <tr key={o.overlay_id as string} className="hover:bg-gray-800/40">
                    <td className="px-3 py-2.5 font-mono text-gray-200">{o.draw_date as string}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{o.draw_label as string}</td>
                    <td className="px-3 py-2.5 text-sm text-sky-300">{o.moon_phase_name as string}</td>
                    <td className="px-3 py-2.5 font-mono text-indigo-300">{o.moon_sign as string}</td>
                    <td className="px-3 py-2.5 font-mono text-amber-300">{o.sun_sign as string}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {(o.is_waxing as boolean) ? (
                        <span className="text-green-400">↑ waxing</span>
                      ) : (
                        <span className="text-rose-400">↓ waning</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-400">
                      {typeof o.moon_illumination_fraction === 'number'
                        ? `${Math.round((o.moon_illumination_fraction as number) * 100)}%`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {o.time_confidence === 'exact' ? (
                        <span className="text-green-500">exact</span>
                      ) : (
                        <span className="text-amber-500">derived</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/phase2/draws/${o.draw_id}`}
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
