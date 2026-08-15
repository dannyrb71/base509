# PetAppro Website Copy — Audit Checklist (single source of truth)

> **Purpose:** the one list every piece of site copy must satisfy. Fable self-checks Figma copy against this; Cowork verifies. Keeps both in sync without a live channel.
> **How to use:** Fable dumps current Figma copy to `apps/web/copy/figma-current.md` → checks it line-by-line against this → fixes obvious violations → flags anything ambiguous. Cowork reviews the dump against this + latest decisions, returns one consolidated fix-prompt. Repeat once to verify.
> **Last updated:** 2026-07-18. When a decision changes, update THIS file first.

---

## 1. Theme roster — LOCKED
Exactly these 10, spelled/named exactly:
**Brandy Blue** (default) · **Chessie · Irish Setter · Husky · Bichon Frise · Blue Heeler** (breeds) · **Bark Avenue NY · South Bark Miami · Hollywoowoowood · San Fursisco** (cities).
- ❌ NO **Poodle** (replaced by Bichon Frise). ❌ NO **Pawk Avenue** (reverted to Bark Avenue). ❌ No invented breeds.
- Light + dark each.
- 🔒 **THEME NAMES AND FONTS ARE DANNY'S TO SET — agents do not change, assign, propose, or "correct" either.** Source of truth = the Figma **Typography Collection** + **Themes Collection**.
  **Assigned by Danny (2026-07-19):** Brandy Blue = **Poppins** · Chessie = **Noticia Text** · Blue Heeler = **Roboto** · Hollywoowoowood = **Manrope**. Remaining themes already carry their own fonts in the Figma collections.
  ❌ Do NOT propose fonts. (An earlier §1 line was misread as "assign 10 fonts" and spawned an unwanted proposal.)
- **Exact city names include the suffix:** **Bark Avenue NY** and **South Bark Miami** (the "NY"/"Miami" is part of the name, not a caption). **Hollywoowoowood** and **San Fursisco** stand alone. ❌ No stripping, no captions, no re-litigating.

## 2. Theme tier entitlements — LOCKED
- **Starter** (free): Brandy Blue only
- **Solo** (first paid): + Husky, Irish Setter
- **Duo**: + Bichon Frise, Blue Heeler, Chessie (= all breeds)
- **Crew**: all themes incl. cities + seasonal
- **Team**: same themes as Crew
- **Enterprise**: custom / own-brand
- ❌ Don't group Starter & Solo (they differ). ❌ Crew adds CITIES, not breeds.

