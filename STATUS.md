# STATUS — end-of-day reports (all agents)

> ▶️ **RESUME HERE (Sun 2026-08-16, launch sprint):** goal = marketing site LIVE → Apple → build app.
> **Next box:** (1) Danny: Vercel Pro, sign in with the GitHub that owns `dannyrb71/base509`, connect repo, **Root Directory = `apps/web`**; (2) Claude Code: stabilize `apps/web` + **push** on Danny's "ready to deploy"; (3) `waitlist` table (first `supabase/` migration + anon-insert RLS) + wire form to Supabase+Resend — the route still points at a webhook, must insert to Supabase; (4) preview → review → "ready to deploy" → Cloudflare DNS (grey cloud, keep Google MX) → verify → LIVE → Apple enrollment.
> **Done Sat:** Supabase project (`ecdmtldlqvkdvmyxgpzr`), Resend (base509.com verified), Google Maps service-area wired (Google Maps + Terra Draw), Meta FB Page + IG @petappro created + footer links wired.
> **Open for Danny/Codex:** service zones = ALL tiers, default + per-service/window override (walk-windows §8); Codex data-model pass (service_windows + service_zones); D-072 reword (temporary hold). Keep Supabase scope = waitlist table only (NOT CFG-1).


> One place for every agent/chat to post a brief end-of-day (or end-of-session) report, so Danny has a
> single scannable view of what happened across the whole team. **Newest first.** Folder-connected
> chats (Cowork, Design System, Woof-audit, Claude Code) write here directly; George's report is
> pasted in by Cowork. Keep entries short.
>
> **Format:**
> ```
> ## YYYY-MM-DD — <Agent / chat>
> - Done: …
> - Decisions / open questions: …
> - Ready to push? yes/no (what)
> ```

---

## 2026-08-15 — Codex (web launch board/timeline re-baseline)
- **Done locally:** Base509 site is push-ready; policies are published in the local registry; the PetAppro design system is published as a library; the PetAppro marketing site is built from real Figma content; the provider portal is in progress with an optional/offline booking-payments model. Codex reran `apps/web` production build: **green**, 53 routes generated.
- **Current launch bottleneck:** `apps/web` has **never been pushed to GitHub**. The next controlling action is Danny's go → Claude Code makes the first push. That gates Vercel connection with `Root Directory = apps/web` → preview review → domain/HTTPS/route verification → approved production promotion → hosted Supabase/Resend waitlist activation.
- **Risk / sequencing:** “Built,” “published in the local registry,” and “library published” do not mean the web surfaces are deployed. Until the first push occurs, Base509/PetAppro URLs, policy routes, provider portal, and waitlist cannot receive production verification. This is the immediate bottleneck to launch.
- **Ready to push?** `apps/web` is locally build-green and reported push-ready; **no commit or push performed. Danny approval remains required, and Claude Code is the designated pusher.**

## 2026-08-12 — George / PM + Codex (web critical path + review queue)
- **Base509:** Multi-domain `apps/web` structure is final locally; policy registry has six additional policies marked published v1.0 and the retired Terms `/v/0.1` draft removed from public history. GitHub/Vercel connection is scheduled Aug 13. The work is **not yet pushed or live** (`origin/main` remains `6e5140a`; `apps/web` is untracked locally).
- **Review findings / queue:** **WEB-R1 CHANGES-NEEDED pre-push** — `npm run build` compiles, then fails type-checking at `src/app/base509/page.tsx:126` because `Section` does not accept the supplied `className`. Fix and rerun to green before GitHub/Vercel. WEB-R2 remains queued for the policy publication/history change. Additional pre-push provenance flag: `policies.ts` says Danny published on **2026-08-13**, while the six policies are effective/current on **2026-08-12**; correct or confirm before push.
- **Critical path:** After Base509 preview/deploy, sequence the approved PetAppro Figma→code site, then the authenticated provider subscription/billing web experience. Both now sit on the October launch critical path alongside—not instead of—the tenant/RLS foundation.
- **Money guardrail:** Provider SaaS subscription = Stripe **Billing**, provider→Base509, authenticated web only. Booking payment = Stripe **Connect**, client→provider for physical services. Do not share Customers, saved methods, webhooks, ledgers, or authorization paths. Native must contain no SaaS purchase, Customer Portal link, upgrade CTA, or direction to buy.
- **Board/roadmap:** Added WEB-R1/WEB-R2/WEB-1/WEB-2/BILL-1/BILL-2/BILL-R; advanced MKT-4/MKT-5 to local review states; scheduled BIZ-12 for Aug 13; promoted MKT-5c/MKT-6 to critical path.
- **Ready to push?** Plan/status changes are local. No staging, commit, push, Vercel connection, or deployment performed.

## 2026-07-31 — George / PM + Codex technical governance (daily brief / recovery re-baseline)
- **Outcome:** Re-cut the calendar around a **Jul 31–Aug 14 Foundation Recovery Sprint**. Oct 1 is now **RED / trending NO-GO**; Oct 21 is the working recovery target and remains conditional on the Aug 15 gate. The local roadmap and shared task board are reconciled to repository evidence.
- **Aug 15 GO/NO-GO:** D-U-N-S is **GREEN** (Base509 LLC, 11-314-3683). Tenant schema + RBAC/RLS is **RED / not started** (`supabase/` is absent). GO requires versioned additive migrations, `business_id` tenant boundaries, stable account/membership/RBAC helpers, RLS + `WITH CHECK`, provider/client/staff cross-tenant negative read/write tests, generic five-axis services + capacity groups, generated DB types, and green CI.
- **Sprint reality:** `packages/pricing`, `packages/tokens`, `packages/ui`, CI workflows, and the web scaffold exist. `supabase/` and `packages/booking` do not; `apps/mobile` is configuration only. The stale seven-TODO Sprint 1 board is closed/reconciled and remaining work moved into the recovery sprint.
- **Architecture ruling:** Boarding/daycare/walking remain presets of the generic engine. Capacity persists as `bounded | unlimited` with an optional tenant-scoped `capacity_group_id`; it must not reuse scheduling `conflict_group_id`. This preserves provider-defined service types as a configuration-UI unlock instead of a rewrite.
- **Money follow-through:** D-063 is decided in product/specs but **not implemented by the current pricing engine**: current overage logic compares actual vs scheduled end, while the locked rule is determinable at booking from booked pickup vs drop-off + covered hours. Opened REC-2 for the correction, flat-fee/waiver behavior, and boundary tests. D-064 (free Meet & Greet), D-065 (transactional care-task reminders in scope/flex), D-053 (messaging out), dashboard grouping deferral, and D-062k (long-stay price override for MVP) are reflected in sequencing.
- **Store clock:** BIZ-12 Vercel Pro → deploy minimal live base509.com (MKT-4/LR-5) → BIZ-5 Apple Organization enrollment → BIZ-6 Google Play. Complete BIZ-10b address propagation before store submission. Target-2 submission window is ~Oct 1–3, leaving the remaining time to Oct 21 for review/fixes.
- **Risk / handoff:** Roughly two weeks of work remain local and unpushed (18 modified, 21 untracked at final audit; includes pre-existing user/agent work). No Git writes were made; Claude Code remains sole committer/pusher after Danny's explicit “ready to deploy.”
- **Ready to push?** Local roadmap/task/status/spec corrections are ready for Claude Code to include in the next authorized batch; no commit/push/deploy performed.

