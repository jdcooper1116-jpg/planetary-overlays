// Canonical draw labels
export type DrawLabel = 'midday' | 'evening' | 'night' | 'default';

// Aliases → canonical label
const LABEL_ALIAS_MAP: Record<string, DrawLabel> = {
  midday: 'midday',
  mid: 'midday',
  noon: 'midday',
  day: 'midday',
  afternoon: 'midday',
  '12pm': 'midday',
  lunchtime: 'midday',
  evening: 'evening',
  eve: 'evening',
  pm: 'evening',
  '7pm': 'evening',
  '7:30': 'evening',
  night: 'night',
  late: 'night',
  overnight: 'night',
  '10pm': 'night',
  '10:30': 'night',
};

export function normalizePeriodLabel(raw: string): DrawLabel {
  if (!raw) return 'default';
  const key = raw.toLowerCase().trim();
  return LABEL_ALIAS_MAP[key] ?? 'default';
}

export function buildDrawId(
  jurisdictionId: string,
  gameType: string,
  drawDate: string,
  drawLabel: DrawLabel
): string {
  return `${jurisdictionId}_${gameType}_${drawDate}_${drawLabel}`;
}
