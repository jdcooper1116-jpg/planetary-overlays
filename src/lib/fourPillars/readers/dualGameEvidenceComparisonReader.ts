import { getAdminDb } from '@/lib/firebase/admin';
import { interpretPick4EvidenceAudit } from '../interpretation/pick4EvidenceInterpretation';
import { readPick4EvidenceAudit } from './pick4EvidenceAuditReader';
import type { ControlledEvidenceWindowId, ControlledPilotGameId } from './pilotConstants';
import {
  CONTROLLED_PILOT_GAME_CONFIGS,
  NY_PICK4_GAME_ID,
  PILOT_GAME_ID,
  resolveControlledPilotDateRange,
  serializeDoc,
} from './pilotConstants';

type EvidenceResult = 'support' | 'contradiction' | 'neutral' | 'inconclusive';
type ForecastPolicy = 'enabled_governed' | 'disabled_research_backtest_only';

export interface HypothesisEvidenceComparison {
  hypothesis_id: string;
  title: string | null;
  game_ids: string[];
  total_evidence_records: number;
  support_count: number;
  contradiction_count: number;
  neutral_count: number;
  inconclusive_count: number;
  trigger_fired_count: number;
  support_rate: number | null;
}

export interface GameEvidenceComparisonSummary {
  game_id: ControlledPilotGameId;
  display_name: string;
  date_from: string;
  date_to: string;
  total_evidence_records: number;
  hypothesis_count: number;
  support_count: number;
  contradiction_count: number;
  neutral_count: number;
  inconclusive_count: number;
  trigger_fired_count: number;
  support_rate_triggered: number | null;
  average_support_rate_among_triggered_hypotheses: number | null;
  strongest_hypothesis: HypothesisEvidenceComparison | null;
  weakest_hypothesis: HypothesisEvidenceComparison | null;
  forecast_runs: number;
  forecast_policy: ForecastPolicy;
  hypotheses: HypothesisEvidenceComparison[];
}

export interface DualGameEvidenceComparisonResult {
  comparison_id: 'phase6n_dual_game_evidence_comparison';
  comparison_scope: {
    expansion_window_id: ControlledEvidenceWindowId;
    date_from: string;
    date_to: string;
    game_ids: [typeof PILOT_GAME_ID, typeof NY_PICK4_GAME_ID];
  };
  guardrails: {
    mutates_firestore: false;
    forecasts_enabled: false;
    pick4_forecasts_enabled: false;
    hypotheses_seeded: false;
    hypotheses_approved_or_promoted: false;
    new_states_added: false;
  };
  games: {
    [PILOT_GAME_ID]: GameEvidenceComparisonSummary;
    [NY_PICK4_GAME_ID]: GameEvidenceComparisonSummary;
  };
  pick4_interpretation_summary: {
    forecasts_enabled: false;
    libra_moon: {
      hypothesis_id: 'hyp_p4_libra_moon_digit4_even';
      interpretation_status: string | null;
      forecast_ready: false;
      support_rate: number | null;
      trigger_fired_count: number | null;
      recommended_action: string | null;
    };
  };
  comparison_notes: string[];
}

export interface DualGameEvidenceComparisonInput {
  expansion_window_id?: unknown;
  date_from?: unknown;
  date_to?: unknown;
}

const GAME_IDS = [PILOT_GAME_ID, NY_PICK4_GAME_ID] as const;

function emptyCounts(): Record<EvidenceResult, number> {
  return {
    support: 0,
    contradiction: 0,
    neutral: 0,
    inconclusive: 0,
  };
}

function supportRate(support: number, triggerFired: number): number | null {
  return triggerFired > 0 ? parseFloat((support / triggerFired).toFixed(4)) : null;
}

function compareHypotheses(
  a: HypothesisEvidenceComparison,
  b: HypothesisEvidenceComparison,
  direction: 'strongest' | 'weakest'
): number {
  const aRate = a.support_rate ?? (direction === 'strongest' ? -1 : 2);
  const bRate = b.support_rate ?? (direction === 'strongest' ? -1 : 2);
  if (aRate !== bRate) {
    return direction === 'strongest' ? bRate - aRate : aRate - bRate;
  }
  if (a.trigger_fired_count !== b.trigger_fired_count) {
    return b.trigger_fired_count - a.trigger_fired_count;
  }
  return a.hypothesis_id.localeCompare(b.hypothesis_id);
}

