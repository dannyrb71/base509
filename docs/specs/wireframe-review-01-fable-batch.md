# Fable correction batch — Wireframe Review 01 (2026-07-21)

Paste-ready. Full rationale + dispositions live in `wireframe-review-01.md`. This is the executable version.

---

```
WIREFRAME REVIEW 01 — consolidated corrections. Apply on Wireframes 2.0.
Work in the order below. Report after each SECTION (A, then B by flow) — no
silent multi-section runs. Reuse existing components; introduce nothing new
(flag if you think you must). 402×874, text component on FILL, no decorative
backgrounds, captions below frames.

═══ A. CROSS-CUTTING — apply to EVERY flow first ═══

A1. EXIT AFFORDANCE. Any flow without a bottom nav needs a one-tap escape, not
    just back chevrons. Multi-step flows/modals get a top-right ✕ that dismisses
    the WHOLE flow (with a "Discard?" guard if data was entered). Back chevron =
    one step; ✕ = out. Anything 3+ steps deep must have a full-exit affordance.

A2. FLOW LABELS + SCREEN NUMBERS. Prefix every flow: CLIENT · / PROVIDER · /
    STAFF · / WEB ·. Number every screen (e.g. PROV-REFUND-03, CLIENT-CHECKOUT-02).
    Frame names match; each maps to its FigJam node.

A3. STATUS VOCABULARY — use these exact words everywhere a booking or charge
    shows (COPY-AUDIT §19):
      Booking status:  Pending · Upcoming · In-Progress · Completed · Cancelled
      Payment status:  Pending · Due · Past Due · Paid · Refunded ·
                       Written off (NEVER shown client-side)
      • Booking status and payment status are SEPARATE pills, never merged.
      • Dashboard/aggregate total is NOT "Outstanding" → "Pending & past-due
        charges" (or two chips: Pending $X · Past due $Y).
      • Never "Not yet due" → "Pending". Refund state renders as "Refunded".

A4. CARD-STORAGE COPY (COPY-AUDIT §18). Never imply we store cards. Anywhere a
    payment method is saved: "Your card details stay with Stripe; we save your
    preferred way to pay." Applies to auto-pay consent, payment methods, checkout.

═══ B. PER-FLOW FIXES ═══

CLIENT · Checkout
  • "Remove item from payment" = UNCHECK to exclude (it's pay-selected). No
    swipe-to-delete — nothing is deleted, they're choosing what to pay.

CLIENT · Request a refund
  • Replace terse "Refunded" with state-accurate copy: "Refund approved" /
    "Refund processing" / "Refund completed."
  • Pending state copy stays "your refund is on its way…" (a provider-issued
    refund IS approved) — do not weaken to "refund request."
  • PARTIAL refund: confirmation auto-itemizes any withheld amount, e.g.
    "Booking $180 − late-cancellation fee $40 = refund $140." If the provider
    doesn't waive the fee, show the partial with that line.

CLIENT · Delete account
  • Add passkey/biometric as the step-up on the DELETE confirm (alongside typing
    DELETE). Debt survives deletion — the consequences screen must say the
    balance remains owed (not forgiven).

CLIENT · GPS interstitial — REWRITE for humans (keep it specific for Google's
  disclosure rule, but plain):
      "Before your walker heads out
       • We use your walker's live location to show you the route for this walk.
       • Only you and your provider's team can see it.
       • Tracking runs only during the walk and stops on its own when it ends —
         or tap Stop in the notification anytime.
       • We keep the route for [N days — pending retention decision]."
  • Declined interstitial: add a button back to the booking/client screen.

CLIENT · Payment methods & auto-pay
  • Card-storage copy per A4.
  • "Remove card behind active auto-pay": after removing, LOOP to choose another
    method — don't dead-end at "switch to Pay Later."

PROVIDER · Approve request
  • Add "Approve anyway (over capacity)" on the conflict/at-capacity screen —
    explicit, logged, with a warning.

PROVIDER · Record a payment (cash)
  • Clarify the "pending verification → verified" states are PROVIDER-side
    (admin/manager confirms cash received). For a solo provider it's one step
    (record = verify). The client is never the verifier — label it so.

PROVIDER · Refund (full/partial)
  • This is the PROVIDER-ISSUES-a-refund flow (distinct from CLIENT · Request).
    Naming per A2 removes the confusion.

PROVIDER · Mark uncollectible (write-off)
  • Reasons must be the WRITE-OFF list only: Client non-responsive · Unable to
    collect · Other. (If the screen shows Discount/Correction reasons, that's the
    bug — three separate lists exist.)
  • Write-off is NEVER visible to a client who logs back in — the balance stays
    payable on their side.

PROVIDER · Price override / credit note
  • "Other" reason reveals a required text field.
  • Reason-required error is INLINE on the picker — not a separate screen to
    navigate back from.

PROVIDER · Unpaid-bookings dashboard
  • Language per A3 ("Pending", not "Not yet due"; not "Outstanding").
  • Row overlay: add a third button "Ignore for now (snooze 7 days)".

WEB · Subscription management
  • Add monthly/annual toggle on the plan screen (annual ≈ 2 months free).
  • Dunning: provider gets email + in-app notice IN ADVANCE and on failure.
  • Downgrade over-limit screen: clear "Upgrade" CTA back to plan selection.

WEB · Provider portal — NAV SHELL (structural, do this before the leaf screens):
  • Wireframe the portal navigation shell. The isolated sub-pages (auto-book,
    logo, theme, share & grow) must live as TABS under their parent:
      Services  → prices · times/availability · capacity · auto-book · M&G rules
      Branding  → logo (or business-name text) · themes · business name
      Billing   → plan · payment method · invoices
      Share & grow → the social ad card
  • Fix label/content mismatches (menu said "Services", content was auto-book).

WEB · Branding
  • Logo flow needs a "no logo → business-name text" option.
  • Themes live here too (Branding tab).
  • Theme picker shows a "themes by plan" matrix — locked themes show which plan
    unlocks them + an Upgrade CTA (upsell).

WEB/APP · Business closure / ownership transfer
  • Transfer: add Name + Email fields for the successor.
  • On "Begin closure": auto-generate a downloadable + emailed CSV/PDF of clients
    with outstanding balances + contact info.
  • CLIENT-SIDE export: clients don't use the web app. Draw BOTH: (a) in-app
    (mobile) closure notice + export, AND (b) an emailed-link → web page → enter
    unique code + account email → download (their account may be gone, so this is
    an unauthenticated-but-verified path).
  • "Closed — tombstone" needs an APP version too, not just web.

APP · Auth & entry
  • Auth screen: offer passkey + "send code" (magic link/OTP) alongside
    Apple/Google.
  • Client entry: add "Scan QR code" alongside manual invite-code entry.

APP · Sign-up → dashboard
  • Profile + emergency contact fields → REQUIRED.
  • Add a pet → DATE OF BIRTH required (drives puppy rates; derive age + puppy
    status from DOB — don't ask "age").

APP · Booking request
  • Live price preview → full per-day/night line-item breakdown (charge type +
    rate per line); drawer or overlay. Label it ESTIMATE, add "Save as PDF."
  • M&G gate: no booking request accepted until the required M&G is completed OR
    the provider OVERRIDES the requirement (they may have already met the owner +
    dogs). Add the provider M&G-override.

Report after each section. Flag anything you can't resolve or were tempted to
build new.
```
