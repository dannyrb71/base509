'use client';

import { createPortalBrowserClient } from '@/lib/portal/supabase-browser';

/**
 * A2.1/A2.2 client-side auth starters. All three flows are PKCE and land on
 * the same /auth/callback exchange the email flows already use (the
 * @supabase/ssr browser client stores the code verifier in the shared
 * cookie jar, so the SERVER exchanges the code — one session model, A1's
 * host-only cookie, for every method).
 */

function linkPrefix() {
  return window.location.pathname.startsWith('/portal') ? '/portal' : '';
}

export function portalCallbackUrl(next?: '/account') {
  const base = `${window.location.origin}${linkPrefix()}/auth/callback`;
  return next ? `${base}?next=${next}` : base;
}

/** Google/Apple OAuth — redirects the browser to the provider. */
export async function startOAuth(provider: 'google' | 'apple'): Promise<string | null> {
  const supabase = createPortalBrowserClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: portalCallbackUrl() },
  });
  return error ? error.message : null; // success navigates away
}

/**
 * Magic link (A2.2): enumeration-safe — creates the account when new, signs
 * in when existing, and the response is uniform either way. Rate limits
 * surface as a friendly retry message.
 */
export async function sendMagicLink(email: string): Promise<{ ok?: true; error?: string }> {
  const supabase = createPortalBrowserClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: portalCallbackUrl(), shouldCreateUser: true },
  });
  if (error) {
    return {
      error: /rate|too many/i.test(error.message)
        ? 'Too many link requests — give it a minute and try again.'
        : 'Couldn’t send the link just now. Try again in a moment.',
    };
  }
  return { ok: true };
}
