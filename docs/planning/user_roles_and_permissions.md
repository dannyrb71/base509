# PetAppro User Roles and Permissions

MVP role and permission model for a multi-tenant pet care SaaS.

**Related docs:** `docs/prompts/cursor_project_instructions.md`, `docs/planning/product_brief.md`, `docs/roadmap/mvp_roadmap.md`, `docs/planning/woof-wetreats-to-petappro-rebuild-plan.md`

**Status:** Phase 0 planning — product behavior defined; implementation (RLS, API checks) comes in Phase 1+.

---

## 1. Purpose of This Doc

Define who can do what in PetAppro at MVP, scoped to a single business (`business_id`).

This document:

- Names the four MVP roles and what each is for
- Describes invite-code onboarding by role
- Provides a permission matrix for common actions
- States tenant rules and elevated-permission requirements
- Captures open decisions for architecture and specs

This document does **not** define database tables, RLS policies, or API routes. Those specs must implement the behavior described here.

---

## 2. Role Summary Table

| Role | Relationship to business | Primary surface | MVP intent |
|---|---|---|---|
| **Owner** | Creates the business; holds ownership | Business setup, configuration, operations | Full control of one business, including ownership and billing-related settings |
| **Admin** | Invited or promoted staff with management access | Same operational areas as owner | Run the business day-to-day without ownership transfer or account deletion |
| **Staff** | Invited team member | Daily schedule, households, bookings | Execute pet care operations; limited access to business configuration |
| **Client** | Pet owner linked to one business | Client dashboard, booking, profile | Manage own household, pets, and bookings within one business |

**Permission source:** Business membership or client relationship for the **active business context** — never a global admin email.

**Role hierarchy (elevated → limited):** Owner → Admin → Staff → Client (clients are not in the staff hierarchy).

---

## 3. Owner Role

### Who

The person who creates the PetAppro business account and is legally responsible for subscribing to the platform and configuring the business.

### Responsibilities

- Complete initial business setup
- Configure services, pricing, availability, branding, and terms
- Invite and remove admins and staff
- Generate and revoke client and staff invite codes
- Manage meet-and-greet rules and client blocked status
- Oversee bookings, schedule, payments, and notifications
- Connect payment tools (e.g., Stripe Connect) if enabled
- Manage business notification preferences

### MVP permissions

Owners have **all admin and staff capabilities** for their business, plus ownership-only actions (see Section 12).

### Constraints

- Owners can only act within businesses where they hold an `owner` membership
- Owners cannot access another business's data without a membership there
- Owners do not have platform-wide (PetAppro operator) powers in MVP

---

## 4. Admin Role

### Who

A trusted manager delegated by the owner — co-owner, office manager, or lead sitter with configuration access.

### Responsibilities

Same operational responsibilities as the owner except ownership-only actions:

- Business configuration (services, pricing, availability, branding, terms)
- Staff and client invite management
- Meet-and-greet and blocked-client management
- Booking creation, edits, cancellations, and price overrides
- Manual payment recording and confirmation
- Landing page and notification settings
- View all clients, pets, bookings, and staff notes for the business

### MVP permissions

Admins match owners on **day-to-day and configuration** actions. They cannot perform ownership-only actions (Section 12).

### Constraints

- At least one owner must remain on the business
- Admins cannot remove the last owner
- Admin role is **optional at MVP** — a solo owner may be the only management user initially

---

## 5. Staff Role

### Who

Sitters, handlers, or front-desk team members who need operational access but should not change core business configuration.

### Responsibilities

- View daily schedule and household directory for the business
- Open household/client detail (profile, pets, care notes, reservations, meet-and-greet status)
- Create and edit bookings on behalf of clients
- Cancel bookings when permitted by business rules
- Add and view **staff-only notes** (not visible to clients)
- View client-visible care notes and pet photos
- Manage meet-and-greet scheduling and completion flows
- Block/unblock clients when authorized by business policy (see open decision)
- View in-app notifications relevant to staff operations

### MVP permissions — allowed

- Read all client, pet, and booking data **for the active business**
- Write bookings, staff notes, meet-and-greet updates, and operational status changes
- View schedule and household tools

### MVP permissions — not allowed (default)

- Change business services, pricing tables, or blocked-date policy at the business level
- Edit business terms/policy versions
- Manage landing page branding or hero content
- Invite or remove other staff or admins
- Generate or revoke invite codes
- Connect or disconnect Stripe / payment provider
- Delete the business or transfer ownership
- Change another staff member's role

