import type { Metadata } from 'next';
import { PortalMarketingView } from '@/components/PortalMarketingView';

export const metadata: Metadata = { title: 'Marketing' };

export default function PortalMarketingPage() {
  return <PortalMarketingView />;
}
