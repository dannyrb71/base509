import { redirect } from 'next/navigation';

/** Legacy path — the real page is /sign-up (A1). */
export default function PortalSignup() {
  redirect('/portal/sign-up');
}
