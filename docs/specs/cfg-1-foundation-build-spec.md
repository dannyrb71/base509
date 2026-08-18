# CFG-1 — Multi-Tenant Foundation Build Spec (DRAFT for Codex ratification)
**Author: Cowork · 2026-08-18 · Status: DRAFT → Codex ratify → Fable build**

## 0. What this is
The concrete, build-ready plan for **CFG-1**: the first `supabase/` migration set that stands up PetAppro's multi-tenant foundation — tenancy, identity, RBAC, RLS, services + capacity config, the entitlement projection, and the test gates that prove it's secure. This is the gate every later feature (bookings, payments, notifications, the portal capacity UI) sits on top of.

**This doc is the execution plan, not new architecture.** Canonical inputs (do not restate — cite):
- `docs/planning/technical_architecture.md` — tenant model, identity, RLS strategy, D-050 entitlements, payments, storage.
- `docs/planning/user_roles_and_permissions.md` — the RBAC matrix (Owner/Admin/Manager/Staff/Client; nested Staff⊂Manager⊂Admin⊂Owner).
- `docs/specs/capacity-model.md` — the ratified capacity model (D-075/D-076) + counting rule.
- `docs/planning/data_model_draft.md` — table-level detail.
- Never-cut (D-023): `business_id` boundary + RBAC/RLS + the shared pricing package + its tests.

## 1. Scope

**In (CFG-1 — the operational DB foundation):**
1. Local identity projection + membership: resolve Supabase Auth `(issuer, provider_subject)` → stable `base509_account_id` → memberships/clients → active `business_id`.
2. Tenancy: `businesses` + `business_id` on every operational table; RLS on all.
3. RBAC: Owner/Admin/Manager/Staff levels (nested) + Client relationship; helpers + policies.
4. Onboarding: `business_invite_codes` (type-locked, `max_uses`/`uses_count`/`expires_at`).
5. Services + capacity config: `business_services` (`capacity_model = bounded|unlimited` + versioned `capacity_config`), `capacity_groups`, `service_windows` (+ assignments, zones), and the ratified per-day override tables — the substrate the portal capacity UI will bind to.
6. Entitlement **projection** (read side): `business_entitlements` (D-050) + `require_entitlement()` helper + the atomic Starter client-cap RPC pattern.
7. Audit: `audit_events` (actor, time, business, before/after) for elevated + capacity-reset actions.
8. Generated DB types → `packages/data`.
9. The RLS/RBAC/entitlement/capacity **test suite** = the go/no-go gate.

**Out (later layers — CFG-1 provides the schema seams, not the impl):**
- `packages/pricing` extraction (already in flight), the booking engine internals, Stripe Connect/Billing wiring, notification delivery, storage impl, the full account-deletion saga, GPS/messaging/SMS. Each builds ON CFG-1.
- The **portal capacity UI** (per capacity-model) binds to CFG-1's tables once they exist.

**Seams to keep (no rework later — from architecture §3.8):** hostname→product registry, host-only cookie name, `(issuer, subject)` identity, per-product adapter/credentials, entitlement projection contract. Nothing hard-codes "petappro."

## 2. KEY SCOPING DECISION for Codex (resolve first)
The architecture splits data across **Base509 master** (accounts authority, Stripe Billing, entitlement *resolver*, products registry) and the **PetAppro operational DB** (tenancy, memberships, the entitlement *projection*). **How much of the Base509 master do we stand up for CFG-1 vs stub?**
- Option A (recommended for MVP, one product): PetAppro operational DB holds a **local account projection** minted by a trusted bootstrap path on first login (central IdP deferred, D-036); the entitlement projection is seeded by a **minimal internal sync stub** until Stripe Billing is wired. Master stays thin.
- Option B: stand up the Base509 master (accounts, billing_accounts, products, resolver) now.
Codex to rule; it changes what tables land where and the sync contract. Everything below assumes the operational-DB foundation regardless.

## 3. First migration set (grouped; every table carries `business_id` + tenant-composite FKs)
- **Identity/tenancy:** local account projection (`base509_account_id`), `auth_identities (issuer, provider_subject)` unique, `businesses`, `business_memberships (base509_account_id, business_id, role, status)`, `clients (base509_account_id, business_id, …, relationship_state active|ended)`.
- **Onboarding:** `business_invite_codes (business_id, type staff|client, code, max_uses, uses_count, expires_at, revoked)`.
- **Services/capacity:** `business_services` (+ `capacity_model`, `capacity_config` incl. `service_limit`), `business_service_pricing` (stub — owned by pricing pkg), `capacity_groups (business_id, id, resource_unit)`, `service_windows` (fixed_window) + window assignments + zones, and `business_calendar_days`, `business_service_day_overrides`, `capacity_group_day_overrides`, `service_window_day_overrides` (+ assignments). `booking_occurrences.service_window_id` seam.
- **Entitlements:** `business_entitlements` (tier key, capability values/limits, source version, effective/expiry, sync time) — app roles read-only; internal sync writes.
- **Audit:** `audit_events`.
- **Pets:** `pets (business_id, owning client)` — per-business scope (D-005).

