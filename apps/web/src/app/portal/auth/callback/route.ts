import { type NextRequest } from 'next/server';
import { portalRedirect } from '@/lib/portal/redirect';
import { createPortalServerClient } from '@/lib/portal/supabase-server';
import { ensureBootstrap, resolveActiveBusiness } from '@/lib/portal/session';

/**
 * PKCE callback — the email-verification link lands here with ?code=…
 * (A1 step 2: portal access only begins on a VERIFIED session). Exchange the
 * code, run the idempotent bootstrap (account → first business), then land
 * on the caller's business route.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const to = (path: string) => portalRedirect(req, path);

  if (!code) return to('/sign-in?error=missing_code');

  const supabase = await createPortalServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return to('/sign-in?error=verification_failed');

  const { data } = await supabase.auth.getUser();
  if (!data.user) return to('/sign-in');

  try {
    const memberships = await ensureBootstrap(supabase, data.user);
    const active = await resolveActiveBusiness(memberships);
    return to(active?.slug ? `/b/${active.slug}` : '/');
  } catch {
    // Bootstrap hiccup: the session is valid; landing retries idempotently.
    return to('/auth/landing');
  }
}
