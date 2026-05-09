'use client';

import { useEffect, useState } from 'react';

const EXPANSION_WINDOW_ID = 'ny_dual_game_jan_mar_2024';

type HypothesisSummary = {
  hypothesis_id: string;
  title: string | null;
  support_rate: number | null;
  trigger_fired_count: number;
};

type Pick4Refinement = {
  hypothesis_id: string;
  title: string | null;
  classification:
    | 'keep_testing'
    | 'promising_needs_larger_window'
    | 'weak_retest_before_retirement'
    | 'candidate_for_retirement_later';
  classification_reason: string;
  recommended_action: string;
  forecast_ready: false;
  total_evidence_records: number;
  support_count: number;
  contradiction_count: number;
  neutral_count: number;
  trigger_fired_count: number;
  support_rate: number | null;
};

type RefinementPlan = {
  ok: true;
  scope: {
    expansion_window_id: string;
    date_from: string;
    date_to: string;
  };
  pick3_summary: {
    game_id: string;
    total_evidence_records: number;
    hypothesis_count: number;
    trigger_fired_count: number;
    support_rate_triggered: number | null;
    strongest_hypothesis: HypothesisSummary | null;
    weakest_hypothesis: HypothesisSummary | null;
    forecast_policy: string;
  };
  pick4_summary: {
    game_id: string;
    total_evidence_records: number;
    hypothesis_count: number;
    trigger_fired_count: number;
    support_rate_triggered: number | null;
    forecast_runs: number;
    forecast_policy: string;
    forecast_ready: false;
  };
  pick4_refinements: Pick4Refinement[];
  next_batch_proposals: Array<{
    proposal_id: string;
    title: string;
    rationale: string;
    status: string;
  }>;
  research_direction: string[];
};

const BADGE_CLASS =
  'rounded border border-amber-800/50 bg-amber-950/30 px-2 py-1 text-xs font-mono text-amber-300';

const CLASSIFICATION_STYLE: Record<Pick4Refinement['classification'], string> = {
  keep_testing: 'border-sky-800/50 bg-sky-950/20 text-sky-300',
  promising_needs_larger_window: 'border-emerald-800/50 bg-emerald-950/20 text-emerald-300',
  weak_retest_before_retirement: 'border-amber-800/50 bg-amber-950/20 text-amber-300',
  candidate_for_retirement_later: 'border-rose-800/50 bg-rose-950/20 text-rose-300',
};

function pct(value: number | null): string {
  return value === null ? '-' : `${Math.round(value * 100)}%`;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded bg-gray-800/50 p-2 text-center">
      <div className="font-mono text-sm font-bold tabular-nums text-gray-100">{value}</div>
      <div className="font-mono text-xs text-gray-700">{label}</div>
    </div>
  );
}

function Pick3HypothesisNote({
  label,
  hypothesis,
}: {
  label: string;
  hypothesis: HypothesisSummary | null;
}) {
  return (
    <div className="rounded border border-gray-800 bg-gray-950/50 px-3 py-3">
      <div className="mb-1 font-mono text-xs text-gray-600">{label}</div>
      {hypothesis ? (
        <>
          <div className="font-mono text-xs text-indigo-300">{hypothesis.hypothesis_id}</div>
          <div className="mt-1 text-sm text-gray-300">{hypothesis.title ?? 'Untitled'}</div>
          <div className="mt-2 font-mono text-xs text-gray-600">
            support_rate {pct(hypothesis.support_rate)} / fired {hypothesis.trigger_fired_count}
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-700">No trigger-fired evidence.</div>
      )}
    </div>
  );
}

function Pick4RefinementCard({ refinement }: { refinement: Pick4Refinement }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 font-mono text-xs text-gray-600">{refinement.hypothesis_id}</div>
          <div className="text-sm font-semibold text-gray-100">
            {refinement.title ?? 'Untitled'}
          </div>
        </div>
        <div
          className={`rounded border px-3 py-2 font-mono text-xs ${CLASSIFICATION_STYLE[refinement.classification]}`}
        >
          {refinement.classification}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-6">
        <Metric label="evidence" value={refinement.total_evidence_records} />
        <Metric label="support" value={refinement.support_count} />
        <Metric label="contradict" value={refinement.contradiction_count} />
        <Metric label="neutral" value={refinement.neutral_count} />
        <Metric label="triggered" value={refinement.trigger_fired_count} />
        <Metric label="support rate" value={pct(refinement.support_rate)} />
      </div>

      <div className="rounded border border-gray-800 bg-gray-950/50 px-3 py-3">
        <p className="text-sm text-gray-300">{refinement.classification_reason}</p>
        <div className="mt-2 font-mono text-xs text-gray-500">
          recommended_action: {refinement.recommended_action}
          <span className="mx-2 text-gray-700">/</span>
          forecast_ready: {String(refinement.forecast_ready)}
        </div>
      </div>
    </div>
  );
}

