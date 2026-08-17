# PetAppro — Delivery Schedule & Schema Starter (annex)

> **Role of this file:** the canonical roadmap is `docs/roadmap/mvp_roadmap.md` (phases, gates, exit criteria). This annex supplies the **dated delivery schedule (sprints/milestones), the paste-ready backlog database, and the tenant-aware schema starter** referenced from there. If the two ever disagree on scope, `mvp_roadmap.md` wins; this file owns the calendar and the schema tables.

Companion to **PetAppro-Strategy-and-Business-Plan.md**. Everything here is structured to paste straight into Notion — the tables become Notion databases, the checklists become to-do items. The current recovery baseline is governed by `mvp_roadmap.md`; older Target-1 dates below are retained as historical planning context where they have not yet been re-cut.

> **Launch targets (updated 2026-07-08, D-023):** **Target 1 = Oct 1** (aggressive), **Target 2 = Oct 21** (realistic, to ship *with* in-app payments — Stripe Connect, D-007 Option A). The dated calendar below is Target-1-based; add ~3 weeks for the Target-2 payments-included path. **Stripe Connect is now IN the MVP** (reversed from the earlier "deferred" language throughout).

> **Web timeline override — 2026-08-15:** Base509/policies and PetAppro marketing are ready locally; the design system is published as a library; the provider portal is in progress with optional/offline booking payments. `apps/web` has never been pushed to GitHub. **Danny go → Claude Code first push is the current launch bottleneck**, gating Vercel (`Root Directory = apps/web`) → preview/domains → Supabase/Resend waitlist. This override supersedes older Aug 13 and “website not started” references below.

---

## How to use this in Notion

1. Create a new Notion page: **"PetAppro"**.
2. Paste each `##` section below. Notion auto-converts Markdown tables → tables; convert the key ones (Backlog, Sprint Plan, Milestones) to **database** views via `/database` → paste rows.
3. Suggested Notion top-level structure:
   - **📋 Roadmap** (timeline/board of the Milestones table)
   - **🗂️ Backlog** (the Epics/Stories database — filter by Phase, Priority, Status)
   - **🏃 Sprints** (the Sprint Plan)
   - **🗄️ Schema** (the data-model section)
   - **✅ Launch checklists** (stores, business setup)
   - **📎 Reference** (link the Strategy doc + Woof build docs)

---

## 1. Timeline overview (July 4 → Oct 1)

~13 weeks. Six phases, front-loading the risky architecture and the store clocks.

| Phase | Dates | Goal |
|---|---|---|
| **P0 — Foundations** | Jul 7 – Jul 25 | Monorepo, extract + test pricing/booking packages, tenant-aware schema on a branch, CI |
| **P1 — Platform layer** | Jul 28 – Aug 15 | RBAC/RLS, typed data access, generated types, Edge Functions consolidated, white-label config |
| **P2 — Mobile MVP build** | Aug 4 – Sep 5 (overlaps) | Expo app: auth → onboarding → booking → dashboard, reusing shared packages |
| **P3 — Store + business prep** | Aug 11 – Sep 8 | Entity, D-U-N-S, Apple/Google org accounts, listing assets |
| **P4 — Beta & submit** | Aug 25 – Sep 12 | PCSP beta-tester beta (TestFlight/closed track), fix, **submit by ~Sep 10** |
| **P5 — Review buffer & launch** | Sep 12 – Oct 1 | Clear review (+ rejection cycle), marketing site, **public launch Oct 1** |

> **Critical path:** Pricing extraction → tenant schema → Expo booking flow → beta → submit. Store accounts (D-U-N-S) run in parallel and must start in **early August**.

---

## 2. Milestones (Notion database — Timeline/Board view)

