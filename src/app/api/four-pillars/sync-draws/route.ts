import { NextRequest, NextResponse } from 'next/server';
import { syncDraws } from '@/lib/fourPillars/sync/syncDraws';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const result = await syncDraws({
      jurisdiction_id: body.jurisdiction_id ?? 'ny',
      game_id: body.game_id ?? 'ny_pick3',
      state: body.state ?? 'NY',
      game: body.game ?? 'pick3',
      date_from: body.date_from ?? '2024-01-01',
      date_to: body.date_to ?? '2024-01-31',
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
