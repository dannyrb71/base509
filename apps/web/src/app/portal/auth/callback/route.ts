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
  // Allowlisted post-exchange destination (password recovery lands on the
  // set-new-password page instead of the bootstrap flow).
  const next = req.nextUrl.searchParams.get('next') === '/reset-password' ? '/reset-password' : null;

  if (!code) return to(next ? '/forgot-password?error=recovery_expired' : '/sign-in?error=missing_code');

  const supabase = await createPortalServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  // Expired/already-used links exchange-fail — recovery gets a friendly
  // re-request path, verification keeps its sign-in message.
  if (error) return to(next ? '/forgot-password?error=recovery_expired' : '/sign-in?error=verification_failed');

  if (next) return to(next);

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
