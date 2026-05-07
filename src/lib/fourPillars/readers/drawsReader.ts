import { getAdminDb } from '@/lib/firebase/admin';
import { PILOT_GAME_ID, PILOT_DATE_FROM, PILOT_DATE_TO, serializeDoc } from './pilotConstants';

const OVERLAY_VERSION = '1.0.0';
const SYMBOLIC_VERSION = '1.0.0';

export interface DrawsFilter {
  date?: string;
  label?: string;
}

export async function readDraws(filter: DrawsFilter = {}): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();

  const snap = await db
    .collection('draws')
    .where('game_id', '==', PILOT_GAME_ID)
    .where('draw_date', '>=', PILOT_DATE_FROM)
    .where('draw_date', '<=', PILOT_DATE_TO)
    .orderBy('draw_date', 'desc')
    .orderBy('draw_label', 'asc')
    .get();

  let docs = snap.docs.map((d) => serializeDoc(d.data()));

  if (filter.date) docs = docs.filter((d) => d.draw_date === filter.date);
  if (filter.label) docs = docs.filter((d) => d.draw_label === filter.label);

  return docs;
}

export async function readDrawById(drawId: string): Promise<{
  draw: Record<string, unknown> | null;
  overlay: Record<string, unknown> | null;
  features: Record<string, unknown> | null;
  evidence: Record<string, unknown>[];
}> {
  const db = getAdminDb();

  const overlayId = `${drawId}_v${OVERLAY_VERSION}`;
  const featureDocId = `${drawId}_sym${SYMBOLIC_VERSION}`;

  const [drawSnap, overlaySnap, featuresSnap, evidenceSnap] = await Promise.all([
    db.collection('draws').doc(drawId).get(),
    db.collection('celestial_overlays').doc(overlayId).get(),
    db.collection('draw_symbolic_features').doc(featureDocId).get(),
    db
      .collection('evidence_tracker')
      .where('draw_id', '==', drawId)
      .orderBy('hypothesis_id', 'asc')
      .get(),
  ]);

  return {
    draw: drawSnap.exists ? serializeDoc(drawSnap.data()!) : null,
    overlay: overlaySnap.exists ? serializeDoc(overlaySnap.data()!) : null,
    features: featuresSnap.exists ? serializeDoc(featuresSnap.data()!) : null,
    evidence: evidenceSnap.docs.map((d) => serializeDoc(d.data())),
  };
}
