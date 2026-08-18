# Capacity Model — spec / proposal (2026-07-25, from Danny)

**Status:** **TECHNICALLY RATIFIED WITH SCHEMA CORRECTIONS (Codex/George, 2026-07-31).** The two-layer, time-aware capacity model is approved. Required corrections below are binding for CFG-1 and `packages/booking`.

Canonical axis: `capacity_model` on `business_services` (`data_model_draft.md`). Enforced by the (planned) `packages/booking` availability engine. Asked during `provider-onboarding-configuration.md` §5. Displayed on the dashboard ("Dogs here 3/5").

> ## ⚖️ AUTHORITATIVE CONTRACT (read this first)
> The **build-ready** capacity contract is the section **"Capacity per service — RATIFIED"** near the end of this file, including the **"Walking capacity + service zones — RATIFIED (2026-08-18)"** rules now folded in. The 2026-07-25 proposal (§1–§7 below) is retained as **design rationale**; where it conflicts with the ratified contract, **the ratified contract wins**. The specific points superseded since the original proposal:
> 1. **Counting is DATE-BASED**, not intraday peak-concurrent occupancy. A dog counts on its arrival date and every night, NOT its departure date — `[arrival_service_date, departure_service_date)` half-open in business tz — for BOTH the service cap and the shared pool. Daycare occupies exactly its single `service_date` bucket. The old §2A "peak concurrent occupancy on a timeline / bedtime headcount" model and its handoff-overlap-minutes machinery are SUPERSEDED (replaced by a coarser date-bucket rule with a departure-day tolerance).
> 2. **Boarding & daycare REQUIRE an explicit positive `service_limit`.** The old "use against max capacity" / pool-only option for these is SUPERSEDED (§3, §6C).
> 3. **Walking/drop-in capacity is SUMMED across assigned walkers** (per-walker default + per-window override), NOT `dogs-per-walker × walker count`; zones constrain coverage, they do not multiply capacity.
> 4. **Per-day overrides use four target-specific tables** (`business_calendar_days`, `business_service_day_overrides`, `capacity_group_day_overrides`, `service_window_day_overrides`), NOT an `availability_exceptions.capacity_override` field. The old override field referenced in §6 is SUPERSEDED.
> The passages below carry inline **[SUPERSEDED]** markers where they state the old model.

---

## 1. The insight — capacity is TWO layers, not one (Danny)

1. **Service capacity** — how many of *this* service at once (boarding overnight ≤ 5).
2. **Shared / location capacity (a pool)** — a physical ceiling several **co-located** services draw from **together** (the home holds ≤ 8 dogs total). Boarding and daycare both consume from the same 8.

> **Danny's worked example:** boarding max = **5** overnight; but the house holds **8** total. 3 daycare + 3 boarding present = 6 → **2 slots left**, usable by *either* daycare or boarding (or a mix). Neither the boarding-5 nor a daycare number alone captures this — the **8-dog pool** is the binding constraint once services overlap.

**Rule:** a booking is allowed only if it fits **both** its own service cap **and** every shared pool its service belongs to.
`available(service, moment) = min(service_cap − service_used, pool_cap − pool_used_across_all_pooled_services)`

Use a separate **`capacity_group_id`** FK: services in the same capacity group share a `pool_capacity`. **Do not reuse `conflict_group_id`.** A conflict group governs whether services may overlap; a capacity group governs the finite resource that overlapping services consume. Boarding and daycare may be allowed to overlap while drawing from the same pool, so the two concepts must remain independent.

---

## 2. Capacity archetypes by service — they are NOT all the same

| Service | Concurrency unit (what consumes a slot) | Shares the location pool? | Extra limit |
|---|---|---|---|
| **Boarding** | dogs present overnight | ✅ **yes** — the home/location pool | own overnight max (≤ pool) |
| **Daycare** | dogs present during the day | ✅ **yes** — same home pool | optional own max (≤ pool) |
| **Walking** | dogs on **one walk** (group size) | ❌ no | per-walker "Dogs Per Walk" (default 6); window capacity = **SUM** of assigned walkers' effective caps *(ratified 2026-08-18 — supersedes the earlier "× walkers" phrasing)*; optional per-window override; optional walks/day |
| **Pet-sitting** | **one engagement per sitter** — exclusive location; **pet count in the booking does NOT add capacity** (3 pets in one home = 1 engagement) | ❌ no (each booking is its own location) | concurrent engagements ≤ sitters |
| **Drop-in** | **one visit at a time** (sequential through the day) | ❌ no | **max visits/day** per staff |

