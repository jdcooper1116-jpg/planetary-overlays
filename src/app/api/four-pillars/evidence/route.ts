import { NextRequest, NextResponse } from 'next/server';
import { readEvidence } from '@/lib/fourPillars/readers/evidenceReader';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const evidence = await readEvidence({
      hypothesis_id: searchParams.get('hypothesis_id') ?? undefined,
      result: searchParams.get('result') ?? undefined,
      date: searchParams.get('date') ?? undefined,
      label: searchParams.get('label') ?? undefined,
    });
    return NextResponse.json({ ok: true, count: evidence.length, evidence });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
