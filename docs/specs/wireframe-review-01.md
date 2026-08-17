# Wireframe Review 01 — Danny's full-flow pass (2026-07-21)

Every point from Danny's screen-by-screen review, with a disposition:
✅ decided/confirmed · ⭐ Cowork recommends · ⚠️ needs Danny · 🔧 Fable fix · 🏗️ Codex/eng · ✍️ copy rule.

Sweep dispositions into the canonical specs (transactions, onboarding, COPY-AUDIT) per `doc-update-cadence`.

---

## 1. CROSS-CUTTING — fix once, applies to every flow

### 1.1 🔧⚠️ Exit / "back" fatigue (Danny: "nothing more irritating than backing out several steps")
Flows without a bottom nav need a **one-tap escape**, not just step-back chevrons.
- **Multi-step flows / modals:** a top-right **✕ (close)** dismisses the *whole* flow with a "Discard?" guard if data was entered. Back chevron = one step; ✕ = out.
- **Deep provider settings:** breadcrumb or a persistent "Done" that returns to the settings hub.
- **⭐ Rule:** any flow ≥3 steps deep gets a visible full-exit affordance. Never make someone chevron-back 4 times.

### 1.2 🔧 Flow ownership labels + screen numbering (Danny: "identify who they're for, number screens")
Resolves his refund confusion instantly.
- Prefix every flow: **CLIENT · / PROVIDER · / STAFF · / WEB ·**
- Number every screen: `PROV-REFUND-03`, `CLIENT-CHECKOUT-02`, etc.
- Name Figma frames to match, and map to the FigJam node.

### 1.3 ⚠️ Payment × booking language taxonomy (Danny: align Pending / Past Due / Current / Upcoming; "Outstanding" is wrong for a mix)
**Proposed lock — confirm:**

| Booking state | Payment state | Meaning |
|---|---|---|
| **Upcoming** | **Pending** | booked, not yet due |
| **In progress** (current) | **Pending / Due** | service happening |
| **Completed**, within grace | **Due** | ended, payable, not late |
| **Completed**, past grace | **Past due** | ended, unpaid, late |
| — | **Paid · Prepaid · Refunded · Written off** | terminal |

- Dashboard aggregate tile: **NOT "Outstanding."** Use **"Pending & past-due charges"** (or show two numbers: *Pending $X · Past due $Y*). "Outstanding" implies they owe back-payments, which isn't true of the pending portion.
- **"Not yet due" → "Pending"** everywhere.

### 1.4 ✍️ "We don't store credit cards" — standing copy rule (Danny flagged 3×)
PetAppro **never stores card details.** Stripe holds the card; we store a **reference to the client's preferred payment method** only.
- ⛔ Never say/imply "your card is saved with [provider/PetAppro]." ✅ "Your card details stay with Stripe; we save your preferred way to pay." → COPY-AUDIT §18 (new).

---

## 2. Direct questions — answered

| Q | Answer |
|---|---|
| Auto-pay at completion through Stripe — confirmed? | ✅ **Yes** — Codex verified: SetupIntent + off-session consent, not a held authorization (transactions §9.2). |
| Are we storing credit cards? | ✅ **No.** Stripe stores; we store a preferred-method reference. See 1.4. |
| Loading-screen animation? | ✅ Functionally fine (Lottie/animated asset). The wagging-tail dog peeking over its shoulder = ⭐ a lovely brand delight — logged as post-core polish, not blocking. |
| Passkeys as extra protection (non-Google users)? | ⭐ **Yes, recommend.** Passwordless-first already includes magic-link + Apple/Google; **passkeys fit natively and are the strongest + free.** Offer passkey + magic-link + Apple/Google. SMS OTP is possible but **costs per message** (top-tier econ), so make it optional, not the default. |
| Send auth code via text? | Possible (SMS OTP) but per-message cost — offer passkey/magic-link first; SMS as fallback. |
| Who verifies a cash payment? | ✅ **The provider** (admin/manager role) — internal control so cash isn't marked received without confirmation. For a **solo provider it collapses to one step** (they record = they verify). It's provider-side, never the client. (transactions §6.) |

---

## 3. New decisions

### CLIENT · Checkout
- 🔧 **Remove an item from payment:** it's the **"pay selected"** model — **uncheck to exclude**, don't "delete." ⛔ Avoid swipe-to-delete here (implies deleting the booking). Clarify the mental model: *you're choosing what to pay, nothing is deleted.*

