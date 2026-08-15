# PetAppro — Website copy rewrite (in-voice)  ·  Build handoff

**Purpose:** Rewrite the PetAppro marketing site in the app's established voice. Structure and layout stay the same — this is a copy pass. Pages covered: Home, Features, Pricing, Themes, Download, Support, Contact, Sign up, Policies (index). Legal/policy bodies (Privacy, Terms, etc.) are explicitly OUT of scope — attorney-owned. Change notes are included per page.

**Author:** Cowork (product/copy) · **Status:** ready to implement · **Date:** 2026-07-18

---

## Revision 2 — short headlines + art direction (2026-07-18)

**Headline trims — every section header to 3–5 words** *(rec shown; picks pending Danny)*
| Section | Old header | New (rec) | Alts |
|---|---|---|---|
| Problem | Running the day shouldn't mean running five apps | **One app, not five** | Ditch the five-app juggle · Your whole day, one app |
| How it works | Three steps to your first booking | **Booking in three steps** | Three steps, first booking |
| What's inside | Everything you need to run the day | **Run your whole day** | *Everything but the belly rubs* (joy option) · Everything, one app |
| Features (page H1) | Everything you need to run the day. | **Every tool, one app** | The whole toolbox |
Headers already ≤5 words (keep): Built for providers, not marketplaces · Your app, your look · Start free. Grow flat. · Flat pricing. No per-staff fees. · Make it yours. · Reach a real person, etc. Hero "Your own booking app. No marketplace. No cut." stays (hero exception).

**Joy pass:** lean section *intros* a touch more playful (dog-wink); keep money/legal/cancel plain per the dial. The "belly rubs" header is the flavor level.

**Art direction (design/build task — Claude Design / builder, NOT a copy change):**
- PetAppro visual language = **organic + dog:** scattered paw prints, circles/blobs, abstract paw-print patterns, wavy lines, AI-sparkle accents — offset *behind* feature cards and the app screenshots (SoFi-style; ref screenshot on file).
- Keep Base509's 3-dash/geometric motif OFF PetAppro (and dog motifs off Base509) — distinct languages tell product from parent.
- Ensure the real app screens (provider + client, already designed) and per-service/feature icons are placed as section imagery, not left as text.

---

## Voice profile (apply everywhere)

Distilled from the in-app copy (home empty state, Book a service, onboarding, Meet & Greet, cancel flow):

- **Warm and second-person.** Talk *to* one provider, not to "users."
- **Dog puns as seasoning, not the dish.** "wagging tails," "happy tails," "a full leash of clients," "next favorite day." One wink per moment — never three in a row.
- **Disarming honesty where people get nervous.** Money and cancellations drop the jokes and turn reassuring: "no surprises," "no fine-print surprises," "Plans change — we get it."
- **Human asides via em-dashes.** ("First, the human. Pets are the stars, but someone's got to hold the leash.")
- **Explain the mechanic, don't hide it.** Plain about how things actually work.

**The dial (most important rule):** playful at welcoming / human moments; plain-and-reassuring at money / legal / cancellation moments. Never pun on pricing — it undercuts the trust the app works to build.

---

## Cross-cutting decisions (apply site-wide)

1. **Dog-first.** The app says "your dogs" / "Dog walking," and the Base509 site is locked to dogs-now / cats-soon. Change every **"pet-care provider"** → **"dog-care provider"** across nav copy, footers, and body. (Brand name stays "PetAppro"; cats arrive later.)

2. **Pre-launch CTA handling** *(hinges on one Danny decision — see below).* The **Sign up page** ("Let's set up your business") routes to a **PetAppro provider portal** where account creation + plan-picking happen. Per Danny, that portal / signed-in experience may **not** be live at launch. That single page is the clean control point:
   - **If the portal is NOT live at launch:** the whole site's **"Start free"** buttons keep pointing to the **Sign up page**, and on that page **"Continue to the portal"** becomes a **waitlist / early-access capture** (one place to swap, not every button). Suggested microcopy for the Sign up page in that mode: *"The portal's not open just yet — drop your email and you'll be first in when it is."* Also **remove/hide "Sign in"** (nav + "Already have an account? Sign in") until there's a portal behind it.
   - **If the portal IS live at launch:** leave everything as designed — "Start free" → Sign up → "Continue to the portal," and keep "Sign in."
   - **Download** store badges stay "landing at launch" regardless; add a **"Notify me"** email capture there (the app ships after the web portal).
   - ⚠️ **Decision for Danny:** (a) will the provider portal be live at launch? and (b) if not, does an email-capture tool exist, or should the builder stand up a simple one?

