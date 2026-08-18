# CFG-1 — Multi-Tenant Foundation Build Spec (v2 — Codex-ratified, build-ready)
**Author: Cowork · v1 2026-08-18 → v2 folds Codex's 1st CHANGES-REQUIRED → v2.1 folds Codex's 2nd (7 residual) corrections (2026-08-18) · Status: RATIFIED (Option A), pending Codex final re-verify → Fable build**

## 0. What this is
The concrete, build-ready plan for **CFG-1**: the first `supabase/` migration set that stands up PetAppro's multi-tenant foundation — tenancy, identity, RBAC, RLS, services + capacity config, the entitlement projection, and the test gates that prove it's secure. Every later feature (bookings, payments, notifications, the portal capacity UI) sits on top of this gate.

**Ratification note (2026-08-18):** Codex ratified the architecture and **selected Option A** (§2). The corrections in Codex's CHANGES-REQUIRED verdict are folded in below as **binding**. Where this doc previously stated a looser rule, the binding version here supersedes it.

**Canonical inputs (do not restate — cite):**
- `docs/planning/technical_architecture.md` — tenant model, identity, RLS strategy, D-050 entitlements, payments, storage.
- `docs/planning/user_roles_and_permissions.md` — RBAC matrix (Owner/Admin/Manager/Staff/Client; nested Staff⊂Manager⊂Admin⊂Owner).
- `docs/specs/capacity-model.md` — ratified capacity model (D-075/D-076) + date-based counting + summed walking + reusable zones.
- `docs/planning/data_model_draft.md` — table-level detail.
- Never-cut (D-023): `business_id` boundary + RBAC/RLS + the shared pricing package + its tests.

## 1. Scope

**In (CFG-1 — the operational DB foundation):**
1. Local identity projection + membership: resolve Supabase Auth `(issuer, provider_subject)` → stable `base509_account_id` → memberships/clients → active `business_id`.
2. Tenancy: `businesses` + `business_id` on every operational table; RLS on all.
3. RBAC: Owner/Admin/Manager/Staff (nested) + Client relationship; helpers + operation-specific policies.
4. Onboarding: hashed, typed invite codes with a **type-specific use policy** (team invites single-use + expiring; client booking codes reusable-until-revoked).
5. Services + capacity config: `business_services` + `capacity_groups` + `availability_conflict_groups` + `service_windows` (+ assignments, zones, per-member caps) + the ratified per-day override tables — the substrate the portal capacity UI binds to.
6. Entitlement **projection** (read side): `business_entitlements` (D-050) + `require_entitlement()`/`has_capability()` helpers + the atomic Starter client-cap RPC + a versioned sync-envelope stub.
7. Minimal booking relational shells (`bookings`, `booking_pets`, `booking_occurrences`) so the capacity primitive and `service_window_id` seam exist — no public booking RPC yet (§5).
8. Audit: immutable append-only `audit_events`.
9. Generated DB types → `packages/data`.
10. The RLS/RBAC/entitlement/capacity/identity/concurrency **test suite** = the go/no-go gate.

**Out (later layers — CFG-1 provides the schema seams, not the impl):**
- The physical Base509 master (accounts authority, Stripe Billing truth, entitlement resolver + catalogue, `products`/`product_businesses`/`billing_accounts`/`billing_subscriptions`) — deferred per Option A; **none of it lands in PetAppro**.
- `packages/pricing` internals, the full booking engine + public `approve_booking`, Stripe Connect/Billing wiring, notification delivery, storage impl, account-deletion saga, GPS/messaging/SMS. Each builds ON CFG-1.
- The **portal capacity UI** binds to CFG-1's tables once they exist.

**Seams to keep (no rework later — architecture §3.8):** hostname→product registry, host-only cookie name, `(issuer, subject)` identity, per-product adapter/credentials, entitlement projection contract. Nothing hard-codes "petappro."

## 2. §2 SCOPING — RATIFIED: Option A (staged local projection, deferred physical master)
Per D-035/D-036 ("design the seam now; extract later"). This is **sequencing only** — it does not reverse Base509's eventual authority.

**Lands locally in the PetAppro operational DB (CFG-1):**
- `base509_accounts` — minimal local account projection carrying the permanent `base509_account_id`.
- `auth_identities` — local `(issuer, provider_subject) → base509_account_id` mapping.
- `businesses`, `business_memberships`, `clients`, `pets`, services, capacity, windows, zones, overrides.
- `business_entitlements` — local enforcement projection.
- Operational `audit_events`.

