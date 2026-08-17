# PetAppro — Strategy & Business Plan

**From:** Woof WeTreats (live web app) **To:** PetAppro, a native iOS + Android booking platform with a flexible, multi-industry services core.

**Prepared:** July 2026 · **Target launch:** October 1, 2026 · **Author:** Danny Baker

> **What this doc owns (canonical):** business strategy, market/competitive analysis, the framework decision (Expo/React Native), monetization/SaaS pricing, business setup (LLC/D-U-N-S/legal), brand & GTM, the scaling stack + costs, and launch. **For product definition, positioning guardrails, roles, and MVP feature scope, `docs/planning/product_brief.md` is canonical.** **For the technical migration and data model, `docs/planning/woof-wetreats-to-petappro-rebuild-plan.md` is canonical.** Where this doc and those differ on product scope or schema, defer to them. Note: the "multi-industry services core" here is an *architecture to build for*; product_brief correctly scopes the **launch** to pet care only.

---

## 0. TL;DR / Executive Summary

You have a working, revenue-relevant web app (Woof WeTreats: Next.js + Supabase + Netlify) that proves the hardest domain logic — a real pricing engine, booking/validation flow, staff + client dashboards, notifications, and payment tracking. The Codex audit confirms the right move: **do not rewrite — extract.** Pull the proven logic into shared packages, add a multi-tenant + white-label layer, then build the native apps in **Expo / React Native** reusing the same Supabase backend.

**The three big decisions, resolved:**

1. **Framework: Expo (React Native).** It reuses your React/TypeScript skills and your entire Supabase backend, gives true native iOS + Android from one codebase, and supports over-the-air updates (ship fixes without waiting on app-store review). Full reasoning in §3.
2. **Business model: provider-paid SaaS.** Service providers pay a monthly subscription. Their clients pay *them* directly via **Stripe Connect (Standard)** into the provider's own Stripe account. SMS, QuickBooks sync, and advanced reports are paid add-ons. Full model in §7.
3. **Scope for Oct 1: PetAppro (dog vertical) native launch, on a services-core foundation.** Build the generic "services" engine and tenant-aware schema underneath, but launch *one* polished vertical. Other industries branch afterward without a rewrite. Full scope in §2.

**Honest timing verdict:** Oct 1 is **achievable but tight.** It works only if you (a) freeze scope hard, (b) start the shared-package extraction immediately, and (c) treat "multi-industry" as *architecture you build for*, not *features you ship on day one*. The single biggest schedule risk is app-store review + Google's closed-testing requirement, so those clocks must start in **early September at the latest** (see §9 and the companion roadmap).

---

## 1. What we learned from Woof WeTreats (and the Codex audit)