| Milestone | Target date | Phase | Owner | Status |
|---|---|---|---|---|
| **First `apps/web` GitHub push** | **Immediate on Danny's go** | LR | Claude Code / Danny approval | **BLOCKED — CURRENT LAUNCH BOTTLENECK** |
| Vercel preview + domains (`Root Directory = apps/web`) | Immediately after first push | LR | Claude Code / Danny | Blocked by first push |
| Supabase + Resend waitlist live | After preview/domains | LR | Claude Code | Blocked by first push/deployment chain |
| Monorepo + CI live | Jul 11 | P0 | Danny | Not started |
| Pricing engine extracted + regression tests green | Jul 18 | P0 | Danny | Not started |
| Tenant-aware schema (branch) reviewed | Jul 25 | P0 | Danny | Not started |
| RBAC + RLS + RLS tests passing | Aug 8 | P1 | Danny | Not started |
| White-label config + brand resolver | Aug 15 | P1 | Danny | Not started |
| Business entity formed + EIN | Aug 8 | P3 | Danny | Not started |
| D-U-N-S obtained | Aug 15 | P3 | Danny | Not started |
| Apple + Google org accounts active | Aug 22 | P3 | Danny | Not started |
| Expo MVP: booking flow end-to-end | Aug 29 | P2 | Danny | Not started |
| Stripe Connect onboarding + client→provider charges working | ~Sep (Target 2 window) | P2 | Danny | In MVP (D-007 Option A) |
| Beta live (TestFlight + closed track) | Sep 1 | P4 | Danny | Not started |
| Store listing assets complete | Sep 5 | P3 | Danny | Not started |
| **App submitted to both stores** | **Sep 10** | P4 | Danny | Not started |
| Social handles reserved + brand kit | Aug 15 | P3 | Danny | Not started |
| Website live w/ privacy + support URLs (needed for store submission) | After approved Vercel preview | P3/LR | Danny / Claude Code | Built locally; blocked by first push |
| Full PetAppro marketing site + launch content | Preview QA after first push | P5/LR | Claude Code | Built locally from real Figma content; not deployed |
| **Public launch** | **Oct 1** | P5 | Danny | Not started |

---

## 3. Sprint plan (2-week sprints)

### Sprint 1 (Jul 7–18) — Foundations & the crown jewel
- Set up monorepo (`apps/mobile`, `apps/web`, `packages/*`, `supabase/`).
- **Extract `packages/pricing`** from the three existing copies into one; **write regression tests first** capturing *current* behavior. *(Verified 2026-07-31, Codex + Claude Code: the "15-night cap" is a **phantom** — it never existed in PetAppro's engine or tests; it was a mis-transcription of Woof WeTreats' **14-night client self-service cap**, deliberately not ported. No stale test to fix; **S1-3 is satisfied by the clean extraction**.)*
- Extract `packages/booking` (validation + availability rules).
- Generate Supabase DB types → `packages/data`.
- GitHub Actions: typecheck + lint + test on every PR.
- Exit criteria: one pricing engine, tests green, CI enforced.

### Sprint 2 (Jul 21 – Aug 1) — Tenant schema & data access
- Design + apply (on a **Supabase branch**) additive migrations: `businesses`, `memberships`, generalized `services`, per-tenant `pricing_rules`, `resources`, tenant `business_id` on existing tables.
- Backfill Woof as tenant #1.
- Wrap all reads/writes in typed data-access functions (kill client-side direct writes for sensitive mutations).
- Exit criteria: existing web app still works, now tenant-scoped.

### Sprint 3 (Aug 4–15) — Platform layer + start Expo
- Centralized RBAC (membership→role→permission) + RLS policies on every table; **RLS test suite** (cross-tenant isolation + staff-notes lockdown).
- Consolidate Edge Functions; version them with migrations.
- White-label config tables + brand resolver.
- **Expo app scaffold**: navigation, design tokens (`packages/ui`), auth screens wired to Supabase.
- Parallel (business): file entity, EIN, start D-U-N-S.