**Does NOT land in PetAppro:** `products`, `product_businesses`, `billing_accounts`, `billing_subscriptions`, Stripe Billing truth, the entitlement catalogue, resolver logic.

### 2.1 Trusted account bootstrap contract (supersedes the old "trusted bootstrap path" line)
The first-login account mint must be:
- **Atomic and idempotent.**
- Uses an **allowlisted, server-derived `issuer`** and the **authenticated subject** — neither is trusted from request input.
- Creates **one durable `base509_account_id` UUID** and **preserves it unchanged** when the master is later introduced.
- Enforces **unique `(issuer, provider_subject)`**.
- **Never merges or links accounts by email.**
- Direct authenticated/anonymous writes to **both** identity tables (`base509_accounts`, `auth_identities`) are **denied**; only the bootstrap/linking function may create identity mappings.
- **Concurrent first-login calls return the same account** (no duplicates) — serialize on `(issuer, provider_subject)`.
- Identity linking / recovery across issuers requires **proof of control + audit**.

When the master is introduced: locally issued IDs are **imported unchanged** (no operational FK remapping). From then on the master is canonical for linking/merging and projects the minimum identity record back to PetAppro.

### 2.2 Entitlement stub + eventual one-way sync
The CFG-1 stub may seed **only the safe Starter entitlement set**, using the **same envelope** the eventual master will send:
`source_system`, `event_id`, monotonic `source_version`, `operational_business_id`, explicit capability values/limits, `effective_at`/`expires_at`, projection version.
Updates are **idempotent**, **reject duplicates/out-of-order versions**, and **append an audit event**. Monotonicity is scoped per **`(business_id, source_system)`**; `(source_system, event_id)` is **deduplicated** via an **immutable sync receipt/audit record**. Once a business receives a **master-authoritative** projection, the bootstrap stub is **permanently unable to overwrite it**.

Future contract is strictly **one-way**:
`Base509 master resolver → authenticated, signed, replay-resistant sync → PetAppro business_entitlements projection`.
PetAppro **never** derives tier authority from a Stripe redirect, client request, cached tier name, or lexical tier ordering.

## 3. First migration set (binding)
**Tenant-key rule:** every **business-specific** table carries `business_id`. Exceptions: `base509_accounts`, `auth_identities`, and `businesses` itself — `businesses.id` is the tenant key. Cross-table relationships **between two business-scoped records** use tenant-composite FKs; references to **global projections** (e.g. `base509_accounts`) are ordinary single-column account FKs. (The `business_id`-reassignment test in §6 likewise applies only to business-scoped tables.)

### 3.1 Identity / tenancy + invariants
- `base509_accounts (base509_account_id uuid pk, …minimal)`, `auth_identities (issuer, provider_subject) UNIQUE → base509_account_id`.
- `businesses (id pk, …)`; `business_memberships (business_id, base509_account_id, role, status active|invited|removed)`; `clients (business_id, base509_account_id, status active|blocked|ended, …)`.
- **Invariants (binding):**
  - UNIQUE `(business_id, base509_account_id)` on **memberships** and **clients**.
  - `clients.status = active | blocked | ended` (restores the canonical **blocked** state).
  - **D-003:** one account cannot be both a client and a provider-member of the **same** business — enforce in **both** creation directions under the same business lock.
  - **Business creation + first Owner membership + Starter entitlement row = one idempotent transaction.**
  - **Owner membership is never invite-assignable.**
  - **At least one active Owner must always remain.**
  - `businesses.owner_account_id` (if retained) must be transactionally consistent with the active Owner membership.

### 3.2 Invite codes (secure — supersedes plaintext `code`)
`business_invite_codes (business_id, code_hash, display_prefix?, type staff|client, target_role, max_uses, uses_count, expires_at, revoked_at, created_by, created_at)`.
- **Cryptographically random** tokens; store **`code_hash`** only (never plaintext).
- **No direct table reads by invitees.**
- **Atomic redemption:** lock the code, recheck expiry/revocation/use count, create the relationship, increment usage — one transaction.
- **Rate limiting outside the database.**
- **`target_role` is enforced (not a hint) and can never be Owner.** Owner may invite Admin/Manager/Staff; Admin may invite Manager/Staff (never Admin).

### 3.3 Services / capacity / conflict / booking seam
- `business_services` (`capacity_model bounded|unlimited`, `capacity_config jsonb` incl. `service_limit`, **`capacity_group_id`**, **`conflict_group_id`**, `duration_model`, …).
- **Two independent columns + composite FKs (never infer one from the other):**
  `business_services.capacity_group_id → capacity_groups`; `business_services.conflict_group_id → availability_conflict_groups`.
