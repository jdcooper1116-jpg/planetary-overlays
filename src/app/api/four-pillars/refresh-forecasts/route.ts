import { NextRequest, NextResponse } from 'next/server';
import { refreshForecasts } from '@/lib/fourPillars/forecast/forecastEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (
      !body.target_draw_date ||
      !body.target_draw_label ||
      !body.target_draw_time_utc
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Required fields: target_draw_date, target_draw_label, target_draw_time_utc',
        },
        { status: 400 }
      );
    }

    const result = await refreshForecasts({
      game_id: body.game_id ?? 'ny_pick3',
      jurisdiction_id: body.jurisdiction_id ?? 'ny',
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
