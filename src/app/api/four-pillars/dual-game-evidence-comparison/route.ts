import { NextRequest, NextResponse } from 'next/server';
import { readDualGameEvidenceComparison } from '@/lib/fourPillars/readers/dualGameEvidenceComparisonReader';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const comparison = await readDualGameEvidenceComparison({
      expansion_window_id: searchParams.get('expansion_window_id') ?? undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
    });
    return NextResponse.json({ ok: true, ...comparison });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
