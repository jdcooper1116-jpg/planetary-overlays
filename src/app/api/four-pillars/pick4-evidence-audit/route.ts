import { NextRequest, NextResponse } from 'next/server';
import { readPick4EvidenceAudit } from '@/lib/fourPillars/readers/pick4EvidenceAuditReader';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const audit = await readPick4EvidenceAudit({
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
      expansion_window_id: searchParams.get('expansion_window_id') ?? undefined,
    });
    return NextResponse.json({ ok: true, ...audit });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
