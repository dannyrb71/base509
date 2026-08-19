'use client';

import { createBrowserClient } from '@supabase/ssr';

/** Browser client for the portal — same host-only, product-named cookie as
 *  the server client (see supabase-server.ts). */
export function createPortalBrowserClient() {
  const url = process.env.NEXT_PUBLIC_PORTAL_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_PORTAL_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Portal Supabase env missing: set NEXT_PUBLIC_PORTAL_SUPABASE_URL / _ANON_KEY');
  }
  return createBrowserClient(url, anonKey, {
    cookieOptions: {
      name: 'pa-portal-auth',
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  });
}