## 2026-07-30 — Cowork (catch-up standup; ⚠ ~2-week unpushed spec batch + Sprint 1 slip)
- **Standup gap:** last STATUS entry was 2026-07-22. This reconciles 07-22 → 07-30. Hand-off prompts issued this session for Codex (review queue), George/PM (alignment), and Claude Code (work order).
- **⚠ Critical — a fortnight of work is uncommitted/unpushed.** The GitHub mirror is stuck at `09ac2ad` (Jul 16). Codex reviews and Claude Code builds off the mirror, so **none of the below is visible to them yet.** Needs Danny's "ready to deploy" → Claude Code batches the push.
  - **New specs (untracked):** `CANONICAL-SOURCES.md` (single-home-per-fact registry), `provider-onboarding-configuration.md` (wizard / CFG gate), `transactions-payments-and-invoicing.md` v2 (non-custodial posture, Connect direct charges, D-062), `provider-dashboard.md` ("Today"), `provider-reports.md` (off Woof), `capacity-model.md` (two-layer capacity — **needs Codex ratification**), `design-system-components.md`, the full `legal/` folder (+ LG-1…LG-11 triage), `apps/web/` scaffold, `marketing/`.
  - **Modified (tracked):** `open_decisions.md` (+454 lines — D-056+), `mvp_roadmap.md`, `website-content-and-structure.md` (+447), `pricing-tiers-and-features.md`, `provider-settings-ia.md`, `user_roles_and_permissions.md`, `data_model_draft.md`, `technical_architecture.md`, `booking_and_pricing.md`, `competitive-analysis.md`, `CLAUDE.md`.
- **⚠ Sprint 1 board is stale AND the real foundation is missing.** The board marks all 7 items `TODO`, but in reality `packages/pricing` (39+8 tests), `packages/tokens`, `packages/ui`, and CI workflows (`.github/workflows/ci.yml`, `eas-build.yml`) **already exist and were never marked done**. The genuinely missing piece is **`supabase/` — no migrations, no five-axis `business_services` schema, no RLS (= CFG-1)** — which is the ~Aug 15 GO/NO-GO item and gates the onboarding wizard (CFG-2). The ~Jul 18 pivot checkpoint is still effectively missed on the tenant-schema half; runway to ~Aug 15 is ~16 days. Needs a Danny/PM decision: re-cut Sprint 1 or re-baseline the calendar, and reconcile the board to reality.
- **Doc cadence slipped:** specs were modified 07-27/28/30 without matching `TASKS.md` changelog entries; a consolidated entry was added today. Focus block (was dated 07-06) refreshed to the week of 07-27.
- **Ready to push?** No commits from Cowork (Claude Code is the sole committer). This entry + the `TASKS.md` focus/changelog refresh are local edits for the next authorized push.

---

## 2026-07-22 — Cowork (Wireframes 2.0: Review-01 applied + Phase 2 COMPLETE — full flow coverage)
- **Done (Figma page "Wireframes 2.0", ~41 sections / ~250 frames):**
  - **Review-01 cross-cutting:** ✕ full-exit on 84 multi-step screens + discard-guard pattern; ALL frames coded (CLIENT-/PROV-/WEB-/STAFF-XXX-nn, 147 renamed); status vocabulary enforced (Booking: Pending·Upcoming·In-Progress·Completed·Cancelled / Payment: Pending·Due·Past Due·Paid·Refunded; Written-off never client-side; "Pending & past-due charges" replaces "Outstanding"); Stripe card-storage copy ("card details stay with Stripe") on every save-a-card surface.
  - **Review-01 per-flow:** refund state copy + partial itemization · delete passkey step-up + debt-not-forgiven · GPS interstitial rewritten to Danny's plain copy · remove-card loops to replacement · approve-anyway-over-capacity (logged) · provider-side cash verification labels · write-off invisible client-side · override Other-note + inline error · billing annual toggle + advance dunning + upgrade CTA · **WEB portal nav shell** (Services/Branding tab structure; orphan pages fixed) · logo no-logo→business-name-text · themes-by-plan upsell matrix · closure successor fields + auto CSV/PDF balance export + unauthenticated verified client-export web page + app tombstone · auth passkey + entry QR scan · onboarding required fields + pet DOB (derive age/puppy) · booking ESTIMATE line-item breakdown + save-PDF · **M&G gate now HARD** (held-branch removed; provider override instead).
  - **Phase 2 (16 new sections):** M&G cluster (client request loop · provider mgmt incl. clear-without-meet OVERRIDE · staff execution) — **full provider setup wizard WEB-WIZ-01…12** (§2 step order, §5 service matrices incl. duration_tiered walking + partial_unit_overage boarding, §3 control taxonomy, §7 policy editor w/ token prefill + hide/show, §8.1 Stripe w/ KYC pending/restricted states, defaults-only go-live, save-and-resume) — booking lifecycle (Change w/ reacceptance · Cancel w/ D-062f prepaid/unpaid/past-due fee branches · Recurring occurrence-vs-series) — operations (care execution w/ D-046 lock + offline queue · daily schedule · manage bookings · manage clients pet-first w/ referral source · staff/team w/ role capability copy · communications **D-053-safe** (share/broadcast; two-way threads drawn as parked fast-follow ⚑Danny confirm) · notification center both roles · invoices/receipts w/ CSV + QuickBooks exports · client updates/report cards).