- `capacity_groups (business_id, id, resource_unit, pool_limit>0, …)`; **add `availability_conflict_groups (business_id, id, overlap_policy, …)`** (was omitted). **A `capacity_group` is required ONLY when 2+ co-located services consume the same finite resource** — a single-service business needs no pool row (its `service_limit` is the ceiling). Restores `capacity-model.md` line 178.
- **Walking/zone relational tables — see §5A** (summed-walker contract; not JSON).
- Per-day override tables: `business_calendar_days`, `business_service_day_overrides`, `capacity_group_day_overrides`, `service_window_day_overrides` (+ `service_window_day_override_assignments`).
- **Booking seam (minimal shells only):** `bookings`, `booking_pets`, `booking_occurrences (…, service_window_id)`. Booking status vocabulary reconciled: `requested` = **non-reserving**; `approved`/`confirmed` = **reserve**; cancellation = **release**. CFG-1 implements an **internal, non-public** capacity-lock/check primitive only. **Do not expose a partial `approve_booking` RPC** before the full approval transaction (capacity + canonical pricing/invoice/state) exists; the later approval op invokes the capacity primitive inside its single transaction.
- `pets (business_id, owning client)` — per-business (D-005).

### 3.4 Pricing stub (don't freeze a contract in a migration)
Either create only the **tenant/service relational shell** until `packages/pricing` supplies the generated shape, **or** derive the DB validation **mechanically** from the canonical pricing types. Do not hand-freeze an independent `pricing_structure` jsonb contract.

### 3.5 Entitlements
`business_entitlements (business_id UNIQUE, tier_key, capabilities jsonb, client_limit, seat_limit, theme_allowlist, source_system, source_version, effective_at, expires_at, projection_version, last_synced_at, sync_status, …)` — the tenant key is **`business_id` only**. The envelope's `operational_business_id` **resolves to** this local `business_id`; it is **not** persisted as a second mutable identifier (if ever carried, enforce immutable equality). App roles read-only; only the signed internal sync path writes (§2.2).

### 3.6 Audit (immutable, append-only)
`audit_events` with at least: `business_id`, actor, action, target type/id, reason (where required), **redacted** before/after, correlation/idempotency id, timestamp. Authenticated roles **cannot** directly insert/update/delete audit rows. **No secrets, invite tokens, access codes, or unnecessary PII** in before/after payloads.

## 4. RLS + helpers (binding)
- **Helpers (security-definer):** `current_base509_account_id()`, `current_membership(business_id) → role|null` (**active** identities/memberships only), `role_rank(role)` (Staff⊂Manager⊂Admin⊂Owner), `has_capability(business_id, capability) → boolean` (for RLS), `require_entitlement(business_id, capability, amount?)` (for server ops, stable errors). Both entitlement helpers **fail closed** on missing/expired/malformed/unknown data.
- **Security-definer hygiene:** empty/fixed safe `search_path`, fully-qualified objects, **non-login owner**, execution granted narrowly. **Prevent recursive RLS** where `current_membership()` reads `business_memberships`.
- **Operation-specific policies (not blanket-by-rank):** separate `SELECT`/`INSERT`/`UPDATE`/`DELETE` policies per table. `UPDATE` requires both `USING` and `WITH CHECK`, blocking reassignment of `business_id` or the owner FK. `role_rank` may gate, but passing rank never grants blanket table writes. Distinct policies/RPCs for: Staff booking creation, Manager booking edits, Staff care-status mutations, Admin configuration changes.
- **Clients** sit **outside** the provider role hierarchy. Clients cannot directly read: capacity configuration, staff/window assignments, other-client demand, audit rows, entitlement source metadata. Client availability comes only from a tenant-safe effective-availability RPC.
- **No global reads:** team-directory contact data comes through a membership-validated view/RPC; global reads of `base509_accounts` are prohibited.
- **Anon denied** unless a separately reviewed public surface explicitly needs it.
- **Service-role/internal tooling** must call the same invariant-enforcing operations — RLS bypass is **not** permission to bypass client/seat/capacity limits.
- **Non-negotiables:** RLS enabled on every business table; app relationships reference `base509_account_id` (raw `auth.uid()` only inside the identity helper); no global email / hardcoded id; break-glass support role is the only sanctioned cross-tenant path (redacted, audited, time-boxed).

