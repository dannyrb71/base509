# Fable Phase-2 batch — remaining wireframes (2026-07-21, overnight)

Everything still undrawn, ordered. Paste-ready block below. Goal: complete Wireframes 2.0 for review.
Draws content from the named specs — Fable should read them, not invent.

---

```
WIREFRAMES 2.0 — PHASE 2: draw every remaining flow. Work top to bottom.
REPORT AFTER EACH FLOW — do not run silently; a partial run must be visible.

GLOBAL (apply to every new flow — same as the Review-01 cross-cutting rules):
  • 402×874, reuse existing components, introduce nothing new (flag if you must).
  • Text component on FILL. No decorative backgrounds. Captions below frames.
  • One-tap ✕ exit on any flow 3+ steps deep (not just back chevrons).
  • Label flows CLIENT·/PROVIDER·/STAFF·/WEB· and NUMBER every screen.
  • Status words: Booking = Pending·Upcoming·In-Progress·Completed·Cancelled;
    Payment = Pending·Due·Past Due·Paid·Refunded·Written-off(never client-side).
  • Never "Outstanding" for a mix → "Pending & past-due charges". Never store-card
    language → "card details stay with Stripe".
  • Include empty / loading / error / permission-denied states, and BOTH branches
    of every decision.

═══ 1. MEET & GREET CLUSTER (do first — completes the booking gate) ═══
Spec: the hard-gate rule + provider override (wireframe-review-01, onboarding).

  CLIENT · Request a Meet & Greet
    Reached when a client tries a service that requires M&G and isn't cleared.
    Screens: why an M&G is needed → pick pet(s) → propose time / request →
    submitted (pending provider) → dashboard shows "M&G pending". NO booking is
    created until cleared.
  PROVIDER · Meet & Greet management
    Incoming M&G requests → view client + pets → accept/schedule / decline /
    propose new time → after the M&G: mark client CLEARED or NOT-A-FIT →
    OVERRIDE: mark a client cleared WITHOUT a formal M&G (already met them).
    Cleared client can now book normally.
  STAFF · Meet & Greet execution
    Assigned M&G → client/pet detail → conduct → outcome (fit / not) → notes.

═══ 2. PROVIDER SETUP / CONFIG WIZARD (biggest — gates the CFG-2 build) ═══
Spec: docs/specs/provider-onboarding-configuration.md (authoritative) +
provider-settings-ia.md. Draw the full wizard AND the standing web-portal
settings (they share screens).

  Wizard steps (§2): 1 account+business basics → 2 CHOOSE SERVICES (the gate) →
  3 per-service config (boarding, daycare, walking — the §5 field matrices;
  control types per §3) → 4 global settings (hours, holidays, cancellation
  window, buffers) → 5 booking-approval prefs (auto-book toggles, default OFF) →
  6 policies & house rules (prefilled, editable, hide/show — §7) → 7 connect
  Stripe (§8.1, charges_enabled gate) → 8 review & go live.
  Then the standing WEB portal shell + tabs (Review-01 nav fix):
    Services (prices·times·capacity·auto-book·M&G) · Branding (logo-or-text·
    themes·name) · Billing · Share & grow.
  Include: logo upload+crop with no-logo→text option; theme picker with
  themes-by-plan upsell matrix; SB-478 all-in price behavior in service config.

═══ 3. BOOKING LIFECYCLE & RECURRING ═══
Spec: booking flow (D-062 model), cancellation policy, transactions §4.4.

  CLIENT · Change a booking
    From a booking → edit dates/service → re-check availability + price →
    price DIFFERENCE shown (full estimate breakdown) → requires client
    reacceptance if it changed → provider re-approves if needed.
  CLIENT · Cancel a booking
    Show cancellation policy + any fee BEFORE confirming → confirm → refund path
    (provider-issued; PARTIAL if a late fee applies, itemized) → cancelled state.
  CLIENT · Recurring series (e.g. M/W/F walks)
    View series + upcoming occurrences → this-occurrence vs whole-series fork →
    skip one / add one-off / edit days-time-duration / pause / end (policy on
    end). Each occurrence charges per model.

═══ 4. OPERATIONS — provider & staff daily ═══
Specs: provider-settings-ia (report cards §4, edit-lock D-046), transactions §4
(invoices), notification plan (D-049).

  STAFF · Care execution / report card
    Assigned booking → check-IN (timestamp, both sides) → report-card DRAFT
    (checklist + notes + photos, editable) → check-OUT → on complete the card
    LOCKS to an immutable snapshot (D-046). Client is read-only.
  STAFF · Daily schedule
    Today's assignments, chronological → tap → booking/care detail.
  PROVIDER · Manage bookings
    List (filter by status) → booking detail → approve/decline, message, adjust.
  PROVIDER · Manage clients
    Client list → client detail (pets, history, invoices, referral-source field,
    private notes) → invite/relationship state.
  PROVIDER · Staff / team management
    Add/invite staff → set role (Staff⊂Manager⊂Admin⊂Owner) → permissions →
    deactivate. (Design once at Staff base; gate-up as annotation.)
  PROVIDER · Communications  ⚠️ CORRECTED 2026-07-21 — D-053: NO in-app chat at MVP.
    (Original "message threads" instruction was wrong — contradicted D-053.)
    Draw the D-053-safe surface only: notifications + native share. In-app
    threads stay a PARKED post-MVP frame, clearly labeled fast-follow.
  Notification center (CLIENT + PROVIDER)
    Chronological list, unread state, tap→deep link, mark read/clear.
    (Priming soft-ask already drawn — connect to it.)
  Invoices & receipts view
    CLIENT: booking → view/download invoice + receipt (PDF). PROVIDER: booking →
    invoice · export for accounting. Provider-branded, PetAppro absent.
  CLIENT · Updates & report cards
    Client viewing the locked report card + photos for a booking.

Report after EACH flow above. If you run out of time, stop at a flow boundary
and report where you are — never leave a flow half-drawn.
```
