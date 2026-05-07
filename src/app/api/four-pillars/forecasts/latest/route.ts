import { NextResponse } from 'next/server';
import { readLatestForecast } from '@/lib/fourPillars/readers/forecastsReader';

export async function GET() {
  try {
    const forecast = await readLatestForecast();
    if (!forecast) {
      return NextResponse.json({ ok: true, forecast: null, message: 'No forecast runs yet.' });
    }
    return NextResponse.json({ ok: true, forecast });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
