# Transactions, Payments & Invoicing

**Status:** v2 — rewritten 2026-07-20 after Codex review + Danny's no-prepayment scope change. Supersedes v1 entirely (v1 was internally contradictory).
**Related:** `specs/booking_and_pricing.md` · `specs/provider-onboarding-configuration.md` §8 · `legal/client-terms.draft.md` §4 · `legal/provider-terms.draft.md` §5 · D-007 (Connect direct charges) · D-015 (deposits out) · D-052 (invoice immutability) · D-057 (closure/refunds) · LG-2/LG-3

---

## 0. Non-custodial posture

> ## ⛔ **PetAppro is not the merchant, payee, custodian, beneficial owner, or holder of Client funds.**
>
> *(Not "not in the transaction at all" — we create API instructions, render checkout, store metadata, and facilitate Provider-authorized refunds. The heading is the claim that survives scrutiny.)*

Client payments are **Stripe Connect direct charges into the Provider's own account (D-007** — not D-042, which governs web-only SaaS subscriptions).

### Non-negotiable invariants (hard acceptance criteria)

- **Direct charges only**, created in the connected-account context. Connected account needs active `card_payments` capability.
- **One Provider per Order/payment. Single currency.**
- ❌ No destination charges. No separate charges and transfers. *(Both route through the platform balance.)*
- ❌ No platform-held or pooled wallet. No `application_fee_amount`.
- ❌ No cross-Provider transfer, netting, or portability of anything.
- ❌ Client money may never pay a PetAppro subscription fee.
- **Refunds originate from the original Provider charge** and debit that connected account.
- **PetAppro does not guarantee redemption or advance funds** if a Provider cannot perform or refund.

---

## 0.1 ⭐ NO PREPAYMENT FOR UNBOOKED SERVICES (Danny, 2026-07-20)

> **A Client can only pay for bookings in the cart. There is no stored balance, no account credit, no top-up.** Clients wanting to pay ahead simply book the dates — and can modify the booking later.

**Eliminates outright:** stored-value classification (Cal. Civ. Code §1749.5/§1749.45) · FinCEN prepaid-access framework · escheat/unclaimed property · balance refundability · balance-at-closure · the entire unapplied-credit subledger.

**Better product behavior too:** "$120 for three daycares, one booked" becomes *book three, pay once* — three confirmed dates instead of a floating credit and a vague understanding.

### Excess is IMPOSSIBLE, not reinterpreted

> ⛔ **Never adopt "any excess is a tip."** That's inference again — converting a Client's money into gratuity (with real Provider tax consequences) from arithmetic rather than intent.

- Service payment amount is **not free-entry** — it equals amount due on selected invoices. Client checkout renders it **read-only**.
- **Tip is a separate, explicit field.**
- **Provider-side manual/cash entry** is where this bites (origin of the real bug). Entering more than due is **rejected before any payment or journal entry is created**, with two explicit paths:
  > *"That's $80 more than the amount due. Add approved bookings to this payment, or enter it in the tip field."*

**Refunds return to the original payment method — never to a balance.**

---

## 1. Requirements (Danny, 2026-07-20)

| # | Requirement |
|---|---|
| R1 | Invoices/receipts must look like real invoices/receipts, Provider-branded, downloadable by the pet owner |
| R2 | Unique invoice number per Provider, identifiable by Provider + year |
| R3 | Tip field in the app |
| R4 | **Payment covers selected booking invoices only** — no prepayment for unbooked services *(revised from the original prepay/balance framing)* |
| R5 | Cart / "add to cart" + checkout with payment-method choice |
| R6 | Cash payments require Provider verification |
| R7 | Past-due notification 24h after booking ends, deep-linked to the booking |
| R8 | Dashboard "payments due" = bookings whose end date AND time have passed |
| R9 | Quick Edit ±1hr to pickup/end time — **post-MVP** |

---

## 2. The ledger

**Append-only immutable journal with separate accounts. No mutable authoritative balance.**

| Account | Holds |
|---|---|
| **Service receivable** | invoiced amounts the Client owes — **posts at invoice issuance** |
| **Tips** | explicitly designated gratuities — **structurally never allocable to receivables** |
| **Refunds / credit notes** | returns and corrections |
| **Write-offs (bad debt)** | receivable relieved as uncollectible — invoice retained, reversible on recovery (§2.4) |
| **Authorized fees / adjustments** | represented **on an invoice or adjustment**, never as an unexplained raw debit |
| **Payment allocations** | joins a payment to one or more invoices |

**Entities:** `financial_journal_entries` · `financial_postings` · `payments` · `payment_attempts` · `payment_allocations` · *(optional derived projection)*

