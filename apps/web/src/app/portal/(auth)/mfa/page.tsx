import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPortalUser } from '@/lib/portal/session';
import { PortalMfaForm } from '@/components/PortalMfaForm';

export const metadata: Metadata = { title: 'Two-factor verification' };
export const dynamic = 'force-dynamic';

/** A2.4 — requires a session (AAL1 is fine: this page is how it becomes AAL2). */
export default async function PortalMfaPage() {
  const { user } = await getPortalUser();
  if (!user) redirect('/portal/sign-in');
  return <PortalMfaForm />;
}
