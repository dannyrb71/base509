import type { Metadata } from 'next';
import { PortalClientsView } from '@/components/PortalClientsView';

export const metadata: Metadata = { title: 'Clients & Roster' };

export default function PortalClientsPage() {
  return <PortalClientsView />;
}
