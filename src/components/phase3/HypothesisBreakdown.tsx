import Link from 'next/link';

interface EvidenceRow {
  evidence_id: string;
  draw_id: string;
  draw_date: string;
  draw_label: string;
  result: string;
  trigger_met: boolean | null;
  outcome_met: boolean | null;
}

interface HypothesisBreakdownProps {
  hypothesis: Record<string, unknown>;
  evidenceByResult: {
    support: EvidenceRow[];
    contradiction: EvidenceRow[];
    neutral: EvidenceRow[];
    inconclusive: EvidenceRow[];
  };
  totals: {
    support: number;
    contradiction: number;
    neutral: number;
    inconclusive: number;
    total: number;
    trigger_fired: number;
    support_rate_on_fired: number | null;
  };
}

const RESULT_STYLE: Record<string, string> = {
  support: 'text-green-300 bg-green-900/30 border-green-700/40',
  contradiction: 'text-rose-300 bg-rose-900/30 border-rose-700/40',
  neutral: 'text-gray-400 bg-gray-800/40 border-gray-700/40',
  inconclusive: 'text-amber-300 bg-amber-900/30 border-amber-700/40',
};

function EvidenceSection({
  label,
  rows,
}: {
  label: string;
  rows: EvidenceRow[];
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <div className={`text-xs font-mono uppercase tracking-wide mb-2 px-3 py-1.5 rounded border inline-block ${RESULT_STYLE[label]}`}>
        {label} ({rows.length})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {['Date', 'Label', 'Trigger', 'Outcome', ''].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs text-gray-600 font-mono font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {rows.map((ev) => (
              <tr key={ev.evidence_id} className="hover:bg-gray-800/30">
                <td className="px-3 py-2 font-mono text-xs text-gray-300">{ev.draw_date}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{ev.draw_label}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {ev.trigger_met === true ? <span className="text-green-400">✓</span>
                    : ev.trigger_met === false ? <span className="text-rose-400">✗</span>
                    : <span className="text-gray-600">—</span>}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {ev.outcome_met === true ? <span className="text-green-400">✓</span>
                    : ev.outcome_met === false ? <span className="text-rose-400">✗</span>
                    : <span className="text-gray-600">—</span>}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/phase2/draws/${ev.draw_id}`}
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
    </div>
  );
}

export default function HypothesisBreakdown({
  hypothesis,
  evidenceByResult,
  totals,
}: HypothesisBreakdownProps) {
  const barPct =
    totals.support_rate_on_fired !== null
      ? Math.round(totals.support_rate_on_fired * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Logic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-2">
            Trigger Logic
          </div>
          <pre className="text-xs text-indigo-300 font-mono bg-gray-800/60 rounded p-3 overflow-auto">
            {JSON.stringify(hypothesis.trigger_logic, null, 2)}
          </pre>
        </div>
        <div>
          <div className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-2">
            Expected Logic
          </div>
          <pre className="text-xs text-green-300 font-mono bg-gray-800/60 rounded p-3 overflow-auto">
            {JSON.stringify(hypothesis.expected_logic, null, 2)}
          </pre>
        </div>
      </div>

      {/* Counters */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg px-5 py-4">
        <div className="flex flex-wrap gap-6 mb-3">
          {[
            { label: 'total', value: totals.total, cls: 'text-gray-200' },
            { label: 'trigger fired', value: totals.trigger_fired, cls: 'text-sky-400' },
            { label: 'support', value: totals.support, cls: 'text-green-400' },
            { label: 'contradiction', value: totals.contradiction, cls: 'text-rose-400' },
            { label: 'neutral', value: totals.neutral, cls: 'text-gray-500' },
            { label: 'inconclusive', value: totals.inconclusive, cls: 'text-amber-400' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="text-center">
              <div className={`text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
              <div className="text-xs text-gray-500 font-mono">{label}</div>
            </div>
          ))}
          <div className="text-center ml-auto">
            <div className="text-2xl font-bold text-indigo-300 tabular-nums">
              {totals.support_rate_on_fired !== null
                ? `${Math.round(totals.support_rate_on_fired * 100)}%`
                : '—'}
            </div>
            <div className="text-xs text-gray-500 font-mono">support / fired</div>
          </div>
        </div>
        {totals.trigger_fired > 0 && (
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 rounded-full"
              style={{ width: `${barPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Evidence by result */}
      <div className="space-y-4">
        <EvidenceSection label="support" rows={evidenceByResult.support as EvidenceRow[]} />
        <EvidenceSection label="contradiction" rows={evidenceByResult.contradiction as EvidenceRow[]} />
        <EvidenceSection label="neutral" rows={evidenceByResult.neutral as EvidenceRow[]} />
        <EvidenceSection label="inconclusive" rows={evidenceByResult.inconclusive as EvidenceRow[]} />
      </div>
    </div>
  );
}
