'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PasswordInput } from '@/components/PasswordInput';
import { createPortalBrowserClient } from '@/lib/portal/supabase-browser';

/**
 * Set-new-password page (A1 recovery flow). Reached from the emailed
 * recovery link via the PKCE callback, which established the recovery
 * session on the same host-only portal cookie. Password rules match
 * sign-up (min 8 + confirm); success goes straight into the portal via
 * the server landing route. No/expired session → friendly dead-end with
 * a path back to a fresh link.
 */

function linkPrefix() {
  return window.location.pathname.startsWith('/portal') ? '/portal' : '';
}

export function PortalResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState<'checking' | 'ready' | 'busy' | 'no-session'>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    // Two arrival shapes: the PKCE ?code path (real emailed links — the
    // callback already established the cookie session) and implicit
    // #access_token fragments (admin-generated links), which supabase-js
    // consumes asynchronously on client init — hence the brief retry.
    const supabase = createPortalBrowserClient();
    let cancelled = false;
    (async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (data.user) { setState('ready'); return; }
        await new Promise((r) => setTimeout(r, 400));
      }
      if (!cancelled) setState('no-session');
    })();
    return () => { cancelled = true; };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password needs at least 8 characters.');
    if (password !== confirm) return setError('Passwords don’t match.');
    setState('busy');
    const supabase = createPortalBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setState('ready');
      setError(updateError.message);
      return;
    }
    // Recovery session is a full session — continue into the portal.
    window.location.assign(`${linkPrefix()}/auth/landing`);
  }

  if (state === 'checking') {
    return <p className="type-body" role="status">Checking your reset link…</p>;
  }

  if (state === 'no-session') {
    return (
      <div className="portal-auth__success" role="status">
        <h1 className="type-title-lg">This link didn&rsquo;t work</h1>
        <p className="type-body">
          Reset links work once and expire after a while — this one looks expired,
          already used, or opened in a different browser.
        </p>
        <p className="type-caption portal-auth__alt">
          <Link href="/portal/forgot-password">Request a fresh reset link</Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 className="type-title-lg">Choose a new password</h1>
      <form className="portal-auth__form" onSubmit={submit} noValidate>
        <label className="type-label" htmlFor="rp-password">New password</label>
        <PasswordInput
          id="rp-password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />
        <label className="type-label" htmlFor="rp-confirm">Confirm new password</label>
        <PasswordInput
          id="rp-confirm"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          placeholder="Same password again"
          required
        />
        {error && <p className="portal-auth__error" role="alert">{error}</p>}
        <button className="btn btn--cta type-button" type="submit" disabled={state === 'busy'}>
          {state === 'busy' ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </>
  );
}