Two things the current enum doesn't cleanly express and Codex must place:
- **A shared pool / group ceiling** (boarding + daycare) — needs a `capacity_group` with `pool_capacity`, not just per-service `fixed_n`.
- **A daily-throughput cap** (drop-in: N visits/day, 1 concurrent) — a per-day parameter, distinct from a concurrency number.
- **Exclusive-engagement, headcount-independent** (pet-sitting: 1 location/booking regardless of pets) — `one_to_one` at the **staff** level, not the pet level.

**Codex ruling:** these are composable config parameters plus a first-class `capacity_group`, not a growing enum of pet-service archetypes. `capacity_model` is a stable evaluator discriminator: `bounded | unlimited`. Every bounded preset uses the same versioned `capacity_config`; boarding/daycare/walking/sitting/drop-in are data bundles, not engine branches.

---

## 2A. [SUPERSEDED — see the ratified DATE-BASED counting rule] Time-aware occupancy proposal (Danny, 2026-07-25)

> **[SUPERSEDED 2026-08-17]** This section proposed intraday **peak-concurrent occupancy on a timeline** with a bedtime-headcount binding moment and handoff-overlap-minutes tolerance. The ratified rule is **coarser and date-based**: a dog counts on `[arrival_service_date, departure_service_date)` (half-open, business tz) for both the service cap and the pool; the departure date is not counted; daycare occupies its single `service_date`. The pool is a date-bucket scheduling limit with a departure-day tolerance, not an instantaneous physical ceiling. See "Occupancy counting rule" in the ratified section below. The timeline/interval discussion here is kept only as design rationale for *why* a departing dog need not block a later arrival.

⛔ **Never block a booking on a naive per-day arrival count that ignores departures.** *(The proposal's original framing — peak concurrent occupancy across the booking's span, the max-overlapping-intervals problem — is superseded by the date-based rule above; retained for rationale:)*

| Service | What "occupies a slot" | The binding moment |
|---|---|---|
| **Boarding** | the **overnight** span | **bedtime headcount** — the stable, low-churn number. Daytime drop-off/pick-up churn does **not** create an overnight conflict. |
| **Daycare** | the **daytime window** | sustained daytime presence. |
| **Walking** | the **slot** | dogs on that walk. |

> **Danny's rule:** *"if arrivals put me over, but a departure comes after that leaves me at/under, that's fine — as long as at bedtime I'm not over."* So boarding capacity binds at **bedtime**, and same-day handoffs that transiently overlap are not, by themselves, a violation.

### Handoff overlap tolerance (provider config)
Even peak-concurrent can spike briefly at a handoff (one dog arrives 9:00, another leaves 10:00 → one hour both present). The provider decides how that's treated:
- **Default:** only **stable occupancy** binds (boarding = overnight; daycare = sustained) — brief drop-off/pick-up overlaps don't block.
- **Optional:** an **allowed transient overlap** ("I can be N over during handoffs") and/or a **handoff grace window** (overlaps shorter than X minutes are ignored).
- Ask it plainly in onboarding: *"Can dogs overlap briefly during drop-off / pick-up, as long as you're at or under capacity by the end of the day?"* → yes / no (+ optional allowance). Adapts to mix — irrelevant to walkers/sitters.

---

## 3. Onboarding — what to ask, and how to phrase the "total" (Danny's open question)

The wizard asks capacity **in the shape each service needs**, and asks the shared pool **only when the mix requires it**:

