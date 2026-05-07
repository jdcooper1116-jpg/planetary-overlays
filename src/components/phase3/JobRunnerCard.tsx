'use client';

import { useState } from 'react';

type JobColor = 'indigo' | 'green' | 'amber' | 'rose' | 'sky' | 'violet' | 'emerald' | 'cyan';

type JobRunnerCardProps = {
  title: string;
  description: string;
  endpoint: string;
  body?: Record<string, unknown>;
  color: JobColor;
  order: string;
};

const COLOR_STYLES: Record<JobColor, string> = {
  indigo: 'border-indigo-800 bg-indigo-950/30',
  violet: 'border-indigo-800 bg-indigo-950/30',
  green: 'border-green-800 bg-green-950/30',
  emerald: 'border-green-800 bg-green-950/30',
  amber: 'border-amber-800 bg-amber-950/30',
  rose: 'border-rose-800 bg-rose-950/30',
  sky: 'border-sky-800 bg-sky-950/30',
  cyan: 'border-sky-800 bg-sky-950/30',
};

export default function JobRunnerCard({
  title,
  description,
  endpoint,
  body,
  color,
  order,
}: JobRunnerCardProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string>('');

  async function runJob() {
    try {
      setRunning(true);
      setResult('');

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json().catch(() => ({}));
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(
        JSON.stringify(
          { ok: false, error: err instanceof Error ? err.message : String(err) },
          null,
          2
        )
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className={`rounded-xl border p-4 ${COLOR_STYLES[color]}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400">{order}</div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <button
          onClick={runJob}
          disabled={running}
          className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Running...' : 'Run'}
        </button>
      </div>

      <p className="mb-3 text-sm text-gray-300">{description}</p>
      <div className="mb-3 text-xs font-mono text-gray-400">{endpoint}</div>

      {result ? (
        <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-gray-200">
{result}
        </pre>
      ) : null}
    </div>
  );
}
