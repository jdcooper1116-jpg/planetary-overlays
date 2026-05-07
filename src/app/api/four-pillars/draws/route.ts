import { NextRequest, NextResponse } from 'next/server';
import { readDraws } from '@/lib/fourPillars/readers/drawsReader';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const draws = await readDraws({
      date: searchParams.get('date') ?? undefined,
      label: searchParams.get('label') ?? undefined,
    });
    return NextResponse.json({ ok: true, count: draws.length, draws });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
