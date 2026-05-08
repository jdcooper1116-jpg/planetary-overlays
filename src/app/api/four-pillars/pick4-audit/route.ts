import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  NY_PICK4_GAME_ID,
  resolveControlledPilotDateRange,
  serializeDoc,
} from '@/lib/fourPillars/readers/pilotConstants';

const SAMPLE_LIMIT = 10;

function isFourDigitResult(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9]{4}$/.test(value);
}

function isSingleDigit(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9]$/.test(value);
}

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    const { searchParams } = new URL(req.url);
    const dateRange = resolveControlledPilotDateRange({
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
      expansion_window_id: searchParams.get('expansion_window_id') ?? undefined,
      game_id: NY_PICK4_GAME_ID,
    });

    const [drawsSnap, overlaysSnap, featuresSnap] = await Promise.all([
      db
        .collection('draws')
        .where('game_id', '==', NY_PICK4_GAME_ID)
        .where('draw_date', '>=', dateRange.date_from)
        .where('draw_date', '<=', dateRange.date_to)
        .get(),
      db
        .collection('celestial_overlays')
        .where('game_id', '==', NY_PICK4_GAME_ID)
        .where('draw_date', '>=', dateRange.date_from)
        .where('draw_date', '<=', dateRange.date_to)
        .get(),
      db
        .collection('draw_symbolic_features')
        .where('game_id', '==', NY_PICK4_GAME_ID)
        .where('draw_date', '>=', dateRange.date_from)
        .where('draw_date', '<=', dateRange.date_to)
        .get(),
    ]);

    const draws = drawsSnap.docs
      .map((doc) => serializeDoc(doc.data()))
      .sort((a, b) => {
        const dateCompare = String(a.draw_date).localeCompare(String(b.draw_date));
        if (dateCompare !== 0) return dateCompare;
        return String(a.draw_label).localeCompare(String(b.draw_label));
      });
    const overlaysByDrawId = new Set(
      overlaysSnap.docs.map((doc) => doc.data().draw_id).filter(Boolean)
    );
    const featuresByDrawId = new Map(
      featuresSnap.docs.map((doc) => {
        const data = serializeDoc(doc.data());
        return [data.draw_id as string, data] as const;
      })
    );

    const wrongLengthRows = draws.filter((draw) => !isFourDigitResult(draw.result_padded));
    const missingDigit4Rows = draws.filter((draw) => !isSingleDigit(draw.digit_4));
    const leadingZeroRows = draws.filter(
      (draw) => typeof draw.result_padded === 'string' && draw.result_padded.startsWith('0')
    );
    const missingDigit4VedicRows = draws.filter((draw) => {
      const features = featuresByDrawId.get(draw.draw_id as string);
      return !features || typeof features.digit_4_vedic_planet !== 'string';
    });

    const samplePick4Rows = draws.slice(0, SAMPLE_LIMIT).map((draw) => {
      const drawId = draw.draw_id as string;
      const features = featuresByDrawId.get(drawId);
      return {
        draw_id: drawId,
        draw_date: draw.draw_date,
        draw_label: draw.draw_label,
        result_padded: draw.result_padded,
        digit_1: draw.digit_1,
        digit_2: draw.digit_2,
        digit_3: draw.digit_3,
        digit_4: draw.digit_4,
        digit_4_vedic_planet: features?.digit_4_vedic_planet ?? null,
        overlay_found: overlaysByDrawId.has(drawId),
        symbolic_features_found: featuresByDrawId.has(drawId),
      };
    });

    return NextResponse.json({
      ok: true,
      pilot_scope: {
        game_id: NY_PICK4_GAME_ID,
        expansion_window_id: dateRange.window_id,
        date_from: dateRange.date_from,
        date_to: dateRange.date_to,
      },
      status: {
        draws_mirrored: draws.length,
        overlays_built: overlaysSnap.docs.length,
        symbolic_features_built: featuresSnap.docs.length,
        wrong_length_result_count: wrongLengthRows.length,
        missing_digit_4_count: missingDigit4Rows.length,
        missing_digit_4_vedic_planet_count: missingDigit4VedicRows.length,
        leading_zero_result_count: leadingZeroRows.length,
      },
      sample_pick4_rows: samplePick4Rows,
      audit_failures: {
        wrong_length_results: wrongLengthRows.map((draw) => ({
          draw_id: draw.draw_id,
          result_padded: draw.result_padded,
        })),
        missing_digit_4: missingDigit4Rows.map((draw) => ({
          draw_id: draw.draw_id,
          result_padded: draw.result_padded,
          digit_4: draw.digit_4,
        })),
        missing_digit_4_vedic_planet: missingDigit4VedicRows.map((draw) => ({
          draw_id: draw.draw_id,
          result_padded: draw.result_padded,
          digit_4_vedic_planet:
            featuresByDrawId.get(draw.draw_id as string)?.digit_4_vedic_planet ?? null,
        })),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
