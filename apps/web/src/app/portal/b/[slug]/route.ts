import { type NextRequest } from 'next/server';
import { portalRedirect } from '@/lib/portal/redirect';
import { getPortalUser, ensureBootstrap, ACTIVE_BUSINESS_COOKIE } from '@/lib/portal/session';

/**
 * Business route (A1): /b/<slug> proves the CALLER's membership in the slug's
 * business, pins it as the active-business UX hint, and enters the portal.
 * The slug is a selector, never authority — a slug the caller isn't a member
 * of simply falls back to their own landing (tenant-safe: no existence leak).
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const to = (path: string) => portalRedirect(req, path);

  const { supabase, user } = await getPortalUser();
  if (!user) return to('/sign-in');

  const { slug } = await ctx.params;
  const memberships = await ensureBootstrap(supabase, user);
  const mine = memberships.find((m) => m.slug === slug);
  if (!mine) return to('/auth/landing');

  const res = to('/');
  res.cookies.set(ACTIVE_BUSINESS_COOKIE, slug, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    // host-only on purpose (no domain)
  });
  return res;
}
