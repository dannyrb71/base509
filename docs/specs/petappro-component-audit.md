# PetAppro — §8 Component Audit & Screen Archetypes

> ✅ **APPROVED — Danny, 2026-07-31.** This is now the **canonical inventory + archetype + consolidation source**; screens are assembled from it, not designed fresh. Decisions locked on approval:
> - **Zoned base REJECTED** — the existing **slot-based `Card content/List row` stays canonical**; N2 is NOT built (the audit proved slots cover every pattern → build nothing).
> - **A6** M&G badge word **"Offered" approved.**
> - **Activity-card duplicates** → Fable consolidates to the more complete set, archives/repoints the other.
> - Adapts **A1–A7** + new component **N1 (`Control/Toggle row`)** approved.
> Next: rework existing screens onto this library, batched by archetype (see `design-system-components.md` §8).

**RECOMMENDATION ONLY — nothing built or modified.** Approve, edit, or reject line-by-line; future screens are then assembled from this inventory, not designed fresh.
Sources: full library census (post-taxonomy reorg, #85), the 108-instance List-row usage map, the FR01–46 scrub audits (#69/#81), Danny's sheet family (#92), and the Woof WeTreats reference components.

---

## 1 · EXISTING-COMPONENT CATALOG (the canonical starting inventory)

### Anchors (confirmed, known-good)
| Anchor | Component(s) |
|---|---|
| Pet card — FULL | Card content/Pet general info (§ Pet Details) |
| Pet card — simple VERTICAL | Card content/Pet general info - vertical (149×188, max-w 180 rule, meds pill icon) |
| Pet card — simple HORIZONTAL | Card/Base + Card content/List row with pet-avatar swap (BOOKREQ·02 / PET·01 pattern) |
| Interactive calendar | Control/Calendar · customer, Control/Calendar · staff, Day cell, Day picker, Time picker, Time picker tap-list (all on 04 Form/UI) |
| Interactive card base | Card/Base (static · default/clickable · check-yes · check-no) + Card content/Blank swap slot + ~44 Card content/* |
| Lists / list rows | Card content/List row — slots: Icon swap, Title, Subtitle, Show Chevron, Show icon, Show value + Value, Show badge + Badge swap |
| Forms / form atoms | Field/Text · Textarea · Date · Code, Checkbox, Radio, Toggle, Control/Filter chip, Chip (Default/Selected) + Chip Group, Segmented control |

### Button (03 Base)
Primary · Outline · Ghost · Danger (Label + underlined-label props) · Button/Quick action

### Control (04 Form / UI)
Calendars ×2 · Day cell/picker · Time pickers ×2 · Filter chip · Chip + Chip Group · Segmented control + Segment · Checkbox · Radio · Toggle · Steppers via Field/Code

### Badge (03 Base)
Badge/Status — Kind=Booking (Pending, Confirmed, In Progress, Completed, Cancelled, Draft, Upcoming) + Kind=Payment (Due, Paid, Pending, Past Due, Refunded, Refund Requested) · Badge/Service (8 services incl. Meet & Greet) · Badge/Service · Walk durations · Domain-dissolved: Vaccination Badge, Medication Chip, **Socialization Tag** (renamed from "Temperament" 2026-08-01; now § Pet Details), Client Risk Indicator (§ Clients & team)

### Nav (05 Menu / Nav)
Nav/Top bar (back / title / search / close-in-actions — the only ✕ in the app) · Nav/Tab bar customer + provider · Section header · Progress · Profile tabs + content · Status bar

### Card system (03 shells + 06 content)
**Shells (03):** Card/Base 4-state set · Card/Expandable · Card content/Blank
**Content (06, by subject):**
- *Booking cards:* Booking (Service×State: Boarding Default / Boarding Completed-Past-Due / Boarding Cancelled / Daycare / Walking) · Booking actions (5 modes) · Booking schedule · Schedule (boarding) · Repeat booking · Activity (⚠ two sets — see consolidation) · Service list (6 variants incl. M&G) · Booking Timeline · M&G request (client/provider) · Slot offer (offered/picked) · Daycare confirm
- *Payments & money:* Payment summary · Payment method · Fee breakdown (+Show header/separator/difference bools) · Invoice line · Receipt (4 lines + Show line 4) · Price row · Open charges · Refund state · Pay booking
- *Pet Details:* Pet general info (+ vertical) · Care notes · Care report (4 variants) · Consent Row · Vaccination/Medication/Socialization
- *Data & Reports:* Stat · Stat tile · Chart Bar · Chart Donut · Rates · Report summary · Capacity Meter
- *Clients & team:* Client · Card/Client (composed) · Team member · Client Risk Indicator
- *Notifications & messaging:* Notification row (client/provider)
- *Sharing & growth:* Share card · Location
- *Shared parts (pending zoned-base verdict):* List row · Note · Section
**Sheets (Danny's new family, files with subject):** sheet/Booking list · sheet/Fee breakdown (DATE·RATE TYPE·PET·RATE table) · sheet/staff-contact — rows: sheet content/booking list item · Fee breakdown list item

> ⭐ **Booking-adjacent cards are DISTINCT by FUNCTION — NOT duplicates to merge (Danny, 2026-08-01 — corrects the earlier "consolidate booking cards" lean).** They only *look* alike because they share a common booking-info block (**service-type badge · pet(s) · date/times**). Keep them separate; the win is that the **shared block is ONE reused sub-component**, not that the cards collapse. The distinct types:
> - **Booking card** — a client's booking for their pet(s); single or recurring.
> - **Invoice card** — booking-like, but carries the **downloadable-invoice link**.
> - **Payment-action card** — provider marks a booking/invoice **paid** (manual confirm); or client picks a booking to **pay / cancel / edit**.
> - **Booking activity card** — provider **checks off** arrival/departure or start/stop walk.
> - **Expanded/detailed** booking view vs **short/quick** view (daily schedule).
> - **Service list** ≠ a booking card (it's the list of offered services).
> - …likely more. **Name each by its function** (rename for clarity), don't merge. **Much settles during the build** — these flows aren't prototype-friendly, so final sorting happens in code.

### Feedback & Overlays (06)
Banner · Toast · Skeleton · Empty state · Loading · Overlay/Confirm dialog · Overlay/Modal · util/OS Dialog · util/Stripe Element · util/Content Slot

### Brand & media (03)
Brand/Logo holder (Logo/Tinted/Text) · Brand/Header · logo-svg · Avatars (person 245:3/5 · pet gendered 331:207/209/211) · Media/Photo · Photo Grid (2/3/4/6 + overflow) · Media/Map (route/pin) · Domain/Pet Cluster · Share card

---

## 2 · REUSE MAP (pattern → existing component)
| Recurring pattern (seen on Wireframes 2.0 + Screens) | Use |
|---|---|
| Any tappable list item (menu, booking, client, pet, setting) | Card/Base default + List row |
| List item with money | + Show value / Value |
| List item with status | + Show badge / Badge swap |
| Selectable list item | Card/Base check-yes/check-no + List row |
| Schedule / assignment row | Card/Base + Service list variant (time in trailing slot) |
| Timeline / activity update | Card/Base + Notification row (Time prop) |
| Fee / estimate math inline | Card/Base + Fee breakdown |
| Fee detail popup | sheet/Fee breakdown |
| Booking history popup | sheet/Booking list |
| Receipt / invoice view | Card/Base + Receipt |
| Money totals | Card/Base + Payment summary |
| Dashboard number tile | Card/Base + Stat (pairs in a 12-gap row) |
| Free-text info card (briefing, staff note, reply) | Card/Base + Note |
| Filter/select chips | Control/Chip (+ Chip Group) |
| Single-choice options | Radio + label rows |
| On/off setting | Toggle rows (→ Adapt A1) |
| Confirmation moment | Confirmation archetype (centered, pad-B 140, CTA) |
| Escape/close | Nav/Top bar close only — never loose ✕ |
| Full booking view | Card content/Booking (5 variants) — currently underused; belongs on booking-detail screens |
| Team directory | sheet/staff-contact |

## 3 · ADAPT LIST (property additions to existing components — preferred over building)
- **A1 · Toggle row → promote Danny's Frame-79 pattern to `Control/Toggle row`** (Label text prop + toggle). Used ≥5×: M&G override ×2, refund policy, M&G completed, all notification-preference rows. *Technically a build, but it's a promotion of an existing proven pattern, zero new design.*
- **A2 · Socialization badge-row truncation (compact cards):** add `Compact` boolean to the socialization badge row inside pet cards — behavior baked into the component: **max 2 badges + "…", safety-critical first (Reactive, Resource Guarding = tier-1), deterministic order.** Never handled per-screen. *(Renamed from "Temperament" 2026-08-01.)*
- **A3 · Control/Chip:** add `Show remove` boolean (✕ inside chip) — needed by PROV-MG·03 removable slot chips.
- **A4 · Card/Base:** add compact-padding variant (or padding prop) for tile-size content — the vertical pet tiles currently sit tight against shell padding.
- **A5 · Fee breakdown:** formalize `Show total` + `Show balance` booleans (today hidden via manual overrides on CANCEL·02/·03).
- **A6 · Badge/Status:** confirm M&G vocabulary (parked: "Offered") — one decision, no structure change.
- **A7 · Month picker (from Danny's client-detail build + Woof DatePicker.tsx):** promote the ‹ Month YYYY 📅 › group to `Control/Month picker` with `Expanded` boolean revealing the month calendar — it now appears in 2 places on the client page and will appear on any history browser.
- **A8 · Card content/Booking — optional progress + staff line (Danny #7, 2026-08-01):** add a `Show progress` boolean ("Day 3 of 9" stay progress) and a `Show staff` boolean (assigned-staff + contact) so in-progress board cards keep the operational info the old ad-hoc card had. Optional slots — off by default, on for the Board's In-Progress cards.
- **A9 · Card content/Booking — Show cancel + density (Danny #8/#9, 2026-08-01):** add a `Show cancel` boolean (so the card owns the Cancel action and the screen ghost is dropped — PROV-BOOK-02) and a **compact density** (used on the Today board; full density on booking detail). Uses the repaired Card/Base density prop.

## 4 · NEW COMPONENTS (last resort — each justified)
- **N1 · Control/Toggle row** — see A1. Justification: pattern exists ≥5×, currently ad-hoc clones that can't cascade; no existing component has label+toggle.
- **N2 · (conditional) Card⁄List base — zoned** — ONLY if you pick the zoned prototype. Otherwise List row's existing slots stay canonical and nothing is built. Awaiting your verdict; not counted as approved.
- Nothing else. Every other flagged gap in the audits mapped to reuse or adapt. (Booking-history browser: **covered** by your sheet/Booking list + A7 month picker — no new component needed.)

## 5 · ICONS NEEDED (outline, consistent stroke/size — verify against the 19-icon set)
phone · mail/envelope · send/paper-plane (share & remind CTAs) · info-circle (ⓘ — used in sheet rows; currently ad-hoc) · clock/snooze (unpaid snooze) · filter/sort (list headers). Existing set already covers: close, carets, check(+circle), calendar, bell, camera, map-pin, chat, warning, report, dollar, credit-card, receipt, location, add-person, document, qr, download, edit.

## 6 · SCREEN ARCHETYPES (~10 templates that cover the app)
1. **List** — top bar/title + chip filters + Card/Base+List-row stack (+ optional bulk CTA). *Instances:* Bookings tab, Clients, Unpaid list, Pets, Invoices, notification center.
2. **Board (operational dashboard)** — stat tiles + attention queue + schedule (Service-list cards) + load card. *Instances:* Provider Today, UNPAID·01, Staff Today (merged — see 7), Client Home (client-flavored variant).
3. **Detail (entity page)** — title + summary components + subject sections + actions. *Instances:* Client detail (4035:44787 is the reference implementation), Booking detail (should adopt Card content/Booking), Pet profile.
4. **Form / Composer** — Field/* stack + primary CTA (no-nav template, back). *Instances:* Account edit, Pet edit/add, remind composer, refund amount, invite.
5. **Selection step** — instruction + selectable cards/chips + Continue. *Instances:* pet select, service menu, slot pick, payment-timing, reason pickers.
6. **Review / Summary** — Fee breakdown + Payment summary + consent/tip + CTA. *Instances:* Checkout review, price-diff, cancel summary, refund confirm.
7. **Confirmation** — locked template: centered check-circle + headline + support + contextual CTA, pad-B 140. *Instances:* all 23 confirmations.
8. **Sheet / Overlay** — sheet/* panels, Overlay/Confirm, OS dialogs, booking-card overlay (UNPAID·04 pattern). All-corner radius + Elevation/Modal.
9. **Settings / Menu** — profile card + labeled sections of List rows + Toggle rows + ghost sign-out. *Instances:* client More, provider More, staff More (one screen role-gated — see 7), app settings, notification prefs.
10. **System states** — Empty (Feedback/Empty state + CTA), Loading (Feedback/Loading in centered-FILL wrapper), Error (Banner/Callout) — variants applied to archetypes 1–3, not separate designs.
*(Domain add-on: Report-card viewer = Detail archetype + Care report + Photo Grid — no separate template needed.)*

## 7 · CONSOLIDATION (design once, gate by role — D-033)
- **CONFIRMED example: FR45 Provider Today + FR27 Staff Daily schedule → one operational Board**, role-gated (owner sees money tiles + approvals; staff sees assignments only). PTODAY·02 "live services" merges into it. STAFF-MG·01 assignments fold in too.
- **UNPAID·01 dashboard ↔ PTODAY·01** — same Today board with the unpaid tile; keep ONE.
- **FR43 client More ↔ FR46 provider More ↔ staff variant** — one Settings/Menu screen, rows gated by role (F-020).
- **NOTIF center client/provider variants** — one screen, Notification-row variant per role.
- **AUTH·06 Choose-a-space ↔ MORE·04 Space switcher** — same screen, two entry points.
- **CHECKOUT·10 receipt ↔ INVOICE·01 client receipt** — same Receipt view reached two ways.
- **MG·04 (client M&G dashboard) ↔ PROV-MG·01 (provider incoming)** — same M&G list, M&G-request variant per role.
- **Empty states (BOOKLIST·04, UNPAID·03, PROV-CLIENT·05, STAFF-SCHED·04, PROV-MG·09…)** — all become archetype-10 variants of their parent screen, not standalone designs.
- **Duplicate masters to merge:** the two Card content/Activity sets (2024:5188 vs 2445:18045); Payment summary "Redundant"-section copies were archived in the reorg — Activity merge is the remaining one.

**Rework decisions — FR20 recurring series + booking creation (Danny, 2026-08-01):**
- **Booking creation/editing is ONE reused editor across services.** The boarding *request*, the "Change booking" editor (`CLIENT-CHANGE·02` — calendar + pet-select + date/time), and the **missing daycare/walk request** are the **same pattern** (Form/Composer + Selection archetypes), configured per service (service, duration, and for walks/daycare the **recurrence** — days + time window — that generates the series, D-062m). 🚩 **GAP: no recurring walk/daycare booking-creation screen exists** — build it from the boarding-request + Change-booking template, not net-new. Reuse-first.
- **Recurring series — DROP the occurrence-vs-series fork screen** (`CLIENT-RECUR·02`). The entry points already disambiguate: **tapping an occurrence row → that day's actions directly** (Skip / Add one-off / adjust); **"Manage series" → series actions directly** (Edit / Pause / End). For the edge case (editing one day, want to affect all), put an inline **"Change the whole series instead →"** on the occurrence screen — don't gate every path behind an upfront fork (matches calendar-app UX; saves a tap + a screen).
- **Walk Series screen = ONE card** with clickable occurrence rows + "Manage series" below (was 3 separate cards) — the single card makes the series relationship visible. Rows use the booking-card/list-row pattern.

**Rework decisions — FR42 client Bookings tab (Danny, 2026-08-01):**
- **CLIENT Bookings tab = sections, NO filter chips.** Very few clients ever have >1–2 upcoming/pending at once, so Upcoming/Pending/Past filters are friction. Structure: **"Pending & Upcoming"** on top (rich booking cards — few, so full detail) + **"Past & Cancelled"** below (compact list rows, with **year tabs (2026/2025) + month calendar** for browsing history). Empty state ("Nothing booked yet" → Book a Service) stays.
- ⚠️ **CLIENT-SIDE ONLY.** The **provider** bookings surface is high-volume → keep its filtering/board treatment. Don't propagate "no filters" to the provider. (List archetype supports both: filter-chip variant for provider, sectioned variant for client.)
- Danny deprecated the filter frames (2nd/3rd) — marked **`zz -`** (his archive prefix; `zz -` = dead/archived, do not use).

**Sample data — keep it realistic, don't placeholder-ize (Danny, 2026-08-01):**
- Screens use **realistic sample names/values** (Bella, GO!DOG WALKER GO!, $30) — do NOT replace with "[Dog Name]" / "[Provider Name]." Realistic data stress-tests layout (long names, multi-pet, wrapping); placeholders hide those edge cases.
- In code, every text node is **bound to real data** (data model / pricing engine) — the Figma text is a stand-in the build replaces, not literal copy. No find-replace needed at handoff.
- What DOES matter: **internal consistency** of sample data within a flow (one sample provider, consistent pet/client names — fix mismatches like header "GO!DOG WALKER GO!" vs profile "Woof WeTreats"), and showing **edge cases** (very long name, single vs multi-pet, no-logo → name-as-text).

**Standing guardrail — ONE hub per surface; flows drive FROM it (Danny, 2026-08-01):**
- Entry/hub screens (**Today, Bookings, etc.**) are a **single, role-gated screen** that routes to sub-flows. A sub-flow does **NOT** get its own parallel copy of the hub.
- **Root cause of the drift:** Fable authored flow-by-flow, so each flow spawned its own hub — e.g. `STAFF-SCHED·01` "Today" vs `PROV-UNPAID·01` "Today" = the same screen designed twice (fixed by Danny). The **one-Board consolidation (FR45/27)** is the canonical example of the right model.
- First-pass review + the rework watch specifically for **parallel hub screens** and fold them back to the single hub.

---
**STOP note per the rules:** no new categories proposed; "sheet/" is already ratified in the legend. Approve/annotate this doc and the next hi-fi work becomes assembly.
