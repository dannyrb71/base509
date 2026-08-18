import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import type { Metadata } from 'next';

/* Branded 404 (Danny-approved, Cowork mockup). Brand comes from the host
   header using the same D-056 HOST_MAP logic as src/middleware.ts — this
   page renders for real dead URLs on the branded domains AND for the
   /portal block on *.vercel.app hosts (middleware rewrites those here).
   Error pages are never worth indexing. */
const PETAPPRO_HOSTS = new Set(['petappro.com', 'www.petappro.com', 'petappro.localhost', 'app.petappro.com', 'app.petappro.localhost']);

/* Unknown hosts (vercel.app, bare localhost) fall back to Base509 — the
   same safe default the middleware uses for unknown production hosts. */
function brandForHost(host: string): 'petappro' | 'base509' {
  return PETAPPRO_HOSTS.has(host) ? 'petappro' : 'base509';
}

async function currentBrand() {
  const host = ((await headers()).get('host') ?? '').split(':')[0].toLowerCase();
  return brandForHost(host);
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await currentBrand();
  return {
    title: brand === 'petappro' ? 'Page not found · PetAppro' : 'Page not found · Base509',
    robots: { index: false, follow: false },
  };
}

/* Inline so the paw takes color from CSS (--pa-camo-600) via currentColor —
   an <img> of the exported asset couldn't. */
function PawGlyph() {
  return (
    <svg className="nf-paw" viewBox="0 0 120 120" aria-hidden="true" focusable="false" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="27" cy="47" rx="13" ry="18" transform="rotate(-24 27 47)" />
      <ellipse cx="50" cy="30" rx="13" ry="19" transform="rotate(-8 50 30)" />
      <ellipse cx="76" cy="31" rx="13" ry="19" transform="rotate(9 76 31)" />
      <ellipse cx="97" cy="49" rx="12" ry="17" transform="rotate(26 97 49)" />
      <path d="M61 58c14 0 26 9 30 22 3 10-2 21-12 24-6 2-12 0-18-3-6 3-12 5-18 3-10-3-15-14-12-24 4-13 16-22 30-22z" />
    </svg>
  );
}

function PetAppro404() {
  return (
    <div data-brand="petappro" className="brand-root">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&family=Manrope:wght@400;700&family=Noticia+Text:wght@400;700&family=Nunito+Sans:wght@400;700&family=Oswald:wght@400;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;700&family=Source+Serif+4:wght@400;700&family=Ubuntu:wght@400;700&display=swap"
      />
      <main className="nf-page">
        <Link href="/petappro" aria-label="PetAppro home">
          <Image className="petappro-wordmark" src="/brands/petappro/petappro-wordmark.svg" alt="Petappro" width={166} height={40} unoptimized />
        </Link>
        <div className="nf-figure" aria-hidden="true"><span>4</span><PawGlyph /><span>4</span></div>
        <h1 className="nf-title">This page went walkies</h1>
        <p className="nf-body">We sniffed around but couldn&rsquo;t find it. The link may have moved, or it never existed. Let&rsquo;s get you back on the trail.</p>
        <div className="nf-actions">
          <Link className="btn btn--cta btn--lg" href="/petappro">Back to home</Link>
          <Link className="nf-secondary" href="/petappro/signup">Get early access &rarr;</Link>
        </div>
      </main>
    </div>
  );
}

function Base509404() {
  return (
    <div data-brand="base509" className="brand-root">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
      />
      <main className="nf-page">
        <Link href="/base509" aria-label="Base509 home">
          <Image src="/brands/base509/base509-logo.svg" alt="Base509" width={132} height={30} />
        </Link>
        <p className="eyebrow nf-kicker">Error 404</p>
        {/* non-breaking hyphen keeps "uh-oh" one warm aside between the 4s */}
        <div className="nf-figure" aria-hidden="true"><span>4</span><span className="nf-aside">uh&#8209;oh</span><span>4</span></div>
        <h1 className="nf-title">This page isn&rsquo;t here</h1>
        <p className="nf-body">The page you&rsquo;re looking for may have moved, or it never existed. No dead ends &mdash; let&rsquo;s get you back to something useful.</p>
        <div className="nf-actions">
          <Link className="btn btn--cta btn--lg" href="/base509">Back to home</Link>
          <a className="nf-secondary" href="mailto:support@base509.com">Get in touch &rarr;</a>
        </div>
        <p className="nf-tagline">Real needs. Good ideas. Well made.</p>
      </main>
    </div>
  );
}

export default async function NotFound() {
  return (await currentBrand()) === 'petappro' ? <PetAppro404 /> : <Base509404 />;
}
