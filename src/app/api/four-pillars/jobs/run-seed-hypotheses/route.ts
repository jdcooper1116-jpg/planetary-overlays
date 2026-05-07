import { NextResponse } from 'next/server';
import { seedStarterHypotheses } from '@/lib/fourPillars/hypotheses/seedHypotheses';
import { seedPhase3Hypotheses } from '@/lib/fourPillars/hypotheses/seedHypothesesPhase3';

export async function POST() {
  try {
    const [phase1, phase3] = await Promise.all([
      seedStarterHypotheses(),
      seedPhase3Hypotheses(),
    ]);

    return NextResponse.json({
      ok: true,
      phase1,
      phase3,
      total_seeded: phase1.seeded + phase3.seeded,
      total_existing: phase1.existing + phase3.existing,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
