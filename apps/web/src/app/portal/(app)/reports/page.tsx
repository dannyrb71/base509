import type { Metadata } from 'next';
import { PortalReportsView } from '@/components/PortalReportsView';

export const metadata: Metadata = { title: 'Business Reports' };

export default function PortalReportsPage() {
  return <PortalReportsView />;
}