### What's proven and worth keeping
- **A real pricing engine** with holiday-window logic, extended-stay tiers, puppy surcharges, and per-night rules — validated against real dates. This is your crown jewel and the hardest thing to rebuild. Keep it; don't re-derive it.
- **Server-side price validation** on booking creation (clients can't tamper with price).
- **Two clean roles** (client + staff) and a genuine operational dashboard, daily schedule, and payment tracking.
- **Supabase RLS + Edge Functions + RPCs** used for sensitive checks — the right primitives for a SaaS.
- **A locked design system** (color tokens, button system, service pills, atomic structure in Figma). This transfers almost directly into a React Native design-token set.

### What the Codex audit says must change before this is a platform
The audit is the technical spine of this plan. The critical items:

| # | Issue | Why it matters for PetAppro | Fix |
|---|---|---|---|
| 1 | **No multi-tenant boundary** (global `pricing_rates.id=1`, single-business assumptions) | You cannot host many businesses safely without `business_id` everywhere | Tenant-scoped schema + RLS on every table (§5) |
| 2 | **Inconsistent authorization** (`is_admin` vs email vs `ADMIN_EMAIL`) | Role drift is a classic production security failure | Centralized RBAC: tenant membership → role → permission, enforced by RLS |
| 3 | **Duplicated pricing logic** (3 copies that can disagree on money) | Client preview, staff edit, and server booking could quote different totals | One shared `@petappro/pricing` package consumed everywhere |
| 4 | ~~**Stale tests** (expect a removed 15-night cap)~~ **RESOLVED — phantom** (verified 2026-07-31, Codex + Claude Code): no 15-night cap or test exists in `packages/pricing`; it was a mis-transcription of Woof's 14-night self-service cap, never ported | — | No fix needed; regression suite (39 pass / 8 skip) is clean |
| 5 | **Client-side direct DB writes** everywhere | Relies on perfect RLS; hard to reuse on mobile | Route mutations through typed server actions / Edge Functions |
| 6–8 | Huge files, local `useState` sprawl, no generated DB types | Painful to port to Expo; schema drift goes uncaught | Split screens; **TanStack Query** + small **Zustand** store; generate Supabase types |
| 9 | **Low white-label readiness** (hardcoded "Woof Wetreats") | Every new industry/brand needs configurable brand, copy, services, terms | Tenant theme/content/config tables + brand resolver |
| 10–12 | Mixed mobile readiness, incomplete function inventory, thin dev tooling | Slows the team as it grows | Extract domain packages first; version functions/migrations/types together; add lint/test/CI |

**The audit's one-line direction, which this plan adopts:** *Keep the working product. Incrementally extract shared domain packages → feature modules → tenant-aware SaaS tables & RLS. Then rebuild screens natively in Expo on top of the shared layer.*

---

## 2. What NOT to do (read this first)

These are the traps most likely to blow the budget or the Oct 1 date.

1. **Do not rewrite from scratch.** The web app is your spec *and* your test oracle. Extract and reuse. A greenfield rewrite throws away the validated pricing/booking logic and restarts the clock.
2. **Do not build all industries at once.** "Flexible services core" is an *architecture*, not a launch scope. Ship PetAppro; prove the engine bends; branch later. Trying to launch HairAppro + CleanAppro + PetAppro simultaneously guarantees you miss Oct 1.
3. **Do not ship without a multi-tenant boundary.** Retrofitting `business_id` after you have real customers' data is far more expensive and risky than doing it now while the only tenant is you.
4. **Do not let Apple's In-App-Purchase rule ambush you.** Booking payments for *real-world services consumed outside the app* are explicitly allowed to use Stripe (App Store Guideline 3.1.1 / 3.1.3(e)). But **selling the provider's SaaS subscription inside the app can trigger the 30% IAP requirement.** Sell provider subscriptions on the **web** (account portal), not in the iOS app. (§7, §9)
5. **Do not use Capacitor to "wrap" the Next.js app as your long-term answer.** It's the fastest path to *a* store listing, but you inherit WebView performance, a less-native feel, and higher rejection risk for "just a website." (It's a viable *fallback* if the timeline collapses — see §3.)
6. **Do not skip generated DB types and CI.** Every hour saved here is repaid with interest in production money bugs and schema-drift outages.
7. **Do not hardcode branding, service definitions, tax/terms, or notification copy.** Everything a future vertical differs on must be a row in a config table, not a string in code.
8. **Do not register the stores late, and do not use a *personal* Google Play account.** Google now requires 12–20 testers for 14 consecutive days of closed testing before a *personal* account can go to production. An **Organization** account (with a business entity + D-U-N-S) avoids that trap and looks legitimate. Start this in August. (§9)
9. **Do not treat SMS as free or default.** Twilio A2P 10DLC registration takes real calendar time and carries per-message cost — make it a paid add-on, provisioned per-tenant, not core. (§8)
10. **Do not couple the pricing engine to the dog domain.** Generalize it to "priced units" (nights, sessions, hours, sq ft, per-head) so a cleaner or stylist reuses the same engine.

---

## 3. Framework decision — explained for a non-specialist

You asked for the pros/cons, so here's the plain-English version. Three realistic paths:

### Option A — Expo / React Native ✅ **Recommended**
**What it is:** You write the app once in JavaScript/TypeScript (the same language your web app already uses). It compiles to *real* native iOS and Android apps.
**Why it fits you:**
- **Reuses everything you already have:** your Supabase backend, your React knowledge, your design tokens, and — critically — your extracted pricing/booking packages run unchanged.
- **True native feel** (real native UI components), unlike a wrapped website.
- **Over-the-air (OTA) updates:** you can push most bug fixes and tweaks straight to users' phones *without* waiting days for App Store review. Huge for a solo/small team.
- **Biggest hiring pool and best AI-tooling support** if you bring on help.
- One codebase → iOS + Android + (optionally) web.
**Cons:** Slightly more work than wrapping a website; some native modules occasionally need config. Manageable.

