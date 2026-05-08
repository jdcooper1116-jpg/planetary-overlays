import { getAdminDb } from '@/lib/firebase/admin';
import { PHASE6H_PICK4_HYPOTHESES } from '../hypotheses/starterHypothesesPhase6H';
import type { ControlledEvidenceWindowId } from './pilotConstants';
import {
  NY_PICK4_GAME_ID,
  resolveControlledPilotDateRange,
  serializeDoc,
} from './pilotConstants';

const SAMPLE_LIMIT = 5;

type EvidenceResult = 'support' | 'contradiction' | 'neutral' | 'inconclusive';

export interface Pick4EvidenceSample {
  evidence_id: string;
  draw_id: string;
  draw_date: string;
  draw_label: string;
  result_padded: string | null;
  trigger_met: boolean | null;
  outcome_met: boolean | null;
}

export interface Pick4HypothesisEvidenceAudit {
  hypothesis_id: string;
  title: string;
  game_ids: string[];
  status: string | null;
  auto_generated: boolean | null;
  forecast_approved: boolean | null;
  total_evidence_records: number;
  support_count: number;
  contradiction_count: number;
  neutral_count: number;
  inconclusive_count: number;
  neutral_or_inconclusive_count: number;
  trigger_fired_count: number;
  support_rate: number | null;
  sample_supporting_draws: Pick4EvidenceSample[];
  sample_contradicting_draws: Pick4EvidenceSample[];
}

export interface Pick4EvidenceAuditResult {
  pilot_scope: {
    game_id: typeof NY_PICK4_GAME_ID;
    expansion_window_id: ControlledEvidenceWindowId;
    date_from: string;
    date_to: string;
  };
  hypothesis_count: number;
  total_evidence_records: number;
  records: Pick4HypothesisEvidenceAudit[];
}

export interface Pick4EvidenceAuditInput {
  date_from?: unknown;
  date_to?: unknown;
  expansion_window_id?: unknown;
}

function sampleEvidence(
  evidence: Record<string, unknown>[],
  drawsById: Map<string, Record<string, unknown>>
): Pick4EvidenceSample[] {
  return evidence
    .slice()
    .sort((a, b) => {
      const dateCompare = String(b.draw_date).localeCompare(String(a.draw_date));
      if (dateCompare !== 0) return dateCompare;
      return String(a.draw_label).localeCompare(String(b.draw_label));
    })
    .slice(0, SAMPLE_LIMIT)
    .map((ev) => {
      const drawId = ev.draw_id as string;
      const draw = drawsById.get(drawId);
      return {
        evidence_id: ev.evidence_id as string,
        draw_id: drawId,
        draw_date: ev.draw_date as string,
        draw_label: ev.draw_label as string,
        result_padded:
          typeof draw?.result_padded === 'string' ? (draw.result_padded as string) : null,
        trigger_met: (ev.trigger_met as boolean | null) ?? null,
        outcome_met: (ev.outcome_met as boolean | null) ?? null,
      };
    });
}

export async function readPick4EvidenceAudit(
  input: Pick4EvidenceAuditInput = {}
): Promise<Pick4EvidenceAuditResult> {
  const db = getAdminDb();
  const phase6hIds = PHASE6H_PICK4_HYPOTHESES.map((h) => h.hypothesis_id);
  const dateRange = resolveControlledPilotDateRange({
    ...input,
    game_id: NY_PICK4_GAME_ID,
  });

  const [hypothesisSnaps, evidenceSnap, drawsSnap] = await Promise.all([
    Promise.all(phase6hIds.map((id) => db.collection('hypothesis_registry').doc(id).get())),
    db
      .collection('evidence_tracker')
      .where('game_id', '==', NY_PICK4_GAME_ID)
      .get(),
    db
      .collection('draws')
      .where('game_id', '==', NY_PICK4_GAME_ID)
      .where('draw_date', '>=', dateRange.date_from)
      .where('draw_date', '<=', dateRange.date_to)
      .get(),
  ]);

  const hypothesesById = new Map(
    hypothesisSnaps
      .filter((snap) => snap.exists)
      .map((snap) => [snap.id, serializeDoc(snap.data()!)] as const)
  );
  const evidence = evidenceSnap.docs
    .map((doc) => serializeDoc(doc.data()))
    .filter((ev) => {
      const drawDate = ev.draw_date;
      return (
        typeof drawDate === 'string' &&
        drawDate >= dateRange.date_from &&
        drawDate <= dateRange.date_to
      );
    });
  const drawsById = new Map(
    drawsSnap.docs.map((doc) => {
      const draw = serializeDoc(doc.data());
      return [draw.draw_id as string, draw] as const;
    })
  );

  const evidenceByHypothesis = new Map<string, Record<string, unknown>[]>();
  for (const ev of evidence) {
    const hypothesisId = ev.hypothesis_id as string;
    if (!phase6hIds.includes(hypothesisId)) continue;
    const bucket = evidenceByHypothesis.get(hypothesisId) ?? [];
    bucket.push(ev);
    evidenceByHypothesis.set(hypothesisId, bucket);
  }

  const records = PHASE6H_PICK4_HYPOTHESES.map((definition) => {
    const hypothesis = (hypothesesById.get(definition.hypothesis_id) ?? definition) as Record<
      string,
      unknown
    >;
    const hypothesisEvidence = evidenceByHypothesis.get(definition.hypothesis_id) ?? [];
    const byResult: Record<EvidenceResult, Record<string, unknown>[]> = {
      support: [],
      contradiction: [],
      neutral: [],
      inconclusive: [],
    };

    for (const ev of hypothesisEvidence) {
      const result = ev.result as EvidenceResult;
      if (result in byResult) byResult[result].push(ev);
    }

    const support_count = byResult.support.length;
    const contradiction_count = byResult.contradiction.length;
    const neutral_count = byResult.neutral.length;
    const inconclusive_count = byResult.inconclusive.length;
    const trigger_fired_count = support_count + contradiction_count;

    return {
      hypothesis_id: definition.hypothesis_id,
      title: hypothesis.title as string,
      game_ids: (hypothesis.game_ids as string[]) ?? definition.game_ids,
      status: (hypothesis.status as string | null) ?? null,
      auto_generated: (hypothesis.auto_generated as boolean | null) ?? null,
      forecast_approved: (hypothesis.forecast_approved as boolean | null) ?? null,
      total_evidence_records: hypothesisEvidence.length,
      support_count,
      contradiction_count,
      neutral_count,
      inconclusive_count,
      neutral_or_inconclusive_count: neutral_count + inconclusive_count,
      trigger_fired_count,
      support_rate:
        trigger_fired_count > 0
          ? parseFloat((support_count / trigger_fired_count).toFixed(4))
          : null,
      sample_supporting_draws: sampleEvidence(byResult.support, drawsById),
      sample_contradicting_draws: sampleEvidence(byResult.contradiction, drawsById),
    };
  });

  return {
    pilot_scope: {
      game_id: NY_PICK4_GAME_ID,
      expansion_window_id: dateRange.window_id,
      date_from: dateRange.date_from,
      date_to: dateRange.date_to,
    },
    hypothesis_count: records.length,
    total_evidence_records: records.reduce((sum, record) => sum + record.total_evidence_records, 0),
    records,
  };
}
