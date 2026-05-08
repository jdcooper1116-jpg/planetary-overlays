import { NextResponse } from 'next/server';
import { readDualGameEvidenceWindowPlan } from '@/lib/fourPillars/planning/dualGameEvidenceWindowPlan';

export async function GET() {
  try {
    const plan = await readDualGameEvidenceWindowPlan();
    return NextResponse.json({ ok: true, ...plan });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
