import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'PetAppro for pet owners' };

/**
 * A2 routing terminus for customer-only accounts: the web portal is
 * provider-only, so an account whose only relationships are client
 * relationships is pointed at the app — never offered a provider tenant.
 */
export default function PortalAppOnlyPage() {
  return (
    <div className="portal-auth__success" role="status">
      <h1 className="type-title-lg">You’re all set — in the app</h1>
      <p className="type-body">
        This account is set up as a <strong>pet owner</strong>. Booking, messages, and
        your pets all live in the PetAppro app — this website portal is where pet-care
        businesses run their operations.
      </p>
      <p className="type-body">
        Grab the app on your phone and sign in with this same account.
      </p>
      <div className="type-caption portal-auth__alt">
        Run a pet-care business too? <Link href="/portal/sign-up">Create a provider account</Link>
        {' '}· <form action="/portal/auth/sign-out" method="post" className="portal-auth__inline-form"><button className="portal-auth__linklike" type="submit">Sign out</button></form>
      </div>
    </div>
  );
}
