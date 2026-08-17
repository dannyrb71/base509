# PetAppro Data Model Draft (Phase 1)

First-pass tenant-scoped schema for the shared Supabase (Postgres) database. Extends the core table list in `woof-wetreats-to-petappro-rebuild-plan.md` with columns, relationships, and the tenant/RLS keys. Pairs with `technical_architecture.md`.

> **Status:** Phase 1 draft (updated 2026-07-14 for D-045/D-050/D-052 and D-007/D-042 reconciliation). Column-level detail is directional, not a migration — migrations are Phase 5/6. This exists to prove the tenant boundary, permission model, and pricing/notification flows have a coherent schema before build.
>
> **Rules:** every business-specific table has `business_id` and RLS. No global admin email, no hardcoded ids. Working defaults cited by decision ID from `docs/decisions/open_decisions.md`.

---

## 1. Conventions

- **PK:** `id uuid default gen_random_uuid()` on every table.
- **Tenant key:** `business_id uuid references businesses(id)` on every operational table (the security boundary).
- **Audit columns:** `created_at timestamptz default now()`, `updated_at timestamptz`, and where an actor matters `created_by_account_id uuid references base509_accounts(id)`, `updated_by_account_id uuid references base509_accounts(id)`.
- **Soft state:** `status` enums instead of hard deletes where history matters (e.g., pets, bookings).
- **Money:** integer minor units (cents) + `currency`, never floats.
- **RLS:** enabled on all tables below; policies resolve through `current_base509_account_id()` + `current_membership(business_id)` (see architecture §4). Raw `auth.uid()` is used only inside the identity mapping helper.

## 2. Entity map

```
auth.users (Supabase)
    │
    └──< auth_identities >── base509_accounts
                              │
                              ├──< business_memberships >── businesses ──< business_invite_codes
    │                                  │
    │                                  ├── business_entitlements
    │                                  ├──< business_services ──< business_service_pricing
    │                                  ├──< availability_conflict_groups
    │                                  ├──< business_availability      (blocked dates)
    │                                  ├──< business_terms_versions
    │                                  ├──< business_assets
    │                                  └──< notifications ──< notification_deliveries
    │
                              └──< clients >── (business_id) ──< pets
             │
             └──< bookings >── booking_pets >── pets
                     │
                     ├──< booking_occurrences ── booking_service_locations
                     ├── booking_price_breakdowns
                     ├── invoices / credit_notes ── invoice_sequences
                     ├──< payments ──< payment_events
                     └── meet_greets
   staff_notes ── (business_id, client_id / booking_id, author)
```

## 3. Tenant & identity tables

### base509_accounts
Stable product-agnostic account record. `id, primary_email, display_name, created_at, updated_at.`
- This is the durable person/account key for PetAppro app relationships and future Base509 products.
- Do not put PetAppro-specific provider/client fields here.

### auth_identities
Mapping from the current auth provider to the stable account. `id, base509_account_id, issuer (the Supabase project / auth tenant, or a future external IdP), provider (login method: supabase|apple|google|future_idp), provider_subject, created_at.` **Unique by `(issuer, provider_subject)`, NOT `(provider, provider_subject)`** — per `technical_architecture.md` §137 "Required schema correction before migrations." Never merge accounts by email alone (Apple relay / changed / recycled addresses). *(Reconciled to the architecture contract 2026-07-31 — Codex flagged the draft was missing `issuer`.)*
- For MVP, `provider_subject` maps to Supabase `auth.users.id`.
- RLS helpers use this table to resolve `auth.uid()` to `base509_account_id`.

### businesses
The tenant root. `id, name, slug, owner_account_id, branding (jsonb: logo, colors, hero), landing_content (jsonb), currency (D-025), settings (jsonb: meet_greet_required per D-006, timezone), created_at, updated_at.`
- One implicit location (D-010 Deferred — no `location_id`).
- `currency` sets the provider's booking + display currency (D-025); all money elsewhere is minor units in this currency.
- SaaS billing truth (`stripe_customer_id`, subscription status/period, billing interval) lives in the Base509 master (D-034/D-037), not in client-writable business settings. PetAppro enforces the projected capability set below.

