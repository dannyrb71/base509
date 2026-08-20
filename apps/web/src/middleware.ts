import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Portal auth gate (Phase A/A1). Paths a signed-out visitor may reach —
 * expressed WITHOUT the /portal prefix (the app.petappro.com shape).
 */
const PORTAL_PUBLIC_PATHS = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/auth', '/login', '/signup'];

function isPortalPublicPath(portalPath: string) {
  return PORTAL_PUBLIC_PATHS.some((p) => portalPath === p || portalPath.startsWith(`${p}/`));
}

/**
 * Session refresh + route protection for the portal (the documented
 * @supabase/ssr middleware shape): refreshed auth cookies attach to the
 * response we were going to send; unauthenticated requests to protected
 * portal paths bounce to sign-in. `linkPrefix` is '' on the app.petappro
 * host (paths are already portal-relative) and '/portal' on dev hosts.
 * Host-only, product-named cookie — never Domain=.petappro.com (§3.2).
 */
async function portalAuthGate(
  req: NextRequest,
  res: NextResponse,
  portalPath: string,
  linkPrefix: string,
) {
  const supaUrl = process.env.NEXT_PUBLIC_PORTAL_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_PORTAL_SUPABASE_ANON_KEY;
  if (!supaUrl || !anonKey) return res; // env not configured (e.g. bare CI build) — pages self-guard too

  const supabase = createServerClient(supaUrl, anonKey, {
    cookieOptions: {
      name: 'pa-portal-auth',
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          res.cookies.set(name, value, options);
        }
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user && !isPortalPublicPath(portalPath)) {
    const url = req.nextUrl.clone();
    url.pathname = `${linkPrefix}/sign-in`;
    url.search = '';
    return NextResponse.redirect(url);
  }
  return res;
}

/**
 * Multi-domain routing (D-056): one codebase, brands routed by hostname.
 * Adding a vertical = a new entry here + a new theme. Nothing else changes.
 *
 * Local dev (no DNS needed — *.localhost resolves automatically in modern browsers):
 *   http://base509.localhost:3000      → base509.com
 *   http://petappro.localhost:3000     → petappro.com
 *   http://app.petappro.localhost:3000 → app.petappro.com
 *   http://localhost:3000              → dev surface switcher (never reachable in prod)
 */
const HOST_MAP: Record<string, string> = {
  'base509.com': 'base509',
  'www.base509.com': 'base509',
  'base509.localhost': 'base509',

  'petappro.com': 'petappro',
  'www.petappro.com': 'petappro',
  'petappro.localhost': 'petappro',

  'app.petappro.com': 'portal',
  'app.petappro.localhost': 'portal',
};

/** Hosts that get the dev switcher + direct path access instead of a rewrite. */
function isDevHost(host: string) {
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.vercel.app') // preview deploys navigate via the switcher
  );
}

export async function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase();
  const { pathname } = req.nextUrl;

  // Never rewrite Next internals or public static assets. (Deliberately an
  // explicit list — a generic "contains a dot" check would swallow versioned
  // policy URLs like /policies/terms/v/0.1.)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/brands/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  if (isDevHost(host)) {
    // The .vercel.app URLs allow direct path access for preview navigation,
    // which exposed the auth-less portal publicly (found 2026-08-17). Until
    // app.petappro.com launches behind real subscription auth (D-061), the
    // portal is localhost-only: review portal changes on the dev server.
    // Rewriting to an unroutable path (not a bare NextResponse 404) lets
    // Next render the branded not-found page with a 404 status instead of
    // a blank white window.
    if (pathname.startsWith('/portal') && host.endsWith('.vercel.app')) {
      const url = req.nextUrl.clone();
      url.pathname = '/__portal-blocked__';
      return NextResponse.rewrite(url);
    }
    // Dev-host portal access (localhost switcher / app.petappro.localhost is
    // handled below via HOST_MAP): same auth gate, /portal-prefixed links.
    if (pathname === '/portal' || pathname.startsWith('/portal/')) {
      return portalAuthGate(req, NextResponse.next(), pathname.slice('/portal'.length) || '/', '/portal');
    }
    return NextResponse.next();
  }

  const brand = HOST_MAP[host] ?? 'base509'; // unknown production host → safe default

  // Canonicalize brand-prefixed paths on branded hosts. All internal links are
  // written path-addressed for the preview (`/petappro/features`), so on
  // petappro.com a click would otherwise double-prefix into /petappro/petappro/…
  // Same-brand prefix → strip it (petappro.com/petappro/features → /features).
  // Other marketing brand's prefix → hop to that brand's own domain.
  // `portal` joined the list with Phase A/A1: portal-internal links are
  // written /portal-prefixed (they must also work on dev hosts), so on
  // app.petappro.* the same-brand prefix strips exactly like the marketing
  // brands (308 keeps method for sign-out POSTs).
  const seg = pathname.split('/')[1];
  if (seg === 'base509' || seg === 'petappro' || seg === 'portal') {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(seg.length + 1) || '/';
    if (seg !== brand) {
      const segHost = seg === 'portal' ? 'app.petappro' : seg;
      if (host.endsWith('.localhost')) {
        url.host = `${segHost}.localhost${req.nextUrl.port ? `:${req.nextUrl.port}` : ''}`;
      } else {
        url.protocol = 'https:';
        url.host = `${segHost}.com`;
        url.port = '';
      }
    }
    return NextResponse.redirect(url, 308);
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${brand}${pathname === '/' ? '' : pathname}`;
  const res = NextResponse.rewrite(url);
  if (brand === 'portal') {
    return portalAuthGate(req, res, pathname, '');
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
