# Website & Portal Architecture

> **Status:** Rewritten 2026-07-16 (Cowork). Supersedes the 2026-07-06 draft (stale Starter/Pro/Business pricing; no provider portal).
> **Scope:** sitemap + page-by-page outlines (top→bottom) for all three web surfaces, incl. the logged-in provider portal.
> **Anchors:** D-056 (multi-domain themed shell) · D-041 (portal = all config; app = ops only) · D-042 (subscription web-only) · D-020/D-040 (tiers + theming) · D-050 (server-side entitlements) · D-055 (legal layers) · D-039/D-043 (pricing) · D-052 (invoices).
> Copy here is structural, not final — drafts refine in `Marketing/Messaging/`.

---

## 0. Surfaces

| Surface | Domain | Audience | Auth | Job |
|---|---|---|---|---|
| **Company hub** | `base509.com` | Anyone — incl. **Apple org verification** | none | Credibility; who's behind the software |
| **Product site** | `petappro.com` | Pet-care providers (prospects) | none | Sell PetAppro; host store-required legal/support; app download |
| **Provider portal** | `app.petappro.com` | Subscribed providers | **authenticated** | **All** configuration + billing |

**Scales by repetition (D-056):** `hairappro.com` + `app.hairappro.com` later = same codebase, new theme. Nothing may hard-code PetAppro.

**Brands stay separate.** Base509 = Basalt navy + Oswald/Montserrat on parchment. PetAppro = Brandy Blue teal + Poppins. Shared **skeleton + semantic tokens**; per-brand **palette + fonts** underneath. Base509's font rule never leaks to product brands.

---

## 1. Sitemap

```
base509.com                     (thin — 37signals model; grows at product #2)
├── /                           Company hub (single page)
└── /policies/                  CANONICAL policy hub — separate page per policy (see §6)
    ├── /terms                  Terms of Service
    ├── /privacy                Privacy Policy
    ├── /cancellation           Cancellation Policy        [CA ARL]
    ├── /refund                 Refund Policy
    ├── /ownership              Account Ownership Policy   [ties D-057]
    ├── /subprocessors          Sub-processor list         [supports the DPA]
    ├── /dpa                    Data Processing Addendum   [provider-facing, D-055]
    ├── /accessibility          Accessibility statement    [WCAG 2.1 AA]
    ├── /security               Security overview          [later — trust asset]
    └── /ccpa                   CA Notice at Collection    [ONLY if we cross thresholds]

petappro.com                    (product marketing + store-required pages)
├── /                           Home
├── /features                   Deep feature walkthrough
├── /pricing                    Tiers + full feature matrix
├── /themes                     Theme showcase (a real differentiator — give it a page)
├── /download                   App Store / Play links
├── /support                    Help + contact route      [store-required]
├── /contact                    Contact
├── /privacy                    Privacy Policy            [store-required — renders canonical, PetAppro-styled]
├── /terms                      Terms landing → Client Terms + Provider Terms  [D-060: two agreements, not one ToS]
├── /policies                   Policy index (renders canonical hub, PetAppro-styled)
│      ├── /policies/client-terms      [consumer]
│      ├── /policies/provider-terms    [business]
│      └── /policies/{privacy,cancellation,refund,ownership,dpa,subprocessors,accessibility,security}
└── /signup                     → hands off to app.petappro.com/signup

app.petappro.com                (authenticated provider portal)
├── /signup                     Create account → tier select → Stripe Billing
├── /login                      Passwordless-first (Apple/Google/magic-link, D-031/D-038)
├── /                           Dashboard
├── /business                   Business profile · hours of operation
├── /services                   Service catalog → per-service editor → report-card templates
├── /pricing                    Rates, rate tiers, surcharges, travel fee, off-hours
├── /availability               Conflict groups · blocked dates · capacity · booking rules
├── /appearance                 Theme selection (tier-gated) · logo vs text (tier-gated)
├── /policies                   T&C · house rules · meet-&-greet · client edit/cancel window
├── /team                       Staff invites + roles
├── /reports                    Reports + spreadsheet / QuickBooks export
├── /payments                   Stripe Connect (client→provider money) · invoice settings
├── /billing                    Subscription — upgrade/downgrade, invoices, payment method
└── /account                    Personal profile · security · delete account (D-057)
```

