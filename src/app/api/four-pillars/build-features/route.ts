import { NextRequest, NextResponse } from 'next/server';
import { buildSymbolicFeatures } from '@/lib/fourPillars/features/buildSymbolicFeatures';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const result = await buildSymbolicFeatures({
      game_id: body.game_id ?? 'ny_pick3',
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
