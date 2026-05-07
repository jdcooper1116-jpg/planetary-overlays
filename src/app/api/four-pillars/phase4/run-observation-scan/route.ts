import { NextResponse } from 'next/server';
import { runObservationScan } from '@/lib/fourPillars/observation/observationEngine';

export async function POST() {
  try {
    const result = await runObservationScan();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
