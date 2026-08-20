'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortalBrowserClient } from '@/lib/portal/supabase-browser';
import { IconEnvelope } from '@/components/icons/IconEnvelope';

/**
 * Password recovery request (A1 gap fix — launch requirement).
 * Enumeration-safe: the response is ALWAYS "if that email exists, we sent a
 * link" (matching sign-up's uniform response); honeypot + min-fill-time
 * mirror the sign-up form. The email itself is Supabase's default template
 * for now — FOLLOW-ON flagged: brand it (PetAppro from-name/logo/copy)
 * before launch.
 */

function linkPrefix() {
  return window.location.pathname.startsWith('/portal') ? '/portal' : '';
}

export function PortalForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [linkExpired, setLinkExpired] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    // The auth callback routes an expired/used recovery link here.
    setLinkExpired(new URLSearchParams(window.location.search).get('error') === 'recovery_expired');
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (honeypot) {
      setState('sent'); // bot: pretend success, send nothing
      return;
    }
    if (Date.now() - startedAt.current < 2000) {
      setError('That was quick! Please take a second and try again.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('That email doesn’t look right.');
      return;
    }
    setState('busy');
    const supabase = createPortalBrowserClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${linkPrefix()}/auth/callback?next=/reset-password`,
    });
    // Uniform response regardless of outcome — no account enumeration.
    setState('sent');
  }

  if (state === 'sent') {
    return (
      <div className="portal-auth__success" role="status">
        <h1 className="type-title-lg">Check your email <IconEnvelope className="portal-auth__inline-icon" /></h1>
        <p className="type-body">
          If an account exists for <strong>{email}</strong>, we&rsquo;ve sent a link to
          reset its password. The link works once and expires after a while.
        </p>
        <p className="type-caption portal-auth__alt">
          Remembered it after all? <Link href="/portal/sign-in">Sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="type-title-lg">Reset your password</h1>
      <p className="type-body portal-auth__lead">
        Tell us your account email and we&rsquo;ll send a reset link.
      </p>
      {linkExpired && (
        <p className="portal-auth__error" role="alert">
          That reset link expired or was already used — request a fresh one below.
        </p>
      )}
      <form className="portal-auth__form" onSubmit={submit} noValidate>
        <input
          className="visually-hidden"
          aria-hidden="true"
          tabIndex={-1}
          type="text"
          name="company"
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
        <label className="type-label" htmlFor="fp-email">Email</label>
        <input
          id="fp-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        {error && <p className="portal-auth__error" role="alert">{error}</p>}
        <button className="btn btn--cta type-button" type="submit" disabled={state === 'busy'}>
          {state === 'busy' ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="type-caption portal-auth__alt">
        Back to <Link href="/portal/sign-in">Sign in</Link>
      </p>
    </>
  );
}
