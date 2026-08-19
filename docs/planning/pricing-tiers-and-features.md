# Pricing Tiers × Features — draft matrix (for decision, not yet landed)

**Status:** Working tier matrix. Price points remain draft under D-020; theme entitlements (D-040) and Crew+ launch GPS (D-054) are locked.
**Purpose:** visualize the feature ladder before committing a tier structure. Ties D-020 (seats), D-030 (white-label), D-040 (theming tiers), D-054 (launch GPS), D-007 (payments/tips), D-008 (SMS).

---

## Axis — RESOLVED: one ladder, by seats (Danny, 2026-07-11)

Tiers are **seat bands**, with features bundled per band (collapses the earlier two-axis tension; supersedes D-020's 1/2/small-business framing):

| Tier | Name | Seats | Cost |
|---|---|---|---|
| **T0** | **Starter** | 1 user · ≤5 clients | Free (capped; "Powered by PetAppro") |
| **T1** | **Solo** | 1 user | Paid — lowest |
| **T2** | **Duo** | 1–2 users | Paid |
| **T3** | **Crew** | 1–5 users | Paid |
| **T4** | **Team** | 5–20 users | Paid |
| **Enterprise** | **Enterprise** | 20+ | Contact us (ties D-030 white-label isolation) |

Because the ladder is seat-based, **it launches cleanly**: seats, payments, themes, and Crew+ GPS exist at launch, so all bands are sellable day one. In-app messaging remains a post-MVP enrichment.

---

## Revised feature matrix (seat bands, 2026-07-11)

Legend: ✅ included at launch · — not included · **[post-MVP]** later · **[add-on]** metered extra at any tier.

| Feature | T0 Starter | T1 Solo | T2 Duo | T3 Crew | T4 Team | Ent |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Core booking (boarding, daycare, walking; drop-in stretch) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Clients, pets, households, staff schedule | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Explicit-rate pricing + holiday tiers (D-039) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Report cards + check-in/out (D-046) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manual payment tracking | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **In-app payments — Stripe Connect + tips** (D-007) | — | — | ✅ | ✅ | ✅ | ✅ |
| Default theme — Brandy Blue, light + dark (D-040) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Breed themes — Husky, Irish Setter | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| All breed themes — + Bichon Frise, Blue Heeler, Chessie | — | — | ✅ | ✅ | ✅ | ✅ |
| Full library — city themes + seasonal drops | — | — | — | ✅ | ✅ | ✅ |
| **GPS walk tracking** (D-054 launch gate) | — | — | — | ✅ | ✅ | ✅ |
| **In-app messaging** | — | — | — | — | ✅ [post-MVP] | ✅ [post-MVP] |
| SMS alerts (D-008) — top tier only, opt-in `[HIDDEN from public matrix until SMS ships — post-MVP, not built]` | — | — | — | — | opt-in | opt-in |
| White-label / tenant isolation (D-030) | — | — | — | — | — | ✅ [post-MVP] |
| Own branding / logo (name · logo · theme show to clients) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Remove co-branding — "Powered by PetAppro" | — | — | — | ✅ | ✅ | ✅ |
| Client cap | 5 | ∞ | ∞ | ∞ | ∞ | ∞ |
| Seats | 1 | 1 | up to 2 | up to 5 | up to 20 | 20+ |

**Theme tiering amended (Danny, 2026-07-18 — locked roster, see `apps/web/copy/theme-tiers.md`):** supersedes the earlier "pick 1 of 3 → expanded → full library" ladder. Solo (first paid) adds **Husky + Irish Setter** — the first-paid differentiator; Duo = **all breeds** (+ Bichon Frise, Blue Heeler, Chessie); Crew & Team = full library incl. **city themes** (Bark Avenue NY, South Bark Miami, Hollywoowoowood, San Fursisco) + seasonal drops; Enterprise = fully custom brand (D-030). Roster: 5 breeds + 4 cities, all light+dark. Ties D-020/D-040.

**Theme entitlement enforcement (D-040/D-050):** the roster above is versioned Base509 catalogue data projected into each tenant's `business_entitlements.theme_allowlist`; it is not duplicated as tier conditionals in the portal. Theme selection must pass both boundaries: (1) the typed endpoint/RPC re-reads the current tenant entitlement and rejects a disallowed stable theme key, and (2) the database write invariant/RLS `WITH CHECK` prevents a direct or tampered request from persisting a key outside that allowlist. Missing, stale, or invalid entitlement data fails closed to Brandy Blue. Service-role/operator tooling must call the same invariant. Required tests cover every tier boundary, downgrade from a higher-tier theme, stale projections, forged tenant/theme input, and cross-tenant isolation.

**Feature moves from the first draft:** payments **T3 → T2** (Danny); GPS **T2 → T3** (Danny); Enterprise band added (20+ seats, white-label isolation, contact-us).

**⭐ Branding split + co-branding cutoff (Danny, 2026-08-01):** the old single "Own branding (no 'Powered by PetAppro')" row is split in two:
- **"Own branding / logo" = ALL tiers** (incl. free Starter). The provider's name, logo, and theme show to their clients via runtime per-tenant theming — everyone gets their brand. **This reverses the prior "logo upload = top plans only" rule (COPY-AUDIT §14 — updated to match).**
- **"Remove co-branding — 'Powered by PetAppro'" = CREW+.** Starter · Solo · Duo keep the "Powered by PetAppro" mark; Crew · Team · Enterprise remove it.
- **Rationale:** Solo's real upgrade driver is **unlimited clients** (cap 5 → ∞), not branding — so co-branding removal moves up to Crew. Considered Team; landed on **Crew** (Danny) so a genuine multi-person business isn't still showing the mark.
- **Surfaces:** the **report card** carries the "Powered by PetAppro" as a tier-gated element on ONE component (shown Starter–Duo, hidden Crew+) — not multiple versions. The **social ad is ALWAYS PetAppro-branded regardless of tier** (acquisition surface — the client must download the PetAppro app); only a true Enterprise own-app build gets a bespoke ad.
- **SMS-alerts row is hidden from the public matrix** until SMS actually ships (D-008, post-MVP).

**Notifications vs SMS (Danny, 2026-07-11 — see D-049):** **push + email are the built-in notification stack, free at every tier.** They cover MVP because providers run their business in the app (they'll have push on). **SMS is top-tier only (T4/Enterprise), opt-in, off by default** — real per-message cost (~1.1¢ + A2P setup ~$44 + $1.50–10/mo), so it's not a mass channel. **Onboarding priming** strongly encourages notification permissions (framed around operational value — "track your pets / your clients"), with a **deep-link to settings** to re-enable. Compliance guardrails in D-049.

---

## Free access — trial, not a free tier (Danny, 2026-07-11)

**There is no permanent free T1.** "Non-payment level" meant the tier *without in-app payment processing* (manual tracking only), NOT a no-cost tier. Corrected:

- **Free trial** — ~1 week to 1 month across the board (recommend the longer end so a provider runs a real booking cycle before deciding). Converts to a paid tier at the end.
- **T1 = lowest *paid* tier** — 1 user, manual payment tracking (no in-app payments), default theme.
- **T0 = free-forever, hard-capped (DECIDED, Danny 2026-07-11)** — 1 user, **≤5 clients**, no support, no in-app payments, default theme, and **"Powered by PetAppro"–branded** (visible to their clients). Purpose: top-of-funnel on-ramp, install base + App Store presence/ratings, land-and-expand as hobbyists grow, and two-sided word-of-mouth (their clients discover the app). The **5-client cap is the conversion trigger** (upgrade prompt at the ceiling) — **Solo's headline value is unlimited clients** (Danny, 2026-08-01: the cap removal is the real Solo seller). **Own branding/logo is available on ALL tiers** (incl. free Starter — name/logo/theme show via runtime theming); the *tiered* branding perk is **removing the "Powered by PetAppro" co-branding, which unlocks at CREW+** (Starter/Solo/Duo keep the mark). Watch: multi-account gaming to dodge the cap (mitigate post-launch, not a blocker).

## Resolved / still-live tiering notes

- ✅ **Axis resolved:** one ladder, by seats (supersedes D-020's framing).
- ✅ **Payments at T2** (moved down from the first draft) — the strongest upgrade hook anchors the first payment-bearing paid tier; a 2nd seat is the parallel structural trigger.
- **Launch vs roadmap:** D-054 supersedes the former GPS-v1.1 plan: GPS ships at launch for Crew/Team/Enterprise and is a hard launch-quality gate. Messaging remains post-MVP.
- **Themes aren't a standalone driver** — each paid band still needs a functional reason to climb (payments, seats, GPS, messaging); themes ride along.

---

## Monetization stance & draft pricing (Danny, 2026-07-11)

**No client caps on paid tiers (DECIDED).** Only **Starter** is capped (5 clients — the free limiter). All paid tiers are **unlimited clients**. We monetize on **seats + features + being best-in-class (features & UX)** — not metered usage. Rationale: reads "flat and fair" vs per-staff models (Time To Pet, Scout) and meets the flat-unlimited expectation set by PetPocketbook/Paw Partner, while we win on product.

**Draft pricing — PLACEHOLDER, validate at the D-021 beta (not final):**
*(Annual model finalized 2026-08-19, Danny: annual = 11× monthly — "1 month free". Term-based, non-refundable; monthly stays the hero price on the site.)*

| Tier | Monthly | Annual (~1 mo free) |
|---|---|---|
| Starter | Free | — |
| Solo | $19 | $209 |
| Duo | $39 | $429 |
| Crew | $79 | $869 |
| Team | $149 | $1,639 |
| Enterprise | Custom | Custom |

**Market context (2026), two camps:** *per-staff* — Time To Pet ($25–50 base + $16/active staff; ~$120 for 5), Scout (~$33 + $15/staff); *flat-unlimited* — PetPocketbook ($25), Paw Partner ($99.99, facility). Facility/boarding all-in-ones (Gingr/PetExec/ProPet) run ~$100–300.

**Competitive position:**
- **vs per-staff:** flat-per-band beats per-seat surcharges at scale (5 staff ≈ $120 on TTP vs $79 Crew).
- **vs flat-unlimited discounters:** we don't out-cheap PetPocketbook's $25 — we win on the **free Starter tier**, **native mobile app** (many rivals are web-first), **themes/white-label**, **in-app payments + tips included from Duo up**, **sitting/drop-in verticals**, **no-marketplace trust** (D-029), and **modern UX**.

## Competitive-analysis (parallel thread)

Next pass: map the top user complaints about Rover/Wag/Time To Pet/Scout to concrete PetAppro features, and firm the differentiators — **free funnel tier, best-in-class UX, themes/branding, flat predictable pricing, provider-set explicit rates with holiday control (D-039, more control than Rover), booking-software-not-a-marketplace (D-029)**. (Owner: Cowork discovery lane — DR items.)

---

**Reconciliation — 2026-08-15 (PO reaffirmed locked matrix).** Code flagged a contradiction: a direction from another window had the portal grant **every non-Solo plan the full theme library**, conflicting with the locked D-040 matrix (Duo = all breeds; **city + seasonal = Crew+**). Danny (PO) reaffirmed the **locked matrix**. Action: the **portal conforms** — revert the "non-Solo gets everything" behavior so Duo's `theme_allowlist` excludes city/seasonal keys; those unlock at Crew+. Marketing table, `theme-tiers.md`, and the entitlement catalog already match and are unchanged. No change to D-040.