### business_entitlements (D-050)
PetAppro-local, tenant-scoped enforcement projection. `id, business_id (unique), tier_key, capabilities (jsonb), client_limit, seat_limit, theme_allowlist (jsonb), source_subscription_id, source_version, effective_at, expires_at, projection_version, last_synced_at, sync_status, created_at, updated_at.`
- Base509 master/Stripe Billing remains authoritative; this row is written only by the signed internal sync path. Authenticated app roles may read their active business's effective result but cannot insert/update/delete it.
- RLS and server helpers check explicit capabilities/limits, never a client-supplied tier or lexical tier ordering. Missing, expired, invalid, or unknown data resolves to Starter-safe deny-by-default capabilities.
- Projection updates are idempotent and monotonic by source/projection version; every change is audited. Server mutations re-read this local projection at execution time.

### business_memberships
Staff/provider-side relationship. `id, business_id, base509_account_id, role (owner|admin|manager|staff), status (active|invited|removed), invited_by_account_id, created_at.`
- Unique `(business_id, base509_account_id)` — an account holds at most one provider-side role per business.
- Client relationship is **not** here — it lives in `clients` (keeps D-003 clean: no dual client+staff on one business).
- **First membership (business creator) = `owner`** — the highest role, includes all admin capability + financials. When the owner adds a second user, onboarding **prompts for role** and shows the permission chart (roles doc §10), with a disclaimer that **`admin` can see business financial data** (D-020 onboarding requirement).
- Invite acceptance/reactivation uses a server transaction that locks the business, reads `business_entitlements.seat_limit`, and refuses an over-limit active membership. Direct client writes cannot bypass the seat check.

### business_invite_codes
`id, business_id, code (unique), type (staff|client), role_hint, max_uses, uses_count, expires_at, revoked_at, created_by_account_id, created_at.`
- `max_uses` / `expires_at` present now so D-013/D-014 (Proposed) are config, not migration.
- A code is tied to one `business_id` and one type; a staff code can't create a client (roles doc §9).

### clients
Client profile, **scoped per business** (D-004 Yes across businesses via separate rows; D-005 pets per business). `id, business_id, base509_account_id, display_name, emergency_contact (jsonb), vet_info (jsonb), status (active|blocked|ended), ended_at, blocked_reason, blocked_by_account_id, terms_accepted_version, created_at, updated_at.`
- `status = ended` is the relationship lifecycle (a customer leaving this provider): reversible, nothing deleted; the account and other-provider relationships are untouched.
- Unique `(business_id, base509_account_id)` — one client profile per account per business.
- Same `base509_account_id` may appear in many businesses' `clients` rows (D-004) and also in another business's `business_memberships` (D-012).
- Starter create/import/invite-accept/reactivate flows use one server transaction that locks the business, reads `business_entitlements.client_limit`, counts active relationships for that tenant, and refuses a resulting count above five. Direct client writes and service-role operator/import paths may not bypass this invariant; paid tiers project an unlimited value.

## 4. Business configuration tables

