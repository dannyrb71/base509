# Provider Reports — spec (2026-07-25)

**Built off the Woof WeTreats reports page** (`reference/woof-wetreats-reference/web/app/staff/reports/page.tsx`), which is proven in daily use. This spec **generalizes** it to the PetAppro service engine and **multi-tenant** model, and adds what Woof's page lacks: write-offs by period, tips as a separate line, and QuickBooks-friendly export.

Related: `provider-dashboard.md` (dashboard = at-a-glance today/pulse; **Reports = detailed, historical, period-filterable** — this file), `transactions-payments-and-invoicing.md` (§2 status/adjustments, §4 invoice numbering, §0 tips subledger). This spec **absorbs** the "Reports requirements" collector note in the transactions spec §2.6.

---

## 0. Principles

1. **Dashboard vs Reports.** Dashboard answers *"what's happening today / how's the pulse."* Reports answers *"show me the numbers over a period, filter and compare them, and let me export."* Don't duplicate — link.
2. **Adapts to the service mix** (same rule as the dashboard). Every service-specific breakdown renders **only for services the Provider offers** — derived from their config, never hardcoded. Woof hardcodes boarding/daycare/cash/venmo; PetAppro derives services, payment methods, and rate dimensions from data.
3. **We report; the Provider's CPA advises.** Reports present figures accurately. They do **not** compute or advise on tax treatment. Every accounting-adjacent number carries this posture.
4. **Multi-tenant + permission-gated.** All report data is scoped to the Provider's `business_id` at the DB (RLS), and the Reports surface is gated to **admin/manager** (same bar as refunds/write-offs; Woof gates on `is_admin`). A client login can never reach it.
5. **Everything exports.** See §5 — every report is downloadable as CSV; financial reports additionally in a **QuickBooks-friendly** shape.

---

## 1. Global controls (keep Woof's — they work)

- **Period increment:** `week · month · quarter · year` (segmented control). *(Same increments as the dashboard graph §B4 — keep them identical.)*
- **Period navigation:** `‹ [period label] ›` — step back/forward one increment; label reads "Mar 3–9", "March 2026", "Q1 2026", "2026".
- **Compare:** `none · vs. previous · vs. last year (YoY)` — drives the ± delta on every KPI.
- **Service filter:** `All services` + one entry **per offered service** (Woof: all/boarding/daycare → generalize). Filters every metric and the export.

---

## 2. KPI scorecards (top strip)

Each card: label · value · ± delta vs. the comparison period (green up / red down; "new" when prior = 0). From Woof, generalized:

| KPI | Definition | Notes |
|---|---|---|
| **Earnings** | value of services **delivered** in the period (multi-night bookings accrued pro-rata across nights) | ⚠️ **Label = "Earnings," matching the dashboard lock** (`provider-dashboard.md` B2). Woof calls it "Earned" — rename on the way in. Business-pulse, NOT the accounting number. |
| **Collected** | payments **received** in the period | The accounting-relevant money-in figure. |
| **Bookings** | count of bookings (by service date) in the period | |
| **New clients** | distinct new clients in the period | |
| **Avg booking** | mean booked value in the period | |
| **Tips** | tips received in the period — **separate line, never folded into Earnings/Collected** | New vs Woof. Ties to the tips subledger (transactions §0). Tips are appreciation for service, tracked apart from service revenue. |
| **Write-offs / bad debt** | receivable marked uncollectible in the period (§2.4) | ⭐ **New vs Woof — Danny, 2026-07-25.** First-class KPI, shown by the same period increment as everything else. **Provider-internal only** — never client-facing. |

> **Referral $** KPI — **KEPT** (Danny, 2026-07-25). Referral discounts stay a first-class, at-a-glance number. The general **Discounts** total is separate and drills into a by-type breakdown (§2a) — referral is one type among others.

### 2a. ⭐ Every KPI tile is tappable → a detail view (Danny, 2026-07-25)

Tapping a KPI opens a drill-down. This is the page's core interaction and carries the "incremental" theme: a total on the tile, its composition one tap deeper. Three detail shapes — a tile uses whichever fit (often more than one in the same view):

**A. Finer-increment time breakdown** *(for numeric totals: Earnings, Collected, Bookings, New clients count, Tips, Write-offs).* The total splits into the **next-finer time buckets** than the active period:

