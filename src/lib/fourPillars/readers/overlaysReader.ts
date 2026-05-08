import { getAdminDb } from '@/lib/firebase/admin';
import {
  PILOT_DATE_FROM,
  PILOT_DATE_TO,
  resolveControlledPilotGameConfig,
  serializeDoc,
} from './pilotConstants';

export interface OverlaysFilter {
  game_id?: string;
  date?: string;
  label?: string;
  moon_sign?: string;
}

export async function readOverlays(filter: OverlaysFilter = {}): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();
  const pilotGame = resolveControlledPilotGameConfig({ game_id: filter.game_id });

  const snap = await db
    .collection('celestial_overlays')
    .where('game_id', '==', pilotGame.game_id)
    .where('draw_date', '>=', PILOT_DATE_FROM)
    .where('draw_date', '<=', PILOT_DATE_TO)
    .orderBy('draw_date', 'desc')
    .orderBy('draw_label', 'asc')
    .get();

  let docs = snap.docs.map((d) => serializeDoc(d.data()));

  if (filter.date) docs = docs.filter((d) => d.draw_date === filter.date);
  if (filter.label) docs = docs.filter((d) => d.draw_label === filter.label);
  if (filter.moon_sign) docs = docs.filter((d) => d.moon_sign === filter.moon_sign);

  return docs;
}