### business_services
Services are generic engine instances, not enum branches (D-022; provider-onboarding spec §1/§5). `id, business_id, service_type_key (text; built-in preset key or provider-defined stable key), name, enabled, pricing_model, capacity_model, capacity_config (jsonb), capacity_group_id (nullable), duration_model, duration_config (jsonb), location_model, location_config (jsonb), buffers (jsonb: travel_minutes, setup_minutes), conflict_group_id (nullable), required_fields (jsonb), cancellation_policy (jsonb), deposit_required (bool — D-015 default false), visibility, created_at, updated_at.`
- **Rework guardrail:** `service_type_key` is data, not a PostgreSQL enum or an application switch limited to boarding/daycare/walking. Those three are launch presets that populate the five engine axes; a provider-defined service uses the same row and axis columns. Never create boarding/daycare/walking-specific service tables, DTOs, persistence branches, or pricing paths.
- Axis values use shared generated enums/check constraints: `pricing_model` follows `packages/pricing`'s canonical `PricingModel`; `capacity_model` = `bounded|unlimited` with the versioned composable V1 shape ratified in `docs/specs/capacity-model.md` §6C; `duration_model` = `overnight|fixed_window|slot|open_ended`; `location_model` = `at_provider|at_client|either`. Model-specific parameters live only in the adjacent config JSON, with generated/runtime validation; the model discriminator itself remains a first-class column so it can be indexed, constrained, typed, and queried.
- `buffers` is a first-class per-service JSON column because it is one of the five engine axes; require non-negative integer minutes and default both values to zero. Business-level default buffers may seed a service but must be snapshotted onto the service/booking rather than consulted retroactively.
- MVP enables boarding + daycare + walking. Future built-in presets and near-term provider-defined types reuse these rows. `slot` supports discrete walking/grooming appointments; `overnight` remains one booking with per-night occurrences.
- `location_model` is a service-delivery seam, not D-010 multi-branch support. MVP may use the business's single implicit site; client-location rows are required for in-home services, and route locations belong to GPS execution (D-054).

### business_service_pricing
Per-service rates consumed by `packages/pricing`. `id, business_id, business_service_id, pricing_structure (jsonb: base rate, per-night/per-day/per-visit/per-session, per-pet, add-ons, caps), effective_from, effective_to, created_at.`
- No global `pricing_rates.id = 1` (retired). Pricing is per business, per service.

### business_availability
Blocked dates / availability, server-enforced (replaces global blocked dates). `id, business_id, business_service_id (nullable = whole business), date, kind (blocked|limited), capacity_override, note, created_by, created_at.`

### availability_conflict_groups (D-045)
Provider-configurable exclusivity policy. `id, business_id, name, overlap_policy (exclusive|overlap_allowed), created_at, updated_at.` Services join by tenant-scoped `business_services.conflict_group_id`; the default overnight-exclusive group contains boarding, in-home sitting, and house sitting, while walking/drop-in may remain ungrouped or overlap-allowed.
- Conflict is **per booking occurrence, not per pet**. Booking confirmation/reschedule takes a transaction-scoped lock for the business/conflict group and rejects an overlapping confirmed occurrence in the same exclusive group. The authoritative time/date range and business timezone are server-derived.
- RLS restricts configuration to Owner/Admin. Direct client writes cannot confirm/reschedule around the check; all such transitions use the same typed RPC/Edge Function. Concurrent-overlap, boundary, timezone/DST, cancellation, and cross-tenant tests are required.

### capacity_groups (ratified 2026-07-31)
Tenant-scoped finite-resource pools shared by services that may legitimately overlap. `id, business_id, name, resource_unit, pool_limit, created_at, updated_at.` Membership is the tenant-composite `business_services.capacity_group_id`; never infer membership from `conflict_group_id`.
- Capacity and conflict are orthogonal: a conflict group controls overlap permission, while a capacity group limits aggregate consumption when overlap is allowed.
- `pool_limit` is a positive integer. Date/range changes use audited `business_availability.capacity_override` records targeted to the service or pool; do not rewrite the base pool row.
- Owner/Admin configuration only. Booking approval/auto-book use one transaction-scoped capacity reservation path and test concurrent requests, interval boundaries, pool + service limits, human override audit, auto-book non-override, and cross-tenant isolation.

### business_terms_versions
Tenant-aware terms (replaces static/global legal pages). `id, business_id, version, body (structured template + editable sections per D-009), published_at, published_by, is_current.`
- Stamped onto bookings and meet-greets by version.

### business_assets
`id, business_id, kind (logo|hero|pet_photo_ref|doc), storage_path (business_id-prefixed), signed_url_ttl, created_by, created_at.`

## 5. Operational tables

