# PetAppro Open Decisions Log

Unresolved Phase 0 product and architecture decisions for PetAppro.

**Related docs:** `docs/prompts/cursor_project_instructions.md`, `docs/planning/product_brief.md`, `docs/planning/user_roles_and_permissions.md`, `docs/roadmap/mvp_roadmap.md`

**How to use:** Spec writers and architects may proceed using **Working Default** values until a decision moves to **Decided**. Any change from a working default requires updating this log and affected specs.

---

## 1. Purpose

PetAppro has intentional unresolved questions that affect architecture, UX flows, permissions, and MVP scope. This log:

- Lists all known open decisions in one place
- Assigns a **working default** so planning can continue without blocking
- Records **when** each decision must be finalized
- Provides detailed context for the highest-impact decisions
- Defines Phase 0 exit criteria tied to decision readiness

When a decision is resolved, update its status to **Decided**, add the outcome and date, and create a short entry in a future `docs/decisions/decision_log.md` if needed for permanent audit.

---

## 2. Decision Status Definitions

| Status | Meaning |
|---|---|
| **Proposed** | Options identified; no working default adopted yet |
| **Working Default** | Temporary answer for specs and architecture drafts; not final stakeholder sign-off |
| **Decided** | Stakeholder-approved; specs and build must follow the recorded outcome |
| **Deferred** | Explicitly out of MVP scope; revisit after pilot or later phase |

---

## 3. Decision Table

| ID | Decision | Status | Working default | Why it matters | Phase needed by |
|---|---|---|---|---|---|
| D-001 | Launch platform: web-first vs native/Expo vs hybrid | **Decided** | **Native (Expo/React Native)** for client + staff. Thin Next.js web for marketing + provider subscription checkout. No consumer/staff web app at launch; internal web tools optional anytime on same backend, just not a launch priority | Repo structure, UX flows, deploy strategy, notification approach | Decided 2026-07-04 |
| D-002 | Can staff invite clients? | Working Default | No — owner/admin only | Permission model, invite-code UX, staff training | Phase 0 → 2 |
| D-003 | Same user as client **and** staff in one business? | Working Default | No — block dual assignment | Auth, booking conflicts, permission checks | Phase 0 → 1 |
| D-004 | Can clients belong to multiple businesses? | Working Default | Yes — separate client profile per business | Auth, business picker, onboarding | Phase 1 |
| D-005 | Pet profiles: business-scoped vs shared across businesses | Working Default | Business-scoped per client profile | Data model, storage paths, client UX | Phase 1 |
| D-006 | Meet-and-greet: global rule vs business/service configurable | Working Default | Configurable per business (on/off); required when enabled | Onboarding gates, booking eligibility | Phase 1 → 2 |
| D-007 | Payments: manual first vs Stripe Connect in MVP | **Decided** | **2026-07-08 (Option A): ship WITH in-app client→provider payments (Stripe Connect) in MVP.** Launch date flexes a few weeks to include it (D-023, ~late Oct). Manual tracking = safety-net fallback only if payments derail near the store deadline. SaaS Stripe **Billing** (MKT-6) always in. **Un-holds the pricing engine (critical path). Deposits stay OUT (D-015 — no deposits, Danny 2026-07-08).** See current-decision block in the detailed record | Build scope, timeline, pricing/deposits/checkout | Decided 2026-07-08 |
| D-008 | SMS alerts: MVP vs post-MVP add-on | Working Default | Post-MVP add-on; in-app notifications in MVP | Notification infra, cost, urgency handling | Phase 4 |
| D-009 | Terms/policies: template-based vs fully editable | Working Default | Template-based with editable sections | Business setup complexity, legal review | Phase 2 → 4 |
| D-010 | Multi-location support in MVP | Deferred | Deferred — single location per business | Data model, schedule, pricing, staff assignment | Phase 1 (document only) |
| D-011 | Public landing page vs invite-only client portal | Working Default | Both — public landing + invite-required client portal | Client acquisition, onboarding UX | Phase 0 → 2 |
| D-012 | Client of Business A and staff of Business B (different businesses) | Working Default | Yes — with business context switching | Multi-tenant auth, session context | Phase 1 |
| D-013 | Invite codes: single-use vs reusable | Proposed | Reusable until revoked; optional max uses TBD | Onboarding ops, security | Phase 2 |
| D-014 | Invite codes: expiration | Proposed | Optional expiration; owner sets or never expires | Security vs convenience | Phase 2 |
| D-015 | Deposits at MVP | **Decided** | **No deposits** — full booking total (charged at confirmation via Connect). Unchanged even with Connect in MVP (Danny, 2026-07-08); revisit only if customers ask for it | Payments spec, pricing engine | Decided 2026-07-08 |
| D-016 | Staff can block/unblock clients | Working Default | No — owner/admin only | Permission matrix, abuse prevention | Phase 0 → 2 |
| D-017 | Staff can confirm manual payments | Working Default | No — owner/admin only | Financial integrity | Phase 4 |
| D-018 | Staff can override booking prices | Working Default | Yes — with audit trail | Operations flexibility vs control | Phase 4 |
| D-019 | Admin role required at MVP | Working Default | Optional — owner-only businesses OK | Role model, small business UX | Phase 0 |
| D-020 | First SaaS pricing and launch add-ons | Proposed | TBD — document after design partner confirmed | GTM, scope for Stripe/SMS | Phase 0 → 5 |
| D-021 | First test tenant + beta testers + target launch date | **Decided (structure)** | **First test tenant = Danny + Marco's own business** (the MVP-complete freeze bar, D-028). **Beta testers = 5–6 PCSPs** recruited via local Facebook group + Danny's network (post-freeze validation). Launch target Oct 1 (D-023). Specific PCSP names still TBD | Prioritization, success criteria, freeze bar | Decided 2026-07-07 (names TBD) |
| D-022 | Service catalog in MVP (which service types ship) | **Decided** | **MVP ships boarding + daycare + dog walking.** D-054 subsequently makes live GPS tracking a hard launch gate for walking (Crew+ entitlement). Schema/service APIs remain generic instances over engine axes; sitting/training/hair/massage and provider-defined types must not require a rewrite. Walking adds per-session/duration pricing, time-of-day scheduling (F-001), recurring walks, and group concurrency/capacity | Build scope; pulls capacity engine into MVP | Decided 2026-07-07; GPS superseded by D-054 |
| D-023 | Delivery approach: deadline-driven vs gate-driven | **Decided** | **Hybrid** — gates on the foundation, flex scope; ~Aug 15 go/no-go (see detailed record). **Update 2026-07-08:** to keep in-app payments in MVP (D-007 Option A), the launch **date now flexes** — target moves from Oct 1 toward **~late October** (payments are allowed to move the date). Store-clock items (D-U-N-S→accounts→submit→review buffer) still gate the outer bound | Whether Sprint 1 starts now; how slippage is absorbed; launch date | Phase 0 (now) |
| D-024 | PetAppro-side support / break-glass role (incl. outsourced help/eng) | Proposed | Platform role with least-privilege: financial + PII redacted, access logged, time-boxed, tenant-consented | Trust/security; the only sanctioned cross-tenant access | Schema-aware in Phase 1; build post-MVP |
| D-025 | Multi-currency (provider prices in own currency) | Proposed | Per-business `currency`; money stored as minor units; tax (GST/VAT) + subscription currency deferred | International providers; pricing engine; billing | Schema in Phase 1; tax later |
| D-026 | How customers connect to a provider | Proposed | Invite code + QR only; **never** search-by-business-name | Client onboarding UX; privacy (no provider directory) | Phase 2 invite spec |
| D-027 | Primary JTBD anchor for design research | **Decided** | **Owner/PCSP is the primary JTBD anchor** (buyer + operator); client + staff are first-class supporting jobs that rise to primary within their own flows. Anchor governs prioritization, not attention | Research framing, archetype priority, flow ownership, trade-off calls near Oct 1 | Decided 2026-07-06 |
| D-028 | MVP-complete / feature-freeze definition | **Decided** | **Danny + Marco's own business runs a genuine booking end-to-end (onboarding → booking → server-validated pricing → staff schedule → history/notifications) on physical iOS *and* Android, tenant isolation verified, with a REAL PAID BOOKING via Stripe Connect** (updated 2026-07-08 per D-007 Option A; manual tracking only if payments derail). When true, features freeze; only bug-fix/polish/store-prep after. Own business is the freeze bar; PCSP beta is the next milestone | Defines "done" for the build; governs scope cuts near launch | Decided 2026-07-07 (freeze bar updated 2026-07-08) |
| D-029 | Platform stance: booking software, never a marketplace/broker | **Decided** | **PetAppro is booking software the PCSP runs — it never intermediates the PCSP↔client relationship.** No provider directory/discovery (aligns D-026), no lead-gen marketplace, **no take-rate/commission on client→provider payments** (aligns D-007), no platform-set or platform-guaranteed pricing, never holds the client relationship. Revenue = PCSP subscription only (Stripe Billing, D-001). Community-building (social accounts, in-person events to connect PCSPs) is allowed; brokering their money/service exchange is not | Core differentiator vs Wag/Rover; legal/positioning guardrail (software vendor, not agency/broker/marketplace/employer); app-store classification; forecloses commission monetization | Decided 2026-07-07 |
| D-030 | White-label model + Enterprise isolation tier | **Decided** | **Product = pseudo white-label**: one shared app + one shared DB (RLS), runtime per-tenant theming; provider resolved by invite code / QR / deep link (D-026); one federated client identity + account switcher (D-004). **True white-label = bespoke Enterprise**: separate app + separate DB + separate deployment, fully isolated, higher setup + recurring, custom-contracted, **post-MVP**. Cold open is the only PetAppro-branded surface | Full white-label ("opens already branded") is impossible in one multi-tenant app at cold open; tiering resolves it and protects launch scope (D-023); vindicates DS per-tenant theming; aligns D-004/D-011/D-026/D-029 | Decided 2026-07-07 |
| D-031 | Login security / step-up MFA (payments + PII) | **Decided** | **Risk-based step-up auth, not blanket 2FA every login**: biometric app lock (Face ID/Touch ID/Android); TOTP MFA for email/password; social sign-in (Apple/Google) as a baseline factor; **re-auth/step-up is required for every personal-information change** (email, phone, password, etc.) and sensitive money actions (payment method, provider financials/payouts/refunds); **mandatory MFA applies to Owner/Admin only**. Driver = account takeover (off-session charges + PII), not card storage (Stripe vaults cards; we never store them) | Protects money-moving actions + PII; shapes Supabase Auth config + RBAC | Decided 2026-07-14 |
| D-034 | Base509 master / per-app operational isolation | **Decided** | Thin Base509 master layer for account, product entitlement, SaaS billing, operator audit/support; PetAppro operational data remains isolated and tenant-scoped by `business_id`; no per-row `app_id` in PetAppro tables | Prevents cross-product coupling and RLS complexity while preserving future multi-product seam | Phase 1 architecture |
| D-035 | Stable Base509 account id | **Decided** | App relationships reference `base509_account_id`, not raw `auth.uid()`; Supabase Auth subjects are mapped through an identity table/helper | Makes later central identity extraction mechanical and keeps RLS from binding to provider-specific auth ids | Before migrations |
| D-036 | Auth path for MVP | **Decided** | PetAppro uses Supabase Auth in the PetAppro project for MVP; central IdP/external IdP deferred until app #2 or cross-product SSO is concrete | Avoids IdP migration/build risk before Oct 1 while preserving a clean seam | Phase 1 auth model |
| D-037 | Shared account-service boundary | **Decided** | Shared Base509 layer stores account identity and Base509 billing relationship only; app-specific provider/client records stay in each app operational DB | Avoids a coupled mega-DB and keeps provider/client concepts app-contextual | Phase 1 architecture |
| D-038 | Passwordless-first and step-up implementation | **Decided** | Apple/Google/magic-link primary, password fallback; owner/admin MFA before sensitive provider actions; biometric app lock is local protection, not server-side auth replacement | Protects money/PII without blanket login friction; clarifies Supabase/Auth/RLS responsibilities | Before payments/billing-sensitive flows |
| D-039 | Pricing model: explicit rates, not % surcharges | **Decided** | **Providers set explicit dollar rates** for every condition — holiday/peak/weekend/extended are separate **rate tiers (rate overrides)**, not % markups; extra-dog/puppy/etc. are **flat**. Ship **Woof default holidays**, provider-editable (calendar picker + reset-to-defaults); extended = length threshold. **% only for tax + discount codes.** **No card surcharge** (multi-state compliance/CA SB-478/network rules; set inclusive rates). Provider-toggle **referral bonus** = one free/credited booking (per Woof; booking-level, ≠ D-020 SaaS referral) | Revise `packages/pricing` + spec off the %-model; provider pricing-settings UX | Decided 2026-07-09 |
| D-040 | Default theme = Brandy Blue (base brand) + theming tiers | **Decided** | **Brandy Blue** (PetAppro base brand; dog-named palette Brandy Blue/Camo/Coco/Bella/Maverick, Poppins) = **default** theme AND **entry-tier** theme. **Supersedes the prior locked "Tier 1 = Sage & Sand" default** (→ alternate). **Custom/alternate themes = higher-tier white-label perk** (D-020 tiers + D-030). DS lane owns tokens/theming-and-tiers; Codex review pending | Brand identity; subscription tiers; white-label; DS specs | Decided 2026-07-09 |

---

## 4. Detailed Decision Records

### D-001 — Web-first vs native/Expo launch

**Status:** Decided (2026-07-04)

**Question:** Should PetAppro MVP launch as a web app, a native (Expo/React Native) app, or a hybrid (web admin + native client/staff)?

**Options:**

| Option | Pros | Cons |
|---|---|---|
| **Web-first (responsive)** | Fastest path; one codebase; matches Woof Wetreats reference; easier iteration | Push notifications on mobile web are limited; app-store presence absent |
| **Native/Expo-first (chosen)** | Better mobile UX and push; staff/clients often on phones; app-store presence | More deploy complexity; must set up EAS + store accounts |
| **Hybrid** | Optimized per audience | Highest cost; coordination across codebases |

**Decision:** **Native (Expo/React Native)** for both the client and staff experiences — this is the core project goal ("deployed as native apps for iOS and Android"). **All staff functionality lives in the native staff side; there is no separate web client or web staff app at MVP.**

**Web scope (deliberately minimal):** a thin **Next.js** site remains for (1) the **marketing site** and (2) **selling the provider SaaS subscription** via Stripe Billing — the latter is required because Apple's rules bar selling that subscription inside the iOS app. This is a marketing + checkout surface, **not** a product web app.

**Not a launch priority (but not blocked):** internal/admin **web tools that read from / write to the Supabase database** (reporting, bulk ops) can be built **anytime** on the same backend and RBAC — they extend the **staff side**, not a separate product. Simply not scheduled ahead of the Oct 1 native launch; build when useful.

**Why it matters:** Drives repo layout (`apps/mobile` Expo + `apps/web` Next.js marketing/billing), notification strategy (native push, D-008), EAS/store setup, and Phase 2 UX assumptions (design mobile-native, not responsive-web).

**Consistency:** aligns the decision log with the strategy, roadmap, tooling, and `CLAUDE.md`/`AGENTS.md`, which already assume native/Expo. Resolves the dependency flag noted in D-023.

**Entity note (Decided 2026-07-04):** the legal entity is **Base509 LLC** (sole owner: Danny); **PetAppro is a product/brand + IP owned by Base509 LLC**, not its own company. All accounts (D-U-N-S, Apple/Google developer, bank, Stripe) are under Base509 LLC; the app publishes as "PetAppro." Optional DBA "Base509 LLC dba PetAppro" if publicly transacting as PetAppro. See `docs/planning/Base509-LLC-Formation-Guide-CA.md`.

---

### D-002 — Whether staff can invite clients

**Status:** Working Default

**Question:** Can staff role generate or share client invite codes, or is that owner/admin only?

**Options:**

- **Owner/admin only** — tighter access control; owner controls client roster growth
- **Staff allowed** — faster onboarding in the field; needs audit trail

**Working default:** **Owner/admin only.** Staff can ask owner/admin to generate codes.

**Why it matters:** Permission matrix, invite-code spec, and potential abuse if staff can add clients without oversight.

**Phase needed by:** Phase 0 → **Decided** before invite-code UX spec (Phase 2).

**Aligns with:** `user_roles_and_permissions.md` matrix footnote.

---

### D-003 — Same user as client and staff in one business

**Status:** Working Default

