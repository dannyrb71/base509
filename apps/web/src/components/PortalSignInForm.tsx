'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PortalAuthProviders } from '@/components/PortalAuthProviders';
import { PasswordInput } from '@/components/PasswordInput';
import { createPortalBrowserClient } from '@/lib/portal/supabase-browser';

/**
 * Provider sign-in (A1 step 3). Email/password → cookie session → the
 * server landing route resolves the caller's membership + active business
 * and forwards into the portal. Unverified email and bad credentials get
 * distinct, honest states; membership resolution is all server-side.
 */

function linkPrefix() {
  return window.location.pathname.startsWith('/portal') ? '/portal' : '';
}

export function PortalSignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'unverified' | 'resent'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setState('busy');
    const supabase = createPortalBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      if (/confirm/i.test(signInError.message)) {
        setState('unverified');
        return;
      }
      setState('idle');
      setError(
        /invalid/i.test(signInError.message)
          ? 'That email and password don’t match an account here.'
          : signInError.message,
      );
      return;
    }
    // Session cookie is set — the server resolves membership + business.
    window.location.assign(`${linkPrefix()}/auth/landing`);
  }

  async function resend() {
    const supabase = createPortalBrowserClient();
    await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}${linkPrefix()}/auth/callback` },
    });
    setState('resent');
  }

  if (state === 'unverified' || state === 'resent') {
    return (
      <div className="portal-auth__success" role="status">
        <h1 className="type-title-lg">Verify your email first</h1>
        <p className="type-body">
          <strong>{email}</strong> hasn’t been verified yet — the portal unlocks once you
          open the link we emailed you.
        </p>
        {state === 'resent' ? (
          <p className="type-body">A fresh link is on its way. 📬</p>
        ) : (
          <button className="btn btn--secondary type-button" type="button" onClick={resend}>
            Send a new link
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <h1 className="type-title-lg">Sign in to your portal</h1>
      <form className="portal-auth__form" onSubmit={submit} noValidate>
        <label className="type-label" htmlFor="si-email">Email</label>
        <input
          id="si-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <div className="portal-auth__label-row">
          <label className="type-label" htmlFor="si-password">Password</label>
          <Link className="type-caption portal-auth__forgot" href="/portal/forgot-password">Forgot password?</Link>
        </div>
        <PasswordInput
          id="si-password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />
        {error && <p className="portal-auth__error" role="alert">{error}</p>}
        <button className="btn btn--cta type-button" type="submit" disabled={state === 'busy'}>
          {state === 'busy' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {/* A2 wires Google + Apple (+ passcode) here — launch requirement. */}
      <PortalAuthProviders mode="sign-in" />
      <p className="type-caption portal-auth__alt">
        New here? <Link href="/portal/sign-up">Create your provider account</Link>
      </p>
    </>
  );
}
