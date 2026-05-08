import DashboardShell from '@/components/phase2/DashboardShell';

export const metadata = { title: 'Four Pillars · Phase 5' };

export default function Phase5Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
