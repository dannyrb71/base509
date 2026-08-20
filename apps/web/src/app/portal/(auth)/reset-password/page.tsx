import type { Metadata } from 'next';
import { PortalResetPasswordForm } from '@/components/PortalResetPasswordForm';

export const metadata: Metadata = { title: 'Choose a new password' };

export default function PortalResetPasswordPage() {
  return <PortalResetPasswordForm />;
}
