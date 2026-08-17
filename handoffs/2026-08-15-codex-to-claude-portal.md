# Handoff: Codex → Claude (Cowork) — Provider Portal continuation

**Date:** 2026-08-15. **From:** Danny's Cowork session (Base509 site + Walk Windows spec work). **For:** the fresh Cowork session taking over portal work for ~4 days while Codex credits are out.

## Operating brief (Danny's words, binding)

- Repo: `/Users/dannybaker/Documents/Base509/Products/petappro/` — app in `apps/web`, dev server `http://localhost:3003`.
- Work ONLY in the existing working tree. Do NOT commit, push, deploy, reset, or discard. The worktree is intentionally dirty (~48 files: Danny's + other agents' work — includes uncommitted Base509 site work, the Walk Windows spec, and this sketch). Preserve everything unrelated.
- Read `CLAUDE.md` and `AGENTS.md` before changing anything.
- Log decisions, work, tests, open questions in `docs/BUILD-LOG-overnight.md` (append; match its existing check-list prose style).
- PetAppro design system only: tokens, `.type-*` classes, shared portal components. No raw hex, no one-off primitives. "PetAppro" in text; "Petappro" only in the logo wordmark.
- Portal stays "Exploratory · Static Mockup" — no backend/auth/data wiring unless Danny explicitly authorizes it.

## Read in order

1. `docs/specs/walk-windows-scheduling.md` (rev 3 — scheduling model; §6 items still unratified)
2. `design_working/walk-windows-sketch.html` (approved UX sketch)
3. `docs/specs/capacity-model.md` (ratified — binding boundaries)
4. `docs/specs/booking_and_pricing.md` §0 delta 1 (group concurrency = scheduling, never pricing)
5. `docs/BUILD-LOG-overnight.md` (tail ≈ last 40 lines = current state)

## Where Codex left off (verified from BUILD-LOG, 2026-08-15)

All passing as of last entry: two-tab Dog Walking config (Duration-Tiered Pricing / Availability Walk Windows; mobile labels "Pricing" / "Walk Windows"); Walk Windows with group policy, client phone preview, plan gating (automatic from subscription state — the provider-visible Solo/Duo preview switch was REMOVED, do not reintroduce); shared Zone Manager (Business Profile ↔ Walk Windows, same state); multi-day Availability calendar at `/portal/availability` with Woof-default holidays and explicit per-service holiday rates (global Holiday Surcharge card removed); chevron asset unification; `npm run build` green, 54 static pages.

Key components: `apps/web/src/components/PortalBusinessView.tsx`, `PortalWalkingRates.tsx`, `PortalWalkWindows.tsx`, `PortalZoneManager.tsx`; styles in `apps/web/src/styles/brand-petappro.css`.

## Approved-but-unbuilt: Business page density pass (Danny approved 2026-08-15)

The Business page is congested. Danny asked for de-densification per these four moves:

1. **Split along existing seams.** Walk Windows + Group Walk Policy likely belong under the existing Availability nav item rather than stacked inside Business (reconcile with the existing `/portal/availability` calendar — propose the IA, show Danny before large moves). Remainder of Business splits into sub-tabs/routes: Profile & Brand / Services & Pricing / Booking Rules / Team, each with its own scoped Save.
2. **Collapse cards to summary rows by default.** Rate card at rest = one line ("Group Walk · 30 min · $22/dog · +$8 extra dog · Active"); window at rest = "Midday · M–F · 10–2 · 12 dogs · 2 walkers · Bookable". Expand to edit on click. ONE level of collapse only — no accordion nesting.
3. **Client phone preview → "Preview client view" button** opening a drawer/panel; not inline scroll content.
4. **Demote explainer prose** (teal "How this works" panels) to an info icon / dismissible one-liner once a section has data.

## Guardrails from this session's history (learned the hard way)

- Copy comes from `apps/web/copy/*` and the specs — never rewrite user-facing or legal copy.
- `src/lib/policies.ts` + `content/policies/` are FROZEN (owned by another workstream).
- Long-form effective dates (`formatEffective`) are intentional — do not "fix" to ISO.
- Molecules rule: any style value used twice becomes a shared token/class; refactor the original consumer to the token, don't parallel it.
- Verify by measurement (build + Playwright at 1440 and 390, `scrollWidth === clientWidth`), and report only what was actually run.

## Open questions for Danny (carry forward)

- Walk-windows spec §6: zone granularity (per-window vs single service area MVP), request-vs-instant confirmation, schema home — all still unratified; mockup-only until then.
- Density pass: confirm whether Walk Windows moves under Availability nav or stays a Business tab.
