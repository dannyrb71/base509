import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getPortalUser, listMemberships } from '@/lib/portal/session';

export const metadata: Metadata = { title: 'Choose a business' };

/** Never prerender: session-bound (same posture as the portal app segment). */
export const dynamic = 'force-dynamic';

/**
 * A2 business picker — an account with SEVERAL active memberships chooses
 * which business to enter (a business picker, never a role picker: the role
 * inside each tenant is whatever the membership says). Selecting routes
 * through /b/<slug>, which re-proves membership server-side and pins the
 * active-business hint cookie.
 */
export default async function ChooseBusinessPage() {
  const { supabase, user } = await getPortalUser();
  if (!user) redirect('/portal/sign-in');
  const memberships = await listMemberships(supabase);
  if (memberships.length === 0) redirect('/portal/auth/landing');
  if (memberships.length === 1 && memberships[0].slug) redirect(`/portal/b/${memberships[0].slug}`);

  return (
    <div className="portal-auth__choose">
      <h1 className="type-title-lg">Choose a business</h1>
      <p className="type-body portal-auth__lead">
        This account belongs to more than one business. Pick the one you’re working in —
        you can switch any time.
      </p>
      <ul className="portal-auth__choose-list">
        {memberships.map((m) => (
          <li key={m.id}>
            <Link className="portal-auth__choose-item" href={m.slug ? `/portal/b/${m.slug}` : '/portal/auth/landing'}>
              <span className="type-body-bold">{m.name}</span>
              <span className="type-caption portal-auth__choose-role">{m.role}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="type-caption portal-auth__alt">
        <form action="/portal/auth/sign-out" method="post" className="portal-auth__inline-form"><button className="portal-auth__linklike" type="submit">Sign out</button></form>
      </div>
    </div>
  );
}
