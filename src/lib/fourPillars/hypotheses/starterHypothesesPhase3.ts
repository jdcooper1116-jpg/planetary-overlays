/**
 * Phase 3 Starter Hypotheses
 *
 * Rules:
 * - All use trigger_logic / expected_logic operators already supported by evaluator.ts
 * - Each is narrow: one trigger condition, one expected condition
 * - All scoped to ny_pick3
 * - rule_version pinned to "1.0.0" so they share the Phase 1 evidence collection
 *
 * Supported operators in evaluator.ts:
 *   { "key": "value" }      → exact match
 *   { "key": 9 }            → exact number match
 *   { "key_gte": 15 }       → >=
 *   { "key_lte": 5 }        → <=
 *   { "key_in": [...] }     → membership
 */

import { RULE_VERSION } from '../constants/versions';
import type { HypothesisDefinition } from './starterHypotheses';

export const PHASE3_HYPOTHESES: HypothesisDefinition[] = [
  // ── Weekday ruler → digit root ──────────────────────────────────────────────

  {
    hypothesis_id: 'hyp_p3_friday_venus_digit_root_6',
    title: 'Friday (Venus day) → digit root 6',
    description:
      'On Fridays, ruled by Venus (Vedic number 6), the three digits of NY Pick 3 ' +
      'reduce to a digit root of 6. Venus is associated with harmony and the number 6.',
    system_family: 'numerology',
    system_name: 'weekday_ruler_digit_root',
    jurisdiction_ids: ['ny'],
    game_ids: ['ny_pick3'],
    draw_labels: ['midday', 'evening'],
    trigger_logic: { weekday_name: 'Friday' },
    expected_logic: { digit_root: 6 },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },

  {
    hypothesis_id: 'hyp_p3_wednesday_mercury_digit_root_5',
    title: 'Wednesday (Mercury day) → digit root 5',
    description:
      'On Wednesdays, ruled by Mercury (Vedic number 5), the digit root of NY Pick 3 is 5. ' +
      'Mercury governs communication and commerce; 5 is its Vedic planetary number.',
    system_family: 'numerology',
    system_name: 'weekday_ruler_digit_root',
    jurisdiction_ids: ['ny'],
    game_ids: ['ny_pick3'],
    draw_labels: ['midday', 'evening'],
    trigger_logic: { weekday_name: 'Wednesday' },
    expected_logic: { digit_root: 5 },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },

  {
    hypothesis_id: 'hyp_p3_thursday_jupiter_digit_root_in_3_9',
    title: 'Thursday (Jupiter day) → digit root 3 or 9',
    description:
      'On Thursdays, ruled by Jupiter (Vedic number 3), the digit root is 3 or 9. ' +
      '3 is Jupiter\'s own number; 9 (Mars) shares the expansion / completion energy ' +
      'and is the highest single digit.',
    system_family: 'numerology',
    system_name: 'weekday_ruler_digit_root',
    jurisdiction_ids: ['ny'],
    game_ids: ['ny_pick3'],
    draw_labels: ['midday', 'evening'],
    trigger_logic: { weekday_name: 'Thursday' },
    expected_logic: { digit_root_in: [3, 9] },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },

  // ── Moon sign → positional digit ────────────────────────────────────────────

  {
    hypothesis_id: 'hyp_p3_capricorn_moon_digit1_is_8',
    title: 'Capricorn Moon → position 1 digit is 8',
    description:
      'When the Moon is in Capricorn, the first digit of NY Pick 3 is 8. ' +
      'Capricorn is ruled by Saturn; 8 is Saturn\'s Vedic number. This tests ' +
      'a positional claim for the leading digit.',
    system_family: 'astrology',
    system_name: 'moon_sign_positional',
    jurisdiction_ids: ['ny'],
    game_ids: ['ny_pick3'],
    draw_labels: ['midday', 'evening'],
    trigger_logic: { moon_sign: 'Capricorn' },
    expected_logic: { digit_1: '8' },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },

  {
    hypothesis_id: 'hyp_p3_pisces_moon_digit_root_in_3_7',
    title: 'Pisces Moon → digit root 3 or 7',
    description:
      'When the Moon is in Pisces, the digit root is 3 or 7. Pisces is co-ruled by ' +
      'Jupiter (3) and Ketu in Vedic tradition (7). Both numbers carry water/dissolution energy.',
    system_family: 'astrology',
    system_name: 'moon_sign_numerology',
    jurisdiction_ids: ['ny'],
    game_ids: ['ny_pick3'],
    draw_labels: ['midday', 'evening'],
    trigger_logic: { moon_sign: 'Pisces' },
    expected_logic: { digit_root_in: [3, 7] },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },

  // ── Moon phase → structure ───────────────────────────────────────────────────

  {
    hypothesis_id: 'hyp_p3_waning_moon_digit_sum_lte_12',
    title: 'Waning Moon → digit sum ≤ 12',
    description:
      'During the waning lunar phase, the three digits of NY Pick 3 sum to 12 or less. ' +
      'Waning energy corresponds to reduction and contraction, reflected in lower digit totals.',
    system_family: 'astrology',
    system_name: 'moon_phase_numerology',
    jurisdiction_ids: ['ny'],
    game_ids: ['ny_pick3'],
    draw_labels: ['midday', 'evening'],
    trigger_logic: { is_waxing: false },
    expected_logic: { digit_sum_lte: 12 },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },

  {
    hypothesis_id: 'hyp_p3_new_moon_or_crescent_is_double',
    title: 'New Moon or Waxing Crescent → result is a double',
    description:
      'During New Moon and Waxing Crescent windows (phase angle 0–67.5°), two of the ' +
      'three digits of NY Pick 3 are identical. Near the new moon, structural repetition ' +
      'and compression patterns are hypothesized to be more likely.',
    system_family: 'astrology',
    system_name: 'moon_phase_structure',
    jurisdiction_ids: ['ny'],
    game_ids: ['ny_pick3'],
    draw_labels: ['midday', 'evening'],
    trigger_logic: { moon_phase_name_in: ['New Moon', 'Waxing Crescent'] },
    expected_logic: { is_double: true },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },

  // ── Sun sign / season ────────────────────────────────────────────────────────

  {
    hypothesis_id: 'hyp_p3_aquarius_sun_digit_root_4',
    title: 'Aquarius Sun → digit root 4',
    description:
      'When the Sun is in Aquarius (Jan 20 – Feb 18), the digit root is 4. ' +
      '4 corresponds to Rahu in Vedic tradition; Aquarius is the modern sign of Rahu/Uranus, ' +
      'associated with disruption and the unexpected.',
    system_family: 'astrology',
    system_name: 'sun_sign_numerology',
    jurisdiction_ids: ['ny'],
    game_ids: ['ny_pick3'],
    draw_labels: ['midday', 'evening'],
    trigger_logic: { sun_sign: 'Aquarius' },
    expected_logic: { digit_root: 4 },
    rule_version: RULE_VERSION,
    status: 'testing',
    auto_generated: false,
  },
];
