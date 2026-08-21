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
 * Methods are the account's REAL auth identities (Supabase manual linking):
 * email (password + magic link ride the same identity), Google, Apple.
 * ADD runs a full verified OAuth link of a NEW provider identity to the
 * CURRENT session's account and returns here (?linked=…, audited).
 * REMOVE unlinks — guarded so the LAST usable method can never be removed
 * (belt here; Supabase refuses last-identity unlink as the suspenders).
 * NO auto-merge-by-email exists anywhere: linking happens only through
 * this signed-in, user-initiated flow.
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

  // Arriving back from a completed link redirect: audit once, clean the URL.
  useEffect(() => {
    if (!justLinked) return;
    window.history.replaceState(null, '', window.location.pathname);
    const supabase = createPortalBrowserClient();
    void supabase
      .rpc('log_identity_event', { p_action: 'identity.link', p_provider: justLinked })
      .then(() => setNotice(`${PROVIDER_LABEL[justLinked]} is now connected.`), () => {});
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

  async function unlink(identity: UserIdentity) {
    if (!identities || identities.length <= 1) return; // last-method guard (belt)
    setError('');
    setNotice('');
    setBusy(true);
    const supabase = createPortalBrowserClient();
    const { error: unlinkErr } = await supabase.auth.unlinkIdentity(identity);
    if (unlinkErr) {
      setBusy(false);
      setError(
        /last|only/i.test(unlinkErr.message)
          ? 'That’s your only way to sign in — connect another method first.'
          : 'Couldn’t remove that method just now. Try again.',
      );
      return;
    }
    const provider = identity.provider === 'email' ? 'email' : (identity.provider as 'google' | 'apple');
    await supabase
      .rpc('log_identity_event', { p_action: 'identity.unlink', p_provider: provider })
      .then(() => {}, () => {});
    setBusy(false);
    setNotice('Sign-in method removed.');
    void refresh();
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
    await supabase
      .rpc('log_identity_event', { p_action: 'identity.mfa_unenroll', p_provider: 'totp' })
      .then(() => {}, () => {});
    setBusy(false);
    setNotice('Two-factor turned off. Owners and Admins will be asked to set it up again on their next visit.');
    void refresh();
  }

  const linked = new Set((identities ?? []).map((i) => i.provider));
  const lastMethod = (identities?.length ?? 0) <= 1;

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
                {lastMethod ? (
                  <span className="type-caption">Your only sign-in method</span>
                ) : (
                  <button
                    className="portal-remove-button type-body-bold"
                    type="button"
                    disabled={busy}
                    onClick={() => unlink(identity)}
                  >
                    Remove
                  </button>
                )}
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
          Adding a method connects it to THIS account after you sign in with it — accounts
          are never combined just because two methods share an email address.
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
