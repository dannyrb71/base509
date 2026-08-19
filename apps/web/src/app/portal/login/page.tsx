import { redirect } from 'next/navigation';

/** Legacy path — the real page is /sign-in (A1). */
export default function PortalLogin() {
  redirect('/portal/sign-in');
}
