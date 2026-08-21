import type { Metadata } from 'next';
import { PortalAccountView } from '@/components/PortalAccountView';

export const metadata: Metadata = { title: 'Account Settings' };

export default async function PortalAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ linked?: string }>;
}) {
  const { linked } = await searchParams;
  return (
    <PortalAccountView
      justLinked={linked === 'google' || linked === 'apple' ? linked : undefined}
    />
  );
}