**Note:** Woof Wetreats gives staff broad settings access via a single admin check. PetAppro MVP **intentionally narrows** staff to operations unless an open decision reverses this (Section 13).

### Constraints

- Staff see only data for businesses where they have an active staff membership
- Staff cannot book for themselves as a client within the same business session without switching context (see Section 8)

---

## 6. Client Role

### Who

A pet owner who uses one business's portal after entering a client invite code.

### Responsibilities

- Complete onboarding (profile, emergency contact, vet info, pets)
- Accept business terms and policies
- Request meet-and-greet when required
- Manage own profile and pet profiles (including photos and care notes visible to the business)
- Submit booking requests for enabled services (boarding/daycare at MVP)
- View active/upcoming bookings on the dashboard
- View completed/cancelled booking history via activity history
- Cancel own bookings per business cancellation rules
- View own payment status and pay via enabled methods
- Read in-app notifications intended for the client

### MVP permissions — allowed

- Read and update **own** client profile and pets for the active business
- Create bookings for self when unblocked, profile-complete, and meet-and-greet requirements satisfied
- Cancel own eligible bookings
- View own booking history and notifications

### MVP permissions — not allowed

- View other clients, staff notes, or internal business configuration
- Create bookings for other clients
- Override pricing or payment status
- Access staff schedule or household directory
- Change business services, pricing, or policies
- Invite staff or other clients

### Constraints

- Clients are scoped to one business relationship per client profile (same auth user may have separate client profiles per business)
- Blocked clients are routed to a blocked state and cannot book
- Client-side pricing is **preview only**; server confirms final totals

---

## 7. Possible Future Roles (Deferred)

Not in MVP. Documented to avoid baking in wrong assumptions.

| Role | Intent | Why deferred |
|---|---|---|
| **Partner** | Limited business access (e.g., co-owner read-only or billing-only) | MVP uses owner/admin/staff only |
| **Accountant / read-only** | View bookings and payments without operational write access | No reporting/billing module at MVP |
| **Location manager** | Manage one site within a multi-location business | Multi-location deferred |
| **Platform operator** | PetAppro internal support/super-admin | Separate from tenant product; not client-facing MVP |
| **Custom role templates** | Fine-grained permission sets per business | Complex permission hierarchies deferred |

If added later, each role must still resolve permissions through `business_id` and membership — not global email lists.

---

## 8. Multi-Business User Scenarios

One authenticated user may participate in multiple businesses in different roles.

### Supported MVP scenarios

| Scenario | Expected behavior |
|---|---|
| Client at Business A only | Sees Business A client portal after login or business selection |
| Staff at Business B only | Sees Business B staff tools after login or business selection |
| Owner of Business C | Full owner access to Business C |
| Client at A **and** staff at B | Must pick **active business context** after login; permissions apply only to that context |
| Owner of C **and** client at A | Same context switching; no permission bleed across businesses |

### Context switching

When a user belongs to more than one business, the app must:

1. Show a business picker (or default to last-used business)
2. Apply permissions only for the selected `business_id`
3. Never show clients, bookings, or schedules from another business in the same view

### Same business, multiple roles

**Default MVP rule:** A user should not hold both **staff** and **client** memberships for the **same** business. If they need both, treat as an edge case — prefer staff context and disable client self-booking for that account, or block dual assignment at invite time.

**Open decision:** Whether dual client+staff on one business is allowed (Section 13).

### Pet profiles across businesses

**Working assumption for specs:** Pet profiles are **scoped per business** (same person re-enters pet info when joining a second business as client). Shared cross-business pet profiles are a future optimization.

---

## 9. Invite-Code Behavior by Role

Invite codes link an authenticated user to a business with a predetermined relationship type.

### Code types (MVP)

| Code type | Creates / links | Resulting role |
|---|---|---|
| **Business bootstrap** | New business + first owner | Owner (no code required for founder signup flow) |
| **Staff invite** | `business_membership` with staff role | Staff |
| **Client invite** | Client profile for that business | Client |

### Flow summary

**Owner (bootstrap)**

1. User signs up / logs in
2. Creates a new business (name, basic info)
3. Becomes owner of that `business_id`
4. Receives ability to generate staff and client invite codes

**Staff invite**

