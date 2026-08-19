import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'PetAppro Portal', template: '%s · PetAppro Portal' },
  robots: { index: false }, // authenticated surface — never indexed
};

/**
 * Portal brand root (Phase A/A1: real auth + petappro-dev data). Auth pages
 * render in the (auth) group's minimal card; the app itself lives in (app),
 * whose layout resolves the session, tenant, and entitlements server-side.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-brand="petappro" className="brand-root">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      {children}
    </div>
  );
}
