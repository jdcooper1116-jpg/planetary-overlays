import { SYMBOLIC_VERSION, OVERLAY_VERSION, MIRROR_VERSION } from '../constants/versions';
import { getDigitsFromDraw } from '../digits/digitHelpers';

const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

const WEEKDAY_RULERS: Record<string, string> = {
  Sunday: 'Sun',
  Monday: 'Moon',
  Tuesday: 'Mars',
  Wednesday: 'Mercury',
  Thursday: 'Jupiter',
  Friday: 'Venus',
  Saturday: 'Saturn',
};

function getSeasonNorthern(month: number): string {
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Autumn';
  return 'Winter';
}

// Simplified Vedic/traditional single-digit planet mapping
function getVedicPlanet(digit: string): string {
  const map: Record<string, string> = {
    '1': 'Sun',
    '2': 'Moon',
    '3': 'Jupiter',
    '4': 'Rahu',
    '5': 'Mercury',
    '6': 'Venus',
    '7': 'Ketu',
    '8': 'Saturn',
    '9': 'Mars',
    '0': 'None',
  };
  return map[digit] ?? 'Unknown';
}

// 3-digit results in a Fibonacci-adjacent set for Phase 1 flagging
const FIBONACCI_RESULTS = new Set([
  '001', '002', '003', '005', '008', '013', '021', '034', '055', '089',
  '144', '233',
]);

export interface SymbolicFeatureRow {
  feature_doc_id: string;
  draw_id: string;
  game_id: string;
  jurisdiction_id: string;
  draw_date: string;
  draw_label: string;
  symbolic_version: string;
  overlay_version: string;
  mirror_version: string;
  // Calendar
  weekday_name: string;
  weekday_index: number;
  weekday_ruler: string;
  month_number: number;
  season: string;
  // Astronomy / Astrology
  moon_phase_name: string;
  moon_phase_angle: number;
  moon_sign: string;
  sun_sign: string;
  is_waxing: boolean;
  moon_illumination_fraction: number;
  // Numerology
  digit_sum: number;
  digit_root: number;
  digit_1: string | null;
  digit_2: string | null;
  digit_3: string | null;
  digit_4: string | null;
  result_padded: string;
  // Vedic
  digit_1_vedic_planet: string | null;
  digit_2_vedic_planet: string | null;
  digit_3_vedic_planet: string | null;
  digit_4_vedic_planet: string | null;
  // Mod / structural flags
  digit_sum_mod3: number;
  digit_sum_mod9: number;
  is_triple: boolean;
  is_double: boolean;
  is_fibonacci_result: boolean;
}

export function computeSymbolicFeatures(
  draw: Record<string, unknown>,
  overlay: Record<string, unknown>
): Omit<SymbolicFeatureRow, 'created_at' | 'updated_at'> {
  const draw_id = draw.draw_id as string;
  const draw_date = draw.draw_date as string;
  const [yearStr, monthStr, dayStr] = draw_date.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Local calendar features must be derived from the local draw date,
  // not UTC, or evening draws can shift into the next day.
  const localCalendarDate = new Date(Date.UTC(year, month - 1, day));
  const weekdayIndex = localCalendarDate.getUTCDay();
  const weekday_name = WEEKDAY_NAMES[weekdayIndex];

  const digit_1 = draw.digit_1 as string | null;
  const digit_2 = draw.digit_2 as string | null;
  const digit_3 = draw.digit_3 as string | null;
  const digit_4 = draw.digit_4 as string | null;
  const result_padded = draw.result_padded as string;
  const digit_sum = draw.digit_sum as number;
  const digit_root = draw.digit_root as number;
  const numbers = getDigitsFromDraw(draw);

  // Readiness only: count all mirrored digits so later Pick 4 records do not
  // silently behave like Pick 3. This does not activate Pick 4 ingestion.
  const freqs: Record<string, number> = {};
  for (const d of numbers) freqs[d] = (freqs[d] ?? 0) + 1;
  const freqVals = Object.values(freqs);
  const is_triple = freqVals.some((v) => v === 3);
  const is_double = !is_triple && freqVals.some((v) => v === 2);

  return {
    feature_doc_id: `${draw_id}_sym${SYMBOLIC_VERSION}`,
    draw_id,
    game_id: draw.game_id as string,
    jurisdiction_id: draw.jurisdiction_id as string,
    draw_date,
    draw_label: draw.draw_label as string,
    symbolic_version: SYMBOLIC_VERSION,
    overlay_version: OVERLAY_VERSION,
    mirror_version: MIRROR_VERSION,
    // Calendar
    weekday_name,
    weekday_index: weekdayIndex,
    weekday_ruler: WEEKDAY_RULERS[weekday_name],
    month_number: month,
    season: getSeasonNorthern(month),
    // Astrology (from overlay)
    moon_phase_name: overlay.moon_phase_name as string,
    moon_phase_angle: overlay.moon_phase_angle as number,
    moon_sign: overlay.moon_sign as string,
    sun_sign: overlay.sun_sign as string,
    is_waxing: overlay.is_waxing as boolean,
    moon_illumination_fraction: overlay.moon_illumination_fraction as number,
    // Numerology
    digit_sum,
    digit_root,
    digit_1,
    digit_2,
    digit_3,
    digit_4,
    result_padded,
    // Vedic
    digit_1_vedic_planet: digit_1 ? getVedicPlanet(digit_1) : null,
    digit_2_vedic_planet: digit_2 ? getVedicPlanet(digit_2) : null,
    digit_3_vedic_planet: digit_3 ? getVedicPlanet(digit_3) : null,
    digit_4_vedic_planet: digit_4 ? getVedicPlanet(digit_4) : null,
    // Mod / flags
    digit_sum_mod3: digit_sum % 3,
    digit_sum_mod9: digit_sum % 9,
    is_triple,
    is_double,
    is_fibonacci_result: FIBONACCI_RESULTS.has(result_padded),
  };
}
