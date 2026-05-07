/**
 * Phase 3 layout reuses the DashboardShell from Phase 2.
 * The shell already has navigation; Phase 3 pages appear under /phase3/*.
 * We use the same shell so the nav is consistent.
 */
import DashboardShell from '@/components/phase2/DashboardShell';

export const metadata = {
  title: 'Four Pillars · Phase 3',
};

export default function Phase3Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
