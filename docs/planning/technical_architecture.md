# PetAppro Technical Architecture (Phase 1)

Multi-tenant foundation for PetAppro. This doc defines the tenant boundary, auth/membership model, RLS strategy, pricing authority, notification outbox, storage scoping, and the code/repo shape. It is the architecture half of Phase 1; the table-level detail lives in `data_model_draft.md`.

> **Status:** Phase 1 draft (updated 2026-07-16; web-portal auth/identity architecture ratified for D-031, D-034–D-038, D-041/D-042, D-050/D-051/D-056, and MKT-12). Working defaults from `docs/decisions/open_decisions.md` are cited by ID; any change from a default requires updating that log and this doc.
>
> **Canonical inputs:** `docs/planning/product_brief.md` (what/who), `docs/planning/user_roles_and_permissions.md` (permission matrix), `docs/planning/woof-wetreats-to-petappro-rebuild-plan.md` (data model + anti-patterns), `docs/roadmap/mvp_roadmap.md` (phase gates), `docs/decisions/open_decisions.md` (decisions).
>
> **Never cut (D-023):** multi-tenant boundary + `business_id`, RBAC/RLS, the single shared pricing package, and its regression tests.

---

## 0. Glossary

- **RLS (Row-Level Security)** — a Postgres feature that filters table rows per user at the database layer, so the DB only returns rows the caller is allowed to see. It is the wall between tenants; a bug in app code cannot leak another provider's data.
- **Tenant** — one provider business (`businesses.id`). All their data is scoped by `business_id`.
- **Membership** — a row saying "user X has role Y in business Z." Permissions come from these rows, never a hardcoded email.
- **Edge Function** — server-side code (runs on Supabase) used for the authoritative booking/pricing paths the client cannot be trusted with.
- **JWT** — the signed token proving who the logged-in user is on each request.
- **IAP** — Apple/Google in-app purchase (their ~30% billing rail). We avoid it by selling the provider subscription on the web.
- **PCSP** — Pet Care Service Provider (our customer: the boarding/daycare/walking business).

---

## 1. Architecture at a glance

PetAppro is one shared application and one shared Supabase (Postgres) database. Every business-specific row carries a `business_id`; isolation is enforced in the database with Row-Level Security (RLS), not just in application code. Permissions resolve from **membership in the active business** — never a global admin email (retires the Woof Wetreats `ADMIN_EMAIL` pattern).

```
                       ┌─────────────────────────────────────────┐
   Native (Expo/RN)    │  apps/mobile   — client + staff app      │  D-001
   ── auth, booking ──▶│                  (single codebase)       │
                       └───────────────┬──────────────────────────┘
                                       │  Supabase JS (anon key + user JWT)
   Web (Next.js)       ┌───────────────▼──────────────────────────┐
   ── config + billing▶│  apps/web      — public marketing routes + │  D-041/D-042
                       │  provider portal (config + Stripe Billing) │  (web checkout,
                       │  at app.<vertical-domain>                  │   never IAP)
                       └───────────────┬──────────────────────────┘
                                       │
          ┌────────────────────────────▼────────────────────────────┐
          │                     Supabase                              │
          │  Postgres + RLS   ·   Auth   ·   Storage   ·   Edge Fns   │
          │  packages/pricing (server authority)                      │
          └───────────────────────────────────────────────────────────┘
```

The native app is the operations/device-preferences surface. The authenticated provider portal is the configuration and SaaS-billing surface (D-041); public marketing routes remain unauthenticated. Both are clients of the same product backend and identity mapping, but they do not share session storage. The portal is not a second operational database or a second authorization model.

## 1a. Technology stack

The concrete "what we build on." Choices follow D-001 (native/Expo) and the existing Woof Wetreats Supabase foundation (reuse the backend paradigm, rebuild tenant-aware).

| Layer | Choice | Notes |
|---|---|---|
| **Language** | TypeScript end-to-end | App, web, packages, Edge Functions — one language, shared types |
| **Client + staff app** | **Expo / React Native** | The product; iOS + Android from one codebase (D-001) |
| **App build/release** | **EAS Build + EAS Submit** | Store binaries; ties to Apple/Google Org accounts (store clock) |
| **Marketing + provider portal** | **Next.js** | `apps/web`; public marketing plus authenticated config/billing portal at `app.<vertical-domain>` |
| **Web hosting** | **Vercel** | One Next.js deployment; allowlisted hostname routing separates public sites and per-vertical portals (D-056) |
| **Backend / DB** | **Supabase — Postgres 15** | One shared DB, RLS-enforced tenancy |
| **Auth** | **Supabase Auth** | PetAppro project auth for MVP; mapped to stable Base509 account ids |
| **Server logic** | **Supabase Edge Functions** (Deno/TS) | Server-authoritative booking + pricing paths |
| **File storage** | **Supabase Storage** | Tenant-prefixed paths, signed URLs |
| **Shared pricing** | `packages/pricing` (TS) | Single source of truth, server authority |
| **Subscription billing** | **Stripe Billing** (web) | Business → Base509 SaaS fee; not iOS IAP (D-001) |
| **Client↔business payments** | **Stripe Connect Standard in MVP**; manual fallback only | D-007 Option A |
| **Push / notifications** | Expo push (in-app + native); SMS deferred | D-008 |
| **Monorepo tooling** | npm/pnpm workspaces + Turborepo (TBD) | `apps/*`, `packages/*`, `supabase/` |
| **CI** | **GitHub Actions** | Typecheck + lint + test per PR (S1-6) |
| **Types** | `supabase gen types` → `packages/data` | Generated DB types shared app-wide (S1-5) |

