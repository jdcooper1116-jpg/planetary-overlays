import * as Astronomy from 'astronomy-engine';

export interface CelestialSnapshot {
  moon_phase_angle: number;
  moon_phase_name: string;
  moon_illumination_fraction: number;
  is_waxing: boolean;
  moon_ecliptic_longitude: number;
  moon_sign: string;
  sun_ecliptic_longitude: number;
  sun_sign: string;
  computation_method: string;
  ephemeris_version: string;
  zodiac_mode: string;
}

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function eclipticToZodiac(lon: number): string {
  const normalized = ((lon % 360) + 360) % 360;
  return ZODIAC_SIGNS[Math.floor(normalized / 30)];
}

function moonPhaseAngleToName(angle: number): string {
  if (angle < 22.5 || angle >= 337.5) return 'New Moon';
  if (angle < 67.5) return 'Waxing Crescent';
  if (angle < 112.5) return 'First Quarter';
  if (angle < 157.5) return 'Waxing Gibbous';
  if (angle < 202.5) return 'Full Moon';
  if (angle < 247.5) return 'Waning Gibbous';
  if (angle < 292.5) return 'Last Quarter';
  return 'Waning Crescent';
}

function moonIlluminationFromAngle(angle: number): number {
  // Illumination fraction: (1 - cos(angle)) / 2
  return (1 - Math.cos((angle * Math.PI) / 180)) / 2;
}

export function computeCelestialSnapshot(utcDatetime: Date): CelestialSnapshot {
  // Moon phase angle: 0 = New Moon, 180 = Full Moon
  const moonAngle = Astronomy.MoonPhase(utcDatetime);

  // Sun ecliptic longitude
  const sunPos = Astronomy.SunPosition(utcDatetime);
  const sun_ecliptic_longitude = ((sunPos.elon % 360) + 360) % 360;

  // Moon ecliptic longitude = Sun lon + Moon-Sun angle
  const moon_ecliptic_longitude =
    ((sun_ecliptic_longitude + moonAngle) % 360 + 360) % 360;

  return {
    moon_phase_angle: parseFloat(moonAngle.toFixed(4)),
    moon_phase_name: moonPhaseAngleToName(moonAngle),
    moon_illumination_fraction: parseFloat(
      moonIlluminationFromAngle(moonAngle).toFixed(4)
    ),
    is_waxing: moonAngle < 180,
    moon_ecliptic_longitude: parseFloat(moon_ecliptic_longitude.toFixed(4)),
    moon_sign: eclipticToZodiac(moon_ecliptic_longitude),
    sun_ecliptic_longitude: parseFloat(sun_ecliptic_longitude.toFixed(4)),
    sun_sign: eclipticToZodiac(sun_ecliptic_longitude),
    computation_method: 'astronomy-engine-ephemeris',
    ephemeris_version: 'astronomy-engine-2.x',
    zodiac_mode: 'tropical',
  };
}
