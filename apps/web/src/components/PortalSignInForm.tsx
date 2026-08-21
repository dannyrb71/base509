'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PortalAuthProviders } from '@/components/PortalAuthProviders';
import { PasswordInput } from '@/components/PasswordInput';
import { createPortalBrowserClient } from '@/lib/portal/supabase-browser';
import { sendMagicLink, startOAuth } from '@/lib/portal/social-auth';
import { IconEnvelope } from '@/components/icons/IconEnvelope';

/**
 * Provider sign-in (A1 step 3; A2 adds Google/Apple OAuth + magic link —
 * one login for every method, the experience resolves POST-auth). Password
 * signs in directly; OAuth redirects out and back through /auth/callback;
 * the magic link is enumeration-safe (uniform response). Membership
 * resolution stays all server-side.
 */

function linkPrefix() {
  return window.location.pathname.startsWith('/portal') ? '/portal' : '';
}

/** Friendly copy for ?error=… arrivals from the callback route. */
const ARRIVAL_ERRORS: Record<string, string> = {
  oauth_cancelled: 'Sign-in was cancelled before finishing — try again whenever you’re ready.',
  oauth_failed: 'The sign-in provider hit a problem. Try again, or use your email instead.',
  verification_failed: 'That link has expired or was already used. Sign in, or request a fresh link.',
  missing_code: 'That link didn’t carry a sign-in code. Try signing in again.',
};

export function PortalSignInForm({ arrivalError }: { arrivalError?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [state, setState] = useState<'idle' | 'busy' | 'unverified' | 'resent' | 'magic-sent'>('idle');
  const [error, setError] = useState(arrivalError ? (ARRIVAL_ERRORS[arrivalError] ?? '') : '');

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

  async function oauth(provider: 'google' | 'apple') {
    setError('');
    const failed = await startOAuth(provider);
    if (failed) setError('Couldn’t reach the sign-in provider. Try again in a moment.');
  }

  async function magicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setState('busy');
    const result = await sendMagicLink(email);
    if (result.error) {
      setState('idle');
      setError(result.error);
      return;
    }
    setState('magic-sent');
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
          <p className="type-body">A fresh link is on its way. <IconEnvelope className="portal-auth__inline-icon" /></p>
        ) : (
          <button className="btn btn--secondary type-button" type="button" onClick={resend}>
            Send a new link
          </button>
        )}
      </div>
    );
  }

  if (state === 'magic-sent') {
    // Uniform for new and existing accounts alike — no enumeration.
    return (
      <div className="portal-auth__success" role="status">
        <h1 className="type-title-lg">Check your email <IconEnvelope className="portal-auth__inline-icon" /></h1>
        <p className="type-body">
          If <strong>{email}</strong> can sign in here, a one-time sign-in link is on its
          way. Open it on this device to land in your portal.
        </p>
        <p className="type-caption portal-auth__alt">
          Nothing arriving? Check spam, or{' '}
          <button className="portal-auth__linklike" type="button" onClick={() => setState('idle')}>
            send it again
          </button>.
        </p>
      </div>
    );
  }

  if (mode === 'magic') {
    return (
      <>
        <h1 className="type-title-lg">Email me a sign-in link</h1>
        <p className="type-body portal-auth__lead">
          No password needed — we’ll email you a one-time link that signs you straight in.
        </p>
        <form className="portal-auth__form" onSubmit={magicSubmit} noValidate>
          <label className="type-label" htmlFor="ml-email">Email</label>
          <input
            id="ml-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {error && <p className="portal-auth__error" role="alert">{error}</p>}
          <button className="btn btn--cta type-button" type="submit" disabled={state === 'busy'}>
            {state === 'busy' ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>
        <p className="type-caption portal-auth__alt">
          <button className="portal-auth__linklike" type="button" onClick={() => { setError(''); setState('idle'); setMode('password'); }}>
            Back to password sign-in
          </button>
        </p>
      </>
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
      <p className="type-caption portal-auth__alt">
        <button className="portal-auth__linklike" type="button" onClick={() => { setError(''); setState('idle'); setMode('magic'); }}>
          Email me a sign-in link instead
        </button>
      </p>
      <PortalAuthProviders
        mode="sign-in"
        onGoogle={() => oauth('google')}
        onApple={() => oauth('apple')}
      />
      <p className="type-caption portal-auth__alt">
        New here? <Link href="/portal/sign-up">Create your provider account</Link>
      </p>
    </>
  );
}