**Co-located concurrent services (boarding, daycare, any provider-defined home service):**
- Each service's own cap. **[SUPERSEDED for boarding/daycare, 2026-08-17]** the original "either set a sub-cap **or** pick *use against max capacity* (no own limit)" choice no longer applies to bounded boarding/daycare: both now REQUIRE an explicit positive `capacity_config.service_limit` (see the ratified section). A pooled service still flexes under the shared pool, but it must also carry its own numeric limit; "pool-only, no service limit" is retired for these archetypes.
- **The shared total, asked once** — "**How many dogs can be at your place at one time, across all services?**" → the pool (8). Group those services into one capacity group.
- **Conditional:** only surface the pool question when the provider offers **≥2 co-located concurrent services**. A **boarding-only** provider: their boarding cap *is* the pool (don't ask twice). A walker-only provider: **never** ask it.

**Services with intrinsic (non-pooled) capacity:**
- **Walking** — dogs per walk (default 6, editable, no warning — existing rule), optional walks/day per walker. Group total = **SUM of assigned walkers' effective caps** (per-walker default + optional per-window override) — *ratified 2026-08-18; supersedes the earlier "per-walker × assigned walkers" product.*
- **Pet-sitting** — no headcount question; capacity = concurrent engagements ≤ sitters. (Confirm staff count; pets-per-booking is irrelevant to capacity.)
- **Drop-in** — "**Max drop-in visits per day**?" (per staff), one at a time.

> **Phrasing principle:** don't ask a provider for a "total capacity" abstraction they'd struggle to define. Ask the **concrete physical ceiling for the services that share one** ("dogs at your place at once"), and derive the rest. The question **adapts to the service mix** — same generic-engine philosophy as everything else.

---

## 4. Staff / seats scale capacity
For the non-pooled exclusive/throughput types, **more staff = more parallel capacity**: 2 walkers = 2 group walks; 2 sitters = 2 concurrent sit engagements; 2 drop-in staff = 2× the daily-visit throughput. The pool (location) types do **not** scale with staff — the house still holds 8 no matter how many humans. Capacity math must know which axis a service scales on.

---

## 5. Dashboard reconciliation ("Dogs here 3/5")
- Where a **pool** exists, "**Dogs here**" shows against the **pool** (e.g. **house 6/8**), since that's the binding number for "can I take another?".
- Per-service caps (boarding **3/5**) show in the **boarding context** / its detail sheet.
- Single co-located service (boarding only, no daycare) → the service cap **is** the displayed capacity (3/5).
- Non-pooled services show their own utilization (walks today N; drop-ins N/max).

Updates `provider-dashboard.md` §A.1 (Dogs here `3/5`) — the `Y` is the pool when one exists, else the service cap.

---

## 6. Capacity override — how a provider handles it (Danny's question)

Capacity is a **provider default, not an absolute they can't deliberately exceed** — "we facilitate their model, we don't police it." Two mechanisms, both already anchored in existing decisions:

1. **Per-booking override at approval** *(exists — transactions §2.1).* If approving would exceed the cap or the pool **at the binding moment** (e.g. bedtime of the 12th), the approve action shows a plain warning — *"This puts boarding at 6/5 the night of the 12th. Approve anyway?"* — and the provider can **"Approve anyway (over capacity)."** Logged (who/when), commits atomically, raises the ceiling for **that one approval only**. Non-blocking; the provider decides.
2. **Pre-emptive date/period override.** **[SUPERSEDED storage, 2026-08-17]** the mechanism stands, but it is NOT stored in an `availability_exceptions.capacity_override` field. Ahead of a known crunch (holidays), the provider **raises the cap for a date** via the target-specific override tables — `business_service_day_overrides.service_limit_override` for a service, `capacity_group_day_overrides.pool_limit_override` for a pool (see the ratified per-day override tables). **Client self-book and auto-book then respect the raised number** for that date.

- An override can raise the **pool** as well as a per-service sub-cap.
- ⚠️ **Auto-book never self-overrides.** Auto-book (default OFF, onboarding §5.4) approves only **within** the configured cap; going over capacity is always a **human** decision. This keeps the "computer never quietly overbooks you" contract.
- Overrides are **logged and reversible** (auditable), `business_id`-scoped.

## 6B. Enforcement (booking package) — flags for Codex
- Availability + **approve / auto-book** must validate **service cap AND every pool** the service belongs to, evaluated as **date-bucket occupancy** over `[arrival_service_date, departure_service_date)` in business tz (daycare = its single `service_date`) — **not** intraday peak-concurrent occupancy (**[SUPERSEDED]** the old "peak concurrent at the binding moment / bedtime headcount" evaluation) and **not** a raw per-day arrival tally that ignores departures.
- **[SUPERSEDED]** The old per-minute **handoff-overlap tolerance** is replaced by the coarser accepted date tolerance: a departing dog is uncounted for its whole departure date, an arriving dog counts its whole arrival date. No intraday grace-window machinery is built.
- Capacity overrides (§6) must be able to raise **the pool** (`capacity_group_day_overrides`) as well as a service cap (`business_service_day_overrides`).
- RLS/tenancy unchanged — all capacity is `business_id`-scoped.

## 6C. Capacity as composable config — flexibility without new code (Danny, 2026-07-25)

Rather than a fixed enum of capacity *types*, model capacity as a **small set of composable parameters** a provider (or a preset) fills in; the engine derives the math from them. The §2 archetypes become **presets**, not hardcoded branches — the same pattern `pricing_model` + config already uses, and what keeps provider-defined services possible without a migration. This is the "**fill out some form fields to determine the math**" Danny asked for.

**The parameters (the fields that determine the math):**

| Parameter | Options | Determines |
|---|---|---|
| **Slot unit** | pet/head · booking/engagement · group session | what consumes a slot |
| **Counting basis** | concurrent (at a time) · daily throughput (per day) | how we count |
| **Scales with** | **fixed resource (pool)** · **team (per-staff × assigned staff)** | ← the "team model" as a parameter |
| **Pool membership** | standalone · shares pool [group] (+ pool size) | shared ceiling |
| **Binding window** | **date bucket** — boarding `[arrival, departure)` · daycare single `service_date` · walk window on its date | which dates the booking occupies (**[SUPERSEDED]** the old "overnight/bedtime vs day-window vs slot" intraday moment — counting is now date-based, from `duration_model` + the ratified counting rule) |
| **Per-service cap** | explicit number · **"use against max capacity"** (pool-limited) | the sub-cap (Danny §3/#1) |
| **Overlap tolerance** | none · allowance N · grace window | handoff churn (§2A) |

**Presets fill these in; providers rarely see the raw form.** Boarding, daycare, walking, sitting, drop-in ship as **parameter bundles**. A provider picks a service and adjusts a number or two. The full parameter form is for **provider-defined / custom services** and for us — so a new vertical (salon chairs, cleaning crews) is **config, not code**.

**On the "team" idea (Danny):** real, but it's a **parameter (`scales with = team`), not a separate system.**
- **Resource-bound** capacity is fixed by a physical thing (the house pool) — does **not** grow with staff.
- **Team-bound** capacity = `per-staff cap × assigned staff` (walkers, sitters, drop-in) — **grows with the team**.
Naming them explicitly avoids treating all capacity the same. ⚠️ **Distinct from the *Team subscription tier*** — different "team"; don't conflate in code or copy.

⚖️ **Pressure-test (the real tradeoff):** unlimited flexibility can become a physics quiz a provider doesn't want to take. Resolve it exactly like §3 — **presets carry the load; the flexible model lives underneath.** Never make a boarding provider define "counting basis"; they pick "Boarding," set two numbers, done. **Flexibility is the engine's; simplicity is the provider's.**

**Ratified persistence contract (CFG-1):**
- `business_services.capacity_model`: `bounded | unlimited`.
- `business_services.capacity_group_id`: nullable tenant-scoped FK to `capacity_groups`; never stored only inside JSON.
- `business_services.capacity_config`: versioned JSON validated at the database boundary and in generated runtime types. V1 fields: `version`, `slot_unit`, `counting_basis`, `scales_with`, `service_limit` (**REQUIRED & positive for bounded boarding/daycare** — the earlier "nullable only when pool-limited" is superseded; null remains valid only for staff/window-derived services that have no single scalar total), `binding_window` (date-bucket), and `overlap_tolerance` (date-level departure-day tolerance, not intraday minutes).
- `capacity_groups`: `id, business_id, name, resource_unit, pool_limit, created_at, updated_at`, with tenant-composite FK integrity and RLS. Pool/date overrides remain separate audited availability exceptions.
- `one_to_one`, `fixed_n`, and similar labels are wizard presets mapped into this contract, not persisted evaluator types. `shared_exception` belongs to conflict/override policy, not capacity math.
- `packages/booking` owns the pure interval/timeline evaluator. Approval and auto-book call the same transactional reservation operation; auto-book never invokes the human over-capacity override.

---

## 7. Open
1. ✅ **Codex ratified 2026-07-31:** `bounded|unlimited` discriminator + versioned composable config + separate first-class `capacity_group`; timeline/interval occupancy belongs in `packages/booking`. CFG-1 must implement the persistence contract and tenant/RLS tests before the wizard.
2. ✅ **Pool-question trigger** = "≥2 co-located concurrent services offered" (§3) — confirmed (Danny).
3. ✅ **Per-service cap** — resolved (Danny) **and revised 2026-08-17:** bounded boarding/daycare now REQUIRE an explicit positive `service_limit` (the earlier "use against max capacity" / pool-only option is retired for these). Daycare still flexes under the pool but carries its own numeric limit too.
4. ✅ **Counting basis + override** — resolved and **revised to date-based (2026-08-17):** occupancy is `[arrival_service_date, departure_service_date)` half-open in business tz (daycare = single `service_date`), for the service cap AND the pool; departure date not counted. Supersedes the old overnight/bedtime peak-concurrent binding and per-minute handoff tolerance (now a coarser departure-day date tolerance). Override = approve-anyway (per-booking) + pre-emptive per-day override via the target-specific tables; auto-book never self-overrides.
5. Sibling to **DR-7** (pricing-model study) — a short **capacity-model study across verticals** may be worth it to validate these archetypes beyond pet care (salon chairs, cleaning crews) before the booking engine hardens.

---

## Capacity per service — RATIFIED with corrections (2026-08-17; Codex-ratified, Danny-ruled)

D-075/D-076 direction ratified by Codex; this is the corrected, build-ready contract (canonical home for the capacity model).

### Archetypes are PRESETS, not a persisted type
The two families are UI/settings presets that populate a validated `capacity_config`. Do NOT persist an `occupancy_numeric | staff_window` enum. The stable evaluator discriminator remains `capacity_model = bounded | unlimited` (see ~line 112).
- **Occupancy-numeric** (boarding, daycare): expose a numeric service limit, persisted as the existing `capacity_config.service_limit` — do NOT add a separate `default_capacity` field. `service_limit` is REQUIRED and positive for bounded boarding/daycare (this supersedes any older "entirely pool-limited" option for boarding/daycare).
- **Staff/window-derived** (walking, drop-in, in-home sitting): effective capacity derives from config + assigned staff + time windows; no single scalar total-capacity field.
  - Walking capacity = SUMMED across assigned walkers: a window's capacity = Σ each assigned walker's effective cap for that window (per-walker default "Dogs Per Walk" + optional per-window override), NOT `dogs-per-walker × walker count` (ratified 2026-08-18, detailed below). Zones CONSTRAIN where an assignment applies; they do NOT multiply capacity. A staff member on overlapping windows/zones is counted ONCE.
  - In-home sitting = staff-bound exclusive-engagement concurrency (1 sitter = 1 home), not window arithmetic.
  - Walk Windows use `fixed_window` (not `slot`).

### Shared pool — required only when genuinely shared
`capacity_group_id` and `conflict_group_id` are SEPARATE concepts / separate columns & FKs:
- `conflict_group_id` = whether booking occurrences may overlap (scheduling only).
- `capacity_group_id` = a finite physical resource consumed by services allowed to overlap.
A capacity group is REQUIRED only when 2+ co-located services consume the same finite resource (e.g. boarding + daycare in one house). A single-service (e.g. boarding-only) business does NOT need a pool row — its `service_limit` is already the physical ceiling. Tenant-composite FK: `(business_id, capacity_group_id) -> capacity_groups(business_id, id)`. Validate each participating service's capacity unit is compatible with `capacity_groups.resource_unit`.

### Occupancy counting rule (Danny's ruling — OVERRIDES Codex's daytime-presence recommendation)
A dog counts against capacity (BOTH the service cap AND any shared pool) on its arrival date and every night it stays, but NOT on its departure date. Formally: occupied dates = `[arrival_service_date, departure_service_date)` (half-open) in the BUSINESS timezone.
- Arrival date (boarding or daycare) counts. Every non-departure date of a boarding stay counts.
- The departure date (12:01am–11:59pm) does NOT count.
- Daycare = single-day arrival → counts that day. Same-day boarding with no overnight is INVALID (use daycare).
- The shared pool uses this SAME date-based projection — no intraday presence windows, no exact check-in/out times.
- ACCEPTED TOLERANCE (Danny, overriding Codex §4): on a changeover date a departing dog (uncounted) may briefly overlap physically with arrivals until pickup; this handoff is not enforced intraday. Codex recommended time-granular pool counting; Danny chose date-granular for simplicity — this is the ruling of record.
- Date math: half-open local-date interval in business tz (not UTC +24h). Count units for statuses that reserve capacity (approved/confirmed reserve; requested does not; cancellation releases). Reschedule / pet-count change / approve / cancel must release-recheck-reserve ATOMICALLY; concurrent approvals serialize by tenant + service/pool + affected service dates (read-count-then-insert is unsafe).

### Per-day management — TARGET-SPECIFIC override tables (single overloaded row REJECTED)
Logical key uses `business_service_id` + `service_date` (not ambiguous `service_id`/`date`). Distinct records:
- `business_calendar_days` (id, business_id, service_date, all_services_blocked, holiday_pricing, note, audit) — UNIQUE(business_id, service_date). "Block All" = ONE `all_services_blocked` flag (never N service rows); covers services created AFTER the block.
- `business_service_day_overrides` (id, business_id, business_service_id, service_date, is_available, service_limit_override, audit) — UNIQUE(business_id, business_service_id, service_date).
- `capacity_group_day_overrides` (id, business_id, capacity_group_id, service_date, pool_limit_override, audit) — UNIQUE(business_id, capacity_group_id, service_date).
- `service_window_day_overrides` (id, business_id, service_window_id, service_date, is_available) — UNIQUE(business_id, service_window_id, service_date) + `service_window_day_override_assignments` (id, business_id, service_window_day_override_id, business_membership_id). A present window-day override REPLACES that date's default assignment set; its absence falls back to recurring assignments.

Rules: `holiday_pricing` only selects which rate set applies (date-level pricing, NOT a capacity property); all price calc stays in `packages/pricing`. A service override cannot revive a globally disabled service. Closure = `is_available = false`, never capacity 0; capacities are positive. Reset = delete the active override row → fall back to defaults, AND append an audit event (actor, time, before/after). Lowering capacity below already-confirmed occupancy does NOT cancel bookings — it marks the day over-capacity and blocks further auto-approvals. Precedence: `Block All` → service/window disabled → per-day service/pool limit → base service/pool default.

### CFG-1 fit
These tables land with the CFG-1 operational schema (tenant + RLS), NOT the waitlist-only migration. Every capacity/calendar/window/assignment/override table carries `business_id`; all cross-table relationships use tenant-composite FKs. Clients never write these tables nor read staff assignments/other clients' demand — client availability comes from a tenant-safe effective-availability RPC. Overrides mutated only via typed server ops by Owner/Admin/authorized scheduling roles. Capacity approval/auto-book enforcement lives in ONE transactional server op (RLS cannot enforce an aggregate concurrency invariant). Generate DB types (don't hand-write). Add cross-tenant RLS tests + concurrent-approval tests before the booking engine depends on these tables.


### Walking capacity + service zones — RATIFIED (Codex, 2026-08-18)
Supersedes the "dogs-per-walker × walkers" walking line in the 2026-07-25 proposal. Codex accepted this deviation (no engine blocker); concrete `capacity_config` + zone keying land at CFG-1 build.

**Walking / drop-in capacity is SUMMED, not uniform.** A window's group capacity = the SUM of each assigned walker's effective cap for that window, where each walker has a default "Dogs Per Walk" plus an optional per-window override (e.g. Midday = Morgan 6 + Casey 4 = 10). It is NOT `dogs-per-walker × walker count`. **Zone capacity within a window = the SUM of the caps of the walkers whose coverage includes that zone** (e.g. Noe Valley = 4 when only Casey covers it). Solo providers use a single business-scoped Dogs-Per-Walk. A staff member on overlapping windows/zones is counted once.

**A walk window is a first-class named sub-service** ("Morning Walks"): Solo = business-scoped (no staff dimension); Duo+ = scoped to day/time/staff.

**Service zones attach at TWO levels:** (a) the whole service (In-home sitting, drop-in, walking), and (b) the named sub-service/window (and, on teams, per-walker coverage within a window). **Named zones are a REUSABLE per-tenant pool** (the shared Zone Manager source list); the service, the window, and the walker each SELECT from that pool — not a private disjoint set per service. Business Profile's "Service Area" is a display aggregation, not the authoritative single source.

**`capacity_config` (walking) must encode:** per-walker default caps, per-window walker assignments + per-window cap overrides, and per-window/per-walker zone selections referencing the reusable zone pool. The concrete shape (zone keying across service / window / staff, tenant-composite FKs, RLS) is finalized at CFG-1 build — Codex-accepted, no engine blocker.
