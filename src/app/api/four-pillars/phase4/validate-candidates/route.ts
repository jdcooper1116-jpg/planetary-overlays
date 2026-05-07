import { NextResponse } from 'next/server';
import { validateCandidates } from '@/lib/fourPillars/autoHypotheses/candidateValidator';

export async function POST() {
  try {
    const result = await validateCandidates();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
