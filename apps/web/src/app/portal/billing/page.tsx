import type { Metadata } from 'next';
import { PortalBillingView } from '@/components/PortalBillingView';

export const metadata: Metadata = { title: 'Plan & Subscription' };

export default function PortalBillingPage() {
  return <PortalBillingView />;
}