**Key routing rule:** everything a provider *configures* lives in the portal (D-041); the app is operations + device prefs only. **Every portal change writes to the shared Supabase backend and the app reflects it immediately** — same data, two clients. Never build a sync layer.

---

## 2. base509.com — page outline (top → bottom)

Deliberately thin. With one product shipped, an elaborate company site reads as pretentious (37signals renamed *to* Basecamp when they had one product; the company brand only mattered again once HEY existed). This grows into a hub at product #2.

**`/` — Home (single page)**
1. **Header** — Base509 wordmark (use the logo SVG; never redraw). Minimal nav: What we build · Contact.
2. **Hero** — *"Booking and scheduling software for independent service providers."* Sub: one vertical at a time. 509 underline motif.
3. **What we build** — PetAppro card (what it is, who it's for) → links out to petappro.com. Room for the next app.
4. **The idea** — the "appro" family, lightly: prove the model in one vertical, reuse the platform for the next. *(Restrained — don't oversell a family that's one product today.)*
5. **Who we are** — short mission + a values line. Human, not corporate.
6. **Contact** — `support@base509.com` *(already live via Cloudflare Email Routing)*.
7. **Footer** — **legal name "Base509 LLC"** · contact · California.

> **Apple org-verification bar** — publicly accessible (no password, **no "coming soon"**), names **Base509 LLC**, clearly states what the company does, gives an `@base509.com` contact, and contradicts nothing on the D-U-N-S record (Base509 LLC · California · 11-314-3683).

---

## 3. petappro.com — page outlines (top → bottom)

**Audience: providers only.** Their clients never shop here — they arrive via invite/QR into the app (D-026). Don't split the message.

### `/` — Home
1. **Header** — logo · Features · Pricing · Themes · Sign in · **Start free**.
2. **Hero** — headline + sub + dual CTA (Start free / See pricing). Visual: provider app screenshot.
3. **The problem** — texts, spreadsheets, marketplaces taking a cut, clients scattered across systems.
4. **Differentiators (4 cards)** — Own your clients (no cut) · Flat pricing, no per-staff fees · One home for all your clients · A native app your clients actually love.
5. **How it works** — 3 steps: set up your services → invite your clients → get booked and paid.
6. **Feature highlights** — booking & scheduling · explicit-rate pricing (holiday rates *you* set) · report cards + check-in/out · payments & tips · branded invoices · accountant export · GPS walk tracking.
7. **Themes teaser** — 2–3 theme cards → `/themes`.
8. **Payments line** — *"Your clients pay you directly through Stripe. We take nothing."*
9. **Social proof** — placeholder → real quotes post-beta; **reviews feed later**.
10. **Pricing teaser** — ladder at a glance → `/pricing`.
11. **Closing CTA** — Start free.
12. **Footer** — nav · legal (/privacy, /terms) · support · **"From Base509"** → base509.com (D-056 endorsement).

### `/features`
1. Header · 2. Hero (*"Everything you need to run the day."*)
3. **By job-to-be-done**, each a section w/ screenshot: Take bookings · Set your prices · Run your day · Keep clients updated (report cards, photos, native share) · Get paid (Stripe + tips) · Keep clean books (invoices + export) · Track walks (GPS).
4. **Both sides** — provider screenshots + client screenshots side-by-side.
5. Closing CTA · 6. Footer.

### `/pricing`
1. Header · 2. Hero (*"Flat pricing. No per-staff fees."*)
3. **Tier cards** — Starter (free, ≤5 clients) · Solo $19 · **Duo $39** *(highlight — payments unlock here)* · Crew $79 · Team $149 · Enterprise (contact). Monthly/annual toggle (annual ≈ 2 months free).
4. **Full feature × tier matrix** — source: `docs/planning/pricing-tiers-and-features.md`. Single source of truth; don't retype.
5. **What's not here** — no commissions · no per-staff fees · no in-app purchase (billed on the web).
6. **FAQ** — Change tiers anytime (prorated)? · What happens at the free client cap? · Do you take a cut? (no) · Trial length.
7. CTA · 8. Footer.

### `/themes`
1. Header · 2. Hero (*"Make it yours."*)
3. **Theme gallery** — card per theme, **light + dark preview**. **Final names:** Brandy Blue (default) · Chessie · Irish Setter · Husky · Bichon Frise · Blue Heeler · Bark Avenue NY · South Bark Miami · Hollywoowoowood · San Fursisco. *(Roster locked: Bichon Frise replaced Poodle; NY/Miami suffixes are part of the names "Bark Avenue NY" / "South Bark Miami".)*

   **Selector-card pattern (public, provider-facing — Danny, 2026-07-17):** **repurpose the existing "Web card – [theme · light/dark]" components as-is. Layout is SET — do not restructure, do not move anything.** Per card, remap only the **theme name (in that theme's own font)**, the **font**, and the **colors** — it already maps, just swap values. Keep light + dark (one each / toggle). **Customer-facing only — do NOT edit tokens** (unnecessary for this).

   **Color-name voice: "on-theme / storytelling"** (Danny's pick) — evocative names pulled from each theme's world, named in-voice from the Figma palette; one clean label under the primary, accent chips optional. Seed/tone reference: San Fursisco = *Golden Gate · The Bay · Carl the Fog* · Hollywoowoowood = *Sunset Red · Rodeo Olive · Midnight Reel* · Brandy Blue = *Brandy Blue · Coco · Bella Sky*. Remaining themes (Chessie, Irish Setter, Husky, Bichon Frise, Blue Heeler, Bark Avenue, South Bark) named in the same spirit — story from the breed/city, not a generic color word; 1–2 words. *(Theme names themselves are unchanged — only the swatch labels get the storytelling treatment.)*
4. **Which tiers get what** — default only → pick one of 3 → expanded → all + seasonal.
5. **Logo & branding** — business-name text (all tiers) vs **logo upload (top tiers)**.
6. CTA · 7. Footer.

### `/download`
Header · hero · App Store + Play badges (placeholders until approved) · screenshot carousel (provider + client) · "New to PetAppro? Start free" · footer.

### `/support` *(store-required — the store listing's Support URL)*
Header · hero · FAQ/help topics · **contact route** (`support@base509.com` / form) · response-time expectation · footer.

### `/contact`
Header · form + `support@base509.com` · footer.

### `/privacy` · `/terms` *(store-required — LAUNCH BLOCKER, D-055)*
Counsel-drafted text · last-updated date · plain-language summary at top. These are the **PetAppro platform** terms — distinct from each provider's own T&C, which live in-app (D-055 layer 2).

### `/signup`
Thin — collects nothing; hands off to `app.petappro.com/signup`. Keeps auth entirely off the marketing domain (Codex: host-only cookies on the portal subdomain; marketing never participates in auth).

---

## 4. app.petappro.com — provider portal (logged-in)

**Principle:** the portal is where a provider *builds* their business; the app is where they *work*. Tier gating is **enforced server-side** (D-050) — a locked control is a conversion prompt, not a security boundary.

**Shell:** left nav + content. Persistent: business name/logo · tier badge · **Upgrade** CTA when below top tier.

### `/signup`
1. Create account — passwordless-first (Apple / Google / magic-link, D-031). *(Sign in with Apple offered alongside Google — guideline 4.8.)*
2. Business basics — name, service area.
3. **Choose tier** — ladder + what each unlocks.
4. **Stripe Billing checkout** — web only; free trial starts (D-042).
5. → Guided setup checklist.

### `/` — Dashboard
1. **Setup checklist** (until done): add services → set prices → set hours → connect Stripe → invite clients.
2. At a glance: today's bookings · unpaid balance · new client requests.
3. Tier status + what's next to unlock.
4. Recent activity.

### `/business` — Profile & hours
1. **Business name** *(all tiers — shows in the client app)*.
2. **Logo upload** *(TOP TIERS ONLY — lower tiers render the business name as text)*. Entitlement-gated; locked state + upgrade CTA.
3. Contact info · service area · time zone.
4. **Hours of operation** — per-weekday open/close, closed days (D-043). Powers the public services display **and** gates bookable times (F-001).
5. **Off-hours surcharge** — toggle + flat amount; auto-generates the client-facing clause (D-043).

### `/services` — Catalog & editor *(the CMS)*
1. **Service catalog** — enable/disable: Boarding · Daycare · Walking · Drop-in *(+ In-home / House sitting when they ship)*.
2. **Add / edit service** → per-service editor:
   - Name · short description (**body-copy editor**)
   - **Photo(s)** (uploader)
   - Pricing model + rates → `/pricing`
   - **Duration variants** — preset menu **+ "add your own"** (F-027): Walk 30m · 1h · 2h · Group
   - **Meet-&-greet required?** toggle *(gates booking until the provider marks it complete)*
   - **Vaccination proof required?** toggle (F-013)
   - Capacity / concurrency (F-014)
   - **Report-card template** — checklist editor + free-text + photo (D-046)
   - Household tasks offered (in-home services) — two-sided toggles
3. Reorder / feature services as the client sees them.

### `/pricing` — Rates
1. Per-service **base rate** (explicit dollars — D-039).
2. **Rate tiers** — holiday / extended (provider types the rate; **never** a % surcharge).
3. **Holiday calendar** — defaults + add/remove + reset-to-defaults.
4. **Flat surcharges** — extra pet · puppy.
5. **Travel fee** — flat (per-mile deferred).
6. **Discount codes** (F-005) · **referral bonus** toggle.
7. **Tax rate**.
8. **Live preview** — what a client sees for a sample booking.

### `/availability`
1. Weekly availability windows (F-016) — **bulk edit** (all Wednesdays, date ranges).
2. **Blocked dates** — per-service or all (F-012); state legible at a glance.
3. **Capacity caps** per service (F-014).
4. **Conflict groups** (D-045) — overnight-exclusive (boarding/sitting) vs overlap-ok (walking); provider override.
5. **Booking rules** — approval vs auto-book (F-004) · min advance notice · repeat-clients-only (F-019).

### `/appearance` — Theme & branding
1. **Theme picker** — gallery, live preview, light + dark. **Tier-gated (D-020/D-040):** default only → pick one of 3 → expanded → all + seasonal. Locked themes show an upgrade CTA.
2. **Logo vs text** — logo upload (top tiers) or business-name text (all tiers).
3. **Preview** — see it as your client sees it.

### `/policies`
1. **Terms & conditions** — boilerplate + auto name-fill (F-022), editable. Disclaimer: *templates, not legal advice.*
2. **House rules**.
3. **Cancellation / change policy** — **client self-service window per service type** (F-028): allow clients to edit/cancel? + hours/days before.
4. **Meet-&-greet** requirement (global default; per-service override in `/services`).
5. Version + effective date (consent stamped at booking).

### `/team`
1. Staff list + status.
2. **Invite** — role select (Staff / Manager / Admin — nested, D-032/D-033) + permissions chart + "admin can see financials" disclaimer (D-020).
3. Seat usage vs tier limit → upgrade CTA at the cap.

### `/reports`
1. Date-range picker + filters (service · staff · client).
2. **Reports** — revenue · bookings · by service · by client · staff hours · outstanding balances. *(Same data as in-app reporting; the portal is the deep view, the app is the glance.)*
3. **Exports** — **CSV / XLSX download** · **QuickBooks-ready export** (F-007).
4. **Invoice register** — issued invoices (D-052), searchable, PDF download.

### `/payments` — Stripe Connect
1. **Connect status** — connected / not connected.
2. **Connect with Stripe** → Standard Connect onboarding (D-007). *Clients pay the provider directly; PetAppro takes no cut.*
3. Payouts summary + link out to the Stripe dashboard.
4. **Tips** toggle · accepted payment types.
5. **Invoice settings** — invoice prefix (`WWT` → `WWT-26-0001`, D-052).
6. *No card surcharge (D-039).*

### `/billing` — Subscription
1. Current plan · renewal date · trial status.
2. **Upgrade / downgrade** — ladder + what changes; **prorated** (D-020).
   - **Downgrade guardrails:** if seats / clients / themes exceed the lower tier, state exactly what will be lost or locked **before** confirming.
3. Payment method · billing history (Stripe Billing).
4. Cancel subscription — consequences stated plainly.

### `/account`
1. Personal profile (name, email, phone). *(Changing email/phone triggers **re-auth** — D-031.)*
2. Security — passwordless methods · **MFA (required for Owner/Admin)** · active sessions.
3. **Delete account** — also required in-app (Apple 5.1.1(v)). Must handle owner-vs-tenant per **D-057** *(open: transfer vs closure)*, Sign in with Apple token revocation, active subscription, and legally-retained invoices.

---

## 5. Cross-cutting rules

- **Entitlements server-side (D-050)** — themes, seats, logo upload, client cap revalidated on every mutation.
- **Portal ⇄ app are one system** — config written here appears in the app immediately. No sync layer.
- **No in-app purchase path (D-042)** — subscription lives here only; the app contains no purchase or purchase link.
- **Snapshot-on-booking (D-043)** — hours, off-hours, travel fee, rates copied onto a booking at creation; editing settings never rewrites a past agreement.
- **Nothing hard-codes PetAppro (D-051/D-056)** — `app.hairappro.com` must be a theme + copy swap.

---

## 6. Legal & policy architecture

> **Operating principle (Danny, 2026-07-16):** we operate ethically and stay in good legal standing — always. **No working around rules, no dark patterns, no tricking providers or their clients.** Where a rule is ambiguous, take the honest reading. This section is what to brief counsel on; it is **not legal advice**.

### 6.1 One source, rendered per surface (not duplicated)

**Policies live once, as versioned content, and are rendered + styled per brand.** Duplicated policy pages drift, and drift is the real exposure — if you can't prove which version someone agreed to, the agreement weakens.

- ✅ **CONFIRMED (Danny, 2026-07-17): company-level canonical.** Not separate per-product sets. This is settled for counsel.
- **Canonical:** `base509.com/policies/*` — **Base509 LLC is the contracting entity for every appro product**, so the company level is the correct home (37signals model).
- **Rendered elsewhere, same content:** `petappro.com/privacy`, `/terms`, `/policies` (PetAppro-styled, short stable paths the store consoles can use); in-app links point to the same source.
- **Product-scoped, not one blob:** shared **core clauses** + **product-specific sections** (PetAppro collects pet data + location; HairAppro won't). One store, composable per product. **"Company-canonical" = single source of truth owned by Base509 LLC, NOT one shared legal text across products** — a future appro product gets its own product-scoped set under the same company-canonical model.
- **Terms are TWO agreements (D-060):** **Client Terms** (consumer) + **Provider Terms** (business), each versioned separately. **Privacy, DPA, sub-processors, etc. are single documents** covering everyone. Only the Terms fork, because only they have two genuinely different counterparties. The retired single `terms-of-service` is not published.
- **Versioned:** every policy carries a **version + effective date**. Consent is recorded as *"agreed to Privacy v3 on <timestamp>"* (D-055 consent points; F-022 stamping). This is what makes agreements provable.

**Rendering ≠ agreement — do NOT build a live-mutating legal page.** One edit renders everywhere (no drift), but the *agreement* only changes by a deliberate **publish**:

- **Typos / clarifications** → push freely, same version.
- **Material changes** → **version bump** (v3 → v4) + **effective date** + **notice to affected users before it takes effect** (re-consent if significant). Sub-processor additions typically require notice under the DPA.
- **Old versions are archived and viewable** — when someone asks "what did I agree to in March?", we can show them v3, not today's page.
- A user's consent stays **bound to the version they accepted** until they accept the next one.
- Silently mutating live terms is both legally weak (you can't prove what was agreed) and a **dark pattern** — explicitly out of bounds (§6.8).

### 6.1a Drafting approach — adapt from 37signals (CC BY), attribute, then counsel reviews

**Workflow (Danny, 2026-07-16):** Cowork drafts → **attorney reviews and edits** → publish. Giving counsel a tailored draft is far cheaper than a blank page; counsel remains the gate. **Nothing goes live unreviewed.**

- **Source:** 37signals' policies are **Creative Commons Attribution (CC BY)** licensed — explicitly open-sourced ("share them; reuse them; contribute to them"; `github.com/basecamp/policies`, now superseded by the live pages at 37signals.com/policies). Adapting them is legitimate and intended.
- **Attribution is required** by CC BY if we copy entirely or materially — we credit them. Cheap and honest.
- **Borrow structure + plain-language style, write our own substance.** Their readability is the real gift; the substance differs materially. Ours must cover what theirs never needed:
  - **Two-sided relationship** — providers (our customers) *and* their clients both use the app.
  - **Processor role + DPA** (D-055) — we process client data on behalf of providers; they're the controller.
  - **We are NOT the service provider** (D-029) — we make software; the provider does the care; we're not party to or liable for that relationship. *(Our most important clause; Basecamp has no equivalent.)*
  - **Stripe Connect** — the provider is merchant of record; the money never touches us; we take no cut.
  - **Pet data + GPS location** of walkers/staff.
  - **Auto-renew + free trial → CARL** (§6.3).
  - **Tenant/account ownership** (D-057).
- **Lane:** policy drafting is Cowork (content), **not** the design chat. Fable builds the structure + "DRAFT — PENDING COUNSEL" placeholders; drafts drop into those slots.

**Source map — which reference feeds which layer (reviewed 2026-07-16):**

| Source | What it is | What we take |
|---|---|---|
| **37signals** (CC BY) | One-sided B2B SaaS | Structure + plain-language style. Attribute. |
| **Housecall Pro** | **SaaS for service pros — our structural twin** (the pro serves their own customers; not a marketplace) | **Layer-1 platform ToS shape**: pro-is-the-provider, software-not-the-service, pro owns their customer relationship |
| **Salesforce / Zoho** | B2B multi-tenant SaaS | DPA / processor / sub-processor / tenant-data language |
| **Rover / Wag** | **Marketplaces** — they stand *between* the parties | ⚠️ **Their substance is mostly LAYER 2, not layer 1.** Their operational rules are what a *provider* tells *their* clients |
| **DoorDash** | Two-sided gig marketplace | "Platform, not the provider/employer" liability framing only |

**Key reframe:** Wag's Home Access / Claims / Deactivation policies exist because Wag is the middleman and must govern both sides. **We are not the middleman (D-029)** — so that substance becomes **provider house-rules boilerplate (F-022 / D-055 layer 2)** in our voice, not PetAppro platform terms.

**Adopt from Wag's Home Access Policy → our provider house-rules template:** access instructions completeness; enter only at the service time and stay only as long as needed; don't bring other people/dogs; never enter through an unlocked door/window unless instructed **in writing**; respect closed doors; disarm/re-arm alarm; return key to the designated place; report incidents immediately; emergency steps (911 / local shelter).

**Two product findings:**
1. **Wag patches a missing feature with a rule** — *"don't put lockbox codes in Walker Notes or be deactivated."* **We solve it by design (D-044):** a dedicated encrypted access-code field with biometric reveal, so there's no reason to type a code into free text. Better, and a selling point. *(Still state it in the house-rules boilerplate.)*
2. **Adopt Wag's photo etiquette rule** into **report-card guidance (D-046)**: photograph the **pet**, not the home interior, exterior, or address.

**Housecall Pro — reviewed 2026-07-16. The model clause for Layer 1** (adapt the intent, our words):

> *"You are solely responsible for all customer service issues between you and your customers relating to your services, including pricing, fulfillment, cancellation by you or customer, returns, refunds and adjustments, rebates, functionality and warranty, technical support, and feedback, reviews, or ratings concerning experiences with your personnel, policies or processes. **In performing customer service, you will always present yourself as a separate entity from us.**"*

That is **D-029 in one sentence** — the provider is a separate business; we are the software. Adapt this shape. Also useful: the pro is solely responsible for retaining/reconciling their own transaction records (informs our invoice/report duties), and they define a data-retention window after cancellation (informs D-057 retention).

⚠️ **DO NOT copy Housecall Pro's cancellation.** They require *"email us at cancellations@…"* to cancel — **exactly what California's ARL (§6.3) forbids** for online sign-ups. Whether they believe B2B is exempt, are stale, or are exposed, we don't follow: **self-serve click-to-cancel**, because it's compliant *and* honest (§6.8). **For counsel:** confirm whether CARL reaches *business* subscribers — many of our providers are sole proprietors, so don't lean on a B2B exemption.

**Filed for later:** Wag places CA privacy as an **anchored section inside** their Privacy Policy (`#ca-supplemental`) rather than a standalone page — cleaner than 37signals' separate CCPA page, if we ever cross the §6.4 thresholds.

### 6.2 Launch blockers (must be live before store submission)

| Item | Why |
|---|---|
| **Privacy Policy** | Apple + Google mandate a privacy URL to publish (D-055) |
| **Terms of Service** | The contract with every user (D-055) |
| **Support URL** | Required in the store listing (LR-2) |
| **In-app account deletion** | Apple 5.1.1(v) — see D-057; incl. Sign in with Apple token revocation |
| **Privacy labels / Data Safety form** | Store-console declarations (must match reality) |

### 6.3 Auto-renewal compliance — CARL (probably not) + ROSCA (yes)

> **⚠️ CORRECTED 2026-07-16.** An earlier version of this section said CARL "applies to us." Overstated. **CARL likely does NOT cover most Provider subscriptions** — California defines a covered "consumer" as an individual acquiring services for **personal, family, or household purposes** (Bus. & Prof. Code §§17601–17602), and a sole proprietor buying software to **run a business** probably isn't one. Purpose controls; counsel to confirm.
> **What *does* apply federally: ROSCA (15 U.S.C. §8403)** — clear disclosure, express informed consent, and a **simple mechanism to stop recurring internet charges**. Also note: the FTC's 2024 click-to-cancel rule was **vacated** (8th Cir. July 2025) and the FTC **restored the older, narrower rule in Feb 2026** (91 FR 6507) — don't cite the vacated rule as binding.
> **Decision: we build to the stricter CARL standard anyway** — safer nationally, and consistent with §6.8.

**These are build requirements, not just a page:**

- **Click-to-cancel in the same medium** — they subscribe online → they must cancel online, self-serve, in `/billing`. **Never** "email us to cancel."
- **Clear disclosure + affirmative consent** before a free trial converts to a charge.
- **Annual renewal reminders** to subscribers, regardless of billing period.
- **Save/win-back offers** during cancellation are regulated — if we show one, it must not obstruct cancelling.
- Publish a **Cancellation Policy** page stating all of it plainly.

*(Federal: the FTC's "click-to-cancel" Negative Option Rule was vacated July 2025, but the FTC restarted rulemaking Jan 2026 and still enforces. California applies regardless — comply with CARL and watch the FTC.)*

### 6.4 Data protection

- **Privacy Policy scopes "platform data"**; each provider owns their client relationship (D-055).
- **DPA** between Base509 and each provider — we're **processor** for the client data they manage, **controller** for platform/account data (D-055). Publish at `/policies/dpa`.
- **Sub-processor list** — Supabase, Stripe, Vercel, Sentry, Expo, email provider, etc. Publish and keep current; DPAs typically require notice of changes.
- **Retention + deletion** — states what's deleted vs retained, and **why**, which is exactly how D-057 stays honest. ⚠️ Do **not** publish "the law requires PetAppro to retain issued invoices/tax records" — withdrawn 2026-07-17; the **Provider** is the merchant and tax-reporting party for booking revenue. Counsel assigns duty + period per category.
- **CCPA — not yet, but watch the trigger.** 2026 thresholds: **$26,625,000** revenue · **100k+** CA consumers' data bought/sold/shared · 50%+ revenue from selling PI. We meet none. **The 100k test is what catches startups — via third-party tracking pixels and embedded analytics on the marketing site.** So: **be conservative with pixels on petappro.com**; that's the lever, not revenue. Revisit `/policies/ccpa` at scale.
- **Cookies/tracking** — only add a banner if we actually track. Prefer minimal/first-party analytics; it keeps us out of CCPA *and* is the honest default.
- **EU/GDPR** — decide deliberately whether we serve/target the EU. US-first at launch; don't drift into EU marketing without addressing GDPR.

### 6.5 Payments & pricing honesty

- **We are software, never the provider** (D-029) — the ToS must say so plainly: the provider is the merchant of record for bookings; Base509 takes **no cut** and is not party to the care relationship.
- **No card surcharge** (D-039) — deliberately avoids the multi-state surcharge minefield.
- **All-in pricing (CA SB-478)** — advertised prices must include mandatory fees. Our flat, no-commission, no-per-staff-fee model is compliant *by design* — don't break it with hidden add-ons.
- **Refund Policy** — pairs with cancellation; also our chargeback defense.

### 6.6 Marketing honesty

- **Never name competitors** in public ads/copy — legal caution (trademark/disparagement). State what we do/don't do generically. *(Internal docs may name them.)*
- **Substantiate claims** (FTC truth-in-advertising). "Best-in-class UX" is puffery and fine; "saves 10 hours a week" needs evidence.
- **Testimonials & the future reviews feed** must be **genuine**, not cherry-picked or incentivized without disclosure (FTC endorsement guides). No fake reviews — ever.
- **CAN-SPAM** — marketing email needs a working unsubscribe + physical mailing address.
- **SMS (top tier, D-049)** — TCPA + A2P 10DLC require real, documented consent before sending. Don't ship SMS without it.
- **Platform policy** — Meta (IG/FB/Threads), TikTok, LinkedIn only; never X/Twitter or any Elon Musk platform.

### 6.7 Accessibility (ethics *and* exposure)

- Target **WCAG 2.1 AA** on the sites and the app. ADA claims against inaccessible sites are common and cheap to file — and more importantly, excluding people isn't who we are.
- Publish an **accessibility statement** with a contact route for issues.
- This is already partly enforced by the DS: contrast QA on every theme × light/dark (which is why theme sprawl has a real QA tail).

### 6.8 No dark patterns — explicit

Because it's easy to drift here under growth pressure:

- Cancelling is as easy as subscribing. **One click, same medium.**
- The free trial says exactly when it charges and how much, **before** consent.
- No pre-checked boxes, no confirmshaming, no buried "manage subscription."
- Locked tier features show an **honest** upgrade prompt — never a fake-broken UI.
- The provider's clients are **their** clients — we never market to them behind the provider's back.

---

## 7. Open items

- **D-057** — owner account deletion: transfer vs tenant closure (Danny's call).
- ✅ **Theme names — FINAL (locked):** Brandy Blue (default) · Chessie · Irish Setter · Husky · Bichon Frise · Blue Heeler · Bark Avenue NY · South Bark Miami · Hollywoowoowood · San Fursisco. *(Bichon Frise replaced Poodle; NY/Miami suffixes are part of the names — Danny's call. See D-040.)*

- **Design punch-list — Fable pass 1 (2026-07-17, fix in tomorrow's design session):**
  - **Backgrounds:** remove decorative **floating shapes**; flat theme **surface color only**. *(Correction prompt sent. Standing rule: no ornamental background elements — flat, surface-token-driven.)*
  - **PetAppro homepage feature section:** the **app-screen mockup is too large** — it shows only **1 feature + ~80% of the next**. Resize so features present cleanly (fit-per-view, or a proper carousel with a full step per advance).
- **Tier ↔ theme mapping** — which themes at which tier (ties D-020).
- **Reviews feed** on petappro.com — post-beta.
- **Final copy** — this doc is structure; copy drafts live in `Marketing/Messaging/`.