### Option B — Capacitor (wrap the existing web app)
**What it is:** Put your current Next.js app inside a thin native shell.
**Pros:** Fastest possible path to *a* store listing; least new code.
**Cons:** WebView performance ceiling; less-native feel; **higher App Store rejection risk** for apps that are "just a website"; you'd still have to do the multi-tenant refactor anyway. **Use only as an emergency fallback** if the Expo timeline slips and you must have *something* in review by mid-September.

### Option C — Flutter
**What it is:** Google's framework; highest raw performance ceiling.
**Cons:** It's a different language (Dart) — you'd **throw away** your React/JS reuse and rebuild the front end from zero. Wrong choice given your existing stack and timeline.

### Verdict
**Expo / React Native**, reusing Supabase. Keep the **Next.js web app** as your marketing site + provider account/billing portal (this is also where SaaS subscriptions are sold, sidestepping Apple IAP). This "Expo for the apps, Next.js for the web/portal, shared TypeScript packages for the logic" shape is the modern standard for exactly your situation.

**Recommended repo shape (monorepo):**
```
petappro/
  apps/
    mobile/      ← Expo (React Native) — iOS + Android
    web/         ← Next.js — marketing + provider billing/admin portal
  packages/
    pricing/     ← extracted, tested pricing engine (the crown jewel)
    booking/     ← booking validation + availability rules
    auth-rbac/   ← roles, permissions, tenant membership
    data/        ← typed Supabase access + generated DB types
    ui/          ← shared design tokens + primitives
  supabase/
    migrations/  ← versioned schema
    functions/   ← Edge Functions (versioned together)
```

---

## 4. Requirements

### 4.1 Functional (MVP — what ships Oct 1, PetAppro)
- Provider onboarding: business profile, brand basics, services, pricing, availability, Stripe Connect link.
- Client onboarding: account, profile, pet profiles (photos w/ HEIC handling), required fields.
- **Booking flow** with live, server-validated pricing (ported engine): service selection, dates/times, participants, payment method, care notes, care-doc upload.
- **Availability & capacity engine** (see §6 — the key generalization): per-service concurrency (boarding many at once, walking ≤6, grooming 1:1, cleaning 1:1 with travel buffers).
- Staff dashboard: bookings by day, daily schedule w/ completion toggles, client/household detail, edit + reprice, block dates, private staff notes.
- Payments: **Stripe Connect** charge into provider's account; paid/unpaid tracking; balance summary.
- Notifications: push (Expo Push) for new bookings/reminders; in-app.
- Reports + **CSV export**; QuickBooks Online push (add-on).
- Meet & Greet / intro-appointment flow (generalizes to "consultation").
- Terms/House Rules acceptance, stored.

### 4.2 Non-functional
- **Multi-tenant isolation** enforced at the DB (RLS), not just UI.
- **Security:** centralized RBAC; private storage buckets; no secrets in the app bundle; PII handled per policy.
- **Performance:** native-smooth lists; optimistic updates via TanStack Query.
- **Reliability:** CI with typecheck/lint/test; pricing regression suite; staging (Supabase branch) before prod.
- **Observability:** error tracking (Sentry), basic product analytics (PostHog), payment/webhook logging.
- **Compliance:** Apple + Google policies, privacy nutrition labels / Data Safety form, ADA-minded accessibility, PCI handled by Stripe (never touch card data).
- **Scalability target:** clean path to 10k–20k users (§8).

### 4.3 Out of scope for Oct 1 (explicitly deferred)
Multi-industry white-label brands (HairAppro, etc.), in-app marketplace/discovery, advanced marketing automation, native payments beyond Stripe Connect, multi-language, team payroll/commissions.

---

## 5. Multi-tenant + white-label architecture (the SaaS layer)

This is the heart of "route product that branches per industry."

**Core tenancy tables (all child tables carry `business_id` + RLS):**
- `businesses` — the tenant. Brand name, logo, colors, domain/subdomain, industry template, timezone, terms, notification templates, feature flags (sms_enabled, quickbooks_enabled), Stripe account id.
- `memberships` — user ↔ business ↔ role (owner/staff/client). RBAC lives here.
- `services` — **the generalized product.** Name, category, pricing model, capacity model, duration, location model, buffers. (Detailed in §6.)
- `pricing_rules` — per-service, per-tenant (replaces the global `id=1`).
- `resources` — staff/rooms/equipment that services consume capacity from.
- `bookings`, `booking_participants`, `blocked_dates`, `payments`, `notes` — all tenant-scoped.

