import type { Metadata } from 'next';
import { PortalSignInForm } from '@/components/PortalSignInForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function PortalSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <PortalSignInForm arrivalError={error} />;
}
