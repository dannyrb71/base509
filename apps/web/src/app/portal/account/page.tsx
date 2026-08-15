import type { Metadata } from 'next';
import { PortalAccountView } from '@/components/PortalAccountView';

export const metadata: Metadata = { title: 'Account Settings' };

export default function PortalAccountPage() {
  return <PortalAccountView />;
}