### Sprint 4 (Aug 18–29) — Mobile MVP vertical slices
- Onboarding (provider + client + pet/profile), booking flow with live server-validated pricing, staff dashboard + daily schedule, **Stripe Connect client→provider payments (D-007 Option A, in MVP)** — manual tracking as fallback only.
- Generalized capacity engine wired (overlap/concurrency/travel buffers).
- Push notifications (Expo Push).
- Parallel (business): Apple + Google org accounts; begin listing assets.

### Sprint 5 (Sep 1–12) — Beta, polish, submit
- TestFlight + Google closed track to the 5–6 PCSP beta testers; triage feedback.
- Accessibility pass; empty/error states; account-deletion flow (Apple requirement).
- Finalize store listings (screenshots, privacy labels, Data Safety form, policies).
- **Submit to both stores by ~Sep 10.**

### Sprint 6 (Sep 15–26) — Review buffer & GTM
- Respond to any rejection; resubmit.
- Marketing site live; case studies; ASO.
- Onboard first paying providers to production.

### Launch week (Sep 29 – Oct 1)
- Final prod checks, monitoring dashboards, support readiness → **public launch Oct 1**.

---

## 4. Backlog (Epics → Stories) — Notion database

Columns to create in Notion: **Story · Epic · Phase · Priority · Effort · Status · Depends on**.

| Story | Epic | Phase | Priority | Effort |
|---|---|---|---|---|
| Monorepo + workspaces | Foundations | P0 | P0 | M |
| Extract single pricing package | Foundations | P0 | P0 | M |
| Pricing regression test suite | Foundations | P0 | P0 | M |
| Extract booking/validation package | Foundations | P0 | P0 | M |
| Generate + wire Supabase types | Foundations | P0 | P0 | S |
| CI (typecheck/lint/test) | Foundations | P0 | P0 | S |
| `businesses` + `memberships` tables | Tenancy | P0 | P0 | M |
| Add `business_id` + RLS to all tables | Tenancy | P0 | P0 | L |
| Generalized `services` model | Tenancy | P1 | P0 | L |
| Per-tenant `pricing_rules` (kill global id=1) | Tenancy | P1 | P0 | M |
| Capacity/concurrency + travel-buffer engine | Services core | P1 | P0 | L |
| Centralized RBAC + permissions | Security | P1 | P0 | M |
| RLS test suite (cross-tenant + staff notes) | Security | P1 | P0 | M |
| White-label config + brand resolver | White-label | P1 | P1 | L |
| Industry template seeds (dog preset) | White-label | P1 | P1 | M |
| Expo scaffold + navigation + tokens | Mobile | P2 | P0 | M |
| Auth screens (Supabase) | Mobile | P2 | P0 | M |
| Provider onboarding | Mobile | P2 | P0 | M |
| Client + pet onboarding (HEIC handling) | Mobile | P2 | P0 | M |
| Booking flow + live pricing | Mobile | P2 | P0 | L |
| Staff dashboard + daily schedule | Mobile | P2 | P0 | L |
| Stripe Connect onboarding + charges | Payments | P2 | P0 | L |
| Paid/unpaid + balance tracking | Payments | P2 | P1 | M |
| Push notifications (Expo Push) | Notifications | P2 | P1 | M |
| Reports + CSV export | Reporting | P2 | P1 | M |
| QuickBooks push (add-on) | Reporting | P3 | P2 | M |
| SaaS billing on web portal (Stripe Billing) | Monetization | P3 | P0 | M |
| Marketing site | GTM | P5 | P1 | M |
| Store listing assets + policies | Store | P3 | P0 | M |
| Account-deletion flow (Apple) | Store | P4 | P0 | S |
| Analytics + Sentry | Observability | P2 | P1 | S |
| SMS add-on (Twilio A2P) | Add-ons | Post-launch | P2 | M |

*(Effort: S ≈ ≤2 days, M ≈ 3–5 days, L ≈ 1–2 weeks.)*

---

## 5. Data model starter (tenant-aware) — paste into Notion "Schema" page

