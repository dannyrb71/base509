'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { PasswordInput } from '@/components/PasswordInput';
import { createPortalBrowserClient } from '@/lib/portal/supabase-browser';
import { startOAuth } from '@/lib/portal/social-auth';
import { PortalAuthProviders } from '@/components/PortalAuthProviders';
import { IconEnvelope } from '@/components/icons/IconEnvelope';

/**
 * Provider sign-up (A1 step 2). Email/password with REQUIRED email
 * verification — no portal access until the emailed link is opened (the
 * PKCE callback finishes the session and runs the tenant bootstrap).
 * Business name is OPTIONAL: blank → the owner's name becomes the
 * business/tenant display name (names are not unique — the tenant is keyed
 * on business_id; the slug is minted server-side). Spam protection mirrors
 * the waitlist form: honeypot field + minimum-fill-time check.
 */

/** Links are /portal-prefixed everywhere; app.petappro.* strips the prefix. */
function linkPrefix() {
  return window.location.pathname.startsWith('/portal') ? '/portal' : '';
}

export function PortalSignUpForm() {
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'check-email'>('idle');
  const [error, setError] = useState('');
  const startedAt = useRef(Date.now());

  async function oauth(provider: 'google' | 'apple') {
    setError('');
    const failed = await startOAuth(provider);
    if (failed) setError('Couldn’t reach the sign-in provider. Try again in a moment.');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (honeypot) {
      // Bot filled the invisible field: pretend success, store nothing.
      setState('check-email');
      return;
    }
    if (Date.now() - startedAt.current < 2500) {
      setError('That was quick! Please take a second and try again.');
      return;
    }
    if (!ownerName.trim()) return setError('Please tell us your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('That email doesn’t look right.');
    if (password.length < 8) return setError('Password needs at least 8 characters.');
    if (password !== confirm) return setError('Passwords don’t match.');

    setState('busy');
    const supabase = createPortalBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${linkPrefix()}/auth/callback`,
        data: {
          owner_name: ownerName.trim(),
          business_name: businessName.trim(), // blank → owner name server-side
        },
      },
    });
    if (signUpError) {
      setState('idle');
      setError(signUpError.message);
      return;
    }
    // Existing accounts get the same response shape (no enumeration) —
    // the uniform answer is always "check your email".
    void data;
    setState('check-email');
  }

  if (state === 'check-email') {
    return (
      <div className="portal-auth__success" role="status">
        <h1 className="type-title-lg">Check your email <IconEnvelope className="portal-auth__inline-icon" /></h1>
        <p className="type-body">
          We sent a verification link to <strong>{email}</strong>. Open it to finish
          creating your account — the portal unlocks once your email is verified.
        </p>
        <p className="type-caption">
          Already verified? <Link href="/portal/sign-in">Sign in</Link>. If you already
          had an account, that email explains what to do instead.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="type-title-lg">Create your provider account</h1>
      <p className="type-body portal-auth__lead">
        Free on Starter — no card, no tier picking. You can rename your business any time.
      </p>
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
        <label className="type-label" htmlFor="su-business">Business name <span className="portal-auth__optional">(optional)</span></label>
        <input
          id="su-business"
          type="text"
          placeholder="Happy Paws Boarding — or leave blank to use your name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          autoComplete="organization"
        />
        <label className="type-label" htmlFor="su-owner">Your name</label>
        <input
          id="su-owner"
          type="text"
          required
          placeholder="Dana Alvarez"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          autoComplete="name"
        />
        <label className="type-label" htmlFor="su-email">Email</label>
        <input
          id="su-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <label className="type-label" htmlFor="su-password">Password</label>
        <PasswordInput
          id="su-password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />
        <label className="type-label" htmlFor="su-confirm">Confirm password</label>
        <PasswordInput
          id="su-confirm"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          placeholder="Same password again"
          required
        />
        {error && <p className="portal-auth__error" role="alert">{error}</p>}
        <button className="btn btn--cta type-button" type="submit" disabled={state === 'busy'}>
          {state === 'busy' ? 'Creating your account…' : 'Create account'}
        </button>
      </form>
      {/* A2 wires Google + Apple (+ passcode) here — launch requirement. */}
      <PortalAuthProviders
        mode="sign-up"
        onGoogle={() => oauth('google')}
        onApple={() => oauth('apple')}
      />
      <p className="type-caption portal-auth__alt">
        Already have an account? <Link href="/portal/sign-in">Sign in</Link>
      </p>
    </>
  );
}