1. Owner or admin generates a staff invite code
2. Invitee signs up or logs in
3. Enters staff code → linked to business as staff
4. Lands in staff experience (schedule/onboarding as needed)

**Client invite**

1. Owner, admin, or staff generates a client invite code (see open decision on who can generate)
2. Client signs up or logs in
3. Enters client code → linked to business as client
4. Completes client onboarding before booking

### Code properties (product behavior)

- Each code is tied to exactly one `business_id`
- Codes have a type (staff vs client) — a staff code cannot create a client relationship
- Codes should be revocable by owner/admin
- Expiration and single-use vs multi-use are **open decisions** (Section 13)
- Invalid, expired, or revoked codes show a clear error; no partial access

### What invite codes do not do

- Grant owner or admin role (except business bootstrap)
- Grant access to another business's data
- Replace authentication — user must still have a valid account

---

## 10. Permission Matrix for MVP Actions

Legend: **Y** = allowed · **N** = not allowed · **Own** = own records only · **Ops** = operational write within business · **Elevated** = owner/admin only

| Action | Owner | Admin | Staff | Client |
|---|---|---|---|---|
| Create business (bootstrap) | Y | N | N | N |
| View/edit business profile & branding | Y | Y | N | N |
| Configure services (boarding/daycare) | Y | Y | N | N |
| Edit pricing rules | Y | Y | N | N |
| Manage business blocked dates | Y | Y | N | N |
| Edit terms/policy versions | Y | Y | N | N |
| Manage landing page content/hero | Y | Y | N | N |
| Generate/revoke staff invite codes | Y | Y | N | N |
| Generate/revoke client invite codes | Y | Y | Ops* | N |
| Invite/remove staff | Y | Y | N | N |
| Promote staff to admin | Y | N** | N | N |
| View all clients (household directory) | Y | Y | Y | N |
| View own client profile | — | — | — | Own |
| Edit own client profile | — | — | — | Own |
| View/edit other clients' profiles | Y | Y | Ops | N |
| Manage own pets (photos, care notes) | — | — | — | Own |
| View pets for any client in business | Y | Y | Y | N |
| Soft-remove own pet | — | — | — | Own |
| View staff-only notes | Y | Y | Y | N |
| Add staff-only notes | Y | Y | Y | N |
| View daily schedule | Y | Y | Y | N |
| Create booking (self-service) | N*** | N*** | N*** | Own**** |
| Create booking (for client) | Y | Y | Y | N |
| Edit/cancel any booking | Y | Y | Ops | Own***** |
| Override booking price | Y | Y | Ops****** | N |
| Schedule/complete meet-and-greet | Y | Y | Y | Own request only |
| Block/unblock client | Y | Y | Ops******* | N |
| Record/confirm manual payment | Y | Y | Ops******** | N |
| Connect Stripe / payment settings | Y | Elevated | N | N |
| Configure notification preferences (business) | Y | Y | N | N |
| View in-app notifications (business ops) | Y | Y | Y | N |
| View in-app notifications (client) | — | — | — | Own |
| View activity history (completed/cancelled) | Y | Y | Y | Own |
| Transfer ownership | Elevated | N | N | N |
| Delete/deactivate business | Elevated | N | N | N |

\* **Staff client invites:** Default **N** unless business enables it (open decision).  
\*\* **Promote to admin:** Owner only at MVP.  
\*\*\* **Staff/owner as client:** Use client context only; no self-booking via staff session.  
\*\*\*\* **Client booking:** Allowed when unblocked, onboarded, meet-and-greet complete if required.  
\*\*\*\*\* **Client cancel:** Own bookings only, per cancellation policy.  
\*\*\*\*\*\* **Staff price override:** Allowed if business policy permits; audit trail required.  
\*\*\*\*\*\*\* **Block client:** Default owner/admin; staff optional (open decision).  
\*\*\*\*\*\*\*\* **Staff payment confirm:** Default owner/admin; staff optional (open decision).

---

## 11. Tenant / business_id Rules

All permissions assume an **active business context**.

1. **Every business-specific record** belongs to exactly one `business_id`.
2. **Every permission check** must include the active `business_id` — not just the user id.
3. **Membership required:** Owner, admin, and staff actions require a membership row for that business and role.
4. **Client actions** require a client profile tied to that `business_id`.
5. **No cross-tenant reads:** Users never see another business's clients, pets, bookings, notes, or settings without membership there.
6. **No global admin email:** Woof Wetreats-style `ADMIN_EMAIL` checks are not used.
7. **Server authority:** Booking and pricing permissions are enforced on the server; UI hiding alone is not sufficient.
8. **Storage and files:** Pet photos and business assets are logically prefixed or scoped by `business_id`.
9. **Notifications:** Delivered only to users with a relationship to the relevant `business_id`.
10. **Terms and audit:** Terms acceptance and booking snapshots are stored per business and per booking.

