import { searchDraws, searchFeatures, searchEvidence, searchOverlays } from '@/lib/fourPillars/readers/researchReader';
import DrawTable from '@/components/phase2/DrawTable';
import EvidenceTable from '@/components/phase2/EvidenceTable';
import FilterBar from '@/components/phase2/FilterBar';
import Link from 'next/link';
import { Suspense } from 'react';

export const revalidate = 30;

const ZODIAC = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const RULERS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
const PHASES = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
const DIGIT_ROOTS = ['0','1','2','3','4','5','6','7','8','9'];

type SearchParams = {
  view?: string;
  label?: string;
  result_contains?: string;
  digit_root?: string;
  doubles_only?: string;
  leading_zero_only?: string;
  weekday?: string;
  ruler?: string;
  moon_sign?: string;
  sun_sign?: string;
  moon_phase?: string;
  is_waxing?: string;
  hypothesis_id?: string;
  result?: string;
  trigger_met?: string;
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

type ViewMode = 'draws' | 'overlays' | 'features' | 'evidence';

export default async function ResearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const view = (sp.view as ViewMode) ?? 'draws';

  let draws: Record<string, unknown>[] = [];
  let features: Record<string, unknown>[] = [];
  let evidence: Record<string, unknown>[] = [];
  let overlays: Record<string, unknown>[] = [];

  if (view === 'draws') {
    draws = await searchDraws({
      label: sp.label,
      result_contains: sp.result_contains,
      digit_root: sp.digit_root,
      doubles_only: sp.doubles_only === 'true',
      leading_zero_only: sp.leading_zero_only === 'true',
    });
  } else if (view === 'overlays') {
    overlays = await searchOverlays({
      label: sp.label,
      moon_sign: sp.moon_sign,
      sun_sign: sp.sun_sign,
      moon_phase: sp.moon_phase,
      is_waxing: sp.is_waxing,
    });
  } else if (view === 'features') {
    features = await searchFeatures({
      label: sp.label,
      weekday: sp.weekday,
      ruler: sp.ruler,
      digit_root: sp.digit_root,
      moon_sign: sp.moon_sign,
      moon_phase: sp.moon_phase,
      doubles_only: sp.doubles_only === 'true',
      triples_only: false,
      fibonacci_only: false,
    });
  } else if (view === 'evidence') {
    evidence = await searchEvidence({
      hypothesis_id: sp.hypothesis_id,
      result: sp.result,
      label: sp.label,
      trigger_met: sp.trigger_met,
    });
  }

  const resultCount = {
    draws: draws.length,
    overlays: overlays.length,
    features: features.length,
    evidence: evidence.length,
  }[view];

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Research Explorer</h1>
        <p className="text-sm text-gray-500">
          Cross-collection search with richer filters · NY Pick 3 · Jan 2024
        </p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {(['draws', 'overlays', 'features', 'evidence'] as ViewMode[]).map((v) => (
          <Link
            key={v}
            href={`/phase3/research?view=${v}`}
            className={`px-4 py-2 text-sm rounded-md font-mono transition-colors ${
              view === v
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {v}
          </Link>
        ))}
      </div>

      <div className="mb-5">
        <Suspense fallback={<div className="h-8" />}>
          {view === 'draws' && (
            <FilterBar
              fields={[
                { key: 'label', label: 'Label', options: ['midday', 'evening'], placeholder: 'All' },
                { key: 'digit_root', label: 'Digit Root', options: DIGIT_ROOTS, placeholder: 'Any root' },
                { key: 'doubles_only', label: 'Doubles', options: ['true'], placeholder: 'Any' },
                { key: 'leading_zero_only', label: 'Leading Zero', options: ['true'], placeholder: 'Any' },
              ]}
            />
          )}
          {view === 'overlays' && (
            <FilterBar
              fields={[
                { key: 'label', label: 'Label', options: ['midday', 'evening'], placeholder: 'All' },
                { key: 'moon_sign', label: 'Moon Sign', options: ZODIAC, placeholder: 'Any sign' },
                { key: 'sun_sign', label: 'Sun Sign', options: ZODIAC, placeholder: 'Any sign' },
                { key: 'moon_phase', label: 'Moon Phase', options: PHASES, placeholder: 'Any phase' },
                { key: 'is_waxing', label: 'Waxing', options: ['true', 'false'], placeholder: 'Any' },
              ]}
            />
          )}
          {view === 'features' && (
            <FilterBar
              fields={[
                { key: 'label', label: 'Label', options: ['midday', 'evening'], placeholder: 'All' },
                { key: 'weekday', label: 'Weekday', options: WEEKDAYS, placeholder: 'Any' },
                { key: 'ruler', label: 'Ruler', options: RULERS, placeholder: 'Any' },
                { key: 'digit_root', label: 'Digit Root', options: DIGIT_ROOTS, placeholder: 'Any' },
                { key: 'moon_sign', label: 'Moon Sign', options: ZODIAC, placeholder: 'Any' },
                { key: 'doubles_only', label: 'Doubles Only', options: ['true'], placeholder: 'Any' },
              ]}
            />
          )}
          {view === 'evidence' && (
            <FilterBar
              fields={[
                { key: 'result', label: 'Result', options: ['support','contradiction','neutral','inconclusive'], placeholder: 'Any' },
                { key: 'label', label: 'Label', options: ['midday', 'evening'], placeholder: 'Any' },
                { key: 'trigger_met', label: 'Trigger', options: ['true', 'false', 'null'], placeholder: 'Any' },
              ]}
            />
          )}
        </Suspense>
      </div>

      <div className="mb-4 text-sm text-gray-500 font-mono">
        {resultCount} result{resultCount !== 1 ? 's' : ''}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {view === 'draws' && <DrawTable draws={draws} />}

        {view === 'overlays' && (
          <div className="overflow-x-auto">
            {overlays.length === 0 ? (
              <p className="text-gray-600 text-sm py-8 text-center">No overlays match.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Date', 'Label', 'Moon Phase', 'Moon Sign', 'Sun Sign', 'Waxing', 'Illum.', ''].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs text-gray-600 font-mono font-normal uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {overlays.map((o) => (
                    <tr key={o.overlay_id as string} className="hover:bg-gray-800/30">
                      <td className="px-3 py-2.5 font-mono text-gray-200">{o.draw_date as string}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{o.draw_label as string}</td>
                      <td className="px-3 py-2.5 text-sky-300 text-xs">{o.moon_phase_name as string}</td>
                      <td className="px-3 py-2.5 font-mono text-indigo-300">{o.moon_sign as string}</td>
                      <td className="px-3 py-2.5 font-mono text-amber-300">{o.sun_sign as string}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">
                        {(o.is_waxing as boolean) ? <span className="text-green-400">↑</span> : <span className="text-rose-400">↓</span>}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-400">
                        {typeof o.moon_illumination_fraction === 'number' ? `${Math.round((o.moon_illumination_fraction as number)*100)}%` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Link href={`/phase2/draws/${o.draw_id}`} className="text-xs text-indigo-400 hover:text-indigo-300 font-mono">draw →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {view === 'features' && (
          <div className="overflow-x-auto">
            {features.length === 0 ? (
              <p className="text-gray-600 text-sm py-8 text-center">No features match.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Date', 'Label', 'Result', 'Weekday', 'Ruler', 'Sum', 'Root', 'Moon Sign', 'Phase', 'Flags', ''].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs text-gray-600 font-mono font-normal uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {features.map((f) => (
                    <tr key={f.feature_doc_id as string} className="hover:bg-gray-800/30">
                      <td className="px-3 py-2.5 font-mono text-gray-200">{f.draw_date as string}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{f.draw_label as string}</td>
                      <td className="px-3 py-2.5 font-mono text-indigo-300 font-bold tracking-widest">{f.result_padded as string}</td>
                      <td className="px-3 py-2.5 text-gray-300 text-xs">{f.weekday_name as string}</td>
                      <td className="px-3 py-2.5 font-mono text-xs text-amber-300">{f.weekday_ruler as string}</td>
                      <td className="px-3 py-2.5 font-mono text-indigo-200 font-semibold">{String(f.digit_sum ?? '—')}</td>
                      <td className="px-3 py-2.5 font-mono text-violet-300 font-semibold">{String(f.digit_root ?? '—')}</td>
                      <td className="px-3 py-2.5 font-mono text-sky-300 text-xs">{f.moon_sign as string}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{f.moon_phase_name as string}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {(f.is_triple as boolean) && <span className="text-violet-400 mr-1">T</span>}
                        {(f.is_double as boolean) && <span className="text-sky-400 mr-1">D</span>}
                        {(f.is_fibonacci_result as boolean) && <span className="text-green-400">F</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Link href={`/phase2/draws/${f.draw_id}`} className="text-xs text-indigo-400 hover:text-indigo-300 font-mono">draw →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {view === 'evidence' && <EvidenceTable evidence={evidence} />}
      </div>
    </div>
  );
}