### pets
Business-scoped (D-005). `id, business_id, client_id, name, species, breed, dob, care_notes (client-visible), photo_path (business_id-prefixed), status (active|removed — soft remove), created_at, updated_at.`

### bookings
Server-authoritative (architecture §5). `id, business_id, client_id, business_service_id, start_date, end_date, status (requested|confirmed|cancelled|completed), created_by (client self-serve or staff), terms_version_stamped, cancellation_snapshot (jsonb), created_at, updated_at.`
- Blocked-date and meet-greet gates enforced server-side before `confirmed`.

### booking_occurrences
Execution and billing units beneath a booking. `id, business_id, booking_id, business_service_id, unit_kind (night|day|visit|session), sequence_no, starts_at, ends_at, service_date, assigned_account_id (nullable), status (scheduled|checked_in|completed|cancelled), conflict_group_id (nullable snapshot), service_location_id (nullable), created_at, updated_at.`
- One booking may produce N nights, visits, days, or sessions. This supports per-night/per-visit pricing, multi-visit-per-day execution, check-in/out, report cards, and D-045 overlap checks without duplicating the parent booking per pet.
- Occurrences are generated/changed only through the server booking transaction and retain the booking's `business_id`. The pricing breakdown snapshots the occurrence/unit inputs used for money calculation.

### booking_service_locations
Tenant-scoped service-delivery location/reference. `id, business_id, client_id (nullable), label, location_type (provider_site|client_service|route_start|route_end), address_ciphertext_or_ref, coarse_geo (nullable), access_secret_ref (nullable), status, created_at, updated_at.`
- This is feasible as an additive seam while D-010 multi-location remains deferred: MVP has one implicit provider site, but in-home/drop-in occurrences can reference a client service location. D-044 access codes stay separately encrypted and are never embedded in address snapshots or logs.
- Exact address/coordinates are least-privilege under RLS and exposed only to the assigned/authorized provider during the service window. GPS track points, if implemented for D-054, require a separate high-volume tenant-scoped table/storage policy and retention schedule; they do not belong in this row.

### booking_pets
Join (a booking covers 1+ pets in a household). `id, business_id, booking_id, pet_id.`

### booking_price_breakdowns
Stored authoritative price (never recomputed for display). `id, business_id, booking_id, computed_total, currency, line_items (jsonb), pricing_version, override_total (nullable), override_reason, overridden_by, overridden_at, created_at.`
- Manual override with audit (D-018 Yes): keep both computed and override values + actor + time.

### invoice_sequences, invoices, and credit_notes (D-052)
- `invoice_sequences`: one row per `(business_id, business_year)`, with `prefix`, `next_value`, `updated_at`; primary/unique key on `(business_id, business_year)`. `business_year` is derived server-side from the business timezone at issue time.
- `invoices`: `id, business_id, booking_id, business_year, sequence_value, invoice_number, prefix_snapshot, pricing_breakdown_id, status (issued|paid|credited), issued_at, paid_at, payment_id (nullable), immutable_payload (jsonb), pdf_storage_path (nullable), created_at`. Unique `(business_id, business_year, sequence_value)` and `(business_id, invoice_number)`.
- `credit_notes`: immutable adjustment rows referencing the original invoice, with their own issued document number/sequence policy, signed minor-unit amounts, reason, payment/refund reference, and snapshot. Issued invoices are never edited or deleted to represent cancellation/refund.
- Gapless allocation happens only in the same database transaction that irreversibly inserts the invoice: lock the tenant/year sequence row `FOR UPDATE`, validate prefix/width and booking snapshot, insert the immutable invoice, then advance `next_value`. A rollback consumes no number; deletion is forbidden; retries are idempotent by booking/issue key. PDF rendering/email occurs after commit through the outbox so delivery failure cannot create a numbering gap.
- The prefix and rendered payload are frozen on issuance. A later provider-prefix/theme change affects future invoices only. RLS permits tenant reads but direct client issuance/update is denied; a typed server RPC is the sole issuer. Concurrency, year rollover/timezone, retry, rollback, uniqueness, credit, and cross-tenant tests are mandatory.

