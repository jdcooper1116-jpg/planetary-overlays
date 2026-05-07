import { getAdminDb } from '@/lib/firebase/admin';
import { serializeDoc } from './pilotConstants';

export async function readValidationRuns(candidateId?: string) {
  const db = getAdminDb();

  const snap = await db
    .collection('candidate_validation_runs')
    .where('game_id', '==', 'ny_pick3')
    .get();

  let docs = snap.docs.map((d) => serializeDoc(d.data()));

  if (candidateId) docs = docs.filter((d) => d.candidate_id === candidateId);

  docs.sort((a, b) => {
    const ad = String(a.created_at ?? '');
    const bd = String(b.created_at ?? '');
    return bd.localeCompare(ad);
  });

  return docs;
}
