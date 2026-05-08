import { NextRequest, NextResponse } from 'next/server';
import { generateForecastRun } from '@/lib/fourPillars/phase5/forecastGenerator';
import { PILOT_GAME_ID, PILOT_JURISDICTION_ID } from '@/lib/fourPillars/readers/pilotConstants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (!body.target_draw_date || !body.target_draw_label || !body.target_draw_time_utc) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Required: target_draw_date, target_draw_label, target_draw_time_utc',
        },
        { status: 400 }
      );
    }

    if (body.game_id && body.game_id !== PILOT_GAME_ID) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Forecast generation is currently supported only for ${PILOT_GAME_ID}. ` +
            `${body.game_id} remains research/backtest-only until forecast support is explicitly approved.`,
        },
        { status: 400 }
      );
    }

    const result = await generateForecastRun({
      game_id: body.game_id ?? PILOT_GAME_ID,
      jurisdiction_id: body.jurisdiction_id ?? PILOT_JURISDICTION_ID,
      target_draw_date: body.target_draw_date,
      target_draw_label: body.target_draw_label,
      target_draw_time_utc: body.target_draw_time_utc,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
