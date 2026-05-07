import { readObservations, readObservationStats } from '@/lib/fourPillars/readers/observationReader';
import { PATTERN_FAMILIES } from '@/lib/fourPillars/observation/patternFamilies';
import FilterBar from '@/components/phase2/FilterBar';
import { Suspense } from 'react';
import Link from 'next/link';

export const revalidate = 30;

const LIFT_OPTIONS = ['1.2', '1.5', '2.0', '3.0'];
const FAMILY_OPTIONS = PATTERN_FAMILIES.map((f) => f.family_id);

interface PageProps {
  searchParams: { family?: string; lift_gte?: string };
}

function LiftBar({ lift }: { lift: number }) {
  const pct = Math.min(100, ((lift - 1) / 2) * 100);
  const color =
    lift >= 2.5 ? 'bg-emerald-500' :
    lift >= 2.0 ? 'bg-green-500' :
    lift >= 1.5 ? 'bg-amber-500' :
    'bg-indigo-500';
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm font-bold text-gray-100 w-12 text-right tabular-nums">
        {lift.toFixed(2)}×
      </span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function ObservationsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const [observations, stats] = await Promise.all([
    readObservations({
      family: sp.family,
      lift_gte: sp.lift_gte ? parseFloat(sp.lift_gte) : undefined,
    }),
    readObservationStats(),
  ]);

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Observation Log</h1>
        <p className="text-sm text-gray-500">
          Raw patterns detected by the Observation Engine · NY Pick 3 · Jan 2024
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-indigo-400 tabular-nums">{stats.total}</div>
          <div className="text-xs text-gray-500 font-mono">total observations</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">
            {stats.top_lift.toFixed(2)}×
          </div>
          <div className="text-xs text-gray-500 font-mono">highest lift</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-amber-400 tabular-nums">
            {stats.median_lift.toFixed(2)}×
          </div>
          <div className="text-xs text-gray-500 font-mono">median lift</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-sky-400 tabular-nums">
            {Object.keys(stats.by_family).length}
          </div>
          <div className="text-xs text-gray-500 font-mono">pattern families</div>
        </div>
      </div>

      {/* Run prompt */}
      {stats.total === 0 && (
        <div className="mb-6 bg-amber-950/30 border border-amber-800/40 rounded-lg px-5 py-4">
          <p className="text-sm text-amber-300">
            No observations yet. Go to{' '}
            <Link href="/phase4/promotion" className="underline">Phase 4 Promotion</Link>
            {' '}or use the Jobs page to run the observation scan first.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-5">
        <Suspense fallback={<div className="h-8" />}>
          <FilterBar
            fields={[
              { key: 'family', label: 'Pattern Family', options: FAMILY_OPTIONS, placeholder: 'All families' },
              { key: 'lift_gte', label: 'Min Lift', options: LIFT_OPTIONS, placeholder: 'Any lift' },
            ]}
          />
        </Suspense>
      </div>

      <div className="text-xs text-gray-600 font-mono mb-3">{observations.length} observations shown</div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {observations.length === 0 ? (
          <p className="text-gray-600 text-sm py-8 text-center">No observations match.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Pattern', 'Trigger', 'Outcome', 'Sample', 'Observed%', 'Baseline%', 'Lift', ''].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs text-gray-600 font-mono font-normal uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {observations.map((obs) => (
                  <tr key={obs.observation_id as string} className="hover:bg-gray-800/30">
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500 max-w-[140px] truncate">
                      {obs.pattern_family as string}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      <span className="text-indigo-300">{obs.trigger_field as string}</span>
                      <span className="text-gray-600">=</span>
                      <span className="text-gray-200">{obs.trigger_value as string}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      <span className="text-green-300">{obs.outcome_field as string}</span>
                      <span className="text-gray-600">=</span>
                      <span className="text-gray-200">{obs.outcome_label as string}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-400">
                      {String(obs.observed_count)}/{String(obs.sample_size)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-200">
                      {Math.round((obs.observed_rate as number) * 100)}%
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-500">
                      {Math.round((obs.baseline_rate as number) * 100)}%
                    </td>
                    <td className="px-3 py-2.5 min-w-[130px]">
                      <LiftBar lift={obs.lift as number} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/phase4/candidates?family=${obs.pattern_family}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-mono"
                      >
                        candidates →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-700 font-mono">
        Lift = observed_rate / baseline_rate. Min thresholds: lift ≥1.20, observed ≥30%, sample ≥3.
        Only observations that pass these are stored.
      </p>
    </div>
  );
}
