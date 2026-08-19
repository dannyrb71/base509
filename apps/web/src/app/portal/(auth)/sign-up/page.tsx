import type { Metadata } from 'next';
import { PortalSignUpForm } from '@/components/PortalSignUpForm';

export const metadata: Metadata = { title: 'Create your account' };

export default function PortalSignUpPage() {
  return <PortalSignUpForm />;
}