3. **Keep all dev placeholders** (app screenshot slots, theme-card slots, testimonial slot). The "no fake testimonials, ever" note stays — good instinct, keep it.

4. **Content guardrails:** no competitor names ("marketplace" generic is fine); money/legal copy stays plain; support email stays `support@base509.com` (parent company, matches Base509 site).

---

## 1) HOME

**Eyebrow:** For pet-care providers → **For dog-care providers**

**H1 (unchanged):** Your own booking app. No marketplace. No cut.

**Hero body →**
> PetAppro runs the boarding, daycare, walking, and drop-ins for dog folks who already have a full leash of clients. Your day, your prices, your people — in an app they'll actually like opening. You keep every dollar; we never take a cut.

**Buttons:** Start free *(→ waitlist)* · See pricing

**Problem section**
- H2: ~~Running a pet-care business shouldn't mean running five systems~~ → **Running the day shouldn't mean running five apps**
- Body → *Booking requests buried in texts. Schedules living in a spreadsheet. A marketplace taking a slice of every job and calling your clients theirs. PetAppro puts your bookings, your clients, and your money in one place that's actually yours.*

**Why PetAppro — "Built for providers, not marketplaces"** (header unchanged)
- **Own your clients** → Your clients book with you, not through us. We never take a cut, and we never market to them behind your back.
- **Flat pricing** → One flat price per plan. No per-head fees, no commissions, no nasty surprise when your team grows.
- **One home for everything** → Bookings, schedules, pet records, payments — both sides of the relationship, one app.
- **An app clients love** → Your clients get a fast, native app to book, pay, and follow along — all under your name, not ours.

**How it works — "Three steps to your first booking"** (header unchanged)
- **1 · Set up your services** → Add what you offer — boarding, daycare, walks, drop-ins — with your prices, your hours, and your rules.
- **2 · Invite your clients** → Send a link or a QR code. Your clients land in your app, wearing your branding.
- **3 · Get booked and paid** → Approve each request or let the regulars auto-book. Run your day, get paid directly — tips and all.

**What's inside — "Everything you need to run the day"** (header unchanged)
- **Booking & scheduling** → Requests, approvals, capacity, blocked dates — and a schedule your whole team can see at a glance.
- **Prices you control** → Rates you set in dollars, holidays included — never a percentage some marketplace decided for you.
- **Report cards** → Check-in, check-out, photos, and the little updates clients love — sent by push and email, free.
- **Payments & tips** → Clients pay you directly through Stripe, tips and all. We take nothing.
- **Branded invoices & clean books** → Tidy invoices under your name, plus spreadsheet or QuickBooks-ready exports your accountant will thank you for.
- **GPS walk tracking** → Real walk tracking lands in v1.1 — we'd rather ship it right than ship it buggy.
- Button: See all features

**Make it yours — "Your app, your look"** (header unchanged)
- Body → Pick a theme your clients see everywhere they tap — and put your own logo up front on any plan.
- Button: Browse themes

