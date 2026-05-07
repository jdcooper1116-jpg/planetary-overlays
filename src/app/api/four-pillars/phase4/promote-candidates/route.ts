import { NextResponse } from 'next/server';
import { runPromotionEngine } from '@/lib/fourPillars/autoHypotheses/promotionEngine';

export async function POST() {
  try {
    const result = await runPromotionEngine();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
