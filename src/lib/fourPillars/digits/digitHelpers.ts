export const MAX_SUPPORTED_DIGITS = 4;

function cleanDigit(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return /^[0-9]$/.test(value) ? value : null;
}

export function getDigitsFromDraw(draw: Record<string, unknown>): string[] {
  const numbers = draw.numbers;
  if (Array.isArray(numbers)) {
    const digits = numbers.map(cleanDigit).filter((digit): digit is string => digit !== null);
    if (digits.length > 0) return digits;
  }

  const result = draw.result_padded;
  if (typeof result === 'string' && /^[0-9]+$/.test(result)) {
    return result.split('');
  }

  const digits: string[] = [];
  for (let position = 1; position <= MAX_SUPPORTED_DIGITS; position++) {
    const digit = cleanDigit(draw[`digit_${position}`]);
    if (digit === null) break;
    digits.push(digit);
  }
  return digits;
}

export function getDigitFieldName(position: number): `digit_${number}` {
  return `digit_${position}`;
}

export function getVedicPlanetFieldName(position: number): `digit_${number}_vedic_planet` {
  return `digit_${position}_vedic_planet`;
}
