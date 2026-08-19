import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PetApproScrollTop } from '@/components/PetApproScrollTop';
import { MobileNav } from '@/components/MobileNav';
import { AccountMenu } from '@/components/AccountMenu';
import { resourcesNavVisible } from '@/lib/resources';

export const metadata: Metadata = {
  title: { default: 'PetAppro — the booking app for dog-care providers', template: '%s · PetAppro' },
  description:
    'PetAppro is the modern, mobile-first booking app for dog-care providers who already have clients — flat, predictable tiers and no marketplace cut.',
  // Per-brand favicons — each brand tree points only at its own set under
  // /brands/<brand>/. No global app/icon exists (it would override these).
  icons: {
    icon: [
      { url: '/brands/petappro/favicon.svg', type: 'image/svg+xml' },
      { url: '/brands/petappro/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brands/petappro/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/brands/petappro/favicon.ico',
    apple: '/brands/petappro/apple-touch-icon.png',
  },
  manifest: '/brands/petappro/site.webmanifest',
};

function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Image
      className={inverse ? 'petappro-wordmark petappro-wordmark--inverse' : 'petappro-wordmark'}
      src={inverse
        ? '/brands/petappro.com/site/logo-petappro_reversed.svg'
        : '/brands/petappro/petappro-wordmark.svg'}
      alt="Petappro"
      width={inverse ? 144 : 166}
      height={40}
      unoptimized
    />
  );
}

export default function PetApproLayout({ children }: { children: React.ReactNode }) {
  // "Resources" appears in nav/footer only once ≥1 section is visible AND has
  // published content (Resources build spec) — hidden until the first section
  // goes live, no half-empty destination ever linked.
  const showResources = resourcesNavVisible();
  return (
    <div data-brand="petappro" className="brand-root">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&family=Manrope:wght@400;700&family=Noticia+Text:wght@400;700&family=Nunito+Sans:wght@400;700&family=Oswald:wght@400;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;700&family=Source+Serif+4:wght@400;700&family=Ubuntu:wght@400;700&display=swap"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link href="/petappro" className="site-header__logo" aria-label="PetAppro home">
            <Wordmark />
          </Link>
          <nav className="site-header__nav" aria-label="Main">
            <Link href="/petappro/features">Features</Link>
            <Link href="/petappro/pricing">Pricing</Link>
            <Link href="/petappro/themes">Themes</Link>
            {showResources && <Link href="/petappro/resources">Resources</Link>}
            <Link href="/petappro/download">Download</Link>
            <Link href="/petappro/support">Support</Link>
          </nav>
          <div className="site-header__actions">
            {/* "Sign in" hidden pre-launch (portal not live — Danny, 2026-07-18).
                Restore when the portal ships:
                <a className="btn btn--secondary btn--sm" href="https://app.petappro.com/login">Sign in</a> */}
            <Link className="btn btn--cta btn--sm" href="/petappro/signup">Get early access</Link>
          </div>
          <AccountMenu variant="marketing" />
          <MobileNav
            variant="petappro"
            links={[
              { href: '/petappro/features', label: 'Features' },
              { href: '/petappro/pricing', label: 'Pricing' },
              { href: '/petappro/themes', label: 'Themes' },
              ...(showResources ? [{ href: '/petappro/resources', label: 'Resources' }] : []),
              { href: '/petappro/download', label: 'Download' },
              { href: '/petappro/support', label: 'Support' },
              { href: 'https://base509.com/policies/privacy', label: 'Privacy Policy' },
              { href: 'https://base509.com/policies/terms', label: 'Terms of Use' },
              { href: 'https://base509.com/policies', label: 'All Policies' },
            ]}
            cta={{ href: '/petappro/signup', label: 'Get early access' }}
          />
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="container site-footer__grid">
          <div className="site-footer__links">
            <div className="site-footer__col-title type-body">Discover</div>
            <div className="site-footer__col">
              <Link className="type-body" href="/petappro/features">Features</Link>
              <Link className="type-body" href="/petappro/pricing">Pricing</Link>
              <Link className="type-body" href="/petappro/themes">Themes</Link>
              {showResources && <Link className="type-body" href="/petappro/resources">Resources</Link>}
            </div>
          </div>
          <div className="site-footer__links">
            <div className="site-footer__col-title type-body">Important Details</div>
            <div className="site-footer__col">
              <a className="type-body" href="https://base509.com/policies/privacy">Privacy Policy</a>
              <a className="type-body" href="https://base509.com/policies/terms">Terms of Use</a>
              <a className="type-body" href="https://base509.com/policies">All Policies</a>
            </div>
          </div>
          <div className="site-footer__links">
            <div className="site-footer__col-title type-body">Need Help?</div>
            <div className="site-footer__col">
              <Link className="type-body" href="/petappro/support">FAQs</Link>
              <Link className="type-body" href="/petappro/contact">Contact Us</Link>
            </div>
          </div>
          <div className="site-footer__brand">
            <Wordmark inverse />
            <p className="type-caption">The booking app for dog-care providers. Your clients, your prices, your money.</p>
            <p className="site-footer__social type-caption">
              Follow: <a href="https://instagram.com/petappro" target="_blank" rel="noopener noreferrer">Instagram</a> · <a href="https://facebook.com/petappro" target="_blank" rel="noopener noreferrer">Facebook</a>
            </p>
            {/* /base509 canonicalizes to base509.com on branded domains (middleware). */}
            <Link href="/base509" aria-label="Base509 — the company behind PetAppro">
              <Image
                className="site-footer__base509"
                src="/brands/base509/base509-logo-reverse.svg"
                alt="Base509"
                width={73}
                height={20}
                unoptimized
              />
            </Link>
            <p className="type-caption">© 2026 Base509 LLC<br />The company behind the software.</p>
          </div>
        </div>
      </footer>
      <PetApproScrollTop />
    </div>
  );
}