- **Flags for Danny:** ① Phase-2 brief asked for message threads — D-053 says no chat at MVP; drew the MVP-safe surface + a parked threads frame, confirm which wins. ② Walk-cap stepper ceiling (spec §10) and GPS route retention [N days] still placeholders. ③ Themes-by-plan groupings placeholder pending D-020/D-040.
- **Ready to push?** no repo changes — Figma only.

---

## 2026-07-11 — Codex (D-050 tier-entitlement architecture ratification)
- **Done:** Ratified D-050 in `docs/planning/technical_architecture.md`. Base509 master is the billing/catalogue authority; PetAppro holds a tenant-scoped, server-written enforcement projection for local API/RPC/Edge Function and RLS checks. Specified event-driven instant propagation/refetch, capability-based gates for payments/seats/themes/GPS/messaging/SMS, atomic Starter ≤5 active-client enforcement, downgrade/over-limit handling without data deletion, and fail-closed Starter defaults on missing/stale/invalid resolution.
- **Decisions / open questions:** No product decision required for the architecture. Implementation gate: additive schema + generated types; signed/idempotent projection sync; shared server helpers; negative endpoint/RLS tests per capability; concurrent cap tests; stale/outage and webhook-ordering tests.
- **Ready to push?** no — design-only local edits; Claude Code is the sole committer/pusher after Danny approval.

## 2026-07-10 — Claude Code (pushed 5319f8c)
- **Pushed:** `5319f8c` → `origin/main`. Bundle: `packages/pricing` per-session/per-unit fix + 39-test suite, `open_decisions.md` D-041–D-048, `product_brief.md`, `ALIGNMENT.md` governance update, `STATUS.md`.
- **Ready to push? DONE**

---

## 2026-07-10 — Codex (single-committer governance alignment)
- **Done:** Adopted locked `ALIGNMENT.md` §1 single-committer model. Codex will edit local files only within its assigned lane and will keep all Git operations read-only (history, diffs, PR/CI inspection). Codex will not stage, commit, branch, merge, push, or otherwise write Git state; Claude Code is the sole committer/pusher and Danny approves every push.
- **Decisions / open questions:** None.
- **Ready to push?** no — status recorded as a local edit for Claude Code to include when authorized.