**Every record carries:** `business_id`, Client relationship, currency, source ID + type, actor, timestamps, **idempotency key**, reversal reference where applicable.
**Corrections are reversals or credit notes — never edits.**

### Hard invariants

```
service_payment_amount = sum(payment_allocations)
service_payment_amount <= sum(outstanding_amounts_of_selected_invoices)
tip_amount             = explicit payer input, default 0
```

> **No payment may settle with an unallocated remainder.**

**"Balance due" is a derived receivable total** — money the Client owes against issued invoices. It is **never** an asset-like credit balance belonging to the Client.

### Why the journal still earns its keep (with no credits)

Partial payments · one payment across multiple bookings · refunds and reversals · fees · audit history.

### ⚠️ Receivable posts at INVOICE ISSUANCE, not service completion

A booking becomes payable **at approval**, so the receivable posts when the invoice is issued. **Completion is an operational / revenue-recognition event, not a second Client debit.**

### Boundary with `packages/pricing` — strict

**Pricing PRICES. Billing ISSUES. The ledger RECORDS.**
⛔ The engine must never read payment history, Stripe state, Orders, or the ledger. `amount_due_now` is computed **outside** the engine at checkout. A tip is **billing input**, never priced.

`[BUILD: rename or remove balance_due_minor in packages/pricing/src/types.ts — misleading once the ledger lands.]`

---

## 2.1 Approval is the atomic reservation boundary

| State | Capacity | Invoice | Payable |
|---|---|---|---|
| **Requested** | none reserved | none | no |
| **Approval transaction** | lock + recheck every affected capacity unit; reserve if available | **issued here** | yes |
| **Checkout** | does **not** reserve or release | — | creates Order |
| **Payment** | **financial state only** | — | — |

- Two overlapping requests may coexist; if approved concurrently, only the transaction acquiring capacity completes — the other **returns a conflict** for Provider resolution.
- ✅ **Capacity override on approve (Danny, 2026-07-21):** on a conflict OR when at capacity, the Provider may choose **"Approve anyway (over capacity)"** — an explicit, **logged** action with a warning. The reservation still commits **atomically**; the override just **raises the ceiling for that one approval.** Capacity is a Provider default, not an absolute they can't deliberately exceed. Codex: record who/when; does not weaken the atomic-reservation guarantee.
- **An unpaid approved booking holds capacity** (the Provider approved it deliberately). To make it lapse, define an **explicit payment deadline + expiry transition**. Never let an abandoned cart silently release or indefinitely hold capacity.
- **Price and policy snapshot at request.** If approval changes dates/services/price, **require Client reacceptance** before payable.

> ✅ **RESOLVED (Danny, 2026-07-20).** Auto-book stays as a feature but is **not a second path** — it runs the **identical atomic approval operation** under a Provider-configured rule. **Per-service toggle, default OFF**, presented late in onboarding and only for services the Provider offers (onboarding spec §5.4). A **bi-weekly availability-confirmation reminder** accompanies it, since auto-book depends on current capacity/blocked dates.

### 2.2 Status vocabulary — LOCKED (Danny, 2026-07-21). Canonical; do not reinvent per-screen.

**Booking status** (state of the *service*), in lifecycle order:

| Status | Meaning |
|---|---|
| **Pending** | requested — awaiting the Provider's approval (no payment yet) |
| **Upcoming** | approved + scheduled, not started |
| **In-Progress** | service happening now |
| **Completed** | service done |
| **Cancelled** | — |

**Payment status** (state of the *money* for a booking):

| Status | Meaning | Client-visible? |
|---|---|---|
| **Pending** | not yet due | yes |
| **Due** | payable now (service done/at due point, within grace) | yes |
| **Past Due** | unpaid + past grace | yes |
| **Paid** | settled | yes |
| **Refunded** | returned to original method | yes |
| **Written off** | Provider marked uncollectible (§2.4) | ⛔ **NEVER shown client-side** — provider-internal only |

**UI rules:**
- Booking status and payment status are **separate pills** — never merged into one label. ("Pending" appears in both lists but never collides on a row: a Pending *booking* has no payment yet.)
- **Aggregate/dashboard total is NOT "Outstanding."** Use **"Pending & past-due charges"** or two chips (Pending $X · Past due $Y) — "Outstanding" wrongly implies back-payments owed.
- Render refund state as **"Refunded"** (status form), not "Refund" (button form).