export default function HypothesisRefinementPlanPage() {
  const [plan, setPlan] = useState<RefinementPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        const res = await fetch(
          `/api/four-pillars/hypothesis-refinement-plan?expansion_window_id=${EXPANSION_WINDOW_ID}`,
          { cache: 'no-store' }
        );
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok || body.ok !== true) {
          setError(body.error ?? `Request failed with status ${res.status}`);
          return;
        }
        setPlan(body as RefinementPlan);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    }

    loadPlan();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-6xl px-8 py-8">
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-100">
          Hypothesis Refinement Plan
        </h1>
        <p className="text-sm text-gray-500">
          Read-only Jan-Mar evidence refinement for NY Pick 3 and Pick 4 research direction.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span className={BADGE_CLASS}>No data mutation</span>
        <span className={BADGE_CLASS}>Pick 4 forecasts disabled</span>
        <span className={BADGE_CLASS}>No hypotheses seeded</span>
        <span className={BADGE_CLASS}>No approvals or promotions</span>
        <span className={BADGE_CLASS}>No new states</span>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-800/50 bg-rose-950/20 px-5 py-4 text-sm text-rose-200">
          {error}
        </div>
      ) : !plan ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 font-mono text-sm text-gray-500">
          Loading refinement plan...
        </div>
      ) : (
        <>
          <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
            <div className="mb-1 font-mono text-xs text-gray-600">refinement_scope</div>
            <div className="text-sm font-semibold text-gray-200">
              {plan.scope.expansion_window_id}: {plan.scope.date_from} to {plan.scope.date_to}
            </div>
          </div>

          <div className="mb-8 grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-xs text-gray-600">
                    {plan.pick3_summary.game_id}
                  </div>
                  <div className="text-sm font-semibold text-gray-100">Pick 3 Evidence Context</div>
                </div>
                <div className="rounded border border-indigo-800/40 bg-indigo-950/30 px-3 py-2 font-mono text-xs text-indigo-200">
                  {plan.pick3_summary.forecast_policy}
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                <Metric label="evidence" value={plan.pick3_summary.total_evidence_records} />
                <Metric label="hypotheses" value={plan.pick3_summary.hypothesis_count} />
                <Metric label="triggered" value={plan.pick3_summary.trigger_fired_count} />
                <Metric
                  label="support rate"
                  value={pct(plan.pick3_summary.support_rate_triggered)}
                />
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <Pick3HypothesisNote
                  label="strongest hypothesis"
                  hypothesis={plan.pick3_summary.strongest_hypothesis}
                />
                <Pick3HypothesisNote
                  label="weakest hypothesis"
                  hypothesis={plan.pick3_summary.weakest_hypothesis}
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-xs text-gray-600">
                    {plan.pick4_summary.game_id}
                  </div>
                  <div className="text-sm font-semibold text-gray-100">
                    Pick 4 Refinement Context
                  </div>
                </div>
                <div className="rounded border border-amber-800/50 bg-amber-950/30 px-3 py-2 font-mono text-xs text-amber-300">
                  forecasts disabled
                </div>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                <Metric label="evidence" value={plan.pick4_summary.total_evidence_records} />
                <Metric label="hypotheses" value={plan.pick4_summary.hypothesis_count} />
                <Metric label="triggered" value={plan.pick4_summary.trigger_fired_count} />
                <Metric
                  label="support rate"
                  value={pct(plan.pick4_summary.support_rate_triggered)}
                />
              </div>
              <div className="rounded border border-gray-800 bg-gray-950/50 px-3 py-3 font-mono text-xs text-gray-500">
                forecast_policy: {plan.pick4_summary.forecast_policy}
                <span className="mx-2 text-gray-700">/</span>
                forecast_ready: {String(plan.pick4_summary.forecast_ready)}
                <span className="mx-2 text-gray-700">/</span>
                forecast_runs: {plan.pick4_summary.forecast_runs}
              </div>
            </div>
          </div>

          <div className="mb-8 space-y-4">
            <h2 className="text-sm font-semibold text-gray-200">
              Pick 4 Hypothesis Classifications
            </h2>
            {plan.pick4_refinements.map((refinement) => (
              <Pick4RefinementCard key={refinement.hypothesis_id} refinement={refinement} />
            ))}
          </div>

          <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-200">Next-Batch Proposal Ideas</h2>
              <p className="text-xs text-gray-600">
                Proposal-only ideas. Nothing here is seeded, approved, promoted, or forecast-enabled.
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {plan.next_batch_proposals.map((proposal) => (
                <div
                  key={proposal.proposal_id}
                  className="rounded border border-gray-800 bg-gray-950/50 px-3 py-3"
                >
                  <div className="mb-1 font-mono text-xs text-gray-600">
                    {proposal.proposal_id}
                  </div>
                  <div className="text-sm font-semibold text-gray-200">{proposal.title}</div>
                  <p className="mt-1 text-sm text-gray-500">{proposal.rationale}</p>
                  <div className="mt-2 font-mono text-xs text-amber-300">{proposal.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-200">Research Direction</h2>
            <ul className="space-y-2 text-sm text-gray-500">
              {plan.research_direction.map((note) => (
                <li key={note}>- {note}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