---

## 12. Sensitive Actions Requiring Elevated Permission

These actions require **owner** or explicit **owner-only** approval at MVP.

### Owner-only

| Action | Why elevated |
|---|---|
| Transfer business ownership | Legal/account responsibility |
| Delete or deactivate business | Irreversible tenant teardown |
| Promote user to admin | Expands configuration access |
| Demote or remove last admin | Prevents lockout (guard required) |
| Connect/disconnect Stripe Connect | Financial and compliance impact |
| Change platform subscription/billing (future) | SaaS account ownership |

### Owner or admin

| Action | Why elevated |
|---|---|
| Change pricing rules or service catalog | Affects all future bookings |
| Publish new terms/policy version | Legal impact for all clients |
| Revoke invite codes | Access control |
| Remove staff or admin | Access control |
| Business-wide blocked dates | Affects all bookings |
| Manual payment confirmation (default) | Financial record integrity |
| Client blocked status toggle (default) | Access control |
| Booking price override with audit | Financial record integrity |

### Audit expectations (product behavior)

Elevated actions should record **who** performed the action, **when**, and **which business** — especially price overrides, payment status changes, client blocks, and terms publishes.

---

## 13. Open Decisions

Record resolutions in `docs/decisions/` when decided.

| # | Question | Default for specs until decided |
|---|---|---|
| 1 | Can one user be client and staff at the **same** business? | **No** — block dual assignment at MVP |
| 2 | Can staff generate client invite codes? | **No** — owner/admin only |
| 3 | Can staff block/unblock clients? | **No** — owner/admin only |
| 4 | Can staff confirm manual payments? | **No** — owner/admin only |
| 5 | Can staff override booking prices? | **Yes**, with audit trail |
| 6 | Are invite codes single-use or reusable? | TBD |
| 7 | Do invite codes expire? | TBD |
| 8 | Is admin role required at MVP or owner-only businesses OK? | Owner-only OK |
| 9 | Pet profiles shared across businesses for same user? | **No** — per-business client pet records |
| 10 | Public landing + private invite portal, or invite-only? | TBD — affects client acquisition, not role model |

---

## 14. Acceptance Criteria for Phase 0 Readiness

This doc is ready for Phase 1 (architecture) when:

- [ ] Four MVP roles are defined with clear boundaries (owner, admin, staff, client)
- [ ] Deferred future roles are explicitly out of scope
- [ ] Multi-business context switching behavior is described
- [ ] Invite-code types and outcomes are defined
- [ ] Permission matrix covers all MVP feature pillars from `product_brief.md`
- [ ] Tenant rules require `business_id` on all business-specific access
- [ ] Sensitive/elevated actions are listed with owner vs admin vs staff defaults
- [ ] Open decisions are documented with working defaults for spec writers
- [ ] No reliance on global admin email or Woof Wetreats single-tenant shortcuts
- [ ] Stakeholder confirms staff is **narrower than admin** for configuration (pricing, terms, invites, payments)

**Phase 1 handoff:** Architecture and RLS specs must implement this matrix without weakening tenant boundaries. Any deviation requires a decision record.

---

## Next Steps

1. Log decisions on open items in `docs/decisions/`
2. Reference this doc in Phase 1 `docs/planning/technical_architecture.md`
3. Map each MVP spec (Phase 4) to matrix rows for acceptance criteria
4. Cross-check against `docs/planning/woof-wetreats-reference-review.md` for workflow coverage

---

## Team permission levels — simplified model (Revised 2026-07-07, Danny)

Supersedes the Owner/Admin/Staff specifics above where they conflict. The PCSP invites a member and **assigns a named level**; "co-provider" is not a separate role — it's simply someone assigned **Admin**. Target users are mostly solo operators or life-partners, so the model is intentionally lean.

**Levels** (creator is Owner; assignable = Admin / Manager / Staff):

