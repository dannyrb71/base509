import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MobileNav } from '@/components/MobileNav';
import { ScrollTop } from '@/components/ScrollTop';

export const metadata: Metadata = {
  title: { default: 'Base509 — software that shows up for people', template: '%s · Base509' },
  description:
    'Base509 LLC is an app development company building software people can trust — dependable, approachable, and designed for the individual first. Our first product is PetAppro, a booking app for dog-care businesses.',
  // Per-brand favicons — each brand tree points only at its own set under
  // /brands/<brand>/. No global app/icon exists (it would override these).
  icons: {
    icon: [
      { url: '/brands/base509/favicon.svg', type: 'image/svg+xml' },
      { url: '/brands/base509/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brands/base509/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/brands/base509/favicon.ico',
    apple: '/brands/base509/apple-touch-icon.png',
  },
  manifest: '/brands/base509/site.webmanifest',
};

export default function Base509Layout({ children }: { children: React.ReactNode }) {
  return (
    <div data-brand="base509" className="brand-root">
      {/* Base509 fonts — Oswald + Montserrat. This link stays inside the Base509 tree. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link href="/base509" className="site-header__logo" aria-label="Base509 home">
            <Image src="/brands/base509/base509-logo.svg" alt="Base509" width={132} height={30} priority />
          </Link>
          <nav className="site-header__nav" aria-label="Main">
            {/* Canonical nav (copy doc + Figma header): two links + the
                "Get in touch" button. The old #contact link is intentionally
                gone — the button and the footer cover it. */}
            <a href="/base509#products">What we build</a>
            <a href="/base509#about">Who we are</a>
          </nav>
          <div className="site-header__actions">
            <a className="btn btn--cta btn--sm" href="mailto:support@base509.com">Get in touch</a>
          </div>
          {/* Mobile: hamburger + full-bleed overlay (Figma 191:554). No Home
              link — you're always on Home when this nav is reachable. Policy
              links live here because the mobile footer is a long scroll away. */}
          <MobileNav
            links={[
              { href: '/base509#products', label: 'What we build' },
              { href: '/base509#about', label: 'Who we are' },
              { href: '/base509#contact', label: 'Get in Touch' },
              { href: '/base509/policies', label: 'All Policies' },
              { href: '/base509/policies/privacy', label: 'Privacy Policy' },
              { href: '/base509/policies/terms', label: 'Terms of Use' },
            ]}
          />
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="container site-footer__grid">
          <div>
            <Image src="/brands/base509/base509-logo-reverse.svg" alt="Base509" width={150} height={34} />
            <p className="site-footer__tagline">
              REAL NEEDS. GOOD IDEAS. WELL MADE.
            </p>
          </div>
          <div>
            <div className="site-footer__col-title">Products</div>
            <div className="site-footer__col">
              <a href="https://petappro.com">PetAppro</a>
            </div>
          </div>
          <div>
            <div className="site-footer__col-title">Company</div>
            <div className="site-footer__col">
              <a href="/base509#about">Who we are</a>
              <a href="/base509#contact">Contact</a>
            </div>
          </div>
          <div>
            <div className="site-footer__col-title">Legal</div>
            <div className="site-footer__col">
              <Link href="/base509/policies">All Policies</Link>
              <Link href="/base509/policies/privacy">Privacy Policy</Link>
              <Link href="/base509/policies/terms">Terms of Use</Link>
            </div>
          </div>
        </div>
        <div className="container site-footer__legal">
          <span>© 2026 Base509 LLC · California</span>
          <a href="mailto:support@base509.com">support@base509.com</a>
        </div>
      </footer>
      <ScrollTop />
    </div>
  );
}
