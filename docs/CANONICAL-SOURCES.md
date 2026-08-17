# Canonical Sources — one home per fact

**Read this before writing a fact into any doc.** Every fact below has **exactly one** authoritative location. Everywhere else **links to it — never restates it.**

> **Why this exists (2026-07-20):** the same fact living in several files is how every drift incident here started. `pricing_model` lived in CLAUDE.md, a spec, *and* the code — the copies said seven values, the code said nine, and building from the copy would have forced a migration on the first walking service. Theme names lived in five files and Fable "corrected" them back to a rejected name. The transactions spec was patched in place until it contradicted itself.
>
> **Rule: duplication is the bug.** Link, derive, or point — don't copy.

---

## The registry

| Fact | Canonical source | Notes |
|---|---|---|
| **Pricing models** (`PricingModel`) | **`packages/pricing/src/types.ts`** | **Code wins, always.** DB CHECK constraints must be **mechanically derived** from this type so they can't drift. Nine values; `per_hour`/`per_head` marked `// later`. |
| **Pricing engine behavior** (order of ops, rounding, currency) | `docs/specs/booking_and_pricing.md` + `packages/pricing` | Engine prices; nothing else does. |
| **Repo / architecture state** | **The repo itself** | ⛔ **Not CLAUDE.md.** CLAUDE.md's architecture block is *target state* and is marked built/planned per line. Verify with `ls`. |
| **Data model & tenancy spine** | `docs/planning/data_model_draft.md` + `docs/planning/technical_architecture.md` | Designed, **not yet built** (no tables exist). |
| **Payments / ledger / invoicing model** | `docs/specs/transactions-payments-and-invoicing.md` | D-062 summarizes; the spec is authoritative. |
| **Provider onboarding & service config** | `docs/specs/provider-onboarding-configuration.md` | Wizard flow, control types, per-service config. |
| **Capacity model** (per-service cap + shared location pool) | `docs/specs/capacity-model.md` | Two-layer capacity: service cap + shared pool (`conflict_group_id`); archetypes per service; onboarding questions. Codex to ratify enum-vs-config. |
| **Provider settings surface map** | `docs/planning/provider-settings-ia.md` | What a provider configures and *where* (web vs app). |
| **Provider Reports page** (metrics, tabs, CSV/QBO export) | `docs/specs/provider-reports.md` | Built off the Woof reports page; write-offs by period; QuickBooks-friendly export. Dashboard is separate (`provider-dashboard.md`). |
| **Theme roster + names** | **D-040** in `docs/decisions/open_decisions.md` | 10 themes. Names have churned — check here, never assume. |
| **Theme entitlements by tier** | `docs/planning/pricing-tiers-and-features.md` matrix | D-040 carries the same table; **matrix is canonical if they disagree.** |
| **Subscription tiers, seats, pricing** | `docs/planning/pricing-tiers-and-features.md` | |
| **Website + app copy rules** | `apps/web/copy/COPY-AUDIT.md` | Absolutes, no-vetting, tips, disclaimers, CTA, money language. |
| **Site copy itself** | `apps/web/copy/*.md` | features, theme-tiers, support-faq, interim policies. Copy lives in repo files, **never only in chat**. |
| **Provider social ad (F-023)** | `docs/specs/provider-social-ad.md` | Feed-only (Stories held in reserve); public code; PetAppro branding intentional here. |
| **Legal positions & policy text** | `docs/legal/*.draft.md` + `docs/legal/README.md` | README carries the product/safety requirements table. |
| **Decisions (D-###)** | `docs/decisions/open_decisions.md` | The log of record. Specs may elaborate; the log says what was decided. |
| **Task status** | `TASKS.md` | ⚠️ Drifts. Verify against the repo before trusting a status. |
| **Phase / roadmap status** | `docs/roadmap/mvp_roadmap.md` | Re-baselined 2026-07-20. |
| **Flows** | FigJam `THoMSvOPH1vBhtDpPT0Lur` | ⚠️ Partly stale — checkout flow predates D-062. Wireframes 2.0 corrects it. |
| **Wireframes** | DS Figma file, page **"Wireframes 2.0"** | 402×874 (iPhone 17 Pro). Page 08 is history. |
| **Component structure + naming** | `docs/specs/design-system-components.md` | Function-based taxonomy; Card base + `Card content/*` swap; agents build within it, don't freelance. |
| **Approved component inventory · archetypes · consolidations** | `docs/specs/petappro-component-audit.md` | ✅ Approved 2026-07-31. Reuse map, 10 screen archetypes, 8 consolidations, adapts A1–A7 + N1. Screens are assembled from this, not designed fresh. |
| **Company/legal identifiers** | `Company/Formation/Base509-LLC-Key-Identifiers.md` | Owner-confidential. EIN, entity no., agent, addresses. |

---

## Rules

1. **Link, don't copy.** If a fact has a canonical home, reference it. A second copy is a future contradiction.
2. **Derive where a machine can.** DB constraints from TS types; entitlement checks from the tier matrix. Derived values can't drift.
3. **Code beats docs.** Where code exists (`packages/pricing`), it is the contract. Docs describe it; they don't define it.
4. **Verify before asserting.** `grep` the canonical source before writing a fact into a spec. Every drift incident here was one grep away from being caught.
5. **Mark aspiration as aspiration.** Anything not yet built says **📋 planned**. Never write intent in the present tense — agents read it as state.
6. **Rewrite sections; don't patch around them.** Half-updated docs are worse than stale ones, because they contradict themselves.
7. **Update at decision time**, and sweep every affected file (see `doc-update-cadence`). Stale docs make other agents act on wrong state.
8. **Keep an "already decided — do not re-ask" block** in any spec that accumulates open questions.

---

## When a canonical source changes

1. Update the canonical source **first**.
2. `grep -rn "<old value>" docs/ apps/web/copy/ CLAUDE.md TASKS.md` — catch every reference.
3. Update or re-point them. Don't rely on memory of where a fact appears.
4. Note the change in `docs/decisions/open_decisions.md` if it's a decision.