async function readGameComparison(
  gameId: (typeof GAME_IDS)[number],
  date_from: string,
  date_to: string
): Promise<GameEvidenceComparisonSummary> {
  const db = getAdminDb();
  const config = CONTROLLED_PILOT_GAME_CONFIGS[gameId];

  const [evidenceSnap, hypothesisSnap, forecastCount] = await Promise.all([
    db.collection('evidence_tracker').where('game_id', '==', gameId).get(),
    db.collection('hypothesis_registry').where('game_ids', 'array-contains', gameId).get(),
    db.collection('forecast_runs').where('game_id', '==', gameId).count().get(),
  ]);

  const hypothesesById = new Map(
    hypothesisSnap.docs.map((doc) => [doc.id, serializeDoc(doc.data())] as const)
  );
  const evidence = evidenceSnap.docs
    .map((doc) => serializeDoc(doc.data()))
    .filter((ev) => {
      const drawDate = ev.draw_date;
      return typeof drawDate === 'string' && drawDate >= date_from && drawDate <= date_to;
    });

  const evidenceByHypothesis = new Map<string, Record<string, unknown>[]>();
  for (const ev of evidence) {
    const hypothesisId = ev.hypothesis_id as string;
    const bucket = evidenceByHypothesis.get(hypothesisId) ?? [];
    bucket.push(ev);
    evidenceByHypothesis.set(hypothesisId, bucket);
  }

  const hypotheses: HypothesisEvidenceComparison[] = Array.from(evidenceByHypothesis.entries())
    .map(([hypothesisId, rows]) => {
      const counts = emptyCounts();
      for (const row of rows) {
        const result = row.result as EvidenceResult;
        if (result in counts) counts[result]++;
      }

      const trigger_fired_count = counts.support + counts.contradiction;
      const hyp = hypothesesById.get(hypothesisId);

      return {
        hypothesis_id: hypothesisId,
        title: (hyp?.title as string | undefined) ?? null,
        game_ids: (hyp?.game_ids as string[] | undefined) ?? [gameId],
        total_evidence_records: rows.length,
        support_count: counts.support,
        contradiction_count: counts.contradiction,
        neutral_count: counts.neutral,
        inconclusive_count: counts.inconclusive,
        trigger_fired_count,
        support_rate: supportRate(counts.support, trigger_fired_count),
      };
    })
    .sort((a, b) => a.hypothesis_id.localeCompare(b.hypothesis_id));

  const support_count = hypotheses.reduce((sum, h) => sum + h.support_count, 0);
  const contradiction_count = hypotheses.reduce((sum, h) => sum + h.contradiction_count, 0);
  const neutral_count = hypotheses.reduce((sum, h) => sum + h.neutral_count, 0);
  const inconclusive_count = hypotheses.reduce((sum, h) => sum + h.inconclusive_count, 0);
  const trigger_fired_count = support_count + contradiction_count;
  const triggeredHypotheses = hypotheses.filter((h) => h.trigger_fired_count > 0);
  const averageSupportRate =
    triggeredHypotheses.length > 0
      ? parseFloat(
          (
            triggeredHypotheses.reduce((sum, h) => sum + (h.support_rate ?? 0), 0) /
            triggeredHypotheses.length
          ).toFixed(4)
        )
      : null;

  return {
    game_id: gameId,
    display_name: config.display_name,
    date_from,
    date_to,
    total_evidence_records: evidence.length,
    hypothesis_count: hypotheses.length,
    support_count,
    contradiction_count,
    neutral_count,
    inconclusive_count,
    trigger_fired_count,
    support_rate_triggered: supportRate(support_count, trigger_fired_count),
    average_support_rate_among_triggered_hypotheses: averageSupportRate,
    strongest_hypothesis:
      triggeredHypotheses.length > 0
        ? triggeredHypotheses.slice().sort((a, b) => compareHypotheses(a, b, 'strongest'))[0]
        : null,
    weakest_hypothesis:
      triggeredHypotheses.length > 0
        ? triggeredHypotheses.slice().sort((a, b) => compareHypotheses(a, b, 'weakest'))[0]
        : null,
    forecast_runs: forecastCount.data().count,
    forecast_policy:
      gameId === PILOT_GAME_ID ? 'enabled_governed' : 'disabled_research_backtest_only',
    hypotheses,
  };
}

export async function readDualGameEvidenceComparison(
  input: DualGameEvidenceComparisonInput = {}
): Promise<DualGameEvidenceComparisonResult> {
  const dateRange = resolveControlledPilotDateRange({
    expansion_window_id: input.expansion_window_id,
    date_from: input.date_from,
    date_to: input.date_to,
  });

  const [pick3, pick4, pick4Audit] = await Promise.all([
    readGameComparison(PILOT_GAME_ID, dateRange.date_from, dateRange.date_to),
    readGameComparison(NY_PICK4_GAME_ID, dateRange.date_from, dateRange.date_to),
    readPick4EvidenceAudit({
      expansion_window_id: dateRange.window_id,
      date_from: dateRange.date_from,
      date_to: dateRange.date_to,
    }),
  ]);
  const pick4Interpretation = interpretPick4EvidenceAudit(pick4Audit);
  const libraMoon = pick4Interpretation.interpretations.find(
    (item) => item.hypothesis_id === 'hyp_p4_libra_moon_digit4_even'
  );

  return {
    comparison_id: 'phase6n_dual_game_evidence_comparison',
    comparison_scope: {
      expansion_window_id: dateRange.window_id,
      date_from: dateRange.date_from,
      date_to: dateRange.date_to,
      game_ids: [PILOT_GAME_ID, NY_PICK4_GAME_ID],
    },
    guardrails: {
      mutates_firestore: false,
      forecasts_enabled: false,
      pick4_forecasts_enabled: false,
      hypotheses_seeded: false,
      hypotheses_approved_or_promoted: false,
      new_states_added: false,
    },
    games: {
      [PILOT_GAME_ID]: pick3,
      [NY_PICK4_GAME_ID]: pick4,
    },
    pick4_interpretation_summary: {
      forecasts_enabled: false,
      libra_moon: {
        hypothesis_id: 'hyp_p4_libra_moon_digit4_even',
        interpretation_status: libraMoon?.interpretation_status ?? null,
        forecast_ready: false,
        support_rate: libraMoon?.support_rate ?? null,
        trigger_fired_count: libraMoon?.trigger_fired_count ?? null,
        recommended_action: libraMoon?.recommended_action ?? null,
      },
    },
    comparison_notes: [
      'Pick 3 and Pick 4 are compared by aggregate evidence behavior, not by shared hypothesis IDs.',
      `Both games use the same NY ${dateRange.date_from} through ${dateRange.date_to} date window and draw labels.`,
      'Pick 4 forecast runs remain disabled and are not part of the outcome comparison.',
    ],
  };
}