**Question:** Can one authenticated user hold both a staff membership and a client profile for the **same** `business_id`?

**Options:**

- **Block dual assignment** — simpler permissions; no self-booking confusion
- **Allow with context switching** — flexible for owner-operators who also use services
- **Allow staff only, no client self-booking** — hybrid compromise

**Working default:** **Block dual assignment at MVP.** Owner-operators use staff/owner tools, not client self-booking, for their own household.

**Why it matters:** Booking eligibility, meet-and-greet gates, and permission checks on every request.

**Phase needed by:** Phase 0 → **Decided** before Phase 1 auth/membership model.

---

### D-004 — Whether clients can belong to multiple businesses

**Status:** Working Default

**Question:** Can one auth user be a client of Business A and Business B (different businesses)?

**Options:**

- **Yes, separate client profiles** — realistic for pet owners using multiple sitters
- **No, one business per user** — simpler; poor fit for multi-business clients

**Working default:** **Yes.** One auth account, **separate client profile per business**, with business context picker after login.

**Why it matters:** Auth model, dashboard routing, notifications, and activity history scoping.

**Phase needed by:** Phase 1 architecture.

**Note:** Distinct from D-003 (same business). D-012 covers client-at-A + staff-at-B.

---

### D-005 — Pet profiles: business-scoped vs shared

**Status:** Working Default

**Question:** If the same person is a client at two businesses, do pet records sync or stay separate?

**Options:**

- **Business-scoped** — each business has its own pet record (photos, notes, vet info)
- **Shared pet identity** — user maintains pets once; businesses see linked copy or shared record
- **Shared with business overlays** — shared base + business-specific care notes

**Working default:** **Business-scoped.** Each client profile owns pets for that business only. Re-entry required at second business.

**Why it matters:** Data model (`pets.business_id`), storage paths, RLS, and client onboarding UX.

**Phase needed by:** Phase 1 data model draft.

**Revisit after pilot:** Shared pet identity reduces friction for multi-business clients (Section 6).

---

### D-006 — Meet-and-greet: global vs configurable

**Status:** Working Default

**Question:** Is meet-and-greet required for all businesses, or configurable per business (and optionally per service)?

**Options:**

- **Always required** — matches many boarding operators; simple gate
- **Configurable per business** — off for trusted repeat-only shops
- **Configurable per service** — e.g., required for boarding, optional for daycare

**Working default:** **Configurable per business (on/off).** When enabled, client must complete meet-and-greet before first booking. Per-service rules deferred.

**Why it matters:** Onboarding steps, booking eligibility, staff meet-and-greet management.

**Phase needed by:** Phase 1 → 2 flows.

**Reference:** Woof Wetreats uses meet-and-greet heavily; design partner may want it on by default.

---

### D-007 — Manual payments first vs Stripe Connect in MVP

**Status:** Decided (2026-07-08) — **payments IN the MVP (Option A).** Supersedes the 2026-07-07 "manual-only / MVP-if-feasible" language below.

**CURRENT DECISION (2026-07-08, Danny — supersedes all prior D-007 language):** **Ship PetAppro WITH in-app client→provider payments (Stripe Connect) in the MVP (Option A).** Danny chose to include payments even at the cost of flexing the launch date a few weeks (→ D-023; realistic target ~late October). **Manual tracking remains only as a safety-net fallback if payments genuinely derail near the store deadline** — it is no longer the *planned* MVP path. Consequences: the **pricing engine is un-held and on the critical path** (automated charging requires correct totals); **deposits stay OUT (D-015 — no deposits, Danny 2026-07-08; revisit only on customer feedback)**; the MVP-complete freeze bar (**D-028**) becomes a *real paid booking via Connect*. Still applies only to client→provider booking payments; SaaS Billing (provider→Base509) was always in.

**Question:** Does MVP include Stripe Connect, or only manual payment status tracking?

**Options:**

| Option | Pros | Cons |
|---|---|---|
| **Manual only (chosen)** | Faster; no Connect onboarding; fits cash/Venmo-heavy operators | No online client→provider pay in product at launch |
| **Stripe Connect in MVP** | Complete payment story; client pay links | Compliance, setup friction, timeline risk |
| **Manual MVP + Connect fast-follow** | Balanced | Two payment releases to maintain |

**Decision:** **Manual payment tracking is the sole MVP payment path** (cash, check, Venmo, Zelle, other + staff confirmation). **Stripe Connect is deferred to post-MVP** — Danny confirmed it is a *nice-to-have, not launch-critical*. Connect becomes the first post-freeze payment add.

**Important scope boundary:** This applies only to **client → provider** booking payments (Connect). It does **not** touch **SaaS subscription billing** (provider → Base509) via **Stripe Billing on the web** (D-001, MKT-6), which stays in scope — that is how PetAppro earns revenue at launch and must not be cut.

**Why it matters:** Owner setup flow, payments spec, booking confirmation UX, Phase 5 milestone order. Removing Connect from the MVP slice de-risks the Oct 1 date (D-023 scope flex).

**Where reflected:** `mvp_roadmap.md` (MVP Scope Reference — moved to *Defer beyond MVP*; Phase 4 payment spec; Phase 6 milestone 7), annex `PetAppro-Roadmap-and-Project-Plan.md` (Sprint 4, milestones, backlog → post-launch), and the MVP-complete freeze bar (D-028).

**Revision (2026-07-07 pm) — Stripe is MVP-if-feasible:** Danny softened the hard defer: **include Stripe Connect in MVP if it fits the Oct 1 store clock; otherwise ship it as the first post-MVP release.** **Manual payment tracking stays as the guaranteed fallback so payments never block launch.** Codex + Claude Code assess feasibility against D-023 at the ~Jul 18 / ~Aug 15 checkpoints. Consequence: the Stripe checkout + tip flows designed in discovery (charge-at-confirmation, tip-as-separate-charge, Payment Element, off-session capture) are **MVP-candidate**, not purely post-MVP artifacts — but only ship if the date holds. Still applies only to **client→provider** booking payments; SaaS Billing (D-001) is separate and always in.

---

### D-008 — SMS alerts in MVP vs post-MVP add-on

**Status:** Working Default

**Question:** Should SMS urgent alerts ship in MVP or as a paid add-on after in-app notifications work?

**Options:**

- **In-app only at MVP** — aligns with notification plan; email for paper trail
- **SMS for owner/staff in MVP** — matches Woof Wetreats urgency patterns via Pushover equivalent
- **SMS as optional add-on at launch** — revenue line; more infra

**Working default:** **In-app notification center in MVP.** **SMS deferred** to post-MVP add-on. Email for receipts, confirmations, and policy records only.

**Why it matters:** Notification architecture, cost, Twilio/provider integration, web push limitations (ties to D-001).

**Phase needed by:** Phase 4 notifications spec.

---

### D-009 — Terms/policies: template-based vs fully editable

**Status:** Working Default

**Question:** How do businesses define client-facing terms, cancellation policy, and house rules?

**Options:**

- **Fully editable free text** — maximum flexibility; legal risk; harder to render consistently
- **Template-based with editable sections** — structured fields + optional custom paragraphs
- **Upload PDF/HTML** — business supplies document; harder to stamp versions at booking

**Working default:** **Template-based with editable sections** (cancellation, hours, liability acknowledgment, etc.) plus business name/branding. Version published by owner/admin; stamped on booking.

**Why it matters:** Business setup UX, legal review, booking/meet-and-greet acceptance flows.

**Phase needed by:** Phase 2 → 4 specs.

---

### D-023 — Delivery approach: deadline-driven vs gate-driven

**Status:** Decided (2026-07-04)

**Question:** Do we run to the Oct 1 launch date (deadline-driven) or finish each roadmap phase's exit criteria before the next (gate-driven)?

**Options:**

| Option | Pros | Cons |
|---|---|---|
| **A — Deadline-driven** | Hits Oct 1; market timing | Tempts corner-cutting on money/security code |
| **B — Gate-driven** | Highest quality; clean phase exits | Oct 1 likely slips to late Oct/Nov; planning can expand indefinitely |
| **C — Hybrid (chosen)** | Fixed quality floor + flexible scope; protects both the foundation and the date | Requires discipline to actually cut scope when behind |

**Decision:** **Hybrid.** Fix *time and quality*, flex *scope*.
- **Gate-driven on the foundation (non-negotiable exit criteria):** multi-tenant boundary + `business_id`, RBAC/RLS, the single shared pricing package, and its regression tests. No shortcuts here to save time.
- **Deadline-driven on everything above the foundation:** features are the shock absorber. If behind, cut from the de-scope order (QuickBooks → advanced reports → SMS → white-label polish → 2nd industry template). Never cut the foundation to hit the date.

**Pivot rule & checkpoints (re-decide at each; speed up if ahead, cut scope if behind):**
1. **~Jul 18 (end Sprint 1):** pricing package extracted, tested, CI green? Behind → start cutting scope now, don't wait.
2. **~Aug 15 — GO/NO-GO for Oct 1:** tenant schema + RBAC/RLS done *and* D-U-N-S in hand? If not both green, either cut hard or consciously move the launch date (deliberately, not in panic).
3. **~Sep 1:** beta build working on a real device? Yes → submit by ~Sep 10. No → store clock forces the decision.

**Hard constraint:** the **~Sept 10 app-store submission window** is the one point that cannot flex. Before it, pivoting is a controlled choice; after it, a slip is forced. See `docs/roadmap/mvp_roadmap.md` → "Launch Timeline & Store Clock."

**Dependency flag — reconcile D-001:** this decision assumes the **native (Expo/React Native)** direction from the strategy and tooling docs and the original project goal ("deployed as native apps for iOS and Android"). The current **D-001 working default is "web-first, defer native," which now conflicts.** D-001 should be re-confirmed as **Decided: native/Expo (with Next.js retained for the marketing + provider billing portal)** before Phase 1 architecture, or this delivery plan's store-clock/timeline assumptions change.

---

### D-010 — Multi-location support in MVP

**Status:** Deferred

**Question:** Should one business support multiple physical locations in MVP?

**Options:**

- **Single location per business** — matches small operators and Woof Wetreats scale
- **Multi-location** — locations table, schedule by site, staff assignment by site

**Working default:** **Deferred.** MVP assumes **one implicit location per business**. No location picker in UI or schema requirement beyond optional future field.

**Why it matters:** Data model complexity, schedule views, pricing, and staff permissions.

**Phase needed by:** Document as deferred in Phase 1; revisit after first pilot (Section 6).

---

### D-020 — First SaaS pricing, tiers, and launch add-ons

**Status:** Proposed (billing build is deferred — gated on D-021 first test tenant / beta; needed by Phase 5). Captured requirements so nothing is lost:

- **Tier ladder — seat-based, feature-bundled (working model, 2026-07-11; full matrix in `docs/planning/pricing-tiers-and-features.md`):**
  - **T0 · Starter** — free-forever, **≤5 clients**, 1 user, no support, no in-app payments, default theme; **own name/logo shows** (all tiers get their brand) but carries the **"Powered by PetAppro"** mark (WOM/funnel; DECIDED).
  - **T1 · Solo** — 1 user, lowest paid; core ops + manual payment tracking; Brandy Blue + Husky + Irish Setter; **unlimited clients** (the cap lifts — Solo's headline value). Own name/logo; **still carries "Powered by PetAppro"** (co-branding removal is Crew+, Danny 2026-08-01).
  - **T2 · Duo** — 1–2 users; **+ in-app payments (Stripe Connect) + tips + all breed themes** (adds Bichon Frise, Blue Heeler, Chessie). Still carries "Powered by PetAppro."
  - **T3 · Crew** — 1–5 users; + **GPS at launch (D-054)** + all city and seasonal themes + **removes "Powered by PetAppro" co-branding**.
  - **T4 · Team** — 5–20 users; same full theme library + GPS + no co-branding; in-app messaging post-MVP + SMS opt-in (top-tier only per D-049, post-MVP).
  - **Enterprise** — 20+ users; fully custom/own-brand theme and isolated white-label deployment (D-030); contact-us pricing.
  - **Free trial** (~1–4 weeks) on paid tiers. First/creating user defaults to `owner` (all-access incl. financials).
  - **No client caps on paid tiers (DECIDED 2026-07-11)** — only Starter is capped (5). Monetize on **seats + features + best-in-class UX**, not metered usage (reads flat-and-fair vs per-staff rivals; matches flat-unlimited market norm).
  - **Draft pricing (PLACEHOLDER — validate at D-021 beta, not final):** Solo $19 · Duo $39 · Crew $79 · Team $149 (monthly); annual ~2 months free; Starter free; Enterprise custom. Benchmarks: Time To Pet ($25–50 + $16/staff), Scout ($33 + $15/staff), Precise ($20/$45/$90), PetPocketbook ($25 flat), Paw Partner ($99.99 flat).
- **Adding users:** when the owner adds a 2nd user/staff, onboarding **prompts for permission level** and shows a **chart explaining the levels** (from `user_roles_and_permissions.md` §10), plus a **disclaimer that `admin` can see business financial data**.
- **Billing period:** offer **monthly vs annual** per tier.
- **Upgrades:** allow **plan upgrade after purchase, pro-rated**.
- **Promotions:** e.g. **referral bonus** — bonus granted after a referred new client pays X months / an annual plan; **bonus reverses if they pay then cancel/refund**. Design with fraud mitigation in mind (self-referral, churn-and-return, chargebacks).
- **Rail:** all subscription billing is **Stripe Billing on the web** (D-001), never iOS IAP. SMS is positioned as a paid add-on / top-tier feature (D-008).

**Why it matters:** GTM, seat model, web checkout scope. **Do not build yet** — record here; spec in Phase 5 once D-021 is set.

---

### D-024 — PetAppro support / break-glass role

**Status:** Proposed (schema-aware now; build post-MVP).

A platform-side role so PetAppro (or outsourced help/engineering) can assist a provider. It deliberately crosses the tenant wall, so it is the **only** sanctioned exception to "no cross-tenant access" and must stay narrow:

- Least-privilege by default; **financial + PII fields redacted**.
- Every access **logged and audited** (`platform_access_log`), **time-boxed**, and **ideally tenant-consented** (break-glass).
- Schema assumes it exists now so it isn't retrofitted insecurely.

**Why it matters:** Support/trust vs. the strict tenant boundary; extra care if help is outsourced.

---

### D-025 — Multi-currency

**Status:** Proposed (schema in Phase 1; tax later).

Providers may operate in different countries. Money is stored as **integer minor units + a per-business `currency`**, so a provider prices bookings in their own currency (USD/CAD/EUR/AUD/…). **Deferred:** tax handling (GST/VAT) and the currency of our own SaaS subscription — both are later GTM items the schema won't block.

**Why it matters:** International expansion; pricing engine correctness; billing.

---

### D-026 — How customers connect to a provider

**Status:** Proposed (Phase 2 invite spec).

Customers **never browse a directory** of providers. They connect only via a provider-issued **invite code** or **QR code** (a QR is just that code, scannable). **Search-by-business-name is intentionally never offered.** The in-app picker shows only providers the user is already connected to.

**Why it matters:** Onboarding UX and privacy — no discoverable list of any provider's clients or of providers themselves.

---

### D-028 — MVP-complete / feature-freeze definition

**Status:** Decided (2026-07-07)

**Question:** What single, unambiguous event means "the MVP is built" and feature development should stop?

**Decision:**

> **MVP Complete = Danny + Marco's own business runs a genuine booking end-to-end** — client onboarding → booking → server-validated pricing → staff schedule → history/notifications — **on physical iOS *and* Android builds, with tenant isolation verified, and a REAL PAID BOOKING via Stripe Connect** (updated 2026-07-08 per D-007 Option A — payments are now in the MVP; manual tracking is only the safety-net fallback if payments derail).

When this is true, **features freeze.** Everything after is bug-fixing, polish, accessibility, and store prep — no new features without an explicit scope decision.

**Why the *own business* is the freeze bar (not a recruited customer):** using Danny + Marco's own business as the **first test tenant** removes a recruiting dependency from the freeze line while still forcing every core system to be real at once — tenant schema + RLS, RBAC, business setup, onboarding, and the booking + pricing engine — on real devices rather than a simulator. A seeded throwaway tenant could pass while hiding gaps; a real operating business cannot.

**Relationship to beta testers:** the **5–6 PCSPs** Danny recruits (local Facebook group + broader network) are **beta testers**, the validation milestone *after* the freeze (TestFlight/closed track) — not part of the freeze bar. Store submission runs in parallel on the Launch Readiness track. (See D-021.)

**Terminology note:** "design partner" is retired for the freeze/test-tenant context — the own business is the **test tenant**; recruited operators are **PCSP beta testers**.

**Why it matters:** Gives the build a crisp definition of done, maps to Phase 6 exit criteria, and sets the line that scope cuts (D-023) protect toward Oct 1.

---

### D-029 — Booking software, never a marketplace/broker

**Status:** Decided (2026-07-07)

**Decision:** PetAppro is **booking software the PCSP operates** — it never inserts itself into the PCSP↔client relationship. Concretely, PetAppro does **not**:

- run a **provider directory or discovery/search** surface (reinforces D-026: connect by invite code/QR only);
- act as a **lead-gen marketplace** that finds clients for providers;
- take a **commission/take-rate** on client→provider payments (reinforces D-007: subscription-only revenue via Stripe Billing, D-001);
- **set or guarantee** provider pricing or the service itself;
- **own or hold** the client relationship — the PCSP does.

**What is allowed:** community-building that *connects PCSPs to each other* — PetAppro-run social accounts, and potentially in-person/social events — as long as PetAppro never brokers, intermediates, or gets between any provider↔client exchange of money or services.

**Why it matters:** This is the **core differentiator vs. Wag and Rover.** Those platforms insert themselves as the marketplace, own the client, and take a cut — precisely what PCSPs are fed up with. Staying "just the software" is both the wedge and a legal/positioning guardrail: PetAppro is a **software vendor, not an agency, broker, marketplace, or employer.** It also shapes app-store classification and deliberately forecloses commission-based monetization.

**Guardrail test (apply to any future feature):** if a feature would make PetAppro the party that *finds the client, sets the price, holds the money, or guarantees the service*, it violates D-029. Tooling and community that help providers do those things themselves are fine; PetAppro doing them is not.

**Relationship framework:** formalizes the three-party model — PetAppro↔PCSP (vendor↔customer, sole revenue), PCSP↔client (the real-world care+payment relationship the PCSP owns), PetAppro↔client (thin: app access, no money, no brokering).

---

### D-030 — White-label model & Enterprise isolation tier

**Status:** Decided (2026-07-07)

**Question:** How does PetAppro deliver "white-label" across many providers when a single multi-tenant app can't open pre-branded to a provider it hasn't identified yet?

**Decision:**

- **The product ships pseudo white-label only.** One shared PetAppro app (single App Store / Play listing), one shared multi-tenant database (RLS-isolated), with **runtime per-tenant theming** — logo, colors, business name applied in-app once the provider is known. Provider identity is carried by the **entry point** (invite code / QR / deep link, per D-026), so the app resolves to one provider and themes to them. A **cold open** with no link is the *only* PetAppro-branded surface → it prompts for the provider's code/QR (never a directory). One **federated client identity**; an **account switcher** across the providers a client is already connected to (aligns D-004, D-026).
- **True white-label = a bespoke Enterprise engagement, post-MVP.** "Never see PetAppro" (own store listing, own app icon, own everything) requires a **separate binary** — so it is offered only as a **custom-contracted build** with its **own database + deployment + app**, fully isolated. Priced as premium: **higher setup fee + higher recurring.** Not self-serve, not a productized tier; built only when a customer pays for it. Because it is physically isolated, its identity is its **own silo**.
- **Browse vs. connect (reconciles George's browse path with D-026):** a provider's **invite code unlocks the read-only preview** (business profile, services, rate estimates, general availability, service area, policies, "Accepting New Clients" status) — you can view without an *account*, but **not without a *code*** (reinforces D-026 — nothing is publicly viewable). Flow: **enter code → Welcome / preview** → **"not yet — keep viewing"** or **sign up** when ready. A raw link/QR may pre-fill the code but still routes through code validation before the preview; no calendar or client data exposed.

**Dual-client consequence (the case that forced this):**
- Client of **two Standard providers** → one app, one login, switch between them.
- Client of **one Enterprise + one Standard** → **two apps, two accounts** — the Enterprise DB is isolated, so its identity can't (and shouldn't) federate. Expected and acceptable at that tier; the Enterprise fee covers the isolation.

**Guardrail (D-029/D-026):** "select provider" in the shared app is an **account switcher among already-connected providers only** — never a discovery directory. Full-white-label polish stays in the D-023 de-scope order (cuttable to hold Oct 1).

**Why it matters:** Resolves the cold-open branding impossibility; keeps separate-binary builds out of the MVP (protects the Oct 1 date, D-023); confirms the design-system's per-tenant theming as the mechanism for pseudo-WL; aligns D-004 (multi-business), D-011 (landing + portal), D-026 (no directory), D-029 (no marketplace).

---

### D-031 — Login security / step-up MFA

**Status:** **Decided (Danny, 2026-07-14).** Passwordless-first was locked 2026-07-08; the final lock adds re-auth for every personal-information change and limits mandatory MFA to Owner/Admin.

**Question:** Given the app can move money and holds PII, what extra login security do we require — and how much friction?

**Framing (important):** because payments run through **Stripe** (Payment Element + Stripe's vault), **we never store or see card numbers — PCI stays with Stripe.** So the driver is **not** card data in our DB; it's **account takeover** — a compromised account can trigger **off-session charges/tips** on a saved (tokenized) card, read **PII + booking history**, and on the provider side see **financials/payouts**.

**Decision:**

- **Risk-based step-up auth, not blanket 2FA on every login** (avoids mobile friction on everyday booking).
- **Biometric app lock** (Face ID / Touch ID / Android biometric) as the mobile-native second factor.
- **TOTP MFA** for email/password accounts (Supabase Auth supports it); **social sign-in (Apple/Google)** counts as a baseline factor (carries the IdP's own MFA).
- **Passwordless-first (Decided — Danny, 2026-07-08):** strongly prefer/offer **Apple, Google, and magic-link** sign-in; email+password only as a fallback where needed. Better mobile UX *and* de-risks the future central-identity migration (no password-hash portability problem — see `docs/planning/base509-operator-admin-console.md`).
- **Re-auth/step-up required for every personal-information change:** email, phone, password, recovery factors, and any equivalent account/profile identity field. It is also required for sensitive money actions: add/change payment method and provider financials/payouts/refunds. The server must verify recent authentication; a client-only modal is not enforcement.
- **Providers > clients:** **mandatory MFA applies to Owner/Admin only** (touch money + client PII). Manager, Staff, and Client remain risk-based/step-up rather than enrollment-mandatory unless a later decision expands the policy.

**Why it matters:** Shapes Supabase Auth configuration and the RBAC/permission matrix; gates the payment surface (ties to D-007). Protects money-moving actions and PII regardless of whether Stripe lands in MVP.

---

## 5. Recommended Working Defaults for MVP

Use this summary when writing specs before items are **Decided**:

| Area | Working default |
|---|---|
| **Platform** | **Native (Expo/React Native)** for client + staff; thin Next.js web for marketing + subscription checkout; internal web tools optional anytime on same backend (staff side), not a launch priority |
| **Tenant model** | One shared DB; strict `business_id`; no global admin email |
| **Roles** | Owner, admin (optional), staff, client |
| **Invites** | Owner/admin generate staff and client codes; staff cannot invite clients |
| **Multi-business users** | Yes across businesses with context picker; no client+staff same business |
| **Pets** | Business-scoped pet records per client profile |
| **Meet-and-greet** | Business-configurable on/off; required when enabled |
| **Client portal** | Public landing + invite-required portal access |
| **White-label** | **Pseudo** only in-product (shared app + DB, runtime per-tenant theming, provider resolved by code/QR/link); true white-label = bespoke isolated **Enterprise** build, post-MVP (**Decided, D-030**) |
| **Payments** | **Stripe Connect (direct charges) IS in the MVP** (**Decided, D-007 Option A, 2026-07-08**); manual tracking = safety-net fallback only if payments derail near the store deadline. SaaS billing via Stripe Billing on web stays in scope |
| **Notifications** | In-app center in MVP; SMS post-MVP; email for paper trail |
| **Terms** | Template-based editable sections with version stamping |
| **Services** | Boarding + daycare + dog walking shipped; Crew+ walking includes launch GPS (D-054); generic five-axis schema/API allows future and provider-defined service types |
| **Locations** | Single location per business |
| **Staff ops** | Staff: schedule, households, bookings, staff notes, price override with audit; not config/payments/invites |

---

## 6. Decisions to Revisit After First Pilot / Business User

After the design partner runs on MVP (or a narrow pilot), revisit:

| ID | Topic | Trigger to revisit |
|---|---|---|
| D-001 | Web vs native | Staff/clients struggle on mobile web; push alerts inadequate |
| D-005 | Shared pet profiles | Same clients use multiple businesses and re-entry is painful |
| D-007 | Stripe Connect | Business loses bookings without online pay |
| D-008 | SMS alerts | Missed urgent bookings with in-app only |
| D-009 | Terms format | Templates too restrictive; legal counsel wants upload |
| D-010 | Multi-location | Business opens second site or distinct schedules |
| D-002 | Staff client invites | Owner bottleneck on invite generation |
| D-003 | Client+staff same business | Owner-operator wants to book own pet through client UI |
| D-020 | SaaS pricing | Real usage data on add-ons and plan tiers |
| D-022 | Additional services | Partner needs walking, grooming, or drop-ins |

Capture pilot feedback in `docs/decisions/` as new **Decided** or **Proposed** entries — do not silently change working defaults.

---

## 7. Phase 0 Exit Criteria Related to Decisions

Phase 0 (Product Definition) can close when:

### Must have Working Default or Decided

- [ ] **D-001** Launch platform has Working Default or Decided outcome
- [ ] **D-002, D-003, D-016, D-017** Permission-related defaults documented and reflected in `user_roles_and_permissions.md`
- [ ] **D-004, D-005, D-012** Multi-business and pet-scope defaults documented for Phase 1 handoff
- [ ] **D-006** Meet-and-greet configurability default documented
- [ ] **D-007, D-008, D-015** Payments and notifications scope defaults documented
- [ ] **D-009** Terms approach default documented
- [ ] **D-010** Multi-location explicitly **Deferred**
- [ ] **D-011** Client acquisition model (landing + invite portal) has Working Default

### Can remain Proposed until later phase

- **D-013, D-014** Invite code mechanics — finalize in Phase 2 invite spec
- **D-020, D-021** GTM, SaaS pricing, and specific PCSP beta-tester names — finalize before Phase 5 build planning
- **D-022** Additional services beyond boarding/daycare — finalize in Phase 4 MVP spec

### Process criteria

- [ ] This log exists and is linked from `product_brief.md` and `user_roles_and_permissions.md`
- [ ] No spec writer is blocked: every open question has a Working Default or Deferred status
- [ ] Stakeholder acknowledges Working Defaults are provisional until marked **Decided**
- [ ] Phase 1 owners know which decisions must become **Decided** before architecture sign-off (D-001, D-003, D-004, D-005, D-006 minimum)

**Phase 1 gate:** Architecture doc must cite decision IDs and flag any Working Default that changes table design or RLS shape.

---

## Next Steps

1. Stakeholder review: confirm or override Working Defaults → update status to **Decided**
2. Record **D-021** specific PCSP beta-tester names as they're confirmed (test tenant + launch date already Decided)
3. Begin Phase 1 with defaults for D-004, D-005, D-006, D-012
4. Schedule **Decided** review for D-001 and D-007 before Phase 5

### D-032 — Team permission levels (simplified)

**Status:** Decided (2026-07-07)

Four named levels; the PCSP invites a member and assigns one. "Co-provider" = someone assigned **Admin** (not a separate role). **Owner** (creator) has everything incl. editing financial connections + billing + ownership. **Admin** = Owner minus editing financial connections / billing / ownership (kept distinct so a partner can be Admin safely). **Manager** = full operations but no financial visibility and no price-override. **Staff** = view bookings/clients, add a booking, set up M&Gs, care execution, SMS; cannot edit/delete bookings or price-override (and cannot invite clients, D-002). Price-override + financial reports are Owner/Admin-only; SMS is all levels. Adds **Manager** to the prior Owner/Admin/Staff model. See `docs/planning/user_roles_and_permissions.md` (Team permission levels) + FigJam "Provider · Staff / team management". Ties to D-020 (seats/tiers); implement through membership-backed RBAC/RLS.

### D-033 — App IA: single app, Client / Provider(graded) fork; roles are nested

**Status:** Decided (2026-07-07)

One app, one auth. After login the app **forks by role within the active business context** into just **two** experiences: **Client** or **Provider-side** (not three; staff is not a separate app).

- **Provider-side is ONE experience, permission-gated (progressive disclosure)** — not separate "admin app" and "staff app." Roles are **nested capability sets: Staff subset of Manager subset of Admin subset of Owner.** Staff = the operational core (visits, check-in/out, report cards, daily schedule); each higher level only *adds* (Manager: broader ops, no financials; Admin: financials + settings + team; Owner: billing + ownership). Nothing a lower role can do is missing from a higher role.
- **Solo provider proves it:** they're Owner-level but personally do the Staff-level care work, so their provider home blends operator + owner views on the same screens, fully unlocked. Adding a team delegates the operational layer downward; same screens, who-sees-what changes.
- **Build implication:** design each provider screen for the **base (Staff) capability** and layer higher-level controls as **permission-gated additions** — do NOT build admin vs staff separately. Client is its own branch (most users; validates the core booking loop, so wireframe it first).
- **Context, not global account:** a person can be Client at business A and Staff at B (D-012), so the fork resolves per active business context, not per account.
- Aligns D-001 (single native app), D-004/D-012 (multi-business context), D-019 (admin optional), D-027 (provider = primary anchor), D-030 (pseudo-WL theming lives in the shared shell), D-032 (role levels).

### D-034 — Base509 master / per-app operational isolation

**Status:** Decided (Danny locked 2026-07-08; Codex ratified).

Base509 owns a thin shared master layer for account identity, product entitlement, SaaS billing, operator support/audit, and cross-product metadata. PetAppro operational data remains in the PetAppro operational store, tenant-scoped by `business_id`; do **not** add per-row `app_id` across PetAppro tables.

When app #2 becomes real, prefer separate operational Supabase projects per app. Separate schemas inside one project are acceptable only as an interim internal boundary, not a true isolation boundary. One mega-project with `app_id` on every row is rejected because it adds RLS complexity and cross-product leak risk.

### D-035 — Stable Base509 account id

**Status:** Decided (Danny locked 2026-07-08; Codex ratified).

PetAppro app relationships reference a stable `base509_account_id`, not raw `auth.uid()`. Supabase Auth ids are provider-specific login subjects and are mapped through an identity table/helper. RLS policies should call `current_base509_account_id()` and membership helpers rather than embedding raw auth ids throughout app tables.

Minimum migration hygiene: create `base509_accounts` + `auth_identities` (or equivalent names) before tenant tables depend on identity, and use `base509_account_id` in `business_memberships`, `clients`, actor/audit columns, notifications, and support logs.

### D-036 — Auth path for MVP

**Status:** Decided (Danny locked 2026-07-08; Codex ratified).

PetAppro ships with Supabase Auth in the PetAppro project. The account model remains product-agnostic so central identity can be extracted later if app #2 or cross-product SSO becomes concrete. Do not buy Clerk/WorkOS/Auth0 for the Oct 1 MVP, and do not hand-roll central auth.

**Implementation note (Danny, 2026-07-08):** name and structure the auth/account data fields so they **map cleanly to prepackaged authentication systems** (e.g., standard concepts like `provider`, `subject`, `email`, `account_id`). This keeps a later swap to an external IdP low-friction — the extraction is a mapping exercise, not a redesign.

### D-037 — Shared account-service boundary

**Status:** Decided (Danny locked 2026-07-08; Codex ratified).

The shared Base509 layer stores account identity and the Base509 billing relationship only. App-specific provider/client records stay in each app's operational database and link back by stable Base509 account id. "Provider" and "client" are app-context roles, not global Base509 person types.

### D-038 — Passwordless-first and step-up implementation

**Status:** Decided (Danny locked 2026-07-08; Codex ratified). Passwordless-first itself was already decided by Danny and belongs with D-031.

Apple, Google, and magic-link/passwordless login are primary; email/password is fallback. Owner/admin users must satisfy MFA/step-up before sensitive provider actions such as billing, financial settings, refunds, exports, team permission changes, and break-glass consent. Client users can remain risk-based step-up only.

Biometric app lock is local device protection and improves mobile safety, but it is not a server-side authorization factor. Sensitive mutations must still route through Edge Functions/RPCs that check role, auth assurance where available, and audit the action.

---

### D-039 — Pricing model: explicit rates, not % surcharges

**Status:** Decided (Danny, 2026-07-09) — supersedes the %-surcharge model in the earlier pricing spec/tests.

Providers set **explicit dollar rates** for everything; there are **no % surcharges.**
- **Rate tiers (rate overrides):** holiday / peak / weekend / extended are *separate rates the provider types in* (e.g., Regular boarding $60, Holiday $75, Extended $55) — not a % markup. The engine selects the applicable tier by condition: **holiday** = provider's holiday calendar; **extended** = stay-length threshold.
- **Holiday calendar:** ship **Woof's default holiday set**; providers keep/edit/add/remove via a calendar picker in settings, with **reset-to-defaults** (deliberately more control than Rover's rigid policy — a differentiator).
- **Flat surcharges:** extra-dog rate, puppy (+$/night), etc. are flat amounts, per tier.
- **Percentages** survive only for **tax** and **discount codes** ("10% off").
- **No card/convenience surcharge:** surcharging is a multi-state compliance minefield (state variation, disclosure rules, card-network caps/registration + debit prohibition, CA SB-478 all-in-pricing). Providers set rates **inclusive** of their costs. (Not legal advice.)
- **Referral bonus:** provider-toggle giving **one free/credited booking** (per Woof's mechanic; booking-level, client-facing — distinct from D-020's SaaS-subscription referral).
- **Customer-side checkout form (confirmed 2026-07-11):** a **single rate sheet** — no rates that vary by payment type; a **customer-facing tip** option; and the customer must **actively select a payment type (not preselected).** **No card surcharge reaffirmed** — an optional provider surcharge toggle was considered on 2026-07-11 and **dropped**: multi-state compliance (outright bans in CT/MA/ME/PR; debit surcharging prohibited nationwide under Durbin; per-state caps — Visa 3%, CO 2%, IL 1%, cost-only in NY/NJ/NV/GA…; mandatory disclosure + 30-day card-network notice). Providers price card costs into their rates instead. (Not legal advice.)

**Why it matters:** matches Woof + how operators think; transparent; per-tenant themeable. **Requires:** Cowork revises `docs/specs/booking_and_pricing.md`; Claude Code revises `packages/pricing` + golden tests (holiday-% → rate-override; extra-dog/puppy flat). Rate source of truth: the Woof pricing reference in `docs/research/woof-wetreats/`.

---

### D-040 — Default theme = Brandy Blue (base brand); theming tiers

**Status:** Decided (Danny, 2026-07-09). Supersedes the prior locked "Tier 1 = Sage & Sand" default. Codex governance review pending.

**Brandy Blue** — the PetAppro base brand (dog-named palette: Brandy Blue [primary], Camo Green [success], Coco Coral [danger], Bella Sky [info], Maverick Grey [neutral]; Poppins) — is the **default theme** and the theme for **entry-level subscribers.** Custom/alternate themes (Sage & Sand, etc.) become a **higher-tier white-label perk** (ties **D-020** subscription tiers + **D-030** white-label runtime theming). Sage & Sand is demoted from default to an alternate.

**Why it matters:** it's the product's actual brand identity and sets the free/entry vs. paid-theming tier boundary. **Requires:** DS lane updates the theming-and-tiers doc + tier lockup text (in progress); Codex reviews the token renames / status re-point / default supersession; George/Codex awareness. Anywhere that still calls "Sage & Sand" the default is now stale.

**✅ Full theme gallery — FINAL (Danny, 2026-07-17):**

| Theme | Note |
|---|---|
| **Brandy Blue** | default · entry tier · all tiers |
| **Chessie** | breed (Chesapeake Bay Retriever) |
| **Irish Setter** | breed |
| **Husky** | breed |
| **Bichon Frise** | breed (replaced Poodle, 2026-07-18) |
| **Blue Heeler** | breed (renamed from "Dusk," 2026-07-17) |
| **Bark Avenue NY** | place — NYC (city suffix is part of the name) |
| **South Bark Miami** | place — Miami (city suffix is part of the name) |
| **Hollywoowoowood** | place — LA (the "woowoo" is a howl) |
| **San Fursisco** | place — SF (added 2026-07-17; Base509's HQ city). Palette: **International Orange** (Golden Gate, ~#C0362C) primary · **bay teal** accent · **grey** neutral. **Public swatch names (storytelling): Golden Gate · The Bay · Carl the Fog** (SF locals call the fog "Carl"). Note: Golden Gate + Giants are both *orange* — use one International Orange as primary, not two competing reds/oranges. Watch CTA text contrast on the orange (design lane). |

- Alternate/non-default themes are the **higher-tier white-label perk** (D-020 tiers + D-030).
- **NYC theme = "Bark Avenue"** (Danny, 2026-07-18 — reversed the earlier "Pawk Avenue" call). *"Bark Avenue is better and not a business so not worried."* Cowork's factual note for the record: it **is** one of the most common dog-business names in the US, so businesses by that name do exist — but as a **cosmetic theme label** (generic/descriptive, not a product brand), trademark/optics risk is low, so the "don't worry" conclusion holds on that footing. Danny's call. *(Separately: still steer clear of "Central Bark" — same generic collision, no upside.)*
- Names finalized in the DS Figma file; recorded here + website spec §3/§7. *(Final mix: 5 breeds — Chessie, Irish Setter, Husky, **Bichon Frise**, Blue Heeler — + 4 cities: **Bark Avenue NY, South Bark Miami**, Hollywoowoowood, San Fursisco. NY/Miami suffixes are part of the name (Danny, 2026-07-19). History: "Dusk"→"Blue Heeler"; "Poodle"→"Bichon Frise"; "Pawk Avenue"→"Bark Avenue".)*

**Parking lot — future place themes (Danny, 2026-07-17):** hold for later, **only if users respond to the place-pun themes** (i.e. gate expansion on signal, don't build ahead of demand):
- **Beverly Howls** (Beverly Hills)
- **Zoomiapolis** (Indianapolis + "zoomies")
- **Las Wag-as** (Las Vegas)
- **Barkselona** (Barcelona)
- **Pawris** (Paris)

*(Barkselona + Pawris = international — a signal for later global expansion flavor. Not scoped now.)*

**✅ Theme entitlement by tier (Danny, 2026-07-18) — supersedes the old "pick 1 of 3 / expanded / full" ladder:**

| Tier | Themes (Danny's exact spec, 2026-07-18) |
|---|---|
| **Starter** (T0, free) | Brandy Blue only |
| **Solo** (T1, **first paid**) | Brandy Blue **+ Husky + Irish Setter** |
| **Duo** (T2) | Solo set **+ Bichon Frise + Blue Heeler + Chessie** (6 total) |
| **Crew** (T3) | **All themes** (adds city themes) **+ upcoming special & seasonal** |
| **Team** (T4) | Same as Crew — all + special & seasonal |
| **Enterprise** | **Custom / own-brand** theme (D-030 white-label) — outside the ladder |

**Rationale (Danny):** *"Having a little customization for the first paid tier is important — it's one of our differentiators."* Competitors gate branding/theming to top plans; PetAppro unlocks personalization the moment a provider pays anything (Solo), reinforcing the "your brand, your clients" story (D-029/D-058). Mirrored in `pricing-tiers-and-features.md` matrix.

**⚠️ Correction (2026-07-18):** an earlier note here wrongly called "Bichon Frise" a Fable hallucination — it was **Danny's roster change**, a real theme. Cowork's error.

**✅ ROSTER RESOLVED (Danny, 2026-07-18):** **Bichon Frise replaced Poodle.** Poodle is out; final breeds = **Chessie, Irish Setter, Husky, Bichon Frise, Blue Heeler**. Gallery table updated.
✅ **Confirmed (Danny, 2026-07-18): NYC theme = "Bark Avenue"** (reversed from Pawk Avenue). Low-risk cosmetic label; Danny's call. Roster is now fully locked.

---

### D-041 — Provider configuration surface: web portal only; app stays basic

**Status:** FINAL (Danny, 2026-07-10). Detail in `docs/planning/provider-settings-ia.md`.

**All provider editing/config is online**, via the **subscription-management web portal** (same login that manages billing) — Services CMS, report-card templates, hours of operation, pricing, availability, T&C, staff. The **native app is not a config editor at MVP**: it carries operations (bookings, check-in/out, report cards, messaging) plus **basic device preferences only** — notifications and **location sharing** for D-054 launch GPS. Web and app are two clients over the **same Supabase provider DB**, not two systems (mirrors Woof WeTreats).

**Why it matters:** content-heavy config is painful on mobile; keeping editors on web shrinks MVP app scope and (with D-042) keeps SaaS revenue off store fees. **Requires:** a provider web portal in MVP scope (hybrid-scope tradeoff, D-023); Codex architecture awareness (shared backend, two clients).

---

### D-042 — App-store fee posture: subscription sold web-only, no in-app purchase/CTA; bookings via Stripe

**Status:** FINAL (Danny, 2026-07-10), from Apple + Google research (July 2026). Not legal advice.

Two payment flows, kept deliberately separate:
- **Provider SaaS subscription → web only.** The **app contains no purchase and no subscribe/upgrade link or CTA.** The app only requires an active account to log in; providers subscribe/manage billing in the web portal. This keeps us in the stable **B2B SaaS / multiplatform exemption** → **0% to Apple/Google**, independent of the unsettled external-link fee litigation (Apple currently 0% on US external links but a "reasonable commission" may be set by the district court; Google charges a service fee from 10% on subscriptions **even via external links** — so external links are *not* a safe path; not linking is).
- **Client → provider booking payments → Stripe Connect, in-app OK.** Dog walking/boarding/sitting are **physical real-world services**, which both stores **exempt from IAP** (must use an outside processor). This is unaffected by the subscription posture.

**Build constraint:** no subscription purchase or purchase-link/CTA anywhere in the app (a neutral, non-CTA "manage your account on the web" is the grey zone; safest is no link). EU note: never offer IAP + external in the same binary — moot since we have zero IAP.

**Why it matters:** protects 100% of subscription revenue and de-risks store review. **Requires:** spec reflects the no-in-app-purchase constraint; Codex/Claude Code awareness; watch the Apple external-link ruling only if we ever reconsider in-app selling.

---

### D-043 — Off-hours surcharge, hours of operation & snapshot-on-booking

**Status:** FINAL (Danny, 2026-07-10). Detail + clause text in `docs/planning/provider-settings-ia.md` §2.

Providers capture **hours of operation** (per-weekday open/close; needed regardless to power the public services/pricing page) and an optional **off-hours surcharge** — a **flat $ amount** (per D-039, not a %). A client requesting service outside those hours agrees to the surcharge **at booking, before service** (client-facing clause + matching boilerplate T&C clause, D-009, populated from provider tokens). **Snapshot-on-booking rule:** hours + off-hours surcharge (and travel fee + rates) are **copied onto the booking at creation, immutable** — editing settings later must never rewrite a past agreement (same pattern as the pricing-breakdown snapshot).

**Also decided (pricing):** **flat travel fee** for MVP (provider sets per booking); **per-mile deferred** until feedback demands it (per-mile needs distance/geocoding infra). Folds into D-039's flat-surcharge family.

**Requires:** provider-settings fields; snapshot fields on booking (Codex data-model confirm, D-046 note); T&C template update.

---

### D-044 — Secure storage for key/access data

**Status:** FINAL (Danny, 2026-07-10).

Sensitive access data (lockbox/alarm/gate codes, entry instructions) for in-home services is **encrypted at rest** (never stored or logged in plaintext) and revealed in-app behind a **biometric gate** (Face ID / re-auth, ties into D-031 step-up — a UI gate, not a substitute for encryption). **Transparency:** the input form tells **both provider and client** how the data is stored and protected.

**Requires (Codex-confirmed crypto):** **tenant-scoped ciphertext**, **keys held separately** from the data, **audited server-side decryption**, and **no plaintext leakage** anywhere (logs, snapshots, breadcrumbs); Expo LocalAuthentication reveal gate; privacy-policy line. Fits the D-034–D-038 isolation model only under these conditions.

---

### D-045 — Availability conflict-groups (overnight-exclusive vs overlap-ok)

**Status:** FINAL — build requirement (Danny, 2026-07-10).

Each service has an exclusivity property. **Overnight-exclusive group (mutually exclusive):** in-home sitting, house sitting, boarding — a provider cannot hold two of these for overlapping dates (**per booking, not per pet**). **Non-blocking services (overlap allowed):** dog walking now; training/grooming later — schedulable *during* a multi-day sit. **Provider override:** the provider can explicitly set which services block vs. overlap.

**Why it matters:** the one genuinely new scheduling logic for the drop-in / in-home verticals. **Requires:** Codex confirms whether boarding already needs overlap/conflict handling (so this is an extension, not net-new).

---

### D-046 — Report cards: per-service CMS templates, checklist editor, edit-lock

**Status:** FINAL in principle (Danny, 2026-07-10); per-card content model to be worked out in the D-047 session. Detail in `docs/planning/provider-settings-ia.md` §3–4.

Report cards are **templated per service** (drop-in, walk, sitting, boarding) with a starter checklist the provider customizes via a **checklist editor** (not raw open text), plus **free-text notes + photo**. A booking's report card is a **mutable draft the provider edits until the booking is marked complete, then locks into an immutable snapshot** both sides see; **client is always read-only**. Check-in/out arrival & departure buttons produce **timestamps visible on both sides** + client notification. **House-sitting household tasks** ship as **two-sided toggle boilerplate** (provider offers → client confirms needed), flowing into the checklist — not priced individually for MVP.

**Open (pending finalization):** exact fields per service card (body-copy editor? photo count? etc.) — recommend speccing **boarding** end-to-end as the reference, then cloning. **Requires:** Codex data-model confirm (per-visit / per-night / location reuse; multi-visit-per-day for drop-ins) — see `provider-settings-ia.md` §8.

---

### D-047 — Service content & Woof-WeTreats carryover review (OPEN — needs working session)

**Status:** OPEN (Danny, 2026-07-10). Scoped next-work item, not yet decided.

Dedicated working session(s) to hash out, per service:
1. **Content of each service** — the actual copy, fields, and structure of every service card (boarding, daycare, walking, drop-in, in-home sitting, house sitting).
2. **Functionality review of everything carried over from Woof WeTreats** — audit each Woof feature/behavior and decide keep / change / drop for PetAppro.
3. **All service report cards** — for each service: report-card **content**, the **boilerplate** (system defaults), and which parts are **editable / add-on** functions (per D-046's checklist-editor + edit-lock model).

**Why it matters:** turns the D-041/D-046 principles into buildable per-service specs and prevents silent scope drift from the Woof rebuild. **Owner:** Cowork (product) drafts, with the Woof reference in `docs/research/woof-wetreats/`; Danny decides; Codex confirms data-model. **Recommended approach:** spec **boarding** end-to-end first as the template, then clone per service.

---

### D-048 — MVP vertical scope: drop-ins in; in-home/house sitting = first fast-follow

**Status:** FINAL (Danny, 2026-07-10), informed by Codex feasibility (net-new schema/logic, not free reuse).

**MVP verticals:** boarding, daycare, dog walking (the committed foundation, D-022) **+ drop-in visits as a stretch** (per-visit; closest to walking — check-in/out + report card). **In-home sitting & house sitting = first fast-follow (v1.1)** — they carry the heaviest net-new work (per-night + **location** schema, overnight **conflict-group** logic per D-045, encrypted access codes per D-044) and naturally bundle with the location-sharing work (**GPS is now an MVP launch target — see D-054**, superseding the v1.1 plan).

**Soft-plan (Danny):** keep a plan to **fold the deferred verticals in if the foundation gates clear with buffer** (per D-023 flex-scope to hold the Oct 1 date). **Gut-check at the first major check-in** to decide whether they move into the launch window. Not a commitment to launch them — a readiness option.

**Why it matters:** protects the launch date while keeping the verticals live as near-term scope. **Requires:** Codex feasibility items (net-new: per-visit/per-night+location schema, overlap logic, multi-visit-per-day) sized into the plan; revisit at first major check-in.

---

### D-049 — Notifications & SMS policy

**Status:** Decided (Danny, 2026-07-11). From Apple/Google permission-guideline research (July 2026). Not legal advice.

**Built-in stack:** **push (in-app) + email are free at every tier** and are the primary notification channels — providers run their business in the app, so push adoption is expected to be high.

**Onboarding permission priming** (encouraged, with guardrails):
- Show a **truthful soft-ask** screen explaining operational value ("get notified to track your pets / your clients") **before** the OS prompt; fire the OS system prompt only when they opt in. **iOS gives exactly one system prompt** — if declined, the only path back is Settings.
- **Don't prompt on first launch** — ask after a meaningful moment (account created, first client/booking). **Android 13+**: notifications are OFF by default; request `POST_NOTIFICATIONS` at runtime with a why.
- **Cannot require notifications for core app function**; marketing/promotional push needs separate consent + an opt-out (Apple 4.5.4). Language must be truthful and non-coercive — frame around operations, not marketing.
- **Deep-link to settings** to re-enable (Expo `Linking.openSettings()`; iOS 16+ notification-settings URL) for users who declined.

**SMS:** **top tier (T4) + Enterprise only, opt-in, OFF by default.** Not a mass channel — real cost (~1.1¢/segment + carrier surcharge; A2P brand ~$44 + $15/campaign + $1.50–10/mo). Metered. Ties **D-008**. Rationale: push+email cover the app-first audience; SMS is a high-assurance reach upgrade (no-show reduction) for the biggest operators only.

**Why it matters:** protects margin (SMS cost), maximizes free-channel reach, and keeps onboarding compliant. **Requires:** onboarding priming screen + permission flow (both OS); settings deep-link; SMS gated to top tier with metering.

---

### D-050 — Tier entitlement gating + UX reliability bar

**Status:** Decided (Danny, 2026-07-11). Enforcement design → Codex; test/monitoring implementation → Claude Code.

**One binary, runtime entitlements (not per-tier downloads):** a single app (D-030/D-033); the provider's tier is an **entitlement resolved server-side** from their subscription, and the app renders to that entitlement set. Gated features are **hidden or shown locked with an "upgrade to unlock" CTA** — hide the irrelevant, show a *few* aspirational locks as a conversion lever. Entitlement changes unlock **instantly** (no app-store update).

**Server-side enforcement is mandatory:** UI hiding is UX, not security. Gated endpoints must **refuse** out-of-tier calls (a Starter/Solo provider cannot invoke a Duo+ capability via the API even if the client is tampered with). Ties D-034–D-038, D-042.

**Reliability bar — makes the "best-in-class UX" differentiator (competitive-analysis §4) a real commitment, not a slogan:**
- Test pyramid: unit + golden (already 39 on pricing) + **E2E on booking / payment / check-in** (Detox or Maestro).
- **Crash + error monitoring (Sentry) from day one** — fix by real crash-rate data.
- **CI gates:** tests + strict TypeScript pass before merge.
- **Beta ring + phased rollout:** own business → 5–6 PCSPs (TestFlight / Play internal) → staged production; **EAS Update** for JS hotfixes without full re-review.
- Graceful offline / flaky-network handling; performance budgets; focused MVP scope as a reliability strategy.
- **Native ≠ automatically stable** (Rover/Precise are native and still crash): the edge = native ceiling + this reliability floor + focus.

**Why it matters:** entitlements are the billing/upsell backbone; the reliability bar is what actually delivers the UX advantage competitors fail on. **Requires:** Codex ratifies the server-side entitlement resolution + enforcement model; Claude Code stands up Sentry + E2E + CI gates + EAS phased rollout.

---

### D-051 — Brand naming & the "appro" family (Base509 multi-vertical vision)

**Status:** Decided (Danny, 2026-07-11); the capital-"A" rule was **reversed** the same day.

- **Casing — REVERSED:** the "always capitalize the A" idea is dropped — it **looks bad in the logo**. The **"appro" family suffix reads lowercase** in the wordmark (exact styling is Danny's logo call; no forced mid-word capital). *(Docs currently write "PetAppro"; final text casing follows the logo — minor, TBD.)*
- **"appro" is the family.** Base509 is a platform building a **family of booking/scheduling apps for solo-to-small-shop service providers**, one vertical at a time. **PetAppro is the boilerplate** that proves the model; **next = a hair-stylist app**, then **house cleaners**, then other similar solo/small-shop service industries that need booking + scheduling to manage their day(s).
- Repeatable per vertical on the shared multi-app architecture (**D-034–D-038**: Base509 master → per-app isolated operational DBs). Company folders Title Case; code repo lowercase (unchanged).

**Why it matters:** the boilerplate → multi-vertical family is the core Base509 platform story (the spine of the company deck); naming just needs to stay logo-consistent.

---

### D-052 — Booking invoices / receipts (branded, numbered) — MVP

**Status:** Decided (Danny, 2026-07-11); MVP. QuickBooks format verified.

Each booking produces **one branded, numbered record** built on the D-039 stored breakdown snapshot (line items, surcharges, discounts, tax, total), skinned to the provider's theme/logo (D-030/D-040). It reads as an **invoice** before payment (amount due) and becomes a **receipt** after payment (paid, method, date) — **same number throughout**.

- **Delivery:** viewable + **downloadable PDF in-app** *and* **emailed** (email = paper-trail channel per notification model).
- **Numbering — `PREFIX-YY-####`** (e.g., `WWT-26-0001`): provider prefix + **2-digit year** + zero-padded sequence. **Resets each year; gapless & sequential within the year;** assigned at issue; **immutable.**
  - **QuickBooks-verified:** QBO invoice number max **21 chars**; custom alphanumeric allowed (enable "Custom transaction numbers"). Constrain provider prefix (≤ ~10 chars) so prefix + `-YY-` (4) + sequence ≤ 21; default 4-digit sequence (9,999/yr), widen if a tenant needs more. Year prefix keeps numbers unique across time.
- **Refunds / cancels / edits:** never mutate an issued invoice — issue a **credit note / adjustment** (same discipline as the frozen pricing snapshot; D-015 no-deposits keeps it full-payment-simple).
- **Our invoice, not Stripe's:** Stripe Connect records the charge; we generate the **branded** invoice/receipt (better for "your brand"). Feeds **F-007** QuickBooks / CSV export.

**Why it matters:** professional, accountant-ready numbered invoices are a real selling point, and cheap because the breakdown data already exists. **Requires:** PDF generation; **per-tenant (`business_id`) gapless invoice sequence** with yearly reset; provider **invoice-prefix** setting; email delivery; credit-note model. Cowork folds into `booking_and_pricing.md`; Codex confirms the sequence + immutability data model.

---

### D-053 — In-app messaging out of MVP; native share for report cards/photos

**Status:** Decided (Danny, 2026-07-13).

**No in-app chat at MVP.** The "keep clients updated" job is met by: report cards + photos delivered **in-app** (D-046) + **push/email** notifications (D-049), **plus a native SHARE action** so a provider can send a report card / photos out through the OS share sheet (text / iMessage / WhatsApp / email — the client's own channel). Uses RN `Share` / `expo-sharing`; the report card renders as a shareable image/PDF (like the invoice, D-052).

- **Big scope + compliance saving:** no chat infrastructure and **no user-generated-content moderation burden** (Apple's UGC report/block rules only trigger if we host user messages — native share doesn't).
- One-directional (provider → client) for MVP. **Two-way in-app messaging = fast-follow** — **build our own or evaluate a chat SDK/plugin** (e.g., Stream, Sendbird) for speed; either path still adds report/block moderation (Apple UGC compliance).

**Why it matters:** covers the core communication need at near-zero cost, and removes the heaviest comms build + UGC compliance from the launch. **Requires:** shareable report-card render + native share action; confirm the shared artifact excludes sensitive data.

---

### D-054 — GPS: hard MVP launch gate, superseding the v1.1 plan

**Status:** Decided (Danny, 2026-07-13). Supersedes the earlier "GPS = v1.1 fast-follow" stance (update any "GPS v1.1" references — D-048, F-026, competitive-analysis §5, pricing-tiers doc).

Danny's call: launch a walking product **with** live GPS rather than risk brand perception in the first weeks. Done responsibly, under three guardrails:

- **UPDATED 2026-07-14 (Danny) — GPS is a HARD launch gate:** *"we will not launch until GPS is worked out."* The **date flexes rather than cutting GPS** — we won't ship a walking product without live tracking, and we won't ship *bad* GPS (D-050: buggy GPS damages the brand more than none). **Supersedes the earlier "first-to-cut / cuttable" framing.** Consequence: F-026 "coming soon" preview is **dropped** (nothing unreleased to advertise → Apple 2.3 risk moot).
- **Store-policy contingency:** background-location review is scheduled early, with complete justification, honest permission priming (D-049), and appeal buffer. Under the locked hard-gate decision, an unrecoverable store-policy rejection blocks launch and returns to Danny for an explicit scope decision; it does not silently convert GPS back to a fast-follow.
- **Scheduled EARLY** in the build (not last), so background-location review and reliability findings arrive with time to fix or move the date.
- **Held to the reliability bar (D-050):** accurate check-in/out + track, no "miles off." **Buggy GPS damages the brand more than no GPS** (cf. Precise Petcare reviews); the date flexes until the reliability bar is met.
- Manual proof-of-walk (photos + timestamped check-in/out) remains a degraded-mode/reliability fallback during an individual service, not a substitute for the launch GPS entitlement.

**Why it matters:** GPS is the walking differentiator and the top store-rejection/reliability risk. **Requires:** early scheduling in the build plan; background-location declarations prepped (iOS "Always" + Android `POST_NOTIFICATIONS`/foreground-service); consent/auto-stop implementation; reliability tests; and schedule contingency because the date—not GPS scope—flexes.

#### Consent UX — DECIDED (Danny, 2026-07-17) · ⚠️ ACTOR CLARIFIED (Danny, 2026-07-21)

> ⛔ **The consent interstitial + checkbox is on the WALKER/STAFF side — the person being tracked — NOT the client.** Tracking is **one-way**: the walker's device shares location; the **client only views** the route. A client has nothing of their own being tracked, so a client "I agree to location tracking" checkbox is consenting to something that isn't happening to them — **remove it.** Google's rule requires the disclosure immediately before the **OS location prompt**, which fires on the **walker's** device — so the interstitial must live in the staff/walker flow, before a tracked walk starts.
> **Client side = informational only** (optional passive note "you can watch the live route during walks"), **no agreement gate, no checkbox.** The worker-being-watched concern is covered by the walker's persistent "your location is shared and your client may be viewing it" notice — not by client consent.
> 🔧 **Wireframe correction:** the GPS consent interstitial was drawn on the CLIENT side (`Client GPS consent interstitial`). Move the consent+checkbox screen to STAFF; make the client screen informational.

**Interstitial screen before the OS permission prompt, with a checkbox as double confirmation of intent/permission.** This satisfies Google's prominent-disclosure requirement, which a privacy-policy paragraph does not.

**The interstitial must state, specifically** (vague text fails the requirement — the disclosure has to name the practice):
- that **precise location** is collected;
- that collection **continues in the background / when the screen is off** during an active service;
- **who sees the route** (the Provider's authorized personnel + the Client on that booking);
- **how long** coordinates are retained *(pending the §6 retention number)*;
- that it runs **only during an active service**, and how to stop it.

⛔ **The checkbox must be unchecked by default and must not be bundled with anything else.** A pre-checked or bundled box is dark-pattern territory and would undercut the whole point of adding it.

#### ⚠️ "They're not employees" — partly true, and the exception is one we built on purpose

Danny's framing (2026-07-17): *"they are not 'employees', they are business owners who are providing their own clients with tracking."*

**True for the solo Provider** — self-tracking, consent trivially present, and that's most of our beachhead.

**Not true once a Provider has staff — and D-033 builds that on purpose.** Our role model is `Staff ⊂ Manager ⊂ Admin ⊂ Owner`; solo is explicitly "the owner doing staff work," i.e. the *degenerate* case, not the only one. The moment a Provider dispatches an employee or contractor on a walk, **an employer is tracking a worker's precise location in the background** — which is exactly the situation Cal. Penal Code §637.7 and workplace-monitoring law address. That population grows as we move upmarket, which is the plan.

**This does not become PetAppro's duty — it becomes a duty we must make sure the Provider carries.** Hence the covenant below. The risk of the "they're all owners" framing is that it argues the problem away instead of assigning it.

#### Competitor mechanism — verified (Danny sourced it, 2026-07-17)

*(Internal only — public copy never names competitors.)* My own search failed to confirm this; Danny found it in their support docs. Their auto-stop is a **three-layer** design:

1. **Manual end** — the walker swipes "End Service."
2. **Report-card trigger** — tracking shuts off completely **when the post-service report (checklist + photo) is submitted.**
3. **Time-out** — if the walker forgets entirely, the app **auto-disconnects when the scheduled booking block completes.**
4. **Client view** — the live map becomes **immediately unavailable** once tracking stops.

**This validates the recommended default below** and adds one pattern worth stealing outright: **the report card is the natural end-of-service artifact, so make it the tracking kill-switch.** We already have report cards (D-U card family). Tying the two means the walker's existing habit ends tracking — no new discipline required. That's better than relying on a separate "stop" they can forget.

Note the **client-view rule** is a *visibility* decision distinct from retention: the live map dies at service end even though the route record persists. Adopt that — live location and stored route are different exposures.

> ⚠️ **The mechanism transfers. The legal posture does not.**
> They are a **marketplace that engages its own walkers** — tracking workers *it* dispatched, under a relationship that drew significant worker-classification litigation. **We are software a Provider uses to track the Provider's own staff.** Different party bears the duty, different consent chain. Copy the UX pattern; **do not** infer that our consent/notice obligations are satisfied because theirs are. Inheriting a marketplace's *legal* design is **D-029 leaking back in through the GPS feature.**

**Sources:** [Starting and ending sitting services](https://support.wagwalking.com/en_us/starting-and-ending-sitting-services-SyrJ7VCVR) · [Starting and ending boarding services](https://support.wagwalking.com/en_us/starting-and-ending-boarding-services-HkcU7lZSR) · [App Store listing](https://apps.apple.com/us/app/wag-dog-walkers-sitters/id940734609)

#### 👁 Worker notice: "MAY be watching," not "IS watching" — DECIDED (Danny, 2026-07-17)

Danny: *"a worker should know a client MAY BE WATCHING. I don't know that we can confirm they ARE watching. When I share my location with my friends, I have never seen a confirmation or way to know they are watching, although I know they have."*

**Decided: persistent "your location is being shared for this service and your client may be viewing it." No live "someone is watching now" indicator.**

**Note — we probably *could* build the live version** (the client app opening the map is a detectable event, unlike consumer location-sharing where the platform simply chose not to surface it). So this is a **deliberate choice, not a technical limit.** Four reasons it's the right one:

1. ⭐ **The route is recorded whether or not anyone watches.** This is the strongest reason and it's better than the analogy: a live "watching now" signal implies its absence means unobserved — **which is false.** The honest, constant fact is *"this service is tracked; the route is visible to your employer and the client."* That's true 100% of the time and doesn't flicker.
2. **A live indicator would be unreliable** — app backgrounded, screen off, multiple viewers, reconnects. **False negatives are worse than no signal**, because a worker would rely on them.
3. **It creates a surveillance dynamic** — a "you're being watched right now" ping mid-walk changes behavior and is a distraction during a service where someone is handling an animal near traffic.
4. **Noise.** It's an alert with no action attached.

**Where the notice lives:** the persistent tracking notification (Android foreground-service **requires** one anyway — make it carry this text) + the interstitial (§ above).

⚠️ **One caveat on the analogy:** Find My is a choice between friends; this is **an employer tracking a worker.** The consent asymmetry is greater, not smaller. That *reinforces* the decision — a persistent "may be observed" notice is more appropriate in a workplace context, not less — but it's why the Provider covenant (below) still carries the actual consent duty. The notification is transparency; it is **not** consent.

#### 🔧 Auto-stop — OPEN, needs design (nothing is built)

Danny: *"Does our GPS tracker auto shut off when the timing and/or return location are checked off? Whatever technically we can do, we should."* — **Correct instinct; agreed. Nothing exists yet.** Candidate stops, cheapest first:

| Mechanism | Ship? | Notes |
|---|---|---|
| **Stop on service completion (check-out / OUT)** | ✅ **Day one** | Necessary, **not sufficient** — the failure mode *is* forgetting to check out. |
| **Report-card submission kills tracking** | ✅ **Day one** | ⭐ Verified competitor pattern. Ties the kill-switch to an artifact the walker **already** completes — no new discipline. Our report cards exist. |
| **Booking-window cutoff** | ✅ **Day one** | Auto-disconnect at scheduled end + grace. Verified competitor backstop; we already know the window. |
| **Hard max duration** | ✅ **Day one** | Cheap belt-and-braces for open-ended/no-window services. (Tractive: 6h.) Catches what the booking window can't. |
| **Live map dies at service end** | ✅ **Day one** | Verified pattern. **Live location ≠ stored route** — different exposures, decide separately. |
| **Return-to-origin geofence** | ⚠️ Prompt only | Danny's suggestion — good UX, unreliable *alone*: start ≠ home, and a walk can legitimately end elsewhere. Use to *prompt* an end, never to silently stop. |
| **Idle / no-movement timeout** | Prompt | Catches phone-in-pocket-after-the-walk. |
| **Persistent "tracking active" notification** | ✅ Required | Android foreground-service mandates it; make it a **one-tap stop**. |

**Recommended default (matches verified competitor design + adds a max-duration backstop):** check-out **+** report-card submission **+** booking-window cutoff **+** hard max duration, with geofence/idle as prompts. **Tracking does not silently continue past all of them.**

`[BUILD: the auto-stop must be tested as a reliability case, not assumed — D-050 says buggy GPS is worse than none, and "tracked my staff member home for 5 hours" is the worst possible bug.]`

#### Provider covenant + onboarding — TO BUILD (Danny, 2026-07-17: *"We need to explain this in the provider onboarding/setup experience on Petappro.com"*)

**Agreed, and it's the right home for it** — the Provider is the party who owes the duty, so the obligation belongs where they're setting up their business, not buried in §7 of a document they scrolled past.

**Two pieces:**
1. **Provider Terms covenant (TO DRAFT):** the Provider gives staff/contractors any legally required monitoring notice, obtains any required consent, and **represents they've done so before dispatching a tracked service.**
2. **Onboarding/setup surface on petappro.com (TO DESIGN):** plain-language explanation of what GPS collects, who sees it, how long it's kept, when it stops — **plus** the staff-notice obligation, surfaced *at the point a Provider enables tracked services or adds staff*, not in a wall of setup text. Solo Providers should see a shorter path than staffed ones (see the employees note above — the obligation only bites once there's a worker to notify). → **Website spec + Legal README #20.**

#### ⛔ "Ambiguous or open-ended" consent — REJECTED (Danny, 2026-07-17: *"I follow your lead on that."*)

**DECIDED: no vague sign-up consent to background location tracking.** Consent for tracking lives in the **interstitial**, specifically worded. Sign-up may *inform* ("this app supports location-tracked services — you'll be asked when you use one") but does **not** pre-consent anyone to background location.

Danny floated it and flagged it himself: *"Happy to put consent in the sign-up policy in somewhat ambiguous or open-ended terms, **though this is a bit cringy.**"* The cringe was the correct read; the reasoning below is why.

**The cringe is the signal. Three independent reasons this doesn't work:**

1. **It doesn't satisfy Google.** The prominent-disclosure rule requires a **specific, prominent, just-in-time** disclosure naming the practice, immediately before the permission request. Vague blanket consent at sign-up **is the exact pattern the rule exists to reject.** We'd take the ethics hit *and still fail review.*
2. **Vague consent is weak consent.** Consent generally has to be **specific and informed** to do any work. Broad, open-ended sign-up language is the first thing challenged and among the easiest to set aside — so it buys less protection than the specific version, not more.
3. **It contradicts the operating principle** (Danny, verbatim): *"I never want to try to work around things that may put us in legal jeopardy or try to trick out customers and their customers. I believe in ethical operations and everything we do needs to operate as such."* Ambiguous consent for **background location tracking of a worker** is the case that principle was written for.

**The specific version is also the cheaper one.** The interstitial + checkbox *is* the consent moment — specific, provable, the strongest evidence we could have. Vague sign-up language on top adds no protection and creates a document that contradicts the interstitial.

**Consequence for the build:** there is **one** consent surface for tracking, not two. If anyone later proposes adding blanket location language to sign-up, this decision is the answer.

---

### D-055 — Two-layer legal: PetAppro platform ToS/Privacy (web) + provider ToS/policies (in-app)

**Status:** Decided — *structure* (Danny, 2026-07-13). **Not legal advice — counsel drafts/reviews both layers.**

- **Layer 1 — PetAppro (platform) Terms + Privacy — REQUIRED, launch-critical.** Govern PetAppro ↔ every user (providers + clients as software users): account, acceptable use, the app itself, platform data collected/processed, payment infra (Stripe Connect), liability limits. **App stores mandate a privacy-policy URL (+ effectively ToS) to publish → launch blocker** (ties the Launch Readiness track). Hosted at web URLs (`petappro.com/terms`, `/privacy`), linked **pre-login** on sign-up and in **Settings → Legal/About**.
- **Layer 2 — Provider's Terms + Policies — in-app, inside their space.** Govern provider ↔ client: cancellation/refund, meet-&-greet, house rules. Surfaced in provider profile/preview + booking review. Builds on **D-009** (template terms), **F-021** (preview shows T&C/house rules), **F-022** (boilerplate + auto name-fill).
- **Data protection — REFINED 2026-07-16 (legal research). The split is DATA-SPECIFIC, not user-type-specific.** An earlier framing ("client data → we're processor") was too coarse: **PetAppro is an independent controller/business even for data about Clients**, where it's for our own legitimate platform purposes — authentication, account security, direct support, required communications, fraud prevention, billing, service/diagnostic/audit logs, and legal compliance. The correct split:
  - **Provider-controlled** client, booking, care, pet, and provider-workforce records → PetAppro is **processor / service provider** (DPA governs).
  - **PetAppro identity, auth, security, subscription, support, and compliance records** → PetAppro is an **independent controller / business** (Privacy Policy governs). *We must not use the independent role to circumvent the processor restrictions.*
  - **Stripe is NOT automatically our sub-processor** — it acts as an **independent controller** for payments, KYC, fraud, and regulatory compliance.
  - **"You own your data" must not imply** providers own their clients' personal information or client-created IP.
  - **Pet data may be personal information** where it can be linked to the owner/household.
  - **CA service-provider status requires specific contractual restrictions** (Cal. Civ. Code §§1798.100(d), 1798.140(ag)): limited purposes, no sale/sharing, no unrelated commercial use, restrictions on combining, compliance monitoring, equivalent subprocessor obligations. **The DPA skeleton is not sufficient — counsel must convert it.**
  - **New commitment:** no training general-purpose AI/ML on identifiable Provider Client Data without separate express authorization; improvement uses telemetry or properly deidentified/aggregated data only.
- **Two consent points:** (1) **sign-up** → accept PetAppro ToS + Privacy (consent line + links); (2) **first booking** with a provider → accept that provider's booking policy / house rules (record version + timestamp per F-022).
- **UI touchpoints (DS/Fable — wireframes):** sign-up consent line ("By continuing you agree to PetAppro's Terms & Privacy"); Settings (More tab) → **Legal** row → PetAppro ToS + Privacy (web links); provider policies in preview/profile + the booking review step.

**Why it matters:** legally necessary, **app-store-required to publish**, and clarifies the platform-vs-provider responsibility split. **Requires:** counsel drafts/reviews both layers + the DPA; the marketing site hosts `/terms` + `/privacy` (Launch Readiness); DS adds the 3 touchpoints; versioned consent capture wired.

---

### D-056 — Website architecture: one skeleton, per-brand theme, Base509 endorsement footer

**Status:** Decided (Danny, 2026-07-14). Shapes **MKT-4**.

**Pattern: "endorsed house of brands."** Each product site is a **standalone brand experience** (no cross-sell, no shared nav — per-vertical apps share zero buyers, D-051), but the sites **feel related** by design:

- **Shared page structure** — the same information architecture + component skeleton across product sites.
- **Per-brand reskin** — colors + fonts swap per product, **exactly like the app's runtime theming** (D-030/D-040). The website is themed the same way the app is.
- **Endorsement footer** — each product site footers back to **base509.com** ("the company behind the software"). Light parent signature (cf. Automattic's "An Automattic invention") — credibility without diluting the product brand.
- **Company hub stays thin** until product #2 exists (37signals precedent: with one product, the company brand is noise; it mattered again only once HEY shipped).

**Implementation:**
- **One deployment, multi-domain** (MKT-4): one Next.js codebase on Vercel serving base509.com + petappro.com (+ future verticals), routed by hostname. Adding a vertical = a new domain + a new theme, **not a new site**.
- **Web tokens are INDEPENDENT of the app's token pipeline (Danny, 2026-07-16 — supersedes the earlier "shared token JSON" idea).** The websites do **not** consume the app's token JSON and do **not** adopt the app's token naming. Each brand keeps its **own palette layer with its own brand-appropriate names** (Base509: `basalt`/`columbia`/`lake`…; PetAppro: `brandy-blue`/`camo`/`coco`…) sitting under a **shared semantic layer** (`--surface-page`, `--text-primary`, `--action-cta`) that the components consume. **What's shared is the skeleton + semantic layer — not the tokens.**
- **Product sites use their app's brand colors.** petappro.com uses the **same brand palette (colors)** as the PetAppro app — kept in sync **by reference, not by a build dependency**. *(Accepted drift risk: the app's brand palette is the source of truth for the hexes; if they diverge, the app wins.)*
- **Base509 is a distinct PARENT brand** — Basalt Blue navy + Oswald/Montserrat on parchment (see `Design/Website/Base509 design system.zip`). It does **not** share PetAppro's look, and product brands do **not** inherit Base509's.
- **Font rules are per-brand.** "Oswald Bold headlines / Montserrat body — never substitute" is a **Base509-only** rule; product brands set their own (PetAppro = Poppins). This must not leak across brands.

**Why it matters:** this makes the **website a boilerplate too** — HairAppro's site becomes a theme swap + copy, not a project. Same build-once / deploy-per-vertical compounding as the app (D-051), applied to marketing. **Requires:** MKT-4 built with a theme layer + hostname routing **from day one** (not retrofitted); Claude Code wires the site to consume DS tokens.

---

### D-057 — Owner account deletion: ownership transfer vs tenant closure (DECIDED)

**Status:** **DECIDED — hybrid (c) adopted** (Danny, 2026-07-17). Deletion and closure are **separate operations joined by one deletion flow**. Nine product decisions below are binding on the build.

#### The decision (Danny, 2026-07-17)

> *"Individual deletion and business closure must be separate operations joined by one deletion flow."*

| # | Decision | Consequence for the build |
|---|---|---|
| 1 | **Transfer first, closure as fallback.** Successor must **affirmatively accept** — nobody is drafted into the Owner permission. | Two-sided flow: nominate → successor accepts → verify → record → notify. No auto-promotion. |
| 2 | **30-day Client export window** after closure begins. | Read-only access to pets, care instructions, report cards, photos, booking history, invoices/receipts, Provider's closure contact. |
| 3 | **Future bookings auto-cancel**, Client + Provider notified **simultaneously**. | No silent cancellations; no "Provider knew first." |
| 4 | **Full refund for prepaid, undelivered future services.** PetAppro transmits the Stripe instruction; **the Provider stays liable if it fails** (insufficient balance, Stripe can't complete). | Refund job + a fallback path when Stripe declines. Does *not* make us the merchant. |
| 5 | **In-progress services enter a safety closure state.** Deletion request is **accepted immediately**; final closure delayed only as long as needed for safe handoff/return, notification, and documentation. | Restricted account = safety, comms, documentation, refunds, closure only. Ties to README requirement #2. |
| 6 | **Immediate closure cancels SaaS renewal at once.** Term-end closure is offered but **never the only choice** — Apple requires an immediate option if scheduled deletion exists. | Both paths must ship. |
| 7 | **Debt survives but cannot block deletion.** | Never gate a deletion request on an unpaid balance. Pursue lawfully without keeping a live account. |
| 8 | **Delete the human identity; tombstone the retained records.** | ⛔ **Never retain a functional login to preserve foreign keys or invoices.** A retained record must not permit sign-in or let a closed business resume operating. Re-point FKs at tombstones. |
| 9 | **Both store paths.** Apple in-app (5.1.1(v)) **and** Google's external web resource. | Already tracked in MKT-12. |

#### ⚠️ Correction (Danny, 2026-07-17) — invoice/tax retention justification was wrong

Earlier drafts (including this decision, Provider Terms §9, Privacy §6–7, and the cancellation policy) asserted **"the law requires *us* to retain issued invoices and tax records."** **Do not publish that.**

> **The Provider is the merchant and tax-reporting party for booking revenue. PetAppro may be only its *processor* for those records.** California generally gives businesses reasons to retain tax-support records ~4 years (FTB guidance) — but that does not mean *PetAppro* must retain every Provider invoice.

The outcome may not change (records may still be held) — **the stated reason was unsupported**, and an unsupported reason in a privacy policy is a misrepresentation. `[COUNSEL: assign, per record category, which party retains it, on what legal basis, and for exactly how long. Privacy Policy + DPA must state it.]` Swept through Terms §9, Privacy §6–7, cancellation policy, README.

**D-052 note:** invoice *immutability* (don't mutate an issued invoice) is still sound — it just isn't the same claim as "the law compels PetAppro's retention." Keep the former, drop the latter until counsel rules.

---

**Original context and reasoning below.**

**Status (superseded):** **PARTLY RESOLVED** (2026-07-16) — reframed by legal research; one question remained for Danny.

**REFRAME (2026-07-16) — "Owner" is a permission level, not legal ownership.** An earlier framing ("first to create the account is the Owner") would let an unauthorized employee claim a business. Corrected across the Provider Terms §3 and the Account Ownership Policy: **Owner = the highest administrative permission in PetAppro; it does not establish legal ownership of the business, its assets, records, or client relationships.** This simplifies deletion considerably — *an individual leaving ≠ the business closing.*

**Resolved by the reframe:**
- Deleting an **individual** account terminates that person's access. It does **not** delete the business, cancel bookings, or void payment obligations.
- **The sole Owner must transfer the Owner permission, or complete business closure, before deleting** their individual account → the **hybrid** answer is confirmed.
- **Ownership-dispute evidence (Danny, 2026-07-16 — deliberately narrow):** binding court order · government business registration naming an authorized person, matched to verified identity · verified written instruction from the business. *(Open gap: sole proprietors have no registration — counsel to set alternates: DBA statement, business license, EIN letter.)*
- **Store requirements: BOTH** — Apple 5.1.1(v) requires an in-app path; **Google Play requires in-app AND an external web resource**.
- **Build:** deleting a business account must **auto-cancel the SaaS renewal** (never leave a subscription billing after the means to manage it is gone).

**~~STILL OPEN~~ → ANSWERED 2026-07-17 by decisions 2, 3, 4, 7 above:** when a business **closes** (sole Owner, nobody to transfer to), clients get **notice + a 30-day read-only export window**; future bookings **auto-cancel with simultaneous notice**; prepaid undelivered services are **fully refunded** (Provider liable if Stripe fails); unpaid balances **survive but never block deletion**. *(Other provider relationships unaffected — F-011.)*

Apple **requires in-app account deletion** (guideline 5.1.1(v); see **MKT-12**). Codex designed the flow, but one piece is a **product policy** call, not engineering:

**When a provider OWNER deletes their account, what happens to the business and its clients' data?** The tenant holds *other people's* records — client profiles, pets, booking history, report cards, and **issued invoices that can't be deleted** (D-052 immutability + tax retention).

- **(a) Ownership transfer** — require handing the business to another Owner/Admin first. Clean, but **blocks deletion for solo providers** who have no second admin (i.e. most of our Starter/Solo tiers).
- **(b) Tenant closure** — close the business, notify clients, retain what's legally required (invoices/tax records) as tombstones, purge the rest.
- **(c) Hybrid** — offer transfer; fall back to closure. *(Likely the practical answer.)*

**Constraints to resolve:** active bookings; active subscription (cancel/refund); immutable issued invoices (D-052); staff accounts; and clients who belong to **multiple** providers (F-011) must keep their other relationships intact.

**RULED OUT (2026-07-14) — "soft close" is NOT an option.** Danny floated: *"when they close the account they just can't access it, but we can"* (and a co-mapped "b version" account). **Apple 5.1.1(v) explicitly rejects this** — deactivation-only, revoke-access-but-retain, and "contact us to delete" all fail review. It's the most common way apps fail this check. **Compliant shape:** the **person's account + personal data are genuinely deleted** (incl. Sign in with Apple token revocation); **legally-required records may be retained with disclosure** (issued invoices / tax per D-052); the **business/tenant** is transferred if an Owner/Admin exists, else closed with tombstones. **Note:** this does not contradict CLAUDE.md's "deactivate, don't hard-delete" — that rule governs *bookings/records*, not a user exercising a deletion right. Two different things.

**Also required (engineering, Codex-flagged):** **Sign in with Apple token revocation** on deletion.

**Why it matters:** store-rejection risk if missing; data/legal risk if done wrong. **Requires:** Danny's policy call → Cowork specs it → Codex/Claude Code build.

---

### D-058 — We do not vet Providers (no insurance covenant, no badges, no endorsement)

**Status:** **Decided** (Danny, 2026-07-17)

**Decision:** PetAppro **does not vet, verify, screen, background-check, certify, rate, endorse, or approve** Providers, their staff, facilities, or qualifications. Any Provider meeting acceptable-use (§7) who pays may use the software. **No insurance covenant. No requests for evidence of coverage. No badging.**

**Danny's rationale:** *"That's like QuickBooks saying they vet all accountants are licensed to use the software when doing business with their clients. We also don't verify or provide badges. No vetting."*

**Why the position is stronger without an insurance requirement** (Cowork's read, offered as pressure-test — Danny's conclusion held):
- An **unenforced** covenant is evidence we assumed a duty and failed it.
- An **enforced** covenant makes us a vetter — and vetting implies a duty of care, which is precisely what §2 and §10 exist to disclaim.
- "PetAppro may request reasonable evidence of coverage" was the worst of both: it *announces* a gatekeeping role without building one.

**Known trade-off, knowingly accepted:** the §10 Provider indemnity is only worth what an uninsured Provider can pay. That's a **business/underwriting risk**, not something contract text repairs. Revisit only if loss experience justifies it — and if it ever does, understand it means becoming a vetter.

#### Binding constraints on product, design, and marketing

| Constraint | Applies to |
|---|---|
| ⛔ **No "verified," "trusted," "certified," "approved," "screened," "background-checked," or equivalent badging** on any Provider surface. | Design · Fable |
| ⛔ **No PetAppro-authored ratings, rankings, scores, or "top provider" surfacing.** | Design · Product |
| ⛔ **No copy implying we check, curate, or stand behind Providers.** | Marketing · MKT-4 |
| ✅ Client-facing copy must **affirmatively** say we don't vet, and direct qualification/insurance questions **to the Provider**. | Product · Client Terms |

**Coherence check:** this is the same principle as **D-029** (booking software, never a marketplace/broker) applied to trust signals. A directory implies discovery; a badge implies vetting. **Both make us the thing we say we aren't.** D-029 killed the directory; D-058 kills the badge.

**Consequence:** the moment a badge ships, Provider Terms §10 becomes a false statement. This is a permanent constraint, not a launch-scope decision. **Legal README requirement #18.**

**✅ Related — theme selection shows a "themes by plan" upsell matrix (Danny, 2026-07-21):** on the provider theme picker (web Branding tab), locked themes display which plan unlocks them + an Upgrade CTA. This is a **deliberate upsell**, not vetting/badging — it's transparent tier information, fully consistent with D-058 (it advertises *our* plans, not a provider judgment). Entitlements per `pricing-tiers-and-features.md`.

---

### D-063 — Boarding Extra (late-pickup / beyond-window overage) + no same-day daycare/boarding (Danny, 2026-07-30)

**Status:** **Decided; spec complete. Engine implementation PENDING.** Modeled on the existing **`partial_unit_overage`** pricing model — **no new primitive** — but the engine still keys off *actual* pickup and the golden tests still encode the old "late pickup" case. The booked-time correction + "Boarding Extra" label + `surcharge` category + per-booking waiver + golden tests are the open **D-063 code correction** (Claude Code, per `booking_and_pricing.md` §5B). *(Codex, 2026-07-31: docs must not read as "implemented" while the engine differs.)*

> ⚠️ **Naming — do NOT confuse with the "extended" (long-stay *reduced*) rate.** Two opposite concepts: **Boarding Extra** = an *added* charge when a stay runs past the covered window (late pickup / >24–28h; `partial_unit_overage`). The **extended rate** = a *reduced* long-stay fee (e.g. 8+ days; the engine's `extended` rate-tier condition, holiday > extended > regular) — **engine-only, NOT surfaced in MVP onboarding; all long-stay reduced/flat pricing is a price override for MVP (D-062k).** Opposite directions → deliberately distinct names. *(Name LOCKED "Boarding Extra" — Danny, 2026-07-31: rejected "Late Pickup fee" (implies an after-hours/time-of-day charge) and "Extra Hours".)*

- **No same-day daycare + boarding.** Boarding covers the calendar day; a boarded pet never also consumes a **daycare slot** the same day. *(Capacity note: boarded pets still count against the shared **location pool** while physically present — see `capacity-model.md` — they just don't generate a separate daycare booking.)*
- **Boarding Extra is an optional Provider fee** for stays running past a Provider-set covered window. Providers who elect it get a **"Boarding Extra"** line on their rate card.
- **Coverage window = Provider-set hours** the base boarding covers (e.g. 24–28h), measured from the **booked/scheduled drop-off time, not actual physical check-in** *(Danny: "the fee is calculated from the booking drop-off time")* — so the charge is **deterministic at booking** and appears in the up-front all-in price (LG-2).
- **Config surface** (onboarding + services management): a yes/no — *"Will you charge extra if a boarding runs beyond your covered window (e.g. 24–28h)?"* **No → nothing.** **Yes → reveal:** covered-hours `[N]` + **`Boarding Extra = [$amount]`**.
- **Single flat rate for MVP.** "Boarding Extra = $amount" is logged as a **flat one-time fee** applied when scheduled pickup exceeds the window. ✅ *Confirmed flat, NOT per-hour (Danny, 2026-07-31) — interpretation flag resolved.* The **Rover-style tier** (a 4–8h band, then conversion to a full daycare charge) is **explicitly deferred** — it adds complexity and drags capacity back in (a converted dog would consume a daycare slot).
- **Waive:** available at setup **and per booking** (per-booking waive shown **only when** the Provider charges extended care) so a Provider can waive for specific clients.

**Follow-through — DONE 2026-07-30:** `booking_and_pricing.md` **§5B** (`partial_unit_overage` config = covered-hours + flat overage on booked-time basis; grace-edge/day-rollover golden tests) and `provider-onboarding-configuration.md` **§5.1a** (the yes/no + covered-hours + flat fee + per-booking waive) written; §6 MVP-scope updated. **Codex to ratify** alongside `capacity-model.md` + pricing golden tests.

---

### D-064 — Meet & Greet is a free service at MVP (Danny, 2026-07-30)

**Status:** **Decided.** M&G is **not a paid service** — no fee, no fee field, no rate-card line. The M&G gate is **business-configurable (D-006)**; **when a Provider enables it, it is HARD** (required before a first booking) but always **free**, so it never becomes a paywall in front of the booking funnel. *(Reconciles D-064 with D-006 — the gate is optional per Provider; "hard" describes its behavior once enabled, not a universal requirement. Codex 2026-07-31.)* *(Reversed the initial "M&Gs have a fee" after pushback — free, no-obligation intros are the industry norm and a client-acquisition tool; forcing a fee behind a hard gate would deter both clients and the providers who use free M&Gs to win them.)*

**Follow-through — DONE 2026-07-30:** `provider-onboarding-configuration.md` §4 M&G **fee field removed**; `booking_and_pricing.md` §6 notes M&G = **$0 / non-priced**. Still open: confirm the wireframes surface no M&G fee.

---

### D-065 — Scheduled care-task reminders IN launch scope (flex) (Danny, 2026-07-30)

**Status:** **Decided (scope).** Care-task / Activities reminders are **in MVP scope**, delivered as **transactional/functional** notifications through the existing notification outbox — so they need only OS push permission, **not** the marketing-consent gate (D-049), and don't trip App Store 4.5.4 (push is not required for the app to function). Flagged **flex** under hybrid delivery (D-023): first to cut if the Sept crunch tightens. **Messaging stays OUT (D-053)** — these are one-way system notifications, not chat.

**Follow-through:** `mvp_roadmap.md` scope note.

---

### D-062 — Transactions, payments & invoicing (Danny + Codex, 2026-07-20)

**Status:** **Decided.** Full detail in `docs/specs/transactions-payments-and-invoicing.md` (v2). Codex verdict on v1: CHANGES-NEEDED → applied.

**⭐ D-062a — No prepayment for unbooked services.** A Client can only pay for bookings in the cart. **No stored balance, no account credit, no top-up.** Refunds return to the original payment method. Clients wanting to pay ahead simply book the dates and can modify later.
→ **Eliminates:** stored-value classification (Cal. Civ. Code §1749.5/§1749.45), FinCEN prepaid-access, escheat, balance refundability, balance-at-closure, the unapplied-credit subledger. *(L2, L3, L4 moot — not deferred.)*

**D-062b — Non-custodial posture, precisely worded.** *"PetAppro is not the merchant, payee, custodian, beneficial owner, or holder of Client funds."* **Not** "not in the transaction at all" — we do create API instructions, render checkout, store metadata, and facilitate refunds. Connect **direct charges (D-007**, not D-042). Invariants: direct charges only · one Provider per Order · no destination charges · no separate charges/transfers · no pooled wallet · no `application_fee_amount` · no cross-Provider transfer · Client money never pays a PetAppro subscription.

**D-062c — Immutable ledger with separate accounts, not a signed-entry table.** *(Codex caught that one signed table lets tips reduce service debt — recreating the very bug it was meant to prevent.)* Separation is **structural**. Receivable posts **at invoice issuance**, not at completion. Engine PRICES · billing ISSUES · ledger RECORDS; the pricing engine never reads payment/Stripe/ledger state.

**D-062d — Tips are never inferred.** A tip exists **only** from an explicit payer field. Never from `payment > amount due`. Tip field **always present and optional** on both Client checkout and Provider-side entry; **default zero, no pre-selected percentage** (no dark patterns). Overpayment is **rejected at entry**, never reinterpreted.

**D-062e — Approval is the atomic reservation boundary.** request → approve (capacity reserved + invoice issued) → payable → checkout (reserves nothing) → payment (financial state only). **Auto-book is NOT a second path** — same atomic operation under a Provider rule; **per-service toggle, default OFF**, late in onboarding, offered services only (onboarding spec §5.4), with a **bi-weekly availability-confirmation reminder** *(scaled to risk — only meaningful when auto-book is on)*.

**D-062f — Payment states are distinct, not one flag:** prepaid · paid · unpaid-not-yet-due · past due · written off. **Required because cancellation fees depend on which** — a fee inside 24/48h is handled differently for a prepaid vs unpaid vs past-due booking.

**D-062g — Reminders to Clients are MANUAL only.** Provider-initiated; no automated dunning. Show last-sent per Provider↔Client. *(Distinct from R7: the automatic 24h past-due notification goes to the **Provider**, not the Client.)*

**D-062h — Write-off, no forgiveness feature.** "Mark as uncollectible" (admin/manager) relieves the receivable, **never deletes or voids** the invoice, drops out of past-due, appears in reports as bad debt, **reversible on recovery**. **No separate forgiveness action** — *"the provider can always do a price override and set to $0 if they want to offer a freebie"* (Danny).

**D-062i — Three distinct money-not-collected events.** Price override to $0 (pre-invoice) = **free by choice, no receivable** · credit note (post-invoice) = **discount** · write-off = **bad debt**. ⚠️ Comping a regular after invoicing is a **discount, not bad debt** — conflating them tells a Provider's books a loyal client stiffed them.

**D-062j — Reason codes REQUIRED on every price adjustment.** Fixed list + "Other (note)". Categories: **Discount** (chose to charge less) · **Correction** (price was *wrong* — not a discount) · **Write-off** (uncollectible). Reports roll up by reason.

**D-062k — Long-stay flat pricing: OUT of MVP.** No published duration rate-card feature. Providers agree the rate with their client and apply a **price override with a dedicated "Long-stay flat rate" reason** — own code so routine long-stay pricing stays separable from true concessions. **Override must be applicable at booking/approval**, so the Client sees the agreed price before paying. Explained to Providers in the support FAQ. **(Clarified 2026-07-30, Danny:** long-stay flat = **15+ days, or whatever the Provider decides** is worth negotiating a flat rate; stays a **price override** for MVP. The engine's `extended` reduced-rate tier is likewise **not surfaced in onboarding** for MVP — *all* long-stay reduced/flat pricing is handled by override at launch.) *(Post-MVP: configurable tiered/duration pricing is the correct home — the engine already supports tiered models.)* **(Clarified 2026-07-31, Danny — NO night cap.** PetAppro imposes **no maximum-nights limit** on boarding; there is nothing beyond the base/`extended` rates unless a Provider chooses to (all manual, via override). The "15-night cap" referenced in some planning docs + the old `S1-3` test-fix item **never existed in PetAppro** — it was a mis-transcription of **Woof WeTreats'** limit, which capped *client self-service* boarding at **14 nights** (staff-bypassable) and was deliberately **not** ported. Any future "8+ days auto-triggers a flat rate, at $X" is **post-MVP and per-Provider configurable**, never a platform-imposed cap. Confirmed no cap in `packages/pricing`/`reference/`/tests; `S1-3` is `DONE`.)*

**D-062l — Invoice numbering `WOO-0417-26-00001`.** Brand prefix **truly frozen** at signup (rebrand changes display branding only) · public Provider number · YY in Provider timezone · per-`(business_id, issue_year)` sequence, atomic in one transaction, unique constraint, **no plain Postgres sequence** if gapless required · allocated **only at issue** · **void, never delete** · tenant identified **exclusively via `business_id`** — never parse the number.

**D-062m — Payment timing: Client chooses.** Pay now · Auto-pay at completion · Pay later. **Auto-pay is never defaulted on.** Auto-pay = **SetupIntent + off-session consent**, not a months-long hold; recovery flow required. Saved methods are **Provider-scoped** (Customer + PaymentMethod inside each connected account; cloning prohibited; `business_id` enforced in server auth **and RLS**). Idempotency: Stripe keys **plus durable local**; webhook dedup on `(stripe_account_id, stripe_event_id)`.

**Still counsel-gated:** L1 (money transmission conclusion), L5, L6, L7, L9, L10, and the auto-pay consent copy.

---

### D-061 — Provider portal NOT live at website launch → waitlist

**Status:** **Decided** (Danny, 2026-07-17)

**Decision:** The websites launch **before** the provider portal/app are ready. So the public sites launch in **waitlist mode**, not live-signup mode.

**Consequences for the site build:**
- **Sign-up page** → **waitlist email capture** (not a portal hand-off). A **hidden Sign in** stays available for us/test accounts.
- **Download page** → **"Notify me"** (no live app-store links yet).
- **Attorney-review note:** because nothing transacts at launch, the clickwrap/acceptance flow (Client Terms §1, Provider Terms §1) is built but not user-facing until the portal goes live — counsel reviews the language now; the acceptance *mechanism* ships with the portal.

**Why:** the provider configuration tool + app are next week's build (see the provider-onboarding plan). Launching marketing sites with a waitlist captures demand without promising a product that isn't live — consistent with D-029/D-058 (no over-promising) and Apple 2.3 (don't advertise unreleased function as available).

---

### D-060 — Legal document architecture: two public agreements, one privacy policy

**Status:** **Decided** (Danny + Cowork, 2026-07-17)

**Decision:** **Two public agreements**, each at its own stable URL, routed from a short `/policies/terms` landing:
- **[Client Terms](/policies/client-terms)** — govern Client use;
- **[Provider Terms](/policies/provider-terms)** — govern the subscribing business and its authorized business users.

**`terms-of-service.draft.md` is RETIRED as a public agreement.** Not converted to a "common core" — that would be a fourth document to keep in sync, and sync drift is what produced the *"ever"* contradiction between our own summary and §5. **Two audiences, two agreements.**

**One Privacy Policy** covering everyone. **One Accessibility Statement, one Security Overview, one Sub-processor list.** Only the *Terms* fork, because only the Terms have two genuinely different counterparties.

#### Danny's question: does this hurt Apple/Google review? — **No. Verified.**

| Store requirement | Reality | Us |
|---|---|---|
| **Privacy Policy URL** | **One URL, required**, in store metadata **and** accessible in-app. | ✅ Our Privacy Policy is **one document** covering Clients + Providers. The thing the stores actually demand as a singleton, we already have as a singleton. |
| **Terms / EULA** | **Not a URL field.** App Store Connect offers the **Standard Apple EULA** or a **Custom License Agreement pasted as plain text** (HTML stripped). Neither store mandates a single Terms document. | ✅ Two Terms documents is not a store issue. |
| "Functional link to Terms of Use (EULA)" rejections | A common rejection — but it attaches to **auto-renewable subscriptions sold in-app.** | ✅ **We sell no subscription in the iOS binary (D-042).** That rejection path shouldn't reach us — *and the reason it doesn't is worth protecting.* |

**Sources:** [Provide a custom license agreement](https://developer.apple.com/help/app-store-connect/manage-app-information/provide-a-custom-license-agreement/) · [Apple standard EULA](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/) · [EULA API](https://developer.apple.com/documentation/appstoreconnectapi/end-user-license-agreements-eula) · [Missing functional link to Terms of Use — dev forum](https://developer.apple.com/forums/thread/719788)

#### Danny's question: "one page with two tabs?"

**Landing page that routes — not tabs, and the reason is technical, not aesthetic.**

Each agreement needs its **own stable, versioned, archivable URL**, because:
1. **The acceptance record must point at a specific version of a specific document.** "Danny accepted `/policies/terms`, tab 2, v1.3" is a worse evidence artifact than `/policies/client-terms/v1.3`. Our clickwrap evidence standard (README #5) depends on this.
2. **§11 requires prior versions stay published.** Versioned archives per document are trivial; versioned archives of a tab state are not.
3. **The two documents will version independently** — a Provider Terms pricing change shouldn't bump the Client Terms version.
4. Tabs hide content behind a click, which is a mild conspicuousness argument against them.

`/policies/terms` = a short landing: *"PetAppro has two agreements — pick the one that's you."* Two cards, plain language, no tabs.

#### In-app: serve one, never both

**Yes — the signup flow serves only the document for the branch the user chose (D-033: the app forks Client / Provider).** A Client never sees, scrolls past, or accepts the Provider Terms. The acceptance record names **which document + which version.**

**Edge case, already handled:** a person can be both (a Provider who also books care elsewhere). Client Terms §1 carries the tiebreak — *"If you also use PetAppro for a Provider business, the Provider Terms govern that business use."* Two hats, two agreements, no ambiguity about which governs what.

**On "I don't see any developer sites with two documents":** true of most *consumer* apps — they have one audience. Two-sided platforms commonly do fork their terms, because the counterparties are genuinely different. **We fork because a consumer and a business cannot be given the same liability, indemnity, and payment terms** — see Client Terms §10 vs. Provider Terms §10. Merging them would mean either over-reaching against consumers or under-protecting against businesses.

**Action:** Cowork retires `terms-of-service.draft.md` (mark superseded, keep for reference — it was the source for both forks). Website spec `/policies` hub updated.

---

### D-059 — Venue and the published notice address

**Status:** **Venue decided** (Danny, 2026-07-17) · **notice address OPEN**

**Venue:** **San Francisco, San Francisco County, California** — Base509 LLC's headquarters. Provider Terms §12 updated. *(An earlier "San Diego County" was my placeholder, never a fact.)*

**Notice address — RESOLVED (2026-07-17).** Two addresses, two purposes, home address in neither:

| Purpose | Address |
|---|---|
| **Ordinary notices** (support, billing, privacy, disputes) | `support@base509.com` · **Base509 LLC, 1875 Mission St Ste 103 #660, San Francisco, CA 94103** — PostScan Mail Starter ($100/yr), secured 2026-07-17, Form 1583 filed |
| **Service of process** | **Base509 LLC c/o Launch Registered Agent, 1120 Sycamore Ave., STE 2G, Vista, CA 92081** (already on file — `Company/Formation/Base509-LLC-Key-Identifiers.md`) |

Applied to **Provider Terms §12**, **Client Terms §12**, **Privacy §14**. The Privacy Policy's `[PUBLIC BUSINESS MAILING ADDRESS BEFORE LAUNCH]` placeholder is filled.

**Also satisfies CAN-SPAM** — every marketing email needs a valid physical postal address, and a CMRA-registered private mailbox qualifies. That was the real forcing function (MKT-4), not the SOI: a marketing footer puts the address in every provider's inbox, which is far more exposing than a filing nobody searches.

✅ **RESOLVED — SOI filed 2026-07-17.** The LLC-12 was filed with **1875 Mission St** in **both** the principal-office and mailing fields, and is **confirmed on the public CA SOS record** (Principal + Mailing both show 1875 Mission; all standings Good; status Active) — the home address is **off** the record of record. **Next SOI due 2028-07-31** (biennial). Source of truth: `Company/Formation/Base509-LLC-Key-Identifiers.md`. *(Corrected 2026-08-15 — this note previously read "STILL OPEN / not filed," which was stale doc-drift; BIZ-10 is closed.)*

**Two caveats counsel should close:**
1. **Registered agents are contracted for service of process** — many decline or don't reliably forward *general* business correspondence. §12 is drafted defensively (agent = formal legal notice only; email = everything else). Confirm Launch's terms cover it, or add a **virtual business address in SF County** for contract notices.
2. **Agent is in Vista (San Diego County); venue is San Francisco County.** Not a conflict — venue follows the **principal place of business**, not the agent — but confirm the pairing reads correctly. *(Coincidence worth noting: my bogus "San Diego" venue placeholder happened to match the agent's county. It was still an invention, not an inference.)*

#### ⚠️ STILL OPEN — the home address is likely already public

**The registered agent solves service of process. It does not hide the principal office.**

The **principal office** on file for Base509 LLC is **Danny's home address**. California's **Statement of Information (LLC-12)** requires a principal office address, and those filings are **searchable public record** via the Secretary of State's business search. So the address Danny declined to publish may already be published — by the state, not by us.

#### ✅ CONFIRMED EXPOSED (2026-07-17) — and it's in the Articles, not just the listing

Danny checked the SOS: the business search shows **434 Hanover Street, San Francisco, CA 94112** as both Principal and Mailing address.

**Read the source document** (`Company/Formation/2026-07-04 Articles of Organization B20260309172.pdf`, File No. B20260309172, filed 7/4/2026). It carries the home address **twice**:
- *Initial Street Address of Principal Office of LLC* → 434 Hanover Street
- *Initial Mailing Address of LLC* → 434 Hanover Street
- *(Agent for Service of Process* → LAUNCH REGISTERED AGENT INC — that part was done right.)*

> ⚠️ **The Articles are a permanent public filing. They cannot be unfiled.** Anything we do from here is **mitigation, not a scrub** — a determined searcher can still pull the original Articles from the SOS record. Say this plainly rather than implying the problem goes away.

##### ⏰ Timing is actually favorable — act before the initial SOI

California requires the **initial Statement of Information (Form LLC-12) within 90 days of formation.** Formed **7/4/2026** → due roughly **early October 2026**. `[VERIFY the exact due date.]`

**If it hasn't been filed yet, this is the good outcome:** file the initial SOI with a **virtual SF address**, and the home address appears in **one** historical document instead of becoming the standing public record that every future biennial filing reprints. **The window is open now and closes in ~10 weeks.**

##### Recommended sequence

1. **Get a CMRA / virtual street address in SF County** (~$10–100/mo, notarized USPS Form 1583).
2. **File the initial LLC-12** with the virtual address as **both** principal office and mailing address. `[Counsel confirms CMRA acceptability first — see the source-bias caveat below.]`
3. **Update the address everywhere else it propagates:** D&B (D-U-N-S **11-314-3683**), bank, IRS/EIN records, Apple Developer + Google Play enrollment (**BIZ-5**, **MKT-12** — store listings surface address data).
4. **Submit removal/opt-out requests to business-data aggregators** (Bizapedia, OpenCorporates, and similar scrape SOS data). ⚠️ **Partial at best** — many don't comply, and cached copies persist. Assume the address is already scraped.
5. **Amending the Articles (Form LLC-2) is possible but probably not worth it** — the original filing stays in the record either way.

##### Why this is more than housekeeping for *this* product

Common for solo LLCs, and thousands operate this way — but **PetAppro's incident profile is unusual.** The worst day on this platform involves an injured or dead animal and a person in acute grief looking for someone to blame. Provider Terms §2 and §10 work hard to point that person at the Provider rather than at us; a findable home address is a poor backstop if that framing ever slips. **Not paranoia — just a cheap thing to fix now rather than after the fact.**

`[DANNY — decide: get the virtual address before the initial SOI is due. → new BIZ task.]`

##### What a "virtual SF address" is, and whether it helps (researched 2026-07-17)

A **CMRA** (Commercial Mail Receiving Agency) / private mailbox: a real **street address** with a suite or PMB number, staffed to receive mail, which they scan or forward. Not a PO Box. Vendors: Regus, Alliance, Anytime Mailbox, iPostal1, Stable. Roughly **$10–100/mo** depending on scanning/forwarding/desk access. Setup requires a **notarized USPS Form 1583** authorizing them to receive mail for you.

**Where it's actually useful — and it isn't the Terms.**

| Use | Verdict |
|---|---|
| **Ordinary contract notices in the Terms** | ❌ **Don't bother.** Both Terms already give `support@base509.com` for ordinary notices and the registered agent for service of process. That's a complete, normal structure. A physical notice address is optional polish. |
| **Replacing the home address as principal office on the CA Statement of Information** | ✅ **This is the real one.** This is where the home address is actually exposed — the SOI is public record, and the registered agent does nothing about it. |
| **Registered agent address** | ❌ Already solved (Launch). A private mailbox typically **cannot** serve as the registered agent address anyway. |

**Verified:** the CA Statement of Information requires a **street address** for the principal office — **PO Boxes are not accepted** — and a **private-mailbox street address is generally acceptable** for it (a separate mailing address may be a PO Box).

> ⚠️ **Source-bias caveat, stated plainly:** the sources most confidently asserting "yes, a CMRA works for your CA principal office" are **companies that sell mailboxes.** The street-address / no-PO-Box requirement is consistent across neutral sources; the CMRA-specific "yes" is commercially motivated. **Have counsel confirm before filing** — the cost of being wrong is a rejected filing or a defective public record, and this is exactly the kind of question where a vendor's blog is not the authority.

**Recommendation:** if the SOS search shows the home address and that bothers Danny, a virtual SF-County address for the **principal office** is the fix — cheap, ordinary, and it's the only lever that touches the actual exposure. **A refiling changes the record going forward; it does not retract prior filings.** Skip it for the Terms.

**Sources:** [LLC University — CA Statement of Information](https://www.llcuniversity.com/california-llc/statement-of-information/) · [LegalClarity — virtual address for a CA LLC](https://legalclarity.org/can-i-use-a-virtual-address-for-my-llc-in-california/) · [LegalClarity — filing the SOI](https://legalclarity.org/how-to-file-statement-of-information-for-llc-in-california/)

**Store listings collect address data too** — confirm what becomes publicly visible on the App Store / Play listing (**BIZ-5**, **MKT-12**).

**Also decided (2026-07-17):** **no mandatory arbitration, no class-action waiver** — and *don't include one*. Counsel may propose adding it back; that reopens a discussion rather than a default. Provider Terms §12 states the position affirmatively.

---

### Operator console + monetization — locked 2026-08-15 (Danny PO)

Nine decisions from the operator/admin-console requirements pass (`docs/planning/base509-operator-admin-console.md`). Dispositions per Danny 2026-08-15.

- **D-066 — Operator console: build lean. DECIDED.** No custom console pre-launch. Launch runs on **Stripe Dashboard + Supabase** (~80% of "state of the business"). Build the custom owner dashboard **incrementally, post-launch** — only the gaps Stripe doesn't give in the shape Danny wants: WoW/MoM/YoY comparison views, simple run-rate projections (the Woof WeTreats read), cross-country roll-up, and the QuickBooks export. Data comes from Stripe's **API / Sigma / scheduled reports** + Supabase.
- **D-067 — Discounts over Stripe. DECIDED.** Model on **Stripe Coupons + Promotion Codes**; never hand-build discount math. Supports both **shared/seasonal, time-bound** codes (one code, `expires_at` + `max_redemptions` + tier/first-time restrictions) **and unique per-customer** single-use codes — one coupon can back both. The Billing-page discount field **validates + applies against Stripe promotion codes**; if the subscription checkout uses Stripe Checkout, enable its native `allow_promotion_codes` field.
- **D-068 — Provider self-serve billing via Stripe customer portal. DECIDED.** Upgrades (and self-cancel) run through Stripe's hosted customer portal rather than routing every plan change through the console.
- **D-069 — Financial exports: CSV-first. DECIDED.** Accountant/QuickBooks handoff ships as CSV export; a direct QuickBooks integration is later, not launch.
- **D-070 — Destructive-action guardrails. DECIDED.** Refund / cancel / delete / break-glass require **reason + audit log**. As a solo operator Danny *is* the second approval, so no dual-approval gate now — reason + immutable audit trail only. Console access itself is MFA-gated (D-024 break-glass pattern).
- **D-071 — Multi-country architecture: DEFERRED (in view, not in a hurry).** Do **not** lock separate-entity-per-country vs. one multi-currency platform now. **US-only at launch**; design the **country dimension into the master/billing layer now** (the seam). **Trigger to decide: country #2 is real.** Needs professional **tax + legal counsel** before expanding; Stripe Tax handles collection, registration is a counsel call.
- **D-072 — Data retention: keep for now. INTERIM.** Retain canceled-subscriber data until told otherwise; set formal retention periods (per-country, with accountant/legal input) by **end of Q1 2027**.
- **D-073 — Per-country tax registration: OUT OF SCOPE now.** Revisits with D-071.
- **D-074 — Customer-source attribution: first-party UTM, pixels deferred. DECIDED.** Capture "where did this provider come from" via **first-party UTM tags** on ad links (Meta/TikTok/LinkedIn), stored **at signup** on the Stripe customer metadata + Supabase; the owner dashboard segments new subscribers by source. **No third-party ad/conversion pixels** — a Meta/TikTok pixel is "sharing for cross-context behavioral advertising" under CCPA (contradicts Privacy §4/§8 + the sub-processors "no tracking pixels" line, and would require policy edits + a consent banner + opt-outs). Pixel-based ad optimization is a **separate, deliberate** future decision, not a wording tweak. Capture must happen at signup — it cannot be backfilled (build requirement for the sign-up flow).

### Codex governance corrections — 2026-08-15 (D-066–D-074)
Codex reviewed the operator-console/monetization set. Verdict: mostly APPROVE; these wording/scope fixes are required before technical ratification.

- **D-067 — scope clarification.** Stripe coupons/promotion codes govern the **Base509→Provider SaaS subscription only**. Provider→Client **booking** discounts stay in `packages/pricing` (shared engine). "Never hand-build discount math" applies to the subscription layer, not booking money.
- **D-068 — config gate.** This is the **Base509 Billing** customer portal (not a connected-account portal). Lock proration, downgrade timing, trial-switch behavior, cancellation timing, and the permitted price catalogue before enabling (Stripe restricts plan changes for multi-product/usage-based/scheduled/invoice/tax-mismatched subs).
- **D-069 — add.** CSV exports need Owner/Admin auth, audit logging, safe field selection, and **spreadsheet-formula-injection escaping** (cells beginning `=` `+` `-` `@`).
- **D-070 — wording correction.** Replace "Danny is the second approval" with **"No dual-approval gate while Base509 has one operator."** Reason + step-up MFA + immutable audit (actor/target/before-after/correlation ID) still required. Provider-issued Client refunds vs Base509 operator actions need separate permission models.
- **D-071 — add seam detail.** Add an **ISO country dimension** to the Base509 commercial/billing record; keep three distinct fields — Base509 billing country, Provider merchant country, service/tax jurisdiction (don't overload one).
- **D-072 — CHANGES-NEEDED.** "Retain until told otherwise" is too broad — it cannot override account-deletion requests, contractual/security deletion, or data no longer reasonably necessary (CPPA proportionality). **Reframe as a temporary legal/operational hold** with defined exclusions + the end-Q1-2027 deadline.
- **D-074 — launch-flow correction.** Because launch is **waitlist-only**, capture attribution **at waitlist submission** or it's lost before Provider signup. Store **allowlisted, length-limited UTM fields only** (never raw query strings); **Supabase canonical, Stripe metadata a projection**. Treat UTM as untrusted analytics, not auth/billing truth. **If attribution is collected on the waitlist, update the interim Privacy Policy** ("we collect your email — that's it"). No pixels remains correct.
- **D-066 / D-073 — APPROVE as written.**
