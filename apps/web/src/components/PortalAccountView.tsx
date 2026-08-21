'use client';

import { useState } from 'react';
import { PortalModal, PortalPageHeader, PortalPanel } from '@/components/PortalShell';
import { PortalSignInSecurity } from '@/components/PortalSignInSecurity';

export function PortalAccountView({ justLinked }: { justLinked?: 'google' | 'apple' }) {
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeAcknowledged, setCloseAcknowledged] = useState(false);
  const [closeConfirmation, setCloseConfirmation] = useState('');
  const [notice, setNotice] = useState('');
  const [notifications, setNotifications] = useState({ bookings: true, payments: true, billing: true });
  const [profile, setProfile] = useState({ name: 'Danny Baker', email: 'danny@example.com', timeZone: 'America/Los_Angeles' });

  return (
    <div className="portal-page">
      <PortalPageHeader eyebrow="Account" title="Account & Security" body="Manage personal details, multi-factor authentication, passkeys, active sessions, and provider-portal notifications." action={<button className="btn btn--cta type-button" type="button" onClick={() => setNotice('Account preferences saved.')}>Save Changes</button>} />
      <div className="portal-settings-grid">
        <PortalPanel title="Personal Details" eyebrow="Profile">
          <div className="portal-field-grid">
            <label className="type-body"><span>Name</span><input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} /></label>
            <label className="type-body"><span>Email</span><input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} /></label>
            <label className="type-body"><span>Role</span><input value="Owner" disabled /></label>
            <label className="type-body"><span>Time Zone</span><select value={profile.timeZone} onChange={(event) => setProfile((current) => ({ ...current, timeZone: event.target.value }))}><option>America/Los_Angeles</option><option>America/Denver</option><option>America/Chicago</option><option>America/New_York</option></select></label>
          </div>
        </PortalPanel>
        <PortalSignInSecurity justLinked={justLinked} />
      </div>
      <div className="portal-settings-grid">
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
