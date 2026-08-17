# Provider Onboarding & Configuration — Interaction Spec

**Status:** Draft for build (Cowork, 2026-07-17). Weekend working artifact → Codex/Claude Code build next week.
**Relationship to other docs — read together, no overlap:**
- **`planning/provider-settings-ia.md`** = the settings *surface map* (WHAT a provider configures and WHERE: web portal vs. app). **Still authoritative for that.**
- **This doc** = the *flow and interaction layer*: the onboarding wizard order, the control-type rules (toggle vs. checkbox vs. radio), the three MVP services configured end-to-end, the policy editor, and Stripe.
- **`specs/booking_and_pricing.md`** + **`planning/petappro_pricing_engine_spec.md`** = the engine this configures.
- **`planning/pricing-tiers-and-features.md`** = which config unlocks at which subscription tier.

**Decisions locked (2026-07-17):**
- **D-061** — provider portal **not live at website launch → waitlist**. Onboarding wizard is built now, exercised by test accounts, user-facing when the portal ships.
- **MVP config scope** — **dog boarding + daycare + walking** only. Grooming/drop-in/sitting are post-MVP (their config patterns are noted where they'd slot in).
- **Provider policies** — **prefilled defaults, editable per section** in a WYSIWYG-or-plain-text field, with **hide/show per section**. Never blocks go-live.
- **Stripe** — two separate integrations: provider **Connect Standard** (their bookings) and Base509's own **Billing** account (the SaaS subscription). Never conflated.

---

## 1. How configuration maps to the engine

Per CLAUDE.md, every service is modeled by five axes. **Configuration is a provider setting these axis values for their own services — not new code per service type.**

> ⛔ **CORRECTION (2026-07-20) — this table previously listed only SEVEN pricing models, omitting `duration_tiered` and `partial_unit_overage`.** Both are **MVP-required** and marked as such in `packages/pricing/src/types.ts`: `duration_tiered` = walking 30/60/90 (D-022), `partial_unit_overage` = boarding late-pickup. Building a CHECK constraint from the old table would have forced a follow-up migration on the first walking service — violating additive-only. **`packages/pricing`'s `PricingModel` type is canonical; this spec and CLAUDE.md follow it, never the reverse.** The DB constraint should be **mechanically derived from that type** so the two can't drift. *(Caught by Claude Code; the error was Cowork's.)*
>
> **Note:** `per_hour` and `per_head` carry `// later` comments in the type — they're in the contract but not MVP config surface. **Constrain to all nine; surface only what MVP needs in the wizard.**

| Axis | What the provider is choosing | MVP control |
|---|---|---|
| `pricing_model` | ⚠️ **CANONICAL = `packages/pricing` `PricingModel` — NINE values:** `flat · per_unit · per_session · per_hour · per_head · per_night · tiered · duration_tiered · partial_unit_overage` | **radio**, pre-selected per service type |
| `capacity_model` | bounded · unlimited | Presets render the relevant plain-language fields from versioned `capacity_config`. Capacity is TWO layers (per-service cap + optional shared location pool). When ≥2 co-located concurrent services are offered, ask the shared total once and persist a separate `capacity_group_id`; **never reuse `conflict_group_id`**. Ratified in `capacity-model.md` §6C. |
| `duration_model` | overnight (board) · fixed_window (daycare) · slot (walk) · open_ended | derived from the selected preset at MVP; provider-defined types will expose it |
| `location_model` | at_provider · at_client · either | **radio** — board/daycare = at_provider; walk = either |
| `buffers` | travel / setup minutes | **number fields**, shown only when relevant (walks) |

**Implication for the build:** the wizard renders a **service-type-aware config form** — it pre-sets the engine axes for the chosen type and surfaces only the controls that type actually needs. A provider configuring "boarding" never sees a walk time-slot editor.

---

## 2. Onboarding flow (the wizard)

Order is load-bearing — each step scopes the next. **Save-and-resume at every step. A provider can reach "go live" on defaults without touching every optional control.**

| # | Step | Gates | Can skip / default? |
|---|---|---|---|
| 1 | **Account & business basics** — name, brand/theme, contact, timezone | — | Name required; theme defaults (Brandy Blue) |
| 2 | **Choose services offered** — board / daycare / walk | ⬇ everything downstream scopes to this | Must pick ≥1 |
| 3 | **Per-service configuration** — one form per chosen service (§5) | booking availability | Ships with type defaults; provider can accept and move on |
| 4 | **Global business settings** — hours, holidays/blackouts, cancellation window, buffers | booking rules | Sensible defaults |
| 5 | **Booking approval preferences** — per-service auto-book toggles (§5.4) | how bookings are accepted | **Default OFF everywhere** — manual approval unless they opt in |
| 6 | **Policies & house rules** — prefilled, editable, hide/show (§7) | client-facing T&C | **Prefilled defaults — never blocks go-live** |
| 7 | **Connect Stripe** — Connect Standard onboarding (§8.1) | **taking payment** | ⛔ **Hard gate for accepting money**; provider can configure everything else first and connect last |
| 8 | **Review & go live** — preview public services page + a "what your clients see" summary | publish | — |

**Two hard gates, everything else soft:**
- **Step 2** (must offer at least one service).
- **Step 6** (must connect Stripe before a real client can pay — see §8.1 `charges_enabled`).

Everything else has a working default so onboarding never dead-ends on an optional decision. This matches the policy decision: go-live is not blocked on writing legal copy.

---

## 3. Control-type taxonomy (the rule)

**The rule, one line each:**

| Control | Use when | Examples |
|---|---|---|
| **Toggle** (switch) | one **independent** on/off that changes nothing else's meaning | "Accept online bookings," "List this service publicly" |
| **Toggle + progressive disclosure** | a boolean that **gates dependent controls** — the reveal appears only when ON | "Require meet & greet" → reveals "which services?" (§4) |
| **Checkbox group** | pick **many**, options **independent** | "Which days are you open?", "Which services require a meet & greet?", household tasks offered |
| **Radio group** | pick **exactly one**, options **mutually exclusive** | `pricing_model`, `capacity_model`, `location_model`, "One-time vs per-service meet & greet" |
| **Number / stepper** | a bounded quantity | capacity N, walk cap, buffer minutes, surcharge $ |
| **Field / WYSIWYG** | free text | policy sections (§7), service description |

**Decision heuristic for the builder:** *mutually exclusive → radio · independent-multi → checkbox · lone boolean → toggle · boolean-that-reveals-more → toggle + disclosure · bounded quantity → stepper.*

**Progressive disclosure is the workhorse pattern** — most "it depends" config (meet-and-greet scope, off-hours surcharge amount, travel buffer) is a toggle that reveals its dependent controls only when enabled. Keeps the default form short; complexity appears only when the provider opts into it.

**Anti-patterns to avoid:** pre-checked consequential boxes; a toggle whose OFF state hides state the provider already entered (disable/gray, don't destroy); radio groups with a hidden default that silently prices something.

---

## 4. Meet-and-greet — worked example of the disclosure pattern

This is the reference implementation every conditional setting copies.

```
[toggle]  Require a meet & greet before a client's first booking      ( OFF default )
   │
   └─ ON reveals ─────────────────────────────────────────────
      [checkbox group]  For which services?
         ☐ Boarding   ☐ Daycare   ☐ Walking
         (renders ONLY the services this provider offers — scoped to Step 2)
      [radio]  How often?
         ○ Once per client (first booking only)
         ○ Before each new service type
```

> **No M&G fee (D-064, Danny 2026-07-30).** Meet & Greet is a **free** service at MVP — **no fee field**. The gate may be *required* before a first booking, but it is never a paid step: a fee behind a hard gate is a paywall in front of the booking funnel, and free, no-obligation intros are the industry norm and a client-acquisition tool. *(Removed the former optional "Meet-and-greet fee $__".)*

**Rules:**
- The "which services?" list is **generated from Step 2** — never shows a service the provider doesn't offer.
- Turning the toggle OFF **disables** the revealed controls but **retains** their values (re-enabling restores them).
- If a required meet-and-greet isn't satisfied, the client booking flow blocks that service with a clear reason (build note for the booking engine).

---

## 5. Per-service configuration — the three MVP services

Each service form is **type-aware**: it pre-sets the engine axes and shows only relevant controls.

### 5.1 Boarding

| Field | Control | Default | Engine |
|---|---|---|---|
| Publicly listed | toggle | ON | — |
| Pricing model | radio (locked to **per_night** at MVP) | per_night | `pricing_model` |
| Nightly rate | number $ | — (required) | pricing |
| Capacity | “Set a limit” preset + number | `bounded`, `service_limit=[provider]` | `capacity_model` + `capacity_config` |
| Overnight exclusivity | (system) overnight-exclusive group | on | availability §IA-5 |
| Check-in / check-out times | time fields | — | duration |
| **Boarding Extra** (late-pickup overage) | **yes/no** → if yes: covered-hours + flat fee (see §5.1a) | off | `partial_unit_overage` |
| Blackout dates | date multi-select | none | availability |
| Extra-pet / puppy surcharge | toggle + number | off | pricing (flat, D-039) |
| Report-card template | checklist editor | boarding starter | IA §4 |

> **§5.1a — Boarding Extra config (D-063, Danny 2026-07-30).** The disclosure pattern (§4) applied to late-pickup: a yes/no — *"Will you charge extra if a boarding runs beyond your covered window (e.g. 24–28h)?"* **No →** nothing. **Yes →** reveal two fields: **Covered hours `[N]`** (how long the base nightly rate covers, **measured from the booked/scheduled drop-off time**, not actual check-in) + **Boarding Extra `$[amount]`** (a single flat **"Boarding Extra"** rate-card line). A **flat** line is applied once when the **booked** pickup exceeds `drop-off + covered-hours` — so it's **deterministic at booking** and shown in the up-front all-in price (LG-2). A **per-booking waive** (visible only when this is enabled) lets a provider waive it for a specific client. Engine model = **`partial_unit_overage`** — full semantics + golden tests in `booking_and_pricing.md` §5B. ⚠️ **Name guard:** "Boarding Extra" (an *added* charge) is NOT the **`extended`** rate tier (a long-stay *reduced* rate). **Rover-style tiering** (a band, then conversion to a full daycare charge) is **post-MVP** — single flat only at launch. **No same-day daycare + boarding** (boarding covers the day; the pet still counts against the shared location pool — `capacity-model.md`).

### 5.2 Daycare

| Field | Control | Default | Engine |
|---|---|---|---|
| Publicly listed | toggle | ON | — |
| Pricing model | radio (locked to **per_session** at MVP; displayed to providers as “per day”) | per_session | `pricing_model` |
| Rate | number $ | — | pricing |
| Capacity | “Set a limit” preset + number | `bounded` | `capacity_model` + `capacity_config` |
| Hours of operation | open/close per weekday + closed days | — | duration/hours (IA §2) |
| Overlap behavior | (system) non-blocking vs boarding — provider override checkbox | overlap-ok | availability §IA-5 |
| Off-hours surcharge | toggle + number $ | off | pricing (IA §2) |
| Report-card template | checklist editor | daycare starter | IA §4 |

### 5.3 Walking

| Field | Control | Default | Engine |
|---|---|---|---|
| Publicly listed | toggle | ON | — |
| Pricing model | ⚠️ **`duration_tiered`** — corrected 2026-07-20 | duration_tiered | `pricing_model` |
| Walk duration tiers | **30 / 60 / 90 min**, provider-set rate per tier (D-022) | 30 | duration + pricing |
| **Bookable time-slots** | slot editor (discrete windows per day) | — | duration = **slot** |
| **Dogs per walker** | number stepper, **recommended default 6, freely editable up or down** — no limit, no warning | `bounded`, `scales_with=worker`, `service_limit=6` | `capacity_model` + `capacity_config` |

> **Walk cap = RECOMMENDED GUIDANCE, not a limit (Danny, 2026-07-21).** *"I don't want to limit the number of dogs for walkers — that is their decision. We provide the app to facilitate their business model as best we can."*
> - Default **6** as a **suggested starting point**; the provider sets whatever works, higher or lower. Neutral helper text at most (e.g. "Most walkers set 6" ) — **no warning, no legal scold, no hard ceiling.**
> - It's **per walker.** Total group-walk capacity = per-walker cap × walkers assigned (a Duo with 2 walkers = 12).
> - **Consistent with our posture:** we're software that facilitates the provider's model; their safety and legal compliance are theirs (Provider Terms §2/§10, D-058). We don't police it.
> - 🏗️ **Codex:** walking capacity is a **computed** value (per-walker cap × assigned staff), not a static `fixed_n`. Confirm whether MVP computes the group total from assigned walkers or holds the cap per-walker for now. **Never hard-code 6** — it's an editable default that scales with staff.
| Location | radio at_client / either | at_client | `location_model` |
| Service area | zone / radius | — | location |
| Travel buffer | toggle + minutes | off | `buffers` |
| Travel fee | toggle + number $ (flat, MVP) | off | pricing (D-039) |
| GPS live route | toggle (tier-gated) + interstitial consent (D-054) | per tier | — |
| Report-card template | checklist editor | walk starter | IA §4 |

> **Post-MVP slots (noted, not built):** grooming = 1:1 appointment slots; drop-in = multi-visit-per-day; sitting = at_client overnight-exclusive. Each reuses a pattern above — grooming ≈ walk slots at 1:1; drop-in ≈ daycare with N visits; sitting ≈ boarding at_client.

> ⚠️ **Custom / provider-defined service types — NEAR-TERM PRIORITY (Danny, 2026-07-18: "sooner than later").** Not launch scope (launch = boarding/daycare/walking), but elevated above the general post-MVP backlog. **Build implication:** the config UI and engine must make adding a provider-defined service straightforward — a provider picks the `pricing_model` / `capacity_model` / `duration_model` / `location_model` axes for a new service they name, rather than us hard-coding each type. The engine is already generic (§1), so this is mostly a **config-UI** unlock, not a schema change. When it ships, the Features page line upgrades from "a service menu you set up" → "a service menu you build — or add your own" (`apps/web/copy/features.md` #10). Flag to Codex for the config-tool design so we don't build the three types in a way that blocks generic ones.

> **Technical reconciliation (Codex/George, 2026-07-19):** the canonical pricing package has no `per_day` enum. Daycare's provider-facing “per day” label maps to `per_session`, with the configured/display unit set to `day`; adding a new money-model enum later requires a pricing-package change and golden regression tests. Boarding/daycare/walking may select preset defaults in the wizard, but persistence and server APIs accept the generic five-axis service shape only. Do not clone the boarding form into separate service-specific DTOs or endpoints.

---

## 5.4 Auto-book — per service, default OFF (Danny, 2026-07-20)

**Architectural rule first:** **approval is the atomic reservation boundary** (transactions spec §2.1). Auto-book is **not a second reservation path** — it runs the **identical atomic approval operation** under a Provider-configured rule. ⛔ **Never build two reservation paths.**

**Placement — late in the funnel (wizard Step 5).** It must come *after* services are chosen and configured, and it **only lists services the Provider actually offers.**

| Field | Control | Default |
|---|---|---|
| Auto-book — Boarding | toggle | **OFF** |
| Auto-book — Daycare | toggle | **OFF** |
| Auto-book — Walking | toggle | **OFF** |

*(Renders only the offered services — scoped to Step 2, same pattern as §4.)*

**Setup copy must be explicit about the trade** — this is the honest version of the feature:

> **Auto-book lets your regulars book without waiting on you.**
> It respects your capacity, hours, and blocked dates — so **those have to stay current.** If your calendar is out of date, clients can book time you don't actually have.

### Availability confirmation reminder

**Bi-weekly notification** asking the Provider to review/confirm capacity and availability. **Not a time restriction, not a lockout** — a nudge. They decide.

> ⚠️ **Recommendation (Cowork): scale the reminder to risk.** Stale availability is only dangerous when **auto-book is ON** — with manual approval, the Provider sees each request and catches the conflict themselves. Suggest: bi-weekly when any auto-book toggle is on; lighter (or suppressed) when all are off. A recurring notification that doesn't match real risk is the kind users mute — and a muted reminder protects nobody.
> Also suppress it if they've updated availability recently; reminding someone to do what they just did trains them to ignore us.

---

## 5.5 Logo upload — accepted formats + security (Codex-verified 2026-07-20)

**Accept:** SVG and **transparent** PNG. **Reject:** JPEG / opaque PNG → clear message + fall back to the letter-avatar + business-name treatment (which should look intentional, not like a failure).

**Validation:** detect format by **magic bytes/parser**, never filename or supplied MIME · max 1 MiB · 16–4096 px per side · ≤4 MP decoded · max 20:1 aspect · reject animated PNG · reject fully transparent · require genuine alpha · **server-generated storage names** (discard original filename).

**SVG sanitation — server-side, before storage.** Parse with DTD, entity expansion, and network access **disabled**. Reject `DOCTYPE`, entities, processing instructions, excessive nesting/node counts, oversized path data.
- **Allowlist:** `svg`, `g`, `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `defs`, gradients/stops, `clipPath`, `mask`, `title`, `desc`.
- **Strip/reject:** `script` · `foreignObject` · `iframe`/`object`/`embed` · `image` · `audio`/`video`/`canvas` · SMIL animation · `use` (unless a validated same-document fragment) · **every `on*` handler** · external `href`/`xlink:href` · `javascript:`, `data:`, http(s), protocol-relative, file refs · CSS `@import`, external `url()`, `expression()`.
- Allow `url(#local-id)` only for validated local gradients/masks/clips. **Serialize the sanitized DOM to canonical SVG — never store or render original bytes.**
- Keep malicious fixtures: script tags, `onload`, `foreignObject`, external images/CSS, entity expansion, recursive refs, deep nesting, oversized paths.

**PNG:** decode with a resource-limited library and **re-encode from pixel data** — strips EXIF, text chunks, XMP, comments, unknown ancillary chunks, embedded thumbnails. Keep normalized RGBA + a standard color-space declaration.

> ⭐ **Render with `<img>`. Never inline uploaded SVG.**
> **Inline SVG is NOT required for theme-tinting** — use a **CSS mask** generated from the sanitized monochrome file, or produce a **sanitized tinted derivative server-side**. This removes the XSS/tinting tension entirely.
> If inline ever becomes unavoidable: canonical sanitized bytes only, through **one audited component**, never `dangerouslySetInnerHTML`, served with fixed `image/svg+xml` + `X-Content-Type-Options: nosniff`, no cookies, restrictive CSP, and ideally off the authenticated origin.

**Theme-tinting stays opt-in and only after server-side monochrome detection** (§ sample-brands README).

---

## 6. Global business settings

Per `provider-settings-ia.md` §2 (authoritative). Wizard Step 4 surfaces: hours of operation (also powers the public page), holidays/blackouts, cancellation window, default buffers. **Snapshot-on-booking rule applies** — hours, surcharge, travel fee, and rates are copied onto each booking at creation and never rewritten by a later settings edit (IA §2; D-043).

---

## 7. Policies & house rules (F-022) — prefilled, editable, hide/show

**Danny's spec (2026-07-17):** each provider ships with **prefilled default** house rules, editable **per section** in a **WYSIWYG or plain-text** field, with the ability to **hide/show each section**. Go-live is never blocked here.

**Sections (each: prefilled default · edit · show/hide toggle):**

1. Cancellation & refund window
2. Deposit / prepayment
3. Vaccination & health requirements
4. Behavior / aggression disclosure
5. Meet-and-greet policy *(auto-synced from §4 if enabled)*
6. Off-hours / holiday surcharge *(auto-synced from hours settings)*
7. Home access & key handling *(sitting/drop-in; hidden unless offered)*
8. House rules / general terms (free)

**Mechanics:**
- **Prefill from tokens** — defaults populate from the provider's own settings (name, hours, surcharge, cancellation window) via the D-009 token model, so a provider who edits nothing still ships coherent, provider-specific rules.
- **Per-section editor** — WYSIWYG for prose sections; plain fields for structured ones (e.g. cancellation window = a number of hours, not free text, so it can also drive the booking engine).
- **Hide/show** — a hidden section doesn't render on the client-facing policy view. Hidden ≠ deleted; the default is retained if re-shown.
- **Snapshot-on-booking** — the client accepts the provider's house rules **version in force at booking time** (Client Terms §1); later edits don't retroactively change an accepted booking.

> ⛔ **Guardrail — provider house rules are LAYER 2, subordinate to the platform Terms.** A provider's rules govern **their care relationship** with their client; they **cannot** waive the client's rights against PetAppro, modify the Client Terms, or contradict the Privacy Policy (Client Terms §1). The editor must not let a provider paste in, e.g., a liability waiver that purports to bind PetAppro. `[COUNSEL: confirm the boundary language shown to providers above the editor.]`
> **This is provider-authored content, not AI-published platform copy** — so it's outside the "no AI legal copy without attorney review" rule *for the platform*, but the **default template text we ship is ours** and should get a counsel pass before launch. → Legal README (F-022, layer 2).

---

## 8. Stripe — two integrations, never conflated

### 8.1 Provider Connect (Standard) — their bookings

**Wizard Step 6.** The provider connects (or creates) **their own** Stripe account so client booking payments flow **directly to them** — **direct charges, no `application_fee_amount`** (D-042; Provider Terms §5; Client Terms §4). PetAppro is not in the money path and takes no cut of bookings.

- **Flow:** Stripe Connect **OAuth / hosted onboarding** from the portal → provider completes Stripe's KYC → returns with a connected `acct_…`.
- **Go-live gate:** a service can accept real payment only when the connected account reports **`charges_enabled = true`** and **`payouts_enabled = true`**. Until then, the service can be configured and previewed but shows "payments not yet enabled."
- **Scoping (money + tenant isolation):** a payment method a client saves for **Provider A** must be scoped to A's connected account and **must not be chargeable by Provider B** (Client Terms §4; README #32).
- **Stripe's KYC ≠ our vetting** — surfaced to clients per Client Terms §2 (D-058). Connecting Stripe verifies payment eligibility, not care quality.
- **Test:** Stripe **test mode** + **test connected accounts** (Stripe provides express/standard test onboarding); test cards for client payments.

### 8.2 Base509 subscription account — the SaaS billing (Danny's to set up)

**Separate Stripe account, separate purpose.** This bills **providers** the PetAppro subscription via **Stripe Billing**, **on the web only** (off IAP — IA §0, D-042). This is **Base509's own merchant account** — nothing to do with Connect.

- **Danny action:** create the Base509 Stripe account; build subscription **Products/Prices per tier** (`pricing-tiers-and-features.md`); free-trial → paid conversion with the auto-renewal controls already specced (Provider Terms §4). **Set up in test mode first.** → new **BIZ task**.
- **Tier gating:** the subscription tier unlocks configuration capability — e.g. GPS live route, staff seats, advanced availability. The wizard reads the provider's active subscription and **gates/greys tier-locked controls** with an upgrade prompt. Exact tier→feature map = `pricing-tiers-and-features.md` (authoritative; don't hardcode a second list).

> **The two never touch:** Connect moves *client→provider* booking money (direct charges); Billing moves *provider→Base509* subscription money. Different accounts, different Stripe products, different code paths.

---

## 9. Test strategy

**Everything in Stripe test mode — no real money until launch.**

| Need | Approach |
|---|---|
| Two-sided accounts | Personal emails are fine for provider + client + staff roles — **isolation is by `business_id`/role, not by separate humans** (D-033). One tester can hold all roles across separate logins. |
| Client payment (Connect) | Test mode + **test connected account** + **test cards** (success, decline, 3DS). |
| Subscription (Billing) | Test mode + **Stripe Test Clocks** to fast-forward trial→renewal→cancellation without waiting real time — validates the auto-renewal + reminder logic (Provider Terms §4). |
| Provider onboarding | Walk the full wizard on a test business; confirm gates (Step 2, Step 6) and defaults-only go-live path. |
| End-to-end money flow | provider onboarded → service configured → client books → pays (test card) → funds land in **test connected account** → payout (test). Confirm PetAppro takes nothing. |
| Deletion / closure | Exercise D-057 (business closure, refund transmit) and Client deletion cancelling future bookings (Client Terms §9) against test bookings. |

**Danny's subscription account:** stand up in **test mode** first, validate trial/renewal with Test Clocks, flip to live near launch (BIZ task).

---

## 10. Open decisions

| For | Question |
|---|---|
| ~~Danny~~ | ✅ **RESOLVED 2026-07-21: walk cap = 6 per walker, editable, safety/local-law warning on change. NOT a hard max — total scales with assigned walkers (§5.3).** |
| ~~Danny~~ | ✅ **RESOLVED D-064:** Meet & Greet is free at MVP; no fee field. |
| ~~Danny/Codex~~ | ✅ **RESOLVED D-063:** no same-day daycare + boarding for the same pet; boarding covers the day while the pet still consumes the shared location pool. |
| **Counsel** | The house-rules **boundary language** (§7 guardrail) + a pass on our **default template text**. |
| **Codex** | **CONFIRMED GAP 2026-07-19:** no migrations exist yet, and the prior data-model draft did not carry the five axes under canonical column names. `data_model_draft.md` now defines the required generic columns; the wizard remains blocked until an additive migration, generated DB types, constraints, RLS, and cross-tenant tests implement that contract. |

---

## 11. Build handoff & sequencing

**Suggested order (Codex/Claude Code), vertically sliced per CLAUDE.md:**

1. **Service-config data model confirm** (Codex) — verify engine axes exist as columns; generate types.
2. **Wizard shell + Steps 1–2** (account, choose services) — the gate that scopes everything.
3. **Boarding config end-to-end** (Step 3, one service) as the reference; regression tests on the pricing snapshot.
4. **Daycare + Walking config** — clone the shape; walking exercises slots + capacity cap + buffers (the hard case).
5. **Global settings + policy editor** (Steps 4–5) — prefill tokens, hide/show, WYSIWYG.
6. **Connect onboarding** (Step 6) — hosted flow, `charges_enabled` gate, test connected account.
7. **Base509 subscription/Billing** (parallel track, Danny + Claude Code) — tiers, trial, Test Clocks.
8. **Review/go-live + waitlist site wiring** (D-061) — sign-up = waitlist, hidden sign-in for test accounts.

**Test accounts needed (Danny):** 2–3 provider logins (one per config scenario), 2–3 client logins, 1 staff login — all test-mode; personal emails fine.