### CLIENT · Request a refund
- ✍️ **"Refunded" is too terse.** Use state-accurate copy: **"Refund approved"** (provider issued it) / **"Refund processing"** / **"Refund completed."**
- ✍️ Pending-refund copy: *"Your refund is on its way but delayed on the provider's side — we'll notify you when it completes."* is **correct only because a provider-issued refund IS already approved.** Keep "refund," not "refund request," in that state. *(The two-refund confusion is 1.2 — one flow is CLIENT·request, one is PROVIDER·issue.)*
- ⭐ **Partial refund itemization (good catch):** the refund confirmation must **auto-itemize** any withheld amount — *"Booking $180 − late-cancellation fee $40 = refund $140."* If the provider does NOT waive the late fee, the fee applies and the refund is partial, with that line shown. Ties to the provider's cancellation policy (provider-set, snapshot-on-booking).

### CLIENT · Delete account
- ⚠️ **Balance-due at deletion / fraud:** debt **survives** deletion (tombstoned, D-062/D-057) — deletion never forgives it. **Fraud room is limited because refunds are provider-initiated** (a client can't self-refund), so book→refund→cancel isn't a client-controlled loop. ⭐ **Don't hard-block re-signup** (harsh + Apple wants deletion to work); instead **link a re-signup to any tombstoned debt via identity.** Fraud-signals = post-MVP backlog.
- ⭐ **Passkey for delete re-auth:** yes — passkey/biometric is a good step-up for the DELETE confirm, alongside "type DELETE." 2FA covers it minimally; passkey is better.

### CLIENT · GPS interstitial
- ✍️ **Rewrite for humans (Danny's right — it reads legal/technical).** Must stay specific enough for Google's prominent-disclosure rule but sound human. Target copy:
  > **Before your walker heads out**
  > • We use your walker's live location to show you the route for *this* walk.
  > • Only you and your provider's team can see it.
  > • Tracking runs **only during the walk** and stops on its own when it ends — or tap **Stop** in the notification anytime.
  > • We keep the route for [N days — pending retention decision].
- 🔧 **Declined interstitial → needs an exit:** add a button back to the booking/client screen. Service proceeds untracked.

### CLIENT · Payment methods & auto-pay
- ✍️ Same no-store-cards clarity (1.4).
- 🔧 **"Remove card behind active auto-pay":** copy says re-enable with a different card, but the CTA only offers "Remove & switch to Pay Later." **Fix: after removing, loop them to choose another method** (don't dead-end at Pay Later).

### PROVIDER · Approve request
- ⚠️⭐ **"Override capacity and approve" (Danny wants it):** yes — a provider may know they can take one more. Offer an explicit, **logged "Approve anyway (over capacity)"** with a warning. 🏗️ Codex note: this doesn't break the atomic reservation — the reservation still commits atomically; the override just **raises the ceiling for that one approval.** Capacity stays a *default*, not an absolute the provider can't exceed on purpose.

### PROVIDER · Mark uncollectible (write-off)
- ✅ **Reasons ARE correct** (transactions §2.6): **Client non-responsive · Unable to collect · Other.** If the screen shows different ones, 🔧 Fable used the wrong list — likely mixed with the **Discount/Correction** lists (§2.6 has three separate lists). Fix the screen to the write-off list.
- ⚠️ **Deleted client with an overdue invoice — how does the provider find it?** Real gap. The invoice + tombstoned debt must remain **findable in the provider's records/reports after the client deletes** (D-062 tombstone). 🏗️ Codex: deletion removes the *client's* access, not the *provider's* record of what's owed.
- ✅ **Write-off invisible to a returning client:** confirmed intent — *"we'd prefer they pay it."* A write-off is the **provider's** internal accounting; the client should **not** see "written off / forgiven" if they log back in. The balance stays payable from the client's side. 🏗️ Flag.

### PROVIDER · Price override / credit note
- 🔧 **Correction → "Other" reveals a text field** (yes — "Other (note required)").
- 🔧 **Reason-required error is INLINE**, not a separate screen. Validation on the same picker; no back-navigation needed — the picker stays until a reason is chosen.

### PROVIDER · Unpaid-bookings dashboard
- ⚠️ Language per 1.3 — "Pending" not "Not yet due"; aggregate not "Outstanding."
- 🔧 **Row overlay: add a third button "Ignore for now (snooze 7 days)"** (matches §2.3 snooze).

### PROVIDER · Manual reminder
- ⚠️ **Client with notifications off / no SMS — how do they get it?** ✅ Answer: reminders go via **push + email (free, all tiers)**; if push is off, **email** still lands; and it's **always visible in-app** on the client's Pending/Past-due list at next login. SMS is top-tier only and never the sole channel. So: no client is unreachable — the in-app list is the guaranteed surface.

### WEB · Subscription management
- ⚠️ **Annual option?** ✅ Yes — pricing has annual (~2 months free, `pricing-tiers-and-features.md`). Show a monthly/annual toggle on the plan screen.
- 🔧 **Dunning — notify provider before/at failure?** ✅ Yes — email + in-app notice **in advance and on failure** for their own bill. Add to the dunning flow.
- 🔧 **Downgrade over-limit → clear "Upgrade" CTA** back to plan selection.

### WEB · Provider portal IA (Danny's biggest structural catch)
- ⚠️🔧 **"How do they get to these sub-pages?"** — the provider web portal **navigation shell isn't wireframed**; flows show leaf screens (Auto-book, Logo, Theme, Share & grow) with no path to them, and menu/label mismatches ("Services" menu, Auto-book content).
  - **Fix: wireframe the portal nav shell, and show these as TABS under their parent page:**
    - **Services** → prices · times/availability · capacity · **auto-book** · M&G rules
    - **Branding** → **logo (or business-name text)** · **themes** · business name
    - **Share & grow** → the social ad card (F-023)
    - **Billing** → plan · payment method · invoices
  - Aligns with `provider-settings-ia.md` — the leaf screens exist; the **shell + tabs** are the gap.

### WEB · Branding
- 🔧 **Logo flow needs the no-logo → business-name-text option** (matches onboarding §5.5).
- 🔧 **Themes belong under Branding too** (tabs, per above).
- ⭐ **Theme selection: show a small "themes by plan" matrix** — genuine **upsell**: locked themes show which plan unlocks them + an Upgrade CTA.

### WEB/APP · Business closure / ownership transfer
- 🔧 **Transfer form needs Name + Email fields** (successor nomination; matches §9 affirmative acceptance).
- ⭐ **On "Begin closure," auto-generate a downloadable + emailed CSV/PDF** of clients with outstanding balances + contact info — the provider's own data, and they'll need it.
- ⚠️🔧 **Client-side closure export — clients don't log in on web.** Real gap. Path must be: **in-app (mobile)** OR an **emailed link → web page → enter unique code + account email → download.** The client's account may be gone, so this needs an **unauthenticated-but-verified** web export path. 🏗️ Codex — this is the D-057 client-export mechanism, currently unspecified.
- 🔧 **"Closed — tombstone" needs an APP version too**, not just web.

### CROSS · Share & grow
- Covered by the portal-IA fix (reachable under Branding / its own nav item).

### APP · Auth & entry
- ⭐ **Auth: offer passkey + "send code" (magic link/OTP)** per §2 answer.
- 🔧 **Client entry: add "Scan QR code"** alongside manual invite-code entry.

### APP · Sign-up → dashboard
- 🔧 **Profile + emergency contact fields → REQUIRED.**
- 🔧 **Add a pet → DATE OF BIRTH required** (drives puppy rates; already logged 2026-07-21).

### APP · Booking request
- 🔧 **Live price preview → full per-day/night line-item breakdown** (charge type + rate per line); drawer or overlay both fine. Already spec'd transactions §4.4.
- 🔧 **M&G gate:** no booking request accepted until the required M&G is completed **OR the provider overrides it** (they may have already met the owner + dogs). ⭐ **Add the provider M&G-override** (mark a client cleared without a formal M&G) — completes the hard-gate model.

---

## 4. Copy rules to add → COPY-AUDIT
- **§18 — never imply we store cards.** "Card details stay with Stripe; we save your preferred way to pay." (1.4)
- GPS interstitial: human, not legal — but keep the five specifics (precise location · background · who sees · retention · how to stop). (§3 GPS)

---

## 5. Engineering / Codex flags
- Capacity **override-on-approve** (raises the ceiling for one approval; reservation still atomic).
- Provider **retains the debt record after client deletion**; write-off is provider-internal and invisible to a returning client, balance stays payable.
- **D-057 client-export mechanism**: unauthenticated-but-verified web path (emailed link + code + email) for a client whose account may be gone.
- Re-signup **linked to tombstoned debt** via identity (fraud-signals backlog).

---

## 6. Needs Danny (the short list)
1. **Payment/booking language taxonomy** (1.3) — confirm the Pending/Due/Past-due/Paid set + "Pending & past-due charges" for the aggregate.
2. **Capacity override on approve** — confirm you want it (Cowork ⭐ yes).
3. **Themes-by-plan upsell matrix** — build it? (⭐ yes.)
4. Everything else is 🔧 Fable fixes or ✅ already answered.
