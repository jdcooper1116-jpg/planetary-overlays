import { getAdminDb } from '@/lib/firebase/admin';
import { serializeDoc, PILOT_GAME_ID } from '../readers/pilotConstants';

type PerformanceHypothesisRow = Record<string, unknown> & {
  id: string;
};

export interface HypothesisPerformanceRecord {
  hypothesis_id: string;
  title: string;
  auto_generated: boolean;
  forecast_approved: boolean;
  status: string;
  // Forecast participation
  forecasts_participated: number;
  forecasts_triggered: number;
  // Outcome breakdown
  hit_contributions: number;
  miss_contributions: number;
  neutral_count: number;
  // Rates
  hit_rate: number | null;       // hit_contributions / forecasts_triggered (when trigger fired)
  trigger_rate: number | null;   // forecasts_triggered / forecasts_participated
  // Evidence from backtesting (from hypothesis_registry)
  evidence_support_rate: number | null;
  evidence_total: number;
  evidence_trigger_fired: number;
  // Recent form (last 5 resolved forecasts)
  recent_results: Array<'hit' | 'miss' | 'neutral'>;
}

export async function computeHypothesisPerformance(
  gameId: string = PILOT_GAME_ID
): Promise<HypothesisPerformanceRecord[]> {
  const db = getAdminDb();

  // Load all resolved forecasts
  const forecastSnap = await db
    .collection('forecast_runs')
    .where('game_id', '==', gameId)
    .where('status', '==', 'resolved')
    .orderBy('generated_at', 'desc')
    .get();

  const resolvedForecasts = forecastSnap.docs.map((d) => serializeDoc(d.data()));

  // Load all eligible hypotheses (those that participated in at least one forecast)
  const hypSnap = await db
    .collection('hypothesis_registry')
    .where('game_ids', 'array-contains', gameId)
    .get();

  const hypotheses: PerformanceHypothesisRow[] = hypSnap.docs.map((d) => ({
    id: d.id,
    ...(serializeDoc(d.data()) as Record<string, unknown>),
  }));

  // Build per-hypothesis stats from resolved forecasts
  const stats = new Map<
    string,
    {
      participated: number;
      triggered: number;
      hits: number;
      misses: number;
      neutral: number;
      recent: Array<'hit' | 'miss' | 'neutral'>;
    }
  >();

  for (const hyp of hypotheses) {
    stats.set(hyp.id as string, {
      participated: 0,
      triggered: 0,
      hits: 0,
      misses: 0,
      neutral: 0,
      recent: [],
    });
  }

  for (const forecast of resolvedForecasts) {
    const used = new Set<string>(forecast.approved_hypotheses_used as string[] ?? []);
    const triggered = new Set<string>(forecast.triggered_hypotheses as string[] ?? []);
    const contributions = (
      (forecast.outcome_summary as { hypothesis_contributions?: Array<{ hypothesis_id: string; contributed_hit: boolean; contributed_miss: boolean; neutral: boolean }> } | null)
        ?.hypothesis_contributions ?? []
    );

    const contribMap = new Map(contributions.map((c) => [c.hypothesis_id, c]));

    for (const hypId of used) {
      const s = stats.get(hypId);
      if (!s) continue;

      s.participated++;

      if (triggered.has(hypId)) {
        s.triggered++;
        const contrib = contribMap.get(hypId);
        if (contrib) {
          if (contrib.contributed_hit) {
            s.hits++;
            if (s.recent.length < 5) s.recent.push('hit');
          } else if (contrib.contributed_miss) {
            s.misses++;
            if (s.recent.length < 5) s.recent.push('miss');
          } else {
            s.neutral++;
            if (s.recent.length < 5) s.recent.push('neutral');
          }
        }
      }
    }
  }

  return hypotheses.map((hyp) => {
    const s = stats.get(hyp.id as string) ?? {
      participated: 0, triggered: 0, hits: 0, misses: 0, neutral: 0, recent: [],
    };

    const hit_rate = s.triggered > 0 ? parseFloat((s.hits / s.triggered).toFixed(4)) : null;
    const trigger_rate = s.participated > 0 ? parseFloat((s.triggered / s.participated).toFixed(4)) : null;

    const evidence_total = (hyp.evidence_count_total as number) ?? 0;
    const evidence_supporting = (hyp.evidence_count_supporting as number) ?? 0;
    const evidence_contradicting = (hyp.evidence_count_contradicting as number) ?? 0;
    const evidence_trigger_fired = evidence_supporting + evidence_contradicting;
    const evidence_support_rate =
      evidence_trigger_fired > 0
        ? parseFloat((evidence_supporting / evidence_trigger_fired).toFixed(4))
        : null;

    return {
      hypothesis_id: hyp.id as string,
      title: hyp.title as string,
      auto_generated: (hyp.auto_generated as boolean) ?? false,
      forecast_approved: (hyp.forecast_approved as boolean) ?? false,
      status: hyp.status as string,
      forecasts_participated: s.participated,
      forecasts_triggered: s.triggered,
      hit_contributions: s.hits,
      miss_contributions: s.misses,
      neutral_count: s.neutral,
      hit_rate,
      trigger_rate,
      evidence_support_rate,
      evidence_total,
      evidence_trigger_fired,
      recent_results: s.recent,
    };
  });
}
