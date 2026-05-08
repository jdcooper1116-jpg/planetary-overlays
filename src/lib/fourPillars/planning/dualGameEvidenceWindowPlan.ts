import { getAdminDb } from '@/lib/firebase/admin';
import {
  CONTROLLED_PILOT_GAME_CONFIGS,
  NY_PICK4_GAME_ID,
  PILOT_DATE_FROM,
  PILOT_DATE_TO,
  PILOT_GAME_ID,
} from '../readers/pilotConstants';

type ForecastPolicy = 'enabled_governed' | 'disabled_research_backtest_only';

export interface DualGameCurrentStatus {
  game_id: typeof PILOT_GAME_ID | typeof NY_PICK4_GAME_ID;
  display_name: string;
  current_window: {
    date_from: typeof PILOT_DATE_FROM;
    date_to: typeof PILOT_DATE_TO;
  };
  draws_mirrored: number;
  overlays_built: number;
  symbolic_features_built: number;
  hypotheses_seeded: number;
  evidence_records: number;
  forecast_runs: number;
  forecast_policy: ForecastPolicy;
}

export interface DualGameEvidenceWindowPlan {
  plan_id: 'phase6l_dual_game_evidence_window_plan';
  mutates_firestore: false;
  recommended_window: {
    date_from: '2024-01-01';
    date_to: '2024-03-31';
    label: 'Jan-Mar 2024';
  };
  alternate_window: {
    date_from: '2024-01-01';
    date_to: '2024-06-30';
    label: 'Jan-Jun 2024';
    reason_not_selected: string;
  };
  recommendation_reason: string[];
  current_status: DualGameCurrentStatus[];
  phase6m_job_sequence: Array<{
    order: number;
    job: string;
    games: Array<typeof PILOT_GAME_ID | typeof NY_PICK4_GAME_ID>;
    notes: string;
  }>;
  hypotheses_to_retest: {
    [PILOT_GAME_ID]: string[];
    [NY_PICK4_GAME_ID]: string[];
  };
  comparison_plan: string[];
  guardrails: {
    no_data_mutation_in_phase6l: true;
    no_new_states: true;
    no_forecasts_enabled: true;
    pick4_forecasts_enabled: false;
    no_hypothesis_approvals_or_promotions: true;
    no_new_hypotheses_seeded: true;
    lottery_engine_contract_unchanged: true;
  };
}

const GAME_IDS = [PILOT_GAME_ID, NY_PICK4_GAME_ID] as const;

async function readGameStatus(
  gameId: (typeof GAME_IDS)[number]
): Promise<DualGameCurrentStatus> {
  const db = getAdminDb();
  const config = CONTROLLED_PILOT_GAME_CONFIGS[gameId];

  const [
    drawsCount,
    overlaysCount,
    featuresCount,
    hypothesisCount,
    evidenceCount,
    forecastCount,
  ] = await Promise.all([
    db
      .collection('draws')
      .where('game_id', '==', gameId)
      .where('draw_date', '>=', PILOT_DATE_FROM)
      .where('draw_date', '<=', PILOT_DATE_TO)
      .count()
      .get(),
    db
      .collection('celestial_overlays')
      .where('game_id', '==', gameId)
      .where('draw_date', '>=', PILOT_DATE_FROM)
      .where('draw_date', '<=', PILOT_DATE_TO)
      .count()
      .get(),
    db
      .collection('draw_symbolic_features')
      .where('game_id', '==', gameId)
      .where('draw_date', '>=', PILOT_DATE_FROM)
      .where('draw_date', '<=', PILOT_DATE_TO)
      .count()
      .get(),
    db
      .collection('hypothesis_registry')
      .where('game_ids', 'array-contains', gameId)
      .count()
      .get(),
    db.collection('evidence_tracker').where('game_id', '==', gameId).count().get(),
    db.collection('forecast_runs').where('game_id', '==', gameId).count().get(),
  ]);

  return {
    game_id: gameId,
    display_name: config.display_name,
    current_window: {
      date_from: PILOT_DATE_FROM,
      date_to: PILOT_DATE_TO,
    },
    draws_mirrored: drawsCount.data().count,
    overlays_built: overlaysCount.data().count,
    symbolic_features_built: featuresCount.data().count,
    hypotheses_seeded: hypothesisCount.data().count,
    evidence_records: evidenceCount.data().count,
    forecast_runs: forecastCount.data().count,
    forecast_policy:
      gameId === PILOT_GAME_ID ? 'enabled_governed' : 'disabled_research_backtest_only',
  };
}

