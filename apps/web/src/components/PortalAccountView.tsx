'use client';

import { useState } from 'react';
import { PortalModal, PortalPageHeader, PortalPanel } from '@/components/PortalShell';

const QR_SIZE = 21;

function qrCell(row: number, column: number) {
  const finder = (top: number, left: number) => {
    const y = row - top;
    const x = column - left;
    if (x < 0 || x > 6 || y < 0 || y > 6) return false;
    return x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
  };
  if (finder(0, 0) || finder(0, QR_SIZE - 7) || finder(QR_SIZE - 7, 0)) return true;
  return ((row * 17 + column * 29 + row * column * 7 + 13) % 11) < 5;
}

function AuthenticatorQrPreview() {
  return <div className="portal-mfa-qr"><svg aria-label="Illustrative account-specific authenticator QR code" role="img" shapeRendering="crispEdges" viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`}><rect width={QR_SIZE} height={QR_SIZE} fill="var(--surface-card)" />{Array.from({ length: QR_SIZE }, (_, row) => Array.from({ length: QR_SIZE }, (_, column) => qrCell(row, column) ? <rect key={`${row}-${column}`} x={column} y={row} width="1" height="1" fill="var(--pa-brandy-900)" /> : null))}</svg><span className="visually-hidden">Static enrollment preview</span></div>;
}

export function PortalAccountView() {
  const [mfaOpen, setMfaOpen] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeAcknowledged, setCloseAcknowledged] = useState(false);
  const [closeConfirmation, setCloseConfirmation] = useState('');
  const [notice, setNotice] = useState('');
  const [notifications, setNotifications] = useState({ bookings: true, payments: true, billing: true });

  return (
    <div className="portal-page">
      <PortalPageHeader eyebrow="Account" title="Account & Security" body="Manage personal details, multi-factor authentication, passkeys, active sessions, and provider-portal notifications." action={<button className="btn btn--cta type-button" type="button" onClick={() => setNotice('Account preferences saved.')}>Save Changes</button>} />
      <div className="portal-settings-grid">
        <PortalPanel title="Personal Details" eyebrow="Profile"><dl className="portal-definition-list"><div><dt>Name</dt><dd>Danny Baker</dd></div><div><dt>Email</dt><dd>danny@example.com</dd></div><div><dt>Role</dt><dd>Owner</dd></div><div><dt>Time Zone</dt><dd>America/Los_Angeles</dd></div></dl></PortalPanel>
        <PortalPanel title="Multi-Factor Authentication" eyebrow="Required for Owner & Admin"><div className="portal-security-status"><span className={`portal-status${mfaEnabled ? ' portal-status--paid' : ' portal-status--pending'}`}>{mfaEnabled ? 'Enabled' : 'Setup Required'}</span><p className="type-body">Six-digit codes from your authenticator app protect personal-information changes, exports, billing, payouts, refunds, and team permission changes.</p></div><button className="btn btn--cta type-button" type="button" onClick={() => setMfaOpen(true)}>{mfaEnabled ? 'Manage MFA' : 'Set Up MFA'}</button></PortalPanel>
      </div>
      <div className="portal-settings-grid">
        <PortalPanel title="Passkeys & Sign-In" eyebrow="Passwordless-first"><div className="portal-account-callout"><strong className="type-body-bold">Passkey</strong><p className="type-body">Use Face ID, Touch ID, Windows Hello, or a hardware security key for strong passwordless sign-in and step-up verification.</p></div><button className="btn btn--secondary type-button" type="button" onClick={() => setNotice('Passkey enrollment opened.')}>Add a Passkey</button></PortalPanel>
        <PortalPanel title="Active Sessions" eyebrow="Devices"><div className="portal-session-list"><article><div><strong className="type-body-bold">Safari on macOS</strong><span className="type-caption">San Francisco · Current session</span></div><span className="portal-status portal-status--paid">Current</span></article><article><div><strong className="type-body-bold">PetAppro on iPhone</strong><span className="type-caption">San Francisco · 2 hours ago</span></div><button className="portal-text-button type-body-bold" type="button" onClick={() => setNotice('iPhone session signed out.')}>Sign Out</button></article></div><button className="portal-remove-button type-body-bold" type="button" onClick={() => setNotice('All other sessions signed out.')}>Sign Out All Other Sessions</button></PortalPanel>
      </div>
      <PortalPanel title="Notifications" eyebrow="Portal activity">
        <div className="portal-preference-list">
          {([['bookings', 'Booking Requests', 'Push and email when a client requests a booking.'], ['payments', 'Payment Updates', 'Push and email for paid, due, and past-due charges.'], ['billing', 'Subscription Billing', 'Email for renewals, plan changes, and invoices.']] as const).map(([key, label, detail]) => <label key={key}><span><strong className="type-body-bold">{label}</strong><small className="type-caption">{detail}</small></span><span className="portal-checkbox"><input type="checkbox" checked={notifications[key]} onChange={(event) => setNotifications((value) => ({ ...value, [key]: event.target.checked }))} /><i aria-hidden="true" /></span></label>)}
        </div>
      </PortalPanel>
      <div className="portal-account-callout"><strong className="type-body-bold">Web vs. Native App</strong><p className="type-body">MFA enrollment, passkeys, recovery, and session management live here on the web. The native app adds an optional local biometric app lock and can initiate step-up verification, but it does not replace server-verified MFA.</p></div>

      <PortalPanel title="Delete Account" eyebrow="Danger Zone" action={<button className="btn portal-danger-button type-button" type="button" onClick={() => setCloseOpen(true)}>Delete My Account</button>}>
        <p className="type-body">Permanently close your individual PetAppro account. If you are the only Owner, you must first transfer ownership or close the provider business. Canceling your subscription alone does not delete your account or business data.</p>
        <p className="portal-account-policy-links type-body"><strong><a href="https://base509.com/policies/terms">See Terms of Use</a></strong> for the account-closing terms and conditions. Also review the <a href="https://base509.com/policies/privacy">Privacy Policy</a> for deletion and retained-record rules and the <a href="https://base509.com/policies/ownership">Account Ownership Policy</a> for Owner-transfer and business-account requirements.</p>
      </PortalPanel>

      <PortalModal open={mfaOpen} onClose={() => setMfaOpen(false)} eyebrow="Account Security" title={mfaEnabled ? 'Manage MFA' : 'Set Up Authenticator App'}>
        <div className="portal-mfa-setup"><AuthenticatorQrPreview /><div><h3 className="type-title">Scan With Your Authenticator</h3><p className="type-body">PetAppro generates a unique enrollment QR code for your account when setup begins. Scan it with your authenticator app, then enter the six-digit code it shows.</p><p className="type-caption">You’ll also receive one-time recovery codes — store them somewhere safe.</p><label className="type-body-bold">Verification Code<input inputMode="numeric" autoComplete="one-time-code" placeholder="000000" maxLength={6} /></label></div></div>
        <div className="portal-modal-actions"><button className="btn btn--secondary type-button" type="button" onClick={() => setMfaOpen(false)}>Cancel</button><button className="btn btn--cta type-button" type="button" onClick={() => { setMfaEnabled(true); setMfaOpen(false); setNotice('MFA enabled.'); }}>{mfaEnabled ? 'Regenerate Recovery Codes' : 'Verify & Enable MFA'}</button></div>
      </PortalModal>

      <PortalModal open={closeOpen} onClose={() => setCloseOpen(false)} eyebrow="Account Closure" title="Delete Your PetAppro Account">
        <div className="portal-danger-callout"><strong className="type-body-bold">This action is permanent.</strong><p className="type-body">Deleting your individual account signs you out everywhere and removes or deidentifies your personal profile, subject to the limited retention described in our policies.</p></div>
        <ul className="portal-close-list type-body"><li>Export any records you want to keep before continuing.</li><li>Existing bookings, refunds, disputes, and legally retained financial or audit records may require resolution or limited retention.</li><li>Closing PetAppro does not close your provider-owned Stripe account.</li><li>A sole Owner must transfer ownership or complete the separate business-closure process first.</li></ul>
        <p className="type-body"><strong><a href="https://base509.com/policies/terms">See Terms of Use</a></strong> for the account-closing terms and conditions. Review the <a href="https://base509.com/policies/privacy">Privacy Policy</a> for deletion and retained-record rules, the <a href="https://base509.com/policies/ownership">Account Ownership Policy</a> for Owner-transfer and business-account requirements, and <a href="https://base509.com/policies">All Policies</a> before continuing.</p>
        <label className="portal-checkbox portal-close-confirm type-body"><input type="checkbox" checked={closeAcknowledged} onChange={(event) => setCloseAcknowledged(event.target.checked)} /><span aria-hidden="true" />I understand that account deletion is permanent.</label>
        <label className="portal-close-input type-body-bold">Type DELETE to confirm<input value={closeConfirmation} onChange={(event) => setCloseConfirmation(event.target.value)} autoComplete="off" /></label>
        <div className="portal-modal-actions"><button className="btn btn--secondary type-button" type="button" onClick={() => setCloseOpen(false)}>Keep My Account</button><button className="btn portal-danger-button type-button" type="button" disabled={!closeAcknowledged || closeConfirmation !== 'DELETE'} onClick={() => { setCloseOpen(false); setCloseAcknowledged(false); setCloseConfirmation(''); }}>Permanently Delete Account</button></div>
      </PortalModal>

      {notice && <p className="portal-inline-notice type-body" role="status">{notice}</p>}
    </div>
  );
}