### meet_greets
Gate before first booking when enabled (D-006). `id, business_id, client_id, status (requested|scheduled|completed|waived), scheduled_at, completed_by, terms_version_stamped, created_at, updated_at.`

### staff_notes
Staff-only, never client-visible. `id, business_id, client_id (or booking_id), author_account_id, body, created_at.`
- RLS: readable/writable by owner/admin/staff of the business only (roles matrix).

## 6. Notification & payment tables

### notifications
Tenant-aware outbox (replaces global Pushover). `id, business_id, event_type, audience (base509_account_id or role), payload (jsonb), created_at.`

### notification_deliveries
Per-channel fan-out. `id, business_id, notification_id, channel (in_app|push|sms|email), status (pending|sent|failed), error, delivered_at.`
- MVP channels: in_app + push. SMS deferred (D-008). Email = paper trail only.

### payments
Client↔business money, **Stripe Connect Standard in MVP** (D-007 Option A), with manual methods as fallback. `id, business_id, booking_id, client_id, method (stripe_connect|cash|check|venmo|zelle|other), amount_minor, currency, status (unpaid|requires_action|processing|succeeded|failed|recorded|confirmed|partially_refunded|refunded), connect_account_id_snapshot, payment_intent_id, idempotency_key, confirmed_by, reference_note, created_at, updated_at.`
- The tenant's Connect account mapping is server-managed and validated before PaymentIntent creation; the client cannot select an arbitrary account or amount. Unique constraints cover the server idempotency key and non-null Stripe PaymentIntent id.
- Signed Stripe webhook events are authoritative and idempotently advance payment state; client redirect/success payloads do not. Refunds and payout/account changes require the D-031 Owner/Admin authorization/step-up rules and append audit events.
- **Not** the SaaS subscription — provider→Base509 Stripe Billing is web-only (D-042) and lives in the Base509 master; its capabilities arrive through `business_entitlements`.

### payment_events
Audit trail for payment state changes. `id, business_id, payment_id, event_type, actor_account_id, data (jsonb), created_at.`

### platform_access_log (D-024)
Break-glass audit for PetAppro-side support/eng access across the tenant wall. `id, business_id, platform_account_id, reason, granted_by_account_id, tenant_consented (bool), scope (jsonb: which surfaces), fields_redacted (bool default true), started_at, expires_at, ended_at.`
- Financial + PII fields redacted by default; access is time-boxed and fully logged. This is the only sanctioned cross-tenant path.

## 7. RLS-relevant keys (summary)

Every table above: **RLS on**, filtered by `business_id` via `current_membership()`, which resolves through `current_base509_account_id()`. Client-owned rows (`clients`, `pets`, own `bookings`, own `payments`) additionally allow the owning client. Elevated writes (pricing, terms, invites, ownership, Stripe) restricted to owner/admin per the matrix; ownership/teardown owner-only and double-guarded in Edge Functions.

## 8. Decisions reflected in this schema