## 5. Server-op enforcement (typed, transactional — RLS can't do aggregates)
Single transactional security-definer RPCs. **Actor authority by op class — no operation accepts a human actor supplied in its payload:** **user** ops derive the human actor from the authenticated session; **machine** ops (entitlement sync) authenticate a workload/system identity and record `actor_kind=system`; **bootstrap/redemption** ops use their own specific proofs (first-login has no business; business bootstrap has no prior membership; invite redemption treats the invite itself as the authority to establish membership). **All** ops otherwise: treat a supplied `business_id` only as a **selector** then independently prove access; are **idempotent** where retries are possible; take **invariant-specific locks in deterministic order**; **never trust** role, tier, amount, issuer, or target account supplied by the client. Required ops:
- **Account/identity bootstrap** (§2.1).
- **Business + first Owner bootstrap** (+ Starter entitlement, one tx).
- **Invite creation + atomic redemption** (grant ceilings; §3.2).
- **Membership role change / removal** — grant ceilings, **last-Owner protection**.
- **Client create / import / reactivate** — Starter client-cap (5) + D-003 dual-relationship enforcement; direct client inserts denied by RLS.
- **Seat activation / reactivation** — seat limit.
- **Entitlement projection sync** — monotonic/version checks, dedupe, out-of-order reject, stub-cannot-overwrite-master (§2.2).
- **Capacity config + override mutations** — with audit.
- **Override reset deletion** — delete the active override row **and** append the mandatory audit event.
- **Capacity primitive (internal, non-public — the ONLY capacity code in CFG-1):** locks deterministic service/pool/date keys, computes effective capacity against the date buckets (honoring **Block All**, service/window availability, service + pool overrides, and the conditional shared pool), and **either returns success or raises a stable conflict**. It does **NOT** approve, cancel, reschedule, invoice, or expose a public RPC.
- **Later booking transaction (post-CFG-1, not built here):** invokes the primitive and changes booking/occurrence state in the **same** transaction; approve/reschedule/pet-count/cancel do atomic release-recheck-reserve there. Explicit **human over-capacity** requires an **explicit flag + immutable audit**; **auto-book never invokes the human override**.
- **CFG-1 concurrency tests** exercise the primitive through a **privileged test wrapper** that performs the fixture reservation while holding those locks (since no public reserve path exists yet).

### 5A. Capacity encoding (binding — supersedes the loose "windows + zones" line)
**Occupancy counting:**
- Boarding occupies `[arrival_service_date, departure_service_date)` in the **business timezone**.
- Daycare occupies **exactly one `service_date`** — it must **never** become an empty same-day interval.
- Both **service** and **pool** limits use these date buckets. `service_limit` and `pool_limit` are **positive integers**. Resource units must be **compatible** before a service joins a pool.
- The pool is a **date-bucket scheduling limit with the accepted departure-day tolerance**, not an instantaneous physical ceiling.

**Summed walking + reusable zones — relational, FK-bearing rows (NOT JSON blobs):**
- `service_zones` (reusable per-tenant pool); service-to-zone links; window-to-zone links.
- Per-service / per-member **default capacity** rows.
- `service_window_assignments` with an optional **per-window member capacity override**.
- Assignment-to-zone **coverage** links; corresponding **day-override assignment** rows.
- `capacity_config` owns **evaluator defaults / versioned scalar config only**; the relational tables own account/membership/window/zone **references**.
- **Effective walking capacity = Σ distinct assigned walkers' effective caps.** For a requested zone, sum only walkers whose coverage includes that zone.
- **Precedence:** day assignment override → window/member override → service/member default → service fallback.
- **Unique constraints** prevent counting one member twice for the same window/date/zone. **Explicit binding keys:** per-member default UNIQUE `(business_id, business_service_id, business_membership_id)`; window assignment UNIQUE `(business_id, service_window_id, business_membership_id)`; zone links UNIQUE on their service/window/assignment key **+ `service_zone_id`**; every member/window/zone link is **tenant-composite**; all capacity values **positive**; day-override assignment rows preserve the **same** uniqueness + tenant constraints.

## 6. Acceptance / go-no-go gate (the real deliverable)
CFG-1 is "done" only when these pass in CI:

**Tenancy / RLS:**
- Anonymous access denied across the entire foundation.
- Every table tested for `SELECT`/`INSERT`/`UPDATE`/`DELETE`; **business-scoped** tables additionally tested against attempted `business_id` reassignment (this test does not apply to the global `base509_accounts`/`auth_identities`).
- Cross-tenant composite-FK attacks rejected.
- Inactive/removed memberships and ended/blocked clients lose the appropriate access.

