// Phase 1 pilot scope — do not change these without re-running the pilot
export const PILOT_GAME_ID = 'ny_pick3';
export const PILOT_JURISDICTION_ID = 'ny';
export const PILOT_STATE = 'NY';
export const PILOT_ENGINE_GAME = 'pick3';
export const NY_PICK4_GAME_ID = 'ny_pick4';
export const NY_PICK4_ENGINE_GAME = 'pick4';
export const PILOT_DATE_FROM = '2024-01-01';
export const PILOT_DATE_TO = '2024-01-31';
export const PILOT_JURISDICTION_IDS = [PILOT_JURISDICTION_ID];
export const PILOT_GAME_IDS = [PILOT_GAME_ID];
export const CONTROLLED_PILOT_GAME_IDS = [PILOT_GAME_ID, NY_PICK4_GAME_ID] as const;
export const PILOT_DRAW_LABELS = ['midday', 'evening'];
export const PILOT_DEFAULT_FORECAST_DRAW_LABEL = 'midday';
export const PILOT_DEFAULT_FORECAST_UTC_TIME = 'T17:20:00Z';

export type ControlledPilotGameId = (typeof CONTROLLED_PILOT_GAME_IDS)[number];

export type ControlledPilotGameConfig = {
  game_id: ControlledPilotGameId;
  jurisdiction_id: typeof PILOT_JURISDICTION_ID;
  state: typeof PILOT_STATE;
  engine_game: typeof PILOT_ENGINE_GAME | typeof NY_PICK4_ENGINE_GAME;
  ball_count: 3 | 4;
  display_name: string;
};

export const CONTROLLED_PILOT_GAME_CONFIGS: Record<
  ControlledPilotGameId,
  ControlledPilotGameConfig
> = {
  [PILOT_GAME_ID]: {
    game_id: PILOT_GAME_ID,
    jurisdiction_id: PILOT_JURISDICTION_ID,
    state: PILOT_STATE,
    engine_game: PILOT_ENGINE_GAME,
    ball_count: 3,
    display_name: 'New York Pick 3',
  },
  [NY_PICK4_GAME_ID]: {
    game_id: NY_PICK4_GAME_ID,
    jurisdiction_id: PILOT_JURISDICTION_ID,
    state: PILOT_STATE,
    engine_game: NY_PICK4_ENGINE_GAME,
    ball_count: 4,
    display_name: 'New York Pick 4',
  },
};

export function isControlledPilotGameId(value: unknown): value is ControlledPilotGameId {
  return CONTROLLED_PILOT_GAME_IDS.includes(value as ControlledPilotGameId);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function resolveControlledPilotGameConfig(input?: {
  game_id?: unknown;
  game?: unknown;
  state?: unknown;
  jurisdiction_id?: unknown;
}): ControlledPilotGameConfig {
  const requestedGameId = stringValue(input?.game_id);
  const requestedEngineGame = stringValue(input?.game);

  let gameId: ControlledPilotGameId = PILOT_GAME_ID;
  if (requestedGameId) {
    if (!isControlledPilotGameId(requestedGameId)) {
      throw new Error(`Unsupported pilot game_id: ${requestedGameId}`);
    }
    gameId = requestedGameId;
  } else if (requestedEngineGame === NY_PICK4_ENGINE_GAME) {
    gameId = NY_PICK4_GAME_ID;
  } else if (requestedEngineGame && requestedEngineGame !== PILOT_ENGINE_GAME) {
    throw new Error(`Unsupported pilot engine game: ${requestedEngineGame}`);
  }

  const config = CONTROLLED_PILOT_GAME_CONFIGS[gameId];
  if (requestedEngineGame && requestedEngineGame !== config.engine_game) {
    throw new Error(
      `Mismatched pilot game request: ${gameId} uses engine game ${config.engine_game}`
    );
  }

  const requestedState = stringValue(input?.state);
  if (requestedState && requestedState !== PILOT_STATE) {
    throw new Error(`Unsupported pilot state: ${requestedState}`);
  }

  const requestedJurisdiction = stringValue(input?.jurisdiction_id);
  if (requestedJurisdiction && requestedJurisdiction !== PILOT_JURISDICTION_ID) {
    throw new Error(`Unsupported pilot jurisdiction_id: ${requestedJurisdiction}`);
  }

  return config;
}

export function resolveControlledPilotDateRange(input?: {
  date_from?: unknown;
  date_to?: unknown;
}): { date_from: string; date_to: string } {
  const date_from = stringValue(input?.date_from) ?? PILOT_DATE_FROM;
  const date_to = stringValue(input?.date_to) ?? PILOT_DATE_TO;

  if (date_from < PILOT_DATE_FROM || date_to > PILOT_DATE_TO || date_from > date_to) {
    throw new Error(
      `Pilot date range must stay within ${PILOT_DATE_FROM} through ${PILOT_DATE_TO}`
    );
  }

  return { date_from, date_to };
}

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
