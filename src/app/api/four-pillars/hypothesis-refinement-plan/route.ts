import { NextRequest, NextResponse } from 'next/server';
import { readHypothesisRefinementPlan } from '@/lib/fourPillars/planning/hypothesisRefinementPlan';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const plan = await readHypothesisRefinementPlan({
      expansion_window_id: searchParams.get('expansion_window_id') ?? undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
    });

    return NextResponse.json({ ok: true, ...plan });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
