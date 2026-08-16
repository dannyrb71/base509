'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export function AccountMenu({ variant }: { variant: 'marketing' | 'portal' }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [notified, setNotified] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div className={`account-menu account-menu--${variant}`} ref={root}>
      <button
        type="button"
        className="account-menu__trigger"
        aria-expanded={open}
        aria-controls={`${variant}-account-menu`}
        onClick={() => setOpen((value) => !value)}
      >
        {variant === 'portal' && <span className="account-menu__avatar" aria-hidden="true">DB</span>}
        <span className="account-menu__name type-body-bold">{variant === 'portal' ? 'Danny' : 'Sign In'}</span>
        <span className="account-menu__chevron" aria-hidden="true"><Image src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} /></span>
      </button>

      {open && (
        <div className="account-menu__popover" id={`${variant}-account-menu`}>
          {variant === 'portal' ? (
            <>
              <div className="account-menu__identity">
                <span className="account-menu__avatar" aria-hidden="true">DB</span>
                <div><strong className="type-body-bold">Danny Baker</strong><span className="type-caption">Owner · Woof Wetreats</span></div>
              </div>
              <nav aria-label="Account">
                <Link href="/petappro">Back to PetAppro.com</Link>
                <Link href="/portal/account">Account Settings</Link>
                <button type="button" disabled>View Live Client App <span>Coming Soon</span></button>
              </nav>
              <button className="account-menu__signout type-body-bold" type="button" onClick={() => setOpen(false)}>Sign Out</button>
            </>
          ) : (
            <div className="account-menu__prelaunch">
              <span className="type-label">Provider Accounts</span>
              <strong className="type-title">We’ll let you know when sign-in is ready.</strong>
              {notified ? (
                <p className="type-body" role="status">You’re on the list. We’ll email {email}.</p>
              ) : (
                <form onSubmit={(event) => { event.preventDefault(); if (email) setNotified(true); }}>
                  <label className="visually-hidden" htmlFor="account-notify-email">Email address</label>
                  <input id="account-notify-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
                  <button className="btn btn--cta type-button" type="submit">Notify Me</button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
