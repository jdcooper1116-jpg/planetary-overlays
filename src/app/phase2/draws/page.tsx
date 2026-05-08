import { readDraws } from '@/lib/fourPillars/readers/drawsReader';
import DrawTable from '@/components/phase2/DrawTable';
import FilterBar from '@/components/phase2/FilterBar';
import { Suspense } from 'react';
import {
  CONTROLLED_PILOT_GAME_IDS,
  PILOT_GAME_ID,
  resolveControlledPilotGameConfig,
} from '@/lib/fourPillars/readers/pilotConstants';

export const revalidate = 30;

// Generate date options for the January 2024 pilot
const PILOT_DATES = Array.from({ length: 31 }, (_, i) => {
  const d = String(i + 1).padStart(2, '0');
  return `2024-01-${d}`;
});

interface PageProps {
  searchParams: Promise<{
    game_id?: string;
    date?: string;
    label?: string;
  }>;
}

export default async function DrawsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const pilotGame = resolveControlledPilotGameConfig({ game_id: sp.game_id });
  const draws = await readDraws({
    game_id: sp.game_id,
    date: sp.date,
    label: sp.label,
  });

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Mirrored Draws</h1>
        <p className="text-sm text-gray-500">
          {pilotGame.display_name} · January 2024 ·{' '}
          <span className="text-gray-300">{draws.length} draws</span>
          {pilotGame.game_id !== PILOT_GAME_ID && (
            <span className="ml-2 text-cyan-400 font-mono">controlled audit lane</span>
          )}
        </p>
      </div>

      {/* Filter bar — must be in Suspense because useSearchParams */}
      <div className="mb-5">
        <Suspense fallback={<div className="h-8" />}>
          <FilterBar
            fields={[
              {
                key: 'game_id',
                label: 'Game',
                options: [...CONTROLLED_PILOT_GAME_IDS],
                placeholder: 'NY Pick 3 default',
              },
              { key: 'date', label: 'Date', options: PILOT_DATES, placeholder: 'All dates' },
              { key: 'label', label: 'Label', options: ['midday', 'evening', 'night'], placeholder: 'All labels' },
            ]}
          />
        </Suspense>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <DrawTable draws={draws} />
      </div>

      <p className="mt-4 text-xs text-gray-600 font-mono">
        Leading zeroes are preserved in the Result column. Click inspect → to trace a draw through the full pipeline.
      </p>
    </div>
  );
}
