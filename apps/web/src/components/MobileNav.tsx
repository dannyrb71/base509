'use client';

import { useEffect, useState } from 'react';

/**
 * Mobile hamburger nav for the Base509 header (the frame's mobile variant).
 * Desktop keeps the inline links; this takes over below the nav breakpoint.
 * Links are passed in so the header stays the single source of nav truth.
 */
export function MobileNav({
  links, cta, variant = 'base509',
}: {
  links: { href: string; label: string }[];
  cta?: { href: string; label: string };
  variant?: 'base509' | 'petappro';
}) {
  const [open, setOpen] = useState(false);
  const isPetAppro = variant === 'petappro';
  const rootClass = isPetAppro ? 'petappro-mobilenav' : 'b509-mobilenav';
  const panelId = `${variant}-mobilenav-panel`;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const closeAtDesktop = () => {
      if (window.innerWidth >= 1280) setOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeAtDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeAtDesktop);
    };
  }, [open]);

  return (
    <div className={rootClass}>
      {!isPetAppro && (
        <button
          type="button"
          className="b509-mobilenav__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={open ? 'is-open' : ''} aria-hidden="true">
            <i /><i /><i />
          </span>
        </button>
      )}

      {isPetAppro && (
        <button
          type="button"
          className="petappro-mobilenav__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <img src="/brands/petappro/mobile-menu-open.svg" alt="" width="27" height="20" />
        </button>
      )}

      {(isPetAppro || open) && (
        <div
          className={`${rootClass}__backdrop${open ? ' is-open' : ''}`}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id={panelId}
        className={`${rootClass}__panel${open ? ' is-open' : ''}`}
        hidden={!isPetAppro && !open}
        aria-hidden={!open}
        inert={isPetAppro && !open}
      >
        {isPetAppro && (
          <div className="petappro-mobilenav__close-row">
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
              <img src="/brands/petappro/mobile-menu-close.svg" alt="" width="30" height="30" />
            </button>
          </div>
        )}
        <nav aria-label="Main">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
        </nav>
        {cta && (
          <a className="btn btn--cta" href={cta.href} onClick={() => setOpen(false)}>
            {cta.label}
          </a>
        )}
      </div>
    </div>
  );
}
