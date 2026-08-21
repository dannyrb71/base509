import { type NextRequest } from 'next/server';
import { portalRedirect } from '@/lib/portal/redirect';
import { createPortalServerClient } from '@/lib/portal/supabase-server';
import { ensureBootstrap, postAuthDestination } from '@/lib/portal/session';

/**
 * PKCE callback — every code-bearing flow lands here: email verification,
 * password recovery, magic link (A2.2), Google/Apple OAuth (A2.1), and
 * identity linking (A2.3). Exchange the code, run the idempotent CFG-1
 * bootstrap (mint account + auth_identity on a first session; an existing
 * (issuer, provider_subject) signs into its existing account — the issuer
 * is the server-derived Supabase issuer baked into the session JWT, never
 * read from input), then route per the locked A2 decision.
 */

/** Allowlisted post-exchange destinations — never an open redirect. */
function allowlistedNext(raw: string | null): string | null {
  if (!raw) return null;
  if (raw === '/reset-password' || raw === '/account') return raw;
  // Identity-link returns carry which provider was just connected (audited
  // client-side on arrival) — still a closed set, never a free-form path.
  if (/^\/account\?linked=(google|apple)$/.test(raw)) return raw;
  return null;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const to = (path: string) => portalRedirect(req, path);
  const next = allowlistedNext(req.nextUrl.searchParams.get('next'));

  // Provider-side refusals (user hit "Cancel" at Google/Apple, provider
  // error) arrive as ?error=… with no code — land back on sign-in honestly.
  const oauthError = req.nextUrl.searchParams.get('error');
  if (oauthError && !code) {
    return to(
      oauthError === 'access_denied'
        ? '/sign-in?error=oauth_cancelled'
        : '/sign-in?error=oauth_failed',
    );
  }

  if (!code) {
    return to(next === '/reset-password' ? '/forgot-password?error=recovery_expired' : '/sign-in?error=missing_code');
  }

  const supabase = await createPortalServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  // Expired/already-used links exchange-fail — recovery gets a friendly
  // re-request path, everything else keeps the sign-in message.
  if (error) {
    return to(next === '/reset-password' ? '/forgot-password?error=recovery_expired' : '/sign-in?error=verification_failed');
  }

  if (next) return to(next);

  const { data } = await supabase.auth.getUser();
  if (!data.user) return to('/sign-in');

  try {
    const memberships = await ensureBootstrap(supabase, data.user);
    return to(await postAuthDestination(memberships));
  } catch {
    // Bootstrap hiccup: the session is valid; landing retries idempotently.
    return to('/auth/landing');
  }
}
