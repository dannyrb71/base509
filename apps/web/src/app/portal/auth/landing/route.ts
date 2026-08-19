import { type NextRequest } from 'next/server';
import { portalRedirect } from '@/lib/portal/redirect';
import { getPortalUser, ensureBootstrap, resolveActiveBusiness } from '@/lib/portal/session';

/**
 * Post-auth landing: sign-in (and callback retries) come here with a live
 * session; runs the idempotent bootstrap and forwards to the active
 * business route.
 */
export async function GET(req: NextRequest) {
  const to = (path: string) => portalRedirect(req, path);

  const { supabase, user } = await getPortalUser();
  if (!user) return to('/sign-in');

  const memberships = await ensureBootstrap(supabase, user);
  const active = await resolveActiveBusiness(memberships);
  return to(active?.slug ? `/b/${active.slug}` : '/');
}
