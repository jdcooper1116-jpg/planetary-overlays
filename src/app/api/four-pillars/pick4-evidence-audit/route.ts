import { NextResponse } from 'next/server';
import { readPick4EvidenceAudit } from '@/lib/fourPillars/readers/pick4EvidenceAuditReader';

export async function GET() {
  try {
    const audit = await readPick4EvidenceAudit();
    return NextResponse.json({ ok: true, ...audit });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
