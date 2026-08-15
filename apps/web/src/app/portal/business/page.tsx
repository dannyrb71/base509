import type { Metadata } from 'next';
import { PortalBusinessView } from '@/components/PortalBusinessView';

export const metadata: Metadata = { title: 'Business Settings' };

export default function PortalBusinessPage() {
  return <PortalBusinessView />;
}
