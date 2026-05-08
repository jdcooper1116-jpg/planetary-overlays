import { getAdminDb } from '@/lib/firebase/admin';
import {
  PILOT_DATE_FROM,
  PILOT_DATE_TO,
  resolveControlledPilotGameConfig,
  serializeDoc,
} from './pilotConstants';

const OVERLAY_VERSION = '1.0.0';
const SYMBOLIC_VERSION = '1.0.0';

// ── Draw search with richer filters ──────────────────────────────────────────

export interface DrawSearchFilter {
  game_id?: string;
  date?: string;
  label?: string;
  result_contains?: string;   // substring match on result_padded
  doubles_only?: boolean;
  leading_zero_only?: boolean;
  digit_root?: string;        // exact digit root as string e.g. "9"
}

export async function searchDraws(filter: DrawSearchFilter = {}): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();
  const pilotGame = resolveControlledPilotGameConfig({ game_id: filter.game_id });

  const snap = await db
    .collection('draws')
    .where('game_id', '==', pilotGame.game_id)
    .where('draw_date', '>=', PILOT_DATE_FROM)
    .where('draw_date', '<=', PILOT_DATE_TO)
    .orderBy('draw_date', 'desc')
    .orderBy('draw_label', 'asc')
    .get();

  let docs = snap.docs.map((d) => serializeDoc(d.data()));

  if (filter.date) docs = docs.filter((d) => d.draw_date === filter.date);
  if (filter.label) docs = docs.filter((d) => d.draw_label === filter.label);
  if (filter.result_contains) {
    const q = filter.result_contains;
    docs = docs.filter((d) => (d.result_padded as string)?.includes(q));
  }
  if (filter.doubles_only) {
    docs = docs.filter((d) => {
      const nums = d.numbers as string[];
      if (!nums) return false;
      const freq: Record<string, number> = {};
      nums.forEach((n) => { freq[n] = (freq[n] ?? 0) + 1; });
      const vals = Object.values(freq);
      return vals.some((v) => v === 2) && !vals.some((v) => v === 3);
    });
  }
  if (filter.leading_zero_only) {
    docs = docs.filter((d) => (d.digit_1 as string) === '0');
  }
  if (filter.digit_root) {
    const dr = parseInt(filter.digit_root, 10);
    docs = docs.filter((d) => d.digit_root === dr);
  }

  return docs;
}

// ── Hypothesis detail with evidence breakdown ─────────────────────────────────

export interface HypothesisDetail {
  hypothesis: Record<string, unknown>;
  evidence_by_result: {
    support: Record<string, unknown>[];
    contradiction: Record<string, unknown>[];
    neutral: Record<string, unknown>[];
    inconclusive: Record<string, unknown>[];
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

export async function readHypothesisDetail(
  hypothesisId: string,
  gameId?: string
): Promise<HypothesisDetail | null> {
  const db = getAdminDb();
  const pilotGame = resolveControlledPilotGameConfig({ game_id: gameId });

  const [hypSnap, evidenceSnap] = await Promise.all([
    db.collection('hypothesis_registry').doc(hypothesisId).get(),
    db
      .collection('evidence_tracker')
      .where('hypothesis_id', '==', hypothesisId)
      .where('game_id', '==', pilotGame.game_id)
      .orderBy('draw_date', 'desc')
      .get(),
  ]);

  if (!hypSnap.exists) return null;

  const hypothesis = serializeDoc(hypSnap.data()!);
  const allEvidence = evidenceSnap.docs.map((d) => serializeDoc(d.data()));

  const byResult: HypothesisDetail['evidence_by_result'] = {
    support: [],
    contradiction: [],
    neutral: [],
    inconclusive: [],
  };

  for (const ev of allEvidence) {
    const r = ev.result as keyof typeof byResult;
    if (r in byResult) byResult[r].push(ev);
  }

  const support = byResult.support.length;
  const contradiction = byResult.contradiction.length;
  const neutral = byResult.neutral.length;
  const inconclusive = byResult.inconclusive.length;
  const total = allEvidence.length;
  const trigger_fired = support + contradiction;
  const support_rate_on_fired = trigger_fired > 0 ? support / trigger_fired : null;

  return {
    hypothesis,
    evidence_by_result: byResult,
    totals: {
      support,
      contradiction,
      neutral,
      inconclusive,
      total,
      trigger_fired,
      support_rate_on_fired:
        support_rate_on_fired !== null
          ? parseFloat(support_rate_on_fired.toFixed(4))
          : null,
    },
  };
}

// ── Feature search with richer filters ────────────────────────────────────────

export interface FeatureSearchFilter {
  game_id?: string;
  date?: string;
  label?: string;
  weekday?: string;
  ruler?: string;
  digit_root?: string;
  digit_sum_gte?: string;
  digit_sum_lte?: string;
  doubles_only?: boolean;
  triples_only?: boolean;
  fibonacci_only?: boolean;
  moon_sign?: string;
  moon_phase?: string;
}

export async function searchFeatures(filter: FeatureSearchFilter = {}): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();
  const pilotGame = resolveControlledPilotGameConfig({ game_id: filter.game_id });

  const snap = await db
    .collection('draw_symbolic_features')
    .where('game_id', '==', pilotGame.game_id)
    .where('draw_date', '>=', PILOT_DATE_FROM)
    .where('draw_date', '<=', PILOT_DATE_TO)
    .orderBy('draw_date', 'desc')
    .orderBy('draw_label', 'asc')
    .get();

  let docs = snap.docs.map((d) => serializeDoc(d.data()));

  if (filter.date) docs = docs.filter((d) => d.draw_date === filter.date);
  if (filter.label) docs = docs.filter((d) => d.draw_label === filter.label);
  if (filter.weekday) docs = docs.filter((d) => d.weekday_name === filter.weekday);
  if (filter.ruler) docs = docs.filter((d) => d.weekday_ruler === filter.ruler);
  if (filter.digit_root) docs = docs.filter((d) => d.digit_root === parseInt(filter.digit_root!, 10));
  if (filter.digit_sum_gte) docs = docs.filter((d) => (d.digit_sum as number) >= parseInt(filter.digit_sum_gte!, 10));
  if (filter.digit_sum_lte) docs = docs.filter((d) => (d.digit_sum as number) <= parseInt(filter.digit_sum_lte!, 10));
  if (filter.doubles_only) docs = docs.filter((d) => d.is_double === true);
  if (filter.triples_only) docs = docs.filter((d) => d.is_triple === true);
  if (filter.fibonacci_only) docs = docs.filter((d) => d.is_fibonacci_result === true);
  if (filter.moon_sign) docs = docs.filter((d) => d.moon_sign === filter.moon_sign);
  if (filter.moon_phase) docs = docs.filter((d) => d.moon_phase_name === filter.moon_phase);

  return docs;
}

// ── Evidence search with richer filters ───────────────────────────────────────

export interface EvidenceSearchFilter {
  game_id?: string;
  hypothesis_id?: string;
  result?: string;
  label?: string;
  trigger_met?: string;  // 'true' | 'false' | 'null'
  date?: string;
}

export async function searchEvidence(filter: EvidenceSearchFilter = {}): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();
  const pilotGame = resolveControlledPilotGameConfig({ game_id: filter.game_id });

