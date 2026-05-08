import JobRunnerCard from '@/components/phase3/JobRunnerCard';
import { readRecentJobs } from '@/lib/fourPillars/readers/forecastDebugReader';
import {
  NY_PICK4_ENGINE_GAME,
  NY_PICK4_GAME_ID,
  PILOT_DATE_FROM,
  PILOT_DATE_TO,
  PILOT_STATE,
} from '@/lib/fourPillars/readers/pilotConstants';

type JobCard = {
  title: string;
  description: string;
  endpoint: string;
  body?: Record<string, unknown>;
  color: 'indigo' | 'green' | 'amber' | 'rose' | 'sky' | 'violet' | 'emerald' | 'cyan';
  order: string;
};

export const revalidate = 0; // always fresh — shows live job state

const JOB_STATUS_COLORS: Record<string, string> = {
  completed: 'text-green-400',
  running: 'text-amber-400 animate-pulse',
  failed: 'text-rose-400',
  queued: 'text-sky-400',
  cancelled: 'text-gray-600',
};

const JOBS: JobCard[] = [
  {
    title: 'Seed Hypotheses',
    description: 'Seeds Phase 1 and Phase 3 starter hypotheses into hypothesis_registry. Idempotent — existing docs are skipped.',
    endpoint: '/api/four-pillars/jobs/run-seed-hypotheses',
    color: 'sky',
    order: 'Step 1',
  },
  {
    title: 'Build Overlays',
    description: 'Computes celestial overlays for all mirrored NY Pick 3 Jan 2024 draws. Skips draws where overlay already exists and is not stale.',
    endpoint: '/api/four-pillars/jobs/run-build-overlays',
    color: 'indigo',
    order: 'Step 2',
  },
  {
    title: 'Build Symbolic Features',
    description: 'Generates weekday, ruler, digit root, moon sign, and other symbolic features for each draw. Requires overlays to exist first.',
    endpoint: '/api/four-pillars/jobs/run-build-features',
    color: 'violet',
    order: 'Step 3',
  },
  {
    title: 'Run Backtest',
    description: 'Evaluates all active hypotheses against the 62 mirrored draws and writes append-only evidence records. Run after seeding new hypotheses.',
    endpoint: '/api/four-pillars/jobs/run-backtest',
    color: 'amber',
    order: 'Step 4',
  },
  {
    title: 'Refresh Forecast',
    description: "Generates a forecast for today's midday draw using all evidence-backed hypotheses that pass thresholds.",
    endpoint: '/api/four-pillars/jobs/run-refresh-forecast',
    color: 'green',
    order: 'Step 5',
  },
];

const NY_PICK4_PILOT_BODY = {
  game_id: NY_PICK4_GAME_ID,
  game: NY_PICK4_ENGINE_GAME,
  state: PILOT_STATE,
  date_from: PILOT_DATE_FROM,
  date_to: PILOT_DATE_TO,
};

const PICK4_JOBS: JobCard[] = [
  {
    title: 'Sync NY Pick 4 Pilot Draws',
    description: 'Internal Phase 6C pilot only. Mirrors NY Pick 4 Jan 2024 from the canonical Railway lottery-engine.',
    endpoint: '/api/four-pillars/sync-draws',
    body: NY_PICK4_PILOT_BODY,
    color: 'cyan',
    order: 'P4 Step 1',
  },
  {
    title: 'Build NY Pick 4 Overlays',
    description: 'Computes celestial overlays for mirrored NY Pick 4 Jan 2024 draws.',
    endpoint: '/api/four-pillars/jobs/run-build-overlays',
    body: NY_PICK4_PILOT_BODY,
    color: 'indigo',
    order: 'P4 Step 2',
  },
  {
    title: 'Build NY Pick 4 Symbolic Features',
    description: 'Builds symbolic features for NY Pick 4 Jan 2024 draws after overlays exist.',
    endpoint: '/api/four-pillars/jobs/run-build-features',
    body: NY_PICK4_PILOT_BODY,
    color: 'violet',
    order: 'P4 Step 3',
  },
  {
    title: 'Run NY Pick 4 Backtest',
    description: 'Runs evidence backtest for hypotheses explicitly scoped to ny_pick4. Expected to be empty until Pick 4 hypotheses exist.',
    endpoint: '/api/four-pillars/jobs/run-backtest',
    body: NY_PICK4_PILOT_BODY,
    color: 'amber',
    order: 'P4 Step 4',
  },
];

export default async function JobsPage() {
  const recentJobs = await readRecentJobs(15);

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-100 mb-1">Jobs</h1>
        <p className="text-sm text-gray-500">
          Run pilot pipeline steps from the UI. Each button calls the existing Phase 1 POST routes.
          Run in order for a clean backtest cycle.
        </p>
      </div>

      <div className="mb-8 bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
        <div className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-2">
          Recommended run order for a full backtest cycle
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-400">
          {JOBS.map((j, i) => (
            <span key={j.order}>
              <span className="text-indigo-400">{j.order}</span>: {j.title}
              {i < JOBS.length - 1 && <span className="text-gray-700 mx-2">→</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4 mb-10">
        {JOBS.map((j) => (
          <div key={j.endpoint}>
            <div className="text-xs text-gray-600 font-mono mb-1.5">{j.order}</div>
            <JobRunnerCard
              title={j.title}
              description={j.description}
              endpoint={j.endpoint}
              body={j.body}
              color={j.color}
              order={j.order}
            />
          </div>
        ))}
      </div>

      <div className="mb-10">
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-300 mb-1">Internal NY Pick 4 Pilot</div>
          <p className="text-xs text-gray-600 font-mono">
            Phase 6C controlled lane: NY only, Jan 2024 only, explicit body overrides only.
          </p>
        </div>
        <div className="space-y-4">
          {PICK4_JOBS.map((j) => (
            <div key={`${j.endpoint}-${j.order}`}>
              <div className="text-xs text-gray-600 font-mono mb-1.5">{j.order}</div>
              <JobRunnerCard
                title={j.title}
                description={j.description}
                endpoint={j.endpoint}
                body={j.body}
                color={j.color}
                order={j.order}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-300 mb-3">
          Recent Job Log ({recentJobs.length})
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {recentJobs.length === 0 ? (
            <p className="text-gray-600 text-sm px-5 py-6 text-center font-mono">No jobs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Job ID', 'Type', 'Status', 'Processed', 'Failed', 'Error'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs text-gray-600 font-mono font-normal uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {recentJobs.map((job) => (
                    <tr key={job.job_id as string} className="hover:bg-gray-800/30">
                      <td className="px-3 py-2 font-mono text-xs text-gray-600 max-w-[160px] truncate">
                        {job.job_id as string}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-300">
                        {job.job_type as string}
                      </td>
                      <td className={`px-3 py-2 font-mono text-xs ${JOB_STATUS_COLORS[job.status as string] ?? 'text-gray-400'}`}>
                        {job.status as string}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-400">
                        {String(job.records_processed ?? 0)}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {(job.records_failed as number) > 0 ? (
                          <span className="text-rose-400">{String(job.records_failed)}</span>
                        ) : (
                          <span className="text-gray-700">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-rose-400/80 max-w-[200px] truncate">
                        {(job.error_summary as string) ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-700 font-mono">
          Refresh the page to see updated job status after running.
        </p>
      </div>
    </div>
  );
}
