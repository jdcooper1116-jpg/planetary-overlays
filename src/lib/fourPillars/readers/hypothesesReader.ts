import { getAdminDb } from '@/lib/firebase/admin';
import { PILOT_GAME_ID, serializeDoc } from './pilotConstants';

export async function readHypotheses(): Promise<Record<string, unknown>[]> {
  const db = getAdminDb();

  const snap = await db
    .collection('hypothesis_registry')
    .where('game_ids', 'array-contains', PILOT_GAME_ID)
    .orderBy('hypothesis_id', 'asc')
    .get();

  return snap.docs.map((d) => serializeDoc(d.data()));
}

export async function readHypothesisById(id: string): Promise<Record<string, unknown> | null> {
  const db = getAdminDb();
  const snap = await db.collection('hypothesis_registry').doc(id).get();
  return snap.exists ? serializeDoc(snap.data()!) : null;
}
