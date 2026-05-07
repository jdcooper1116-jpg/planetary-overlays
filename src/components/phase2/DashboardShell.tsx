'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  // Phase 2
  { href: '/phase2/status', label: '📊 Status', group: 'phase2' },
  { href: '/phase2/draws', label: '🎱 Draws', group: 'phase2' },
  { href: '/phase2/overlays', label: '🌙 Overlays', group: 'phase2' },
  { href: '/phase2/features', label: '✨ Features', group: 'phase2' },
  { href: '/phase2/hypotheses', label: '🔬 Hypotheses', group: 'phase2' },
  { href: '/phase2/evidence', label: '📋 Evidence', group: 'phase2' },
  { href: '/phase2/forecasts', label: '🎯 Forecasts', group: 'phase2' },
  // Phase 3
  { href: '/phase3/research', label: '🔍 Research', group: 'phase3' },
  { href: '/phase3/jobs', label: '⚙️ Jobs', group: 'phase3' },
  { href: '/phase3/forecast-debug', label: '🐛 Forecast Debug', group: 'phase3' },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-800">
          <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">
            Four Pillars
          </div>
          <div className="text-sm font-semibold text-gray-100">Research Dashboard</div>
          <div className="text-xs text-gray-500 mt-1">NY Pick 3 · Jan 2024</div>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {/* Phase 2 section */}
          <div className="px-4 pt-3 pb-1">
            <span className="text-xs text-gray-700 font-mono uppercase tracking-widest">
              Phase 2
            </span>
          </div>
          {NAV_ITEMS.filter((i) => i.group === 'phase2').map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/phase2/status' && pathname.startsWith(item.href + '/')) ||
              (item.href === '/phase2/hypotheses' && pathname.startsWith('/phase2/hypotheses'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Phase 3 section */}
          <div className="px-4 pt-4 pb-1 mt-1 border-t border-gray-800/60">
            <span className="text-xs text-gray-700 font-mono uppercase tracking-widest">
              Phase 3
            </span>
          </div>
          {NAV_ITEMS.filter((i) => i.group === 'phase3').map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-gray-800 text-xs text-gray-700 font-mono leading-relaxed">
          planetary-overlays
          <br />
          p2+p3 · read-only
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
