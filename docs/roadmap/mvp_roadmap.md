# PetAppro MVP Roadmap

Phased planning roadmap for PetAppro as a multi-tenant SaaS platform for independent pet care businesses.

Woof Wetreats (`reference/woof-wetreats-reference`) is the behavioral reference for proven booking, staff, and client workflows. PetAppro must rebuild those patterns with tenant separation from day one — not copy single-business architecture.

**Status (updated 2026-08-15): the October launch is RED / tightening. Oct 21 remains the working target.** The Base509 site, published-policy registry, and PetAppro marketing implementation are ready locally, and the provider portal is in progress. The immediate launch bottleneck is the first GitHub push of `apps/web` (Claude Code, only on Danny's go); it gates Vercel (`Root Directory = apps/web`) → preview/domains → Supabase/Resend waitlist activation.

**Canonical roadmap:** this file. The dated delivery schedule, sprint breakdown, and paste-ready schema/backlog tables live in the annex `docs/roadmap/PetAppro-Roadmap-and-Project-Plan.md`. Business strategy, framework choice, and GTM live in `docs/planning/PetAppro-Strategy-and-Business-Plan.md`.

**Related docs:**

- `docs/prompts/cursor_project_instructions.md`
- `docs/planning/woof-wetreats-to-petappro-rebuild-plan.md`
- `docs/planning/woof-wetreats-reference-review.md`
- `docs/specs/platform_notification_and_activity_plan.md`
- `docs/roadmap/PetAppro-Roadmap-and-Project-Plan.md` (dated schedule + schema starter)
- `docs/planning/PetAppro-AppStore-Setup-Walkthrough-for-Beginners.md` (store setup)

---

## Phase Overview

**Re-baselined 2026-07-31.** Product/specification output is ahead of implementation; the board is now reconciled to repository evidence.

| Phase | Name | Status |
|---|---|---|
| 0 | Product Definition | ✅ **Done** — product brief, positioning, D-029/D-058 guardrails, JTBD research |
| 1 | Architecture Planning | ⚠️ **Design done; implementation foundation RED** — architecture/data-model docs exist, but there is no `supabase/`, migration layer, tenant schema, or RLS. |
| 2 | UX Flows | ✅ **Coverage complete** — Wireframes 2.0 + Phase 2 cover the core provider/client/staff/web flows; refinements continue without gating CFG-1. |
| 3 | Design System Foundation | ✅ **Published as a library** — governed tokens/components are available for product and web implementation; support continues. |
| 4 | MVP Specification | ✅ **Largely done** — onboarding, dashboard, reports, transactions/payments, capacity, component, and legal build-gate specifications exist. |
| 5 | Build Planning | 🔄 **Re-cut active** — Jul 31–Aug 14 Foundation Recovery Sprint replaces the stale Sprint 1 board. |
| 6 | MVP Build | ⚠️ **Partially started / foundation blocked** — pricing, tokens, UI, CI, and web scaffold exist; `supabase/`, `packages/booking`, generated data types, and the mobile app scaffold do not. |
| **LR** | **Launch Readiness (parallel)** | ⚠️ **BLOCKED at first web push** — Base509/policies and PetAppro marketing are ready locally; `apps/web` has never reached GitHub. That push gates Vercel, domains, and waitlist activation. |

### Sequencing ruling — 2026-07-31

Design and specification ran far ahead of build. The recoverable response is a **re-cut**, not pretending the old dates remain credible: protect the unpushed local work, then keep all implementation capacity on the tenant foundation through Aug 15.

Verified 2026-07-31: `packages/pricing`, `packages/tokens`, `packages/ui`, CI workflows, and the web scaffold exist. `supabase/` and `packages/booking` do not; `apps/mobile` contains configuration but not the app scaffold. The active risk is therefore the missing tenant/schema/RLS foundation and the large unpushed batch, not flow coverage.

Architectural guardrail: boarding, daycare, and walking are presets/instances of a generic service engine. Persist the five axes as first-class configuration. Capacity is `bounded | unlimited` with an optional tenant-scoped `capacity_group_id`; do not reuse scheduling `conflict_group_id`, and do not hard-code the launch service types into persistence or authorization.

### Web + money sequencing update — 2026-08-15

The local Base509 multi-domain site is push-ready, policies are published in the local registry, and the PetAppro marketing site is built from real Figma content. The Aug 12 type error is resolved; Codex verified a green production build on Aug 15 (53 routes). The design system is published as a library. These assets are not yet deployed.

The controlling sequence is now: **Danny go → Claude Code first-pushes `apps/web` → connect Vercel with `Root Directory = apps/web` → preview → domains/HTTPS/route QA → approved production promotion → hosted Supabase/Resend waitlist activation.** The provider portal continues in parallel with optional/offline booking payments; provider SaaS Billing remains a separate authenticated web-only rail. This track does not displace the tenant schema/RBAC/RLS foundation.

Money boundary is non-negotiable:

- **Stripe Billing:** provider business pays Base509 for PetAppro SaaS; authenticated web only.
- **Stripe Connect:** provider's client pays the provider for physical pet-care services.
- The two rails must not share Customers, saved payment methods, webhooks, ledgers, authorization logic, or subscription/booking state. Expo ships no SaaS checkout, Customer Portal link, purchase/upgrade CTA, or direction to buy.

Phases 0–6 are the **product-build spine** (sequential, gate-driven). **Launch Readiness (LR)** is a **parallel track**, not a later phase: its items are hard dependencies for store submission and launch, so they must be worked concurrently with the build. See the dedicated **Launch Readiness Track** section below.

---

## Launch Timeline & Store Clock (recovery baseline)

The calendar is re-cut around the non-negotiable foundation. Oct 1 remains the failed Target-1 benchmark; Oct 21 is conditional, not promised.

**Binding checkpoints:**
- **Aug 15** — formal foundation GO/NO-GO.
- **~Oct 1–3** — Target-2 store submission window, leaving roughly 2–3 weeks for review/fixes.
- **Oct 21** — conditional public-launch target.

**Recovery calendar:**

| Roadmap phase | Calendar window | Runs as |
|---|---|---|
| Foundation Recovery | Jul 31 – Aug 14 | Sync local work; migrations; generic service/capacity schema; identity/membership/RBAC; RLS; generated types; D-063 tests |
| Formal gate | Aug 15 | Both D-U-N-S and tenant schema/RBAC/RLS must be green |
| Core vertical slice | Aug 15 – Aug 28 | Auth/tenant context, onboarding shell, boarding configuration on the generic engine |
| Booking + money slice | Aug 29 – Sep 11 | Booking/capacity/pricing/transactions and Stripe test path |
| Operations + launch gates | Sep 12 – Sep 25 | Dashboard, report cards, transactional reminders; GPS/store-policy verification early |
| Device beta + integration | Sep 21 – Oct 2 | Real iOS/Android tenant-isolation and paid-booking proof |
| Target-2 submission + buffer | ~Oct 1 – Oct 21 | Submit ~Oct 1–3; review, rejection/fix buffer; launch Oct 21 only if green |

**Parallel web critical path:**

| Milestone | Target | Exit criteria |
|---|---|---|
| **First `apps/web` GitHub push — CURRENT BOTTLENECK** | Immediate on Danny's go | Claude Code pushes the previously untracked web app; no commit/push by other agents |
| Vercel preview + domains | Immediately after first push | Connect with `Root Directory = apps/web`; preview passes; domains, HTTPS, host routing, policies, support/contact routes verified |
| Base509 production + Apple unblock | Immediately after approved preview | HTTPS/DNS healthy, policy URLs stable, no dead links, Danny authorizes promotion |
| PetAppro Figma→code site | Built locally; QA after preview | Real Figma content, responsive approved design, pricing/legal/support/waitlist surfaces, accessibility/performance/visual QA |
| Supabase/Resend waitlist | After preview/domains | Hosted secrets configured; consent, duplicate/error handling, persistence, and email delivery pass end to end |
| Provider portal + Stripe provider subscription/billing | In progress / before launch integration freeze | Optional/offline booking-payments model plus web-only SaaS Checkout/Portal, verified webhooks, Test Clock coverage, entitlement reconciliation |

Full week-by-week sprints, milestones, and the de-scope order (what to cut first if Oct 1 is at risk) are in the annex `PetAppro-Roadmap-and-Project-Plan.md`. **Never cut:** multi-tenancy, RBAC/RLS, the single shared pricing package, or its regression tests.

**Chosen delivery approach — Hybrid (decision D-023):** gate-driven on the foundation (above four items get their exit criteria met properly), deadline-driven on everything else (flex/cut scope to hold Oct 1). Fix time + quality, flex scope.

**Pivot checkpoints — re-decide at each; speed up if ahead, cut scope if behind:**
1. **~Jul 18 (end Sprint 1):** pricing package extracted, tested, CI green? Behind → start cutting scope now.
2. **~Aug 15 — GO/NO-GO:** tenant schema + RBAC/RLS done *and* D-U-N-S in hand? D-U-N-S is GREEN; schema/RLS is RED as of Jul 31. Green means versioned additive migrations, tenant keys, identity/membership/RBAC helpers, RLS + `WITH CHECK`, cross-tenant negative read/write tests, five-axis service/capacity schema, generated types, and CI all complete.
3. **~Sep 21:** integrated real-device beta ready? If not, Oct 21 is no longer credible.

If Aug 15 is red, move the date again or remove non-foundation scope. Never cut multi-tenancy, RBAC/RLS, the shared pricing package, or its regression tests.

---

## Launch Readiness Track (parallel — gates store submission)

The store clock runs in parallel with the recovery build. Immediate order: **Aug 13 GitHub + Vercel Pro connection → Base509 preview/review → Danny-approved production deployment → Apple Organization enrollment → Google Play Organization enrollment.** PetAppro site and web-only Stripe Billing follow as the next launch-critical web milestones. Complete BIZ-10b address propagation before either store submission.

**Ownership:** content/legal/site drafts by Cowork → Danny/attorney review; build/deploy by Claude Code; store accounts + listings by Danny. Detailed workstreams and hosting live in `website-and-store-launch-plan.md`; dated targets in the annex `PetAppro-Roadmap-and-Project-Plan.md` §7.5.

| LR item | What it covers | Hard-live by | Blocks | Status |
|---|---|---|---|---|
| **LR-1 — Legal pages** | Versioned policy registry; stable PetAppro Privacy + Terms paths | Pre-submission | Store submission (Apple + Google) | **Review queued** — interim docs + six v1.0 policies registered locally; not pushed/live |
| **LR-2 — Support page** | `/support` — contact route + basic help/FAQ; the store-listing "support URL" | **~Sep 5** (pre-submission) | Store submission | Not started |
| **LR-3 — Contact page** | Reachable contact (form/email) on both petappro.com and base509.com | **~Sep 5** | Store submission (support/contact expected); trust | Not started |
| **LR-4 — PetAppro marketing site** | Real Figma→code product/pricing/legal/support/waitlist experience | Launch integration freeze | Conversion + subscription acquisition | **Built locally; blocked on first push/preview QA** |
| **LR-5 — Base509 marketing website** | Multi-domain company hub plus canonical policy registry | Immediate preview after first push; production after approval | Apple Organization enrollment | **Push-ready/build-green; first `apps/web` push is the bottleneck** |
| **LR-6 — Apple App Store preparation** | Apple Developer org account ($99), App Store Connect record + bundle ID, privacy nutrition labels, in-app account-deletion flow, screenshots/icon, TestFlight beta | **Enroll immediately after LR-5; submit ~Oct 1–3** | Public launch | **D-U-N-S green; blocked on live base509.com** |
| **LR-7 — Google Play preparation** | Play Console org account ($25), closed-testing track, Data Safety form, store listing + graphics | **Enroll after Apple is initiated; submit ~Oct 1–3** | Public launch | **D-U-N-S green; ready after account-sequence step** |
| **LR-8 — App Store review buffer** | Buffer after Target-2 submission to absorb rejection + resubmit; hold release until launch gate is green | **~Oct 3–21** | Oct 21 target | Not started |

**Dependency chain:** Danny go → Claude Code first `apps/web` push → Vercel (`Root Directory = apps/web`) → preview/domains → approved Base509/PetAppro production deploy → Supabase/Resend waitlist; then store URLs/enrollment/listings and remaining launch gates. Provider portal/Billing and the non-cuttable tenant/RBAC/RLS foundation continue in parallel.

**Gate — Launch Readiness exit criteria:** legal, support, and contact pages live at stable petappro.com paths; both org accounts active; BIZ-10b complete; both listings created with privacy/data-safety forms complete and URLs pasted; account-deletion flow shipped; builds submitted with release held for the approved launch date; review buffer reserved on the calendar.

---

## Phase 0: Product Definition

### Goal

Define what PetAppro is, who it serves, what the MVP must prove, and what is explicitly out of scope. Align product positioning so the platform is software for pet care businesses — not an employer, marketplace, broker, agency, or service provider.

### Key questions

- Who is the first customer persona (solo sitter, small boarding/daycare, multi-staff shop)?
- What is the minimum set of services for MVP (boarding and daycare only, or more)?
- What does "success" look like for the first subscribed business?
- Which Woof Wetreats workflows are must-have vs. nice-to-have for launch?
- What legal/compliance language must appear in product copy and terms?
- What is deferred beyond MVP (Stripe Connect, SMS add-ons, messaging, multi-location)?
- Web-first, native-first, or web admin plus mobile client/staff experience?

### Deliverables

- Product brief (problem, audience, value proposition, positioning guardrails)
- MVP scope document with in-scope / out-of-scope lists
- User roles and permissions matrix (`owner`, `admin`, `staff`, `client`)
- First-tenant success criteria (what one real business can do on launch)
- Open decisions list with owners and target resolution phase

### Exit criteria

- Stakeholders agree on MVP scope boundaries
- Product positioning guardrails are written and accepted
- Roles, tenant model, and invite-code onboarding concept are defined at a high level
- No unresolved "must decide before architecture" items remain undocumented

### Suggested docs/artifacts

- `docs/planning/product_brief.md` (create)
- `docs/decisions/` entries for launch platform (web vs native) and MVP service scope
- `docs/planning/woof-wetreats-to-petappro-rebuild-plan.md` (existing — refine as needed)
- `docs/roadmap/mvp_roadmap.md` (this file)

### What not to do yet

- Do not scaffold `app/` or choose framework boilerplate
- Do not design database tables or RLS policies
- Do not wire Supabase, Netlify, or Stripe
- Do not copy Woof Wetreats code into a new repo
- Do not design pixel-perfect UI

---

## Phase 1: Architecture Planning

### Goal

Design the multi-tenant foundation: one shared platform, strict `business_id` separation, membership-based permissions, and server-authoritative booking/pricing. Resolve structural decisions that Woof Wetreats leaves single-tenant.

### Key questions

- What is the canonical tenant boundary (`business_id`) and where does it appear?
- How do invite codes create or link `business_memberships` and client profiles?
- Can one auth user be a client of Business A and staff of Business B?
- Are pet profiles scoped per business or shared across businesses for the same user?
- Where does pricing logic live (single shared package, no duplication across UI/server/Edge Functions)?
- What is the notification outbox model (`notifications`, `notification_deliveries`)?
- How are storage paths tenant-prefixed for pet photos and business assets?
- What RPCs, Edge Functions, and triggers need tenant context that Woof Wetreats lacks?
- Web admin vs client/staff app split — one codebase or multiple?

### Deliverables

- Technical architecture overview
- Core data model draft (tables, key relationships, tenant columns)
- Access control model (roles, memberships, invite codes, RLS strategy)
- Pricing architecture decision (shared engine, server authority, stored breakdowns)
- Notification and payment architecture summaries
- Migration/reference strategy (Woof Wetreats stays read-only; new build, optional later import)
- Architecture decision records for unresolved rebuild-plan items

### Exit criteria

- Every business-specific entity has a defined tenant boundary
- Permission checks are defined against memberships, not global emails
- Booking, pricing, terms stamping, and notification flows have tenant-aware sequence diagrams or written flows
- Known Woof Wetreats anti-patterns are explicitly marked "do not copy"
- Architecture review completed (ChatGPT/Codex or equivalent) with no blocking gaps

### Suggested docs/artifacts

- `docs/planning/technical_architecture.md` (create)
- `docs/planning/data_model_draft.md` (create)
- `docs/decisions/` — web vs native, pet profile scope, meet-and-greet configurability
- `docs/planning/woof-wetreats-reference-review.md` (existing — use as gap analysis)
- `reference/woof-wetreats-reference` (read-only — migrations, RPCs, routes)

### What not to do yet

- Do not implement migrations in Supabase
- Do not build UI screens
- Do not set up production infrastructure
- Do not refactor or modify the Woof Wetreats reference repo
- Do not commit secrets or environment files

---

## Phase 2: UX Flows

### Goal

Map end-to-end journeys for each role across tenant onboarding, daily operations, and edge cases. Preserve Woof Wetreats' proven household-centered staff model and client booking patterns while adding business setup and invite-code entry.

### Key questions

- What is the owner/admin business setup flow (services, pricing, availability, branding, terms)?
- How does a client enter an invite code, onboard, and reach their first booking?
- How does staff join via invite code and reach the daily schedule and household directory?
- When is meet-and-greet required — globally, per business, or per service?
- What happens when a client is blocked, a date is blocked, or pricing overrides apply?
- How does activity history (completed/cancelled bookings) appear without duplicating active/upcoming dashboard content?
- What empty, loading, error, and permission-denied states does each flow need?
- Public landing page vs invite-only portal — which does MVP include?

### Deliverables

- Core user flow documents per role (owner/admin, staff, client)
- Business setup flow
- Invite-code onboarding flows (client and staff)
- Booking flow (client self-service and staff-created)
- Staff daily schedule and household detail flow
- Meet-and-greet flow (if in MVP)
- Activity history flow
- Notification center flow (in-app)
- Flow-to-feature traceability matrix (flow step → spec → future build ticket)

### Exit criteria

- Every MVP feature has a documented primary happy path
- Error and permission paths are defined for booking, onboarding, and staff actions
- Flows explicitly note tenant scope at each step
- Product review confirms flows match Phase 0 scope (no scope creep)
- Open UX questions captured in `docs/decisions/` or flow doc appendices

### Suggested docs/artifacts

- `docs/user-flows/business_setup.md` (create)
- `docs/user-flows/client_onboarding_and_booking.md` (create)
- `docs/user-flows/staff_operations.md` (create)
- `docs/user-flows/activity_history.md` (create)
- `docs/user-flows/notifications.md` (create)
- `docs/planning/woof-wetreats-reference-review.md` (route/behavior cross-check)

### What not to do yet

- Do not build high-fidelity mockups before flows are reviewed
- Do not implement navigation or routes in code
- Do not finalize copy for legal pages without legal review checkpoint
- Do not design add-on flows (SMS bridge, in-app messaging) unless marked MVP

---

## Phase 3: Design System Foundation

### Goal

Establish brand-neutral UI foundations that support per-business customization (name, logo, landing content) without rebuilding components per tenant. Define tokens, core components, and layout patterns aligned to pet-care workflows.

### Key questions

- What is platform chrome vs. business-br customizable surface?
- Which components are shared across client and staff experiences?
- How do service tags, status badges, and booking cards behave across service types?
- What accessibility and mobile breakpoints are required for MVP?
- How do pet photos, avatars, and empty states render consistently?
- Which Woof Wetreats UI patterns should be preserved vs. generalized?

### Deliverables

- Design tokens document (color, type, spacing, radius, elevation)
- Component inventory for MVP (buttons, forms, cards, modals, schedule views, date pickers)
- Booking/reservation card spec (service tag, status, pets, dates, totals, fee breakdown)
- Tenant branding rules (logo placement, business name, hero/landing editable zones)
- UI state patterns (loading, empty, error, success, permission denied)
- Reference screenshots or annotated comparisons from Woof Wetreats where helpful

### Exit criteria

- Token file(s) exist and cover MVP needs
- MVP component list is agreed and mapped to user flows
- Booking card and schedule patterns are specified enough for spec writing
- No open blocking questions on layout for business setup, dashboard, or schedule views
- Design system supports boarding/daycare first without blocking future service types

### Suggested docs/artifacts

- `docs/design-system/petappro-color-variables.tokens.json` (existing)
- `docs/design-system/assets/images/` (existing logo assets)
- `docs/design-system/tokens.md` (create)
- `docs/design-system/components.md` (create)
- `docs/design-system/branding_and_theming.md` (create)

### What not to do yet

- Do not build a full component library in code
- Do not create per-business themes in production
- Do not polish marketing site design beyond MVP admin/client needs
- Do not design native-only patterns if launch is web-first (until platform decision is final)

---

## Phase 4: MVP Specification

### Goal

Turn approved flows and architecture into build-ready feature specs with acceptance criteria, tenant scope, permissions, data touchpoints, and verification plans. Each spec should be small enough for Cursor/Claude Code to implement in focused slices.

### Key questions

- What is the exact MVP feature list with priority order?
- For each feature: roles affected, tables touched, RLS impact, UI states, notifications, payment/legal impact?
- Which specs depend on others (e.g., booking requires business setup + client onboarding)?
- What are acceptance criteria and test scenarios per feature?
- What remains deferred: SMS add-on, advanced services, analytics? (Stripe Connect is now IN MVP — D-007 Option A)
- How is terms version stamping applied at booking and meet-and-greet time?

### Deliverables

- Prioritized MVP feature backlog
- Feature specs for each MVP slice (using a consistent template)
- Platform spec refinements (notifications, activity history — partial exists)
- Payment spec (**Stripe Connect client→provider payments IN MVP — D-007 Option A**; manual tracking is fallback only)
- Terms/policy spec (business-specific client terms + platform terms)
- Launch checklist draft
- Claude Code / Cursor build prompts per major feature

### Exit criteria

- Every in-scope MVP feature has a spec with acceptance criteria
- Specs include tenant scope and permission sections — no "TBD" on `business_id`
- Dependencies and build order are documented
- Deferred features are explicitly listed with rationale
- Spec review completed; ready for build planning

### Suggested docs/artifacts

- `docs/specs/platform_notification_and_activity_plan.md` (existing — refine)
- `docs/specs/business_setup.md` (create)
- `docs/specs/invite_code_onboarding.md` (create)
- `docs/specs/booking_and_pricing.md` (create)
- `docs/specs/staff_dashboard_and_schedule.md` (create)
- `docs/specs/payments_manual_and_stripe.md` (create)
- `docs/specs/terms_and_policies.md` (create)
- `docs/prompts/claude_code_prompt_pack.md` (existing — extend per feature)

### What not to do yet

- Do not start coding in `app/`
- Do not create GitHub issues until specs are stable (unless used for tracking only)
- Do not deploy to Netlify or provision production Supabase
- Do not combine multiple features into one vague "build the app" prompt

---

## Phase 5: Build Planning

### Goal

Sequence MVP implementation into branches/milestones, define repo structure under `app/`, and establish local dev, testing, migration, and review discipline before any production deploy.

### Key questions

- What repo layout lives under `app/` (web, supabase, packages/pricing, docs mirror)?
- What is the build order by dependency (tenant foundation → auth/memberships → business setup → client onboarding → booking → staff ops → notifications → payments)?
- How are Supabase migrations versioned and reviewed for RLS?
- What local verification is required before each merge (typecheck, tests, manual flows)?
- When is the first deploy preview allowed — and who approves Netlify deploys?
- How is Woof Wetreats used during build (behavior comparison checklist only)?
- What is the first-tenant data import plan, if any?

### Deliverables

- Implementation phase plan (ordered milestones with estimates)
- `app/` repo scaffold plan (folders, tooling, scripts — not necessarily executed yet)
- Supabase migration strategy and RLS review checklist
- Local dev setup guide
- Testing and verification plan per milestone
- Git branching convention and PR review checklist
- Environment variable inventory (no secrets committed)
- Pre-deploy review process (aligned with `docs/prompts/claude_code_prompt_pack.md`)

### Exit criteria

- Build order is documented with clear milestone boundaries
- Each milestone maps to one or more specs and verification steps
- RLS/tenant review gate defined before booking and staff features
- Local-only development agreement documented (no Netlify deploy without approval)
- First implementation prompt ready for Phase 6 milestone 1

### Suggested docs/artifacts

- `docs/planning/implementation_plan.md` (create)
- `docs/planning/local_dev_setup.md` (create)
- `docs/planning/launch_checklist.md` (create)
- `docs/prompts/claude_code_prompt_pack.md` (existing)
- `docs/planning/ai_build_operating_model.md` (existing — workflow alignment)

### What not to do yet

- Do not deploy to production
- Do not onboard paying customers
- Do not import Woof Wetreats production data until tenant model is validated locally
- Do not skip RLS review for "speed"
- Do not begin Phase 6 work until this phase exit criteria are met

---

## Phase 6: MVP Build

**Status: Future / not started**

Listed for roadmap completeness only. No implementation work begins until Phases 0–5 exit criteria are met.

### Goal

Implement the MVP in dependency order inside `app/`, with local testing first, tenant-safe RLS throughout, and Woof Wetreats used only as a behavioral reference.

### Planned milestones (high level)

1. **Tenant foundation** — `businesses`, memberships, invite codes, base RLS
2. **Auth and onboarding** — owner setup, client/staff invite flows
3. **Business configuration** — services, pricing rules, availability, branding, terms
4. **Client experience** — profile, pets, booking (boarding/daycare), pricing preview, confirmation
5. **Staff operations** — household directory, daily schedule, booking management, staff notes
6. **Notifications and activity** — in-app notification center, activity history date picker
7. **Payments** — **Stripe Connect client→provider payments (D-007 Option A, in MVP)**; manual tracking as fallback only
8. **Launch hardening** — bug fixes, acceptance testing, first-tenant onboarding, deploy when approved

### Key questions (to resolve before starting)

- ~~Final go/no-go on Stripe Connect for MVP~~ → **Resolved: Stripe Connect IS in MVP (D-007 Option A, 2026-07-08).** Manual tracking is fallback only; date flexes to Target 2 (~Oct 21) to include payments.
- Final go/no-go on SMS alert add-on for MVP
- Web-only launch or parallel mobile work
- First **test tenant** = Danny + Marco's own business (not a recruited customer); success metrics per the MVP-complete gate below

### Deliverables

- Working MVP in `app/`
- Supabase migrations and RLS policies
- Test coverage for pricing engine and critical tenant boundaries
- Deploy preview (when approved)
- First-tenant onboarding runbook

### MVP Complete — the feature-freeze line (decision D-028, Decided 2026-07-07)

> **MVP Complete = Danny + Marco's own business runs a genuine booking end-to-end** — client onboarding → booking → server-validated pricing → staff schedule → history/notifications — **on physical iOS *and* Android builds, with tenant isolation verified, and a REAL PAID BOOKING via Stripe Connect (D-007 Option A). Manual tracking only if payments derail.**

When this single event is true, **feature development pauses.** Everything after the freeze is bug-fixing, polish, accessibility, and store prep — not new features. The freeze bar uses the **own business as the first test tenant** (not a recruited customer), because that removes a recruiting dependency from the freeze while still forcing every core system — tenant schema + RLS, RBAC, business setup, onboarding, the booking + pricing engine — to be real at once on-device.

The **5–6 PCSP beta testers** (recruited via the local Facebook group + Danny's network) are the milestone *after* the freeze — real-world validation on TestFlight/closed track — and store submission runs in parallel on the Launch Readiness track. They are not part of the freeze bar.

### Exit criteria

- First business can complete setup, invite clients/staff, take bookings, run daily schedule, view history, and receive in-app notifications
- Tenant isolation verified (no cross-business data leakage)
- Acceptance criteria from Phase 4 specs met
- Launch checklist complete
- Explicit approval for production deploy

### Suggested docs/artifacts

- GitHub repo under `app/`
- `docs/planning/launch_checklist.md`
- `docs/decisions/` — post-build revisions
- Milestone-specific build prompts in `docs/prompts/`

### What not to do yet

- **Entire phase is not started** — do not scaffold, migrate, or ship until Phases 0–5 are complete
- Do not expand scope mid-build without updating specs and roadmap
- Do not modify `reference/woof-wetreats-reference`

---

## MVP Scope Reference (from rebuild plan)

Use this as the default in/out scope anchor during Phases 0 and 4. Adjust only through explicit decision records.

### Include in MVP

- Business setup
- Invite-code onboarding (client and staff)
- Client onboarding and pet profiles
- Boarding, daycare, and dog-walking bookings, with **GPS/live walk tracking at launch for Crew+** (D-054); schema and service configuration remain generic so provider-defined service types do not require a rewrite
- Staff dashboard and daily schedule
- Pricing engine with server authority and stored breakdowns
- Blocked dates with server enforcement
- Activity history date picker (completed/cancelled only)
- In-app notification center
- **Stripe Connect — in-app client→provider payments (D-007 Option A, 2026-07-08)**; manual tracking (cash/check/Venmo/Zelle + staff confirmation) is the fallback only
- SMS alert add-on or owner/staff SMS alerts (if decided)

### Defer beyond MVP

- ~~Stripe Connect~~ → **moved INTO MVP (D-007 Option A, 2026-07-08)** — see the Include list above. (SaaS subscription billing, provider → Base509, via Stripe **Billing** on the web was always in scope — MKT-6 / D-001.)
- Full in-app messaging
- SMS conversation bridge
- Multiple non-pet verticals
- Custom app-store builds per business
- Complex staff permission hierarchies
- Multi-location support
- Advanced service types beyond first MVP set
- Deep analytics and reporting

---

## Suggested Phase Sequence

```text
Phase 0  Product Definition
   ↓
Phase 1  Architecture Planning
   ↓
Phase 2  UX Flows          ← can overlap lightly with Phase 3 once flows are stable
Phase 3  Design System Foundation
   ↓
Phase 4  MVP Specification
   ↓
Phase 5  Build Planning
   ↓
Phase 6  MVP Build         ← partially started; Foundation Recovery is active

  ══ Launch Readiness (LR) ═════════════════════════  ← PARALLEL, active now
     Vercel Pro → minimal base509.com → Apple Org → Google Play →
     address/legal/support checks → submit ~Oct 1–3 → buffer → Oct 21 target
```

Phases 2 and 3 may run with light overlap after Phase 1 exit criteria are met, but specs (Phase 4) should not begin until flows and design foundations are review-ready. **Launch Readiness runs across the whole timeline** — its store-clock items (D-U-N-S, org accounts, review buffer) are the binding external constraint and must not wait on the build phases.

---

## Immediate Next Steps (updated 2026-08-15)

1. Danny gives the go; Claude Code performs the first GitHub push of `apps/web`. This is the current bottleneck.
2. Connect Vercel with `Root Directory = apps/web`; review preview, attach domains, verify HTTPS/host routing/policy/support/contact routes, and promote only with Danny's explicit approval.
3. Configure and validate hosted Supabase/Resend waitlist end to end after preview/domains are available.
4. Continue the provider portal and web-only Stripe Billing boundaries in parallel with the non-cuttable CFG-1/RBAC/RLS foundation.
