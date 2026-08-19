import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Per-request server Supabase client for the provider portal (Phase A).
 * PKCE + cookie-backed sessions per the ratified SSR boundary
 * (technical_architecture.md §3.2):
 *  - HOST-ONLY cookie (no Domain attribute — never .petappro.com): the
 *    portal session must not leak to marketing subdomains.
 *  - SameSite=Lax, Secure in production, product-specific cookie name.
 *  - A new client per request; never module-scope (no shared sessions).
 * Target project is server-configured env (petappro-dev during Phase A) —
 * never accepted from client input.
 */

export const PORTAL_AUTH_COOKIE = 'pa-portal-auth';

export function portalCookieOptions() {
  return {
    name: PORTAL_AUTH_COOKIE,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    // NO `domain` — host-only on purpose.
  };
}

function portalEnv() {
  const url = process.env.NEXT_PUBLIC_PORTAL_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_PORTAL_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Portal Supabase env missing: set NEXT_PUBLIC_PORTAL_SUPABASE_URL / _ANON_KEY (see .env.example)');
  }
  return { url, anonKey };
}

export async function createPortalServerClient() {
  const { url, anonKey } = portalEnv();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookieOptions: portalCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies; middleware refreshes the
          // session, so swallowing here is the documented @supabase/ssr shape.
        }
      },
    },
  });
}
