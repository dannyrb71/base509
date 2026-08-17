# Design System — component structure & naming (2026-07-21)

**Purpose:** one shared vocabulary so components are reused, not re-drawn. Fable applies Figma DS best practices **within** this taxonomy — it does not invent its own categories.

**The principle (replaces the abandoned "atomic" naming):**
> **If a pattern appears twice, it's a component. Build with nested components + properties, not copies.** We keep the *reuse* discipline of atomic design; we drop its atoms/molecules/organisms vocabulary (it clashed and confused). Categories below are **by function**, not by "level."

---

## 0. Typesetting — casing conventions (Danny, 2026-08-01)

**Danny's rules (locked):**
- **Service / product names = Title Case:** Boarding · Daycare · Walking · Drop-In · House Sitting · Meet & Greet (hyphenated → capitalize both parts, e.g. Drop-In; ampersand kept, e.g. Meet & Greet).
- **Page / screen / nav titles = Title Case:** Home · Bookings · Schedule · Calendar · Today · More · Reports · Notifications · Team Directory · App Settings · Settings · Pets · Clients.
- **Brand name — "PetAppro" in text, "Petappro" (lowercase) for the LOGO only (Danny, 2026-08-01):** all running text / prose / UI body / ad copy = **PetAppro** (capital A). Only the stylized logo wordmark is lowercase "Petappro." (Fix any body copy that reads "Petappro" — e.g. the social ad's "the Petappro app" → "the PetAppro app.")

**Companions (so Title Case doesn't over-apply — proposed, confirm):**
- **Actions / buttons / inline UI = sentence case** (first word capitalized only, plus any proper noun/service name inside): "Book a service," "Send reminder," "Check in," "Manage series," "Record a payment." ✅ matches existing convention + the locked "Check in / Check out" verbs.
- **All-caps section labels** (NEXT BOOKING · NEEDS ATTENTION · SELECT SERVICE) keep their own all-caps treatment — a style, separate from title casing.
- **Status vocabulary is locked** (Pending · Past Due · Completed · In-Progress · Refunded…, transactions §2.2) — follow it, don't re-case.

*(Applies app + web. Cross-ref COPY-AUDIT for website copy when that batch commits.)*

---

## 1. Category taxonomy — slash-named (the slash groups them in the Assets panel + right-panel dropdowns)

| Category | Holds | Examples |
|---|---|---|
| **Foundation** | tokens + styles (not components) | color variables, type styles, spacing, radius, effects |
| **Button** | actions | `Button/Primary` · `/Secondary` · `/Ghost` · `/Icon` |
| **Control** | inputs | `Control/Toggle` · `/Checkbox` · `/Radio` · `/Stepper` · `Field/Text` · `Field/Select` |
| **Badge** | status/label chips | `Badge/Status` · `Badge/Service` *(already organized — keep)* |
| **Nav** | top/bottom chrome | `Nav/Top bar` · `Nav/Tab bar` · `Nav/Section header` |
| **Card** | the card system (§2) | `Card/Base` + `Card content/*` |
| **Feedback** | system states | `Feedback/Loading` · `/Empty state` · `/Toast` · `/Banner` · `/Alert` |
| **Brand & media** | provider brand + media | `Brand/Logo holder` · `Media/Avatar` · `/Photo` · `/Map` |
| **Overlay** | layered surfaces | `Overlay/Sheet` · `/Modal` · `/Interstitial` |

---

## 2. ⭐ The Card system — Danny's pattern, formalized

**Danny already built this correctly:** one card base + an inner content holder that gets **instance-swapped**. Keep it; here's the naming.

- **`Card/Base`** — the shell only (surface, radius, padding, optional press state). One property: **`content` = instance-swap** → any `Card content/*`. *(Optional: `pressable` boolean, `surface` variant.)*
- **`Card content/*`** — the swappable inner pieces: `Card content/Booking` · `/Payment` · `/Pet` · `/Client` · `/Report` · `/List row` · etc.

### Client vs. staff — ONE set with a `view` property (recommended), NOT two audience sets

**Recommendation:** a booking card is a booking card; the *audience* is a **property**, not a separate component.
- `Card content/Booking` with **variant property `view: Client | Staff`** — Staff adds check-in/out + edit actions; Client shows status only. Same component, one place to update.
- Add **boolean properties** for optional rows (`show price`, `show pet count`) and **instance-swap** for the embedded `Badge/Status`.
- **Exception:** split into separate components only if client and staff versions are *radically* different (not just a few rows). Default to one + `view`.

**Why one set beats two:** the base is shared; splitting by audience duplicates it and fragments the picker. A `view` property is one dropdown flip in the right panel — exactly the "easy to update" Danny wants.

### List cards
`Card content/List row` — booleans: `chevron` (right chevron on/off), `badge` (on/off) + instance-swap the badge; text properties for label/sublabel. (Danny already built this shape.)

### Report-card (Care report) header — standardized (2026-08-01)
The `Card content/Care report` header renders **In / Out times on line 1**, then **`duration · distance` on line 2** (e.g. `In 2:00 PM · Out 2:45 PM` / `45 min · 2.1 mi`). **Duration appears ONCE** — do not also put it in the In/Out line (an earlier render duplicated "45 min"). One component, one header layout everywhere the report card shows (preview, submit, owner view).

**Branded + shareable (Danny, 2026-08-01).** The report card carries the **provider brand header** (via the existing **`Brand/Header`** component — logo/tinted/text per the logo entitlement; don't build a report-card-specific header) because it's a **shareable artifact** (D-053 native share) — an owner posting it to social gives the provider free exposure.
- ⭐ **Attribution text = "Powered by PetAppro"**, **TIER-GATED — removed at CREW and up** (Danny, 2026-08-01): **Starter · Solo · Duo SHOW "Powered by PetAppro"; Crew · Team · Enterprise remove it.** One card component with a conditional attribution element the tier entitlement flips — **NOT separate report-card versions.** *(Cutoff moved from "paid tiers" → Crew+ after Danny reasoned Solo's real upgrade driver is the client-cap, not branding — see pricing-tiers matrix + D-020.)* Distinct from **"own branding / logo,"** which is available to **all tiers** (the provider's name/logo/theme show for everyone via runtime theming; only the co-branding mark is tiered). ⛔ **The social ad is NOT tier-gated — always PetAppro-branded** (acquisition surface; the client must download the PetAppro app regardless of the provider's tier). *(Propagate to COPY-AUDIT §14 when the apps/web batch commits.)*
- **D-029 note:** on a shared card keep the **provider brand dominant** so it never reads as "PetAppro provided this service" — we're the software, not the provider.
- Confirm the shared render excludes any sensitive data (it shows pet name, times, care data, notes, photos — no client PII; keep it that way).
> ✅ **Care-data layout — LEAVE AS-IS (Danny, 2026-08-01).** Keep the two-column layout (counts left, checks right). It's **raw data generated by the walker/provider's `+`/`−` inputs** and is **easy to scan** in this format. Do NOT group into a merged "care-summary" block. *(Optional: a small "Care" section header — Danny's discretion.)*

### Compact-card socialization-badge truncation (Danny, 2026-07-31; **"Temperament" renamed → "Socialization" 2026-08-01** — component `Badge/Temperament` → `Badge/Socialization`, applies everywhere the behavior tags appear)
The **full pet profile** shows **all** socialization badges. **Compact / selection cards** (e.g. picking which pets to include in a request) are space-limited — rule:
- **Show up to 2 badges, then a "…"** when there are more.
- **Priority order — safety-critical first.** **`Reactive`** and **`Resource Guarding`** are **tier-1** and lead when present; if neither is present (or a slot remains), fall through to the rest by the badge priority ranking. Truncation must be **deterministic**, not first-in-array.
- 🏗️ **Define the canonical socialization-badge priority ranking** (tier-1 safety-critical → behavioral → informational) once, in the pet data model / the `Badge/Socialization` component — so every compact surface truncates the same way. Reactive + Resource Guarding = tier-1.
- This is a **component behavior** (the badge-row component decides what shows), not a per-screen decision — set once, applies everywhere it's used.
- **Full pet profile shows ALL socialization tags (Danny, 2026-08-01) — never truncated there.** With 3+ selected, display them in full via a **wrapping row** (chips wrap to multiple lines — recommended, everything visible at once, no swipe) or a carousel. Truncation (2 + "…") is **only** for compact/selection cards, never the profile.

---

## 3. Property patterns (Figma) — how "reusable" is actually achieved

| Need | Figma mechanism |
|---|---|
| Show/hide an icon, chevron, badge, row | **Boolean property** |
| Swap inner content (card content, right-side icon) | **Instance-swap property** |
| Editable label without detaching | **Text property** |
| Audience / state / size options | **Variant property** (`view`, `state`, `size`) |
| A family of related states | **Component set** (variants grouped) |

⛔ **Never detach an instance to make a one-off.** If it needs to differ, add a property. If the property doesn't exist yet, that's a signal to extend the component — flag it, don't detach.

---

## 4. Reusables to enforce NOW (named)

- **`Nav/Top bar`** — booleans: `back chevron`, `search field`, `right icons`; instance-swap the right slot. (Danny built this — formalize the name.)
- **`Feedback/Loading`** — the loading animation Danny made (rename from `loading - animation`).
- **`Card/Base` + `Card content/*`** — §2.
- **`Card content/Booking`** with `view: Client | Staff` (Danny's `booking/staff-view` becomes `view=Staff`).
- **`Badge/Status`, `Badge/Service`** — keep as-is.
- **`Brand/Logo holder`** — property **`mode: Logo | Tinted | Text`** (the three provider-brand rendering variants from the branding work). This is the reusable that carries provider branding onto every client-facing screen; build once, use everywhere.

---

## 5. Component-page organization (Danny's rule)
Keep component/style pages **visually tidy**: a **grid**, **top-aligned** per group, one **section frame per category** (matching §1). New components go into their category section, not dropped anywhere. A messy component page is how duplicates get made — you can't reuse what you can't find.

---

## 6. When Fable must STOP and flag
- It's about to **detach** an instance → stop; add a property instead.
- A pattern appears a **2nd time** with no component → stop; make the component (in the right §1 category).
- It wants a **new category or naming pattern** not in §1 → stop; propose it, don't freelance.

---

## 7. Operating mode — design as a system-builder (standing instruction)

The components already built (flows 03–06 and elsewhere) are the **reference library** and the **established pattern**. Every new flow is designed *through* that library, not alongside it. As each screen is designed, run this ladder **in order** for every element:

1. **Reuse.** An existing component covers it → drop an instance. (Check the library first, always.)
2. **Adapt.** It *almost* fits → **add a property** (boolean / instance-swap / variant / text) so the one component now covers the new case. One component, more properties — never a near-duplicate.
3. **Build.** A repeated element (appears ≥2×) has no component → build it, in its §1 category, named per the doc, with properties not duplication. **Nest** existing components inside it where natural (a card content nests a badge, a nav bar nests an icon button).
4. **Icons.** A needed icon doesn't exist → add it as a proper icon component in the icon set, matching the established style (outline, consistent sizing/stroke).
5. **Flag.** A new *category* or naming pattern seems needed → propose it and stop; don't freelance the structure.

**Report per flow:** reused · adapted (which property added) · newly built (name + category) · new icons · anything flagged. This is the standing preamble for ALL design work, including the hi-fi Screens pass.

---

## 8. Sequencing — plan the library BEFORE the build, then re-base everything onto it (Danny, 2026-07-21; expanded 2026-07-31)

The problem this solves: Fable was designing each screen ad-hoc instead of composing from the library, which made **every screen novel → every screen a full review → Danny the bottleneck.** Fix = design ~10 patterns, instantiate the rest; review becomes compliance-checking, not critique.

Order:
1. **Component audit + screen archetypes** — survey EVERY wireframe/designed flow, map each pattern to an **existing** component (reuse map), and propose the small set of **screen archetypes/templates** (List · Detail · Form · Board · Selection · Settings · Empty/Loading/Error + domain ones). Also flag **consolidations** (same screen at different permission levels → design once, gate — e.g. Flow 45 Today = Flow 27 Staff schedule, D-033). **Recommendation only — no building.**
2. **Danny approves** the inventory + archetypes once (the one expensive review; a whiteboard, not 100 screens).
3. **Rework the ALREADY-DESIGNED screens onto the locked library (Danny, 2026-07-31).** Not a redesign — a **re-base**: keep the good visual result, swap ad-hoc / one-off elements for the shared components, fix drift, apply consolidations. Work in **batches by archetype** (all List screens, all Detail screens…), not screen-by-screen, so review batches too.
4. **New screens** are instantiated from the approved archetypes going forward (§7 ladder).

> ✅ **Audit APPROVED 2026-07-31 → `docs/specs/petappro-component-audit.md` is the canonical inventory + archetypes + consolidation list.** Locked: zoned base **rejected** (slot-based `Card content/List row` stays canonical, N2 not built); adapts **A1–A7** + **N1 `Control/Toggle row`** approved; M&G badge word **"Offered"**; the two `Card content/Activity` sets **consolidate** to the more complete one. Rework (step 3) now proceeds against this.

Review model: **Cowork does the first-pass compliance check** (components correct? content matches spec? flags legit?) and hands Danny an "approve these / decide these few" summary. Danny only adjudicates flagged exceptions + content/logic — never every pixel. Each screen ships a compliance line (reused / adapted / built / flagged) so ad-hoc is visible, not silent.

Front-loads pattern-finding to the cheapest moment (a whiteboard, not 100 designed screens).