## 3. Pricing cards — each sells its OWN reason to climb
No card may lead with a benefit a cheaper tier already has.
- **Starter** — free on-ramp (≤5 clients, your logo/brand, "Powered by PetAppro")
- **Solo** — **unlimited clients** (the cap lifts) + your first themes (Husky, Irish Setter). *(NOT "no Powered by" — that's Crew; Danny 2026-08-01.)*
- **Duo** — in-app payments + tips unlock
- **Crew** — full theme library (cities) + GPS + **removes "Powered by PetAppro"** co-branding
- **Team** — biggest team (up to 20 seats, roles)
- **Enterprise** — custom brand + full white-label isolation
- ⚠️ **Own branding/logo is on EVERY tier** (incl. free Starter) — don't gate "your brand" behind a paid tier; the paid branding perk is **removing "Powered by PetAppro" (Crew+)**. GPS ships **at launch** (Crew+, D-054) — not "v1.1." SMS is **post-MVP** — don't put it on cards.
- ❌ Team must NOT lead with "full theme library" (Crew has it). ❌ Don't promise in-app messaging on cards (post-MVP).

## 4. No absolutes in marketing copy
- ❌ No **ever / never / always / forever / guarantee** as forward promises.
- ✅ Present tense: "we take no cut," "no commissions," "you keep every dollar," "No cut," "We take nothing."
- **Starter is "Free" — NOT "Free forever"** (Danny, 2026-07-19). The "up to 5 clients" cap carries the message; "forever" is a forward promise we don't make.

## 5. No competitor names — ever, anywhere public
- ❌ Never name Rover / Wag / Time To Pet / Scout / etc. State what WE do/don't do, generically.

## 6. No vetting / no endorsement (D-058)
- ❌ No "verified / trusted / certified / approved / screened / background-checked" badging.
- ❌ No PetAppro-authored ratings, rankings, "top provider."
- ✅ We don't vet providers; that's a stated position, not a hidden one.

## 7. Not a marketplace (D-029)
- Booking software the provider runs. ❌ No directory, discovery, matching, "find a sitter."

## 8. Two-sided fee honesty (pricing "THE HONEST PART")
- Headline: **"Nothing hidden, nothing extra."**
- Cards: **No commissions · Flat, predictable tiers · No fees for your clients.**
- ❌ NOT "No per-staff fees / adding a teammate isn't a surprise" (false — tiers are by user count).
- ✅ Client card includes "you both see the same total."
- **⚠️ APPLIES SITE-WIDE, not just this section.** The same false claim anywhere is banned — e.g. the Home "Flat pricing" card's *"no nasty surprise when your team grows."* Correct framing: **"one price per tier, not per head — you always know it before you grow."**
- **Tips are not plan-gated.** Tipping is a function of taking payment in the app via Stripe, so it exists wherever in-app payments do. Providers without in-app payments still get tipped — directly, outside the app. ❌ Never write tips as "Duo and up" or imply lower plans can't receive them. Applies to **all FAQ and copy surfaces**, including the **Pricing page FAQ**.

## 9. Legal / policy pages
- ❌ NO AI-written legal copy. Policy pages = styled SHELL + DRAFT placeholders only. Attorney-gated.

## 10. Waitlist mode (D-061 — portal not live at launch)
- **Sign up** = waitlist email capture + a **hidden Sign in** link.
- **Download** = "Notify me" (no live store links).
- **ONE primary CTA label site-wide** — no "Start here" + "Start Now" + "Start free" + "Free starter account" spread. Pre-launch it must be **honest**: a button can't say "Start free" when the destination is a waitlist. **Default: "Get early access"** (flips to "Start free" once the portal is live). Download keeps "Notify me"; Sign-up form submit keeps "Join the waitlist."

## 19. Status vocabulary — LOCKED (Danny, 2026-07-21)
Use these exact words on every screen showing a booking or a charge. Canonical source: transactions spec §2.2.

- **Booking status:** Pending · Upcoming · In-Progress · Completed · Cancelled
- **Payment status:** Pending · Due · Past Due · Paid · Refunded · **Written off (never shown client-side)**
- ❌ Never "Outstanding" for a mix of pending + past-due. Aggregate = **"Pending & past-due charges."**
- ❌ Never "Not yet due" — say **"Pending."**
- Booking status and payment status are separate pills, never merged.

## 17. Never minimize a Provider's money
> **"'Small' is not small to them."** (Danny, 2026-07-20)

Our providers are solo and often paycheck-to-paycheck. **PetAppro never decides what counts as a small amount of their money** — a $15 remainder may be gas money or a meal.

- ❌ Never describe money owed to a Provider as **small, minor, trivial, negligible, "just," or not worth chasing.**
- ❌ No feature, prompt, or nudge that suggests writing off or forgiving an amount *because it's small* — that's still a client who didn't pay. *(This is why the category-standard "small balance" write-off reason was rejected — see transactions spec §2.8.)*
- ✅ State amounts plainly and let the Provider decide what matters.

Applies to app UI, marketing copy, notifications, and support content alike.

## 15. Feature-timing accuracy
- **GPS walk tracking ships AT LAUNCH**, available **Crew and up** (D-054 — GPS is a hard launch gate; the date flexes rather than cutting GPS).
- ❌ Stale "lands in v1.1" / "when it ships" / "coming soon" GPS language must go — it appears on **Home** ("Opt-in walk tracking — Real walk tracking lands in v1.1") and the **Crew pricing card** ("plus GPS walk tracking when it ships"). The Support FAQ is already correct.
- ⚠️ `pricing-tiers-and-features.md` still tags GPS `[v1.1]` in the matrix — **reconcile with D-054** (Codex).
- **SMS is NOT in the MVP (D-008).** SMS is a **post-MVP add-on** (TCPA + A2P 10DLC consent work isn't built). ❌ No app screen — reminder composer, notification settings, payment reminders (PROV-REMIND), etc. — may offer **SMS as a live channel** at launch. MVP reminder/notification channels are **push + email (free, all tiers), always backed by the in-app list**. When SMS eventually ships it is **top-tier (Crew/Team, D-049)**, opt-in, never a default. *(Caught 2026-07-25: PROV-REMIND showed "SMS delivery is available on the Pack plan" — a deferred feature surfaced as shipping.)*
- General rule: don't advertise a feature as coming later if it ships at launch, and don't advertise unreleased features in **App Store listings** (Apple 2.3 — website is fine, store metadata is not).

### 15a. Tier names — LOCKED
Plan ladder is **exactly**: **Starter · Solo · Duo · Crew · Team · Enterprise**. ❌ **"Pack" is NOT a tier** (nor any other invented name). Any UI/screen/copy naming a plan must use one of these six. *(Caught 2026-07-25: PROV-REMIND invented a "Pack plan.")*

## 16. Screen mockups — disclaimer required
**Anywhere app screens are shown** (marketing site, decks, social, pre-launch material), a disclaimer must appear.

- **Standard:** *"Illustrative screens with sample content. What you see in the app varies by provider, plan, and theme."*
- **Short (captions/tight space):** *"Illustrative screens — sample content."*
- **Fuller (pre-launch / investor-facing):** *"Screens shown illustrate PetAppro's visual style using sample content. Actual data, pricing, available features, and appearance vary by provider, plan, and selected theme. Product is in active development and subject to change."*

**Rules:**
- **Once per section is enough** — not under every image.
- **Must be legible.** Small and muted is fine; unreadable grey-on-grey is not — an unreadable disclaimer isn't a disclaimer, and hiding it would be the kind of fine print we've said we don't do.
- It's also simply **true**: appearance genuinely varies by provider branding, theme, and tier-gated features.
- ⚠️ **App Store / Play listings are NOT covered by this.** Store screenshots must accurately show the actual app in use (Apple 2.3 / 2.3.3) — a disclaimer does not excuse inaccurate or mocked-up store screenshots. Use real screens there. → MKT-12.

## 14. Logo / branding entitlement
- **Business name AND logo show on ALL tiers** (own branding via runtime per-tenant theming — even free Starter). *(Updated Danny, 2026-08-01 — reverses the prior "logo upload = top plans only.")*
- The **tiered** branding perk is **removing "Powered by PetAppro" co-branding → Crew+** (Starter/Solo/Duo keep the mark). Report card carries it as a tier-gated element (one component). The **social ad is always PetAppro-branded** regardless of tier (acquisition surface).

## 11. Features page
- Copy from `apps/web/copy/features.md` (functionality, not selling points).
- ✅ #5 "Share the care" ships at launch. ✅ #10 = "a service menu you set up" (NOT "add your own" yet).

## 12. Design hygiene (not copy, but sweep for it)
- ❌ No decorative floating shapes / patterns — flat theme surface backgrounds.
- ✅ Library components + variables only; no hard-coded colors; text set to FILL.

## 13. Entity / footer facts
- Company: **Base509 LLC**. Product endorsed "by Base509."
- If a mailing address shows: **1875 Mission St Ste 103 #660, San Francisco, CA 94103** — ❌ never the home/principal address.
- Support: **support@base509.com**. Support ≠ Contact (separate pages).

---

## Open / evolving (verify each pass)
- Custom service types = near-term (not launch) → keep #10 conservative for now.
- Exact per-tier client/seat limits shown on pricing must match `pricing-tiers-and-features.md`.