**Pull quote (unchanged — it's strong):** "Your clients pay you directly through Stripe. We take nothing."

**Providers on PetAppro:** testimonial slot + "no fake testimonials, ever" note — unchanged.

**Pricing teaser — "Start free. Grow flat."** (header unchanged)
- **Starter — Free** → Free forever. Your on-ramp — up to 5 clients, with a little "Powered by PetAppro" along for the ride.
- **Duo — $39/mo** → Where in-app payments unlock — Stripe and tips, ready to go.
- **Team — $149/mo** → The full theme library, seasonal packs, and SMS alerts when you want them.
- Button: See all plans & the full feature matrix

**Final CTA — "Ready to own your bookings?"** (header unchanged)
- Sub → Free to start. No card required. Cancel anytime — one click, no hard feelings.
- Button: Start free *(→ waitlist)*

**Footer tagline:** The booking app for **dog-care** providers. Your clients, your prices, your money.

**Change notes:** dog-first everywhere; hero + problem section warmed with one wink each ("full leash of clients," "actually like opening," "actually yours"); feature blurbs tightened and made conversational; money lines ("We take nothing," pull quote) left plain on purpose.

---

## 2) FEATURES

**H1 (unchanged):** Everything you need to run the day.

**Intro →**
> Every tool here does one job: hand back the time the busywork steals — so you can get back to the dogs.

- **Take bookings** → Clients request the service, date, and time you offer — you say yes, or let your regulars auto-book. Capacity caps, blocked dates, and advance-notice rules keep your calendar honest.
- **Set your prices** → Explicit rates for every service, holidays and extended stays included — typed in dollars, never a percentage someone else picked. Extra-pet and puppy surcharges, travel fees, and discount codes, all yours to set.
- **Run your day** → Today's schedule for you and your team, one-tap check-in and check-out, and everything about each client, pet, and household right where you need it.
- **Keep clients updated** → Report cards with photos and checklists, sent the moment the job's done. Push and email built in — the updates clients actually open, and love to share.
- **Get paid** → Clients pay you directly through Stripe — cards, wallets, tips. The money never touches us, and we never take a cut. Manual tracking's there on every plan, too.
- **Keep clean books** → Invoices under your business name, a searchable register, and spreadsheet or QuickBooks-ready exports your accountant will thank you for.
- **Track walks** → GPS walk tracking ships in v1.1 — real check-in/out coordinates and a track you can trust. We'd rather ship it right than ship it buggy.

**Both sides — "One system, two apps' worth of experience"** (header unchanged)
- Body → You get the tools to run the business; your clients get a clean, simple way to book and follow along. Same data, zero copy-paste.

**CTA — "See what it costs"** → Flat plans, free to start. · See pricing

**Change notes:** added a warm intro with one wink ("get back to the dogs"); feature bodies made more conversational; kept "we never take a cut" plain.

---

## 3) PRICING  *(intentionally the plainest page — restraint IS the personality here)*

**H1 (unchanged):** Flat pricing. No per-staff fees.

**Intro →**
> Every plan's a flat monthly price — go annual and about two months are on us. No commissions on your bookings, ever.

**Plan cards** (numbers unchanged; blurbs lightly warmed)
- **Starter · 1 user · up to 5 clients — Free** → Free forever. Your on-ramp — up to 5 clients, with a little "Powered by PetAppro" along for the ride.
- **Solo · 1 user — $19/mo** *(or $190/yr · 2 months free)* → For one-person outfits. Unlimited clients, your own branding.
- **Duo · up to 2 users — $39/mo** *(or $390/yr)* → Where in-app payments unlock — Stripe and tips included. *(badge: "Payments unlock here")*
- **Crew · up to 5 users — $79/mo** *(or $790/yr)* → For small teams. Expanded themes, and GPS walk tracking when it ships.
- **Team · up to 20 users — $149/mo** *(or $1490/yr)* → The full theme library, seasonal packs, and opt-in SMS alerts.
- **Enterprise · 20+ users — Contact us** → White-label and tenant isolation. Let's talk. · Talk to us

**Feature matrix:** unchanged (functional table). Footnote unchanged: *GPS walk tracking arrives in v1.1; in-app messaging and white-label are post-MVP. Draft pricing — final pricing is confirmed at launch.*

**What's not in the price** (kept plain — these are already excellent)
- **No commissions** → We never take a percentage of your bookings. Your clients pay you directly.
- **No per-staff fees** → Plans are flat per band. Adding a teammate never adds a line item.
- **No in-app purchases** → Your subscription's billed on the web, so none of it disappears into app-store fees.

**Pricing FAQ** (kept near-original — already on-voice; tiny polish)
- **Can I change plans anytime?** → Yes — upgrades and downgrades are self-serve and prorated. Before any downgrade, we show you exactly what changes.
- **Do you take a cut of my bookings?** → No. Clients pay you directly through Stripe. Your subscription is the only thing you ever pay us.
- **What happens at the free plan's 5-client cap?** → Nothing breaks — you just can't add a sixth client until you upgrade. Your data and bookings keep right on working.
- **Is there a free trial on paid plans?** → Yes — paid plans start with a free trial, and we tell you exactly when it ends and what it'll charge before you confirm. Cancelling is one click, online, anytime.

**Final CTA — "Start free today"** → No card required for Starter. · Start free *(→ waitlist)*

**Change notes:** deliberately minimal. Pricing keeps the app's money-moment rule — plain, transparent, zero puns. Only softened a couple of blurbs ("on us," "one-person outfits").

---

## 4) THEMES

**H1 (unchanged):** Make it yours.

**Intro →**
> The app your clients tap every day carries your look, not ours. Pick a theme — each one comes in light and dark — or put your own logo up top on the higher plans.

**Gallery — "Every theme, light and dark"** (header + card slots unchanged)

**Which plans get what** (header unchanged)
- **Starter & Solo** → Brandy Blue, our default — clean and professional straight out of the box.
- **Duo** → Pick one of three themes to make it yours.
- **Crew** → The expanded theme set — more room to match your vibe.
- **Team & Enterprise** → The full library, plus seasonal packs.

**Logo & branding** (header unchanged)
- Body → Every plan shows your business name and your own logo in the client app — your brand, front and center. Higher plans (Crew and up) also remove the small "Powered by PetAppro" mark. *(Updated Danny 2026-08-01: logo is on all tiers; co-branding removal is the tiered perk.)*

**CTA — "Try it with your branding"** → Start free *(→ waitlist)*

**Change notes:** intro warmed ("carries your look, not ours"); plan blurbs made lighter. No puns needed — this page is about *their* brand, so the copy stays out of the way.

---

## 5) DOWNLOAD

**H1 (unchanged):** PetAppro on your phone.

**Intro →**
> One app for you and your clients — iPhone and Android.

**Store badges** → keep "landing at launch"; add capture line: *Not on the stores just yet. Want a nudge the day it lands?* → **Notify me** *(email capture)*

**A look inside — "Provider side, client side"** (header + screenshot slots unchanged)

**New to PetAppro?** (header unchanged)
- Sub → Set up your business free — then grab the app. *(pre-launch alt: "Join the waitlist and we'll bring it to you the day it launches.")*
- Button: Start free *(→ waitlist)*

**Change notes:** intro tightened; store badges reframed for pre-launch with a Notify-me capture instead of a dead link.

---

## 6) SUPPORT  *(plain + helpful — this is a reassurance page)*

**H1 (unchanged):** We're here to help.

**Intro →**
> Stuck on something? Start with the common questions below, or just write us — a real person reads every message.

**Help topics** (kept plain)
- **Getting set up** → Creating your account, adding services and prices, setting your hours, and inviting your first clients.
- **Bookings & scheduling** → Approvals vs. auto-book, capacity, blocked dates, and how clients request time with you.
- **Payments** → Connecting Stripe, how clients pay you directly, tips, and manual payment tracking.
- **Billing & your subscription** → Changing plans, billing history, and cancelling — all self-serve, one click, no emails required.
- Closing line → A full help center is on the way — until then, email us and we'll get you sorted, quick.

**Contact — "Talk to us"** (unchanged)
- Body → Email support@base509.com. We aim to reply within one business day.

**Change notes:** barely touched — the support page is a trust moment, so it stays warm-but-plain. "a real person reads every message" is already perfect; kept it. (Builder note: "self-serve in your web portal" describes the post-launch product portal, not the pre-launch marketing nav — fine to keep as launch copy.)

---

## 7) CONTACT  *(plain + reassuring — a security moment, keep it calm)*

**H1 (unchanged):** Get in touch.

**Body (kept — already on-voice):**
> Questions about PetAppro, your account, or anything else — email support@base509.com and a real person will get back to you.

**"What to include" card →**
> Your business name, what you were trying to do, and a screenshot or two help us answer fast. If it's about billing, the email on your account is all we need — and please never send card numbers by email.

**Change notes:** barely touched. "a real person will get back to you" already nails the voice — kept. Softened the security line ("please never send card numbers by email") so the caution reads friendly, not stern.

**⚠️ Builder/Danny note — overlap:** there's now both a **Support** page ("Talk to us") and a **Contact** page ("Get in touch"), and both route to `support@base509.com`. Not a copy problem, but worth deciding whether they stay as two pages (Support = self-help topics, Contact = write us) or merge. Left as two for now.

---

## 8) SIGN UP  *(the funnel node — also the pre-launch control point, see decision #2)*

**Eyebrow (unchanged):** SIGN UP

**H1 (unchanged — already warm):** Let's set up your business.

**Body →**
> This is where you set up shop. You'll pick your plan in the PetAppro provider portal and be taking bookings in minutes — Starter's free, no card required.

**Button:** Continue to the portal  ·  **Below:** Already have an account? Sign in

**Change notes:** light warm-up only ("set up shop," "taking bookings"). This is the one page that flips for pre-launch — if the portal isn't live, "Continue to the portal" becomes the waitlist capture and "Sign in" hides (per decision #2). Kept plain otherwise; it's a doorway, not a pitch.

---

## 9) POLICIES (index)  *(plain — trust page, keep it plain)*

**Eyebrow:** PETAPPRO  ·  **H1 (unchanged):** Policies

**Intro (kept — it's clear and trust-building):**
> PetAppro is made by Base509 LLC, and these policies govern your use of it. Each policy is versioned — your agreement stays bound to the version you accepted, and old versions stay archived here.

**Policy cards:** leave the titles and one-line descriptions **as-is** (Terms of Service, Privacy Policy, Cancellation, Refund, Account Ownership, Sub-processors, Data Processing Addendum, Accessibility Statement, Security Overview). They're plain, accurate, and correctly scoped — no voice pass. Keep the draft/placeholder status labels ("Draft v0.1 — pending counsel," "Placeholder — not yet drafted") until counsel delivers.

**Change notes:** none to the copy. Personality stays out of the legal index on purpose.

---

## 10) LEGAL & POLICY PAGES — Privacy Policy, Terms of Service, and the rest

**⛔ Boundary — do NOT voice-pass these.** The bodies of Privacy Policy, Terms of Service, Cancellation, Refund, Account Ownership, Sub-processors, DPA, Accessibility, and Security are **attorney-drafted legal text**, not marketing copy. Cowork/the builder must not rewrite, "warm up," or pun on any policy body. The current pages correctly show placeholders and a "PLACEHOLDER — an attorney drafts and reviews all policy text before publishing" notice — leave that as the standing behavior.

**What *is* okay to keep/lightly keep-plain (product framing only, not legal text):**
- Privacy placeholder helper line — keep as-is: *"What we collect, why, and who owns what. Platform data vs. provider-managed client data."* and *"Questions in the meantime? Contact support@base509.com."*
- The yellow placeholder banners — keep as-is.
- Terms page must retain its **"DRAFT — PENDING ATTORNEY REVIEW. DO NOT PUBLISH"** guard until counsel signs off.

**Change notes:** intentionally none. Flagging so the voice pass stops at the legal boundary.

---

## Summary of what changed
- **Voice:** conversational, warm, one dog-wink per welcoming moment; money/legal/support left plain per the dial.
- **Dog-first:** all "pet-care" → "dog-care"; cats stay a future note.
- **Pre-launch:** "Start free" → waitlist capture; "Sign in" removed; store badges → Notify-me. *(Confirm email-capture mechanism with Danny.)*
- **Untouched on purpose:** the plan numbers, the feature matrix, the "We take nothing" lines, the pull quote, the "no fake testimonials" note, and the whole Support page's plain reassurance.

## Still needs Danny
- **Will the provider portal be live at launch?** This decides whether the Sign up page ships as-designed or flips "Continue to the portal" into a waitlist capture (and hides "Sign in"). See decision #2.
- If not live: does an **email-capture tool** exist, or should the builder stand up a simple one?
- Confirm **dog-first wording** is good to roll site-wide (app + Base509 site already point this way).
- Confirm whether **Support** and **Contact** stay as two pages or merge (both route to support@base509.com).