> ⚠️ **Why payment states must be structural, not a boolean:** **cancellation fees depend on which.** A fee inside 24/48h is handled differently for a **Paid/Prepaid** booking (refund minus fee), a **Pending/Due** one (the fee becomes what's owed), or a **Past Due** one (fee stacks on existing debt). One "unpaid" flag can't answer that.

### 2.3 Unpaid bookings — provider view and client view differ

**Provider dashboard:** **lead with dollars, and show the count** — *"$1,240 outstanding across 7 bookings."* The money drives action; the count gives scale.
- **Separate "not yet due" from "past due"** — different urgency, different feeling.
- Tile → collapsed list → tap a row → **full booking card in an overlay** → send a reminder, or dismiss.
- **"Ignore" snoozes, it doesn't delete** — a permanent dismiss makes forgotten money vanish from the only view tracking it. Returns after N days.

**Client side — itemized, never lumped (Danny):** show the **breakdown of visits still pending payment**, not one aggregate. The Client selects which to pay — **one, some, or all** — across upcoming, current, and past due, and **adds the selected bookings to cart** to check out. *(Consistent with §0.1: you pay for bookings, and only bookings.)*

### Reminders — MANUAL only

**Reminders to a Client are Provider-initiated. No automated dunning.** *(Supersedes the earlier auto-reminder-cadence idea.)* The Provider decides when to nudge — it's their client and their relationship.

- **Show when the last reminder was sent, for that specific Provider → that specific Client**, so nobody accidentally nags a good customer twice in a day.
- Reminders send under the **Provider's** name.

> **Not to be confused with R7.** The **24h past-due notification is automatic — but it goes to the PROVIDER, not the Client.** We tell the Provider money is owed; the Provider decides whether to tell the Client. Two different messages, two different recipients.

### 2.4 Write-off — marking a debt uncollectible (Danny, 2026-07-20)

When a Client clearly isn't going to pay, the Provider needs to stop the dashboard nagging and record the loss for their books.

**Action: "Mark as uncollectible"** — permission-gated to **admin/manager** (same bar as refunds).

- **Does NOT delete or void the invoice** (D-052). It posts a **write-off adjustment** that relieves the receivable while the invoice and its history remain intact.
- **Removes it from past-due views** and stops reminders.
- **Appears in reports as written-off/bad debt** — it must not simply vanish; the number is exactly what the Provider needs for bookkeeping.
  - ⭐ **REQUIRED (Danny, 2026-07-25): write-offs are a reportable line on the Reports page, broken out BY TIME INCREMENT** — day · week · month · quarter · year (same period selector as the rest of Reports). A Provider must be able to see "bad debt this month / this quarter / this year" at a glance, not just a lifetime total. This feeds their bookkeeping and their own read on how much they're failing to collect over time. *(No standalone Reports spec exists yet — see §Reports requirements below.)*
- **Reversible — "recovery."** If the Client later pays, the write-off reverses and the payment posts normally. People do sometimes turn up with the money.
- Records **who** wrote it off, **when**, and an optional reason.

> ⚠️ **Void ≠ write-off — do not conflate them.** *Void* says the invoice was never valid. *Write-off* says the debt was real and we're not collecting it. Different meanings, different bookkeeping, and a Provider's accountant will care which one happened.

✅ **No separate "forgiveness" feature** (Danny, 2026-07-20). *"The provider can always do a price override and set to $0 if they want to offer a freebie. I do it often — good business for super-regulars."*

### 2.5 Three distinct money-not-collected events — record the true nature of each

This is what "proper bookkeeping" actually requires: **these are not interchangeable**, and collapsing them corrupts the Provider's books.

| Event | When | What actually happened | Bookkeeping meaning |
|---|---|---|---|
| **Price override to $0** | **before** the invoice is issued | The service was **free by choice** | No receivable ever existed. Not a discount, not a loss. |
| **Credit note / adjustment** | **after** the invoice is issued | Provider **chose** to reduce or clear it — goodwill, comp, service recovery | A **discount**. ⛔ **Not bad debt** — the Provider decided not to charge. |
| **Write-off (uncollectible)** | after the invoice is issued | The Client **won't pay** | **Bad debt.** A real receivable that failed to collect. |

> ⚠️ **The trap:** a Provider comping a regular *after* invoicing is a **discount**, not a bad debt. If the system records it as a write-off, their books say a customer stiffed them when the Provider simply chose to be generous. **Two different stories about the same client** — and the wrong one is in the file the next time they look.

**Our job:** record the event type accurately, keep it in reports, and let the Provider's CPA determine treatment. **We report; we don't advise on tax.**

### 2.6 Reason codes — REQUIRED on every price adjustment (Danny, 2026-07-20)

Whenever a Provider edits a price or clears a balance, they **must pick a reason.** Not optional — an adjustment without a reason is invisible in reports, which defeats the point of tracking it.

**Fixed list + "Other (note required)".** Free-text-only destroys aggregation; a fixed list is what makes *"you gave $2,400 in discounts last year"* possible.

| Category | Books meaning | Reasons |
|---|---|---|
| **Discount** | You *chose* to charge less **than your published price**, for this customer/booking. | **Long-stay / extended-stay flat rate** *(own code — keeps routine long-stay pricing separable from true one-off concessions, §2.7)* · Negotiated rate for a specific stay · Comp / freebie (regular) · Loyalty · Promotional / new client · Service recovery · Friends & family · Other (note) |
| **Correction** | The price was **wrong**. ⛔ **Not a discount.** | Mis-quoted · Wrong dates/nights · Wrong service or rate applied · Duplicate charge |
| **Write-off** | Invoiced and **uncollectible**. Bad debt. | Client non-responsive · Unable to collect · Other (note) |

> ⚠️ **Correction is the category you didn't ask for but need.** If you invoiced $600 and the right price was always $540, that's a **correction** — the price was $540. Logging it as a discount tells your books you *gave away* $60 you never actually charged. Over a year that quietly inflates both your gross revenue and your generosity.

**Availability depends on timing** (§2.5): **pre-invoice** → price override (with a Discount or Correction reason). **post-invoice** → credit note (Discount or Correction) or **write-off** (uncollectible only).

**Reports roll up by reason** — so a Provider can see discounts given, corrections made, and bad debt as three separate numbers.

> ✅ **Reports page now has its own spec: `docs/specs/provider-reports.md`** (2026-07-25, built off the Woof reports page). It absorbs the requirements below; keep the money-model rules here canonical and let the reports spec reference them.
>
> 📋 **Reports requirements (originating list — now homed in `provider-reports.md`).** The **Reports page** is distinct from the dashboard (dashboard = at-a-glance today/pulse; Reports = detailed, historical, period-filterable). Requirements:
> - **Period selector on every view:** day · week · month · quarter · year *(same increments as the dashboard graph, §provider-dashboard B4)*.
> - **Write-offs / bad debt — by time increment** (Danny, 2026-07-25, §2.4). A first-class reportable line, not a lifetime-only total.
> - **Adjustments rolled up by reason** — discounts · corrections · bad debt as three separate numbers (this §), plus the **long-stay flat-rate** reason kept filterable (§2.7).
> - **Gross → discounts → net**, with the gross-receipts labeling caution (§2.7 reporting note).
> - **Collected vs. Earnings, and aging/past-due balances** carry over from the dashboard (`provider-dashboard.md` B2/B3) at report depth.
> - ⛔ Still "we report; the Provider's CPA advises." Reports present figures; they don't compute tax treatment.

### 2.7 Long-stay flat pricing — OUT of MVP; handled by price override (Danny, 2026-07-20)

**Decision: we do not build a published duration rate-card feature for MVP.** *(A tiered/duration-tiered rate card is genuinely a "rate, not a discount" — but it's a pricing-engine feature we're not building yet.)*

**Instead:** a Provider who offers long-term flat pricing agrees it with their client directly, then applies a **price override with a Discount reason** in the app. Zero new build — the override and reason codes already exist.

> ⭐ **Give it its own reason code: "Long-stay / extended-stay flat rate."**
> Without a dedicated code these bookings land in the general discount bucket and **re-create exactly the reporting noise §2.6 was built to avoid** — every long stay at an agreed rate reading as a one-off concession. A separate code keeps them **filterable**, so a Provider can still see true concessions apart from routine long-stay pricing. One list entry, no engineering cost.

**Build requirement:** the override must be applicable **at booking/approval time**, not only post-invoice — so the **Client sees the agreed price before they pay**, never the standard rate followed by a surprise adjustment. *(Also keeps the displayed price honest under SB 478.)*

**Provider guidance is content, not a feature** — explain in help/FAQ how to do this (see `apps/web/copy/support-faq.md`).

**Reporting note:** reports show **gross → discounts → net**. Label the gross figure carefully so it's never mistaken for **gross receipts** on a tax return — gross receipts are what was actually billed, after any discount. *We report; the Provider's CPA determines treatment.*

`[Revisit post-MVP: if enough Providers run duration rate cards, a tiered pricing config is the correct home for it — the engine already supports tiered models.]`

---

## 2.8 Category research — what pet-care software actually does (Cowork, 2026-07-20)

First **flow-level** competitive research we've done (prior research was positioning/complaints, not flows). Sources: Time To Pet, Scout, Precise Petcare, Pet Sitter Plus, PetSitClick.

### ✅ Validated — our model is the category standard
**request → approve → invoice → payment.** Time To Pet, Scout, and Precise Petcare all follow this sequence: clients request from any device, the business approves, an invoice is generated, payment processes. **D-062e independently matches the category.** Good sign — this isn't an unusual shape.

### ⚠️ CHALLENGED — nobody uses a "cart"

**No evidence of a client-side cart anywhere in the category.** The pattern is **invoice-based**: clients view outstanding invoices in a portal and pay them. The batch functionality that exists is **provider-side** — Time To Pet "process payments for all clients at once," PetSitClick "mark multiple invoices as paid."

> **The mechanic Danny described is right; the metaphor may be wrong.** *"Show the breakdown of visits still pending payment, let them select one, two, or all"* **is** the category pattern — it's just **"pay selected invoices,"** not a shopping cart. These are **bills being settled, not products being bought**, and "Add to cart" may read oddly to a pet owner who isn't shopping.
>
> **Recommendation: keep the mechanic, drop the e-commerce framing.** Client-side surface = **"Outstanding" / "Pending payment"** with multi-select → **"Pay selected."** Internally the Order entity (§3) is unchanged. `[Danny: naming call.]`
>
> *(Danny flagged this doubt himself before the research — "I'm not sure 'add to cart' makes sense for this service." It doesn't, in this category.)*

### ❌ Found in the category, DELIBERATELY REJECTED — small-balance write-off
**Pet Sitter Plus** offers a write-off reason for *"the amount outstanding is very small."*

> **We are not adopting it** (Danny, 2026-07-20): *"it's a client that won't pay… these solo providers are likely living paycheck to paycheck as it is."* And the sharper version: **"'small' is not small to them."**
>
> ⛔ **The principle: PetAppro never decides what counts as a small amount of a Provider's money.** That reason code exists because larger operations don't bother chasing $3. **A $15 remainder may be gas money or a meal** to a solo provider. The moment the app offers to write off a "small balance," it has made a judgment about the value of their money that is not ours to make — and it's still a client who didn't pay.
>
> **The capability remains** — a Provider who wants to clear a remainder can write it off under "unable to collect." We just don't ship a reason code that *normalizes* it or nudges toward it. ⛔ **Do not re-add. Reviewed and rejected.**
>
> **Extends to copy everywhere:** never describe money owed to a Provider as *small, minor, trivial, just, or not worth chasing.* → `COPY-AUDIT.md` §17.

### 📌 Noted — invoice-in-advance is a real practice
Pet Sitter Plus supports invoicing **either in advance or at end of service**, and notes *"some businesses invoice in advance to reduce bad debt."* Consistent with our Pay-now option (§9.1) — worth surfacing to Providers as a bad-debt mitigation, not just a payment preference.

### Confirmed standard
Outstanding-invoice lists and **aging balances** are standard reporting across the category — validates the unpaid-bookings dashboard (§2.3).

**Sources:** [Time To Pet](https://www.timetopet.com/) · [Scout](https://www.scoutforpets.com/) · [Precise Petcare](https://www.precisepetcare.com/) · [Pet Sitter Plus — write-off](https://support.petsitterplus.com/support/solutions/articles/101000429011-write-off-amount-due-on-invoice) · [PetSitClick](https://www.petsitclick.com/blog_1.html)

---

## 3. Cart, Order & checkout

**An Order is NOT a payment event.** Four concepts:

| Concept | What it is |
|---|---|
| **Order / checkout intent** | Groups **one Provider's** approved invoices + explicit tip + payment method + totals |
| **Payment attempt** | Processor or manual attempt — pending, failed, expired, or succeeded |
| **Payment** | A **settled or verified** receipt of money |
| **Payment allocation** | Many-to-many payments → invoices |

Supports: one payment covering N invoices · one invoice paid by multiple payments · **retries without duplicate Orders or charges** · receipts showing exact allocation.

**Order is single-Provider, single-currency.** ❌ **No balance top-ups — prohibited, not deferred.**

**Checkout shows before confirm:** line items · **all mandatory non-tax fees included in the displayed price** (SB 478) · tip (separate, optional) · total · payment method.

---

## 4. Invoices & receipts

### 4.1 Content
Provider business name + contact · Client name · **invoice number** · issue date · service description/dates/rates · subtotal · discounts · **tax separately** · **tip on its own line** · total · amount paid · balance due · payment method + date · Provider's cancellation/refund terms reference.

### 4.2 Numbering — `WOO-0417-26-00001`

```
WOO - 0417 - 26 - 00001
 │      │     │     └── per-(business, year) sequence
 │      │     └──────── YY, Provider's configured timezone
 │      └────────────── public Provider number (stored separately from internal IDs)
 └───────────────────── 3-letter brand prefix, TRULY FROZEN at signup
```

**Subpoena answer:** the Provider number resolves to exactly one business in one indexed lookup. Two Johns are 0417 and 0982 — letters can collide, the number can't.

**Rules:**
- **Prefix truly frozen.** A rebrand changes invoice *display branding*, not the assigned prefix.
- **Tenant FK is `business_id`** (canonical). No parallel `provider_id`.
- Four digits = **minimum display padding**, not a 9,999 ceiling.
- **Allocate the number only at ISSUE** — never for requests, carts, or drafts.
- Counter row keyed **`(business_id, issue_year)`**; increment + insert **in one DB transaction** under row lock/atomic upsert; **unique constraint `(business_id, issue_year, sequence_no)`**.
- ⛔ **No plain Postgres sequence** if gapless is required (values lost on rollback).
- Annual reset needs **no cron** — a new `(business_id, issue_year)` counter starts at 1.
- **Void, never delete.** Corrections use credit notes.
- Store component snapshots + rendered string; identify tenant **exclusively via `business_id`**. ⛔ **Never parse the number** for authorization, joins, or lookup.

### 4.3 Two kinds of invoice

| Invoice | Merchant | Branding |
|---|---|---|
| **Provider → Client** | The Provider | **Provider only. PetAppro appears nowhere**, including Starter |
| **PetAppro → Provider** (subscription) | Base509 LLC | Ours — we *are* the merchant |

---

### 4.4 Pre-submit ESTIMATE — full breakdown before the client commits (Danny, 2026-07-21)

The price-preview screen must show the **full itemized breakdown**, not a one-line summary. A boarding stay commonly spans holiday + non-holiday nights, with puppy and extended rates varying per night — **the client must see how the total was derived *before* they submit the request.** (Competitive wedge #5 "transparent pricing to the client"; SB 478.)

- **Display requirement, not new engine work.** `packages/pricing` already returns a **storable, itemized breakdown** (`booking_and_pricing` §8/§10). Render what it returns; don't recompute in the UI.
- **Grouped by rate/night type**, e.g.:
  ```
  2 nights · standard   × $40   $ 80
  3 nights · holiday     × $60   $180
  puppy surcharge · 5 nт × $10   $ 50
  additional dog (Bell)          $ 15
  ──────────────────────────────────
  Subtotal                       $315
  Tax (shown separately)         $  —
  TOTAL                          $315
  ```
  All mandatory non-tax fees included in the displayed total (SB 478).
- ⚠️ **This is an ESTIMATE, not an invoice — label it clearly.** It reflects the selected dates/pets and recomputes if those change. The numbered INVOICE (§4.2) is issued at **approval**; same breakdown, different document + label.
- **"Save estimate as PDF" / print** — available to the client (and provider). The invoice PDF is the separate post-approval artifact.
- ⛔ **Integrity rule: the estimate, the snapshot-on-booking (D-043), and the invoice are the SAME breakdown object rendered in three places.** Same line items, same numbers. This is the no-surprises / SB 478 guarantee — what the client sees pre-submit is exactly what they're charged.

`[⚠️ WIREFRAME CORRECTION: the "Live price preview + care notes" screen shows a summary ("3 nights × $40 = $120"). Replace with the full breakdown, the detail overlay Fable built, and the PDF/print action.]`

## 5. Tips

- **Separate line, separate account.** Never offsets service debt — structurally, not by convention.
- Flows to the **Provider's** Stripe account. **PetAppro takes no part of a tip.**
- Exists wherever in-app payments do; without in-app payments, tips happen directly between Client and Provider (`COPY-AUDIT.md` §8 — never plan-gated).
- ⚠️ **If staff performed the service, tip allocation is the Provider's legal problem.** **PetAppro never allocates tips to workers** — engineering constraint.

### 5.1 Field labeling — DESIGN REQUIREMENT

> **A tip field is ALWAYS present and optional** — on **both** Client checkout and **Provider-side payment entry**.

**Two visually distinct fields. Never one amount box the system splits.**

> **Payment — for services**
> Covers what's due on the bookings you selected.
>
> **Tip — optional**
> A thank-you for your provider. Tips are separate and don't go toward your balance.

> ⛔ **No dark patterns.** Tip defaults to **zero/blank**. **No pre-selected percentage**, no pre-filled amount to remove, no guilt copy. Unselected suggestion buttons are fine; a pre-selected one is not.

**Show the breakdown before confirming:**
```
Services (3 bookings)   $120.00
Tip                      $20.00
──────────────────────────────
Total                   $140.00
```

---

## 6. Cash & manual payments

State machine: `recorded → pending verification → verified` (or `disputed`).
- **Only permitted roles may verify**; record **who** and **when** — the only payment path with no processor record behind it.
- Posts to the ledger **on verification**, not on claim.
- **Overpayment rejected at entry** (§0.1).

---

## 7. Past-due logic

**Past due = booking end date AND time have passed** — not a same-day scheduled end (late pickups are normal).

**Improvement: use the actual check-out timestamp when present, falling back to scheduled end.** We already capture check-in/out; actual check-out is truer, handles late pickups automatically, and reduces the need for R9's Quick Edit.

Also: **compare in the Provider's timezone** · fully-paid bookings never appear as due · distinguish "unpaid, not yet due" from "past due" (notification fires at 24h) · consider a Provider-configurable grace window (default 24h).

---

## 8. Canonical regression tests — RELEASE-BLOCKING

**`three_bookings_can_be_paid_in_one_order_without_tip_inference`**
1. Three approved $40 invoices selected · service total $120 · tip defaults $0
2. One $120 payment allocates $40 to each invoice
3. All three end at $0 due
4. **No tip entry exists**
5. Idempotent replay creates no duplicate payment or allocation

**`service_payment_cannot_exceed_selected_booking_total`**
1. One $40 invoice selected; Provider enters $120 in the service-payment field
2. **Submission rejected before any payment or journal entry is created**
3. UI offers: add approved bookings, **or** explicitly enter a tip
4. **Nothing automatically changes the tip**
5. If the Provider explicitly chooses $40 service + $80 tip → final confirmation, record those exact separate amounts

**Test both card and Provider-verified manual paths.**

> ⛔ **Invariant:** a tip exists **only** from an explicit payer-provided tip field. Never inferred from arithmetic, including `payment > amount due`.

---

## 9. Payment timing & Stripe (Codex-verified against Stripe docs, 2026-07-20)

Three Client-chosen options at checkout. **The Client chooses — auto-pay is never defaulted on.**

### 9.1 Pay now
PaymentIntent created and confirmed as a **direct charge** in the connected account (`Stripe-Account` context, no `application_fee_amount`). Connected account needs active `card_payments`.

### 9.2 Auto-pay when the service completes
⚠️ **Not a months-long authorization hold** — it's **payment-method setup + off-session consent.**

```
At booking:  Customer (in connected acct) → SetupIntent (usage=off_session,
             same connected-acct context) → attach PaymentMethod → store consent
At completion: new PaymentIntent { customer, payment_method,
             off_session=true, confirm=true }
On failure/auth-required: notify Client, return them to an on-session flow
```
A SetupIntent authenticates the method for later use but **does not guarantee later charges succeed** — a recovery flow is required, not optional.

**Consent must state:** permission for the Provider to initiate payment(s) · one-time vs recurring · anticipated timing · how the amount is determined.
**Retain:** `business_id` + Provider legal name · Client + booking/order IDs · consent copy **version + rendered text** · scope · timestamp · SetupIntent + PaymentMethod IDs · amount-determination rule · revocation timestamp.

> **Draft consent copy `[COUNSEL REVIEW]`:** *"By selecting Auto-pay, you authorize [Provider legal name] to save this payment method and charge it after your approved booking is completed. The charge will be the booking total shown to you, including approved changes, applicable taxes, and only a tip you explicitly enter. If you authorize Auto-pay for multiple bookings, one charge may be made after each completed booking. You may turn off Auto-pay before a charge is initiated."*

**Material added services or damage charges require fresh approval** — never swept into generic auto-pay consent.

### 9.3 Pay later
Invoice + reminders (manual, plus optional auto: on approval, before service, **24h after service ends if outstanding**, then capped). Reminders send under the **Provider's** name; push/email free at all tiers, SMS top-tier only.

### 9.4 Authorization windows
⛔ **Don't use manual capture for bookings months out.** Windows vary by network/type — **`payment_method_details.card.capture_before` is the authority**; an expired authorization is released and the PaymentIntent cancels. Manual capture is only appropriate when service falls inside the actual window.

### 9.5 Provider-scoped payment methods
Create a **separate Customer + PaymentMethod inside each connected account.**
```
(business_id, client_account_id) → connected_account_id
                                 → connected-acct Customer ID
                                 → connected-acct PaymentMethod ID
```
⛔ **Do not use:** a platform-level Customer as the canonical wallet · platform-saved PaymentMethods · **Stripe's cross-account cloning flow** · a global `stripe_customer_id` on the Client · any lookup by PaymentMethod ID without `business_id`.

> ⚠️ **Stripe deliberately supports cloning payment methods across connected accounts** — so Stripe's own object scoping is **not sufficient**. PetAppro must prohibit cloning and enforce `business_id` in server authorization **and RLS**.

### 9.6 Idempotency
Stripe keys **plus durable local idempotency**. For every Stripe POST: generate a unique key, **persist before sending**, bind to `business_id` + connected account + operation type + aggregate ID + attempt + payload hash. Reuse only for identical retries. **Never rely on Stripe's retention window** (keys may be pruned after ~24h). Store the returned object ID and reconcile before any replacement attempt.

```
setup-intent:{relationship_id}:{consent_version}
payment-intent:{order_id}:{attempt_number}
refund:{internal_refund_id}
```
**Webhook dedup:** unique constraint on `(stripe_account_id, stripe_event_id)`; apply journal changes and mark processed in **one DB transaction**.

### 9.7 Refunds (Provider-initiated, full or partial)
Permission-gated to admin/manager. Must: resolve the original PaymentIntent/Charge from our payment row · **confirm it belongs to the acting `business_id`** · submit in that connected account's context · never exceed remaining refundable amount · use an idempotency key · record pending/succeeded/canceled/failed **from webhook events** · **post ledger reversals only from confirmed processor state** · return funds to the original payment method.

Insufficient connected-account funds can leave a card refund **pending** — surface that state.

---

## 10. Legal considerations

| # | Issue | Status |
|---|---|---|
| L1 | **Money transmission** | Counsel confirms the conclusion; §0 invariants are hard engineering criteria |
| ~~L2~~ | ~~Stored value~~ | ✅ **MOOT** via §0.1 |
| ~~L3~~ | ~~Escheat / unclaimed property~~ | ✅ **MOOT** via §0.1 |
| ~~L4~~ | ~~Balance refundability~~ | ✅ **MOOT** via §0.1 — refunds go to original method |
| L5 | **Provider closure with prepaid bookings** | Narrowed — D-057 already covers it; confirm Provider Terms §9 suffices |
| L6 | **Tips + staff** | Wage treatment is counsel's; *PetAppro never allocates tips* is engineering |
| L7 | **Tax** | Treatment is counsel/CPA; **separate service/tax/fee/tip fields + immutable jurisdiction + rate snapshots** are engineering |
| ~~L8~~ | ~~Surcharging~~ | ✅ **DECIDED — unsupported.** No surcharge config, no payment-method-dependent pricing |
| L9 | **Retention** | Counsel supplies periods; immutable records, **legal holds**, tombstoning, export, deletion exceptions are engineering |
| L10 | **SB 478 all-in pricing** | Interpretation is counsel's; **all mandatory non-tax charges present from first price display through invoice** is a **test requirement**, not checkout copy |

---

## 11. Open questions

**Danny:** ✅ Nothing open.

*(Resolved 2026-07-20: auto-book path · approved-unpaid capacity treatment · payment-state model · manual-reminder policy · write-off, **no forgiveness feature** — price override to $0 covers freebies · three distinct money-not-collected events.)*

**Counsel:** L1, L5, L6, L7, L9, L10 · the §9.2 auto-pay consent copy.
**Codex/Claude Code:** the new billing/transactions test suite (§12).

> **Already decided — not open, do not re-ask:** invoice numbering + frozen prefix (§4.2) · no prepayment/no balances (§0.1) · tips always present, never inferred (§5.1) · request→approve→payable (§2.1) · **24h past-due notification** (R7 — Danny specified it; Provider-configurability is an optional enhancement, not a question) · surcharging unsupported (L8) · refunds to original method only.

---

## 12. Test coverage — the pricing suite is NOT evidence these paths are safe

Codex confirmed the 8 skips in `packages/pricing` are all **later verticals or D-015 deposits** — none touch checkout, allocation, tips, Stripe, refunds, or the ledger. **But that also means the new money paths have no coverage there, because they correctly belong outside the pricing package.**

**Required — a new release-blocking billing/transactions suite:**
exact cart payment · explicit tips · **overpayment rejection** · one payment / N invoices · off-session failure + recovery · **idempotent replay** · partial and full refunds · **cross-Provider PaymentMethod rejection** · **RLS tests proving Provider A cannot retrieve or charge Provider B's saved-method mapping.**

**Pricing-suite hygiene:** delete "prepaid credits" from the skipped placeholder **permanently** · keep only one deposit skip (documenting D-015) · rename the generic peak-pricing skip so it doesn't imply the passing holiday-rate path is untested.

---

## 13. MVP split

**MVP:** tips · invoices/receipts + numbering · cash verification · past-due + 24h notification · Provider-scoped saved methods · idempotency · the three payment-timing options · Provider-initiated refunds.
**Post-MVP:** Quick Edit ±1hr (R9) — note §7's actual-check-out improvement may reduce the need.
