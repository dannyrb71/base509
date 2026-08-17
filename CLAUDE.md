# CLAUDE.md — PetAppro

> Instructions for Claude Code, the **primary developer/implementer** on PetAppro.
> A near-identical `AGENTS.md` exists for Codex (PM/reviewer). Keep them in sync — if you change a rule here, mirror it there.

## What PetAppro is
A native iOS + Android booking platform (Expo/React Native) with a **multi-tenant, white-label, flexible services core**. It grew out of **Woof WeTreats** (Next.js + Supabase + Netlify), a live dog boarding/daycare web app whose validated pricing/booking logic is the foundation. We are **extracting and generalizing**, not rewriting.

Beachhead vertical: dog care. The same engine must bend to hair, cleaning, and other services via config — so never hardcode dog-specific assumptions into shared logic.

## Your role
You are the implementer. Codex reviews your work (especially money/security code) and manages the backlog. Optimize for **correctness, security, and clean architecture** over speed.

## Golden rules (non-negotiable)
1. **Propose a plan before coding.** No silent execution. Wait for approval on non-trivial work.
2. **Never commit, push, or deploy without an explicit "ready to deploy"** from Danny.
3. **Local-first.** Test locally before anything ships.
4. **Supabase migrations are additive-only** until the corresponding front-end catches up. Never rename/remove a column the live app depends on. Migrations run on a **branch** first.
5. **One shared pricing engine.** It lives in `packages/pricing`. Never create a second copy. Any change to pricing or booking-money logic **requires regression tests updated in the same PR**.
6. **Multi-tenant by default.** Every tenant-owned table has `business_id` and an RLS policy. A client login must NEVER be able to read another tenant's rows or the staff-notes table — enforce at the DB, not the UI. Add/adjust RLS tests when you touch schema.
7. **Generated DB types are the source of truth.** Regenerate after every migration; don't hand-write DB interfaces.
8. **Molecules rule:** any UI element used more than once becomes a shared component in `packages/ui`. Fix it in one place; never one-off patch pills/buttons/headers.
9. **No secrets in the app bundle or the repo.** Service-role keys, Pushover/Twilio tokens, admin config live in Supabase Edge Function secrets or platform env vars.
10. **Payments:** client→provider booking payments go through **Stripe Connect (Standard)** into the provider's own account (real-world-services exemption — not Apple IAP). The provider **SaaS subscription is sold on the web portal only**, never as an in-app purchase in the iOS binary.

## Architecture (monorepo) — ⚠️ TARGET STATE, NOT CURRENT STATE

> **Verified 2026-07-20.** This block describes where we're going. **Do not assume any of it exists — check the repo.** An earlier version of this file was written in the present tense and sent an agent hunting for four directories that aren't there, costing a full build cycle.

| Path | Purpose | Status |
|---|---|---|
| `apps/web` | Next.js: marketing + provider billing/admin portal | ✅ **built** |
| `packages/pricing` | extracted, tested pricing engine (crown jewel) | ✅ **built** |
| `packages/ui` | design tokens + shared primitives | ✅ exists |
| `packages/tokens` | design tokens | ✅ exists |
| `apps/mobile` | Expo (React Native), iOS + Android | ⚠️ **stub — `eas.json` only** |
| `supabase/` | versioned migrations + Edge Functions | 📋 **PLANNED — does not exist.** No `.sql` anywhere; no migration tooling. CFG-1 Phase 0 creates it |
| `packages/data` | typed Supabase access + generated types | 📋 **PLANNED — does not exist.** Types are hand-written today |
| `packages/booking` | booking validation + availability/capacity | 📋 **PLANNED — does not exist** |
| `packages/auth-rbac` | tenant membership, roles, permissions | 📋 **PLANNED — does not exist** |

**Also not yet wired:** no root `package.json`, no `pnpm-workspace.yaml` — this is **not currently a workspace**; CI installs `packages/pricing` standalone. No `@supabase/*` dependency in any manifest. **No tenancy tables exist** (`businesses`, `base509_accounts`, `auth_identities`, `business_memberships` are designed in `docs/planning/technical_architecture.md` + `data_model_draft.md`, but unbuilt).

- **Server state:** TanStack Query. **UI/session state:** a small Zustand store only. Do not sprawl `useState`/`useEffect` for server data.
- **Sensitive mutations** (reservations, payments, blocking, staff records) go through typed server actions / Edge Functions — not direct client DB writes.
- Split large screens into container + hooks + presentational components. No 1000-line files.

## The services/capacity engine (why generalization matters)
Model every service by **pricing_model · capacity_model · duration_model · location_model · buffers**. Dog logic (overlap boarding, walking caps, grooming 1:1 unless same-home exception, holiday windows) must be expressible as config on this generic engine — not special-cased in code.

> ⛔ **`pricing_model` values are NOT listed here.** The canonical list is the `PricingModel` type in **`packages/pricing/src/types.ts`** — code wins, always. It currently has **nine** values including `duration_tiered` (walking 30/60/90, D-022) and `partial_unit_overage` (boarding late-pickup), **both MVP**.
> This file previously copied a **seven-value** list that omitted both. That copy drifted from the code and would have forced a follow-up migration on the first walking service. **Derive from the type; never restate it.** See `docs/CANONICAL-SOURCES.md`.

## Domain rules to preserve from Woof
- Price is **stored at booking time** (`total_price`); never retroactively recalculated when rates change.
- Puppy/edge surcharges and holiday windows computed programmatically, not hardcoded per year.
- Deactivate (don't hard-delete) records to preserve history.

## Definition of Done
Merged behind green CI (typecheck + lint + tests); pricing/booking changes covered by regression tests; RLS added/verified for new tables; DB types regenerated; runs on a real iOS **and** Android device via EAS; no secrets committed; analytics + error events wired for user-facing flows.

## Workflow
Plan → approval → feature branch → implement with tests → CI green → Codex review → Danny manual device/browser check → "ready to deploy" → merge (CI deploys). Keep PRs small and vertically sliced (one full flow at a time).

## ⛔ Before writing a fact into any doc — read `docs/CANONICAL-SOURCES.md`
Every fact has **one** authoritative home. Link to it; never copy it. **Code beats docs.** Verify with `grep` before asserting — every drift incident in this project was one grep away from being caught.

## Reference (canonical map)
- **Product definition / positioning / scope:** `docs/planning/product_brief.md`
- **Technical migration + data model:** `docs/planning/woof-wetreats-to-petappro-rebuild-plan.md`
- **Business strategy / framework choice / GTM / launch / costs:** `docs/planning/PetAppro-Strategy-and-Business-Plan.md`
- **Roadmap (canonical):** `docs/roadmap/mvp_roadmap.md` — dated schedule + schema starter in `docs/roadmap/PetAppro-Roadmap-and-Project-Plan.md`
- **Tooling / workflow / automation:** `docs/planning/PetAppro-Tooling-and-Automation.md`
- **Task prompts:** `docs/prompts/claude_code_prompt_pack.md`
- **Live task list:** `TASKS.md` (root)
- **Prior art + domain spec:** the Woof WeTreats reference app under `reference/`.
