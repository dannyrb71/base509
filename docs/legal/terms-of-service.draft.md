# PetAppro Terms of Service — ⛔ RETIRED / SUPERSEDED

> # ⛔ RETIRED 2026-07-17 (D-060) — DO NOT PUBLISH, DO NOT EDIT, DO NOT CITE.
> **This document is no longer a public agreement.** It has been **split into two**, because a consumer and a business cannot be given the same liability, indemnity, and payment terms:
> - **[Client Terms](client-terms.draft.md)** — govern Client use
> - **[Provider Terms](provider-terms.draft.md)** — govern the subscribing business and its authorized users
>
> **Retained for reference only** — it was the source both forks grew from. **Everything below is stale**, including counsel flags that have since been answered (e.g. "D-057 is OPEN" — D-057 was **decided 2026-07-17**). **Do not resolve any question from this file.** If it contradicts the Client or Provider Terms, they win.
>
> **It was deliberately not converted into a "common core."** A shared core would be a fourth document to keep in sync, and sync drift is precisely what produced the *"ever"* contradiction between the Provider Terms summary and §5. Two audiences, two agreements. → **D-060.**

---

<details>
<summary><strong>Superseded draft (reference only — click to expand)</strong></summary>

> **Status:** ⛔ RETIRED. Draft v0.1 (Cowork, 2026-07-16) — was a *brief for counsel*, not final legal text.
> **Purpose:** give the attorney a draft tailored to our actual facts rather than a blank page. Counsel reviews, edits, and approves before anything goes live.
> **Adapted from:** structure + plain-language style of [37signals' policies](https://37signals.com/policies) (Creative Commons Attribution — **attribution required if we ship materially similar text**); layer-1 framing informed by Housecall Pro (SaaS-for-service-pros model). Substance is ours.
> **Counsel decisions are flagged inline as `[COUNSEL: …]`.**

**Effective date:** [TBD] · **Version:** 0.1 (draft)

---

## The short version

PetAppro is software. We make an app that pet-care businesses use to run their bookings, and that their clients use to book. **We are not a pet-care provider, and we are not a marketplace.** We don't find you clients, we don't take a cut of your bookings, and we're not part of the care relationship between a provider and their client.

If you're a **provider**, you're running your own business. Your prices, your policies, your clients, your money. We give you the software.

If you're a **client**, you're booking with a provider you already chose. Your agreement for that care is with them, not us.

This page is the full version. We've tried to write it like humans.

---

## 1. Who we are, and who you are

**"We," "us," "PetAppro"** means **Base509 LLC**, a California limited liability company. PetAppro is our software product.

These Terms cover two kinds of people:

- **Providers** — pet-care businesses (boarders, daycares, walkers, sitters) who subscribe to PetAppro to run their business. You're our paying customer.
- **Clients** — the pet owners a Provider invites to book with them through the app.

Some sections apply to everyone; some apply only to Providers, and are marked.

By creating an account or using PetAppro, you agree to these Terms and our [Privacy Policy](/policies/privacy).

`[COUNSEL: confirm we can bind Clients via in-app acceptance at first booking (D-055 consent point 2), and whether Clients need a separate end-user agreement rather than shared Terms.]`

---

## 2. What PetAppro is — and what it isn't

PetAppro is **software**. That distinction is the most important thing on this page.

**We are not:**
- **The pet-care provider.** We don't board, walk, sit, groom, or transport any animal. We never touch your pet.
- **A marketplace or broker.** We don't match clients to providers, don't rank or recommend providers, and don't introduce anyone to anyone. A Client only reaches a Provider because that Provider invited them.
- **An employer or agent** of any Provider or their staff.
- **A party to the care agreement.** The arrangement for pet care is between the Provider and their Client.

**Providers are independent businesses.** A Provider is solely responsible for everything about the services they sell — pricing, availability, cancellations, refunds, the quality and safety of the care, their staff, their insurance, their taxes, their legal compliance, and any disputes with their clients. **A Provider must always present themselves to their clients as a separate business from us.**

**For Clients:** when you book, you're contracting with the Provider — not with PetAppro. Their policies, house rules, and cancellation terms govern that booking. If something goes wrong with the care, that's between you and the Provider.

`[COUNSEL: this is our core liability position (decision D-029). Please strengthen the disclaimers and add the indemnity you think appropriate — Providers indemnifying us for claims arising from their services.]`

---

## 3. Accounts

You need an account to use PetAppro. You must be at least 18 and able to enter a contract.

- Keep your login secure. You're responsible for what happens under your account.
- Give us accurate information and keep it current.
- One human, one account. Don't share logins.
- **Providers:** the first person to create the business account is the **Owner**. The Owner can invite staff and set their permission levels. `[COUNSEL: see §9 on account ownership.]`

We support passwordless sign-in (Apple, Google, and email links). Some sensitive actions require you to re-authenticate.

**Deleting your account.** You can delete your account from inside the app or the web portal, at any time. See §9 for what happens to your data and your business when you do.

---

## 4. Subscriptions, trials, and cancellation *(Providers)*

**Where you buy.** PetAppro subscriptions are sold **on the web only** — never inside the mobile app.

**Plans.** We offer tiered plans. What's included at each tier is described on our [pricing page](https://petappro.com/pricing). We may change plans and pricing going forward; changes won't apply to your current paid term.

**Free trial → paid.** If you start a free trial, we will tell you **before you sign up**: how long the trial runs, exactly what you'll be charged when it ends, and how often. **Your subscription automatically renews** at the end of each term until you cancel.

**Cancelling is easy — on purpose.** You can cancel **any time, yourself, from the same place you subscribed** — in your account settings on the web. No phone call, no email, no "retention specialist." One clear control.

- Cancel before your trial ends and you won't be charged.
- Cancel during a paid term and you keep access until the end of that term.
- We'll send you a **renewal reminder at least once a year**, whatever your billing period.

**Upgrades and downgrades.** You can change tiers at any time; changes are prorated. If you downgrade, we'll tell you plainly — **before you confirm** — what you'll lose or what will lock.

`[COUNSEL: California's Automatic Renewal Law (AB 2863, effective for contracts on/after 2025-07-01) expressly covers free-to-pay conversions. Please confirm our disclosure, affirmative-consent, click-to-cancel, and annual-reminder language satisfies it — and advise whether CARL reaches business subscribers, since many of our Providers are sole proprietors. We are NOT relying on a B2B exemption.]`

**Refunds.** See our [Refund Policy](/policies/refund).

**Taxes.** Prices exclude applicable taxes. `[COUNSEL / CPA: SaaS taxability by state + economic nexus — do we need to collect anywhere at launch?]`

---

## 5. Money between a Provider and their Clients

This is separate from your subscription, and it's important.

**We never touch it.** When a Client pays a Provider through PetAppro, the payment is processed by **Stripe** and goes **directly to the Provider's own Stripe account**. We take **no commission, no cut, and no percentage of any booking** — ever.

- The **Provider is the merchant of record** for their bookings. They set their prices, handle their own refunds and chargebacks, and are responsible for their own tax obligations on that revenue.
- Payments are also subject to **Stripe's** terms. Stripe's processing fees are the Provider's cost.
- Any dispute about a booking payment is between the Client and the Provider.

**Invoices.** PetAppro generates invoices and receipts on the Provider's behalf, from the Provider's own pricing. The Provider is responsible for the accuracy of their prices, taxes, and policies, and for retaining their own records.

---

## 6. Your content and your clients' data *(Providers)*

**Your clients are your clients.** We will never market to your clients behind your back, sell their information, or use your client list to compete with you.

- **You own your data** — your business information, your client records, your pets, your bookings, your notes.
- **We process it for you.** For the client data you manage in PetAppro, you are the **controller** and we act as your **processor** — we handle it on your instructions, to provide the service. Our [Data Processing Addendum](/policies/dpa) covers this, and our [sub-processor list](/policies/subprocessors) says who we use.
- **You're responsible for what you collect.** You must have the right to give us the client and pet information you put into PetAppro, and you must have your own privacy practices with your clients.
- **We use your data to run the service** — and to keep it secure and improve it. We don't sell it.

`[COUNSEL: confirm controller/processor split (decision D-055) and whether we need a separate DPA execution flow at signup or incorporation by reference here.]`

---

## 7. Acceptable use

Don't:
- Break the law, or use PetAppro to help someone else break the law.
- Harm, harass, or endanger anyone —人 or animal.
- Upload someone else's personal information you don't have the right to share.
- Try to breach, probe, or overload our systems.
- Resell, white-label, or scrape PetAppro without our written permission.
- Impersonate anyone, or misrepresent your business.

**Animal welfare.** Suspected animal cruelty or neglect is grounds for immediate termination, and we may report it to the appropriate authorities.

---

## 8. Availability, changes, and support

We work hard to keep PetAppro running, but we don't promise it will never go down. We may change or discontinue features. If we make a materially adverse change, we'll tell you.

Support is provided per your plan; free-tier accounts don't include support.

---

## 9. Ending things

**You can leave any time.** Cancel your subscription (§4) or delete your account (§3).

**When a Provider Owner deletes their account:** a business account holds records that belong to *other people* — clients, pets, bookings, and invoices. So:

- Your personal account and personal information are deleted.
- Your business is either **transferred to another Owner/Admin** (if one exists) or **closed**, and your clients are notified.
- **A limited set of records may be retained** where we're legally entitled or required to keep them for a disclosed purpose, minimized and disconnected from any live account. Our [Privacy Policy](/policies/privacy) explains what's kept and for how long. `[⚠️ COUNSEL: prior text claimed "the law requires it — issued invoices and tax records." WITHDRAWN 2026-07-17 — the Provider is the merchant/tax-reporting party. See Provider Terms §9.]`

`[COUNSEL: decision D-057 is OPEN — transfer vs. closure vs. hybrid, and how to handle a solo Provider with no second Admin, an active subscription, active bookings, or an unpaid balance. Please advise; Apple requires in-app-initiated account deletion (guideline 5.1.1(v)), so "contact us to delete" is not an option.]`

**We can end things too.** We may suspend or terminate an account that violates these Terms, creates risk or legal exposure, or doesn't pay. Except where immediate action is warranted, we'll give notice and a chance to fix it. See our [Account Ownership Policy](/policies/ownership).

---

## 10. Disclaimers and liability

`[COUNSEL: this section is a placeholder — please draft. Key positions we need protected:]`
- *The service is provided "as is"; no warranty that it's error-free.*
- *We are not liable for the pet-care services themselves — injury, loss, property damage, or any act or omission of a Provider, their staff, or a Client (D-029).*
- *We are not liable for a Provider's pricing, policies, refunds, or disputes with their clients.*
- *Limitation of liability capped at fees paid `[amount/period TBD]`.*
- *Provider indemnity for claims arising from their services.*
- *Note: we do not offer insurance or a claims/guarantee program. Marketplaces (Wag, Rover) do; we deliberately don't, because we're not in the care relationship. Providers carry their own insurance.*

---

## 11. Changes to these Terms

We'll update these Terms from time to time. When we do:

- Every version is **numbered and dated**, and old versions stay published so you can see what you agreed to.
- **We won't quietly change the deal.** For material changes, we'll give you notice before they take effect, and where it matters, we'll ask you to accept the new version.
- Small fixes (typos, clarifications) may be made without a version bump.

---

## 12. Legal odds and ends

- **Governing law:** California. `[COUNSEL: venue; arbitration + class-action waiver — yes or no? Recommend a considered view; arbitration clauses are increasingly contested and can read as user-hostile, which cuts against how we want to operate.]`
- **Entire agreement / severability / assignment / no waiver** — `[COUNSEL: standard clauses, please draft.]`
- **Contact:** support@base509.com · Base509 LLC, California.

---

### Attribution
Portions of the structure and plain-language approach of these Terms are adapted from [37signals' policies](https://37signals.com/policies), used under a [Creative Commons Attribution 4.0 license](https://creativecommons.org/licenses/by/4.0/). `[Confirm final attribution wording with counsel; required if we ship materially similar text.]`

</details>
