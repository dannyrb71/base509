'use client';

import { useEffect, useState } from 'react';
import { createPortalBrowserClient } from '@/lib/portal/supabase-browser';

/**
 * A2.4 — Owner/Admin two-factor gate. One component, two flows resolved
 * from the account's real factor state:
 *  - no verified TOTP factor → ENROLL (live QR from Supabase MFA, verify a
 *    first code, session steps up to AAL2);
 *  - verified factor present → CHALLENGE (six-digit code → AAL2).
 * Success routes through the landing so the locked A2 routing applies.
 * Lost-authenticator support path: support@petappro.com (documented here,
 * in the UI, on purpose).
 */

type Flow =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'challenge'; factorId: string }
  | { kind: 'enroll'; factorId: string; qr: string; secret: string };

export function PortalMfaForm() {
  const [flow, setFlow] = useState<Flow>({ kind: 'loading' });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createPortalBrowserClient();
      const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors();
      if (listErr) {
        if (!cancelled) setFlow({ kind: 'error', message: 'Couldn’t load your security settings. Refresh to retry.' });
        return;
      }
      const verified = factors.totp.find((f) => f.status === 'verified');
      if (verified) {
        if (!cancelled) setFlow({ kind: 'challenge', factorId: verified.id });
        return;
      }
      // Clear abandoned half-enrollments so a fresh QR can mint.
      for (const stale of factors.all.filter((f) => f.factor_type === 'totp' && f.status !== 'verified')) {
        await supabase.auth.mfa.unenroll({ factorId: stale.id }).catch(() => {});
      }
      const { data: enrolled, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'PetAppro portal',
      });
      if (enrollErr || !enrolled) {
        if (!cancelled) setFlow({ kind: 'error', message: 'Couldn’t start enrollment. Refresh to retry.' });
        return;
      }
      if (!cancelled) {
        setFlow({ kind: 'enroll', factorId: enrolled.id, qr: enrolled.totp.qr_code, secret: enrolled.totp.secret });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (flow.kind !== 'challenge' && flow.kind !== 'enroll') return;
    setBusy(true);
    setError('');
    const supabase = createPortalBrowserClient();
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: flow.factorId });
    if (chErr || !challenge) {
      setBusy(false);
      setError('Couldn’t start verification. Try again.');
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: flow.factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    if (vErr) {
      setBusy(false);
      setError('That code didn’t match. Codes rotate every 30 seconds — check and try again.');
      return;
    }
    // Provenance-true audit: the server diffs the REAL factor state and
    // records identity.mfa_enroll itself — nothing client-reported.
    await supabase.rpc('sync_identity_audit').then(() => {}, () => {});
    window.location.assign('/portal/auth/landing');
  }

  if (flow.kind === 'loading') {
    return <p className="type-body" role="status">Loading your security settings…</p>;
  }
  if (flow.kind === 'error') {
    return <p className="portal-auth__error" role="alert">{flow.message}</p>;
  }

  return (
    <>
      <h1 className="type-title-lg">
        {flow.kind === 'enroll' ? 'Protect your account' : 'Enter your code'}
      </h1>
      {flow.kind === 'enroll' ? (
        <>
          <p className="type-body portal-auth__lead">
            Owner and Admin accounts use a second factor. Scan this QR code with any
            authenticator app (Google Authenticator, 1Password, Authy…), then enter the
            six-digit code it shows.
          </p>
          {/* Live per-account enrollment QR from Supabase MFA (SVG data URI). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="portal-mfa-qr-live" src={flow.qr} alt="Authenticator enrollment QR code for this account" width={196} height={196} />
          <p className="type-caption">
            Can’t scan? Enter this key manually: <code className="portal-mfa-secret">{flow.secret}</code>
          </p>
        </>
      ) : (
        <p className="type-body portal-auth__lead">
          Open your authenticator app and enter the six-digit code for PetAppro.
        </p>
      )}
      <form className="portal-auth__form" onSubmit={verify} noValidate>
        <label className="type-label" htmlFor="mfa-code">Six-digit code</label>
        <input
          id="mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {error && <p className="portal-auth__error" role="alert">{error}</p>}
        <button className="btn btn--cta type-button" type="submit" disabled={busy || code.trim().length !== 6}>
          {busy ? 'Verifying…' : flow.kind === 'enroll' ? 'Verify & turn on' : 'Verify'}
        </button>
      </form>
      <div className="type-caption portal-auth__alt">
        Lost your authenticator? Email <a href="mailto:support@petappro.com">support@petappro.com</a> from
        your account email and we’ll verify you and reset it.
        {' '}· <form action="/portal/auth/sign-out" method="post" className="portal-auth__inline-form"><button className="portal-auth__linklike" type="submit">Sign out</button></form>
      </div>
    </>
  );
}
