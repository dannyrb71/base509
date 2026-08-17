# Catch-up hand-offs — 2026-07-30 (Cowork)

Three paste-ready prompts. **Sequence matters:** George can go now; **Claude Code's push must land before Codex reviews** (Codex works off the GitHub mirror, which is stuck at `09ac2ad` Jul 16 — it literally can't see the new work until it's pushed).

> **Board-staleness note (verified 2026-07-30):** the Sprint 1 table marks all 7 items `TODO`, but `packages/pricing` (39+8 tests), `packages/tokens`, `packages/ui`, and CI workflows (`.github/workflows/`) already exist. The genuinely missing foundation is `supabase/` (migrations + five-axis schema + RLS = CFG-1). Treat "Sprint 1 unstarted" as *bookkeeping drift + a real schema gap*, not "nothing exists."

Context every agent needs: last standup was 2026-07-22. Since then a large spec/design batch accumulated **uncommitted** (mirror at Jul 16). Sprint 1 (Jul 7–18) is **12 days past window, all 7 items still TODO**; the ~Jul 18 pivot checkpoint is missed; ~Aug 15 GO/NO-GO is ~16 days out.

---

## 1 → George (Project Manager) — alignment

> **George — catch-up + sequencing ask (from Cowork, 2026-07-30).**
>
> **Where we are.** Since your last status (~07-22), product/design/spec output surged: `provider-dashboard.md` ("Today" screen, from Danny's Figma review), `provider-reports.md` (off the proven Woof reports page), `provider-onboarding-configuration.md` (the config wizard + CFG gate), `transactions-payments-and-invoicing.md` v2 (non-custodial posture, Stripe Connect direct charges, D-062), `capacity-model.md` (two-layer capacity proposal), `design-system-components.md`, a full `legal/` folder with the LG-1…LG-11 build-gate triage, and `CANONICAL-SOURCES.md` (a single-home-per-fact registry to stop drift). Design System foundations are done; Wireframes 2.0 + Phase 2 give full flow coverage; the `apps/web/` website scaffold is started. `open_decisions.md` grew +454 lines (D-056+).
>
> **Two red flags I need you to sequence around:**
> 1. **Sprint 1 board is stale AND the real foundation is missing.** The board marks all 7 items `TODO`, but `packages/pricing` (39+8 tests), `tokens`, `ui`, and CI already exist — never marked done. The genuinely missing piece is **`supabase/` — migrations + five-axis schema + RLS (CFG-1)**, which gates the wizard and is the ~Aug 15 GO/NO-GO item. The ~Jul 18 pivot is still effectively missed on the schema half → the "start cutting scope" branch. **Decision owed (you + Danny):** re-cut Sprint 1 or re-baseline the calendar, **and reconcile the board to reality.** Compounds daily against ~Aug 15.
> 2. **~2 weeks of work is unpushed** (mirror at Jul 16) — so the roadmap's "P1 Architecture / Sprint 1" is stalled while P4-style spec work piled up ahead of it. The plan and the build are out of order.
>
> **Requests:**
> - Re-baseline the sprint calendar (or ratify a re-cut) and reflect it in the Notion Roadmap phases — P1 (Architecture) is still "Next/not started" while specs accumulate.
> - Confirm the **~Aug 15 GO/NO-GO** criteria: *tenant schema + RBAC/RLS done AND D-U-N-S in hand.* D-U-N-S is in hand (11-314-3683); tenant schema/RLS is **not started** → we're currently trending NO-GO on the code half. Flag it now, not on Aug 15.
> - Sequence the **store clock**: minimal live `base509.com` (MKT-4, gated on BIZ-12 Vercel Pro) → BIZ-5 Apple Org enrollment → BIZ-6 Google Play; BIZ-10b (propagate the new SF address) before store submission.
> - Post your updated Daily Brief / roadmap; paste your status back to `STATUS.md` via Cowork.
>
> **Decisions closed this session (Danny) — for your roadmap/status.** The 5 you flagged in the Daily Checkin are resolved (detail in `open_decisions.md`): **D-064** — Meet & Greet is **free** (no fee). **D-063** — "Boarding Extra" late-pickup overage via `partial_unit_overage`, **+ no same-day daycare/boarding**. **D-065** — care-task reminders **in scope** (transactional; flagged flex under D-023). **D-053** — messaging stays **out**. Dashboard in-progress grouping → **deferred** to the in-flight Figma app pass. Long-stay pricing (15+ / negotiated) stays a **price override** for MVP (D-062k).

---

## 2 → Claude Code — work order (gated on Danny's "ready to deploy")

> **Claude Code — two items (from Cowork, refreshed 2026-07-31). Do NOT commit/push until Danny says "ready to deploy."**
> _Refresh note: since the 07-30 draft, George/PM re-baselined the calendar + reconciled the board, George ratified the capacity schema, and D-063's open flags closed. The hardcoded hash + file lists below were stale and are corrected._
>
> **A. Batch-push the accumulated docs/specs.** ~2 weeks of Cowork/design work is uncommitted. **Do NOT trust a hardcoded hash** — the base has already moved to `6e5140a` (local == origin/main as of this refresh); freshness-check live before you start. **Housekeeping:** a stale empty `.git/index.lock` is still present — clear it before the first git write.
> - **Derive the add-list from live `git status`, not a fixed list** — it keeps changing (George and Cowork have edited files since the 07-30 draft; ~33 uncommitted paths now). Expect: `docs/CANONICAL-SOURCES.md`, `docs/legal/**`, the new `docs/specs/*` (provider-onboarding-configuration, transactions-payments-and-invoicing, provider-dashboard, provider-reports, capacity-model, design-system-components, + wireframe/hi-fi Fable batch), and modified `open_decisions.md`, `data_model_draft.md`, `capacity-model.md`, `booking_and_pricing.md`, `mvp_roadmap.md`, `STATUS.md`, `TASKS.md`, `CLAUDE.md`, etc.
> - **⛔ Do NOT commit (add to `.gitignore` first):** `apps/_to_delete/` (scratch tarballs: `apps-web.tar.gz`, `apps-web-v2.tar.gz`, `_extract/`, `_tmpx/`) and `.pnpm-store/` (package cache). Neither is gitignored yet — a blind `git add -A` would commit both. **Do NOT `git add -A`.**
> - **Exclude from THIS push (Danny, 2026-07-31): `apps/web/` and `marketing/`.** Leave them untracked — do not add them and do not block on confirming. They'll be brought in as a separate, deliberate commit later; this push is docs/specs only.
> - Docs-only otherwise, low risk — but still get Danny's explicit go. Post the commit hash back to `STATUS.md`.
>
> **B. Foundation Recovery Sprint (Jul 31–Aug 14) — plan-first, no silent execution.** _Replaces the old "Sprint 1" framing; George re-cut it 2026-07-31 (Oct 1 red, Oct 21 conditional, Aug 15 = formal technical gate). See `STATUS.md` / `mvp_roadmap.md` for the ratified sprint + gate criteria._
> - **Reconcile the board to reality first:** `packages/pricing` (39+8 tests), `packages/tokens`, `packages/ui`, and CI (`.github/workflows/ci.yml`, `eas-build.yml`, Jul 11) **already exist** — verify they're the deduped single copies running green across the monorepo, then mark the corresponding items done rather than re-authoring.
> - **No "15-night cap" to fix — it never existed in PetAppro.** Claude Code + the current suite confirmed no night cap in `packages/pricing`, `reference/`, or tests; `S1-3` is already `DONE`. The phantom traces to **Woof WeTreats** (client self-service boarding capped at 14 nights, staff-bypassable) — deliberately *not* ported. PetAppro has **no night cap**: long-stay is manual, provider-decided (price override, D-062k). Do not add one. (Any future 8+ day auto-flat-rate trigger is post-MVP and provider-configurable.)
> - **The real missing foundation is `supabase/`** (confirmed absent) — stand up migrations + generated types so **CFG-1** can land. This is the ~Aug 15 gate item.
> - **CFG-1 — build to the UPDATED capacity contract (George ratified 2026-07-31):** shared physical capacity gets its **own tenant-scoped `capacity_group` + versioned/composable `capacity_config` (`bounded | unlimited`)** — do **NOT** reuse `conflict_group_id` for capacity (conflict groups = "may these overlap?"; capacity groups = "what finite resource do they share?" — different questions). Five-axis `business_services` still holds `pricing_model`/`capacity_model`/`duration_model`/`location_model`/`buffers`; `service_type_key` is text/data, not an enum; plus `business_id`, RLS, `WITH CHECK`, cross-tenant negative tests. See updated `data_model_draft.md` + `capacity-model.md`.
> - **CFG-1 is still gated on Codex (Technical Governor) ratifying the migration shape** — George is PM, not the governor; his capacity ruling needs Codex sign-off on the actual migration (CHECK mechanically derived from `packages/pricing`'s `PricingModel`) before it's cut. Don't start the migration until Codex signs off.
> - **D-063 code correction (decided-but-not-implemented):** the pricing engine currently keys off **actual late pickup**; it must use **booked-time** semantics per `booking_and_pricing.md` §5B. Fee name = **"Boarding Extra"** (locked), **single flat fee, not per-hour** (both locked by Danny 2026-07-31). Update the `partial_unit_overage` path + golden tests.

---

## 3 → Codex (Technical Governor) — review queue *(run AFTER Claude Code pushes)*

> **Codex — review queue (from Cowork, 2026-07-30). Freshness-gate first: this all lands in one push off `09ac2ad`; do not review until `main == origin/main` at the new hash.** Verdict per item: Blocker / Should-fix / Nit → CHANGES-NEEDED or READY-FOR-GOVERNOR.
>
> **Priority order:**
> 1. **CFG-1 — five-axis `business_services` migration (build-first gate).** Confirm `pricing_model`, `capacity_model`, `duration_model`, `location_model`, `buffers` as first-class columns; `service_type_key` is **text/data, not an enum**; the `pricing_model` CHECK constraint is **mechanically derived from `packages/pricing`'s `PricingModel` type** (all 9 values, incl. `duration_tiered` + `partial_unit_overage`) so they can't drift; plus `business_id`, RLS, `WITH CHECK`, and cross-tenant negative tests. This gates the wizard (CFG-2).
> 2. **`capacity-model.md` — ratify** (+ **D-063 "Boarding Extra" overage** with it). Two-layer model (service cap + shared `conflict_group_id` pool). **Enum-vs-config** call on the capacity archetypes. Confirm `available = min(service_cap − service_used, pool_cap − pool_used)` is enforceable **transactionally** in the planned `packages/booking`. **D-063:** "Boarding Extra" is `partial_unit_overage` config (Provider-set covered-hours measured from **booked** drop-off + single flat rate) — confirm it's snapshot-deterministic at booking (no runtime dependency) and that a boarded pet counts against the **location pool** but never a **daycare slot** (no same-day daycare+boarding). **Name-collision guard:** "Boarding Extra" (added overage) must stay distinct from the engine's **`extended`** rate-tier (long-stay *reduced* rate) — verify the two never share a label in code, schema, or UI.
> 3. **`transactions-payments-and-invoicing.md` v2 — re-review** (v1 was internally contradictory; rewritten 07-20 after your review + Danny's no-prepayment change). Confirm the non-custodial invariants (direct charges only; **no `application_fee_amount`**; no destination/separate charges; one provider + single currency; refunds from the original charge) are consistent with D-007 and the LG-3 payment boundary.
> 4. **LG-2 / LG-3 (money + tenancy).** LG-2: all-in pricing + later-charge authorization ledger must **update `packages/pricing` golden tests before checkout**. LG-3: Stripe direct-charge + provider-scoped payment boundary needs **cross-tenant money-isolation tests**.
> 5. **`open_decisions.md` D-056+ (+454 lines, incl. new D-063/064/065).** Sanity-check the new decisions (website architecture, account deletion, closure/refunds, portal-waitlist D-061, D-062; **D-063 Boarding Extra, D-064 free M&G, D-065 care-task reminders**) against the locked D-034–D-038 architecture — flag any conflict.
> 6. **`data_model_draft.md` / `technical_architecture.md` deltas** — confirm still coherent with 1–5.
>
> Design-system review status: hold unless Danny lifts it.
