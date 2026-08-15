'use client';

import Image from 'next/image';
import { useState } from 'react';
import { PlanComparisonTable } from '@/components/PlanComparisonTable';
import { usePortalPlan } from '@/components/PortalPlanProvider';
import { PortalModal, PortalPageHeader, PortalPanel, PortalStatCard } from '@/components/PortalShell';
import { TIERS } from '@/data/pricing';

const RENEWAL_DATE = new Date('2026-09-01T00:00:00');
const CYCLE_DAYS = 31;

/** Sample codes — production codes are issued and managed from the Base509 admin dashboard. */
type DiscountCode = { label: string; percent: number; status: 'active' | 'expired' | 'not-started' | 'redeemed'; effective?: string };
const DISCOUNT_CODES: Record<string, DiscountCode> = {
  WELCOME20: { label: '20% off your subscription', percent: 20, status: 'active' },
  MAKEGOOD10: { label: '10% courtesy discount', percent: 10, status: 'active' },
  'TESTER-FREE': { label: 'Free access — app tester', percent: 100, status: 'active' },
  SUMMER15: { label: '15% summer promotion', percent: 15, status: 'expired', effective: 'July 31, 2026' },
  LAUNCH50: { label: '50% launch promotion', percent: 50, status: 'not-started', effective: 'October 1, 2026' },
  THANKYOU25: { label: '25% one-time thank-you', percent: 25, status: 'redeemed' },
};

function money(value: number) { return `$${value.toFixed(2)}`; }

const INVOICES = [
  ['Aug 1, 2026', 'INV-2026-08', 'Crew Plan', '$79.00', 'Paid'],
  ['Jul 1, 2026', 'INV-2026-07', 'Crew Plan', '$79.00', 'Paid'],
  ['Jun 1, 2026', 'INV-2026-06', 'Crew Plan', '$79.00', 'Paid'],
] as const;

const STRIPE_STEPS = ['Before You Start', 'Connect With Stripe', 'Status & Next Steps'] as const;
type ConnectStatus = 'not-connected' | 'pending' | 'enabled' | 'action-needed';

const CONNECT_STATES: Record<ConnectStatus, { label: string; title: string; body: string; charges: string; payouts: string; requirements: string; action: string; tone: string }> = {
  'not-connected': { label: 'Not Connected', title: 'Connect your provider-owned Stripe account', body: 'Set up direct client payments and payouts through your own Stripe Standard account.', charges: 'Unavailable', payouts: 'Unavailable', requirements: 'Onboarding not started', action: 'Set Up Payments', tone: '' },
  pending: { label: 'Pending', title: 'Stripe setup is in progress', body: 'Stripe is reviewing the submitted details. You can resume onboarding if more information is requested.', charges: 'Pending review', payouts: 'Pending review', requirements: 'Verification in progress', action: 'Resume Onboarding', tone: ' portal-status--pending' },
  enabled: { label: 'Enabled', title: 'Client payments and payouts are ready', body: 'Direct charges and payouts are enabled on the provider-owned Stripe account.', charges: 'Enabled', payouts: 'Enabled', requirements: 'Complete', action: 'Manage Stripe', tone: ' portal-status--paid' },
  'action-needed': { label: 'Action Needed', title: 'Stripe needs more information', body: 'Booking charges can continue, but payouts are paused until the provider completes Stripe’s request.', charges: 'Enabled', payouts: 'Paused', requirements: 'Verify bank account', action: 'Resolve in Stripe', tone: ' portal-status--past-due' },
};

