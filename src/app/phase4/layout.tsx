import DashboardShell from '@/components/phase2/DashboardShell';

export const metadata = { title: 'Four Pillars · Phase 4' };

export default function Phase4Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
