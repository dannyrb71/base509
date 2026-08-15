import { NextRequest, NextResponse } from 'next/server';

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

export function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase();
  const { pathname } = req.nextUrl;

  // Never rewrite Next internals or public static assets. (Deliberately an
  // explicit list — a generic "contains a dot" check would swallow versioned
  // policy URLs like /policies/terms/v/0.1.)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/brands/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  if (isDevHost(host)) return NextResponse.next();

  const brand = HOST_MAP[host] ?? 'base509'; // unknown production host → safe default
  const url = req.nextUrl.clone();
  url.pathname = `/${brand}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
