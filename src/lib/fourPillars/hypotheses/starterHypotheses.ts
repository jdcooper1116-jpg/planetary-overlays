import { RULE_VERSION } from '../constants/versions';
import {
  PILOT_DRAW_LABELS,
  PILOT_GAME_IDS,
  PILOT_JURISDICTION_IDS,
} from '../readers/pilotConstants';

export interface HypothesisDefinition {
  hypothesis_id: string;
  title: string;
  description: string;
  system_family: string;
  system_name: string;
  jurisdiction_ids: string[];
  game_ids: string[];
  draw_labels: string[];
  trigger_logic: Record<string, unknown>;
  expected_logic: Record<string, unknown>;
  rule_version: string;
  status: string;
  auto_generated: boolean;
}

/**
 * Phase 1 starter hypothesis set.
 * These are research claims for testing — not validated picks.
 *
 * trigger_logic / expected_logic operators supported by evaluator.ts:
 *   { "key": "value" }      → exact match
 *   { "key": 9 }            → exact number match
 *   { "key_gte": 15 }       → features[key] >= 15
 *   { "key_lte": 5 }        → features[key] <= 5
 *   { "key_in": ["a","b"] } → features[key] is in list
 */
export const STARTER_HYPOTHESES: HypothesisDefinition[] = [
  {
    hypothesis_id: 'hyp_p1_scorpio_moon_digit3_is_8',
    title: 'Scorpio Moon → position 3 digit is 8',
    description:
      'When the Moon is in Scorpio at draw time, the third digit of the NY Pick 3 result ' +
      'is 8. Scorpio is associated with transformation and depth; 8 carries Saturn/Scorpio ' +
      'correspondence in traditional Vedic mapping.',
    system_family: 'astrology',
    system_name: 'moon_sign_positional',
    jurisdiction_ids: PILOT_JURISDICTION_IDS,
    game_ids: PILOT_GAME_IDS,
    draw_labels: PILOT_DRAW_LABELS,
    trigger_logic: { moon_sign: 'Scorpio' },
    expected_logic: { digit_3: '8' },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },
  {
    hypothesis_id: 'hyp_p1_full_moon_digit_root_9',
    title: 'Full Moon draws produce digit root 9',
    description:
      'During Full Moon windows, the three digits of NY Pick 3 sum to a digit root of 9. ' +
      'The number 9 represents completion and culmination, mirroring the Full Moon as a ' +
      'peak of the lunar cycle.',
    system_family: 'astrology',
    system_name: 'moon_phase_numerology',
    jurisdiction_ids: PILOT_JURISDICTION_IDS,
    game_ids: PILOT_GAME_IDS,
    draw_labels: PILOT_DRAW_LABELS,
    trigger_logic: { moon_phase_name: 'Full Moon' },
    expected_logic: { digit_root: 9 },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },
  {
    hypothesis_id: 'hyp_p1_saturn_day_digit_sum_gte_15',
    title: 'Saturday (Saturn day) → digit sum ≥ 15',
    description:
      'On Saturdays, the day ruled by Saturn (associated with number 8 and restriction), ' +
      'the three digits of NY Pick 3 sum to 15 or higher. High digit sums reflect the ' +
      'concentrated numerical energy of Saturn\'s rulership.',
    system_family: 'numerology',
    system_name: 'weekday_ruler_digit_family',
    jurisdiction_ids: PILOT_JURISDICTION_IDS,
    game_ids: PILOT_GAME_IDS,
    draw_labels: PILOT_DRAW_LABELS,
    trigger_logic: { weekday_name: 'Saturday' },
    expected_logic: { digit_sum_gte: 15 },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },
];
