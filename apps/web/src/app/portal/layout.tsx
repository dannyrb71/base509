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
      {/* Full theme-font set (same as the marketing layout): the Choose-a-
          Theme picker and the Brand Appearance preview render each theme in
          its REAL typeface, not a Poppins fallback. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&family=Manrope:wght@400;700&family=Noticia+Text:wght@400;700&family=Nunito+Sans:wght@400;700&family=Oswald:wght@400;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;700&family=Source+Serif+4:wght@400;700&family=Ubuntu:wght@400;700&display=swap"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      {children}
    </div>
  );
}
