'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_GROUPS = [
  {
    label: 'Phase 2',
    items: [
      { href: '/phase2/status', label: '📊 Status' },
      { href: '/phase2/draws', label: '🎱 Draws' },
      { href: '/phase2/overlays', label: '🌙 Overlays' },
      { href: '/phase2/features', label: '✨ Features' },
      { href: '/phase2/hypotheses', label: '🔬 Hypotheses' },
      { href: '/phase2/evidence', label: '📋 Evidence' },
      { href: '/phase2/forecasts', label: '🎯 Forecasts' },
    ],
  },
  {
    label: 'Phase 3',
    items: [
      { href: '/phase3/research', label: '🔍 Research' },
      { href: '/phase3/jobs', label: '⚙️ Jobs' },
      { href: '/phase3/forecast-debug', label: '🐛 Forecast Debug' },
    ],
  },
  {
    label: 'Phase 4',
    items: [
      { href: '/phase4/promotion', label: '🚀 Promotion Pipeline' },
      { href: '/phase4/review-queue', label: '🔎 Review Queue' },
      { href: '/phase4/observations', label: '👁 Observations' },
      { href: '/phase4/candidates', label: '🧪 Candidates' },
      { href: '/phase4/validation-runs', label: '📈 Validation Runs' },
    ],
  },
  {
    label: 'Phase 5',
    items: [
      { href: '/phase5/forecasts', label: '📡 Forecast Runs' },
      { href: '/phase5/outcomes', label: '🎰 Outcomes' },
      { href: '/phase5/hypothesis-performance', label: '📊 Hyp. Performance' },
      { href: '/phase5/pick4-evidence-review', label: '📋 Pick 4 Evidence' },
      { href: '/phase5/experiments', label: '🧬 Experiments' },
    ],
  },
  {
    label: 'Phase 6',
    items: [
      { href: '/phase6/dual-game-evidence-plan', label: '🗓 Dual-Game Plan' },
      { href: '/phase6/dual-game-evidence-comparison', label: '📊 Evidence Compare' },
      { href: '/phase6/hypothesis-refinement-plan', label: '🧭 Refinement Plan' },
    ],
  },
  {
    label: 'Phase 7',
    items: [
      { href: '/phase7/railway-research-architecture', label: 'Railway Architecture' },
      { href: '/phase7/engine-schema-contract', label: 'Engine Schema Contract' },
      { href: '/phase7/engine-api-contract', label: 'Engine API Contract' },
      { href: '/phase7/app-shell-adapter-contract', label: 'App-Shell Adapter Contract' },
    ],
  },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/phase2/status') return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-800">
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">
            Four Pillars
          </div>
          <div className="text-sm font-semibold text-gray-100">Research Dashboard</div>
          <div className="text-xs text-gray-500 mt-1">NY Pick 3 · Jan 2024</div>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label}>
              <div
                className={`px-4 pb-1 text-xs text-gray-700 font-mono uppercase tracking-widest ${
                  gi > 0 ? 'pt-4 border-t border-gray-800/60 mt-1' : 'pt-3'
                }`}
              >
                {group.label}
              </div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 text-sm transition-colors ${
                    isActive(item.href)
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-800 text-xs text-gray-700 font-mono leading-relaxed">
          planetary-overlays
          <br />
          p2·p3·p4·p4.5·p5
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