**White-label via config, not code:** a **brand resolver** reads `businesses.branding` (logo, palette, copy, terms) and themes the app at runtime. Prebuilt **industry templates** (dog care, hair, cleaning) are just seed data: a bundle of default services + pricing/capacity presets a new provider selects, then edits. This gives you both models you described: *(a)* one flexible app where a provider names their own services, and *(b)* prebuilt vertical presets you can later spin into separately-branded apps sharing one backend.

**RBAC model:** `membership.role` → `permissions` map, enforced by Supabase RLS policies (e.g., "staff of business X can read bookings where `business_id = X`"). Replaces the current email/`ADMIN_EMAIL` checks. Write a small suite of **RLS tests** so a client login can *never* read another tenant's data or the staff-notes table.

---

## 6. The generalized services / capacity engine (why this scales across industries)

The single most important design idea. Every industry you listed is a combination of a few dimensions. Model these as service attributes and one engine serves all of them:

| Dimension | Options | Dog example | Hair example | Cleaning example |
|---|---|---|---|---|
| **Pricing model** | per-night · per-session · per-hour · per-head · per-unit (sq ft/room) · tiered · flat | Boarding per-night, per-head + puppy surcharge | Cut = flat; color = tiered | Per sq ft or per room × level |
| **Capacity/concurrency** | 1:1 · fixed N · unlimited-overlap · shared-home rule | Daycare/boarding overlap; walking ≤6; grooming 1:1 | 1:1 per stylist chair | 1:1, no overlap |
| **Duration** | fixed · variable · open-ended (multi-night) | Multi-night | 30–120 min | 2–5 hrs, size-based |
| **Location** | at-provider · at-client · either | Home boarding | Salon or on-location (weddings) | Always at-client |
| **Travel/buffer** | none · fixed · dynamic | None | Setup/teardown for on-location | **Travel time between jobs** |
| **Add-ons/surcharges** | per-service | Puppy +$10; holiday windows | Long-hair upcharge | Deep-clean, pets, extra rooms |

**Engine responsibilities:** given a requested service + time + participants, (1) compute price from the pricing model + rules, (2) check availability against the capacity model and existing bookings + blocks + travel buffers, (3) return quote or a clear rejection. Your dog pricing engine already does most of #1 and part of #2 — you're *generalizing* it, not replacing it.

**Concrete rules to carry over / add:**
- **Overlap-aware capacity:** boarding = many concurrent; walking = cap 6; grooming = 1 unless flagged "same home as daycare/boarding" (a capacity exception, i.e., a config flag).
- **Travel-buffer scheduling** for at-client services (cleaners): no two jobs closer than provider's buffer; optionally distance-aware later.
- **Holiday/seasonal windows** generalize from dog holidays to any provider's "peak" calendar.

---

## 7. Business model & payments

### 7.1 Model: provider-paid SaaS + provider-owned payments
- **Providers pay you** a monthly subscription (tiers below).
- **Clients pay the provider** directly via **Stripe Connect (Standard)** — the money lands in the *provider's own* Stripe account. This matches your Woof learning ("the paying customer providing services wants to take payments via Stripe using their own account"). With **Standard Connect**, each provider connects/owns their Stripe account, Stripe bills them the processing fee (2.9% + 30¢), and **your platform pays no per-account fee.** You may optionally take a small **application fee** (platform revenue share) per transaction later.
- **Add-ons** (monthly or usage): SMS (Twilio pass-through + margin), QuickBooks sync, advanced reports/analytics, extra staff seats.

### 7.2 Suggested tiers (validate against competitors in §11)
| Tier | Price (target) | For | Includes |
|---|---|---|---|
| **Starter** | $0 or $19/mo | Solo, low volume | Core booking, 1 staff seat, Stripe Connect, CSV export, push |
| **Pro** | $39–$49/mo | Established solo / small | Everything + reports, holiday/peak pricing, care docs, priority push |
| **Business** | $79–$99/mo | Multi-staff facility | Multi-seat, capacity/resource scheduling, QuickBooks sync, roles |
| **Add-ons** | usage/flat | Any | SMS ($ + margin), extra seats, advanced analytics |

Anchor: Gingr runs ~$80–$130/mo (facilities); Booksy ~$30/pro; Vagaro $30–$90; Fresha $0 + booking fee; Square Appointments free–$49. You can undercut facility software while out-designing the solo tools.

