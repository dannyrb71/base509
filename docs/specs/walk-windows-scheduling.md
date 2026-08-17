# Walk Windows — Scheduling & Availability for Dog Walking

**Status:** RATIFIED (Cowork PM + Danny PO, 2026-08-15). §6 decisions settled below; schema (§6.4) pending a `data_model_draft.md` pass before build.
**Purpose:** Define how dog-walking availability is configured and booked. Answers the question raised against the Business Settings mockup: *"would a walker set time slots for group walks?"* — the answer, confirmed against how the industry actually operates (Time To Pet, Scout, Barkside Bay), is **no: windows + recurrence, never bookable clock slots.**
**Mockup:** `design_working/walk-windows-sketch.html` (provider card, Solo variant, client booking flow, post-MVP group builder).
**Relations:** capacity math per `specs/capacity-model.md` (Walking row: per-walker cap, scales by walkers, no location pool). Pricing stays separate per `specs/booking_and_pricing.md` §0 delta 1 — *"group concurrency/capacity is a scheduling/capacity concern, not pricing."* Surface: web portal per `planning/provider-settings-ia.md` §0.

---

## 1. The model — three layers

1. **Provider defines Walk Windows** (not slots). A window = name + days-of-week + time band (e.g. Midday · 10:00–14:00) + which walk services it accepts (Individual / Group) + zones + (Duo+) assigned walkers.
2. **Client books a window + days + recurrence** (weekly or one-off), never an exact time. Expectation set honestly: "your walker arrives between 10–2"; the D-054 launch GPS + "on the way" notice pays off the wide window.
3. **The walker composes the groups.** Booking fills windows and enforces the capacity cap; dog compatibility and routing are human calls. The drag-to-route "group builder" day view is **post-MVP** (logged in §5).

**Rationale (researched 2026-08-15):** professional walkers run route businesses — recurring weekly schedules, midday bands, walker-assembled groups. Exact-time booking is the Rover/Wag gig-marketplace pattern, wrong reference for PetAppro's provider. Sources: Time To Pet scheduling academy (recurring templates, schedule blocks, client portal *requests*); Barkside Bay ("time windows vs exact time" — windows enable routes, weather/traffic slack, dog-first care; exact times are case-by-case exceptions).

## 2. Provider configuration (web portal, Business Settings)

**Walk Windows is a sibling section to Walking Rate Options — not fields on rate cards.** A 30-min group walk at $22/dog can be offered in Midday *and* Morning; windows × rates stay independent so neither list explodes combinatorially.

