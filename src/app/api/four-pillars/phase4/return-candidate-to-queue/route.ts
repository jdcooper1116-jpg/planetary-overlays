import { NextRequest, NextResponse } from 'next/server';
import { returnCandidateToQueue } from '@/lib/fourPillars/review/reviewActions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (!body.candidate_id) {
      return NextResponse.json(
        { ok: false, error: 'candidate_id is required' },
        { status: 400 }
      );
    }

    const result = await returnCandidateToQueue({
      candidate_id: body.candidate_id,
      registry_id: body.registry_id,
      notes: body.notes ?? null,
      reviewed_by: body.reviewed_by ?? 'researcher',
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
