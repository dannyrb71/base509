import { NextResponse, type NextRequest } from 'next/server';

/**
 * Redirect helper for portal route handlers. Behind the D-056 middleware
 * rewrite, `req.nextUrl.origin` can collapse to the internal host (seen:
 * app.petappro.localhost → localhost), so the browser-facing origin is
 * rebuilt from the Host header. Paths are always /portal-prefixed — on
 * app.petappro.* hosts the middleware 308-canonicalizes the prefix away, on
 * dev hosts it is the real path.
 */
export function portalRedirect(req: NextRequest, path: string, status = 307): NextResponse {
  const host = req.headers.get('host') ?? req.nextUrl.host;
  const proto =
    req.headers.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  return NextResponse.redirect(new URL(`/portal${path}`, `${proto}://${host}`), status);
}
