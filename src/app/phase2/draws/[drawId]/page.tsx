import { readDrawById } from '@/lib/fourPillars/readers/drawsReader';
import KeyValueBlock from '@/components/phase2/KeyValueBlock';
import EvidenceTable from '@/components/phase2/EvidenceTable';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 30;

interface PageProps {
  params: { drawId: string };
}

export default async function DrawDetailPage({ params }: PageProps) {
  const { drawId } = await params;
  const { draw, overlay, features, evidence } = await readDrawById(drawId);

  if (!draw) notFound();

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-600 font-mono">
        <Link href="/phase2/draws" className="text-indigo-400 hover:text-indigo-300">draws</Link>
        {' '}/{' '}
        <span className="text-gray-300">{draw.draw_id as string}</span>
      </div>

      {/* Hero */}
      <div className="bg-gray-900 border border-indigo-900/50 rounded-xl px-6 py-5 mb-8 flex items-center gap-8 flex-wrap">
        <div>
          <div className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-1">Result</div>
          <div className="text-5xl font-bold font-mono text-indigo-300 tracking-[0.3em]">
            {draw.result_padded as string}
          </div>
        </div>
        <div className="flex gap-6 flex-wrap">
          {[
            { label: 'Date', value: draw.draw_date },
            { label: 'Label', value: draw.draw_label },
            { label: 'Digit Sum', value: draw.digit_sum },
            { label: 'Digit Root', value: draw.digit_root },
            { label: 'Confidence', value: draw._time_confidence },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-gray-500 font-mono uppercase tracking-wide mb-0.5">{label}</div>
              <div className="text-base font-semibold text-gray-100 font-mono">{String(value ?? '—')}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Draw data */}
        <KeyValueBlock
          title="Mirrored Draw"
          rows={[
            { label: 'draw_id', value: draw.draw_id },
            { label: 'engine_record_id', value: draw.engine_record_id },
            { label: 'draw_date', value: draw.draw_date },
            { label: 'draw_label', value: draw.draw_label },
            { label: 'result_padded', value: draw.result_padded },
            { label: 'numbers', value: (draw.numbers as string[])?.join(', ') },
            { label: 'digit_1 / 2 / 3', value: `${draw.digit_1} · ${draw.digit_2} · ${draw.digit_3}` },
            { label: 'digit_sum', value: draw.digit_sum },
            { label: 'digit_root', value: draw.digit_root },
            { label: 'draw_datetime_local', value: draw.draw_datetime_local },
            { label: 'draw_datetime_utc', value: draw.draw_datetime_utc },
            { label: '_time_confidence', value: draw._time_confidence },
            { label: 'mirror_version', value: draw.mirror_version },
            { label: 'correction_version', value: draw.correction_version },
            { label: 'validation_status', value: draw.validation_status },
            { label: 'overlay_stale', value: draw.overlay_stale },
            { label: 'features_stale', value: draw.features_stale },
            { label: 'evidence_stale', value: draw.evidence_stale },
          ]}
        />

        {/* Overlay */}
        {overlay ? (
          <KeyValueBlock
            title="Celestial Overlay"
            rows={[
              { label: 'overlay_id', value: overlay.overlay_id },
              { label: 'moon_phase_name', value: overlay.moon_phase_name },
              { label: 'moon_phase_angle', value: overlay.moon_phase_angle },
              { label: 'moon_illumination', value: overlay.moon_illumination_fraction },
              { label: 'is_waxing', value: overlay.is_waxing },
              { label: 'moon_sign', value: overlay.moon_sign },
              { label: 'moon_ecliptic_lon', value: overlay.moon_ecliptic_longitude },
              { label: 'sun_sign', value: overlay.sun_sign },
              { label: 'sun_ecliptic_lon', value: overlay.sun_ecliptic_longitude },
              { label: 'time_confidence', value: overlay.time_confidence },
              { label: 'overlay_version', value: overlay.overlay_version },
              { label: 'computation_method', value: overlay.computation_method },
              { label: 'ephemeris_version', value: overlay.ephemeris_version },
              { label: 'computed_at', value: overlay.computed_at },
            ]}
          />
        ) : (
          <div className="bg-gray-900 border border-amber-900/40 rounded-lg px-5 py-4 text-sm text-amber-400">
            No overlay found for this draw. Run build-overlays to generate it.
          </div>
        )}

        {/* Symbolic features */}
        {features ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KeyValueBlock
              title="Calendar + Ruler"
              rows={[
                { label: 'weekday_name', value: features.weekday_name },
                { label: 'weekday_ruler', value: features.weekday_ruler },
                { label: 'month_number', value: features.month_number },
                { label: 'season', value: features.season },
              ]}
            />
            <KeyValueBlock
              title="Numerology"
              rows={[
                { label: 'digit_sum', value: features.digit_sum },
                { label: 'digit_root', value: features.digit_root },
                { label: 'digit_sum_mod3', value: features.digit_sum_mod3 },
                { label: 'digit_sum_mod9', value: features.digit_sum_mod9 },
                { label: 'is_triple', value: features.is_triple },
                { label: 'is_double', value: features.is_double },
                { label: 'is_fibonacci_result', value: features.is_fibonacci_result },
              ]}
            />
            <KeyValueBlock
              title="Vedic Planets"
              rows={[
                { label: 'digit_1_vedic_planet', value: features.digit_1_vedic_planet },
                { label: 'digit_2_vedic_planet', value: features.digit_2_vedic_planet },
                { label: 'digit_3_vedic_planet', value: features.digit_3_vedic_planet },
              ]}
            />
            <KeyValueBlock
              title="Astrology"
              rows={[
                { label: 'moon_phase_name', value: features.moon_phase_name },
                { label: 'moon_sign', value: features.moon_sign },
                { label: 'sun_sign', value: features.sun_sign },
                { label: 'is_waxing', value: features.is_waxing },
                { label: 'symbolic_version', value: features.symbolic_version },
              ]}
            />
          </div>
        ) : (
          <div className="bg-gray-900 border border-amber-900/40 rounded-lg px-5 py-4 text-sm text-amber-400">
            No symbolic features found. Run build-features.
          </div>
        )}

        {/* Evidence */}
        <div>
          <div className="text-sm font-semibold text-gray-300 mb-3">
            Evidence Records ({evidence.length})
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <EvidenceTable evidence={evidence} showDrawLink={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
