export interface EngineDrawRecord {
  id: string;
  state: string;
  game: string;
  date: string;
  period: string;
  time_local?: string;
  timezone?: string;
  result: string;
  numbers: string[];
  source_updated_at?: string;
  updated_at?: string;
  correction_version?: number;
  schedule_version?: string;
  is_canonical?: boolean;
  provenance?: string[];
}

export interface EngineResponse {
  meta: {
    state: string;
    game: string;
    date_from: string;
    date_to: string;
    count: number;
    engine_version?: string;
    page?: number;
    pages?: number;
  };
  draws: EngineDrawRecord[];
}

interface RawEngineDrawRecord {
  canonical_key: string;
  state: string;
  game_type: string;
  draw_date: string;
  draw_time: string;
  winning_number: string;
  digit_count?: number;
  sorted_digits?: string;
  is_verified?: boolean;
  has_conflict?: boolean;
  source_name?: string;
  accepted_from_source?: string;
}

interface RawEngineResponse {
  state: string;
  game_type: string;
  start_date: string;
  end_date: string;
  total_count: number;
  draws: RawEngineDrawRecord[];
  coverage_gaps?: unknown[];
}

export async function fetchEngineDraws(params: {
  state: string;
  game: string;
  from: string;
  to: string;
}): Promise<EngineResponse> {
  const baseUrl =
    process.env.LOTTERY_ENGINE_URL ||
    process.env.NEXT_PUBLIC_LOTTERY_ENGINE_URL ||
    'https://lottery-engine-production.up.railway.app';

  const url = new URL('/draws', baseUrl);
  url.searchParams.set('state', params.state);
  url.searchParams.set('game_type', params.game);
  url.searchParams.set('start', params.from);
  url.searchParams.set('end', params.to);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Sync-Client': 'four-pillars-research',
  };

  const token =
    process.env.LOTTERY_ENGINE_TOKEN || process.env.LOTTERY_ENGINE_API_KEY;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Engine fetch failed ${res.status} ${res.statusText}: ${body.slice(0, 300)}`
    );
  }

  const raw = (await res.json()) as RawEngineResponse;

  return {
    meta: {
      state: raw.state ?? params.state,
      game: raw.game_type ?? params.game,
      date_from: raw.start_date ?? params.from,
      date_to: raw.end_date ?? params.to,
      count: raw.total_count ?? raw.draws?.length ?? 0,
    },
    draws: (raw.draws ?? []).map((draw) => ({
      id: draw.canonical_key,
      state: draw.state,
      game: draw.game_type,
      date: draw.draw_date,
      period: draw.draw_time,
      time_local: undefined,
      timezone: undefined,
      result: draw.winning_number,
      numbers: String(draw.winning_number).split(''),
      source_updated_at: undefined,
      updated_at: undefined,
      correction_version: undefined,
      schedule_version: undefined,
      is_canonical: true,
      provenance: [draw.accepted_from_source ?? draw.source_name].filter(
        (v): v is string => Boolean(v)
      ),
    })),
  };
}
