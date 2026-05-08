import { NextRequest, NextResponse } from 'next/server';
import { refreshForecasts } from '@/lib/fourPillars/forecast/forecastEngine';
import {
  buildPilotDefaultForecastTimeUtc,
  PILOT_DEFAULT_FORECAST_DRAW_LABEL,
  PILOT_GAME_ID,
  PILOT_JURISDICTION_ID,
} from '@/lib/fourPillars/readers/pilotConstants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Sensible defaults: pilot midday context
    const targetDate = body.target_draw_date ?? new Date().toISOString().slice(0, 10);
    const targetLabel = body.target_draw_label ?? PILOT_DEFAULT_FORECAST_DRAW_LABEL;
    const targetUTC = body.target_draw_time_utc ?? buildPilotDefaultForecastTimeUtc(targetDate);

    const result = await refreshForecasts({
      game_id: body.game_id ?? PILOT_GAME_ID,
      jurisdiction_id: body.jurisdiction_id ?? PILOT_JURISDICTION_ID,
      target_draw_date: targetDate,
      target_draw_label: targetLabel,
      target_draw_time_utc: targetUTC,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
