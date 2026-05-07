'use client';

import { useState } from 'react';

interface ReviewNotesFormProps {
  candidateId: string;
  existingNotes?: string;
}

export default function ReviewNotesForm({
  candidateId,
  existingNotes = '',
}: ReviewNotesFormProps) {
  const [notes, setNotes] = useState(existingNotes);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveOnly() {
    try {
      setBusy(true);
      setSaved(null);
      setError(null);

      const res = await fetch('/api/four-pillars/phase4/mark-candidate-needs-more-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, notes, saveOnly: true }),
      });

      const text = await res.text();
      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!res.ok) {
        throw new Error(typeof data === 'object' && data && 'error' in (data as Record<string, unknown>)
          ? String((data as Record<string, unknown>).error)
          : `Request failed: ${res.status}`);
      }

      setSaved('Notes saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
      <div className="text-lg font-semibold text-gray-100 mb-2">Review Notes</div>
      <p className="text-sm text-gray-400 mb-4">
        Keep audit notes on why this candidate should be approved, rejected, or revisited later.
      </p>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full min-h-[180px] rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-gray-100 placeholder:text-gray-500"
        placeholder="Add review notes, caveats, ideas for follow-up, or rationale..."
      />

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={saveOnly}
          disabled={busy}
          className="rounded-lg px-4 py-2 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-60 text-white font-semibold"
        >
          {busy ? 'Saving…' : 'Save Notes'}
        </button>

        {saved ? <span className="text-sm text-green-400">{saved}</span> : null}
        {error ? <span className="text-sm text-rose-400">{error}</span> : null}
      </div>
    </div>
  );
}
