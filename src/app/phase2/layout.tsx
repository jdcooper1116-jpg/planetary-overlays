import DashboardShell from '@/components/phase2/DashboardShell';

export const metadata = {
  title: 'Four Pillars · Phase 2 Dashboard',
};

export default function Phase2Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