### 7.3 Apple/Google payment compliance (critical)
- **Client→provider booking payments = real-world services consumed outside the app → Stripe is allowed** (not Apple IAP). Keep it this way; don't sell "digital content."
- **Provider SaaS subscription:** to avoid Apple's 30% IAP cut, **sell and manage the subscription on the web portal** (Stripe Billing), and keep the iOS app free-to-use for a logged-in provider. Don't put a "subscribe" purchase button in the iOS binary.

---

## 8. Software stack & subscriptions to scale to 10k–20k users

Assume "users" spans providers + their clients; 10k–20k total MAU is comfortably within mid-tier managed services.

| Layer | Tool | Plan for 10–20k users | Est. monthly |
|---|---|---|---|
| Backend / DB / Auth / Storage | **Supabase** | **Pro** ($25) covers 100k MAU, 8 GB DB, 100 GB storage; overage $0.00325/MAU. Move to Team ($599) only for SOC2/SSO/compliance needs. | $25–$100 |
| Mobile build/OTA | **Expo EAS** | Free (15+15 builds/mo) at start; **Production ($199)** only when build/OTA volume grows | $0 → $199 |
| Web/marketing/portal hosting | **Netlify or Vercel** | Pro tier | $19–$20 |
| Payments | **Stripe Connect (Standard)** | No platform per-account fee; providers bear 2.9%+30¢ | $0 to platform |
| SaaS billing | **Stripe Billing** | Included in Stripe | usage |
| Push | **Expo Push** (free) → **OneSignal** if advanced | Free–low | $0–$29 |
| SMS (add-on) | **Twilio** | A2P 10DLC reg + ~$0.008/SMS pass-through | usage |
| Error tracking | **Sentry** | Team | $0–$26 |
| Product analytics | **PostHog** | Free → paid by volume | $0–$50 |
| Accounting integration | **QuickBooks Online API** (Intuit Developer) | Free to integrate; CSV export as baseline | $0 |
| Email (transactional) | **Resend / Postmark** | Low tier | $0–$20 |
| Design | **Figma** | Existing | existing |
| CI | **GitHub Actions** | Free tier likely sufficient | $0 |

**Rough platform run-rate at 10–20k users: ~$300–$700/mo**, dominated by Supabase Pro + EAS Production + observability. Everything scales linearly and predictably; no early re-platforming needed.

---

## 9. iOS & Android setup and requirements

### Accounts & legal identity (start in August)
- **Form the business entity first** (§10) — you want store accounts under the company, not your personal name.
- **Apple Developer Program:** $99/year. As an **Organization** you need a **D-U-N-S number** (free, but allow 1–2 weeks to obtain/verify).
- **Google Play:** $25 one-time. **Register as an Organization** (needs D-U-N-S) to **avoid the 12–20-tester / 14-day closed-testing requirement** that now applies to *personal* accounts. Organization + prior track record still means you should run a closed/internal test track anyway — but you control it.

### Store review reality (2026) — the schedule driver
- iOS: ~90% reviewed within 24h, but a new/finance-adjacent app realistically **2–5 days end-to-end**, longer in **September/December** (holiday crunch — right before your target). **~40% of first submissions get rejected**, so budget for at least one rejection + resubmit cycle.
- Android: closed-testing track + review; plan a week of buffer.
- **Implication:** your **first store submission must land by ~Sept 8–12** to safely clear review (plus a rejection cycle) before Oct 1. TestFlight/closed-track beta should be running by **late August**.

### Store listing assets (prepare in September)
App name, subtitle, keywords, description, privacy policy URL, support URL, screenshots (multiple device sizes), app icon, **Apple privacy nutrition labels**, **Google Data Safety form**, age rating, and (for finance-adjacent) account-deletion flow (Apple requires in-app account deletion).

### Technical
- Expo EAS Build for signed iOS/Android binaries; EAS Submit to push to stores.
- Push entitlements (APNs + FCM) configured via Expo.
- Deep links / universal links for booking confirmations.

---

## 10. Business setup & business plan

