# User Flows — reference index

> **Source of truth:** flows live in **FigJam**; wireframes in the **Figma** file. This folder holds
> **reference copies** (exports) + **reconciliation notes** so devs/specs can read a flow without
> opening the design tools, and so flows stay checked against `docs/decisions/open_decisions.md`.
> When a flow and a decision disagree, the **decision wins** — update the flow.

## Index

| Flow | Source in this folder | Version | Stage | Feeds |
|---|---|---|---|---|
| Pet-Parent Booking Flow (+ provider/staff) | `PetAppro — Pet-Parent Booking Flow-v1 discovery.pdf` | v1 | discovery | wireframes (Figma), Phase 2 specs |

## Reconciliation notes — v1 flow vs. decided guardrails (2026-07-08)

### ⚠️ Needs fixing before it drives MVP wireframes/specs

- **Deposits — CONFLICT with D-015.** The flow shows deposit steps: "collect deposit (Stripe
  Connect)," "Refund deposit," "fee / deposit forfeit per policy." **D-015 (Decided 2026-07-08) = NO
  deposits in MVP.** Reconcile: remove deposit collect/forfeit/refund from the MVP path (charge the
  **full booking total at confirmation** instead). *Cancellation **fees** (percent/flat, waivable,
  time-window) are separate from deposits and are fine to keep.*

### ✅ Already consistent with decisions (good)

- **Tips** — post-booking tip selector, separate Stripe charge flagged as TIP, tax-reported / not
  service revenue → matches D-007 §5A (tips in MVP, own Connect line, 100% to provider).
- **Payments** — charge at confirmation, off-session recurring charges, Payment Element, payout via
  Stripe Connect → matches D-007 Option A (Connect in MVP).
- **Walking GPS annotation is stale** — D-054 supersedes the older D-022 timing note. Route tracking is a
  hard launch gate for Crew+; update any imported flow that labels it post-MVP before implementation.
- **Invite-code preview before signup** — "enter invite code required to view → preview (read-only) →
  Not yet / Ready to join" → matches F-021 + Danny's clarification (code first, "not yet" to view).
  "No code → Contact / Website / Request access" (no browse) → matches D-026 (invite/QR only, no
  directory).
- **Roles** — Staff ⊂ Manager ⊂ Admin ⊂ Owner, financials gated to Admin/Owner → matches D-032/D-033.
- **Meet & Greet** — configurable per service, gated services, provider offers slots → matches D-006.
- **Self-book vs approval** — "self-book allowed? → charge now / vs → pending approval" → matches
  F-004 (booking-approval toggle).

### Minor notes (not conflicts)

- **Walk duration tiers** shown as 20/30/60 min; the pricing spec used 30/60/90 as *examples*. Tiers
  are **provider-configurable** (`duration_tiered`), so any tier set is fine — no conflict.
- **Walk report card (MVP)** omits GPS route/distance (post-MVP, D-022); keep potty/meals/notes/photos.
