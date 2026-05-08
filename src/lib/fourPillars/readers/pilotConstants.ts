// Phase 1 pilot scope — do not change these without re-running the pilot
export const PILOT_GAME_ID = 'ny_pick3';
export const PILOT_JURISDICTION_ID = 'ny';
export const PILOT_STATE = 'NY';
export const PILOT_ENGINE_GAME = 'pick3';
export const PILOT_DATE_FROM = '2024-01-01';
export const PILOT_DATE_TO = '2024-01-31';
export const PILOT_JURISDICTION_IDS = [PILOT_JURISDICTION_ID];
export const PILOT_GAME_IDS = [PILOT_GAME_ID];
export const PILOT_DRAW_LABELS = ['midday', 'evening'];
export const PILOT_DEFAULT_FORECAST_DRAW_LABEL = 'midday';
export const PILOT_DEFAULT_FORECAST_UTC_TIME = 'T17:20:00Z';

export function buildPilotDefaultForecastTimeUtc(date: string): string {
  return `${date}${PILOT_DEFAULT_FORECAST_UTC_TIME}`;
}

// Safely serialize a Firestore Timestamp, Date, or ISO string to a string
export function serializeDate(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  // Firestore Admin SDK Timestamp
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return String(value);
}

// Safely serialize any Firestore document to a plain JSON-safe object
export function serializeDoc(data: FirebaseFirestore.DocumentData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && 'toDate' in v) {
      out[k] = (v as { toDate: () => Date }).toDate().toISOString();
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item && typeof item === 'object' && 'toDate' in item
          ? (item as { toDate: () => Date }).toDate().toISOString()
          : item
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}
