'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/phase2/status', label: '📊 Status' },
  { href: '/phase2/draws', label: '🎱 Draws' },
  { href: '/phase2/overlays', label: '🌙 Overlays' },
  { href: '/phase2/features', label: '✨ Features' },
  { href: '/phase2/hypotheses', label: '🔬 Hypotheses' },
  { href: '/phase2/evidence', label: '📋 Evidence' },
  { href: '/phase2/forecasts', label: '🎯 Forecasts' },
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
          <div className="text-sm font-semibold text-gray-100">Phase 2 Dashboard</div>
          <div className="text-xs text-gray-500 mt-1">NY Pick 3 · Jan 2024</div>
        </div>
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2.5 text-sm transition-colors ${
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
        <div className="px-4 py-4 border-t border-gray-800 text-xs text-gray-600 font-mono">
          planetary-overlays
          <br />
          phase2 · read-only
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
