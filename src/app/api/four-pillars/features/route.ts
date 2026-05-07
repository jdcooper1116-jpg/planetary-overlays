import { NextRequest, NextResponse } from 'next/server';
import { readFeatures } from '@/lib/fourPillars/readers/featuresReader';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const features = await readFeatures({
      date: searchParams.get('date') ?? undefined,
      label: searchParams.get('label') ?? undefined,
      weekday: searchParams.get('weekday') ?? undefined,
      moon_sign: searchParams.get('moon_sign') ?? undefined,
    });
    return NextResponse.json({ ok: true, count: features.length, features });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
