import { readPick4EvidenceAudit } from '@/lib/fourPillars/readers/pick4EvidenceAuditReader';

export const revalidate = 0;

type Pick4Audit = Awaited<ReturnType<typeof readPick4EvidenceAudit>>;
type Pick4AuditRecord = Pick4Audit['records'][number];
type Pick4AuditSample = Pick4AuditRecord['sample_supporting_draws'][number];

const BADGE_CLASS =
  'rounded border border-amber-800/50 bg-amber-950/30 px-2 py-1 text-xs font-mono text-amber-300';

function pct(value: number | null): string {
  return value === null ? '-' : `${Math.round(value * 100)}%`;
}

function SampleDrawList({
  title,
  draws,
  tone,
}: {
  title: string;
  draws: Pick4AuditSample[];
  tone: 'support' | 'contradiction';
}) {
  const color = tone === 'support' ? 'text-emerald-300' : 'text-rose-300';

  return (
    <div>
      <div className={`mb-2 text-xs font-mono ${color}`}>{title}</div>
      {draws.length === 0 ? (
        <div className="rounded border border-gray-800 bg-gray-950/50 px-3 py-3 text-xs text-gray-700">
          No sample draws.
        </div>
      ) : (
        <div className="space-y-2">
          {draws.map((draw) => (
            <div
              key={draw.evidence_id}
              className="rounded border border-gray-800 bg-gray-950/50 px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-gray-400">
                  {draw.draw_date} {draw.draw_label}
                </span>
                <span className="font-mono text-sm font-bold tracking-widest text-indigo-200">
                  {draw.result_padded ?? '-'}
                </span>
              </div>
              <div className="mt-1 font-mono text-xs text-gray-700">
                trigger:{' '}
                <span className="text-gray-500">{String(draw.trigger_met)}</span>
                <span className="mx-2 text-gray-800">/</span>
                outcome:{' '}
                <span className="text-gray-500">{String(draw.outcome_met)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  cls = 'text-gray-200',
}: {
  label: string;
  value: string | number;
  cls?: string;
}) {
  return (
    <div className="rounded bg-gray-800/50 p-2 text-center">
      <div className={`font-mono text-sm font-bold tabular-nums ${cls}`}>{value}</div>
      <div className="font-mono text-xs text-gray-700">{label}</div>
    </div>
  );
}

function HypothesisCard({ record }: { record: Pick4AuditRecord }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 font-mono text-xs text-gray-600">{record.hypothesis_id}</div>
          <div className="mb-2 text-sm font-semibold text-gray-100">{record.title}</div>
          <div className="flex flex-wrap gap-2 font-mono text-xs">
            <span className="text-gray-600">game_ids: {record.game_ids.join(', ')}</span>
            <span className="text-gray-700">status: {record.status ?? '-'}</span>
            <span className="text-gray-700">
              forecast_approved: {String(record.forecast_approved)}
            </span>
          </div>
        </div>
        <div className="rounded border border-indigo-800/40 bg-indigo-950/30 px-3 py-2 text-center">
          <div className="font-mono text-lg font-bold text-indigo-200">
            {pct(record.support_rate)}
          </div>
          <div className="font-mono text-xs text-gray-600">support rate</div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-6">
        <Metric label="evidence" value={record.total_evidence_records} cls="text-indigo-200" />
        <Metric label="support" value={record.support_count} cls="text-emerald-300" />
        <Metric label="contradict" value={record.contradiction_count} cls="text-rose-300" />
        <Metric
          label="neutral/inc"
          value={record.neutral_or_inconclusive_count}
          cls="text-gray-400"
        />
        <Metric label="triggered" value={record.trigger_fired_count} cls="text-sky-300" />
        <Metric label="inconclusive" value={record.inconclusive_count} cls="text-amber-300" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SampleDrawList
          title="sample supporting draws"
          draws={record.sample_supporting_draws}
          tone="support"
        />
        <SampleDrawList
          title="sample contradicting draws"
          draws={record.sample_contradicting_draws}
          tone="contradiction"
        />
      </div>
    </div>
  );
}

export default async function Pick4EvidenceReviewPage() {
  const audit = await readPick4EvidenceAudit();

  return (
    <div className="max-w-6xl px-8 py-8">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-100">Pick 4 Evidence Review</h1>
        <p className="text-sm text-gray-500">
          NY Pick 4 starter hypothesis audit for the controlled January 2024 pilot.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span className={BADGE_CLASS}>Research/backtest only</span>
        <span className={BADGE_CLASS}>Forecasts disabled</span>
        <span className={BADGE_CLASS}>No hypotheses auto-approved</span>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
          <div className="font-mono text-2xl font-bold tabular-nums text-indigo-300">
            {audit.hypothesis_count}
          </div>
          <div className="font-mono text-xs text-gray-500">total hypotheses</div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
          <div className="font-mono text-2xl font-bold tabular-nums text-sky-300">
            {audit.total_evidence_records}
          </div>
          <div className="font-mono text-xs text-gray-500">evidence records</div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
          <div className="font-mono text-sm font-semibold text-gray-200">
            {audit.pilot_scope.game_id}
          </div>
          <div className="font-mono text-xs text-gray-500">pilot game</div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
          <div className="font-mono text-sm font-semibold text-gray-200">
            {audit.pilot_scope.date_from} to {audit.pilot_scope.date_to}
          </div>
          <div className="font-mono text-xs text-gray-500">pilot window</div>
        </div>
      </div>

      <div className="space-y-4">
        {audit.records.map((record) => (
          <HypothesisCard key={record.hypothesis_id} record={record} />
        ))}
      </div>
    </div>
  );
}