**Legend:** every child table carries `business_id uuid` (FK → `businesses`) and an RLS policy scoping rows to the caller's tenant membership.

### `businesses` (the tenant)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text | legal/business name |
| brand_name | text | white-label display name (e.g. "Woof WeTreats") |
| industry_template | text | dog_care · hair · cleaning · custom |
| branding | jsonb | logo url, palette, copy overrides |
| subdomain / domain | text | tenant web presence |
| timezone | text | |
| terms_url / policies | jsonb | tenant terms + house rules |
| notification_templates | jsonb | per-tenant copy |
| feature_flags | jsonb | sms_enabled, quickbooks_enabled, etc. |
| stripe_account_id | text | Connect (Standard) account |
| plan | text | starter · pro · business |
| created_at | timestamptz | |

### `memberships` (RBAC)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK | |
| user_id | uuid | Supabase auth id |
| role | text | owner · staff · client |
| permissions | jsonb | optional overrides |
| created_at | timestamptz | |

### `services` (the generalized product)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK | |
| name | text | provider-named or from template |
| category | text | boarding · daycare · walking · grooming · training · cut · color · clean · custom |
| pricing_model | text | per_night · per_session · per_hour · per_head · per_unit · tiered · flat |
| pricing_config | jsonb | rates, tiers, surcharges, holiday/peak windows |
| capacity_model | text | one_to_one · fixed_n · unlimited_overlap · shared_exception |
| capacity_config | jsonb | max concurrent (e.g. walking=6), exception flags |
| duration_model | text | fixed · variable · open_ended |
| location_model | text | at_provider · at_client · either |
| buffer_config | jsonb | travel/setup buffers |
| active | boolean | |

### `pricing_rules` (per-tenant, replaces global `id=1`)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK | |
| service_id | uuid FK | |
| rule_type | text | base · surcharge · discount · holiday · peak |
| config | jsonb | amounts + conditions |

### `resources` (capacity providers)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| business_id | uuid FK | |
| type | text | staff · room · equipment |
| name | text | |
| capacity | int | |

### `bookings` / `booking_participants`
Carry `business_id`, `service_id`, `client_id`, `resource_id`, dates/times, `payment_method`, `total_price` (stored at booking time), `status`, `care_notes`, `care_doc_url`. `booking_participants` links the pets/people/rooms on a booking (generalizes "up to 3 dogs").

### Carry over unchanged (now tenant-scoped)
`blocked_dates`, `payments`, `notes` (staff-private, RLS-locked). **Keep storing `total_price` at booking time** so historical pricing never shifts when rates change — this rule from Woof is correct and stays.

---

## 6. Store launch checklist (Notion to-do)

**Apple**
- [ ] Business entity + D-U-N-S ready
- [ ] Enroll Apple Developer Program (Organization) — $99/yr
- [ ] App Store Connect app record + bundle id
- [ ] Privacy nutrition labels
- [ ] In-app account deletion flow
- [ ] Screenshots (all required device sizes) + icon
- [ ] Privacy policy + support URLs
- [ ] TestFlight beta with the 5–6 PCSP beta testers
- [ ] Submit by ~Sep 10 (budget a rejection cycle)

**Google Play**
- [ ] Register **Organization** account (D-U-N-S) — $25 one-time — avoids personal-account 12–20 tester rule
- [ ] Internal/closed testing track running (late Aug)
- [ ] Data Safety form
- [ ] Store listing + graphics
- [ ] Submit by ~Sep 10

**Shared**
- [ ] Age rating, content declarations
- [ ] MVP booking payments use **Stripe Connect** (client→provider, in MVP — D-007 Option A) under the real-world-services exemption; manual tracking is the fallback only. SaaS subscription sold on web only (Stripe Billing).

---

## 7. Business setup checklist (Notion to-do)

