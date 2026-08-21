'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PortalPanel } from '@/components/PortalShell';
import { createPortalBrowserClient } from '@/lib/portal/supabase-browser';
import { portalCallbackUrl } from '@/lib/portal/social-auth';
import type { UserIdentity } from '@supabase/supabase-js';

/**
 * A2.3 — Connected sign-in methods + real two-factor management.
 *
 * BINDING (product ruling): sign-in methods that share the account's
 * provider-VERIFIED email bind to this one account — sign in with password
 * today, Google tomorrow, Apple after that, and they all land here. This
 * screen is the MANAGEMENT surface: see what's connected and add more.
 * Removing a method is deliberately not offered yet (Codex round-1 P1-4:
 * the last-method invariant isn't provably race-safe at the auth layer) —
 * support removes methods until then.
 *
 * Audit is provenance-true (round-1 P1-5): the UI never reports events;
 * it calls sync_identity_audit(), which diffs the caller's REAL auth-layer
 * state server-side and records only actual changes.
 */

const PROVIDER_LABEL: Record<string, string> = {
  email: 'Email — password & sign-in links',
  google: 'Google',
  apple: 'Apple',
};

export function PortalSignInSecurity({ justLinked }: { justLinked?: 'google' | 'apple' }) {
  const [identities, setIdentities] = useState<UserIdentity[] | null>(null);
  const [totpEnrolled, setTotpEnrolled] = useState<boolean | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createPortalBrowserClient();
    // Idempotent server-side diff of the REAL auth state — this is what
    // writes link/unlink/MFA audit rows, never a client-reported event.
    await supabase.rpc('sync_identity_audit').then(() => {}, () => {});
    const [{ data: ids }, { data: factors }] = await Promise.all([
      supabase.auth.getUserIdentities(),
      supabase.auth.mfa.listFactors(),
    ]);
    setIdentities(ids?.identities ?? []);
    setTotpEnrolled((factors?.totp ?? []).some((f) => f.status === 'verified'));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Back from a completed link redirect: friendly notice only — the audit
  // trail comes from the server-side sync in refresh().
  useEffect(() => {
    if (!justLinked) return;
    window.history.replaceState(null, '', window.location.pathname);
    setNotice(`${PROVIDER_LABEL[justLinked]} is now connected.`);
  }, [justLinked]);

  async function link(provider: 'google' | 'apple') {
    setError('');
    setBusy(true);
    const supabase = createPortalBrowserClient();
    const { error: linkErr } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo: portalCallbackUrl(`/account?linked=${provider}`) },
    });
    if (linkErr) {
      setBusy(false);
      setError('Couldn’t start the connection. Try again in a moment.');
    }
    // Success navigates away to the provider.
  }

  async function disableTotp() {
    setError('');
    setNotice('');
    setBusy(true);
    const supabase = createPortalBrowserClient();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    for (const f of factors?.totp ?? []) {
      const { error: unErr } = await supabase.auth.mfa.unenroll({ factorId: f.id });
      if (unErr) {
        setBusy(false);
        setError('Couldn’t turn off two-factor right now. Try again.');
        return;
      }
    }
    setBusy(false);
    setNotice('Two-factor turned off. Owners and Admins will be asked to set it up again on their next visit.');
    void refresh(); // sync records identity.mfa_unenroll from the real state
  }

  const linked = new Set((identities ?? []).map((i) => i.provider));

  return (
    <>
      <PortalPanel title="Connected Sign-In Methods" eyebrow="One account, your choice of door">
        {notice && <p className="portal-status portal-status--paid" role="status">{notice}</p>}
        {error && <p className="portal-auth__error" role="alert">{error}</p>}
        {identities === null ? (
          <p className="type-body">Loading…</p>
        ) : (
          <div className="portal-session-list">
            {identities.map((identity) => (
              <article key={identity.identity_id}>
                <div>
                  <strong className="type-body-bold">{PROVIDER_LABEL[identity.provider] ?? identity.provider}</strong>
                  <span className="type-caption">
                    {identity.identity_data?.email ? String(identity.identity_data.email) : 'Connected'}
                  </span>
                </div>
                <span className="portal-status portal-status--paid">Connected</span>
              </article>
            ))}
          </div>
        )}
        <div className="portal-modal-actions">
          {!linked.has('google') && (
            <button className="btn btn--secondary type-button" type="button" disabled={busy} onClick={() => link('google')}>
              Connect Google
            </button>
          )}
          {!linked.has('apple') && (
            <button className="btn btn--secondary type-button" type="button" disabled={busy} onClick={() => link('apple')}>
              Connect Apple
            </button>
          )}
        </div>
        <p className="type-caption">
          Sign-in methods that use your verified email connect to this same account —
          password one day, Google or Apple the next, and you always land here. Need a
          method removed? Email <a href="mailto:support@petappro.com">support@petappro.com</a> and
          we’ll verify you first.
        </p>
      </PortalPanel>

      <PortalPanel title="Two-Factor Authentication" eyebrow="Required for Owner & Admin">
        {totpEnrolled === null ? (
          <p className="type-body">Loading…</p>
        ) : totpEnrolled ? (
          <>
            <div className="portal-security-status">
              <span className="portal-status portal-status--paid">Enabled</span>
              <p className="type-body">
                Six-digit codes from your authenticator app protect Owner and Admin
                sessions and every privileged change.
              </p>
            </div>
            <button className="portal-remove-button type-body-bold" type="button" disabled={busy} onClick={disableTotp}>
              Turn Off Two-Factor
            </button>
          </>
        ) : (
          <>
            <div className="portal-security-status">
              <span className="portal-status portal-status--pending">Setup Required</span>
              <p className="type-body">
                Owners and Admins verify a six-digit authenticator code each session
                before reaching the portal.
              </p>
            </div>
            <Link className="btn btn--cta type-button" href="/portal/mfa">Set Up Two-Factor</Link>
          </>
        )}
        <p className="type-caption">
          Lost your authenticator? Email <a href="mailto:support@petappro.com">support@petappro.com</a> from
          your account email — we’ll verify you and reset it.
        </p>
      </PortalPanel>
    </>
  );
}