## 2026-07-10 — Design System (brand, theming, icons, naming — for PM sign-off)
- **Done:**
  - **Brand:** PetAppro base brand = **Brandy Blue** default theme; 5 dog-named bands (Brandy Blue · Camo Green · Coco Coral · Bella Sky · Maverick Grey); Poppins. Tokens lint-clean.
  - **Theming = Theme × Scheme matrix** (all 6 themes × Light/Dark). Dark = "light islands" (brand-tinted dark canvas, white holder cards). Verified in Figma; demo frames on `04 Themes` fixed and flipping across both axes.
  - **Icons:** locked **Phosphor (fill) as the base** icon set + 2 custom marks (Boarding doghouse, Walking dog — Danny's SVGs). Built as swappable `icon/*` components (24×24, proportions locked, fill bound to token). Full service set: boarding/walking/daycare/house-sitting/drop-in/grooming/training/pickup/meet-greet/health.
  - **Naming convention** documented (`design-system/docs/naming-conventions.md`): tokens (slash/lowercase), components (atomic-layer folders + PascalCase, variant sets), icons (`icon/<name>`), pages/§sections. Applying now.
  - Built atoms so far: Button, Status Badge (8), Service Pill (8) — being upgraded to convention + icons.
- **Decisions needing product/PM awareness:**
  - **Rover fully removed** from PetAppro (page + all affordances) — Woof-only. (Flag for George/roadmap.)
  - **Service model = generic timed services** (start/end triggers; future verticals may auto-trigger + a "no-show → fee" toggle). Services: boarding, daycare, walking, house-sitting, drop-in, grooming, training, pickup, meet & greet (+ health/vet). Confirm this taxonomy with product.
  - **Responsive dual-platform** confirmed (mobile app + provider website); components built responsive.
  - **Theming tiers** (for entitlements): Tier 1 = default (Brandy Blue) · Tier 2 = pick 3 · Top = all · **add-on theme packs** (Holiday/Spring; free-or-paid TBD) — needs a product/pricing decision.
- **Tonight (autonomous build):** applying naming + page reorg, then building atoms → molecules → organisms (text inputs, buttons, images, avatars, form elements + forms), all token-bound with code syntax so Claude Code can implement directly.
- **Ready to push?** yes — `design-system/docs/naming-conventions.md`, `tokens/**` (matrix + brand), `CHANGELOG.md`; Figma file updated (not git-tracked). Pending Codex governance review.

---

## 2026-07-10 — Claude Code (Codex hardening v2: per-session/per-unit rate resolution bug)

- **Done:** Fixed the same per-date rate-resolution bug in `per_session` and `per_unit` models that the previous session fixed for `per_night`. The v0.3.0 `resolvePerNightRates` helper was renamed to `resolvePerUnitRates` (same algorithm, adds `unitSingular` label param) and is now invoked for all three dated models when `rate_tiers` are configured:
  - `per_night` ✓ (was already fixed)
  - `per_session` ✓ (new — daycare bug: 5-day stay with 1 holiday day was billing 5 × holiday rate)
  - `per_unit` ✓ (new — same logic extended)
  - `flat` remains whole-booking (no per-date concept)
  - No-dates fallback: `resolveRateTier` skips its holiday check when `start_at`/`end_at` are absent, so the holiday tier is never mis-fired without date evidence.
- **Engine version bumped to v0.3.0** (same version — this is the same release candidate).
- **New golden tests (39 total, 8 skipped — was 35+8):**
  - Daycare 5-day / 1-holiday regression: `4 × $45 + 1 × $60 = $240`, two base lines, `rate_tier_condition` undefined.
  - All-holiday daycare: `1 × $60`, one base line, `rate_tier_condition === "holiday"`.
  - No-holiday daycare: `3 × $45`, one base line, `rate_tier_condition === "regular"`.
  - Line-sum invariant for mixed per_session stays.
- **All 39 tests green, 8 skipped. `tsc --noEmit` clean.**
- **Ready to push? NO — waiting for Danny's "ready to deploy"**

---

## 2026-07-10 — Claude Code (Codex hardening: per-night rates + purity + validation + freeze)

- **Done:** Applied all four Codex `c8b5628` findings to `packages/pricing` (engine bumped to v0.3.0):
  - **BLOCKER fixed — per-night rate resolution:** `resolvePerNightRates()` now iterates each calendar date independently. Only holiday-calendar dates get the holiday rate; all other nights stay at regular (or extended if the whole stay qualifies). Mixed stays emit one base line per condition group (e.g. "3 × $75 regular + 2 × $90 holiday"). The whole-stay `resolveRateTier()` is kept as the fallback for non-per_night models and when booking dates are absent.
  - **Function purity:** Removed module-level `let _sortOrder` and `nextOrder()`. Replaced with a local closure counter via `makeCounter()` inside `calculateBookingPrice`. Each call starts fresh; no cross-call interference.
  - **Runtime validation:** `assertMinorUnit()` + `assertPositiveInt()` called via `validateInputs()` at the top of every calculation. Throws `[pricing] <label> must be a non-negative integer minor unit; got <value>` for non-integer, negative, or non-finite inputs (quantity, rate_minor, amount_minor on all rules, participant rates, addon rates).
  - **Deep freeze:** `deepFreeze<T>()` recursively freezes the returned `PricingBreakdown`. Mutation at the call site throws `TypeError` in strict mode.
- **New golden tests (35 total, 8 skipped — was 24+8):**
  - **(a)** Mixed stay: 5 nights (3 regular $75 + 2 holiday $90) → subtotal 40500, two base lines, `rate_tier_condition` undefined.
  - **(b)** All-holiday stay: 2 holiday nights → 18000, one base line, `rate_tier_condition === "holiday"`.
  - **(c)** No-holiday stay with rate_tiers: 3 regular nights → 22500, one base line, `rate_tier_condition === "regular"`.
  - Line-item sum invariant test for mixed-rate stays.
  - Deep-freeze invariant: `Object.isFrozen(bd)` and `Object.isFrozen(bd.totals)` true; mutation throws.
  - Runtime validation: quantity=0, quantity=1.5, negative rate_minor, NaN, fractional amount_minor all throw `[pricing]` errors.
- **All 35 tests green, 8 skipped. `tsc --noEmit` clean.**
- **Ready to push? NO — waiting for Danny's "ready to deploy"**

---

## 2026-07-10 — Codex (tech-governor: D-039 / D-041–D-046 review)

- **Done:** Freshness gate passed at `c8b5628` (`main == origin/main`, above `7e2ec97`); D-039 revision and D-041–D-047 are present. Reviewed only the requested pricing/data-model/decision scope. Ran `packages/pricing`: **24 passed, 8 skipped**.
- **Pricing findings (CHANGES NEEDED):**
  - **Blocker — mixed holiday stays overcharge:** `packages/pricing/src/engine.ts` `resolveRateTier()` selects holiday when *any* booking date matches, then applies that rate to the entire quantity. This conflicts with `booking_and_pricing.md` §6.2/holiday granularity (boarding per-night, daycare per-day, walking per-session/day). B3 covers only three all-holiday nights, so it does not catch the defect. Split the base into condition-homogeneous lines/units (or otherwise resolve per unit) and add mixed regular+holiday boundary tests.
  - **Should-fix — purity/reentrancy claim is too strong:** `engine.ts` uses module-global mutable `_sortOrder`, plus `Date`, `Math.random`, and UUID generation inside calculation. Inputs/config are not mutated and totals are repeatable, but the function is not referentially transparent and concurrent/reentrant calls can interfere with ordering. Make ordering call-local and inject/provide calculation metadata if strict purity is required; strengthen the test beyond totals/amount arrays.
  - **Should-fix — snapshot immutability is a persistence contract, not implemented here:** the returned `PricingBreakdown` is mutable and does not carry the full `PricingConfig`, despite the type comment saying to carry config verbatim. The draft DB has an authoritative `booking_price_breakdowns` row, but no booking-create persistence exists in reviewed scope. Persist the resolved config/context (including tier/date inputs) server-side and preserve prior snapshots on reprice before calling this implemented.
  - **Should-fix — numeric invariants lack runtime validation:** types document integer minor units and bps/ppm, and percentage math rounds half-up per generated percentage/tax line, but the engine accepts fractional/negative/out-of-range values and can create negative taxable subtotals/totals. Add boundary validation and tests (integer/safe-integer money, valid bps/ppm, discount caps). Remaining percentage discounts are correctly additive/non-compounding for valid inputs; B3/B4 correctly prove explicit-rate and flat-fee behavior in their covered cases.
- **Data-model feasibility (§8):** (1) **Net-new schema work:** `business_services.date_model` has `overnight|day|slot` and pricing supports `per_night`/`per_session`, but there is no explicit `per_visit` model and no booking/service location attribute (`location_id` is expressly deferred). Drop-in/in-home can reuse pricing/date concepts, but location + service semantics are not already carried. (2) **Small-to-moderate extension of an existing availability domain, but net-new conflict logic:** blocked dates/capacity and server enforcement exist; booking-overlap/conflict groups do not. Add tenant-scoped service conflict policy and transactional server-side overlap enforcement/tests. (3) **Net-new:** no visit-instance/check-in/out/report-card tables support N visits per day. Add booking visit occurrences and per-visit report-card lifecycle with `business_id`, RLS, timestamps, assignment, and completion lock. (4) **Small extension in pattern, new fields/persistence:** D-043 follows the immutable pricing-snapshot principle, but hours/off-hours/travel/source-rate settings are not present in the draft booking/breakdown model or current engine output as a complete config snapshot.
- **Architecture/governance:** D-041 fits one shared Supabase/RLS backend, but `technical_architecture.md` still describes web as thin marketing/billing only and must be revised before build. Web and native must share identity mapping and active-tenant semantics; never trust a client-supplied `business_id`; config writes need owner/admin authorization, step-up for financial/security-sensitive actions, server/RPC boundaries, audit, CSRF-safe web sessions, and RLS regression coverage across both clients. D-042 has no implementation violation visible (no product app code in reviewed scope; web-only SaaS billing is the standing architecture), but architecture/data-model docs still incorrectly say Connect is post-MVP/manual-only and must be reconciled; enforce no native subscription purchase/link/CTA. D-044 is compatible with D-034–D-038 only if ciphertext remains tenant-scoped under RLS, plaintext decrypt occurs through a narrowly authorized/audited server path for the assigned provider, keys are separated/rotatable, plaintext is excluded from logs/backups/notifications/analytics, and biometric reveal is only an additional client gate. The decision does not yet specify that implementable design. D-045/D-046 require the schema/RLS additions above. D-047 remains open and was not reviewed.
- **Verdict / open questions:** **CHANGES-NEEDED** for pricing before governor approval. Data-model answers: **(1) net-new schema, (2) existing domain + net-new conflict engine, (3) net-new, (4) reusable pattern + new persisted snapshot fields.** Design-system review remains HELD as requested.
- **Ready to push? NO** — review entry only; no code or governed files changed, committed, pushed, or deployed.

---

## 2026-07-10 — Claude Code (D-039 revision)

- **Done:** Revised `packages/pricing` to implement D-039 (explicit rates, no % surcharges). Engine bumped to v0.2.0.
  - **`types.ts`:** Added `RateTier` / `RateTierCondition` types. Added `rate_tiers?: RateTier[]` to `ServiceRate`. Replaced `PricingRule` with discriminated union `SurchargeRule | DiscountRule` — TypeScript now enforces at compile time that surcharges can only be `action: "fixed_amount"`. Added `per_unit?: boolean` to `SurchargeRule` (puppy +$X/night). Added `rate_tier` to `AppliedPricingRule.action` union.
  - **`engine.ts`:** Added `resolveRateTier()` helper (priority: holiday > extended > regular; explicit rate lookup, no % at any step). Step 2 now calls `resolveRateTier()` and emits `rate_tier_condition` in `booking_context` and `AppliedPricingRule`. Step 5 (flat surcharges) supports `per_unit` multiplication. Step 7 (% surcharges) **removed entirely** — the engine now has zero code paths for percentage surcharges.
  - **`golden.test.ts`:** B3 rewritten to holiday rate-override test (`$90/night` explicit rate, asserts no % in `applied_rules`). B4 rewritten to flat surcharge stack test (puppy `per_unit=true` + travel flat). W3 rewritten to flat holiday walk fee ($6 flat, not $6 = $30 × 20%). "No floats" invariant now uses `% discount` (not `% surcharge`) to produce fractional intermediates. "Additive not compounding" invariant now tests % discount codes (the only remaining % use).
  - **All 24 tests green, 8 skipped, TypeScript strict + `exactOptionalPropertyTypes` clean.**
- **Decisions / open questions:**
  - **D-039 fully implemented.** `PricingRule` discriminated union means the Supabase caller and any future admin UI will get compile-time errors if they try to create a % surcharge.
  - **`per_unit` on SurchargeRule** is the MVP shape for puppy/extra-dog per-night flat fees. If "extra dog" should also be a `ParticipantRule` instead (per George v2), that's a config choice — both shapes exist and produce the same math.
  - **For Codex:** `rate_tiers` on `ServiceRate` should correspond to a `service_rate_tiers` join table or a JSONB column in the DB; the engine snapshot at booking creation should carry the resolved `rate_tier_condition` in `booking_price_snapshots.booking_context`.
- **Ready to push? NO** — waiting for Danny's "ready to deploy." Bundle with Cowork's ready-to-push docs (open_decisions.md D-041–D-047, provider-settings-ia.md, STATUS.md) when approved.

---

## 2026-07-10 — Design System (dark-mode surface model)
- **Done:** Worked out the light+dark surface architecture with Danny and encoded it. Added **`surface.canvas`** (page backdrop) + **`text.on-canvas`**/`-variant` so text stays ADA on both dark canvas and light cards; kept `surface.default` = white holder, `surface.container` = inner. **Model 1 "light islands"** (Danny-approved): dark = **brand-tinted dark canvas** (Brandy Blue → teal `#002C38`) with **white holder cards in both modes**, inner one step darker. Canvas is brand-tinted per theme. `lint-tokens` → **641, 0 violations.** **Figma synced + verified:** new theme vars (`canvas`/`on-canvas`/`on-canvas-variant`) seeded per mode, semantic `surface/canvas` + `text/on-canvas`(+variant), Brandy Blue Light (white holder) + Dark (Model 1) rewritten; resolves correctly. Confirmed **service/status/payment tags ride the `domain.*` tokens** (unique bg per meaning, Woof-referenced).
- **Decisions / open:** Model 1 + brand-tinted canvas = Danny-approved. **To do in Figma (Danny driving iteration):** author the other 4 themes' `· Dark` modes on this model; build Tag/Pill + Booking Card components; tune type scale down, pill contrast, drop left-border-on-rounded, decide glance-vs-tap disclosure; `Your Pack` separate pass.
- **Ready to push?** **yes** — `tokens/semantic/color.tokens.json`, `tokens/themes/*` (brandy-blue + brandy-blue-dark rewritten; 5 themes +canvas roles), `CHANGELOG.md`. Figma file updated (not git-tracked). Pending Codex governance review.

## 2026-07-10 — Cowork (pricing fix verification)
- **Independently verified** Claude Code's per_session/per_unit granularity fix: ran the suite in a clean isolated install (not Danny's node_modules) → **39 passed, 8 skipped**, matching CC's report. Confirmed in-code: `resolvePerUnitRates` wired to per_night/per_session/per_unit (per-date resolution), `validateInputs` (integer/finite/non-negative guards), and `deepFreeze` on the returned snapshot. Codex's CHANGES-NEEDED blocker is **closed**. Fix sits uncommitted in the local tree (head still `c8b5628`) per single-committer model. **Bundle is ready for Danny's "ready to deploy."**

