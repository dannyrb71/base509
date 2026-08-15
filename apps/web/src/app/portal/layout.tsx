import type { Metadata } from 'next';
import { PortalShell } from '@/components/PortalShell';

export const metadata: Metadata = {
  title: { default: 'PetAppro Portal', template: '%s · PetAppro Portal' },
  robots: { index: false }, // authenticated surface — never indexed
};

/**
 * Exploratory provider-admin concept only. No auth, data, or billing wiring.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-brand="petappro" className="brand-root">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      <PortalShell>{children}</PortalShell>
    </div>
  );
}
