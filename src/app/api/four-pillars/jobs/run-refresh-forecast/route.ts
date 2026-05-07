import { NextRequest, NextResponse } from 'next/server';
import { refreshForecasts } from '@/lib/fourPillars/forecast/forecastEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Sensible defaults: tomorrow NY midday
    const targetDate = body.target_draw_date ?? new Date().toISOString().slice(0, 10);
    const targetLabel = body.target_draw_label ?? 'midday';
    // NY midday is ~12:20 local = ~17:20 UTC in winter (EST)
    const targetUTC = body.target_draw_time_utc ?? `${targetDate}T17:20:00Z`;

    const result = await refreshForecasts({
      game_id: 'ny_pick3',
      jurisdiction_id: 'ny',
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
