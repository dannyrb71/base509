'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AccountMenu } from '@/components/AccountMenu';

const NAV_ITEMS = [
  ['Dashboard', '/portal', '/brands/petappro/icon-calendar.svg'],
  ['Clients', '/portal/clients', '/brands/petappro/icon-report.svg'],
  ['Reports', '/portal/reports', '/brands/petappro/icon-dollar.svg'],
  ['Business', '/portal/business', '/brands/petappro/icon-card.svg'],
  ['Availability', '/portal/availability', '/brands/petappro/icon-calendar.svg'],
  ['Marketing', '/portal/marketing', '/brands/petappro/icon-branding.svg'],
  ['Billing', '/portal/billing', '/brands/petappro/icon-dollar.svg'],
  ['Account', '/portal/account', '/brands/petappro/icon-location.svg'],
] as const;

export function PortalShell({
  children,
  businessName,
  userEmail,
}: {
  children: ReactNode;
  /** The authenticated tenant's real display name (A1); undefined only in
   *  legacy unwired previews. */
  businessName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="portal-shell">
      <header className="portal-topbar">
        <Link href="/portal" className="portal-topbar__brand" aria-label="PetAppro Portal dashboard">
          <Image src="/brands/petappro/petappro-wordmark.svg" alt="Petappro" width={166} height={40} priority />
          <span className="type-body-bold">Provider Portal</span>
        </Link>
        <div className="portal-topbar__actions">
          <AccountMenu variant="portal" />
          <form method="post" action="/portal/auth/sign-out">
            <button className="btn btn--secondary btn--sm type-button" type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <div className="portal-frame">
        <aside className="portal-sidebar" aria-label="Provider Portal">
          <div className="portal-business-switcher">
            <span className="type-label">Business</span>
            <strong className="type-body-bold">{businessName ?? 'Your business'}</strong>
            {userEmail && <span className="type-caption portal-business-switcher__email">{userEmail}</span>}
          </div>
          <nav className="portal-nav">
            {NAV_ITEMS.map(([label, href, icon]) => {
              const active = href === '/portal' ? pathname === href : pathname.startsWith(href);
              return (
                <Link href={href} key={href} aria-current={active ? 'page' : undefined}>
                  <Image src={icon} alt="" width={24} height={24} unoptimized />
                  <span className="type-body-bold">{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="portal-main" id="main">{children}</main>
      </div>
    </div>
  );
}

export function PortalPageHeader({ eyebrow, title, body, action }: {
  eyebrow: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="portal-page-header">
      <div>
        <span className="eyebrow type-label">{eyebrow}</span>
        <h1 className="type-headline">{title}</h1>
        <p className="type-body">{body}</p>
      </div>
      {action && <div className="portal-page-header__action">{action}</div>}
    </div>
  );
}

export function PortalStatCard({ label, value, detail, tone = 'default', active = false, onClick }: {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'accent' | 'warning';
  active?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="type-label">{label}</span>
      <strong className="type-title-lg">{value}</strong>
      <p className="type-caption">{detail}</p>
    </>
  );
  return onClick ? (
    <button type="button" className={`card portal-stat portal-stat--${tone}${active ? ' is-active' : ''}`} aria-pressed={active} onClick={onClick}>{content}</button>
  ) : <article className={`card portal-stat portal-stat--${tone}`}>{content}</article>;
}

export function PortalPanel({ title, eyebrow, children, action }: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="card portal-panel">
      <div className="portal-panel__header">
        <div>
          {eyebrow && <span className="type-label">{eyebrow}</span>}
          <h2 className="type-title">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PortalDrawer({ open, onClose, eyebrow, title, children }: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="portal-modal-backdrop portal-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="portal-drawer" role="dialog" aria-modal="true" aria-labelledby="portal-drawer-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="portal-modal__header">
          <div>{eyebrow && <span className="type-label">{eyebrow}</span>}<h2 className="type-title" id="portal-drawer-title">{title}</h2></div>
          <button type="button" aria-label={`Close ${title}`} onClick={onClose}>×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

/* Capacity field — styled exactly like the pricing fields (same control
   height/padding/type via the shared label rules), just without the $
   prefix. A div, not a label, so grid label:nth-of-type pinning in host
   layouts stays untouched. Shared by Business (service cards, Shared Total
   Capacity) and Availability (per-day overrides). */
export function CapacityField({ label, ariaLabel, hint, value, placeholder, onChange, disabled }: {
  label: string;
  ariaLabel?: string;
  hint?: string;
  value: string;
  placeholder?: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="portal-capacity-inline">
      <span>{label}</span>
      <input inputMode="numeric" aria-label={ariaLabel ?? label} value={value} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, ''))} />
      {hint && <small className="type-caption">{hint}</small>}
    </div>
  );
}

export function PortalInfo({ label = 'How this works', open, onToggle }: {
  label?: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button className="portal-info-toggle" type="button" aria-expanded={open} aria-label={label} onClick={onToggle}>i</button>
  );
}

export function PortalModal({ open, onClose, eyebrow, title, children, wide = false }: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="portal-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`portal-modal${wide ? ' portal-modal--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="portal-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="portal-modal__header">
          <div>{eyebrow && <span className="type-label">{eyebrow}</span>}<h2 className="type-title" id="portal-modal-title">{title}</h2></div>
          <button type="button" aria-label={`Close ${title}`} onClick={onClose}>×</button>
        </div>
        {children}
      </section>
    </div>
  );
}