---

## 2026-07-10 — Cowork (product management)
- **Done:** Scoped drop-in + in-home-sitting verticals and the provider config/payments model. Wrote `docs/planning/provider-settings-ia.md` (settings IA + web-portal/app surface split). Logged **D-041** (web portal = editor/billing surface; app basic), **D-042** (subscription web-only, no in-app purchase/CTA → B2B-SaaS 0% store fee; client booking payments via Stripe Connect, IAP-exempt physical service), **D-043** (off-hours surcharge + hours-of-operation + snapshot-on-booking; flat travel fee MVP, per-mile deferred), **D-044** (secure access storage), **D-045** (availability conflict-groups), **D-046** (report-card CMS templates + edit-lock). Added **D-047** (OPEN — service content + Woof carryover + report-card review; boarding-first). GPS confirmed as v1.1 fast-follow (manual proof-of-walk in MVP).
- **Decisions / open questions:** D-041–D-046 **FINAL**; added **D-048** (MVP verticals = boarding/daycare/walking + drop-ins stretch; in-home/house sitting = first fast-follow; soft-plan to fold in if gates clear, gut-check at first major check-in). Folded Codex's D-044 crypto reqs (tenant-scoped ciphertext, separated keys, audited decryption).
- **Pricing blocker root-cause (verified by Cowork, reading c8b5628):** the `per_night` path is **correct** (per-night resolution, holiday-marked dates only) — Danny was right. Codex's blocker is real but in the **`per_session`/`per_unit` path** (multi-day daycare package → holiday applied to whole booking). Narrow fix issued to Claude Code (extend per-date resolution to dated per_session/per_unit; + purity/validation/snapshot hardening). Codex-flagged **stale manual-payment/Connect docs** **full reconciliation pass** of `product_brief.md` (payments + web-first→native/Expo, design-partner→testing-partner, boarding/daycare→+walking/drop-ins, roles+app-fork, theming, architecture, Netlify→EAS, resolved open questions); the two **Codex-lane** docs (`technical_architecture.md` L67/178/219, `data_model_draft.md` L134) are pinned in `ALIGNMENT.md` §7 for Codex to fix (still say Connect is post-MVP — wrong vs D-007 Option A / D-042).
- **Ready to push? YES** — `docs/decisions/open_decisions.md` (D-041–D-047), `docs/planning/provider-settings-ia.md` (new), `STATUS.md`. **Claude Code to push on Danny's go** (clear `.git/*.lock` first). Bundle with the pricing-engine D-039 revision if it lands first.

