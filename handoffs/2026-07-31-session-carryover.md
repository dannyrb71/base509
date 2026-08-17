# Session carry-over — 2026-07-31 (Cowork → Product Management chat)

Handoff summary for continuing in a new chat. **The files are the source of truth** — this is a pointer/index, not a second copy. Where a line names a file, read that file for the authoritative version.

## Decisions locked this session (all logged to files)

- **D-063 flags closed (Danny).** Fee name = **"Boarding Extra"** (rejected "Late Pickup fee" — implies an after-hours charge; and "Extra Hours"). Fee is a **single flat one-time fee, NOT per-hour**. Specs already matched; only the decision log needed updating. → `docs/decisions/open_decisions.md` D-063, `TASKS.md` changelog.
- **No night cap (Danny).** PetAppro imposes **no maximum-nights limit** on boarding; long-stay is manual, provider-decided via price override (D-062k). The **"15-night cap" is a phantom** — it never existed in PetAppro; it was a mis-transcription of **Woof WeTreats'** limit (client self-service boarding capped at 14 nights, staff-bypassable), deliberately not ported. Verified: no cap in `packages/pricing` / `reference/` / tests; `S1-3` is already `DONE`. Any future "8+ days auto-triggers a flat rate" is post-MVP and per-Provider configurable. → `docs/decisions/open_decisions.md` D-062k.
- **This push = docs/specs only.** `apps/web/` (site not finished — ~a few days out) and `marketing/` (provider-download graphic is ready, held until the site ships so we can build/test) are **excluded** from the batch commit. They go in later as their own deliberate commit. Rationale (Danny): get the app tight first.

## Current state

- **Claude Code prompt refreshed + final** → `handoffs/2026-07-30-catchup-handoffs.md` §2. Ready to send; gated on Danny's explicit "ready to deploy." Push is docs/specs only; excludes `apps/web/` + `marketing/`; excludes scratch (`apps/_to_delete/`, `.pnpm-store/` — to be gitignored first); clear the stale `.git/index.lock`; derive the add-list from live `git status` (base is at `6e5140a`, not the old `09ac2ad`).
- **D-063 code correction — open for Claude Code.** Engine currently keys off actual late pickup; must use **booked-time** semantics per `booking_and_pricing.md` §5B. Update the `partial_unit_overage` path + golden tests. Decided-but-not-implemented.
- **George/PM re-baseline (2026-07-31).** Oct 1 = red / trending NO-GO; Oct 21 = conditional recovery target; **Aug 15 = formal technical gate** (tenant schema + RBAC/RLS done AND D-U-N-S in hand — D-U-N-S green, schema red because `supabase/` is absent). **Jul 31–Aug 14 Foundation Recovery Sprint** opened. → `STATUS.md`, `docs/roadmap/mvp_roadmap.md`.
- **Capacity schema (George ratified 2026-07-31).** Shared physical capacity gets its own tenant-scoped **`capacity_group`** + versioned/composable **`capacity_config`** (`bounded | unlimited`) — do **NOT** reuse `conflict_group_id` (conflict groups = "may these overlap?"; capacity groups = "what finite resource do they share?"). CFG-1 builds to this. → `docs/planning/data_model_draft.md`, `docs/specs/capacity-model.md`.
- **CFG-1 still gated on Codex.** George is PM, not the Technical Governor — his capacity ruling needs **Codex** to ratify the actual migration shape (CHECK mechanically derived from `packages/pricing`'s `PricingModel`) before the migration is cut.

## Open coordination / loose ends

- **Cowork is holding today's 9:15 Notion Roadmap sync** — George is actively writing the same Roadmap page (`3951ee6c-7a78-81c1-a30e-d491423c40ef`); running the sync would risk double-write drift. Re-sync tomorrow once his changes settle.
- **Stale phantom-cap references** still in `docs/roadmap/PetAppro-Roadmap-and-Project-Plan.md`, `docs/planning/technical_architecture.md` (~L293), and `docs/planning/PetAppro-Strategy-and-Business-Plan.md` → flagged for the EOD sweep.

## Update — Cowork chat review of the Codex + Claude Code replies (2026-07-31)

> Durable capture so open items survive a chat refresh. **This file is the record; don't leave decisions only in chat.**

**Both reviewers agree:** specs are sound/ratified; **nothing is implemented** (no `supabase/`, capacity schema, D-063 engine, real tenant isolation, LG-2/3). Codex "CHANGES-NEEDED" = code ≠ specs, not spec defects.

**Decisions (Danny, 2026-07-31):**
- **Item A (docs push):** include **both** `handoffs/2026-07-30-catchup-handoffs.md` *and* `docs/specs/provider-social-ad.md`. CLAUDE.md pricing-model fix = **point to `packages/pricing/src/types.ts`, do NOT restate nine** (restating is what caused the drift). Commit still gated on Danny's explicit **"ready to deploy."**
- **Timing:** **Item A + Item B both HELD until Tuesday Aug 4** (Danny — no website/supabase started, no urgency over the weekend). Nothing commits before then.
- **Item B (Phase 0 tooling — supabase init, `packages/data`, workspace wiring; local, no OAuth):** start **Tuesday Aug 4.** Still the Aug 15 gate's critical path.
- **CFG-1 migration + D-063 engine:** **parked behind Codex** rulings (below).

**Doc-honesty fixes applied this session (working tree — see TASKS.md changelog 2026-07-31):** D-063 status → "spec complete; engine pending"; Payments working-default row → Connect-in-MVP (D-007 Option A); D-064 reconciled w/ D-006 (gate configurable, hard *when enabled*); **15-night cap de-flagged as a phantom** across roadmap / technical_architecture / strategy; `auth_identities` synced to `(issuer, provider_subject)`.

**OPEN — routed to Codex (must rule before the additive migration hardens):**
1. `capacity_config`: split **service-cap binding window** (boarding binds at bedtime) from **pool-consumption window** (a boarded pet consumes the location pool the whole time it's physically present) — D-063. V1's single `binding_window` can't express both.
2. **Generic per-pet service-incompatibility** rule ("no same-day daycare + boarding for the same pet") — enforced in the approval/reschedule transaction, NOT a hardcoded boarding/daycare branch.
3. `capacity_groups` entity in the data-model map + `business_availability` **pool-override FK** (currently no `capacity_group_id` target).
4. **`PRICING_MODELS as const`** so the SQL `CHECK` can be mechanically derived from the tuple (a TS union can't be consumed by a migration).
5. `auth_identities (issuer, provider_subject)` — draft now synced; confirm in the migration.

**OPEN — routed to Claude Code (gated on "ready to deploy" + Codex):**
- D-063 engine correction (booked-time basis, "Boarding Extra" label, `surcharge` category, per-booking waiver, golden tests) — `booking_and_pricing.md` §5B.
- **Real tenant-isolation validation in the pricing engine** — current "tenant isolation" test is a passthrough check; `engine.ts` does NOT reject a tenant-A input referencing tenant-B config/rates/rules/add-ons. **Security, not just missing feature.**
- D-057 automated closure-refund job (system actor, authz, connected-account resolution, retry/pending, audit; refunds the original direct charge, advances no platform funds).
- Forbidden-Stripe-param **executable** tests (reject `application_fee_amount` / `transfer_data` / `destination` / platform-account PaymentIntent).

**Next Cowork action (Tue):** on Danny's "ready to deploy," reply to Claude Code (include decisions + go) and Codex (ack the 5 routed schema questions).

## Nothing committed/pushed
All edits this session are working-tree only. No commit, push, or deploy.
