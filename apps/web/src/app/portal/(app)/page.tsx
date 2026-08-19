import type { Metadata } from 'next';
import { PortalDashboardView } from '@/components/PortalDashboardView';

export const metadata: Metadata = { title: 'Dashboard' };

export default function PortalDashboard() {
  return <PortalDashboardView />;
}