### 10.1 Setup checklist (August)
- **Entity:** form an LLC (single-member or with Marco); consider S-corp election later. Operating agreement if multi-owner.
- **EIN**, business bank account, business card.
- **D-U-N-S number** (needed for Apple org + Google org) — start early.
- **Insurance:** general liability + tech E&O (you're handling others' business/payment data).
- **Legal docs:** Terms of Service, Privacy Policy, provider (merchant) agreement, DPA. Use a reputable template + a lawyer review; don't hand-roll for a payments-adjacent SaaS.
- **Trademarks:** search + file "PetAppro" (and consider the "___Appro" family) — do a clearance search before committing to the brand.
- **Domains:** petappro.com + the vertical names you may want (hairappro, cleanappro) defensively.
- **Payments/tax:** Stripe account for platform + Stripe Connect enablement; sales-tax/economic-nexus review (SaaS is taxable in some states — talk to an accountant).

### 10.2 Market & positioning
- **The gap:** facility software (Gingr) is powerful but expensive and dated; solo tools (Fresha/Booksy/Square) are polished but generic and not built for the *operational* realities of in-home/mobile service providers (capacity, travel, multi-participant, per-night/per-unit pricing). **PetAppro's wedge:** the best-designed booking + capacity + pricing engine for *operationally complex, small* service providers, starting with pet care where you have lived expertise.
- **Beachhead:** dog boarding/daycare/walking/grooming operators (you *are* the customer — huge credibility and a built-in first design partner).
- **Expansion:** same engine → cleaners, stylists, then broader home services. Prebuilt industry templates make each expansion a config exercise, not a rebuild.

