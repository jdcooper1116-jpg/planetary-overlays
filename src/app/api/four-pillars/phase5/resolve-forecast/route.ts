import { NextRequest, NextResponse } from 'next/server';
import { resolveForecast } from '@/lib/fourPillars/phase5/forecastResolver';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (!body.forecast_id) {
      return NextResponse.json(
        { ok: false, error: 'Required: forecast_id' },
        { status: 400 }
      );
    }

    const result = await resolveForecast({
      forecast_id: body.forecast_id,
      actual_result: body.actual_result ?? undefined,
      actual_draw_id: body.actual_draw_id ?? undefined,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
