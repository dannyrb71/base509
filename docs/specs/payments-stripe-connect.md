# PetAppro — Payments architecture (Stripe Connect)

How money moves in PetAppro, and how the **provider portal** should present payment setup.
Companion to `docs/specs/transactions-payments-and-invoicing.md`. This is **money code** —
build the UI now, but real wiring gets review + Stripe **test-mode** before anything goes live.

## Two separate money streams — never conflate them
1. **Provider → Base509 (SaaS subscription).** Stripe **Billing** on Base509's *own* platform
   account. This is Base509's revenue. Sold on the **web portal only** — never as an Apple
   in-app purchase in the iOS binary (App Store rule).
2. **Client → Provider (booking payment).** Stripe **Connect**, charged on the **provider's own
   connected account**. This is the *provider's* money; Base509 never holds it. Allowed in-app
   under Apple's **real-world-services exemption** (physical pet care), so it does NOT use IAP.

## Connect model
- **Standard** connected accounts (per CLAUDE.md). The provider owns their Stripe account,
  dashboard, bank, disputes, and payouts — provider is the **merchant of record**.
- **Direct charges** on the provider's account, with **application fee = $0** — the
  subscription-only model means providers keep **100%** of booking revenue.
- Base509 is the **facilitator**, not the payee, for booking money.

## Payment methods are the provider's choice — Stripe is OPTIONAL
Many solo pet-care providers run on cash / Venmo / Zelle / CashApp. So in-app card payments are
**optional, not a gate** — a provider can run bookings + invoicing without ever connecting Stripe.

Provider setting: **"Payment methods you accept"** (multi-select checkboxes):
- **Cash** — offline. App tracks the invoice/amount owed; provider **marks it paid**.
- **Venmo / Zelle / CashApp** — offline (grouped; PetAppro does NOT integrate them — no real APIs
  for this). App tracks the invoice; provider marks paid. Optional: let the provider add their
  **handle/@** so clients know where to send.
- **Card (Stripe)** — the only in-app-*processed* method. Selecting it activates the Stripe
  Connect setup; funds go directly to the provider (Connect Standard, above), auto-invoiced/tracked.

Behaviour:
- Selected methods are **surfaced to the client** at booking/checkout ("Accepts: Cash · Venmo ·
  Card"), so the client knows how to pay. Offline methods = provider collects outside the app and
  marks the booking paid; only **Card** runs through Stripe.
- Under each method, a **one-line value descriptor** (offline = "you collect, we track"; Card =
  "we process it, you get paid directly, tracked automatically") — nudge toward Card without forcing.
- The **Card option carries a status chip** (not set up · pending · active) reflecting the Connect
  account state, so it's never just checked/unchecked.

## Provider connection flow
1. Portal "Set up payments" → create/link a **Standard** connected account via Stripe
   **Account Links** (hosted onboarding) *or* Connect **embedded components** (in-app).
2. Provider completes Stripe's onboarding — business details, bank, identity/KYC. **Stripe owns
   this UI and the compliance**; do not rebuild it.
3. Store the returned **`acct_…` id** against the provider's business (Supabase).
4. Read and surface account **status**: `charges_enabled`, `payouts_enabled`, and
   `requirements`. Onboarding is frequently **incomplete on the first pass** — plan for resume.

## Portal UX (not just a button)
Wrap Stripe's flow with your own experience — three parts:
- **Before — intro screen.** What it does (get paid *directly* into your own account), what to
  have ready (business info + bank account), rough time (~5–10 min), and that Stripe verifies
  identity. Sets expectations before any redirect.
- **Connect — the action.** A button to Stripe **hosted** onboarding (simplest, Stripe-maintained)
  OR Connect **embedded components** to keep it in-app under PetAppro branding. Recommendation:
  embedded for a polished portal; hosted is perfectly fine to ship first.
- **After — status / management screen.** "Payouts enabled ✓", or "Action needed: Stripe needs X"
  with a resume link. Never assume one-and-done.
- Add a **short "what to expect" help note** — NOT a wizard duplicating Stripe's steps.
- **The Connect module is gated by the Card checkbox.** Card unchecked → the module is
  faded/disabled; checked → it activates to fully functional. And the onboarding **progress
  tracker sits at the TOP of the module, directly under the header** (orientation-first), not the bottom.

## Build now vs. wire later
- **Now (portal build):** the UI only — intro screen, connect button / embedded placeholder, and
  the status-screen states: *not connected · pending · enabled · action needed*. **Stub** the
  Stripe calls.
- **Later (wiring):** real Stripe keys in **Vercel env vars (never the repo/bundle)**, test-mode
  first, then live. Codex + Claude Code review the money path; run real test-mode flows pre-launch.

## Guardrails
- Base509 **never holds** provider booking funds — the provider is merchant + payee.
- **No Stripe secret keys** in the repo or app bundle — env vars / Edge Function secrets only.
- Subscription billing stays on the **web portal**, never in the iOS binary.