| Capability | Owner | Admin (co-provider) | Manager | Staff |
|---|---|---|---|---|
| Edit financial connections (Stripe, billing/subscription), ownership transfer/delete | Yes | No | No | No |
| See financials / payouts / reports | Yes | Yes | No | No |
| Business config (services, pricing tables, policies, branding) | Yes | Yes | No | No |
| Manage team members | Yes | Yes | No | No |
| Price-override a booking | Yes | Yes | No | No |
| Add a booking | Yes | Yes | Yes | Yes |
| Edit / delete / reschedule bookings | Yes | Yes | Yes | No |
| View bookings & clients | Yes | Yes | Yes | Yes |
| Set up meet & greets | Yes | Yes | Yes | Yes |
| Care execution (check-in/out, notes, report cards) | Yes | Yes | Yes | Yes |
| SMS (when added) | Yes | Yes | Yes | Yes |

**Owner vs Admin:** functionally identical **except Admin cannot edit financial connections, billing/subscription, or ownership.** Kept distinct (not merged) so a small business can hand a partner Admin without exposing money-movement/billing controls. At least one Owner always remains.

**Manager:** full day-to-day operations but **no financial visibility at all** and **no price-override**.

**Staff:** view bookings/clients, add a booking, set up M&Gs, care execution, SMS — but **cannot edit/delete bookings or price-override**. Staff still cannot invite clients (D-002).

Adds **Manager** as a new tier to the prior Owner/Admin/Staff model. Seats/tiers per D-020; the invite flow shows level capabilities + an "Admin sees financials" disclaimer + a seat/tier check. Flow drawn on the FigJam board: "Provider · Staff / team management".

### Invite-team-member screen — canonical role copy + layout (Danny, 2026-07-31)

Caught in review: the invite screen described roles by what they **lack** (terse negatives) and referenced "ownership" without ever anchoring that **the Owner is the inviter** — so "Admin can't touch ownership" dangled. Fixes, canonical:

- **Anchor the Owner first**, then describe each grantable level as **what it adds** (roles nest — Staff ⊂ Manager ⊂ Admin ⊂ Owner):
  > **You're the Owner** — full access, including billing. Choose what to grant this person:
  > - **Staff** — Handles the bookings and care they're assigned. Can't edit other bookings, and never sees or sets prices.
  > - **Manager** — Runs day-to-day operations: all bookings, clients, scheduling. Still can't see money or change prices.
  > - **Admin** — Your trusted partner. Everything a Manager does, plus financials, reports, and pricing. Can't change billing or ownership — that stays with you.
- **Owner is NOT an assignable invite role** (creator only; ≥1 Owner always). Admin = the "co-provider" partner level (D-032). *(Transferring ownership is a separate future flow, not this screen.)*
- **Split the crammed callout:** the *"Admins see your financials"* heads-up shows **only when Admin is selected** (contextual to the choice); the **seat counter** ("Seats: 2 of 3 on Crew") is persistent context — place it steadily (near the title or the Send button), not bundled with the financial warning.
- Copy tweakable by Danny; structure (Owner-anchor · additive descriptions · split callouts) is locked.

### The "More" page is DERIVED from the permission matrix — not hand-built per role (2026-07-28, from Danny's design review)

Fable was hand-crafting each role's "More" screen, which introduced inconsistencies (staff view missing App Settings; risk of Share Booking Code appearing for staff). Rule going forward:

- **App Settings = personal / device-level** (the user's own notification prefs, appearance, account, help, sign out). **Universal — present on EVERY role's More page, including Staff** (and the client app has its equivalent). It is NOT business config, so it is never gated away. ⚠️ Distinct from the owner's **SETTINGS** section ("Services, Prices, Availability" · "Branding & Business Profile") — that is *business config*, owner/admin-only, opens the web portal.
- **Share Booking Code = a client-invite action → owner/admin only (D-002).** The booking code is the client-connect mechanism (D-026: invite code + QR); D-002 restricts client invites to owner/admin ("staff cannot invite clients"). So **Share Booking Code does NOT appear on the Staff (or Manager) More page.** *(If we ever want staff to help grow the client base by sharing the code, that is a deliberate D-002 revision — not a design tweak. D-002 stands as of 2026-07-28.)*
- **Switch Space** (the account/context switcher, D-004/D-012/D-030) is **conditional** — render only when the account belongs to 2+ contexts (client identity + ≥1 business, or multiple businesses). Single-context users never see it. *(Terminology **LOCKED: "Space"** — Danny, 2026-08-01. "Switch Space" / "Space switcher" are the canonical labels.)*
  - **Entry points to the Space switcher (MORE·04) — all gated on the same multi-context condition:** (1) the **Switch Space** tile on More; (2) **AUTH·06** choose-a-space at sign-in (audit §7 consolidation — same screen); and (3) ⭐ **the Brand/Header chevron (Danny, 2026-07-31)** — the `Brand/Header` component gets a **`chevron` boolean** that turns **ON only when the user has >1 provider**, making the header tappable → the Space switcher for a quick provider swap. Single-provider users: chevron OFF, header not tappable. Keep all three entry points consistent (same condition, same destination).
- **General principle:** every More-page tile is permission-gated and derived from the matrix. Design once at the Staff base and gate up (per the DS "design once, gate-up as annotation" rule) — do not hand-author per role.
- **⭐ Section structure = TWO buckets, adaptive (Danny, 2026-08-01 — replaces the invented "GENERAL / RUN THE BUSINESS / SETTINGS" labels):**
  - **Personal Settings** — the person's own stuff: personal profile · My Schedule · Notifications · Switch Space (if multi-context) · Team Directory · App Settings · Sign out. **All roles.**
  - **Business Settings** — running the business: Review Unpaid Balances · Manage Team · Mktg & Content · Share Booking Code · All Services Settings (web) · Brand & Business Profile (web). **Owner/Admin only** (every row here is owner/admin per the gates above).
  - **Adaptive labeling:** a role with **both** buckets (Owner/Admin) sees the two labeled sections **"Personal Settings" / "Business Settings."** A role with **only** personal (Staff **and** Manager — none of the business rows are theirs) sees a **single section simply labeled "Settings"** (no Personal/Business distinction when there's only one bucket). *(Manager runs operations from the main tabs, not from More business rows — so Manager's More = personal only, same as Staff.)*

**Staff "More" therefore = ** profile · My Schedule · Notifications · **Team directory** · App Settings · Switch Space (if multi-context) · Sign out. It correctly *excludes* Manage Team (management), Review Unpaid Balances (financial), Share Booking Code (D-002), and the web-portal business settings.

### Personal profile is first-class on EVERY role's More page (2026-07-28, Danny — FLOW REVIEW 46)

The owner/admin More frame led with the **business** card (brand + "on PetAppro") and **dropped the person's own profile**; the staff frame had a personal card ("Alex · Staff @ …"). Inconsistent — fix:

- **Every role gets an editable personal-profile entry** (name, email, phone, avatar, credentials/password) → tap → **manage your own profile.** Owner sees "Danny · Owner @ …", staff sees "Alex · Staff @ …". Everyone can edit their **own** profile (matches the "Edit own client profile → Own" row for the client side).
- **Business identity ≠ personal identity.** The business brand card (logo, name, "on PetAppro") is *context*, and editing the business brand/profile stays owner/admin (web portal). Don't let the business card stand in for the person's profile — show both.
- ✅ **Team directory — MVP, accessed under More (Danny, 2026-07-28).** Within a business, members can see each other's **names + roles** and permission-scoped **contact details** (native call/text/email handoff). Visible to **all team members** (read-only contact list); the owner/admin **Manage Team** entry is the *management* version (add/invite/roles), the **Team directory** is the *view/contact* version everyone gets. This is the **foundation future in-app messaging builds on** (in-app messaging itself is **post-MVP, D-053**). Privacy: **contact details are visible to the team by default** (Danny, 2026-08-01) — names, roles, phone, email. An owner-controlled visibility *restriction* is a **post-MVP** option, not launch.

---

## App IA & role nesting (Danny 2026-07-07) — see D-033

The roles are **nested capability sets, not separate apps:** **Staff subset of Manager subset of Admin subset of Owner.** Staff is the operational core (visits, check-in/out, report cards, daily schedule); each higher level adds on top (Manager adds broader ops but no financials; Admin adds financials/settings/team; Owner adds billing/ownership). Nothing a lower role does is absent from a higher role.

**IA consequence:** the app is one binary that forks after login into **Client** or **Provider-side**. The provider-side is a **single permission-gated experience** (progressive disclosure), not distinct admin/staff apps. A solo provider is Owner-level doing Staff-level work — same screens, fully unlocked. Design provider screens for the base (Staff) capability and layer higher-level controls as permission-gated additions. The fork resolves per **active business context** (a user may be Client at one business, Staff at another — D-012).
