import Link from 'next/link';
import type { ReactNode } from 'react';

/* Shared skeleton components — semantic classes only; brands theme them via CSS. */

export function Section({
  inverse, tint, tight, children, id, className,
}: { inverse?: boolean; tint?: boolean; tight?: boolean; children: ReactNode; id?: string; className?: string }) {
  const cls = [
    'section',
    inverse ? 'section--inverse' : '',
    tint ? 'section--tint' : '',
    tight ? 'section--tight' : '',
    className ?? '',
  ].join(' ');
  return (
    <section className={cls} id={id}>
      <div className="container">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow type-label">{children}</div>;
}

export function UnderlineMotif() {
  return (
    <div className="underline-motif" aria-hidden="true">
      <span /><span /><span />
    </div>
  );
}

export function Btn({
  href, variant = 'cta', size, children,
}: { href: string; variant?: 'cta' | 'primary' | 'secondary' | 'inverse'; size?: 'lg' | 'sm'; children: ReactNode }) {
  const cls = ['btn', 'type-button', `btn--${variant}`, size ? `btn--${size}` : ''].join(' ');
  const external = href.startsWith('http') || href.startsWith('mailto:');
  if (external) return <a className={cls} href={href}>{children}</a>;
  return <Link className={cls} href={href}>{children}</Link>;
}

export function Card({
  kicker, title, children, footer,
}: { kicker?: string; title?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="card">
      {kicker && <div className="card__kicker type-label">{kicker}</div>}
      {title && <h3 className="type-title">{title}</h3>}
      {typeof children === 'string' ? <p className="type-body">{children}</p> : children}
      {footer && <div style={{ marginTop: 16 }}>{footer}</div>}
    </div>
  );
}

/** Placeholder for app screenshots / theme cards that aren't ready yet. */
export function Slot({
  label, phone, wide,
}: { label: string; phone?: boolean; wide?: boolean }) {
  const cls = ['slot', phone ? 'slot--phone' : '', wide ? 'slot--wide' : ''].join(' ');
  return <div className={cls} role="img" aria-label={`Placeholder: ${label}`}>{label}</div>;
}
