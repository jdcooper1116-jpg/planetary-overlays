import { NextRequest, NextResponse } from 'next/server';
import { readDrawById } from '@/lib/fourPillars/readers/drawsReader';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ drawId: string }> }
) {
  try {
    const { drawId } = await params;
    const result = await readDrawById(drawId);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
