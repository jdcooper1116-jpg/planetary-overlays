import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { SCHEDULE_VERSION } from '../constants/versions';
import {
  PILOT_DATE_FROM,
  PILOT_ENGINE_GAME,
  PILOT_GAME_ID,
  PILOT_JURISDICTION_ID,
  PILOT_STATE,
} from '../readers/pilotConstants';

// ─── Jurisdiction: New York ───────────────────────────────────────────────────

export const NY_JURISDICTION = {
  jurisdiction_id: PILOT_JURISDICTION_ID,
  name: 'New York',
  abbreviation: PILOT_STATE,
  country_code: 'US',
  timezone: 'America/New_York',
  is_active: true,
  supports_pick3: true,
  supports_pick4: true,
  engine_state_code: PILOT_STATE,
  research_priority: 1,
  notes: 'Phase 1 pilot jurisdiction',
};

// ─── Game: ny_pick3 ───────────────────────────────────────────────────────────

export const NY_PICK3_GAME = {
  game_id: PILOT_GAME_ID,
  jurisdiction_id: PILOT_JURISDICTION_ID,
  game_type: PILOT_ENGINE_GAME,
  display_name: 'New York Pick 3',
  ball_count: 3,
  ball_range_min: 0,
  ball_range_max: 9,
  preserves_order: true,
  schedule_version: SCHEDULE_VERSION,
  is_active: true,
  notes: 'NY Numbers game (Midday + Evening). Midday ~12:20, Evening ~22:30 local.',
  draw_schedule: [
    { draw_label: 'midday', draw_time_local: '12:20', days: 'daily', effective_from: PILOT_DATE_FROM },
    { draw_label: 'evening', draw_time_local: '22:30', days: 'daily', effective_from: PILOT_DATE_FROM },
  ],
};

// ─── Writer ───────────────────────────────────────────────────────────────────

export async function seedJurisdictionAndGame(): Promise<{
  jurisdictionWritten: boolean;
  gameWritten: boolean;
}> {
  const db = getAdminDb();
  const now = FieldValue.serverTimestamp();

  // Idempotent: only write if not already present
  const jurRef = db.collection('jurisdictions').doc(NY_JURISDICTION.jurisdiction_id);
  const jurSnap = await jurRef.get();
  if (!jurSnap.exists) {
    await jurRef.set({ ...NY_JURISDICTION, created_at: now, updated_at: now });
  } else {
    await jurRef.update({ updated_at: now });
  }

  const gameRef = db.collection('games').doc(NY_PICK3_GAME.game_id);
  const gameSnap = await gameRef.get();
  if (!gameSnap.exists) {
    await gameRef.set({ ...NY_PICK3_GAME, created_at: now, updated_at: now });
  } else {
    await gameRef.update({ updated_at: now });
  }

  return { jurisdictionWritten: !jurSnap.exists, gameWritten: !gameSnap.exists };
}