### 10.3 Go-to-market
- **Design-partner launch:** onboard 5–15 real pet-care operators (your network + local SF community) before public launch. Free/discounted in exchange for feedback + testimonials + case studies.
- **Content + community:** SEO around "dog boarding software," "pet sitting scheduling app," in-home service scheduling; presence in pet-pro Facebook groups, r/dogboarding, local pet communities.
- **App Store Optimization** from day one (keywords, screenshots, reviews).
- **Referral loop:** providers invite clients (who become the app's growth engine); provider-to-provider referral incentives.

### 10.4 Unit economics (illustrative)
- Target ARPU: ~$40/mo blended (mix of tiers + add-ons).
- At 500 paying providers → ~$20k MRR; each provider brings dozens–hundreds of client users (your 10–20k total-user target is reached well before 500 providers).
- Platform cost per provider is a few dollars/mo → healthy gross margin; the model is provider-count-driven, so acquisition + retention of *providers* is the core metric.

### 10.5 KPIs
Providers activated, provider retention/churn, bookings processed, GMV through Connect, client MAU, time-to-first-booking, add-on attach rate, App Store rating.

---

## 11. Competitive landscape (for positioning, not to copy)

| Product | Focus | Price | Takeaway for PetAppro |
|---|---|---|---|
| **Time To Pet** | Pet-service depth; dual apps (sitter/owner) | mid | Best-in-class pet mobile UX — match the dual-app clarity |
| **Gingr** | Physical facilities (daycare/boarding/grooming) | ~$80–$130/mo | Powerful but pricey/complex — undercut on price + design |
| **Scout** | Brand-forward client app | mid | Proof that *brand/design* wins clients — your white-label edge |
| **Booksy** | Salon marketplace + booking | ~$30/pro | Marketplace exposure model; heavy in beauty |
| **Vagaro** | Salon/spa operations + POS | $30–$90 | Deep ops tooling; generic across beauty |
| **Fresha** | Free + per-booking fee | $0 + 2.19%+20¢ new-client | Aggressive pricing pressure — informs your Starter tier |
| **Square Appointments** | Solo/team + Square hardware | free–$49 | Strong if already on Square; generic scheduling |

**Positioning statement:** *PetAppro is the booking platform for operationally complex service providers — built around real capacity, travel, and pricing rules the generic tools ignore — starting with pet care, expanding to any service where scheduling is more than a calendar slot.*

---

## 12. Best-practice product design & dev flow

The sequence to follow (mapped to the roadmap):

1. **Discovery & user journeys** — map the two core actors (provider, client) end-to-end: onboarding → first booking → recurring use → payment → reporting. Add the staff sub-role. Interview 3–5 real providers now.
2. **Information architecture & flows** — screen inventory + navigation map for mobile (tab structure), plus the web provider portal.
3. **Wireframes (low-fi)** — every MVP screen, greyscale, in Figma. Validate flows before visual polish.
4. **Design system in Figma → tokens** — you already have the token set from Woof; port to a shared `packages/ui` for React Native. Atomic structure (atoms → molecules → organisms) already exists.
5. **Hi-fi prototypes** — clickable flow for the booking + onboarding paths; test with 2–3 providers.
6. **Accessibility pass** — WCAG-minded contrast, touch targets ≥44px (already your button standard), screen-reader labels.
7. **Build in vertical slices** — ship one full flow at a time (auth → onboarding → booking → dashboard), each behind CI + tests.
8. **Instrument** — analytics + error tracking from the first build, not after launch.
9. **Beta → iterate → submit** — TestFlight/closed track with design partners; fix; submit to stores.

*(Your installed Figma, design-critique, accessibility-review, user-research, and ux-copy skills cover steps 1–6 directly; the pptx/docx skills cover investor/partner materials.)*

---

## 13. Brand & marketing

- **Naming:** "PetAppro" as the beachhead brand; the "___Appro" family (HairAppro, CleanAppro) as future white-label verticals sharing one backend. **Clearance-search and trademark before you commit** — verify the "Appro" family is available in relevant classes. Have a backup name ready.
- **Brand system:** you already have a warm, refined palette and type system from Woof (cream/terracotta, Inter, rounded 24px cards, pill buttons). Evolve it into a PetAppro identity: logo, app icon, marketing site, store screenshots. (Your Adobe Express / canvas-design / Figma skills can generate these.)
- **Marketing site:** Next.js — value prop, per-industry landing pages (future), pricing, provider sign-up → portal. Doubles as the compliant place to sell SaaS subscriptions.
- **Launch content:** demo video (Adobe Quick Cut), 3–4 provider case studies, comparison pages vs. Gingr/Time To Pet, ASO assets.
- **Channels:** pet-pro communities, local SF launch, ASO, referral loop, targeted content SEO. Paid ads only after organic + design-partner proof.
- **Approved social & ad platforms (company policy):** Meta (Instagram, Facebook, Threads), TikTok, and LinkedIn only — for both organic pages and targeted advertising. **PetAppro does not use X/Twitter or any Elon Musk platform.** To be formalized in the company brand/marketing policy.

---

## 14. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Oct 1 slips due to store review/rejection | High | High | Submit by ~Sept 10; budget a rejection cycle; Capacitor fallback for a store presence if Expo slips |
| Multi-tenant refactor takes longer than hoped | Med | High | Do extraction + tenant schema *first*; keep MVP feature scope frozen |
| Solo/small-team bandwidth | Med | High | Sequence ruthlessly; use OTA updates to de-risk post-launch fixes; consider one contract RN dev for Sept crunch |
| Apple IAP dispute on subscriptions | Med | Med | Sell SaaS on web only; keep booking = Stripe (services exemption) |
| Money bug from divergent pricing logic | Med | High | One shared pricing package + regression tests + CI before refactor |
| Google closed-testing delay | Med | Med | Org account; start internal testing track in late Aug |
| Trademark/name conflict | Low-Med | Med | Clearance search now; backup name |

---

## 15. Immediate next actions (this week)

1. **Confirm scope freeze:** PetAppro dog vertical, native, on a services-core + tenant-aware foundation. Everything else deferred.
2. **Kick off business formation + D-U-N-S** (long lead items for store accounts).
3. **Stand up the monorepo** and extract the **pricing** package *with tests first* (lock behavior before touching it).
4. **Design tenant-aware schema** (`businesses`, `memberships`, generalized `services`, per-tenant `pricing_rules`) as additive Supabase migrations on a **branch**.
5. **Start provider discovery interviews** (3–5 pet-care operators) to validate the services/capacity model.
6. **Begin wireframes** for the mobile booking + onboarding flows in Figma.

See the companion file **PetAppro-Roadmap-and-Project-Plan.md** for the week-by-week plan, milestones, Notion database structures, and the schema starter — all formatted to paste straight into Notion.

---

## Open questions for you

1. **Team:** Solo (you + Claude Code) or will you bring in a contract React Native dev for the Sept crunch? This most affects whether Oct 1 is realistic.
2. **Budget ceiling** for tooling + any contractors through launch?
3. **First design partners:** do you have 3–5 real pet-care operators (besides yourself/Marco) who'd beta test?
4. **Entity:** just you, or you + Marco as co-owners? (Affects operating agreement + store account ownership.)
5. **"Appro" brand family:** committed, or open to alternatives pending a trademark clearance search?
6. **Existing Woof clients:** migrate them onto PetAppro as tenant #1, or keep Woof running in parallel during the transition?
7. **SMS at launch:** needed for MVP, or genuinely fine as a post-launch add-on (recommended)?
