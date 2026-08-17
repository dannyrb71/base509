# PetAppro — Feature Ideas Log

**Purpose:** A running capture of feature thoughts that go *beyond* the Woof WeTreats baseline. This is a log, not a build or PM artifact. Pull from it when we get into user flows, journey maps, wireframes, Figma components, and app build planning.

**How to use:** Add ideas as they come — rough is fine. Each entry gets a light structure so it's easy to triage later. Nothing here is committed scope.

**Statuses:** `raw` (just captured) · `exploring` · `tied-to-journey` · `in-wireframe` · `parked` · `dropped`

**Terminology:** "Provider / PCSP" = pet care service provider (the paying business owner, Danny's direct customer — sometimes referred to as "the client"). "Pet-owner client" = the provider's end customer who books services.

---

## Idea Index

| # | Idea | Who it serves | Ties to | Status | Logged |
|---|------|---------------|---------|--------|--------|
| F-001 | Hours of operation gate booking times | Provider + client | Booking flow, availability | raw | 2026-07-06 |
| F-002 | Calendar sync (Google Cal / iCal) for provider schedule | Provider | Provider schedule, integrations | raw | 2026-07-06 |
| F-003 | Half-day boarding rate (toggleable rule) | Provider (billing) + client | Rate/charge table, boarding pricing engine | raw | 2026-07-06 |
| F-004 | Booking approval vs. auto-book toggle | Provider (PCSP) | Provider settings, booking flow | raw | 2026-07-06 |
| F-005 | Discount codes set by provider/admin | Provider (PCSP admin) + client | Rate/charge table, checkout, admin | raw | 2026-07-06 |
| F-006 | Social links (web now; in-app as top-tier perk) | Provider (PCSP) | Website, provider profile, subscription tiers | raw | 2026-07-06 |
| F-007 | QuickBooks-ready report export for PCSP | Provider (PCSP) | Reporting, accounting/integrations | raw | 2026-07-06 |
| F-008 | Portfolio view / home-page photo carousel | Provider (PCSP) | Home screen, provider profile, subscription tiers | raw | 2026-07-06 |
| F-009 | Reviews on app home page | Provider (PCSP) + pet-owner client | Home screen, reviews, subscription tiers | raw | 2026-07-06 |
| F-010 | Blocked-client message + re-route to new provider code | Provider (PCSP) + pet-owner client | Blocking, auth/login, multi-provider model | raw | 2026-07-06 |
| F-011 | Multi-provider client hub / login landing screen | Pet-owner client | Auth/login, home/hub, add-provider flow, branding | raw | 2026-07-06 |
| F-012 | Block-out days by service or all services | Provider (PCSP) | Availability engine, provider schedule, booking flow | raw | 2026-07-06 |
| F-013 | Vaccination-proof gate (toggle) | Provider (PCSP) + pet-owner client | Provider settings, booking gate, pet profile, doc upload | raw | 2026-07-06 |
| F-014 | Per-service capacity caps (auto-close one service, keep others open) | Provider (PCSP) | Availability engine, provider schedule, booking flow, notifications | raw | 2026-07-07 |
| F-015 | Multi-owner household — carry over WWT "add a partner" + make partners identifiable in messaging | Pet-owner client + provider | Household/client model, messaging, profiles | raw | 2026-07-07 |
| F-016 | Fine-grained availability windows (not broad buckets) | Provider (PCSP) + client | Availability engine, hours of operation (F-001), booking time picker | raw | 2026-07-07 |
| F-017 | Per-service activity/report-card scoping | Provider (PCSP) + client | Activity logging, care notes, service instance model | raw | 2026-07-07 |
| F-018 | Recurring booking exceptions/edits (skip one, add a day, change a time) | Provider (PCSP) + client | Booking model, recurring series, schedule, cancellation attribution | raw | 2026-07-07 |
| F-019 | Booking rules: repeat-only mode + minimum advance-notice | Provider (PCSP) | Booking intake, availability engine, approval flow (F-004), notifications | raw | 2026-07-07 |
| F-020 | Provider co-user/backups — count + rights tier (admin vs booking-only) | Provider (PCSP) | Roles/permissions, staff invite, membership model | parked (not MVP) | 2026-07-07 |
| F-021 | Invite-scoped provider preview before signup (home + pricing + terms/house-rules) | Prospective pet-owner client | Invite/onboarding flow, per-provider page, website vs app, branding (D-030) | raw | 2026-07-08 |
| F-022 | Boilerplate T&C + Policies with auto name-fill | Provider (PCSP) + pet-owner client | Provider settings, legal/policies, booking agreement | raw | 2026-07-08 |
| F-023 | Shareable provider marketing card + QR (social acquisition) | Provider + prospective client | F-021 rate card, F-011 QR, F-006, D-026/D-029, D-030 | exploring | 2026-07-11 |
| F-024 | Provider profile "story" / bio | Provider + client | Provider profile, F-021, F-008, D-047 | exploring | 2026-07-11 |
| F-025 | Retail/sponsor partnerships for acquisition | Provider (GTM) | GTM/marketing, competitive-analysis §5 | exploring | 2026-07-11 |
| F-026 | In-app "coming soon" roadmap preview | Provider + client | Superseded by D-054 launch GPS | dropped | 2026-07-11 |
| F-027 | Walk (timed-service) variants + duration pills | Provider + client | D-039, timed-service model, D-046/D-047, F-014, DS service-pill | exploring | 2026-07-11 |
| F-028 | Client self-service booking edit/cancel (provider-gated window) | Provider + client | Provider settings (D-041), F-004, F-018, D-039, D-052, F-022 | exploring | 2026-07-11 |

> **Evidence source:** F-014–F-019 (and validation on F-012/F-013) come from Rover review mining across the **App Store, Google Play, and r/RoverPetSitting** — see `docs/research/teardowns/rover-app-store-reviews.md`. Marketplace signals were deliberately excluded. **Dominant finding:** per-service availability + capacity is the #1 provider software complaint; Rover's crude binary availability model is a concrete PetAppro wedge.

---

## Entries

<!-- Template — copy for each new idea:

### F-001 — <short name>
- **What:** one-line description of the feature/thought
- **Why / problem it solves:**
- **Who it serves:** provider · client · both · owner/admin
- **Ties to:** (journey, flow, screen, component — fill in as it maps)
- **Notes / open questions:**
- **Status:** raw
- **Logged:** YYYY-MM-DD

-->

### F-001 — Hours of operation gate booking times
- **What:** Providers set their hours of operation. Those hours constrain the selectable start/booking times clients can choose for services — drop-off, pick-up, etc.
- **Why / problem it solves:** Prevents clients from booking outside when the provider is actually available; keeps requested times realistic and reduces back-and-forth.
- **Who it serves:** Provider (defines availability) + client (only sees valid times)
- **Ties to:** Provider onboarding/settings (set hours), client booking flow (time picker), availability engine
- **Notes / open questions:**
  - Meet & greets are booked *by the provider*, so they don't need the hours-of-operation gate — that service is exempt.
  - Open Qs for later: per-day hours vs. single range? Separate windows for drop-off vs. pick-up? Handling of blackout dates/holidays and buffer time between bookings? Time zone source of truth?
- **Status:** raw
- **Logged:** 2026-07-06

### F-002 — Calendar sync (Google Cal / iCal) for provider schedule
- **What:** Providers can sync their daily PetAppro schedule out to Google Calendar or iCal. A toggle controls scope: sync **activities only**, or sync **all** (which includes a boarding as a single event spanning start → end).
- **Why / problem it solves:** Lets providers manage their day in the calendar they already live in, without checking PetAppro separately. Reduces double-booking and missed activities.
- **Who it serves:** Provider
- **Ties to:** Provider schedule view, settings/integrations, notification & communication system
- **Notes / open questions:**
  - Scope options so far: (a) activities only, (b) all — where a multi-day boarding shows as one continuous event start-to-end.
  - Open Qs for later: one-way (PetAppro → calendar) or two-way sync? Google OAuth vs. iCal subscription URL (read-only feed) — likely different mechanisms per provider. How do updates/cancellations propagate? Event detail level (pet name, service, client, address)? Multi-day boarding as one event vs. daily instances? Per-calendar selection?
- **Status:** raw
- **Logged:** 2026-07-06

### F-003 — Half-day boarding rate (toggleable rule)
- **What:** An optional half-day charge for boardings that run past a full 24-hour increment by more than a set grace threshold. Provider can turn it on/off from their rate/charge table.
- **Why / problem it solves:** Fairly bills partial extra days on a boarding instead of rounding to a full night or letting the extra hours go free. Provider controls whether it applies.
- **Who it serves:** Provider (billing rule) + client (affected charge)
- **Rule as described:**
  - If a boarding extends beyond a 24-hour increment **plus a threshold** (e.g. 6 / 8 / 12 hours), a half-day rate is charged.
  - The half-day rate is derived from **that day's applicable rate** — i.e. the rate tied to the day the half-day falls on, not the prior night.
  - **Holiday handling:** If the *upcoming* night would have been billed at the holiday rate, the half-day uses the holiday rate. If the night *before* was a holiday but the upcoming night is not, the half-day uses the normal applicable rate instead (regular / extended / puppy add-on fees), **not** holiday.
  - Surfaces in the rate/charge table as an on/off function.
- **Ties to:** Rate/charge table (settings + toggle), boarding pricing/billing engine, holiday & rate-tier logic, checkout/invoice
- **Notes / open questions:**
  - Is the grace threshold (6/8/12h) provider-configurable or a fixed value? Single global threshold or per-provider?
  - Confirm half-day = 50% of the day's applicable rate, or a separately set amount?
  - Which rate tiers stack into the half-day (extended, puppy add-on) and how add-ons prorate at half-day.
  - Edge case: multiple 24h+threshold rollovers in one long stay — does the rule apply per rollover?
  - Time-zone / day-boundary source of truth for determining "that day's rate."
- **Status:** raw
- **Logged:** 2026-07-06

### F-004 — Booking approval vs. auto-book toggle
- **What:** A provider setting to choose whether incoming bookings require their **manual approval before being locked in**, or are **auto-booked based on availability**.
- **Why / problem it solves:** Gives providers control over their intake — some want to vet every request, others want frictionless instant booking. One toggle covers both operating styles.
- **Who it serves:** Provider (PCSP)
- **Ties to:** Provider settings, booking/request flow, availability engine (F-001 hours + F-002 calendar), client-facing booking status, notification & communication system
- **Notes / open questions:**
  - When approval is required: what's the pending/requested state look like to the client, and does the slot hold (soft-lock) while awaiting approval?
  - Approval timeout / auto-decline window? Auto-reminders to provider?
  - Does the toggle apply globally or per service type (e.g. auto-book daycare, approve boarding)?
  - Interaction with meet & greet gate (F-001) and payment authorization timing.
- **Status:** raw
- **Logged:** 2026-07-06

### F-005 — Discount codes set by provider/admin
- **What:** Providers (PCSP) — likely at an admin level — can create discount codes that clients apply to reduce their charge.
- **Why / problem it solves:** Lets providers run promos, offer loyalty/referral discounts, or comp specific clients without hand-adjusting invoices.
- **Who it serves:** Provider (PCSP admin) creates them; pet-owner client redeems.
- **Ties to:** Rate/charge table, checkout/invoice, admin/settings, Stripe Connect payment flow
- **Notes / open questions:**
  - Code types: percentage vs. flat amount; per-service vs. whole-booking?
  - Constraints: expiration date, usage limit (total / per-client), min spend, first-time-client only?
  - Who can create — owner only, or any staff with admin role (ties to roles/permissions)?
  - Stacking rules with half-day (F-003) and other add-ons; applied before or after tax/fees.
  - Visibility: public code entry field vs. auto-applied private codes.
- **Status:** raw
- **Logged:** 2026-07-06

### F-006 — Social links (website now; in-app as top-tier perk)
- **What:** Surface provider social links — **Instagram and Facebook** for now. Scope for now is the **website, not in-app**. Consider a later feature where **top-tier subscribers** can display their social links **in-app**, especially valuable for small businesses.
- **Why / problem it solves:** Gives providers a marketing/credibility surface; in-app placement becomes a tangible upsell reason for a higher tier, and helps small businesses drive follows/discovery.
- **Who it serves:** Provider (PCSP); indirectly their pet-owner clients discovering them.
- **Ties to:** Website (near-term), provider profile screen (later), subscription tiers/monetization, admin/settings
- **Notes / open questions:**
  - Near-term: Instagram + Facebook only. Which additional platforms later? (Brand policy: Meta — IG/FB/Threads — plus TikTok and LinkedIn are allowed; **never X/Twitter or any Elon Musk platform.**)
  - In-app version gated to top tier — confirm which tier and where links render (profile header, booking confirmation, etc.).
  - Validation/format of handles vs. full URLs; open in external app vs. in-app browser.
- **Status:** raw
- **Logged:** 2026-07-06

### F-007 — QuickBooks-ready report export for PCSP
- **What:** Give providers a way to export their financial/booking reports in a format QuickBooks can consume, so they can do their books without manual re-entry.
- **Why / problem it solves:** PCSPs need clean records for accounting/taxes; a QuickBooks-friendly export removes double data entry and reduces errors.
- **Who it serves:** Provider (PCSP)
- **Ties to:** Reporting module, checkout/invoice data, Stripe Connect payout records, admin/settings
- **Notes / open questions:**
  - Export mechanism: CSV/IIF file download vs. direct QuickBooks Online API integration (OAuth)? File export is the lighter MVP path.
  - Which reports/fields: revenue by booking, per-client invoices, refunds, discounts (F-005), payouts, fees, taxes?
  - Date-range and per-service filtering; reconciliation with Stripe payout timing.
  - QuickBooks Online vs. Desktop format differences.
  - Does this belong to a subscription tier?
- **Status:** raw
- **Logged:** 2026-07-06

### F-008 — Portfolio view / home-page photo carousel
- **What:** A more robust "portfolio view" — e.g. a carousel on the app home page where the PCSP uploads their favorite photo(s) to showcase their business. Potentially a top-tier feature.
- **Why / problem it solves:** Gives providers a visual showcase to build trust and personality with pet-owner clients; another tangible upsell reason for a higher tier.
- **Who it serves:** Provider (PCSP) curates; pet-owner clients view.
- **Ties to:** Home screen, provider profile, subscription tiers/monetization, media upload/storage (Supabase), admin/settings
- **Notes / open questions:**
  - Where it renders: app home carousel vs. dedicated profile/portfolio tab — or both?
  - Number of photos allowed (and whether the cap differs by tier); ordering/featured selection.
  - Upload/storage limits, image compression, moderation of uploaded content.
  - Overlap with F-006 (social links) as a "showcase" surface — bundle into the same top-tier perk?
  - Do end-of-visit pet photos (report card style) feed this, or is it separate curated media?
- **Status:** raw
- **Logged:** 2026-07-06

### F-009 — Reviews on app home page
- **What:** Surface reviews on the app home page. Potentially a top-tier feature. Likely needs a path for pet-owner clients to *submit* a review — ideally via **Google** or the provider's **own website** rather than (or in addition to) a native in-app review store. **Needs to be sorted out.**
- **Why / problem it solves:** Social proof on the home page builds trust and conversion; routing reviews to Google/website also boosts the provider's external SEO/reputation. Another top-tier upsell surface.
- **Who it serves:** Provider (PCSP) displays; pet-owner client writes/reads.
- **Ties to:** Home screen, provider profile, subscription tiers, review-collection flow, notification & communication system (F-002 area), external integrations (Google)
- **Open questions — needs to be sorted:**
  - Source of truth: native in-app reviews stored in Supabase vs. pulling/deep-linking to Google reviews vs. embedding the provider's own-website reviews. Which for MVP?
  - If Google: display via Google Places API (read) and/or deep-link clients out to leave a review — API access, rate limits, and Google's display/attribution terms.
  - Collection trigger: post-visit prompt to the client? Only verified completed-booking clients can review?
  - Moderation/dispute handling; can a provider hide a review? (transparency vs. control trade-off)
  - Star rating + text, or text only? Aggregate score display.
  - Interaction with portfolio (F-008) and social links (F-006) as one "showcase/reputation" bundle.
- **Status:** raw
- **Logged:** 2026-07-06

### F-010 — Blocked-client message + re-route to new provider code
- **What:** When a provider blocks a client, that client sees a message on login to the blocking provider. Ship a **professional default message pre-filled in the form**, but let the PCSP **edit/write their own** that pops up when the blocked client logs into that provider.
- **Key model rule:** Blocking a client from **one** provider does **not** block them from using the app with **other** providers. On login, a blocked client must be **directed to a form to enter a new provider code** (or whatever the final UX is for establishing a new customer↔provider relationship).
- **Amendment (2026-07-06):** The client may already have *other* active relationships. Example: blocked by a dog walker but still uses a different provider for daycare. On login they should be prompted to either **go to their existing provider(s)** or **enter a code for a new one** — i.e. the block just removes the one provider, it doesn't dead-end them. This directly motivates the multi-provider hub screen → see **F-011**.
- **Why / problem it solves:** Gives providers a graceful, on-brand way to end a relationship without a jarring dead-end, while preserving the client's ability to work with other providers on the platform (multi-tenant reality).
- **Who it serves:** Provider (PCSP) sets the message + block; pet-owner client receives it and gets a path forward.
- **Suggested default message (draft, editable by PCSP):**
  > "Thank you for your interest. At this time, we're unable to continue booking services through this account. If you believe this is a mistake or have questions, please reach out to us directly. To connect with a different provider, enter a new provider code to get started."
- **Ties to:** Client blocking (provider settings), auth/login flow, multi-provider / provider-code onboarding, notification & communication system, roles/permissions
- **Notes / open questions:**
  - Where the block lives — provider-scoped relationship, not a global account ban. Confirm data model supports per-provider block state.
  - Does the blocked client keep history/data with that provider (hidden) or is it severed?
  - Empty-state UX when a client has *no* active providers (all blocked or none yet) → always lands on the "enter provider code" form.
  - Should the provider be notified/confirmed when re-blocking or if a blocked client tries to re-add their code?
  - Tone/length guidance and character limit for the custom message; profanity/brand safeguards.
- **Status:** raw
- **Logged:** 2026-07-06

### F-011 — Multi-provider client hub / login landing screen
- **What:** When a pet-owner client logs in, they land on a **PetApp­ro-branded (base branding) hub screen** showing **buttons into each of their providers** (if any), plus an **always-present "Add a new provider" button**. Adding a provider opens a popup to **input a code, scan a QR code**, etc., to attach that provider to their account.
- **Why / problem it solves:** A client can have relationships with multiple providers (walker, daycare, boarding, etc.). They need a neutral home base to choose which provider context to enter, and a consistent way to add more. Also the graceful landing spot for blocked/empty-state clients (see F-010).
- **Who it serves:** Pet-owner client (primary); providers benefit from easy client onboarding via code/QR.
- **Core behavior:**
  - Base PetAppro branding on this screen (not any single provider's branding) since it's account-level, above any one provider.
  - Lists all active provider relationships as entry buttons; tapping one enters that provider's context/branding.
  - Persistent "Add new provider" action → popup with code entry / QR scan / (other methods TBD).
  - Handles the zero-provider state (new user or all removed/blocked) → prompt centers on adding a provider.
- **Ties to:** Auth/login flow, provider-code + QR onboarding, per-provider theming/branding, F-010 (blocked/empty-state routing), roles/permissions, notification & communication system
- **Notes / open questions:**
  - Skip-the-hub UX when a client has exactly one provider — auto-enter, or always show the hub? (Consistency vs. friction.)
  - QR code generation on the provider side — where they get/share it (settings, marketing materials).
  - Provider branding scope: how much of the in-provider experience is themed vs. base PetAppro chrome.
  - Switching providers mid-session (a "switch provider" control inside a provider context).
  - Notifications aggregated across providers vs. per-provider once inside.
  - Naming for this screen (hub / dashboard / "My Providers").
- **Status:** raw
- **Logged:** 2026-07-06

### F-012 — Block-out days by service or all services
- **What:** Let providers block out specific days from availability — either for **specific service(s)** or for **ALL services** at once.
- **Why / problem it solves:** Providers need to close availability for vacations, full capacity, personal days, or to stop just one service (e.g. no boarding that weekend but daycare still open) without editing each booking rule manually.
- **Who it serves:** Provider (PCSP)
- **Ties to:** Availability engine, hours of operation (F-001), provider schedule, booking flow time picker, calendar sync (F-002)
- **Notes / open questions:**
  - Granularity: full-day block only, or partial-day/time-range blocks too?
  - Single day vs. date-range vs. recurring block-outs (e.g. every Sunday).
  - Per-service selection UI when blocking a subset vs. one-tap "block all."
  - Interaction with already-booked/confirmed bookings on a newly blocked day — warn/prevent, or block only new bookings?
  - Should blocked days flow into calendar sync (F-002) as busy/OOO events?
  - Relationship to F-003 holiday rates — is a "holiday" a rate tier, a block-out, or both independently?
- **Validation (Rover reviews, 2026-07-07):** A "Star Sitter" reported that restricting *some but not all* services silently marked her whole month unavailable for one service — costing real income — because the calendar gave **no visual indicator** of a partial restriction. **Requirement this adds:** per-service availability must be legible at a glance (open / capped / blocked per service). A silent blanket "unavailable" is a revenue bug. See `docs/research/teardowns/rover-app-store-reviews.md`. Pairs with F-014 (capacity).
- **Status:** raw
- **Logged:** 2026-07-06

### F-013 — Vaccination-proof gate (toggle)
- **What:** Optional setting that lets a PCSP **require proof of vaccinations** before bookings can proceed. Works like the meet & greet gate (F-001): a setting turns the feature on, and the **PCSP must mark it complete** for a client/pet before bookings move forward.
- **Why / problem it solves:** Many boarding/daycare providers require up-to-date vaccines for health/liability. Gating bookings on verified proof protects the provider and other animals.
- **Who it serves:** Provider (PCSP) sets requirement + verifies; pet-owner client submits proof.
- **Ties to:** Provider settings (toggle), booking gate logic (sibling to F-001 meet & greet gate and F-004 approval flow), pet profile, document/image upload & storage (Supabase), notification & communication system
- **Notes / open questions:**
  - Verification model: PCSP manually marks complete (as described) vs. any structured capture (vaccine type, expiration date) that could auto-expire and re-gate.
  - What clients submit: uploaded document/photo of records? Where it's stored and for how long (privacy/retention).
  - Per-pet vs. per-client (a client with multiple pets).
  - Which vaccines — freeform provider list vs. standard set (rabies, DHPP, Bordetella, etc.).
  - Re-gating when a vaccine expires; reminders to client before expiry.
  - Does the gate apply to all services or configurable per service (pairs with F-012 per-service thinking)?
  - Liability/disclaimer: PCSP is verifying, not PetAppro — keep platform out of the compliance-guarantee business.
- **Validation (Rover reviews, 2026-07-07):** A sitter noted Rover has *"nowhere for a sitter to require vaccinations nor a place for the owner to put the vaccination records in,"* and was *"fearful it will affect my rating"* for requesting them off-platform. Confirms real demand for both the gate **and** an owner-side record upload. See `docs/research/teardowns/rover-app-store-reviews.md`.
- **Status:** raw
- **Logged:** 2026-07-06

### F-014 — Per-service capacity caps (auto-close one service, keep others open)
- **What:** Let a PCSP set a **capacity limit per service** (e.g. max walks/day, max boarding pets at once). When a service hits its cap it **auto-closes to new bookings** while the provider's **other services stay open**.
- **Why / problem it solves:** A multi-service provider routinely maxes out one service before others (full on walking, still room for boarding + training). Today that means manually blocking — easy to forget, and (per Rover) easy to accidentally over-block. Auto-capacity keeps each service's intake correct without babysitting.
- **Who it serves:** Provider (PCSP)
- **Distinct from F-012:** F-012 = *manually* block days out. F-014 = *automatic* close when a per-service count is reached. They complement each other.
- **Ties to:** Availability engine, provider schedule, booking flow, notifications (near/at capacity), subscription tiers (?)
- **Design requirement (carried from F-012 validation):** per-service state must be **legible at a glance** — open / near-cap / capped / blocked — so a service silently going dark never costs the provider bookings.
- **Notes / open questions:**
  - Cap unit per service type: concurrent pets (boarding), slots/day (walks, daycare, training)? Likely per-service-type definitions.
  - Cap by day, by time window (pairs with F-016), or both.
  - Does a cancellation reopen the slot automatically?
  - Waitlist when capped, or just closed? (Waitlist could be its own idea.)
  - Provider notification at, say, 80% and 100% of cap.
  - Interaction with F-004 approval mode (a pending request holds a slot against the cap?).
- **Reddit reinforcement (2026-07-07):** r/RoverPetSitting's #1 provider peeve is that a **binary available/unavailable** model can't express real capacity. A single-dog-at-a-time sitter was penalized because the system assumes "high-volume, always-available, multi-dog" providers. **Design implication:** model capacity richly — concurrent limits, per-service caps, and fit/energy rules — not one open/closed flag. **And:** a blocked/capped state should actually **gate requests** (owners shouldn't be able to request against a closed service), not just display.
- **Status:** raw
- **Logged:** 2026-07-07 (from Rover review mining)

### F-015 — Multi-owner household (2+ owners, both identifiable)
- **What:** A household/client account can have **more than one human owner**, each with their own name/identity, so when either messages the provider it's clear **who** is talking.
- **Why / problem it solves:** Couples/families share pet care. Rover reviewers flagged that only one owner name shows, forcing people to sign every message manually and confusing the provider. PetAppro's household model should support this natively.
- **Who it serves:** Pet-owner client (primary) + provider (clarity on who they're dealing with)
- **Ties to:** Household/client data model, messaging/notifications, profile/onboarding, roles within a household (?)
- **Notes / open questions:**
  - Second owner as a full login vs. a named contact on one account? (Auth + invite implications.)
  - Permission parity — can either owner book, pay, edit pets, or are there primary/secondary roles?
  - How this reconciles with D-003 (block same user as client+staff) and per-provider client profiles (D-004/D-005).
  - Messaging attribution: show sender name per message thread.
- **Correction (2026-07-07, Danny):** WWT **already has an "add a partner" function** on the client / pet-parent side — so multi-owner is a **carry-over feature, not net-new.** The genuine **open delta is messaging attribution**: knowing *which* partner is messaging the provider (the Rover pain point). So F-015 reduces to "carry over add-a-partner **+** make each partner identifiable in messaging."
  - Note: this was **missing from `woof-wetreats-reference-review.md`** — that review doc is not a complete feature inventory (see the meta-flag below).
  - Distinct from the **provider** side (staff invite via WWT `invite-staff`; extension idea in **F-020**).
  - **Sender attribution is a cross-cutting messaging rule:** chat/SMS **always** shows the sender's first name — no conditional logic. Recorded as a requirement in `notification_and_communication_system.md` §8 (in-app messaging add-on).
- **Status:** raw
- **Logged:** 2026-07-07 (from Rover review mining)

### F-016 — Fine-grained availability windows (not broad buckets)
- **What:** Let providers define **specific availability times** rather than a few fixed broad blocks. (Rover's three buckets — 6–11, 11–3, 3–10 — drew explicit complaints for being too coarse.)
- **Why / problem it solves:** Real provider availability doesn't fit coarse buckets; granularity means clients only request times the provider can actually do, cutting back-and-forth and no-fits.
- **Who it serves:** Provider (PCSP) defines; client sees only valid times.
- **Ties to:** Availability engine, hours of operation (F-001), booking time picker, calendar sync (F-002)
- **Notes / open questions:**
  - Enhancement to F-001 rather than a separate system — decide whether to merge when we spec availability.
  - Per-day custom windows vs. a weekly template with exceptions.
  - Buffer/travel time between bookings; min notice before a slot.
  - Interaction with per-service capacity (F-014) — windows *and* counts.
- **Bulk / recurring editing (Play + Reddit, 2026-07-07):** Multiple providers complain Rover forces **day-by-day** availability edits ("can't switch all Wednesday hours," "can't update more than one day at a time"). Tedious editing → stale calendars → wasted time on both sides. **Requirement:** support setting availability in bulk (e.g. "all Wednesdays," date ranges, recurring templates with exceptions).
- **Status:** raw
- **Logged:** 2026-07-07 (from Rover review mining)

### F-018 — Recurring booking exceptions/edits
- **What:** For a **recurring** booking series (e.g. weekly walks), let providers/clients **edit a single occurrence** — skip one day, add an extra day, or change one instance's time — without breaking or re-creating the whole series.
- **Why / problem it solves:** Pet care changes week to week (a vet appt, a one-off extra day). Rover users report the app *won't* cleanly skip/modify one occurrence ("cancel a walk then it just pops right back up," "can't change it until the week of") — a top-voted complaint. Recurring cadence is also flagged in our tech arch as the variance most likely to surface first.
- **Who it serves:** Provider (PCSP) + pet-owner client
- **Ties to:** Booking/series data model, provider schedule, cancellation/attribution, notifications, availability engine
- **Notes / open questions:**
  - Data model: series + per-occurrence exceptions (skip / modify / add), à la calendar recurrence.
  - Who can edit an occurrence — provider, client, or both (ties to F-004 approval)?
  - Cancellation attribution: capture *who* initiated and *why* (owner-requested vs. provider) honestly — Rover users game a fake "availability changed" reason today.
  - Price/impact recalculation when an occurrence is skipped/added.
  - How far ahead can a single occurrence be changed (no "only the week of" trap)?
- **Status:** raw
- **Logged:** 2026-07-07 (from Rover review mining)

### F-019 — Booking rules: repeat-only mode + minimum advance-notice
- **What:** Provider-set intake rules: (a) a **"repeat/existing clients only"** mode that stops new-client requests, and (b) a **minimum advance-notice** requirement so same-day/last-minute requests are limited — configurable, ideally per service.
- **Why / problem it solves:** Rover sitters repeatedly ask for exactly this — they get penalized for declining last-minute or new-client requests their rules should have prevented. Providers want to control *who* can book and *how much notice* they need, without a penalizing manual decline.
- **Who it serves:** Provider (PCSP)
- **Ties to:** Booking intake/eligibility, availability engine, approval flow (F-004), per-service settings (F-012/F-014), notifications
- **Notes / open questions:**
  - "Repeat only" definition — any prior completed booking? Provider-marked "regulars"?
  - Advance-notice unit (hours/days), global vs. per-service; hard block vs. soft warning.
  - Interaction with capacity (F-014) and approval mode (F-004).
  - Client-facing messaging when a request is blocked by a rule (keep it graceful).
  - Our model has no public marketplace (D-026 invite/QR only), so "new client" = someone with the invite but no history — confirm the definition fits.
- **Status:** raw
- **Logged:** 2026-07-07 (from Rover review mining)

### F-020 — Provider co-user / backups: count + rights tier
- **What:** Extend the existing provider "invite another user" (WWT `invite-staff`) so a provider can add **more than one** backup — capped (e.g. up to 2) or unlimited — and, when inviting, the **primary user(s) are prompted to grant the invitee either full admin rights or booking-management-only**.
- **Why / problem it solves:** Small providers want a trusted backup or two who can cover bookings without handing over full control of the business. A limited "booking manager" role gives coverage without full admin exposure.
- **Who it serves:** Provider (PCSP)
- **Priority:** **NOT MVP — parked.** Danny's note: "just a thought, maybe not even important unless we see this as feedback later." Owner/admin/staff roles already exist (product brief §4); this is a *refinement* (a booking-only tier + a backup cap), not net-new capability.
- **Ties to:** `user_roles_and_permissions.md`, staff invite/membership model, D-019 (admin optional at MVP)
- **Open questions (for later):**
  - Is "booking-management-only" a new named role or a permission subset of `staff`/`admin`?
  - Cap on number of admins/backups vs. unlimited; who can promote/demote.
  - Distinct from F-015 (that's the *client* household side).
- **Status:** parked (not MVP)
- **Logged:** 2026-07-07 (Danny)

### F-017 — Per-service activity/report-card scoping
- **What:** Activity logging (photos, walks, feed/potty notes, report cards) must be **scoped to the correct service instance**. Logging an activity for one service must **not** terminate or interfere with a different, still-active service for the same pet.
- **Why / problem it solves:** A Rover sitter reported that recording a walk *closed the boarding "card" and ended the stay early* — because the activity wasn't tied to the right service instance. For PetAppro (concurrent services per pet are plausible), activity/care records must attach to the specific booking they belong to.
- **Who it serves:** Provider (PCSP) logs; pet-owner client reads.
- **Ties to:** Activity logging, care notes, booking/service-instance data model, notification & communication system
- **Notes / open questions:**
  - Data model: activity record → foreign key to a specific booking/service instance, not just to the pet.
  - How activities render when a pet has overlapping services (e.g. a walk during a boarding stay) — nested under the parent booking?
  - Report-card lifecycle: what opens/closes a card, and never let one service's log close another's.
- **Status:** raw
- **Logged:** 2026-07-07 (from Rover review mining)

### F-021 — Invite-scoped provider preview before signup
- **What:** A prospective client who holds a provider's invite code/link can view **that one provider's** read-only info **before** creating an account — home/overview, price sheet(s), and terms & conditions / house rules — then a sign-in / sign-up CTA that **carries their invite code** into signup (auto-links them to that provider).
- **Why / problem it solves:** Transparency before forced signup — the client sees pricing + policies first, which builds trust and lowers signup friction. Requested by Danny 2026-07-08.
- **Who it serves:** Prospective pet-owner client (pre-account).
- **Guardrail alignment (important):** This is **single-provider**, invite-scoped — NOT cross-provider browsing/discovery. Consistent with **D-026** (connect via invite code/QR only; no directory, no search — you can only preview the provider whose code/link you already have) and **D-029** (no marketplace/broker). It is NOT "browse other PCSPs."
- **Refines D-011** (public landing + invite portal): the "public landing" is **per-provider**, invite-reachable, showing price/terms/house-rules, **no booking**.
- **Ties to:** invite/onboarding flow, D-011, D-026, D-029, D-030 (white-label branding — preview is skinned to the PCSP), website-vs-app architecture (D-001), F-010/F-011 (multi-provider hub / blocked-client routing).
- **Decisions (2026-07-08, Danny):**
  - **Gating:** the client must **enter the invite code first**, then gets a **"not yet" (just view)** option to preview the provider *before* being asked to sign up. Code entry precedes both preview and signup. → **reflect in onboarding flow when built.**
  - **Lives in-app — no provider web pages.** Model is **Venmo-style**: each PCSP has a **username / unique code + matching QR code**, shareable to a prospect **via text**. Recipient enters the code / scans the QR in the app to reach the preview.
  - **Presentation** is driven by the PCSP's **subscription package + branding theme** (tier decides what surfaces; theme decides the skin — ties D-020 + D-030).
  - **Pricing is always visible** to a code-holder — inline on the landing or via a **popup link** — for non-logged-in users who've entered the right code. **No hide-pricing toggle:** possessing the code (which the PCSP chose to share) entitles the viewer to see pricing.
  - **Related — rate card:** give PCSPs a **downloadable rate card** (a **PNG formatted for mobile**) to share with prospects outside the app.
- **Still to reconcile:**
  - **D-026 guardrail check:** a *given/forwarded* username or code is fine, but there must be **no searchable username/provider directory** — looking up arbitrary handles = discovery, which D-026/D-029 forbid. Confirm the handle is share-only, not lookup-able.
  - Text-share UX when the recipient doesn't have the app yet (deep link → app store → app, carrying the code).
  - Rate-card PNG: auto-generated from the PCSP's live pricing (stays in sync) vs. manual export?
  - What's shown stays scoped to: home/overview + pricing + T&C/house rules only — no booking, no other clients' data, no staff internals.
- **Status:** raw (refined 2026-07-08 with Danny's answers)
- **Logged:** 2026-07-08

### F-022 — Boilerplate T&C + Policies with auto name-fill
- **What:** Provide PCSPs with **boilerplate Terms & Conditions** and **Policies** templates they can adopt. Each carries a **disclaimer that they should have it reviewed by their own legal advisor/attorney.** Where needed, the templates **auto-insert the provider's "name" or "business name"** into the text.
- **Why / problem it solves:** Most small pet-care providers don't have legal docs. A solid starting point lowers setup friction and raises professionalism — while the disclaimer keeps PetAppro from appearing to give legal advice.
- **Who it serves:** Provider (PCSP) adopts/edits; pet-owner client reviews/agrees.
- **Ties to:** Provider onboarding/settings, legal/policies module, booking agreement/consent step, merge-field system (name/business auto-fill), F-021 (invite preview shows T&C/house rules), F-014-legal-cluster
- **Notes / open questions:**
  - Merge fields: business name, owner name, address, contact, service list, cancellation window — define the token set (reuse across F-021 preview and booking consent).
  - Fully editable by the PCSP vs. fill-in-the-blanks only? Version control when PetAppro updates the boilerplate.
  - Client acceptance: where/when the pet-owner agrees (signup, first booking, on change) and how consent + doc version is recorded (timestamp, version).
  - Separate docs for T&C vs. Policies vs. cancellation/refund policy — or one bundle?
  - Jurisdiction variance (CA vs. other states) — keep generic + disclaimer; don't attempt state-specific counsel.
  - **Guardrail:** PetAppro provides templates only, not legal advice — disclaimer must be prominent and acknowledged.
- **Status:** raw
- **Logged:** 2026-07-08

### F-023 — Shareable provider marketing card + QR (social acquisition)
- **What:** An auto-generated, on-brand shareable **card (image)** a provider posts to social (Nextdoor, Facebook, Instagram, etc.) carrying their **QR code + profile handle/link** so prospects can find and connect to them in-app. Modeled on how Rover sitters share a profile card/QR.
- **Why / problem it solves:** Closes the "we don't bring clients" gap (competitive-analysis §5) **without becoming a marketplace** — providers grow their *own* book, we stay booking-software. Two-sided word-of-mouth (their clients + prospects).
- **Who it serves:** Provider (shares) → prospective client (scans → invite preview F-021 → connect).
- **Ties to:** F-021 (rate card / invite preview, carries the code), F-011 (QR onboarding/hub), F-006 (social links), D-026 (share-only), D-029 (no marketplace), D-030 (branded); later `adobe-create-social-variations` for per-platform sizes.
- **Notes / open questions:** auto-generate from live profile (stays in sync); per-platform formats; QR deep-links (app store → app carrying code); **distinct from F-021's rate card** (that's pricing; this is a marketing/profile card). **Guardrail:** share-only handle/QR, **no searchable directory** (D-026/D-029).
- **Status:** exploring
- **Logged:** 2026-07-11 (Danny)

### F-024 — Provider profile "story" / bio
- **What:** A provider-profile section for an **authentic personal story/bio** (like Rover profile stories — e.g. "…since I was 6, dogs were my people… I'll love your pooch as much as you do"). Rich text + optional photo.
- **Why / problem it solves:** Trust + differentiation — pet parents choose providers on personality and story; humanizes the provider and the app. Complements portfolio (F-008) and reviews (F-009).
- **Who it serves:** Provider writes; pet-owner client reads (invite preview F-021 + profile).
- **Ties to:** Provider profile, F-021 (invite preview), F-008 (portfolio), D-047 (service content), subscription tiers (which tier surfaces it?).
- **Notes / open questions:** char limit + light formatting; moderation; where it renders (profile header, invite preview); which tier unlocks it (or all). Sample tone captured from Danny 2026-07-11.
- **Status:** exploring
- **Logged:** 2026-07-11 (Danny)

### F-025 — Retail / sponsor partnerships for acquisition
- **What:** Explore partnerships with pet retailers (Pet Food Express, PetSmart, Chewy, etc.) as an acquisition channel for providers.
- **Why / problem it solves:** A growth channel that keeps us **out of the marketplace** (co-marketing / referral / in-store QR), addressing the competitive §5 acquisition gap.
- **Who it serves:** Base509 BD (Danny) — GTM, not a build feature.
- **Ties to:** GTM/marketing, competitive-analysis §5, brand policy.
- **Notes / open questions:** exploratory; structure TBD (referral, co-brand, in-store QR/flyer, bundle offers). BD lane, not near-term build.
- **Status:** exploring (GTM)
- **Logged:** 2026-07-11 (Danny)

### F-026 — In-app "coming soon" roadmap preview
- **What (superseded):** A minimal in-app preview of near-term roadmap, originally proposed when GPS was expected after launch.
- **Why / problem it solves:** Signals momentum + manages expectations for features competitors already have (competitive §5); can gauge interest.
- **Who it serves:** Provider + client.
- **Ties to:** D-054, which superseded and eliminated this need.
- **Notes / open questions:** ~~keep tasteful/minimal — verify App Store rules on advertising unreleased features~~ — **moot.**
- **Status:** **dropped (Danny, 2026-07-14)** — we're not doing "coming soon" at all: GPS ships **at launch** (D-054), so there's no unreleased feature to preview, and nothing for Apple guideline **2.3 (accurate metadata)** to catch.
- **Logged:** 2026-07-11 (Danny)

### F-027 — Walk (timed-service) variants + duration pills
- **What:** Model walking (and any timed service) so the schedule/booking **pill shows the walk length at a glance** — `Walk 30m` · `Walk 1h` · `Walk 2h` · `Group Walk`. Length is an attribute of every walk booking, preset or custom, so the pill labels it either way.
- **Why / problem it solves:** Glanceable schedule (Danny's ask) **without boxing providers** into fixed PetAppro presets. Resolves the "menu vs. open-ended" tension — do both.
- **Model:**
  - Provider configures their **own menu of preset variants** (their durations, prices, labels) — the fast, clean default path.
  - Optionally allow a **custom duration** per booking (escape hatch); pill still reads the length.
  - **Group walk** = a variant flag (multi-dog, own price + capacity, ties F-014).
  - **Start time stays flexible** within availability (F-001/F-016) — duration = *what kind*, time = *when*; they're separate.
  - Duration drives **price (D-039), the no-show-fee window (timed-service model), and the schedule block.**
- **Who it serves:** Provider (configures) + client (books) + provider (glanceable schedule).
- **Ties to:** D-039 (per-variant rates), timed-service generic model, D-046/D-047 (service CMS/content), F-014 (group capacity), F-001/F-016 (availability), **DS service-pill component**.
- **Notes:** pill label auto-derives from duration/type; provider can rename. Suggest clean labels (no slashes) + a subtle color/icon to set Group apart (DS call).
- **Status:** exploring
- **Logged:** 2026-07-11 (Danny)

### F-028 — Client self-service booking edit/cancel (provider-gated window)
- **What:** Optional provider setting letting pet-owner clients **edit / change / cancel their own booking** up to a cutoff before it. Provider toggles it on; if on, sets a **policy window per service type** (days/hours before service start). When enabled, the client's booking card gets the **same bottom row (Cancel + edit)** as the provider's. **Past the window** both controls **gray out**, and tapping shows a "contact [provider] to change or cancel" message. The whole bottom row shares this one gate.
- **Why / problem it solves:** Client self-service convenience while the provider keeps control of the cutoff — less provider admin, matches expectations.
- **Who it serves:** Provider (configures) + client (self-serves).
- **Provider settings:** (a) toggle "allow clients to edit/cancel their own bookings"; (b) if on, **per-service-type cutoff** (days/hours before service start). Default **OFF**.
- **Rules:**
  - Client controls visible + active **only within the window**; grayed + "contact provider" message after.
  - **Provider always retains full edit/cancel** — their card is never gated.
  - Window measured from the **service start** (drop-off / start time), provider timezone.
- **Open questions (from PM review):**
  - **Edit vs cancel weight:** shared window (Danny's model) is fine for *timing*, but **cancel carries refunds** an edit doesn't. Unpaid booking → just voids; **paid booking cancel → refund/credit logic** (+ possible cancellation fee). Decide if cancellation refund policy is MVP or fast-follow.
  - **Edit re-prices + re-invoices:** an edit recomputes via D-039 and adjusts amount-due/invoice via **D-052** (credit note — never edit an issued invoice).
  - **Edit re-check:** date/scope changes should re-validate availability and may need re-approval (**F-004**); a plain cancel doesn't. Recurring: single-occurrence edits tie to **F-018**.
  - **Edit scope:** dates/times, add/remove pets — which fields are client-editable?
  - Self-edit policy should surface in the booking **T&C (F-022)**.
- **Ties to:** provider settings (D-041), F-004 (approval), F-018 (recurring), D-039 (re-price), D-052 (invoice adjustment), F-022 (T&C), DS booking-card bottom-row component.
- **Status:** exploring (well-specified by Danny)
- **Logged:** 2026-07-11 (Danny)