---

## 2026-07-10 — Claude Code
- **Pushed:** `7e2ec97` → `main` (`a5e0ad6..7e2ec97`). 51 files, 4664 insertions. All of last night's work is on GitHub. DS changes version-controlled only — Codex governance review still pending.

---

## 2026-07-09 — Claude Code

- **Done:**
  - Built `packages/pricing/` from scratch — the full pricing engine per `docs/specs/booking_and_pricing.md`.
  - **Golden tests first:** 24 tests written before implementation, all pass. 8 correctly skipped (B7 deposit per D-015; 7 later-vertical stubs).
  - Tests cover: B1–B6, B8 (boarding); D9–D14 (daycare); W1–W3 (walking per D-022); plus structural invariants (total = sum of lines, no floats, deposit=0, purity, additive-not-compounding %).
  - `src/types.ts` — canonical `PricingModel`, `PricingRuleType`, `PricingBreakdown`, `PricingLineItem`, `AppliedPricingRule`, full config shapes. `src/math.ts` — `halfUp`/`bpsAmount`/`ppmAmount`. `src/engine.ts` — pure `calculateBookingPrice(input, config)`.
  - TypeScript strict + `exactOptionalPropertyTypes` — clean. Vitest 1.6, Node, no deps beyond devDeps.
  - **Addressing other agents:**
    - **Design System (git lane):** `docs/design-system/` has only a stub README (untracked). Ready to `rm` it as part of the commit when Danny approves — does not require a separate step.
    - **Cowork (push backlog):** the pending `3de98e7` / `a5e0ad6` commits are in git history; `STATUS.md`, `packages/pricing/`, and all DS file changes are still untracked/modified. All will be staged in the commit below.
    - **Codex:** noted the governance flag on DS v0.1.2 spec edits (not my lane) and the `ALIGNMENT.md §3/§5` stale-George-language delta (Cowork's lane to reconcile).

- **Decisions / open questions (which lane they touch):**
  - **Ambiguity resolved (pricing lane):** % surcharges apply to base+participant subtotal (pre-all-surcharges), confirmed by George v2 Example 1 ($345×20%=$69). Implemented that way.
  - **Half-day tier (pricing/product lane):** interpreted as a separate `per_session` service at $30, not a volume tier on full-day. If Cowork/Danny want it as a true `tiered` variant on one service config, the `volume_tiers` shape is already in the types — just needs a config + golden test.
  - **`partial_unit_overage` model (pricing lane):** keeping `per_night` as the base service model; `overage_config` on the config triggers the overage line. The `partial_unit_overage` enum value labels the generated line item. Clean; no change needed unless spec disagrees.
  - **Extract vs. rewrite (resolved — Claude Code lane):** **clean build.** The Woof logic's 3 copies lack minor-unit, bps/ppm, and breakdown-snapshot requirements; retrofitting is riskier than the green-field engine with golden tests. Noted in the build session.
  - **CI (infra lane — Cowork/George):** `packages/pricing` is a standalone Vitest package. Needs to be wired into whatever CI pipeline is set up (GitHub Actions `npm test`). No CI config exists yet — flagging for the infrastructure sprint.

- **Ready to push? YES** — stage and commit: `packages/pricing/**` (new engine + tests), `STATUS.md` (new file), `docs/design-system/README.md` (rm stub per DS request), and all DS-modified files (`design-system/CHANGELOG.md`, `design-system/docs/theming-decision.md`, `design-system/docs/README.md`, `design-system/docs/PetAppro-Atomic-Design-System-Inventory.xlsx`, `design-system/specs/atoms/button.md`, `design-system/specs/patterns/list-row.md`, `docs/research/woof-wetreats/**`, `ALIGNMENT.md`, `TASKS.md`). **Awaiting Danny's "ready to deploy."**

---

## 2026-07-09 — Codex
- **Done:** Read the latest Design System and Cowork updates plus `ALIGNMENT.md`; confirmed repository files are the durable shared-memory layer for future project chats. Reviewed the reported changes for Codex-lane impacts and recorded the required governance follow-ups; no code, architecture, data-model, or governed design-system files changed.
- **Decisions / open questions (which lane they touch):** **Design-system governance:** the reported `button.md` and `list-row.md` v0.1.2 changes still need the required lint and independent Codex review before READY-FOR-GOVERNOR; the pressed-state token gap remains a governance decision for Danny. **Alignment:** `ALIGNMENT.md` §0–2 says George can read the repo through the desktop app, while §3 and §5 still say George cannot read it and must use pasted files; Cowork should reconcile those stale statements. The canonical Design System location is `/design-system/` per `ALIGNMENT.md`; `/docs/design-system/` should remain supporting documentation only unless Danny changes that decision.
- **Ready to push?** **no** — this status entry is ready, but Codex has not reviewed or approved the reported Design System changes, and no commit/push was authorized.

## 2026-07-09 — Design System (base brand → Brandy Blue default)
- **Done:** Integrated the **PetAppro base brand** into tokens as the new **default theme, "Brandy Blue"** (Danny's call). Used Danny's **exact brand bands** (he confirmed the raw ramps read best — no OKLCH normalization) + synthesized `50` tints. **Dog-centric palette names** (Danny, favorite dogs): **Brandy Blue** (primary), **Camo Green** (success), **Coco Coral** (danger), **Bella Sky** (info), **Maverick Grey** (neutral, husky-grey); primitive slugs `brandy-blue`, `camo`, `coco`, `bella`, `maverick` with all aliases updated (themes + semantic + `CLAUDE-DESIGN-CONTEXT.md`). Extended Maverick to full 50–900; added Coco + Bella. Added `themes/brandy-blue.tokens.json` (Light·default, primary=`brandy-blue.600` `#006073`) + `brandy-blue-dark.tokens.json` (Dark, Option A); added `Poppins`; re-pointed `semantic.status` success→camo / danger→coco / info→bella (warning=amber). Captured Danny's preferred **5a design language** (Poppins ladder, 22px cards, 999px pill CTA, teal-tinted shadows) into `docs/brandy-blue-preview.html`. `lint-tokens.mjs` → **617 tokens, 0 violations.**
- **Decisions / open (base brand):**
  - **Brandy Blue is now the base/default theme** — **supersedes the locked "Tier 1 = Sage & Sand" default**; Sage & Sand demoted to an alternate. Needs George/ChatGPT + Codex awareness (theming-and-tiers doc, tier lockup text).
  - **Primitive renames + status re-point are theme-invariant** — implement Danny's brand + role guide; flag for Codex.
  - **DONE (Figma):** Variables synced to tokens — primitives renamed (brandy-blue/camo/coco/bella/maverick), Poppins added, status re-pointed, **Themes default mode = Brandy Blue · Light** + Brandy Blue · Dark added; `atom/Button` verified reskinning to Brandy Blue automatically.
  - **Open:** author dark modes for the other 4 themes; propagate Poppins/design-language into the component specs + build remaining atoms on Brandy Blue.
- **Ready to push?** **yes** — repo changes: `tokens/primitives/color.tokens.json`, `tokens/semantic/color.tokens.json`, `tokens/typography.tokens.json`, `tokens/themes/{brandy-blue,brandy-blue-dark,sage-sand}.tokens.json`, `specs/CLAUDE-DESIGN-CONTEXT.md`, `CHANGELOG.md`, `docs/brandy-blue-preview.html`. Lint-clean. Pending Codex review (default-theme + renames + status re-point supersede prior locks).

## 2026-07-09 — Design System
- **Done:** Adopted the shared-repo workflow (Base509 folder connected; working out of the repo, not a scratchpad). Read the full DS foundation (`GOVERNANCE`, `tokens/`, `CHANGELOG`) + all 23 approved `specs/`. In Figma (`05 Components`): built `atom/Button` (variants + Default/Pressed, themed **Button** text style = `body`/bold) conforming toward `button.md`; `atom/Badge` (pill shell); materialized `elevation.semantic.{card,raised,modal,nav}` effect styles from `tokens/elevation`. Bumped `specs/atoms/button.md` + `specs/patterns/list-row.md` → **v0.1.2** (shared `elevation.semantic.raised` press). Logged **Decision 3 — Light/Dark "Option A"** in `design-system/docs/theming-decision.md` + `CHANGELOG`. Consolidated DS docs into **`/design-system/docs/`** — moved the Atomic Inventory there + rewrote the README (single home); `/docs/design-system/` stub removal queued for Claude Code (local rm permission-blocked). Moved Woof reference artifacts (functionality spec/inventory + wireframes) → `docs/research/woof-wetreats/`. Ran `lint-specs.mjs` → **23 specs, 0 errors.**
- **Decisions / open questions:**
  - **Light/Dark = Option A** (10 fixed theme modes, preselected / not-dynamic) — Danny-locked; captured in the **theming lane** (`design-system/docs/theming-decision.md`). Next: author dark tokens per theme (**tokens lane**).
  - **DS folder location — RESOLVED (Danny):** consolidate to **`/design-system/`** (one home). Authored docs/deliverables live in `/design-system/docs/`; `/docs/design-system/` retired (empty-stub removal queued for Claude Code). ALIGNMENT DS lane = `/design-system/`. Codex/George entries independently confirm.
  - **Token gap — DECIDED (Danny):** add explicit `pressed` tokens for `secondary`/`destructive`/`success` (matching `primary`, keyed per theme) — not computed fill-shift (keeps them themeable + auditable per D-030). To author in the **tokens lane** + wire into the Button pressed variants; finalize via Codex governance.
  - Aligned with Cowork's 2026-07-09 locks (D-015 no-deposit, D-022 walking, tips, Connect) — no design conflicts.
  - **Process:** the v0.1.2 spec edits should re-run `lint-specs.mjs` + Codex review to stay formally approved.
- **Ready to push?** **yes** — changed in repo: `design-system/CHANGELOG.md`, `design-system/docs/theming-decision.md`, `design-system/docs/README.md`, `design-system/docs/PetAppro-Atomic-Design-System-Inventory.xlsx` (moved from `docs/design-system/`), `design-system/specs/atoms/button.md`, `design-system/specs/patterns/list-row.md`, `docs/research/woof-wetreats/**` (Woof reference). **Claude Code also:** `git rm -r docs/design-system` (retire the empty stub — local rm was permission-blocked). Specs lint-clean (0 errors). Figma file updated — not git-tracked.

## 2026-07-09 — Cowork (product management)
- **Done:** locked D-007 (Stripe Connect in MVP) · D-015 (no deposits) · D-022 (walking in MVP) · D-028 (freeze bar) · D-029 (no-marketplace) · D-034–D-038 (data/auth architecture) · D-031 passwordless. Reconciled the pricing engine → build-ready `docs/specs/booking_and_pricing.md`. Resynced roadmap + annex to Connect-in / dual-target date (Oct 1 / Oct 21). Added `base509-operator-admin-console.md`, user-flows index (+ deposit-fix flag). Established `ALIGNMENT.md` (roles/sync protocol) and this `STATUS.md`. Drafted the Claude Code pricing-build prompt and the Design-System-chat onboarding prompt.
- **Decisions / open:** tips in MVP + no platform fee (Standard Connect) confirmed. Pricing extract-vs-rewrite left to Claude Code. Confirmed George's ChatGPT can't read the private repo → George uses paste; all other chats sync via the repo folder.
- **Ready to push?** **YES** — commit `3de98e7` + `ALIGNMENT.md` + `STATUS.md` + the day's docs. Claude Code to push at EOD (clear `.git/*.lock` first).

---

## EOD — Sat 2026-08-15 (Cowork PM)

**Launch sprint kicked off (goal: marketing site live → Apple submission → build app).** Board tracked in Cowork task list; canonical short list = `docs/launch-checklist.md`.

**Done today:**
- ✅ **Supabase** project created — ref `ecdmtldlqvkdvmyxgpzr` (free tier). Security: Data API ON, auto-expose new tables OFF, **auto-RLS ON**.
- ✅ **Resend** account under Base509; **base509.com verified** (auto-config via Cloudflare, Google MX preserved). Free = 1 domain → PetAppro mail sends from base509.com w/ "PetAppro" display name until Pro (~$20/mo at portal launch).
- ✅ **Google Maps** key provisioned + wired to `apps/web/.env.local` (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). **Code wired the real service-area map** (Google Maps + Terra Draw) into `PortalZoneMap.tsx` — done. Spec: `docs/specs/service-area-maps.md`.

**Decisions logged today:** D-066–D-074 (operator console, discounts→Stripe, self-serve billing, CSV exports, destructive-action guardrails, multi-country deferred, data retention interim, tax-reg out of scope, attribution=first-party UTM/pixels deferred) → `open_decisions.md`. Theme-tier reconciliation → PO reaffirmed **locked matrix** (Duo = breeds; city+seasonal = Crew+); **portal conforms** → `pricing-tiers-and-features.md`. Service-area map stack (Google + Terra Draw) → `docs/specs/service-area-maps.md`.

**Tomorrow (Sun 2026-08-15/16) critical path:** push `apps/web` → Vercel Pro (Root=`apps/web`) → `waitlist` table (first `supabase/` migration + anon-insert RLS) + form wiring (Supabase + Resend) → preview → Danny review → "ready to deploy" → Cloudflare DNS → verify → **site live** → then Apple enrollment.

**Guardrail for Code:** Supabase scope for launch = **only** a `waitlist` table (email · created_at · source), first `supabase/` migration, anon-insert RLS policy. **Do NOT** build the CFG-1 tenancy foundation this weekend. Parked: Stripe, CFG-1, Meta pages (parallel side-track), Nextdoor (research).

---

- **Pushed 2026-08-16:** `5baef61` → `origin/main` (12 commits, 6e5140a..5baef61). Build green + typecheck clean (WEB-R1 verified fixed). Ready for Vercel connect.
- **DB migrated 2026-08-16:** `waitlist` table live on Supabase `ecdmtldlqvkdvmyxgpzr` (RLS on, anon INSERT-only). Applied via Management API + recorded in `schema_migrations`. New local migration `20260816090000_waitlist_anon_grant.sql` (anon INSERT grant + privilege tightening) — uncommitted, needs commit+push. End-to-end anon insert/duplicate/select-deny verified. ⚠️ `RESEND_API_KEY` in apps/web/.env.local is empty — re-paste before testing confirmation email.
- **Deployed 2026-08-17:** waitlist live end-to-end on https://base509.vercel.app (Vercel project `base509`, root `apps/web`). 4 env vars set in all 3 environments; fresh prod deploy; real signup verified (form → Supabase insert → Resend confirmation received in Gmail; test row deleted). No custom domains/DNS touched. Note: `vercel link` added `.vercel/` + root `.env.local` (gitignored) and modified `.gitignore`.
- **Pushed 2026-08-16 (PM):** `98daaf3` → `origin/main` — whole-screen waitlist success state (signup + download), plus the `20260816090000_waitlist_anon_grant.sql` migration and vercel-link `.gitignore` entries. Git-integration auto-deploy verified live on base509.vercel.app (both pages show one clean thank-you; test row deleted). No domains/DNS touched.