| Active period | Break the total down by |
|---|---|
| **Week** | day |
| **Month** | day *(weekly subtotals optional)* |
| **Quarter** | month *(or week)* |
| **Year** | month *(or week)* |

So a week of Earnings shows each day's Earnings; a year of Bookings shows each month's count. Rule: **one level finer** (week/month → day; quarter/year → month), consistent with the graph increments (§B4/§1).

**B. Record list** *(for entity metrics).* The detail lists the actual underlying records:
- **New clients** → the list of those new clients (name, first-booking date, value).
- **Bookings** → the list of bookings in the period (alongside the by-day counts from A).
- **Write-offs** → the written-off invoices (invoice no, client, amount, reason) — mirrors the Financial tab detail.

**C. Categorical breakdown** *(for composed totals).*
- **Discounts** → broken out **by discount type** (referral · long-stay flat-rate · comp/price-override-to-$0 · other) — each a line with its amount. *(Reason codes already exist — transactions §2.5–2.7 — so this is a rollup, not new plumbing.)*
- **Collected / Booked value** → by payment method (card · cash · other).

> **Design note for Fable:** this is one reusable **"KPI detail" overlay/screen**, parameterized by which shape(s) a given tile uses — not a bespoke screen per tile. Build it once (Card/Base + a detail content that swaps time-list / record-list / category-list), per the component-reuse ladder (`design-system-components.md` §7).

---

## 3. Report sections (tabs)

Woof's four tabs — **Revenue · Bookings & Demand · Customers · Rate Mix** — plus a new **Financial / Accounting** tab that houses the adjustment and write-off detail.

> ⭐ **Chart animation — match Woof (Danny, 2026-07-25).** Charts must **animate the way Woof's do now**: lines draw in, bars grow up, pie/donut slices sweep — on initial load **and** on every period/filter change. Woof gets this free from Recharts' default entrance animation (`isAnimationActive`, ~1.5s ease). PetAppro's charts (mobile = React Native; whichever charting lib is chosen) must reproduce that same entrance feel — not static snap-in. Treat it as a spec requirement, not a nice-to-have; it's part of what makes the page feel alive.

### Revenue
- **Earnings vs. Collected** line chart across the period's buckets *(Woof's core chart — keep verbatim, relabel Earned→Earnings)*.
- **Earnings by service** — pie/bar, **one slice per offered service** (Woof: boarding/daycare).
- **Booked value by payment method** — derived from actual methods (Stripe card, cash, and any others), not hardcoded cash/venmo.
- **Tips by service / by period** — separate from service earnings.

### Bookings & Demand
- **Bookings over time** bar chart.
- **Median lead time** (booking → service date) for the period.

### Customers
- **New vs. returning** split.
- **Booking cadence** — median days between a client's bookings.
- **Top clients** this period — ranked by booked value.

### Rate / Unit Mix *(conditional, per service)*
- Woof shows boarding **nights by rate type** (Regular / Extended 8+ / Holiday). Generalize: **units by pricing dimension per service**, driven by the service's `pricing_model` (e.g. boarding regular/extended/holiday nights; walking 30/60/90 duration tiers — D-022). Render only the dimensions a service actually uses.

### ⭐ Financial / Accounting *(new tab)*
The bookkeeping view — everything a Provider (or their CPA) needs, by the selected period increment:
- **Gross → discounts → net** *(with the gross-receipts labeling caution — transactions §2.7 reporting note: our "gross" is billed-after-discount, not tax "gross receipts").*
- **Adjustments rolled up by reason code:** Discounts · Corrections · **Bad debt (write-offs)** · Long-stay flat-rate — as **separate numbers** (transactions §2.5–2.7). The whole point of reason codes is that these never blur together.
- **Write-offs / bad debt — by time increment** (day within period / week / month / quarter / year). ⭐ Danny's core ask: a Provider must see "bad debt this month / quarter / year" at a glance, not a lifetime total.
- **Aging / past-due balances** — outstanding receivables by age bucket (standard across the category; ties dashboard B1/§2.3).
- **Invoices issued** — list with the §4.2 invoice numbers (`WOO-0417-26-00001`), amounts, status.

---

## 4. Data source