## 4. RLS + helpers
- **Helpers (security-definer, safe search_path):** `current_base509_account_id()`, `current_membership(business_id) → role|null`, `role_rank(role)` (encodes Staff⊂Manager⊂Admin⊂Owner), `require_entitlement(business_id, capability, amount?)`, `has_capability(business_id, capability)`.
- **Policy pattern per operational table:** READ = active provider membership in `row.business_id` OR owning client; WRITE = `role_rank(current) ≥ required_rank` per the roles matrix (e.g. config/pricing → Admin+, bookings edit → Manager+, care notes → Staff+, own pet → owning client); ELEVATED (ownership transfer, Stripe connect, admin promotion, business delete) = Owner-only **and** additionally guarded in Edge Fns/RPCs. Gated tables add entitlement predicates in `USING`/`WITH CHECK`.
- **Non-negotiables:** RLS enabled on every business table; app relationships reference `base509_account_id` (raw `auth.uid()` only inside helpers); no global email / hardcoded id; break-glass support role is the only sanctioned cross-tenant path (redacted, audited, time-boxed).

## 5. Server-op enforcement (RLS can't do aggregates)
Single transactional security-definer RPCs, serialized on `business_id`:
- **Starter client cap (5):** create/import/accept-invite/reactivate client → lock, read entitlement, count active clients, insert only if within limit. Direct client inserts denied by RLS.
- **Capacity approval / auto-book:** enforce service cap AND shared pool using the ratified date-based `[arrival, departure)` count; serialize by tenant + service/pool + affected dates; reserve on approved/confirmed, release on cancel; reschedule/pet-count/approve/cancel are atomic release-recheck-reserve.
- **Seat/invite creation & entitlement gates:** same serialized pattern; UI counts informational only.
- **Elevated actions:** through typed Edge Fns with D-031 re-auth/MFA + audit.

## 6. Acceptance / go-no-go gate (the real deliverable)
CFG-1 is "done" only when these pass in CI:
- **Cross-tenant RLS negatives** — read AND write, every table: business B's user can never see/modify business A's rows.
- **RBAC matrix tests** — each role × action from `user_roles_and_permissions.md` §10/§440 matrix, incl. Manager (ops, no financials, no price-override) and Staff (no edit/delete bookings, no client invites D-002).
- **Entitlement negatives** — a lower-tier caller with a valid login + tampered request is refused at BOTH the endpoint and the DB policy, per capability (booking_payments, seat_limit, theme_allowlist, gps, messaging, sms, client_limit).
- **Concurrency** — parallel client creation can't exceed Starter 5; parallel capacity approvals can't exceed the service cap/pool (beyond the accepted changeover date tolerance).
- **Capacity counting** — `[arrival, departure)` half-open in business tz; departure date not counted; arrivals counted; shared pool required only when 2+ co-located services share a resource.
- **Fail-closed** — missing/expired/unverifiable entitlement → lowest safe tier (Starter, Brandy Blue only, no paid actions).
- **Invite codes** — type-locked, single-business, expiry/max_uses honored; invalid/expired/revoked → clean error, no partial access.
- Generated types current; typecheck + lint + tests green per PR (CI).

## 7. Build order
1. Identity/tenancy + memberships + helpers + baseline RLS → cross-tenant tests green.
2. RBAC matrix policies + role_rank → matrix tests green.
3. Invite codes + bootstrap (owner creation) + client onboarding.
4. Services + capacity config + per-day override tables + the capacity approval RPC → capacity + concurrency tests green.
5. Entitlement projection + `require_entitlement` + Starter-cap RPC + fail-closed → entitlement tests green.
6. Generated types → `packages/data`; CI gate.

## 8. Open items for Codex (at ratification)
- The §2 master-vs-operational scoping decision.
- Context-switch transport: active `business_id` as validated JWT claim vs per-request param (architecture §13).
- RLS helper performance at realistic row counts (`current_membership` in policies).
- Invite-code single-use vs reusable (D-013/D-014) — columns present, default TBD.
- Confirm the capacity `capacity_group_id` vs scheduling `conflict_group_id` separation lands as two columns/FKs.

## 9. Routing
Cowork spec (this) → **Codex ratifies** the concrete schema/RLS/scoping → **Fable builds** the migrations + helpers + tests → **Codex reviews** → Danny approves → **Fable pushes**. Lands in `supabase/` as the CFG-1 operational schema (separate from the live waitlist migration).
