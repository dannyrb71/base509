import type { Metadata } from 'next';
import { PortalAvailabilityView } from '@/components/PortalAvailabilityView';

export const metadata: Metadata = { title: 'Availability' };

export default function PortalAvailabilityPage() {
  return <PortalAvailabilityView />;
}