Woof reads two admin RPCs — `get_analytics_bookings`, `get_analytics_payments` — then computes everything client-side (accrual, buckets, rate mix). For PetAppro:
- Same shape, but **`business_id`-scoped** and returning the extra fields: **tips, write-off/adjustment events with reason codes, invoice numbers, payment method (generic)**.
- Accrual logic (earn multi-night bookings pro-rata across nights) is **already correct in Woof** — reuse it. It's the same math as dashboard Earnings and must not diverge; ideally it lives in the shared pricing/booking package, not re-implemented per surface.
- Cancelled bookings contribute **0** to Earnings (Woof already does this).

---

## 5. Export — every report, CSV, QuickBooks-friendly ⭐ (Danny, 2026-07-25)

**Floor: every report downloads as CSV.** Woof already exports the current view's bookings (`dropoff, pickup, service, status, dogs, payment, total, referral_discount, new_client, created`). Keep that as the raw-data export, generalized to the service engine.

**Target: financial exports in a QuickBooks Online–friendly shape.** "Friendly" = columns and formats that **import cleanly into QBO's native CSV importers** — not a claim that we do their accounting.

- **Formatting rules (apply to all financial CSVs):** dates `MM/DD/YYYY`; amounts plain decimals (no `$`, no thousands separators); one **line item per row** (multi-line invoices repeat the invoice number); UTF-8; stable column headers.
- **Invoices export → QBO Invoice-import template.** Map our fields to QBO's invoice import columns (InvoiceNo, Customer, InvoiceDate, DueDate, Item/Service, Description, Qty, Rate, Amount). **`InvoiceNo` = our §4.2 number** (`WOO-0417-26-00001`) — the frozen, per-provider sequence is exactly what QBO wants as a stable key.
- **Payments/sales export** — collected payments for the period (maps to QBO sales receipt / bank-transaction import).
- **Write-offs / bad debt export** — clean list (invoice no, client, amount, date, reason) the CPA books as a credit memo / bad-debt expense. We **list it; we don't book it.**
- **Tips export** — separate file; treatment (income vs pass-through) is the Provider/CPA's call.

> **Positioning (hold the line):** "**QuickBooks-ready** invoices export" is the aspiration — a file that imports without hand-editing. The **floor** we commit to is "**QuickBooks-friendly**" — clean, well-formed CSVs that map to QBO's importers with documented column mapping. ⛔ Do **not** market or imply we *do* the provider's books, file taxes, or sync live to QBO (a live QBO API sync is a post-MVP add-on — see roadmap SMS/QuickBooks add-on line). We export; they import.

---

## 6. Generalization checklist — Woof → PetAppro (don't copy the dog-specifics)

| Woof hardcodes | PetAppro derives from |
|---|---|
| `service_type: boarding \| daycare` | offered-services config (any service) |
| `payment_method: cash \| venmo` | actual methods incl. Stripe card |
| Rate types Regular/Extended/Holiday | each service's `pricing_model` dimensions |
| `referral_discount` field | reason-code rollup (discounts) |
| `dogs_count` column | generic unit/headcount per service |
| — (no tips) | **tips subledger — separate line** |
| — (no write-offs) | **bad debt by reason, by period** |
| single-tenant, `is_admin` | `business_id` RLS + admin/manager gate |

---

## 7. Open / to confirm
- ✅ **Referral $ KPI** — resolved: **kept** as its own KPI; the general Discounts total drills into a by-type breakdown separately (§2, §2a).

**Build-time notes (no decision needed from Danny):**
1. **QBO import template exactness** — confirm the current QBO invoice-import column set when building the mapping (QBO changes it periodically). Friendly CSV ships regardless; the exact-map "ready" export is a fast-follow if the template shifts. *(QBO-docs check at build, not a product decision.)*
2. **Live QuickBooks sync** = explicitly **post-MVP add-on** (roadmap), not this spec. Reports export is the MVP path.
3. Reconcile the accrual/earn math into the shared package so dashboard Earnings and report Earnings can never diverge (§4). 🏗️ build note.
4. Chart-library choice (mobile) must support Woof-style entrance animation (§3). 🏗️ build note.

## Why it matters
Reporting is a competitive wedge (providers cite weak reporting and clumsy exports in rival reviews — competitive-analysis). Woof's page already beats much of the category; generalizing it + a QuickBooks-friendly export + bad-debt-by-period makes month-end and CPA handoff genuinely easy — the kind of "built by someone who runs this business" advantage we keep leaning on.
