import { NextResponse } from 'next/server';
import { seedStarterHypotheses } from '@/lib/fourPillars/hypotheses/seedHypotheses';

export async function POST() {
  try {
    const result = await seedStarterHypotheses();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
