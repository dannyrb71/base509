# Provider "Today" Dashboard — spec (2026-07-21; restructured 2026-07-25 from Danny's Figma review)

The provider **home / daily-driver** screen (Figma DS file, node `3168:9`, titled **"Today"**). From Danny's daily use of Woof WeTreats — validated product insight, not guesswork.

**Its one job:** *effortlessly manage the day and see today's business* — WITHOUT the broader week/month/quarter/year lens. That lens is the **Reports** page (`provider-reports.md`). Keep the two distinct:

| | This page (Today) | Reports |
|---|---|---|
| Scope | **Today-focused, with day-navigation** (page to other days — Woof-style; Danny uses it throughout the day). NOT the period lens. | week · month · quarter · year, with a picker |
| Purpose | work the day; glance at today's business | trends, history, accounting, CSV/QBO export |
| Money | today's summary tile only | full Earnings/Collected/write-off analysis |

Related: `provider-onboarding-configuration.md` (service mix), `transactions-payments-and-invoicing.md` (§2.2 status vocabulary), `provider-reports.md` (the period views).

> 🔀 **Flow consolidation (Danny, 2026-07-31 — recommend MERGE).** **FLOW 45 (Provider Today dashboard)** and **FLOW 27 (Staff Daily schedule)** are the **same operational surface at different permission levels**, not two screens. Per **D-033** the provider side is *one experience, permission-gated* — a Staff member's "daily schedule" IS the Today dashboard with the owner/admin tiles (payments, data-point extras) gated off. **Merge the flows; design the Today operational screen ONCE and gate up.** The `PTODAY · 02 · Today — live services` screen moves into the unified flow (it's the "Happening Now / In-Progress" board, which is the operational core both roles share). This is also a **screen-count reduction** — exactly the kind of "design once, gate" consolidation that cuts the design + review load.

---

## Core principle — the page ADAPTS to the provider's service mix
Every data point and card renders **conditionally**, from the provider's offered-services config. A walk-only provider never sees boarding counts; a boarding provider sees arrivals/departures. **Don't show a metric for a service they don't run.**

---

