import { NextRequest, NextResponse } from 'next/server';
import { computeHypothesisPerformance } from '@/lib/fourPillars/phase5/hypothesisPerformance';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const game_id = searchParams.get('game_id') ?? 'ny_pick3';

    const records = await computeHypothesisPerformance(game_id);
    return NextResponse.json({ ok: true, count: records.length, records });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