- [ ] Form LLC (single-member or w/ Marco) + operating agreement
- [ ] EIN + business bank account
- [ ] D-U-N-S number (long lead — start first week of August)
- [ ] General liability + tech E&O insurance
- [ ] ToS, Privacy Policy, provider/merchant agreement, DPA (lawyer review)
- [ ] Trademark clearance search + file "PetAppro" (+ "Appro" family)
- [ ] Register domains (petappro.com + defensive vertical names)
- [ ] Stripe **Billing** account (SaaS subscriptions — launch-critical) **+ Stripe Connect enablement** (client→provider payments, in MVP — D-007 Option A)
- [ ] Sales-tax / economic-nexus review with accountant

---

## 7.5 Marketing & Launch track (website + social — runs in parallel)

> **Critical-path note:** the website is not just launch marketing. App Store **and** Google Play require a **privacy-policy URL and a support URL** in the listing, so those pages must be **live before the ~Sept 10 submission** — not launch week. The site also hosts the provider **subscription checkout** (Stripe Billing), which is required because Apple bars selling that subscription in-app.

### Website (thin Next.js — marketing + checkout, not a product web app)
| Task | Target | Notes |
|---|---|---|
| Register domain(s): petappro.com (+ defensive hairappro/cleanappro) | Aug 8 | Also in business track |
| Site scaffold + brand styling (reuse design tokens) | Aug 22 | Next.js under `apps/web` |
| Core pages: home / value prop, features, pricing/plans | Aug 29 | |
| **Privacy Policy + Support/Contact pages (store-required)** | **Sep 5** | Hard dependency for ~Sep 10 submission |
| Provider sign-up → Stripe Billing subscription checkout | Sep 12 | Compliant place to sell SaaS (not in iOS app) |
| SEO basics + App Store/Play badge links | Sep 25 | Aligns with ASO |
| Launch/announcement page + demo video embed | Sep 29 | |

### Social media
| Task | Target | Notes |
|---|---|---|
| Reserve handles (Instagram, Facebook, Threads, TikTok, LinkedIn) — consistent @petappro | Aug 15 | Grab early even if idle |
| Brand kit: logo, profile/banner art, palette | Aug 15 | Adobe Express/Canva + existing tokens |
| Pre-launch content calendar (build-in-public, pet-care tips, PCSP beta-tester teasers) | Sep 1 | 3–4 posts/wk ramp |
| Demo/sizzle video (Adobe Quick Cut) | Sep 20 | Reuse on site + stores |
| Launch posts + App Store/Play links | Oct 1 | Coordinated with public launch |
| Ongoing: testimonials, case studies, ASO review push | post-launch | Growth loop |

**Approved platforms (social pages + targeted advertising):** Meta (Instagram, Facebook, Threads), TikTok, and LinkedIn only. **Do not use X/Twitter or any Elon Musk platform** — standing brand policy.

**Primary channels for the pet-care beachhead:** Instagram + Facebook (owners), local SF pet groups + r/dogboarding (demand), LinkedIn + Facebook groups (provider acquisition). Paid ads on Meta, TikTok, and LinkedIn only after organic + PCSP-beta proof.

---

## 8. Definition of Done (per story)

A story is done when: code merged behind passing CI (typecheck + lint + tests); pricing/booking changes covered by regression tests; RLS verified for any new table; types generated; works on a physical iOS **and** Android device via EAS build; no secrets in the bundle; analytics + error events wired for user-facing flows.

---

## 9. What to cut first if Oct 1 is at risk (de-scope order)

1. QuickBooks push → keep CSV export only.
2. Advanced reports/analytics → basic dashboard only.
3. SMS add-on → post-launch (already planned).
4. White-label config polish → ship dog preset hardcoded-but-tenant-scoped; generalize config after launch.
5. Second industry template → post-launch (it was never in Oct 1 scope).
6. **Last resort:** Capacitor-wrapped web build to secure a store presence while the Expo app finishes — accept the tradeoffs in the Strategy doc §3.

**Never cut:** the multi-tenant boundary, RBAC/RLS, the single shared pricing package, or the pricing regression tests. These are the difference between a product and a liability.