Items marked TBD are non-blocking infrastructure choices (hosting, workspace tool) — decide at Sprint 1 setup; they don't affect the tenant model or schema.

## 2. Tenant model

**One shared database, strict `business_id` separation** (product principle 1; rebuild plan "Tenant and Access Model").

- **Tenant = `businesses.id`.** Every operational entity references exactly one business.
- **No per-customer database, no per-customer schema** at MVP — a single shared Postgres with RLS.
- **Single location per business** (D-010, Deferred): no `location_id` in MVP; leave room for an optional field later, do not model multi-location now.
- **The tenant boundary is the security boundary.** Cross-tenant reads are impossible at the database layer, not merely hidden in the UI.
- **Scales up to larger operators without redesign.** The shared Supabase backend, generated types, and shared packages mean additional client surfaces — a **tablet or web app for bigger multi-staff businesses** — can be added later on the *same* backend and RBAC (D-001 already allows internal/web tools anytime). Growth path is "add a surface," not "re-architect." Multi-location (D-010) is the one deferred piece; keep the seam.

### 2.1 Identity vs. tenancy

Supabase Auth proves the current login, but app data must not directly depend on raw `auth.uid()`. Each person gets a stable, product-agnostic `base509_account_id`; Supabase identities map to it through an identity table/helper. A person's *relationship* to a business is expressed by rows, not by their auth account:

- **Staff/owner/admin/manager** → a `business_memberships` row (`base509_account_id`, `business_id`, `role`).
- **Client** → a `clients` row (`base509_account_id`, `business_id`, profile fields).

This supports the multi-business scenarios in `user_roles_and_permissions.md` §8:
- Client at A **and** staff at B → allowed; two rows, two contexts (D-012, default Yes).
- Client at A **and** client at B → allowed; separate client profile per business (D-004, default Yes; pets re-entered per D-005).
- Client **and** staff at the **same** business → blocked at MVP (D-003, default No; enforce at invite time). *A person who is staff at a provider and also wants to be that provider's customer must use a separate email/account for the client side — document in the website FAQ.*

**Relationship lifecycle.** A client's tie to a provider is a **row with a state** (`active → ended`), not the account itself. Leaving a provider sets the relationship inactive (reversible, nothing deleted); joining a new provider adds a fresh relationship via connect (§3). One person, many provider relationships that come and go over time.

### 2.2 Active business context

Because a user may belong to multiple businesses, every authenticated session operates in **one active `business_id`**:

1. After login, resolve the user's memberships + client profiles.
2. If more than one business, show a business picker (or default to last-used).
3. All queries, permission checks, and views are scoped to the active `business_id`.
4. No view ever mixes rows from two businesses.