  let q = db
    .collection('evidence_tracker')
    .where('game_id', '==', pilotGame.game_id)
    .orderBy('draw_date', 'desc');

  const snap = await q.get();
  let docs = snap.docs.map((d) => serializeDoc(d.data()));

  if (filter.hypothesis_id) docs = docs.filter((d) => d.hypothesis_id === filter.hypothesis_id);
  if (filter.result) docs = docs.filter((d) => d.result === filter.result);
  if (filter.label) docs = docs.filter((d) => d.draw_label === filter.label);
  if (filter.date) docs = docs.filter((d) => d.draw_date === filter.date);
  if (filter.trigger_met === 'true') docs = docs.filter((d) => d.trigger_met === true);
  if (filter.trigger_met === 'false') docs = docs.filter((d) => d.trigger_met === false);
  if (filter.trigger_met === 'null') docs = docs.filter((d) => d.trigger_met === null);

  return docs;
}

// ── Overlay search with richer filters ────────────────────────────────────────

export interface OverlaySearchFilter {
  game_id?: string;
  date?: string;
  label?: string;
  moon_sign?: string;
  sun_sign?: string;
  moon_phase?: string;
  is_waxing?: string;  // 'true' | 'false'
}

export async function searchOverlays(filter: OverlaySearchFilter = {}): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();
  const pilotGame = resolveControlledPilotGameConfig({ game_id: filter.game_id });

  const snap = await db
    .collection('celestial_overlays')
    .where('game_id', '==', pilotGame.game_id)
    .where('draw_date', '>=', PILOT_DATE_FROM)
    .where('draw_date', '<=', PILOT_DATE_TO)
    .orderBy('draw_date', 'desc')
    .get();

  let docs = snap.docs.map((d) => serializeDoc(d.data()));

  if (filter.date) docs = docs.filter((d) => d.draw_date === filter.date);
  if (filter.label) docs = docs.filter((d) => d.draw_label === filter.label);
  if (filter.moon_sign) docs = docs.filter((d) => d.moon_sign === filter.moon_sign);
  if (filter.sun_sign) docs = docs.filter((d) => d.sun_sign === filter.sun_sign);
  if (filter.moon_phase) docs = docs.filter((d) => d.moon_phase_name === filter.moon_phase);
  if (filter.is_waxing === 'true') docs = docs.filter((d) => d.is_waxing === true);
  if (filter.is_waxing === 'false') docs = docs.filter((d) => d.is_waxing === false);

  return docs;
}
