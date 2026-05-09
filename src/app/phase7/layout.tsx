import DashboardShell from '@/components/phase2/DashboardShell';

export const metadata = { title: 'Four Pillars · Phase 7' };

export default function Phase7Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