export function PortalBillingView() {
  const [paymentMethods, setPaymentMethods] = useState({ cash: true, wallets: true, card: false });
  const [paymentHandle, setPaymentHandle] = useState('@woofwetreats');
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>('not-connected');
  const [stripeOpen, setStripeOpen] = useState(false);
  const [stripeStep, setStripeStep] = useState(0);
  const [plansOpen, setPlansOpen] = useState(false);
  const { planKey: currentPlanKey, setPlanKey, tier: currentTier, entitlements } = usePortalPlan();
  const [selectedPlanKey, setSelectedPlanKey] = useState(currentPlanKey);
  const [notice, setNotice] = useState('');

  const selectedTier = TIERS.find((tier) => tier.key === selectedPlanKey) ?? currentTier;
  const planChangePending = selectedPlanKey !== currentPlanKey && selectedTier.monthly !== null;
  const daysRemaining = Math.max(1, Math.ceil((RENEWAL_DATE.getTime() - Date.now()) / 86400000));
  const prorated = planChangePending ? ((selectedTier.monthly ?? 0) - (currentTier.monthly ?? 0)) * daysRemaining / CYCLE_DAYS : 0;
  const cardAvailable = entitlements.cardPayments;
  const cardActive = cardAvailable && paymentMethods.card;
  const [discountInput, setDiscountInput] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const discount = appliedCode ? DISCOUNT_CODES[appliedCode] : null;
  const effectiveMonthly = Math.max(0, (currentTier.monthly ?? 0) * (1 - (discount?.percent ?? 0) / 100));
  const applyDiscount = () => {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    const entry = DISCOUNT_CODES[code];
    if (!entry) { setDiscountError(`“${code}” isn’t a valid discount code. Check the spelling and try again.`); return; }
    if (entry.status === 'expired') { setDiscountError(`“${code}” expired on ${entry.effective} and can no longer be applied.`); return; }
    if (entry.status === 'not-started') { setDiscountError(`“${code}” isn’t active yet — it starts ${entry.effective}.`); return; }
    if (entry.status === 'redeemed') { setDiscountError(`“${code}” is a one-time code that has already been used.`); return; }
    setAppliedCode(code);
    setDiscountInput('');
    setDiscountError('');
    setNotice(`Code ${code} applied — ${entry.label}.`);
  };
  const openPlans = () => { setSelectedPlanKey(currentPlanKey); setPlansOpen(true); };
  const confirmPlanChange = () => {
    setPlanKey(selectedPlanKey);
    setPlansOpen(false);
    setNotice(`Plan changed to ${selectedTier.name}, effective immediately. ${prorated >= 0 ? `Prorated ${money(prorated)} charged today` : `Prorated ${money(Math.abs(prorated))} credited`} for the ${daysRemaining} days left this cycle; next renewal Sep 1 at $${selectedTier.monthly}.00.`);
  };

  const downloadYearCsv = () => {
    const csv = [['Date', 'Invoice', 'Description', 'Amount', 'Status'], ...INVOICES].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a'); link.href = url; link.download = 'petappro-2026-billing.csv'; link.click(); URL.revokeObjectURL(url);
    setNotice('2026 billing CSV downloaded.');
  };

  const connectState = CONNECT_STATES[connectStatus];
  const cardStatus = connectStatus === 'enabled' ? { label: 'Active', tone: ' portal-status--paid' } : connectStatus === 'not-connected' ? { label: 'Not Set Up', tone: '' } : { label: 'Pending', tone: ' portal-status--pending' };
  const clientMethods = [paymentMethods.cash && 'Cash', paymentMethods.wallets && 'Venmo · Zelle · CashApp', cardActive && 'Card'].filter(Boolean);
  const displayedStripeStep = stripeOpen ? stripeStep : connectStatus === 'not-connected' ? 0 : 2;
  const togglePaymentMethod = (method: keyof typeof paymentMethods, checked: boolean) => {
    setPaymentMethods((current) => ({ ...current, [method]: checked }));
    if (method === 'card' && !checked) setStripeOpen(false);
  };
  const openStripe = () => { setStripeStep(connectStatus === 'not-connected' ? 0 : 2); setStripeOpen(true); };
  const advanceStripe = () => {
    if (stripeStep === 0) { setStripeStep(1); return; }
    if (stripeStep === 1) { setConnectStatus('pending'); setStripeStep(2); return; }
    setStripeOpen(false); setNotice('Stripe connection status updated.');
  };

  return (
    <div className="portal-page">
      <PortalPageHeader eyebrow="Billing" title="Plan, Payments & Billing" body="Manage your PetAppro subscription, choose how clients pay your business, and export records for bookkeeping." action={<button className="btn btn--cta type-button" type="button" onClick={openPlans}>Compare Plans</button>} />
      <section className="portal-money-streams" aria-labelledby="money-streams-title">
        <div className="portal-money-streams__intro"><h2 className="type-title" id="money-streams-title">Manage Your Subscription and Business Payments</h2><p className="type-body">Manage your PetAppro plan first, then choose how clients can pay your business.</p></div>
        <article><span className="type-eyebrow">Provider → Base509</span><h3 className="type-title">PetAppro Subscription</h3><p className="type-body">Your monthly PetAppro plan is billed by Base509 through Stripe Billing. Subscription purchase and management stay on the web portal.</p></article>
      </section>
      <div className="portal-stat-grid portal-stat-grid--three">
        <PortalStatCard label="Current Plan" value={currentTier.name} detail={`${currentTier.seats} · Click to change plan`} tone="accent" onClick={openPlans} />
        <PortalStatCard label="Monthly Price" value={discount ? money(effectiveMonthly).replace('.00', '') : `$${currentTier.monthly}`} detail={discount ? `${appliedCode} · ${discount.label}` : 'Billed monthly on the web'} />
        <PortalStatCard label="Next Renewal" value="Sep 1" detail={`${money(effectiveMonthly)} scheduled`} />
      </div>

      <div className="portal-settings-grid">
        <PortalPanel title="PetAppro Subscription" eyebrow="SaaS billing" action={<button className="btn btn--cta type-button" type="button" onClick={openPlans}>Change Plan</button>}><p className="type-body-bold">{currentTier.name} · {currentTier.seats}</p><p className="type-body">{currentTier.blurb}</p></PortalPanel>
        <PortalPanel title="Subscription Payment Method" eyebrow="Card on file"><div className="portal-payment-method"><span className="portal-payment-method__brand type-body-bold">VISA</span><div><strong className="type-body-bold">Ending in 4242</strong><p className="type-caption">Expires 08/29</p></div></div><button className="btn btn--cta type-button" type="button" onClick={() => setNotice('Payment-method editor opened.')}>Update Card</button></PortalPanel>
      </div>

      <PortalPanel title="Discount Code" eyebrow="Promotions & courtesy credits">
        {discount ? <div className="portal-applied-discount"><div><strong className="type-body-bold">{appliedCode}</strong><p className="type-body">{discount.label} — your subscription now bills {money(effectiveMonthly)}/mo.</p></div><button className="portal-remove-button type-body-bold" type="button" onClick={() => { setAppliedCode(null); setNotice('Discount code removed.'); }}>Remove</button></div>
        : <><div className="portal-inline-form portal-discount-form"><label><span className="type-label">Have a code?</span><input value={discountInput} placeholder="Enter discount code" aria-invalid={Boolean(discountError)} aria-describedby={discountError ? 'discount-code-error' : undefined} onChange={(event) => { setDiscountInput(event.target.value); setDiscountError(''); }} onKeyDown={(event) => { if (event.key === 'Enter') applyDiscount(); }} /></label><button className="btn btn--secondary type-button" type="button" onClick={applyDiscount}>Apply Code</button></div>
        {discountError && <p className="portal-field-error type-caption" id="discount-code-error" role="alert">{discountError}</p>}</>}
      </PortalPanel>

      <section className="portal-money-streams" aria-labelledby="business-payments-title">
        <article><span className="type-eyebrow">Client → Provider</span><h2 className="type-title" id="business-payments-title">Set Up How Clients Pay Your Business</h2><p className="type-body">Choose the methods your business accepts. Offline payments are collected by you and tracked in PetAppro; card payments are processed through your provider-owned Stripe Standard account. You are the merchant of record, funds go directly to you, and PetAppro’s application fee is $0.</p></article>
      </section>

      <PortalPanel title="Payment Methods You Accept" eyebrow="Client booking payment choices">
        <div className="portal-payment-choices">
          <label className="portal-payment-choice"><span className="portal-checkbox portal-payment-choice__check"><input type="checkbox" checked={paymentMethods.cash} onChange={(event) => togglePaymentMethod('cash', event.target.checked)} /><i aria-hidden="true" /></span><span className="portal-payment-choice__copy"><span><strong className="type-body-bold">Cash</strong><small className="portal-status">Offline</small></span><span className="type-body">You collect it; we track the invoice, you mark it paid.</span></span></label>
          <label className="portal-payment-choice"><span className="portal-checkbox portal-payment-choice__check"><input type="checkbox" checked={paymentMethods.wallets} onChange={(event) => togglePaymentMethod('wallets', event.target.checked)} /><i aria-hidden="true" /></span><span className="portal-payment-choice__copy"><span><strong className="type-body-bold">Venmo / Zelle / CashApp</strong><small className="portal-status">Offline</small></span><span className="type-body">You collect it; we track the invoice, you mark it paid.</span></span></label>
          {paymentMethods.wallets && <label className="portal-payment-handle type-body-bold">Handle / Payment Instructions <small>(Optional)</small><input value={paymentHandle} onChange={(event) => setPaymentHandle(event.target.value)} placeholder="@handle or payment instructions" /></label>}
          {cardAvailable && <label className="portal-payment-choice"><span className="portal-checkbox portal-payment-choice__check"><input type="checkbox" checked={paymentMethods.card} onChange={(event) => togglePaymentMethod('card', event.target.checked)} /><i aria-hidden="true" /></span><span className="portal-payment-choice__copy"><span><strong className="type-body-bold">Card (Stripe)</strong><small className={`portal-status${cardStatus.tone}`}>{cardStatus.label}</small></span><span className="type-body">We process it; you get paid directly, tracked automatically.</span></span></label>}
        </div>
      </PortalPanel>

      {cardAvailable && <PortalPanel title="Client Payments & Payouts" eyebrow="Stripe Connect">
        <fieldset className={`portal-stripe-module${paymentMethods.card ? '' : ' is-disabled'}`} disabled={!paymentMethods.card} aria-describedby="stripe-gate-note">
          <ol className="portal-stepper portal-stepper--module" aria-label="Stripe connection progress">{STRIPE_STEPS.map((step, index) => <li className={index === displayedStripeStep ? 'is-current' : index < displayedStripeStep ? 'is-complete' : undefined} key={step}><span>{index + 1}</span><small className="type-caption">{step}</small></li>)}</ol>
          <div className={`portal-stripe-card${connectStatus === 'enabled' ? ' is-connected' : ''}`}><div><span className={`portal-status${connectState.tone}`}>{connectState.label}</span><h3 className="type-title">{connectState.title}</h3><p className="type-body">{connectState.body}</p><p className="type-caption">PetAppro never holds booking funds or takes a marketplace cut. Identity, business, bank, and tax details stay in Stripe’s hosted onboarding.</p><dl className="portal-connect-summary type-body"><div><dt>Account</dt><dd>{connectStatus === 'not-connected' ? 'Not assigned' : 'acct_••••7K2P'}</dd></div><div><dt>Charges</dt><dd>{connectState.charges}</dd></div><div><dt>Payouts</dt><dd>{connectState.payouts}</dd></div><div><dt>Requirements</dt><dd>{connectState.requirements}</dd></div></dl></div><button className="btn btn--cta type-button" type="button" onClick={openStripe}>{connectState.action}</button></div>
          <div className="portal-connect-state-preview" aria-label="Preview Stripe connection status"><strong className="type-caption">Preview Status</strong>{(Object.keys(CONNECT_STATES) as ConnectStatus[]).map((status) => <button className={status === connectStatus ? 'is-active' : undefined} type="button" aria-pressed={status === connectStatus} key={status} onClick={() => setConnectStatus(status)}>{CONNECT_STATES[status].label}</button>)}</div>
        </fieldset>
        <p className="portal-stripe-gate-note type-caption" id="stripe-gate-note">{paymentMethods.card ? 'Card is accepted. Complete Stripe Connect to process card payments in the app.' : 'Select Card (Stripe) under Payment Methods You Accept to activate setup. Cash and payment apps work without Stripe.'}</p>
      </PortalPanel>}

      <PortalPanel title="Client Checkout Preview" eyebrow="Booking payment display">
        <div className="portal-client-payment-preview"><span className="type-eyebrow">Payment</span><h3 className="type-title">How would you like to pay?</h3><p className="type-body-bold">Accepts: {clientMethods.length ? clientMethods.join(' · ') : 'No payment methods selected'}</p>{paymentMethods.wallets && paymentHandle && <p className="type-caption">Payment-app details: {paymentHandle}</p>}<p className="type-caption">Cash and payment-app payments are collected by the provider and marked paid afterward. Card is processed securely in the app.</p></div>
      </PortalPanel>

      <PortalPanel title="Billing History" eyebrow="Subscription invoices" action={<button className="btn btn--cta type-button portal-download-button" type="button" onClick={downloadYearCsv}><span aria-hidden="true">↓</span> Download 2026 CSV</button>}>
        <div className="portal-table-wrap"><table className="portal-table type-body"><thead><tr><th>Date</th><th>Invoice</th><th>Description</th><th>Amount</th><th>Status</th><th><span className="visually-hidden">Download PDF</span></th></tr></thead><tbody>{INVOICES.map(([date, invoice, description, amount, status]) => <tr key={invoice}><th scope="row">{date}</th><td>{invoice}</td><td>{description}</td><td>{amount}</td><td><span className="portal-status portal-status--paid">{status}</span></td><td><button className="portal-icon-button" type="button" aria-label={`Download ${invoice} PDF`} title="Download PDF" onClick={() => setNotice(`${invoice} PDF download requested. Production uses the hosted invoice file.`)}><Image src="/brands/petappro.com/icon-download-fill.svg" alt="" width={24} height={24} /></button></td></tr>)}</tbody></table></div>
      </PortalPanel>

      <PortalModal open={stripeOpen} onClose={() => setStripeOpen(false)} eyebrow="Stripe Connect Standard" title={connectStatus === 'not-connected' ? 'Connect Client Payments' : 'Manage Stripe Connection'}>
        {stripeStep === 0 && <div className="portal-stripe-step"><h3 className="type-title">Before You Connect</h3><p className="type-body">Allow about 5–10 minutes. Have your legal business details, representative information, bank account, and tax information ready. Stripe verifies identity and owns the compliance workflow.</p><div className="portal-account-callout"><strong className="type-body-bold">Owner Security Check</strong><p className="type-body">Connecting or changing payouts is Owner-only and requires recent re-authentication plus MFA.</p></div><dl className="portal-definition-list type-body"><div><dt>Account</dt><dd>Danny Baker · Owner</dd></div><div><dt>Security</dt><dd>MFA required</dd></div><div><dt>Funds</dt><dd>Paid directly to your Stripe account</dd></div></dl></div>}
        {stripeStep === 1 && <div className="portal-stripe-step"><h3 className="type-title">Continue Securely With Stripe</h3><p className="type-body">PetAppro creates or links a Standard connected account using a short-lived Stripe Account Link, then opens Stripe-hosted onboarding. PetAppro receives the connected-account ID and status after Stripe returns you here.</p><div className="portal-account-callout"><strong className="type-body-bold">No Keys Required</strong><p className="type-body">You never paste publishable keys, secret keys, or webhook secrets. All credentials stay with Stripe’s hosted onboarding.</p></div></div>}
        {stripeStep === 2 && <div className="portal-stripe-step"><span className={`portal-status${connectState.tone}`}>{connectState.label}</span><h3 className="type-title">{connectState.title}</h3><p className="type-body">{connectState.body}</p><dl className="portal-definition-list type-body"><div><dt>Account Type</dt><dd>Stripe Standard</dd></div><div><dt>Charges</dt><dd>{connectState.charges}</dd></div><div><dt>Payouts</dt><dd>{connectState.payouts}</dd></div><div><dt>Requirements</dt><dd>{connectState.requirements}</dd></div></dl>{connectStatus !== 'enabled' && <p className="type-caption">Onboarding can be incomplete on the first pass. Production refreshes these fields from Stripe and provides a new hosted resume link when action is required.</p>}</div>}
        <div className="portal-modal-actions"><button className="btn btn--secondary type-button" type="button" onClick={() => setStripeOpen(false)}>Cancel</button><button className="btn btn--cta type-button" type="button" onClick={advanceStripe}>{stripeStep === 0 ? 'Verify & Continue' : stripeStep === 1 ? 'Open Stripe Onboarding' : 'Done'}</button></div>
      </PortalModal>

      <PortalModal open={plansOpen} onClose={() => setPlansOpen(false)} eyebrow="PetAppro Subscription" title="Compare & Change Plans" wide>
        <p className="type-body">Your current plan is checked. Select another column to change plans.</p>
        <PlanComparisonTable showPrices currentKey={currentPlanKey} selectedKey={selectedPlanKey} onSelect={setSelectedPlanKey} />
        {planChangePending && <div className="portal-plan-confirm"><strong className="type-body-bold">Switch from {currentTier.name} (${currentTier.monthly}/mo) to {selectedTier.name} (${selectedTier.monthly}/mo)?</strong><p className="type-body">The change takes effect immediately. Billing is prorated for the {daysRemaining} days left in this cycle: {prorated >= 0 ? `${money(prorated)} charged today` : `${money(Math.abs(prorated))} credited to your next invoice`}. From Sep 1 you’ll be billed ${selectedTier.monthly}/mo.</p></div>}
        <p className="pricing-footnote type-caption">Draft pricing — final pricing is confirmed at launch.</p>
        <div className="portal-modal-actions"><button className="btn btn--secondary type-button" type="button" onClick={() => setPlansOpen(false)}>Cancel</button><button className="btn btn--cta type-button" type="button" disabled={!planChangePending} onClick={confirmPlanChange}>Confirm Plan Change</button></div>
      </PortalModal>

      {notice && <p className="portal-inline-notice type-body" role="status">{notice}</p>}
    </div>
  );
}
