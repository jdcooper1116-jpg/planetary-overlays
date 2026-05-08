/**
 * Phase 6H Pick 4 Starter Hypotheses
 *
 * Controlled NY Pick 4 research claims only.
 * These are starter/testing hypotheses, not validated picks or forecast approval.
 */

import { RULE_VERSION } from '../constants/versions';
import {
  NY_PICK4_GAME_ID,
  PILOT_DRAW_LABELS,
  PILOT_JURISDICTION_ID,
} from '../readers/pilotConstants';
import type { HypothesisDefinition } from './starterHypotheses';

const PICK4_GAME_IDS = [NY_PICK4_GAME_ID];
const PICK4_JURISDICTION_IDS = [PILOT_JURISDICTION_ID];

export const PHASE6H_PICK4_HYPOTHESES: HypothesisDefinition[] = [
  {
    hypothesis_id: 'hyp_p4_digit4_vedic_saturn_repeat',
    title: 'Pick 4 digit 4 Saturn correspondence -> repeat structure',
    description:
      'Starter/testing NY Pick 4 claim: when the fourth digit maps to Saturn, the ' +
      'result has a repeated digit structure. This tests whether a fourth-position ' +
      'Vedic correspondence aligns with repeat patterns in the controlled pilot.',
    system_family: 'numerology',
    system_name: 'pick4_digit4_vedic_structure',
    jurisdiction_ids: PICK4_JURISDICTION_IDS,
    game_ids: PICK4_GAME_IDS,
    draw_labels: PILOT_DRAW_LABELS,
    trigger_logic: { digit_4_vedic_planet: 'Saturn' },
    expected_logic: { is_double: true },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },
  {
    hypothesis_id: 'hyp_p4_waning_moon_digit_sum_gte_18',
    title: 'Pick 4 waning Moon -> digit sum >= 18',
    description:
      'Starter/testing NY Pick 4 claim: during waning Moon contexts, the four-digit ' +
      'result sum is 18 or higher. This is a narrow digit-sum claim for the controlled pilot.',
    system_family: 'astrology',
    system_name: 'pick4_moon_phase_digit_sum',
    jurisdiction_ids: PICK4_JURISDICTION_IDS,
    game_ids: PICK4_GAME_IDS,
    draw_labels: PILOT_DRAW_LABELS,
    trigger_logic: { is_waxing: false },
    expected_logic: { digit_sum_gte: 18 },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },
  {
    hypothesis_id: 'hyp_p4_libra_moon_digit4_even',
    title: 'Pick 4 Libra Moon -> fourth digit is even',
    description:
      'Starter/testing NY Pick 4 claim: when the Moon is in Libra, the fourth digit ' +
      'is an even digit. The condition is encoded as a supported membership test.',
    system_family: 'astrology',
    system_name: 'pick4_moon_sign_digit4',
    jurisdiction_ids: PICK4_JURISDICTION_IDS,
    game_ids: PICK4_GAME_IDS,
    draw_labels: PILOT_DRAW_LABELS,
    trigger_logic: { moon_sign: 'Libra' },
    expected_logic: { digit_4_in: ['0', '2', '4', '6', '8'] },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },
  {
    hypothesis_id: 'hyp_p4_mercury_day_digit_root_in_5_8',
    title: 'Pick 4 Mercury day -> digit root is 5 or 8',
    description:
      'Starter/testing NY Pick 4 claim: on Mercury-ruled Wednesdays, the four-digit ' +
      'result root is 5 or 8. This keeps the outcome machine-testable with existing logic.',
    system_family: 'numerology',
    system_name: 'pick4_weekday_ruler_digit_root',
    jurisdiction_ids: PICK4_JURISDICTION_IDS,
    game_ids: PICK4_GAME_IDS,
    draw_labels: PILOT_DRAW_LABELS,
    trigger_logic: { weekday_ruler: 'Mercury' },
    expected_logic: { digit_root_in: [5, 8] },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },
];