The active business is passed to the server on every request (JWT claim or explicit parameter validated against the user's memberships) so the server — not the client — decides what the user may see.

## 3. Auth & membership

- **Auth:** Supabase Auth in the PetAppro project for MVP. Apple, Google, and magic-link/passwordless are primary; email/password is fallback (D-031). The app maps `auth.uid()` to a stable `base509_account_id`; app tables and RLS use that stable id.
- **Step-up and MFA (D-031, Decided):** Owner/Admin must enroll in MFA; Manager/Staff/Client use risk-based step-up. Every personal-information change (email, phone, password, recovery factors, or equivalent identity/profile field) and every sensitive payment/financial action requires server-verified recent re-authentication. Biometric app lock is a local convenience gate, never a substitute for server verification.
- **Future shared identity seam:** A central Base509 IdP is deferred until app #2 or cross-product SSO is concrete. Do not hand-roll auth, and do not buy an external IdP for the Oct 1 MVP.
- **Onboarding via invite codes** (`user_roles_and_permissions.md` §9): a code is tied to exactly one `business_id` and a type (staff vs client). Redeeming a code creates the membership or client profile. Owner is created by the business-bootstrap flow (no code).
- **Roles:** `owner`, `admin`, `manager`, `staff`, `client` (D-032; roles doc §2). Hierarchy owner → admin → manager → staff; client is outside the staff hierarchy.
- **Code mechanics** (single-use vs reusable, expiration) are D-013/D-014 (Proposed) — build the `business_invite_codes` table to carry `max_uses`, `uses_count`, and `expires_at` now so the decision is a config change, not a migration.
- **Connecting to a provider (customer-initiated).** Customers never browse a directory. They connect only via a provider-issued **invite code** or **QR code** (a QR is just that code, scannable). **Search-by-business-name is intentionally never offered** (D-026). The picker shows only providers the user is already connected to.
- **PetAppro support / break-glass role (D-024).** A platform-side role for us (or outsourced help/eng) to assist a provider. It deliberately crosses the tenant wall, so: least-privilege, **financial + PII fields redacted by default**, every access **logged, audited, time-boxed, and ideally tenant-consented**. Not MVP-blocking, but the schema assumes it exists (audit table + field redaction) so it isn't retrofitted insecurely. This is the *only* sanctioned exception to "no cross-tenant access," and it must stay narrow.

### 3.1 One account across Expo and the provider portal (ratified)

Expo and `app.petappro.com` authenticate against the same PetAppro Supabase Auth issuer for MVP. They resolve the login through the same stable identity chain:

```text
Supabase session (issuer + auth subject)
    -> auth_identities (issuer, provider_subject)
    -> base509_accounts.id (= base509_account_id)
    -> business_memberships (base509_account_id, business_id, role, status)
    -> businesses.id (= active tenant in the PetAppro operational DB)
```

The login subject proves *who signed in*; `base509_account_id` is the durable person/account key; a membership proves *which provider business that account may operate* and with what role. Neither the portal nor Expo may derive authorization from email, OAuth provider, Stripe customer id, or raw `auth.uid()`.

The Base509 master is canonical for the stable account and cross-product identity/billing metadata. Each isolated product DB keeps the minimum local identity projection needed for local FK/RLS enforcement. In PetAppro, `current_base509_account_id()` resolves the local Supabase issuer+subject to that projected stable id. A local projection is not authority to merge or create Base509 accounts; only the trusted identity/bootstrap path may write it.

**Required schema correction before migrations:** an auth identity is unique by **`(issuer, provider_subject)`**, not merely `(provider, provider_subject)`. `issuer` identifies the Supabase project/auth tenant (or future external IdP); the provider field records the login method such as Apple, Google, or email. A UUID from PetAppro Supabase and a UUID from a future HairAppro Supabase are unrelated even if they happen to have the same text value. Never merge accounts by matching email alone—Apple relay addresses, changed addresses, and recycled addresses make that unsafe. Cross-issuer linking requires proof of control of both authenticated identities or an approved account-recovery flow and must be audited.

### 3.2 Next.js SSR web-session boundary (ratified)

The portal uses the current Supabase SSR integration with PKCE and cookie-backed sessions. Create a Supabase server client per request; never keep a user client/session in module scope. Authenticated routes are dynamic/private and must not be ISR/CDN cached; any response that refreshes or sets an auth cookie carries `Cache-Control: private, no-store`. Server-rendered content and every mutation re-derive the account from the validated session and then run membership/RBAC/RLS checks.

**Cookie recommendation: host-only `app.petappro.com`.** Omit the cookie `Domain` attribute; use `Path=/`, `Secure`, and `SameSite=Lax` in production, with a product-specific cookie name. Do **not** set `Domain=.petappro.com`. The broader cookie would expose the portal session to every current and future PetAppro subdomain and enlarge the blast radius of a marketing-site compromise, DNS/deployment mistake, or subdomain takeover. The public marketing site does not need the refresh/access tokens to render or sell the product.

The public `petappro.com` site therefore **does not participate in auth**: no portal session cookie, no authenticated user rendering, and no session refresh. Its sign-in control is a normal navigation to `https://app.petappro.com/sign-in`; its public subscribe flow may arrive at the portal, authenticate there, and then start server-created Stripe Checkout. Do not pass tokens through query parameters or local storage. Marketing and portal may share the same Next.js repository/deployment, but hostname routing, middleware, caching, CSP, and cookie policy treat them as separate security origins.

Because Supabase's browser SSR client needs to maintain its token cookies, cookie scope is not a substitute for XSS/CSRF defenses. Portal mutations use same-origin POSTs/server actions, validate `Origin`/`Host` and an anti-CSRF token where the framework does not provide equivalent protection, and apply a strict CSP with no untrusted script execution. OAuth/magic-link redirect allowlists contain exact portal callback hosts, not wildcard parent domains.

Primary implementation references: [Supabase SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa).

### 3.3 App-to-portal SSO/session behavior (ratified)

**Recommendation: shared identity, independent sessions.** Signing into Expo must not silently sign a browser into the portal, and signing into the portal must not silently mint or transfer an Expo session. Expo keeps its refresh token in the OS secure-store/keychain boundary; the portal keeps its own host-only browser cookie. Both sessions resolve to the same `base509_account_id`, so users see the same businesses and permissions after authenticating, but no refresh/access token crosses surface boundaries.

Automatic handoff would save one sign-in, but it creates bearer-token transfer/deep-link interception risk, makes shared/public computers dangerous, complicates logout/revocation, and couples native release behavior to web session mechanics. Passwordless Apple/Google/magic-link keeps the independent sign-in low-friction. A later explicit, short-lived QR/device-authorization flow may be considered, but only as a one-time, audience-bound, replay-proof authorization code exchanged server-side—never a token embedded in a URL. It is not an MVP requirement.

Logout defaults to the current device/session. Security settings also provide audited **sign out all sessions** and identity-revocation flows. D-031 recent re-auth and AAL checks are evaluated on the session performing the sensitive action; an MFA event in one surface does not automatically elevate the other surface's session.

### 3.4 Product and active-business resolution (ratified)

The server resolves context in two independent stages:

1. **Product/vertical from a trusted hostname registry.** An allowlisted deployment map resolves `app.petappro.com -> product_key=petappro -> PetAppro auth/config/operational-DB binding`. Future `app.hairappro.com -> product_key=hairappro -> HairAppro binding` uses the same code path. Reject unknown, malformed, forwarded, or unconfigured hosts; do not accept `product_key`, Supabase URL, project id, or database target from client input. Only a trusted proxy configuration may supply a forwarded host.
2. **Business from the authenticated account's local product membership.** A route such as `/b/<opaque-slug>/...` may express the requested context, but the server resolves that slug to `business_id` inside the already-selected product DB and proves an active `business_memberships` row for the current `base509_account_id`. A last-used-business cookie is a UX hint only. Every query/mutation still scopes by the server-resolved `business_id`, and RLS independently enforces it.

The Base509 master needs a non-client-writable `products` registry and `product_businesses` mapping such as `(id, product_id, operational_business_id, status)`. `operational_business_id` is an opaque locator interpreted only by the product adapter; it is not permission to query that product. No PetAppro operational row gains an `app_id`. PetAppro runtime credentials can address only the PetAppro project, so even a forged HairAppro id cannot make `app.petappro.com` read HairAppro operational data. Base509 support access remains a separate audited break-glass path, never a portal session capability.

Nothing in the identity model hard-codes PetAppro: product keys, domains, auth issuers, OAuth callback hosts, cookie names, branding, Stripe price/catalogue ids, and product adapters are registry/config data. Pet-specific roles and records remain correctly isolated in the PetAppro DB; they do not leak into `base509_accounts`.

### 3.5 Portal entitlement enforcement (D-050 applied to D-041)

Portal reads use the server-resolved `business_entitlements` projection in §4.1. Theme selection and seat changes are typed server mutations, not direct client table writes:

- A theme picker receives the effective `theme_allowlist`; selection submits a stable theme key to an Owner/Admin-authorized server action/RPC, which re-reads current entitlements and rejects a disallowed key. The database `WITH CHECK`/RPC invariant prevents a Solo business from storing a Team-only theme even if the browser request is tampered with.
- Invite acceptance, member activation, reactivation, and seat creation all call the same serialized seat-limit transaction described in §4.1. UI counts are informational only; concurrency cannot exceed the server limit.
- Billing/theme/team mutations require normal membership/RBAC plus D-031 recent re-auth/MFA where sensitive. Denials are stable, tenant-safe errors and audited. Service-role/admin tooling calls the same entitlement invariants rather than bypassing them.

Theme-to-tier policy remains Base509 catalogue data (D-020/D-040); the portal never contains a parallel `if tier === ...` map. A product decision that changes which themes belong to a tier updates the versioned catalogue/projection, not portal authorization code.

### 3.6 Stripe Billing identity (ratified)

Stripe Billing models the **provider business subscription**, not the human login and not client-to-provider Connect payments. The Base509 master owns the authoritative mapping:

```text
base509_account_id (current billing owner/payer)
    -> billing_accounts
    -> product_business_id -> (product_id, operational business_id)
    -> stripe_customer_id
    -> stripe_subscription_id -> Stripe price/product -> entitlement catalogue version
```

For MVP, one billable product business has one active billing account and one Stripe Customer. The concrete master mapping is `billing_accounts(id, billing_owner_account_id -> base509_accounts.id, product_business_id UNIQUE, stripe_customer_id UNIQUE, status)` plus `billing_subscriptions(billing_account_id, stripe_subscription_id UNIQUE, stripe_price_id, status, period/grace fields)`. `product_businesses` supplies the product id and opaque PetAppro `business_id` locator. Ownership transfer updates the authorized billing owner without changing tenant identity or trusting the Customer email. Stripe Customer/Subscription metadata repeats the Base509 internal ids for reconciliation/support, and Base509 stores the Stripe ids in return; metadata is not the authorization source. Stripe recommends this bidirectional internal-id mapping in its [Customer guidance](https://docs.stripe.com/billing/customer).

Verified, idempotent Stripe webhooks update subscription truth; the entitlement resolver projects capabilities to the selected product DB. Checkout, Customer Portal, plan change, cancellation, invoices, and payment-method management exist only on the authenticated web portal. Expo contains no SaaS price catalogue, Checkout/Customer Portal URL, purchase/upgrade control, external purchase link, or copy directing a user to buy (D-042). Server-side cancellation performed as part of account deletion is lifecycle cleanup, not an in-app purchase path.

### 3.7 Account deletion across master and product stores (MKT-12; launch gate)

Apple 5.1.1(v) requires an in-app path that initiates deletion of the entire account, not merely deactivation. PetAppro Account Settings must expose a plainly labeled **Delete account** action without requiring a support email/call. It may also offer narrower actions such as leave a business or close only a PetAppro relationship, but those do not replace whole-account deletion. The confirmation explains that the stable Base509 account and every linked product relationship are affected, then discloses every affected product/business, subscription consequence, retained-record category and retention reason, expected completion time, and export option. See Apple's current [account-deletion guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app).

Deletion is an idempotent, auditable server-side saga coordinated by the Base509 master:

1. **Inventory and step-up.** Require a fresh D-031 re-authentication; Owner/Admin satisfy MFA. Resolve the account from the session, enumerate all linked auth identities, products, client relationships, memberships, owned businesses, and active subscriptions server-side, and freeze conflicting ownership/billing mutations. The client never supplies the deletion target account id.
2. **Resolve owned businesses before identity destruction.** If other members will keep a business, the owner must transfer ownership to an eligible re-authenticated successor; then only the departing person's membership/personal account is removed. If the user chooses to close a business (or is its sole eligible owner), mark the tenant `closing`, block new bookings/invites/charges, offer a time-limited export, cancel the Base509-controlled Stripe Billing subscription immediately, and start tenant closure. Account deletion cannot be denied merely to preserve a subscription; no further SaaS renewal may occur after the immediate deletion choice.
3. **Separate the person's account from tenant-custody records.** End the deleting person's memberships/client relationships and erase or anonymize their personal profile, device tokens, private uploads, and user-authored content unless a documented legal/contractual retention duty applies. Do not cascade-delete a provider's clients' Base509 accounts or their relationships with other businesses. When a provider tenant closes, delete that tenant's operational copies on the published schedule; retain only records legally required for tax, payment dispute, fraud/security, or other stated obligations, minimized and access-restricted. Immutable invoices/payment/audit rows use a tombstoned actor reference or pseudonymous retained key so FK/audit integrity never forces a live login identity to remain.
4. **Revoke identity and sessions.** Revoke every session/refresh token and enrolled factor; revoke Sign in with Apple tokens through Apple's REST API when linked; unlink OAuth identities; delete the per-app Supabase Auth user(s); remove identity projections; scrub master account PII. Keep only a non-login deletion tombstone and narrowly necessary compliance/audit fields with a retention deadline. Email completion confirmation before removing the last reachable address, or send it to a separately confirmed delivery address.
5. **Verify every store.** Durable deletion jobs fan out to each isolated product DB and storage bucket with idempotency keys, retries, per-store completion state, alerts, and a reconciliation report. The user sees `requested -> processing -> completed` (or a precise actionable failure), and support can inspect status without restoring access. A product-store outage may delay completion within the disclosed/legal window but must not reactivate login or billing.

The retention/deletion schedule, provider-vs-Base509 data-controller responsibilities, export format, successor eligibility, refund policy, and deletion SLA require counsel/product sign-off before implementation. That policy work does not change the technical rule: account access and SaaS renewal stop promptly, other people's master accounts survive, and legally retained tenant records are minimized rather than kept as an active account.

**Launch gate:** automated tests must cover client-only deletion; staff deletion; owner transfer; sole-owner tenant closure; active subscription cancellation; shared account across two products; Sign in with Apple revocation; partial product-store outage/retry; session revocation; retained immutable financial/audit rows; and proof that deleting one tenant/account cannot delete or expose another tenant's data.

### 3.8 HairAppro no-rework checklist

Before portal implementation is considered build-ready, the shared code must keep these seams configurable: exact hostname-to-product registry; product-specific cookie name with host-only scope; auth `issuer + subject`; exact OAuth/magic-link callback allowlists; Base509 `product_businesses`; per-product operational adapter/credentials; Stripe product/price catalogue keys; branding/token bundle; and deletion fan-out by product adapter. The first future vertical may require deploying its isolated Supabase project and registering its issuer/adapter, but must not require changing PetAppro tables, widening cookies, adding `app_id` to operational rows, or rewriting portal authorization.

**Rework warning:** launching HairAppro with separate per-app Supabase Auth while promising one cross-product Base509 login requires the central identity/linking path to be production-ready. D-036 intentionally defers a central external IdP for PetAppro MVP; app #2 is the trigger to complete that extraction or adopt a packaged IdP. The `(issuer, subject) -> base509_account_id` contract above makes that an infrastructure migration, not a domain/RLS redesign. Shipping only `provider_subject` or email-based linking now would force a dangerous identity rewrite later and is rejected.

## 4. Access control & RLS strategy

RLS is the enforcement layer for the permission matrix in `user_roles_and_permissions.md` §10. UI hiding is convenience; the database is authority (product principle 3).

**Core helpers (security-definer functions):** `current_base509_account_id()` maps the caller's Supabase Auth subject to the stable Base509 account id. `current_membership(business_id)` returns that account's role for a business (or null). RLS policies call these helpers rather than embedding email checks or raw `auth.uid()` predicates.

**Policy shape per operational table:**
- **Read:** row visible only if the caller has an active provider-side membership (owner/admin/manager/staff) in `row.business_id`, or — for client-owned rows — is the owning client in that business.
- **Write:** allowed only if the caller's role in `row.business_id` permits the action per the matrix (e.g., pricing edits → owner/admin; staff notes → owner/admin/manager/staff; own pets → owning client).
- **Elevated actions** (ownership transfer, business delete, Stripe connect, admin promotion) are owner-only and additionally guarded in Edge Functions/RPCs, not just RLS (roles doc §12).

**Non-negotiables (D-023 foundation):**
- Every business-specific table has RLS enabled and a `business_id` column.
- App relationships reference `base509_account_id`; raw `auth.uid()` stays inside auth mapping/helpers only.
- No policy relies on a global email or a hardcoded id (`pricing_rates.id = 1`, `ADMIN_EMAIL` — explicitly retired, rebuild plan "What Must Be Rebuilt").
- A dedicated **RLS regression test suite** proves no cross-tenant read/write (Sprint 3 exit; Aug 15 go/no-go).

### 4.1 Tier entitlements and server enforcement (D-050 — ratified)

PetAppro ships as one binary (D-030/D-033). A provider's subscription tier is not compiled into the app and is never trusted from client state, JWT custom metadata, a locally cached value, or a client-supplied tier name. The server resolves an **effective entitlement set** for the active `business_id`; the client only renders that result.

#### Authority and data placement

- **Base509 master is the commercial source of truth** (D-034/D-037). It owns the Base509 account/customer, Stripe Billing subscription reference and status, product identifier, tier/price mapping, subscription period, grace/cancellation state, and the versioned product entitlement catalogue. Stripe webhooks update this layer; neither the native app nor the PetAppro anon/authenticated role may write it.
- **PetAppro's operational DB owns an enforcement projection**, not a second billing system. A tenant-scoped `business_entitlements` projection (or equivalent) records `business_id`, the resolved tier key, explicit capability values/limits, source subscription/version, effective/expiry timestamps, projection version, and last successful sync time. It contains no card data and no authority to alter billing. Only a narrowly privileged internal sync path may write it; ordinary app roles receive read-only access to the effective result for businesses to which they belong.
- **Why the projection is required:** PetAppro RLS and transactional RPCs must make a local, deterministic authorization decision. They must not depend on a live cross-project request to Base509 or Stripe, and no service-role credential may be shipped to the client. This preserves the D-034 per-app isolation boundary while giving RLS a local entitlement predicate.
- Entitlements are **capability data, not scattered tier conditionals**. Server checks use stable keys/limits such as `booking_payments`, `seat_limit`, `theme_allowlist`, `gps`, `messaging`, `sms`, and `client_limit`; they do not embed assumptions such as `tier >= 'duo'`. Tier-to-capability mapping remains versioned in the Base509 catalogue and is projected explicitly.

#### Resolution and propagation

1. Stripe Billing events are verified and applied idempotently in the Base509 master. A Base509 resolver converts the current subscription state into a versioned entitlement set for the PetAppro business.
2. Base509 sends the resolved set through an authenticated, signed, replay-resistant internal sync endpoint. PetAppro upserts the projection transactionally only when the incoming source version is newer; duplicate and out-of-order events are harmless. Every change records an operator/security audit event.
3. At login, app launch, foreground/resume, active-business switch, and after returning from web billing, the app calls an authenticated PetAppro `get_effective_entitlements(active_business_id)` RPC/API. The server first proves the caller belongs to that business, then returns the server-resolved capability set plus a monotonic version and expiry/freshness metadata.
4. The client subscribes to a tenant-scoped entitlement-change signal (Supabase Realtime or push invalidation) and immediately refetches. It also refetches on mutation authorization failures. The client may cache the last result only for rendering/offline UX; cached data never authorizes a server action.
5. A tier change therefore requires **no new binary or app-store release**. The Stripe webhook → Base509 resolution → PetAppro projection path changes server enforcement immediately, and the invalidation/refetch changes the visible UI. The web billing completion flow may request an idempotent reconciliation, but polling or the browser redirect is not the source of truth.

“Instant” means the entitlement change takes effect through this event-driven server path without an app release or user sign-out. The propagation service must expose latency/error metrics, retry with a durable queue, and support reconciliation against Base509/Stripe so a missed webhook cannot silently leave a permanent stale tier.

#### Mandatory enforcement boundary

UI hiding or an “upgrade to unlock” treatment is presentation only. Every gated operation must pass both normal tenant/RBAC authorization and an entitlement check using the **current PetAppro server projection**:

- **API/RPC/Edge Function:** all sensitive mutations enter through typed server endpoints. The endpoint derives `business_id` from the authorized resource/active membership, never trusts a client-supplied tier or entitlement, calls a shared `require_entitlement(business_id, capability, requested_amount?)` helper, and returns a stable `ENTITLEMENT_REQUIRED` or `LIMIT_EXCEEDED` error without leaking another tenant's state.
- **RLS/database:** gated tables and direct-write paths use local entitlement helper predicates in their `USING` and `WITH CHECK` policies. Where a limit requires counting or external effects, direct client writes are denied and a transactional security-definer RPC/Edge Function is the sole write path. The function must set a safe search path, validate membership/role, validate entitlement, and scope every query by `business_id`.
- **External side effects:** payment creation/capture, GPS session creation, message delivery, and SMS dispatch check entitlement immediately before creating the provider-side job or calling the vendor. A queued job rechecks entitlement at execution time; an entitlement revoked after enqueue must not produce a new paid/gated side effect.
- **Read exposure:** RLS also gates higher-tier stored data where the capability promises restricted access. Downgrades never delete provider data; they disable new gated actions and expose only the explicitly defined read/export grace behavior.

This applies at minimum to in-app client→provider payments (Duo+), additional team seats, themes beyond the default Brandy Blue theme, GPS, in-app messaging, and SMS. Each capability requires negative tests proving a lower-tier caller with a valid login and tampered request is refused at both endpoint and database policy boundaries. Cross-tenant RLS tests remain separate and mandatory.

#### Starter client cap and other numeric limits

Starter has `client_limit = 5`; paid tiers resolve to no client limit. “Client” for this limit means an active client relationship for the business, not pets, archived relationships, invitations, or a person's relationships with another business.

- Creating, importing, accepting an invite for, or reactivating a client must use one server transaction. The transaction serializes on the `business_id` (row/advisory lock), reads the effective entitlement locally, counts active clients for that same business, and inserts/reactivates only when the resulting count is within the limit. A client-side count followed by an insert is forbidden because concurrent requests could exceed five.
- RLS denies direct client inserts/state changes that could bypass the capped RPC. Bulk import and operator tooling call the same invariant-enforcing service; service-role access is not a bypass.
- A paid-to-Starter downgrade must not delete or silently reassign client data. The normal downgrade flow requires the owner to archive down to five before the downgrade completes. If cancellation, payment failure, or an operator action makes Starter effective while more than five relationships remain, the business enters an explicit `over_limit` restriction: existing records remain readable/exportable, but no new/reactivated clients or new bookings for over-limit relationships are accepted until the owner archives down to five or restores a paid tier. This exceptional state is monitored and cannot be treated as unlimited Starter access.
- Seat limits and any future numeric entitlement follow the same atomic, server-side pattern; never enforce them only in UI counters.

#### Fail-safe and outage behavior

- **Missing, invalid, expired, unverifiable, or failed entitlement resolution evaluates to the lowest safe capability set**: Starter, with default Brandy Blue theme only, no paid booking-payment invocation, no extra seats, no GPS, no messaging, and no SMS. Unknown capability keys are denied. The system never guesses Solo or any higher tier.
- The last projection may be displayed as stale for offline/read-only continuity only within an explicitly defined server grace window. It must not grant a new gated mutation after its server validity/expiry window. Base509/Stripe unavailability therefore fails closed for premium actions while preserving safe reads and local drafts where possible.
- Entitlement-fetch/sync failures, stale projections, downgrade conflicts, and denied gated calls are structured, tenant-safe audit/monitoring events. Alerts must distinguish expected upgrade prompts from resolver/sync outages.

**Architecture verdict:** D-050 is ratified with the Base509-authority/PetAppro-enforcement-projection model above. Build is gated on additive tenant-scoped schema, generated types, shared server entitlement helpers, endpoint/RLS negative tests for every gated capability, atomic limit tests (including concurrency), webhook idempotency/out-of-order tests, and fail-closed outage tests.

## 5. Booking & pricing authority

The single shared pricing package is the crown jewel (Sprint 1; never cut).

- **`packages/pricing`** — one source of truth for price computation, consumed by the native app (preview), the server booking path (authority), and any Edge Function. No pricing logic is duplicated across layers (rebuild plan "Pricing Model").
- **Client UI = preview only.** The client sees an estimate; the **server recomputes and is authoritative** on booking create/edit (product principle 3).
- **Stored breakdowns.** Final total + line-item breakdown are persisted on the booking (`booking_price_breakdowns`) so a charge is always auditable and reproducible.
- **Manual overrides** by staff/owner are allowed with an audit trail (D-018, default Yes): store original computed price, override value, actor, timestamp.
- **Server-authoritative booking creation** and **server-side blocked-date enforcement** carry forward from Woof Wetreats (rebuild plan "What to Preserve").
- **Regression tests first** (S1-2/S1-3): the extraction is test-driven. *(The "stale 15-night-cap test" was a **phantom** — verified 2026-07-31 (Codex + Claude Code): no such cap or test exists in `packages/pricing`; it was a mis-transcription of Woof's 14-night self-service cap, never ported. Nothing to fix; S1-3 satisfied by clean extraction.)*
- **What "single shared" means.** One pricing *engine* (`packages/pricing`) reused everywhere — **not** one universal price. Each provider's own rates live in `business_service_pricing`, tethered by `business_id`. This engine computes what a provider's customer pays the provider; it is **not** our SaaS subscription price (that's Stripe Billing, D-020).
- **Multi-currency (D-025).** Money is stored as integer minor units + a per-business `currency`, so providers in the US / Canada / EU / AU price in their own currency. Tax (GST/VAT) and our subscription currency are later GTM items; the schema won't block them.

## 6. Services & pricing configurability

Do not hardcode boarding/daycare into the foundation (D-022, default: schema supports many services; MVP ships boarding + daycare).

- Services are **rows**, not enum branches: `business_services` defines what a business offers; `business_service_pricing` defines its rates.
- Each service can carry its own duration/date rules, capacity, pricing structure, required fields, cancellation policy, visibility, and deposit requirement (rebuild plan "Services Model").
- MVP implements boarding + daycare only, but the schema must not trap the product there (product principle 6).
- **Providers control what their customers see.** Each provider toggles which services/options are enabled and visible, plus their landing content; customers only see what that provider exposes.
- **North-star (not MVP): a service-builder.** Services-as-rows + JSON rules is deliberately the foundation for a future "service builder" that could adapt the app to other industries (stylists, cleaners) with variances like travel fees, recurring cadence, and add-ons tethered to a service. **We do not build the builder now** — ship PCSP-specific (boarding/daycare), then explore the builder ~60–90 days post-launch. Recurring cadence (e.g. weekly walks) is the variance most likely to surface first; keep `pricing_structure` and an add-ons concept from trapping it.

## 7. Notifications (tenant-aware outbox)

Replaces global Pushover-style alerts (rebuild plan "Notifications"; `docs/specs/platform_notification_and_activity_plan.md`).

1. A business event occurs → write one row to `notifications` (scoped by `business_id`, addressed to a user/role).
2. Fan out to `notification_deliveries` per enabled channel.
3. Deliver via **in-app** (MVP), **native push** (MVP-capable via Expo), and **SMS/email** where enabled.
4. Store delivery status + errors.

**MVP scope (D-008):** in-app notification center is in; **SMS is deferred** to a post-MVP add-on; email is for paper trail (receipts, confirmations, terms records), not urgency. Notifications reach only users with a relationship to the relevant `business_id`.

**SMS positioning (D-008).** When added, SMS is a **paid add-on / top-tier subscription feature** (revenue, tied to D-020 tiers), pulled forward only if we're ahead of schedule. **SMS/MMS media (images) are never persisted on our servers/DB** — handled by the messaging provider (e.g. Twilio) or served as short-TTL signed links only.

## 8. Payments

Payments stay **between the client and the business**; PetAppro is software, not merchant/broker/employer (product brief §7).

- **Two independent money flows — do not conflate:**
  1. **Client → Business** for pet care: **Stripe Connect Standard ships in MVP** (D-007 Option A; D-015 no deposits). Each provider owns/connects its Stripe account; booking payments flow to that provider, Stripe fees are provider-side, and PetAppro takes no commission (D-029). The server recomputes the authoritative booking total, creates/confirms the PaymentIntent against the tenant's validated Connect account, verifies signed Stripe webhooks idempotently, and derives payment state from server events rather than client success screens. Manual cash/check/Venmo/Zelle/other tracking remains a safety-net fallback, not the planned MVP rail.
  2. **Business → Base509** for the PetAppro SaaS subscription: **Stripe Billing on the web only** (`apps/web`) (D-042). The native binaries contain no subscription purchase, upgrade checkout, external purchase link, or CTA that routes users to buy the SaaS tier. The resulting subscription changes propagate through the D-050 server entitlement path; the client only renders the resolved capabilities.
- Connect onboarding, payout/account changes, refunds, and other financial mutations are Owner-only where specified by the roles matrix, require D-031 recent re-authentication/MFA, run through typed server functions, and are audited. No Stripe secret or service-role credential enters either client bundle.
- Manual payment confirmation defaults to Owner/Admin (roles doc §12; Staff optional, open).

## 9. Storage

- Pet photos and business assets are **tenant-prefixed** (`business_id/...`), replacing Woof Wetreats paths keyed only by auth user + dog id (rebuild plan "What Must Be Rebuilt").
- Private files served via **signed URLs** (preserve from Woof Wetreats).
- Storage RLS mirrors table RLS: access requires a relationship to the owning `business_id`.

## 10. Repo & deploy shape

Monorepo (Sprint 1, S1-1). Matches D-001 and the roadmap's Phase→calendar mapping.

```
apps/
  mobile/      Expo / React Native — client + staff product
  web/         Next.js — public marketing + authenticated provider config/billing portal
packages/
  pricing/     single source of truth (server-authoritative)   ← Sprint 1 crown jewel
  booking/     validation + availability rules                 ← S1-4
  data/        generated Supabase types + shared query helpers  ← S1-5
supabase/
  migrations/  tenant-scoped schema + RLS policies
  functions/   Edge Functions (server-authoritative paths)
```

- **CI (S1-6):** typecheck + lint + test on every PR, enforced before the pricing refactor lands.
- **Local-first (product principle 9):** implement and test locally; no production deploy without Danny's approval.
- **Woof Wetreats stays read-only reference** — never mutated into PetAppro; data imported into one initial tenant only after the model is stable (rebuild plan "Migration/Reference Strategy").

## 11. Decisions this architecture depends on

| Decision | Status | Architectural effect |
|---|---|---|
| D-001/D-041 surfaces | **Decided — ratified here** | Native/Expo = operations/device prefs; Next.js portal = provider config + web-only subscription billing |
| D-030/D-033 app model | **Decided** | One shared binary; role and tenant presentation resolve at runtime |
| D-034–D-038 account/auth boundary | **Decided** | Base509 master owns billing/product entitlement; PetAppro keeps a tenant-scoped enforcement projection tied to stable account identity |
| D-050 entitlements | **Decided — ratified here** | Server-resolved capabilities; API/RPC/Edge Function + RLS enforcement; atomic Starter client cap; fail to lowest safe tier |
| D-023 delivery | **Decided** | Foundation is gate-driven (tenant boundary, RBAC/RLS, pricing pkg + tests never cut) |
| D-003 client+staff same business | Default No | Enforce at invite; no dual membership one business |
| D-004 client at multiple businesses | Default Yes | Separate client profile per business |
| D-005 pet scope | Default Business-scoped | `pets.business_id`; re-entry at second business |
| D-006 meet-and-greet | Default Configurable | Per-business on/off gate before first booking |
| D-007 payments | **Decided — Option A** | Stripe Connect Standard in MVP; manual tracking is safety-net fallback only |
| D-031 step-up/MFA | **Decided** | Re-auth for every personal-info and sensitive financial change; mandatory MFA for Owner/Admin only |
| D-042 SaaS billing surface | **Decided** | Provider subscription sold/managed on web only; no native purchase/link/CTA |
| D-051/D-056 multi-vertical portal | **Decided — ratified here** | Hostname registry selects product adapter/theme; host-only cookies; no `app_id` on operational rows |
| MKT-12 / Apple 5.1.1(v) | **Required — ratified here** | In-app whole-account deletion initiates an idempotent master/per-product deletion saga and cancels active SaaS billing |
| D-008 SMS | Default post-MVP | In-app + push in MVP; SMS deferred |
| D-010 multi-location | Deferred | Single location; no `location_id` in MVP |
| D-013/D-014 invite codes | Proposed | Carry `max_uses`/`expires_at` columns now |
| D-018 price override | Default Yes | Override allowed with audit trail |
| D-022/D-054 services | **Decided — generic instances** | Five-axis service rows; launch presets boarding+daycare+walking; Crew+ GPS at launch; provider-defined types must not require schema/API branches |
| D-024 support/break-glass role | **New — Proposed** | Platform-side assist; redacted, audited, time-boxed; schema assumes it |
| D-025 multi-currency | **New — Proposed** | Per-business currency; minor-unit money; tax deferred |
| D-026 connect method | **New — Proposed** | Invite code + QR only; never search-by-name |

## 12. Phase 1 exit criteria (from mvp_roadmap)

- [ ] Every business-specific entity has a defined tenant boundary (`business_id`).
- [ ] Permission checks are defined against memberships, not global emails.
- [ ] Booking, pricing, terms stamping, and notification flows are tenant-aware (written flows / sequence).
- [ ] Known Woof Wetreats anti-patterns explicitly marked "do not copy" (see §4, §7, §9).
- [ ] Architecture review completed (Codex) with no blocking gaps.
- [ ] Any Working Default that changes table design or RLS shape is flagged with its decision ID (§11).

## 13. Open items to resolve before / during build

- **D-011 / landing model** (public landing + invite portal vs invite-only) — affects `apps/web` routes and client acquisition; does not change the tenant model.
- **D-013/D-014 invite code mechanics** — finalize before the invite-code spec (Phase 2); columns pre-provisioned.
- **RLS helper performance** — validate `current_membership()` in policies against realistic row counts before Sprint 3 sign-off.
- **Context-switch transport** — confirm active `business_id` is delivered as a validated JWT claim vs. per-request param before auth build.

## Next steps

1. Codex architecture review of this doc against the never-cut foundation.
2. Pair with `data_model_draft.md` for table-level detail and RLS column keys.
3. Feed §5–§6 into the Sprint 1 `packages/pricing` extraction (already in flight).
