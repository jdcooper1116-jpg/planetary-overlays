import { NextResponse } from 'next/server';
import { readPilotStatus } from '@/lib/fourPillars/readers/statusReader';

export async function GET() {
  try {
    const status = await readPilotStatus();
    return NextResponse.json({ ok: true, ...status });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
