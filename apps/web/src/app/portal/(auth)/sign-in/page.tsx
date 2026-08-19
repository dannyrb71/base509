import type { Metadata } from 'next';
import { PortalSignInForm } from '@/components/PortalSignInForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function PortalSignInPage() {
  return <PortalSignInForm />;
}