| Decision | Default | Schema effect |
|---|---|---|
| D-003 client+staff same business | No | `clients` vs `business_memberships` separate; unique per account per business |
| D-004 client at many businesses | Yes | Row per `(business_id, base509_account_id)` in `clients` |
| D-005 pet scope | Business-scoped | `pets.business_id` + `client_id` |
| D-006 meet-and-greet | Configurable | `businesses.settings.meet_greet_required`; `meet_greets` gate |
| D-007 payments | **Connect in MVP** | Server-owned Connect PaymentIntents/webhooks; manual methods are fallback only |
| D-008 SMS | Post-MVP | `notification_deliveries.channel` incl. sms, unused at MVP |
| D-009 terms | Template + editable | `business_terms_versions.body` structured |
| D-010 multi-location | Deferred | No `location_id` |
| D-013/D-014 invite codes | Proposed | `max_uses`, `expires_at`, `revoked_at` pre-provisioned |
| D-015 deposits | No | `deposit_required` default false |
| D-018 price override | Yes + audit | Override fields on `booking_price_breakdowns` |
| D-022 services | Multi | `business_services` rows; boarding+daycare enabled |
| D-020 subscription | Proposed | `businesses.plan_tier/seat_count/billing_period`; first user=owner, add-user role prompt |
| D-024 support role | Proposed | `platform_access_log`; redacted, time-boxed, audited |
| D-025 multi-currency | Proposed | `businesses.currency`; minor-unit money throughout |
| D-026 connect method | Proposed | Invite code + QR via `business_invite_codes`; no name search |
| D-031 re-auth/MFA | Decided | Server-verified re-auth on personal-info/financial changes; mandatory MFA for Owner/Admin only |
| D-042 subscription surface | Decided | Stripe Billing truth in Base509 master/web only; no native purchase/link/CTA |
| D-045 conflict groups | Final | Tenant-scoped conflict groups + occurrence-level transactional overlap enforcement |
| D-050 entitlements | Decided | Server-written `business_entitlements` projection; deny-by-default capability/limit checks |
| D-052 invoices | Decided | Immutable invoices/credits + locked per-tenant/year gapless sequence |

## 9. Open items before migration (Phase 5)

- Export Woof Wetreats migrations/RPCs/policies to cross-check field coverage (rebuild plan next steps #1).
- Confirm `capacity_rules` / `pricing_structure` jsonb shapes with `packages/pricing` and `packages/booking` (Sprint 1 output feeds this).
- Decide landing model (D-011) → affects whether `businesses.landing_content` is public-rendered.
- Finalize invite-code mechanics (D-013/D-014) → constraints on `business_invite_codes`.
- RLS policy performance pass on `current_membership()` before Sprint 3 sign-off.

## Next steps

1. Codex review alongside `technical_architecture.md`.
2. Lock jsonb shapes (`pricing_structure`, `capacity_rules`, `line_items`) as Sprint 1 packages stabilize.
3. Carry into Phase 4 specs — each spec cites the tables it touches and their RLS impact (no "TBD" on `business_id`).

---

## Capacity per service — ratified schema deltas (2026-08-17) — canonical: `docs/specs/capacity-model.md`

(Replaces the earlier appended "schema shape" draft — NOT a second schema definition. The canonical model lives in `capacity-model.md`; below are the concrete deltas to fold into `business_services`, `business_availability`, and `capacity_groups` during the CFG-1 build.)

- REMOVE any `default_capacity` field. Occupancy services (boarding, daycare) persist their limit as `capacity_config.service_limit` (REQUIRED, positive for bounded).
- Archetypes are presets over `capacity_model = bounded | unlimited` + versioned `capacity_config` — NOT a persisted pet-service enum.
- `capacity_groups` (tenant-scoped) with `resource_unit`; services reference `capacity_group_id` via tenant-composite FK `(business_id, capacity_group_id) -> capacity_groups(business_id, id)`. Required only when 2+ co-located services share a finite resource. Keep SEPARATE from scheduling `conflict_group_id`.
- Add ratified relational tables: `service_windows` (walking uses `fixed_window`, NOT `slot`), window assignments, zones, and the per-day override tables — `business_calendar_days`, `business_service_day_overrides`, `capacity_group_day_overrides`, `service_window_day_overrides` (+ `service_window_day_override_assignments`). Add `booking_occurrences.service_window_id`.
- Occupancy counting: `[arrival_service_date, departure_service_date)` half-open in business tz, for BOTH the service cap and the shared pool (Danny's date-based ruling; departure date not counted, arrivals count). See `capacity-model.md`.
- All tables carry `business_id`; tenant-composite FKs throughout. Enforcement (approval/auto-book) in one transactional server op; RLS + cross-tenant/concurrency tests required. Lands with CFG-1, not the waitlist migration.
- CORRECTION: the existing statement that walking uses `slot` is wrong — Walk Windows require `fixed_window`.
