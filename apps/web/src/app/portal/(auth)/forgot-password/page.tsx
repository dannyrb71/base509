import type { Metadata } from 'next';
import { PortalForgotPasswordForm } from '@/components/PortalForgotPasswordForm';

export const metadata: Metadata = { title: 'Reset password' };

export default function PortalForgotPasswordPage() {
  return <PortalForgotPasswordForm />;
}