## Screen order (top → bottom) — Danny, 2026-07-25; **Board-batch reconciled 2026-08-01**
1. **Title: "Today"** + **date/day navigator** with a `TODAY` badge — ✅ **KEEP day-navigation (Danny, 2026-08-01):** Woof WeTreats has it and Danny pages between days throughout the day. Scope it to **schedule / operations browsing** (look ahead to tomorrow, back to yesterday) — it is NOT a period/reports lens (those numbers stay in Reports). Plus a **notifications bell icon** in the top bar (see §B note — care-task reminders live in Notifications, reached here).
2. **Filter chips** — `All · Arrivals · Departures · Walks · M&Gs` — filter the board below (conditional per offered service). *(Supersedes the "data-point carousel" framing in §A — the per-service today-counts now live as filterable views + the stat row, not a scrolling number strip. Counts should still be glanceable: chips may carry counts.)*
3. **Top stat-tile row** — the two key numbers side by side: **Requests Awaiting** + **Pending & Past Due $** (Danny, 2026-07-31: money back to **TOP**, next to Requests Awaiting — bottom placement looked strange). **Two tiles, no third** (Danny, 2026-08-01). *(This supersedes §C's "payments tile at bottom.")*
4. **§B. The day board** — `Needs attention` → `Scheduled` → `In-Progress` → `Completed` (relabeled "Happening Now / Up Next" in the batch — friendlier; keep the four-status model).
   - **In-Progress cards** use `Card content/Booking` — **adapt it (A8) to add an optional progress line ("Day 3 of 9") + staff-contact line** so the re-base doesn't lose that info (Danny #7, 2026-08-01).
   - **Condensed density on the board** — the Booking card's full "Cancel booking" action is too heavy here; use the compact density on the board, full actions on booking detail (Danny #8).
5. ~~**§C. Payments summary tile at bottom**~~ **SUPERSEDED** — money is the top stat tile (item 3).

> **Also logged 2026-08-01:** **#9** — the Booking card's built-in Cancel duplicated a screen "Cancel booking" ghost (PROV-BOOK-02); **add a `Show cancel` boolean (A9) to `Card content/Booking` and drop the screen ghost** — one source for the action. **#10** — provider switching: **brand-bar tap → the "Your providers" sheet (= MORE·04 Space switcher)**, consistent with the `Brand/Header` chevron + the multi-provider gate (`user_roles_and_permissions.md`). Confirmed.

---

## §A. Data-point carousel — today's counts (NEW)

A horizontally-scrolling row of **small** cards, each a **single quantity for today**. Glance-and-go: "what's the shape of my day."

**Order is fixed (Danny) — render in this sequence, skipping any the provider doesn't offer:**

1. **Dogs here** — count physically present now (boarding + daycare). *(Conditional: boarding OR daycare.)* Point-in-time. **Show it as `X/Y`** — preserves the capacity indicator from the old "In House Tonight" card. The `Y` is the **shared location pool** when one exists (e.g. house `6/8`), else the single service's own cap (boarding `3/5`). See `capacity-model.md` §5.
2. **Arrivals** — dogs arriving today. *(Conditional: boarding offered — count is **inclusive of daycare** if also offered.)*
3. **Departures** — dogs departing today. *(Same condition as Arrivals.)*
4. **Meet & Greets** — M&Gs today. *(Conditional: M&G in use.)*
5. **Walks** — walks today. *(Conditional: walking.)*
6. **Drop-ins** — drop-ins today. *(Conditional: drop-in service.)*
7. **… any other offered service** — appended in config order, same "today count" shape.
8. *(Optional)* **Payments** at the **end** of the carousel — see §C for the tradeoff (recommended: keep the richer tile at the bottom instead).

> **Why Arrivals/Departures need boarding (preserved logic):** boarding **decouples** three numbers — a dog boarding 5 nights is "here" every day but "arrives" once and "departs" once. Daycare collapses them (arrive = depart = today's count), so a **daycare-only** provider gets **Dogs here** but not separate Arrivals/Departures (redundant). Boarding in the mix is what earns those two their own cards.

**Sizing:** compact — a big number + short label. All cards the same shape (single count), which is why the money summary stays a separate richer tile (§C) rather than cramming in here.

### Tap behavior — today-scoped drill (RECOMMENDED — resolves Danny's open question)
Tapping a data-point card opens a **bottom sheet listing that metric's items for TODAY** — e.g. *Arrivals · 4* → the four arriving bookings (dog, time, client, staff), each tappable through to the full booking.
- **Stays operational / today-scoped.** This is "managing the day," which is the page's job.
- ⛔ **Does NOT route to Reports.** Reports is the week/month/quarter/year lens — a different mental mode. Keep this page in "today."
- **Sheet, not board-filter:** one dog can be in several counts at once (here + arrival + in-progress), so a per-metric sheet is clearer than re-sorting the board below.
- Reuse: **one "today detail" bottom sheet** parameterized by metric, not a bespoke sheet per card (component-reuse ladder, `design-system-components.md` §7).

---

## §B. The day board — status sections, in order (Danny, 2026-07-25)

The working surface: booking cards grouped by live status, **in this order**. As a booking progresses, its card **moves down** the board (same behavior as Woof WeTreats).

1. **Needs attention** — the action queue, at the top. Booking **requests awaiting approval** (Pending), plus other today-exceptions needing a decision (e.g. an unconfirmed M&G). This is where "2 booking requests — awaiting approval · oldest 2h ago" lives.
2. **Scheduled** — today's confirmed bookings not yet started (**Upcoming**). *(Renamed from "Schedule".)*
3. **In-Progress** — services **currently happening**: a dog checked in, a walk underway, a boarding stay ongoing, a drop-in in progress. *(Renamed from "In House Tonight" — that wording assumed boarding/overnight; in-progress is service-agnostic.)*
4. **Completed** — bookings **closed out today**: dog picked up, walk ended, drop-in finished. When a provider closes a booking, its card **drops into this section** (Woof behavior).

> **Migrating the old "In House Tonight" card.** Its content had two parts that must not vanish: (a) **capacity `3/5`** → now on the **Dogs here** data point (§A.1); (b) **"evening feed 6:00 PM"** → a scheduled **care-task reminder** (feed/meds times).
> - ✅ **Care-task reminders live in NOTIFICATIONS, not on the Today board (Danny, 2026-08-01).** Today stays focused on **dogs in/out + capacity**; time-based nudges (feed, meds) are exactly what the notification system is for. So the "evening feed" line comes **off** the board.
> - **Add a notifications bell icon to the Today top bar** (in the `Nav/Top bar` right-icon slot, with the search bar) — the entry point through which providers/staff reach reminders. Reuse `Nav/Top bar`, don't build new.
> - Feature timing: scheduled care reminders are a **notification type** — build when the notification system supports scheduled nudges (see `notification_and_communication_system.md`); can be a fast-follow without touching the board.

> **Maps to the LOCKED booking-status vocabulary** (transactions §2.2: Pending · Upcoming · In-Progress · Completed · Cancelled). Needs attention ≈ Pending + exceptions; Scheduled = Upcoming (today); In-Progress = In-Progress; Completed = Completed (today). Cancelled bookings don't appear on the day board.

> ⚠️ **In-Progress card content — corrected 2026-07-28 (from Danny's review of PTODAY·02).** A card seen there mixed **group-level context** ("DAYCARE · 4 DOGS · ALEX ON SHIFT") with a **single booking** ("Brandy") and offered a **"post update"** action. Two fixes:
> - **Don't mix scopes on one card.** The service **count** (4 daycare dogs) belongs in the §A carousel data point, not on each dog's card. Staff = a per-booking assignment ("staff: Alex"). A card represents **one booking**; if a service has many, group them under a **service header** (see decision below).
> - **"post update" = the REPORT CARD, not a messaging/updates feature.** There is **no ad-hoc updates/chat feature** (D-053 keeps in-app chat out of MVP). The provider keeps the client updated via the **report card** (D-046) — a mutable draft they add notes/photos to during the service, which **locks on completion.** So the affordance is "**Add note / photo to report card**," and "last update 11:45 AM" = the report card's last edit time. Do not surface an invented "post update" that implies a status feed.
> - 📋 **Open (Danny):** In-Progress layout — **flat per-booking cards** vs **grouped-by-service** (a service header carrying the count/staff, individual dogs nested). Lean: grouped for high-volume services (daycare), flat for walkers. Log once decided.

---

## §C. Payments summary tile — moved to the BOTTOM (Danny, 2026-07-25)

The tile currently at the top (PENDING $1,180 · PAST DUE $60 · 7 BOOKINGS · **$1,240** · Updated just now). Move it **below Completed**. It's a close-out-the-day financial glance, not a per-item operational count.

- **Big number = today's Earnings** (today's total booking value). **Pending** = the not-yet-paid portion; **Past Due** = overdue; **N bookings** = today's count.
- ⚠️ **Apply the label lock** (`§B2` below / COPY-AUDIT §19): the big number is **Earnings** (today's business), not cash-in-hand — its subtitle/structure must make clear what's Collected vs still outstanding. Never present it as an accounting/collected total.
- **Chevron → payments detail** (today's unpaid list; the deeper trend/accounting view is Reports).
- **Placement tradeoff (Danny's two options):** (a) **bottom tile** — keeps the rich multi-figure layout intact ✅ recommended; (b) **carousel end** — only if reduced to a single figure, else it breaks the carousel's uniform "one count" shape. Recommend **(a) bottom**, optionally with a compact "today's money" chip at the carousel end if you want it glanceable without scrolling.

### B2 label lock (unchanged) — Earnings vs Collected
| Term | Subtitle | Meaning |
|---|---|---|
| **Earnings** ("Today's Earnings") | *value of services today* | business-pulse; **NOT accounting**. |
| **Collected** | *paid against invoices* | money received; the accounting number. |

⛔ Copy must never present Earnings as accounting/tax income — Collected is the money figure. Consistent with COPY-AUDIT §17/§19 and `provider-reports.md`.

---

## Metric definitions — nail these so counts are unambiguous
| Metric | Definition |
|---|---|
| **Dogs here** | physically present now (boarding + daycare). Point-in-time. |
| **Arrivals / Departures** | dogs arriving / departing today across boarding **+ daycare**. Only if boarding offered (boarding decouples them; daycare-only collapses them into its single count). |
| **Meet & Greets / Walks / Drop-ins / (other)** | today's count for that service (conditional on it being offered). |
| **Today's Earnings** | value of services delivered today — business-pulse, NOT accounting. |
| **Collected** | payments received against invoices. The accounting number. |
| **Pending / Past Due** | today's unpaid portion / overdue balance surfaced on the payments tile. |

---

## Multi-period trends live in REPORTS, not here
The Earnings-vs-Collected trend chart, the report card (today/week/month), the per-service **volume graph** (dogs billed per service per day, for staff planning), and write-offs-by-period all belong to **`provider-reports.md`** — that page owns the date picker and the period lens. This page stays "today." *(These were sketched here in the 07-21 draft; relocated 07-25 so Dashboard and Reports don't overlap.)*

---

## Open (Danny / build)
1. ✅ ~~Data points + order~~ — resolved: carousel, fixed order, conditional per service (§A).
2. ✅ ~~Section order / renames~~ — resolved: Needs attention → Scheduled → In-Progress → Completed (§B).
3. ✅ ~~Payments tile placement~~ — resolved: bottom (§C), carousel-end optional.
4. ✅ ~~Data-point tap behavior~~ — resolved: today-scoped bottom sheet, not Reports (§A tap).
5. Conditional-display logic reads the provider's **offered-services** config — confirm that's the source of truth for which data points / cards appear. *(Assumed yes.)*
6. "Needs attention" contents beyond booking requests — confirm what else routes here (unpaid-ending-today? unconfirmed M&G?). 🏗️ refine with build.
7. Fable rework of node `3168:9` to this structure — prompt to follow.

## Why it matters
Competitive wedge #4/#5 (a dashboard providers actually use; transparency clients love). Danny's daily Woof use makes this **validated**, not speculative — a today-first operational board + a clean handoff to Reports for trends is exactly the "built for *their* business" feel we keep leaning on.