Window fields:
- **Name** (Midday, Morning, Weekend Adventure…), free text.
- **Days of week** (chip toggles).
- **Time band** start/end. Semantics: the band bounds **walk start** (industry pattern — e.g. Urban Woof NYC's "one-hour window time frame to start a walk"); a walk may end past the band by its duration. Client-facing copy is always "between X–Y".
- **Minimum walks / week** *(optional, per service — mainly Group)*. Research: professional walkers commonly require frequency minimums for group walks (Urban Woof: recurring monthly clients only, min 3 walks/week; no single walks) because route density is the business model. Provider-set number, default none. Note: clients still **pick their own days** — the industry does not sell fixed provider-defined day bundles ("MWF set"); it constrains frequency, not which days.
  **Scope of the minimum (Danny, 2026-08-15):** it gates *establishing a recurring group schedule*, not every booking. Regulars with an active schedule may book one-off extras ("Just this week"). True outliers (one-off with no schedule, regular below minimum) are NOT config surface — they ride the existing request flow: auto-book enforces and never self-overrides; the provider may **approve anyway** (capacity-model §6 pattern), and provider-initiated booking remains the backstop. Options where the industry varies; human judgment where it doesn't.
- **Services accepted:** Individual / Group checkboxes (a window can take both).
- **Zones:** drawn from the existing Service Area (see §6 open question on MVP granularity).
- **Walkers assigned** *(plan-gated, see §3)*.
- **Active toggle** — an off window is Hidden (same pattern as hidden rate cards).
- Duplicate / Remove.

**Capacity is computed, not entered here.** Group capacity per window-day = `Dogs Per Walker × walkers assigned to the window` (Solo: × 1, multiplication not shown). Individual walks draw from the existing Max Walks Per Day / Walker. This is the capacity-model Walking archetype evaluated with **binding window = the walk window** — no location pool. Single source of truth stays with the existing fields; Walk Windows only adds the *when*.

## 2A. Conditional rendering by walk type (Danny, 2026-08-15)

The Individual / Group / Both selector (walk-type config per `booking_and_pricing.md` §0 delta 1) drives the whole service surface, not just the rate form:

- **Individual only:** Group rate rows hidden; Add Rate form omits the walk-type picker; Group Walk Policy hidden; **Dogs Per Walker hidden** (it is group walk size — individual capacity is Max Walks Per Day); window Service checkboxes hidden; window capacity copy in walks, not dogs ("up to 6 walks this window"); client booking omits the solo-vs-group choice.
- **Group only:** Individual rate rows hidden; Dogs Per Walker, Group Walk Policy, Max Walks Per Day all stay; window Service checkboxes hidden; an "Individual only" window state becomes impossible (flag any existing one on switch).
- **Both:** full surface.

**Switching hides, never deletes.** Flipping away from a type with configured data shows a quiet notice ("2 Group rates and 1 policy hidden — restored if you re-enable Group") consistent with the existing Hidden state. The connector/teaching example follows the selection (an individual-only provider sees an individual worked example).

## 3. Plan gating (Solo / Duo / Crew)

- **Solo:** the Walkers Assigned row **does not render** (same gating pattern as GPS "Crew+" chip). Capacity line reads "Group capacity: 6 dogs per day in this window." One quiet upsell line in that slot: "Running with a team? Duo & Crew assign walkers per window." Never show "× 1 walker" — a solo operator shouldn't see staff machinery.
- **Duo and up:** full Walkers Assigned row. Deliberately **Duo, not Crew+**: two walkers is exactly when "who covers Midday" becomes real, making this a reason to upgrade from Solo.

## 4. Client booking flow (app)

Service → **days** (chips) → **window** (cards showing band + live spots remaining for group, from the capacity calc for their zone/day) → **recurrence** (Weekly / Just this week). Windows that don't accept the chosen service render disabled ("Individual walks only"). Request flows through existing Booking Rules (24-hr notice, Meet & Greet gate). Confirmation copy: heads-up message when the walker is en route; live GPS during the walk (D-054).

**Exact times are reported, never promised.** In advance the client knows only the window. At execution: en-route notice → check-in (walk starts) → live GPS → check-out → visit report card delivered in real time with actuals (Time To Pet pattern: report cards with notes/photos delivered to the client feed in real time on completion; check-in/out time tracking + GPS is the record of when the walk actually happened). PetAppro already has the report-card concept (`planning/pet-profile-report-card-carousel.md`) — walk actuals land there.

## 5. Post-MVP: group builder day view

Roster per window-day: dogs grouped into routes per walker, unassigned pool, drag to assign, zone tags visible. MVP ships **without** this — the capacity cap keeps windows sane and grouping happens offline, as providers do today.

## 6. Decisions — RATIFIED (Cowork PM + Danny PO, 2026-08-15)

1. **Zones → single Service Area for MVP.** Windows inherit the one Service Area; per-window zones are post-MVP (add alongside the group builder when Crew/Team route density needs them).
2. **Booking mode → the same approve/auto-book toggle as every other service, defaulting to request.** No walking-specific mode. Rationale: the walker composes groups/routes, so request/approve preserves that control — consistent with "auto-book never self-overrides." UX: label it **"request a spot"** (not "book"); within-capacity requests are one-tap to approve. Min-walks/week enforces at the **recurrence step**.
3. **Frequency-based pricing → OUT of scope.** Walk Windows carries only the min-walks/week *eligibility* gate. Cheaper-per-walk-by-frequency, if ever wanted, is a separate pricing-engine decision with its own regression tests — must not leak into this spec.
4. **Schema → PENDING a `data_model_draft.md` pass (Codex; build prerequisite).** Product-side lean: a first-class `service_windows` table (windows are entities that bookings attach to and that capacity computes against per window/day), NOT a `business_services` config blob — so `packages/booking` can query/join relationally. Final call is Codex's in the data-model pass. Capacity check = §2 computed cap per window/day.

## 7. Codex data-model + scope ruling — 2026-08-15

- **`service_windows` = first-class relational entity APPROVED** (NOT a `business_services` JSON blob). Lean shape:
  `service_windows(id, business_id, business_service_id, name, weekdays, earliest_start_local, latest_start_local, accepted_service_modes, active, sort_order, created_at, updated_at)`
  + child `service_window_assignments(business_id, service_window_id, business_membership_id)`.
  Mechanics: tenant-composite FKs (no cross-business links); `earliest_start_local < latest_start_local`; nonempty valid weekday set; ≥1 accepted mode; **no zone FK in MVP** (inherit the business Service Area); capacity derived (Dogs Per Walker × assigned walkers); min-walks/week stays a service/recurrence policy (not per-window); `booking_occurrences.service_window_id` carries the capacity binding; **snapshot** the promised window label + time band onto the confirmed occurrence so later edits don't change what a Client booked.
- **Pass NOT yet applied:** `data_model_draft.md` still has no `service_windows`; walking must use **`fixed_window`** (not `slot` — `slot` stays for exact-time services like grooming). Tracked for the Codex data-model pass.
- **Two code conflicts to remove before build:** (1) per-window "Dogs This Window" overrides (`PortalWalkWindows`) violate the single-source capacity rule; (2) `data_model_draft.md` says `slot` supports walking → change to `fixed_window`.
- ⚠️ **SCOPE CONFLICT — PO decision needed:** §6.1 ratified a **single inherited Service Area** (per-window zones post-MVP), but the wired portal implements **multi-zone** (named zones, add/remove, per-window zone assignment, GeoJSON `FeatureCollection`). Options: (A) strip to **one geometry** (Polygon/MultiPolygon), Walk Windows inherit it with no zone selector — honors the ratified MVP; or (B) amend the ratification to bring multi-zone forward (adds capacity/complexity). **Danny to decide.**

## 8. RESOLVED — multi-zone Service Areas kept (PO decision, Danny, 2026-08-15)

**Supersedes §6.1 item 1** ("single Service Area for MVP") and **resolves the §7 scope conflict — Option B chosen.** Providers serve different areas on different days/times (e.g. Mon area A / Tue area B; morning vs afternoon vs evening), so **multiple named zones with per-window zone assignment stay in MVP.** A single area (or a single radius) remains a valid simple configuration a provider can choose. Keep the built multi-zone solution — no strip-back.

**Schema implication (for the Codex data-model pass) — reverses §7's "no zone FK in MVP":** zones become first-class. Add a `service_zones` table (id, business_id, name, geometry, active, sort_order, timestamps) + a window↔zone link (per-window accepted zones), with tenant-composite FKs. Persist **one geometry per zone** (Polygon/MultiPolygon), not a single FeatureCollection blob. Booking containment stays server-authoritative. Capacity rule unchanged (Dogs Per Walker × assigned walkers). `service_windows` shape from §7 otherwise stands.

**Refinement (Danny, 2026-08-15):** every provider gets a **default top-level Service Area** out of the box (covers the solo/simple case — this *is* the single-area configuration). Customizing into **multiple named zones** is opt-in and is a **top-tier value driver** — 5–20-staff businesses (Crew/Team) genuinely need multiples; without it the expensive plans under-deliver ("we fail at the top-tier plans"). **Open sub-question for the data-model + pricing pass:** should multi-zone be **tier-gated** — default single area for Starter/Solo/Duo, multiple zones unlocked at Crew/Team — mirroring the Duo+ walker-assignment gating (§3) and the rest of the tier ladder (themes, GPS, co-branding)? Flag for Danny + Codex.

**Clarification (Danny, 2026-08-15) — supersedes the tier-gating question above (that question is CLOSED):** service **zones are NOT tier-gated** — available on **every tier**; add "service zones" to the **Features list**. The real model is **default + per-service override:**
- A **default service zone** applies to **all services** out of the box.
- When a provider **customizes a specific service**, they can set a different zone for **that service** (e.g. *Midday group walks* gets its own zone/zones), overriding the default.
- **UX:** at the top of the business's Services/portal page, a **popup/modal** opens the service-zone editor (edit the default zone; add per-service overrides).
- Larger teams (5–20 staff) naturally use more zones — that's usage, not a paywall.

**Schema nuance (Codex data-model pass):** zones attach at the **business level as the default**, with an **optional per-service (and per-window) override**. So a zone assignment resolves: window override → service override → business default. `service_zones` stays first-class; the override link is nullable/leveled, not a hard per-window requirement.

**Rationale (Danny, 2026-08-15) — why zones can't be tier-gated:** even a **solo** provider runs different zones across the day/week (e.g. east side in the morning, downtown midday). Per-service/per-window zones serve the solo route-runner as much as the 20-person team, so gating them by tier would break the feature for the very users it's for. Zones = all tiers, full stop.