export async function readDualGameEvidenceWindowPlan(): Promise<DualGameEvidenceWindowPlan> {
  const current_status = await Promise.all(GAME_IDS.map((gameId) => readGameStatus(gameId)));

  return {
    plan_id: 'phase6l_dual_game_evidence_window_plan',
    mutates_firestore: false,
    recommended_window: {
      date_from: '2024-01-01',
      date_to: '2024-03-31',
      label: 'Jan-Mar 2024',
    },
    alternate_window: {
      date_from: '2024-01-01',
      date_to: '2024-06-30',
      label: 'Jan-Jun 2024',
      reason_not_selected:
        'Jan-Jun is useful later, but Jan-Mar is the lower-risk next step for proving dual-game indexes, audits, and backtests before a larger data expansion.',
    },
    recommendation_reason: [
      'Jan-Mar expands the current pilot from one month to three months while keeping the next run operationally small.',
      'Both NY games share jurisdiction, draw labels, and draw timing, so the same celestial and calendar contexts can be compared across games.',
      'The larger window should materially increase trigger-fired counts for sparse Pick 4 hypotheses without jumping directly to a six-month workload.',
      'Pick 4 remains research/backtest-only; this window is for evidence quality, not forecast launch.',
    ],
    current_status,
    phase6m_job_sequence: [
      {
        order: 1,
        job: 'sync_draws',
        games: [...GAME_IDS],
        notes: 'Mirror NY Pick 3 and NY Pick 4 draws for the shared Jan-Mar 2024 window from the canonical Railway lottery-engine.',
      },
      {
        order: 2,
        job: 'build_overlays',
        games: [...GAME_IDS],
        notes: 'Build celestial overlays for both games over the same draw dates and labels.',
      },
      {
        order: 3,
        job: 'build_symbolic_features',
        games: [...GAME_IDS],
        notes: 'Build digit and symbolic features after overlays exist; preserve Pick 4 string result and leading-zero handling.',
      },
      {
        order: 4,
        job: 'run_backtests',
        games: [...GAME_IDS],
        notes: 'Retest existing scoped hypotheses only; do not seed, approve, or promote hypotheses in the expansion run.',
      },
      {
        order: 5,
        job: 'audit_status',
        games: [...GAME_IDS],
        notes: 'Check draw, overlay, feature, evidence, and forecast counts for both games.',
      },
      {
        order: 6,
        job: 'compare_evidence',
        games: [...GAME_IDS],
        notes: 'Compare evidence under matched date, label, moon sign, moon phase, weekday, and ruler contexts.',
      },
    ],
    hypotheses_to_retest: {
      [PILOT_GAME_ID]: [
        'Phase 1 starter hypotheses scoped to ny_pick3',
        'Phase 3 starter hypotheses scoped to ny_pick3',
        'Existing ny_pick3 auto-generated or reviewed hypotheses under current governance rules',
      ],
      [NY_PICK4_GAME_ID]: [
        'hyp_p4_digit4_vedic_saturn_repeat',
        'hyp_p4_waning_moon_digit_sum_gte_18',
        'hyp_p4_libra_moon_digit4_even',
        'hyp_p4_mercury_day_digit_root_in_5_8',
      ],
    },
    comparison_plan: [
      'Pair both games by draw_date and draw_label so each comparison uses the same NY local draw context.',
      'Use shared celestial features such as moon_sign, moon_phase_name, is_waxing, sun_sign, weekday_name, and weekday_ruler.',
      'Compare game-specific outcomes separately: Pick 3 positional/root/sum/repeat behavior and Pick 4 fourth-digit/root/sum/repeat behavior.',
      'Do not compare Pick 4 forecast outcomes because Pick 4 forecasts remain disabled.',
    ],
    guardrails: {
      no_data_mutation_in_phase6l: true,
      no_new_states: true,
      no_forecasts_enabled: true,
      pick4_forecasts_enabled: false,
      no_hypothesis_approvals_or_promotions: true,
      no_new_hypotheses_seeded: true,
      lottery_engine_contract_unchanged: true,
    },
  };
}
