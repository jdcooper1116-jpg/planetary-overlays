import { NextResponse } from 'next/server';
import { readHypotheses } from '@/lib/fourPillars/readers/hypothesesReader';

export async function GET() {
  try {
    const hypotheses = await readHypotheses();
    return NextResponse.json({ ok: true, count: hypotheses.length, hypotheses });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
