import { MIRROR_VERSION } from '../constants/versions';
import { normalizePeriodLabel, buildDrawId, DrawLabel } from '../constants/normalization';
import type { EngineDrawRecord } from './engineClient';

export interface MirroredDraw {
  draw_id: string;
  engine_record_id: string;
  jurisdiction_id: string;
  game_id: string;
  draw_date: string;
  draw_label: DrawLabel;
  draw_datetime_local: string | null;
  draw_datetime_utc: string | null;
  result_padded: string;
  numbers: string[];
  digit_1: string | null;
  digit_2: string | null;
  digit_3: string | null;
  digit_4: string | null;
  digit_sum: number;
  digit_root: number;
  source_ids: string[];
  primary_source_id: string;
  provenance_count: number;
  validation_status: 'validated' | 'pending';
  mirror_version: string;
  engine_updated_at: string | null;
  sync_received_at: string;
  correction_version: number;
  overlay_stale: boolean;
  features_stale: boolean;
  evidence_stale: boolean;
  forecast_stale: boolean;
  _time_confidence?: string;
}

// ── Timezone → UTC conversion ─────────────────────────────────────────────────

function localTimeToUTC(dateStr: string, timeStr: string, timezone: string): Date {
  // Parse naive UTC moment, find what time it shows in target TZ, compute offset
  const naiveUTC = new Date(`${dateStr}T${timeStr}:00.000Z`);

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(naiveUTC);

  const p: Record<string, number> = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') p[part.type] = parseInt(part.value, 10);
  });

  const hour = p.hour === 24 ? 0 : p.hour;
  const tzDate = new Date(Date.UTC(p.year, p.month - 1, p.day, hour, p.minute, p.second));
  const offsetMs = tzDate.getTime() - naiveUTC.getTime();
  return new Date(naiveUTC.getTime() - offsetMs);
}

function getUTCOffsetString(utcDate: Date, naiveLocal: Date): string {
  const diffMin = Math.round((naiveLocal.getTime() - utcDate.getTime()) / 60000);
  const sign = diffMin >= 0 ? '+' : '-';
  const abs = Math.abs(diffMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
}

// ── Digit helpers ─────────────────────────────────────────────────────────────

function computeDigitSum(nums: string[]): number {
  return nums.reduce((s, d) => s + parseInt(d, 10), 0);
}

function computeDigitRoot(n: number): number {
  while (n >= 10) {
    n = String(n)
      .split('')
      .reduce((s, d) => s + parseInt(d, 10), 0);
  }
  return n;
}

// ── Schedule fallback times ───────────────────────────────────────────────────
// Used when the engine does not supply time_local
const SCHEDULE_FALLBACK: Record<string, string> = {
  midday: '12:20',
  evening: '22:30',
  night: '23:00',
  default: '12:00',
};

// ── Main mapper ───────────────────────────────────────────────────────────────

export function mapEngineDraw(
  engineDraw: EngineDrawRecord,
  now: Date
): MirroredDraw {
  const jurisdiction_id = engineDraw.state.toLowerCase();
  const game_type = engineDraw.game.toLowerCase().replace(/\s/g, '');
  const game_id = `${jurisdiction_id}_${game_type}`;
  const draw_label = normalizePeriodLabel(engineDraw.period);
  const draw_id = buildDrawId(jurisdiction_id, game_type, engineDraw.date, draw_label);

  // Leading-zero-safe — preserve as string exactly as received
  const result_padded = engineDraw.result;
  const numbers = engineDraw.numbers.map(String);

  const digit_1 = numbers[0] ?? null;
  const digit_2 = numbers[1] ?? null;
  const digit_3 = numbers[2] ?? null;
  const digit_4 = numbers[3] ?? null;

  const digit_sum = computeDigitSum(numbers);
  const digit_root = computeDigitRoot(digit_sum);

  const timezone = engineDraw.timezone ?? 'America/New_York';
  const timeStr = engineDraw.time_local ?? SCHEDULE_FALLBACK[draw_label] ?? '12:00';
  const timeConfidence = engineDraw.time_local ? 'exact' : 'schedule_derived';

  const utcDate = localTimeToUTC(engineDraw.date, timeStr, timezone);
  const naiveLocal = new Date(`${engineDraw.date}T${timeStr}:00.000Z`);
  const offsetStr = getUTCOffsetString(utcDate, naiveLocal);

  const draw_datetime_local = `${engineDraw.date}T${timeStr}:00${offsetStr}`;
  const draw_datetime_utc = utcDate.toISOString();

  const source_ids = engineDraw.provenance ?? ['lottery_engine_import'];

  return {
    draw_id,
    engine_record_id: engineDraw.id,
    jurisdiction_id,
    game_id,
    draw_date: engineDraw.date,
    draw_label,
    draw_datetime_local,
    draw_datetime_utc,
    result_padded,
    numbers,
    digit_1,
    digit_2,
    digit_3,
    digit_4,
    digit_sum,
    digit_root,
    source_ids,
    primary_source_id: 'lottery_engine_import',
    provenance_count: source_ids.length,
    validation_status: 'validated',
    mirror_version: MIRROR_VERSION,
    engine_updated_at: engineDraw.source_updated_at ?? engineDraw.updated_at ?? null,
    sync_received_at: now.toISOString(),
    correction_version: engineDraw.correction_version ?? 0,
    overlay_stale: false,
    features_stale: false,
    evidence_stale: false,
    forecast_stale: false,
    _time_confidence: timeConfidence,
  };
}
