'use client';

import { useState } from 'react';

interface ReviewActionPanelProps {
  candidateId: string;
  registryId?: string | null;
  reviewStatus?: string | null;
  forecastApproved?: boolean;
}

async function postAction(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

  return data;
}

export default function ReviewActionPanel({
  candidateId,
  registryId,
  reviewStatus,
  forecastApproved,
}: ReviewActionPanelProps) {
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(endpoint: string) {
    try {
      setBusy(endpoint);
      setError(null);
      setMessage(null);

      await postAction(endpoint, {
        candidateId,
        registryId,
        notes,
      });

      setMessage('Action saved. Refresh the page to see the latest review state.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5">
      <div className="text-lg font-semibold text-gray-100 mb-2">Review Actions</div>
      <p className="text-sm text-gray-400 mb-4">
        These actions are permanent. Approving sets <span className="font-mono text-green-400">forecast_approved=true</span>{' '}
        on the registry entry. Rejected candidates are archived, not deleted.
      </p>

      <div className="text-xs font-mono text-gray-500 mb-3">
        review_status: {reviewStatus ?? 'pending'} · forecast_approved: {forecastApproved ? 'true' : 'false'}
      </div>

      <label className="block text-sm text-gray-400 mb-2">
        Review Notes (optional — stored permanently)
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Reason for this decision, observations, caveats..."
        className="w-full min-h-[110px] rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-gray-100 placeholder:text-gray-500 mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => run('/api/four-pillars/phase4/approve-candidate')}
          disabled={busy !== null}
          className="rounded-lg px-4 py-3 bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white font-semibold"
        >
          {busy === '/api/four-pillars/phase4/approve-candidate' ? 'Working…' : '✓ Approve for Forecast Use'}
        </button>

        <button
          type="button"
          onClick={() => run('/api/four-pillars/phase4/reject-candidate')}
          disabled={busy !== null}
          className="rounded-lg px-4 py-3 bg-rose-700 hover:bg-rose-600 disabled:opacity-60 text-white font-semibold"
        >
          {busy === '/api/four-pillars/phase4/reject-candidate' ? 'Working…' : '✗ Reject Permanently'}
        </button>

        <button
          type="button"
          onClick={() => run('/api/four-pillars/phase4/return-candidate-to-queue')}
          disabled={busy !== null}
          className="rounded-lg px-4 py-3 bg-sky-700 hover:bg-sky-600 disabled:opacity-60 text-white font-semibold"
        >
          {busy === '/api/four-pillars/phase4/return-candidate-to-queue' ? 'Working…' : '↺ Return to Queue'}
        </button>

        <button
          type="button"
          onClick={() => run('/api/four-pillars/phase4/mark-candidate-needs-more-data')}
          disabled={busy !== null}
          className="rounded-lg px-4 py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold"
        >
          {busy === '/api/four-pillars/phase4/mark-candidate-needs-more-data' ? 'Working…' : '… Mark Needs More Data'}
        </button>
      </div>

      {message ? <div className="mt-4 text-sm text-green-400">{message}</div> : null}
      {error ? <div className="mt-4 text-sm text-rose-400">{error}</div> : null}
    </div>
  );
}