**Identity / RBAC:**
- Concurrent first-login bootstrap creates exactly **one** account.
- Email collision **never** merges accounts.
- Same-business client/member creation races cannot violate **D-003**.
- **Last Owner** cannot be removed/demoted.
- Admin cannot grant Admin or Owner; Manager/Staff cannot invite.
- RBAC matrix per `user_roles_and_permissions.md` (Manager: ops, no financials/price-override; Staff: no booking edit/delete, no client invites D-002).

**Entitlements:**
- Endpoint + DB negative gate for **each capability present in CFG-1** (lower tier + tampered request refused at both layers). Future GPS/messaging/SMS/payment endpoints inherit the same mandatory gate before their own release.
- Entitlement sync handles duplicate and out-of-order events and **cannot be overwritten by the stub after authority handoff**.
- Paid-to-Starter over-limit state behaves per architecture.
- Fail-closed: missing/expired/unverifiable → lowest safe tier (Starter, Brandy Blue only, no paid actions).

**Concurrency:**
- Invite redemption concurrency cannot exceed `max_uses`.
- Seat activation concurrency cannot exceed the entitlement.
- Parallel client creation cannot exceed Starter 5.
- Parallel capacity approvals cannot exceed the service cap/pool (beyond the accepted changeover date tolerance).
- **Conflict-group** concurrency as well as **capacity-group** concurrency.

**Capacity:**
- Boarding `[arrival, departure)` half-open; daycare single `service_date` (never empty); departure date not counted; arrivals counted.
- Block All precedence; service override cannot revive a globally disabled service; service & pool overrides independent and jointly enforced; window-day assignment replacement vs fallback; reset deletes override + appends audit; lowering below booked occupancy never cancels bookings.
- Walking sum with **unequal** walker caps; zone-filtered capacity; same walker in overlapping windows/zones counted **once**.
- `capacity_group_id` and `conflict_group_id` can differ without interference.
- **Auto-book cannot invoke an over-capacity override**; a human over-capacity approval **requires an explicit flag + immutable audit** (this rule is now explicitly gated, not just stated in §5).
- **Conditional pool:** a single-service business needs **no** `capacity_group`; a pool is created/enforced only when 2+ co-located services share a resource.

**Hardening:**
- Audit rows immutable; secrets redacted.
- Security-definer functions not executable by unintended roles.
- Fresh-DB migration/reset works; generated-type drift check.
- Realistic RLS performance: indexed `(issuer, provider_subject)` and `(business_id, base509_account_id, status)`; `EXPLAIN (ANALYZE, BUFFERS)` at representative tenant volumes uses indexes, not per-row seq scans.

## 7. Build order
1. Identity/tenancy + memberships + helpers + baseline RLS + **bootstrap RPC** → cross-tenant + concurrent-first-login tests green.
2. RBAC matrix policies (operation-specific) + role_rank + last-Owner/grant-ceiling ops → matrix tests green.
3. Invite codes (hashed) + atomic redemption + business/Owner bootstrap + client onboarding (D-003) → invite/concurrency tests green.
4. Services + capacity/zone relational tables + per-day overrides + booking shells + internal capacity primitive → capacity + concurrency tests green.
5. Entitlement projection + sync-envelope stub + `require_entitlement`/`has_capability` + Starter-cap RPC + fail-closed → entitlement tests green.
6. Audit wiring + generated types → `packages/data`; full CI gate.

## 8. §8 answers (ratified)
- **Master vs operational:** Option A + the delegated bootstrap (§2.1) and one-way future sync (§2.2).
- **Context-switch transport:** explicit **per-request/route `business_id` selector**, validated on every request. **Do not** put active-business authorization in a custom JWT claim (claims go stale, complicate multi-business switching). RLS still validates row membership independently. Last-used business is **UX state only**.
- **RLS helper performance:** indexed `(issuer, provider_subject)` and `(business_id, base509_account_id, status)`; `EXPLAIN (ANALYZE, BUFFERS)` at representative volumes; identity/membership resolution must use indexes.
- **Invite defaults:** team/Admin/Manager/Staff invites **single-use, expiring (recommend 7 days)**; client booking codes **reusable until revoked** (optional expiry/use limits). Both hashed, rate-limited bearer secrets.
- **Capacity vs conflict groups:** **two separate tables, two separate `business_services` columns, two separate tenant-composite FKs.** Never infer one from the other.

## 9. Routing
Cowork Product spec (this, v2) → **Codex re-verifies** the folded corrections → **Fable builds** migrations + helpers + RPCs + tests → **Codex reviews** → **Danny approves** → **Fable pushes**. Lands in `supabase/` as the CFG-1 operational schema (separate from the live waitlist migration).
