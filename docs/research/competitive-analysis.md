# Competitive Analysis — complaints → PetAppro response

**Status:** Research pass (Cowork, 2026-07-11). Feeds tier pricing (D-020) and differentiation. Sources: public review sites (Capterra, G2, Trustpilot, SoftwareAdvice, PissedConsumer) + vendor pricing pages, 2026.
**Method:** pull the recurring *complaints* about each competitor, map each to a concrete PetAppro answer, then extract our wedges and our parity gaps.

---

## 1. Two competitor categories

- **Marketplaces — Rover, Wag.** They *bring clients* but take a large cut and own the relationship. PetAppro is deliberately **not** this (D-029). Our angle is the **"get off the marketplace"** story for providers who already have their own clients.
- **Provider software — Time To Pet, Scout, Precise Petcare** (+ Paw Partner, PetPocketbook). Direct product competitors. Our angle is **flat pricing + best-in-class mobile UX + modern features**.

---

## 2. Competitor snapshots + top complaints

### Rover (marketplace)
- **Model:** ~20%+ commission from sitters + booking fee to owners.
- **Complaints:** sitters call the cut a "rip-off" and get **no support**; owners report **safety/vetting failures** and **unresponsive support**; **buggy app** — walk tracker glitches, *deletes entire walk records*, and keeps recording after the walk ends. (SmartCustomer 1.4/5; Gizmodo horror stories.)

### Wag (marketplace)
- **Model:** ~**40% commission**; most bookings **auto-assigned** (walker profile/price barely matter).
- **Complaints:** walkers report **below-minimum-wage** effective pay + bad support; owners report **slow/buggy app, no-show walkers, unreliable scheduling, billing errors/overcharges, poor support, safety incidents**. (Trustpilot, PissedConsumer, Indeed.)

### Time To Pet (software)
- **Model:** base + **$16/active staff**; SMS +$10/mo. Priciest in category.
- **Complaints:** **per-staff pricing gets expensive**; **reminders not automated**; **email-primary → clients miss updates**; **SMS metered/limited**; **billing can't differentiate pet types** (multi-pet mis-billed); **overwhelming setup / learning curve**; hard to book **overnight/long-term**; subcontractor **privacy** concerns. (Capterra, SoftwareAdvice.)

### Scout (software)
- **Model:** base + ~$15/staff.
- **Complaints:** **billing not customizable** (no prepay/packages); wants better **invoice/billing-cycle control**; wants **better in-app messaging**; **staff can't enter their own availability**; vendor **dismissive of feedback**; bugs + uneven support; can't **preview a client's bill** at scheduling time. (Capterra, SoftwareAdvice.)

### Precise Petcare (software)
- **Model:** flat seat bands ($20/$45/$90).
- **Complaints:** **server down frequently**; **GPS inaccurate** (check-in/out logged miles off → can't audit); **clients confused how to request visits** (their #1 client complaint); **clunky UI** (3+ clicks for simple actions); **crashes, long loads, sync issues, freezes, forced logouts**; **English-only**. (Capterra, SoftwareAdvice.)

---

## 3. Complaint → PetAppro response (the core map)

| Recurring complaint (who) | PetAppro answer | Backed by |
|---|---|---|
| **Marketplace takes 20–40% + owns the client** (Rover, Wag providers) | Subscription-only, **no take-rate**; providers own their clients + brand | D-029, D-039 |
| **Per-active-staff pricing gets expensive** (TTP, Scout) | **Flat per-band pricing**, no per-seat surcharge; free Starter | D-020 pricing |
| **Buggy, clunky, crashy, many-click apps** (Rover, Wag, Precise) | **Best-in-class native mobile UX** — fast, modern, few taps (our core bet) | D-001, DS work |
| **Inaccurate/glitchy GPS** (Rover, Precise) | GPS done right **at launch** — accurate check-in/out coordinates + reliable track | D-054 |
| **Email-primary → clients miss updates; SMS metered** (TTP) | **Push + email built-in free**; report cards + real-time updates; SMS opt-in only at top tier | D-046, D-049 |
| **Clients confused how to book** (Precise, Rover) | Clean **self-service client booking** + invite onboarding + live price preview | product_brief Pillar B |
| **Can't preview the bill / can't differentiate pets** (TTP, Scout) | **Explicit-rate engine** w/ per-pet flat surcharges + **stored breakdown** + live preview | D-039 |
| **Staff can't set availability; subcontractor privacy** (Scout, TTP) | Graded roles + permission gating + staff-only vs client-visible notes | D-032, D-033 |
| **No prepay/packages, rigid billing** (Scout) | Explicit rates now; packages/prepay a **known later add** (parity gap — §5) | D-039 |
| **Poor / dismissive support** (Rover, Wag, Scout) | Support as a paid-tier value (Starter has none); responsive-by-design brand | D-020 |
| **Server downtime** (Precise) | Supabase infra; reliability as a feature | D-034–D-038 |
| **Hard to book overnight/long-term** (TTP) | Boarding + in-home/house sitting as first-class per-night services | D-048 |

---

## 4. Our wedges (where to lean hardest)

1. **"Own your clients, keep your money."** The strongest single message — aimed at providers bleeding 20–40% to Rover/Wag. We're their own-branded booking app with **no cut** (D-029/D-039). This is the acquisition narrative.
2. **Flat, predictable pricing + free Starter.** Directly answers the #1 software complaint (per-staff costs balloon). "A 5-person shop is ~$120 on Time To Pet vs $79 flat with us."
3. **Best-in-class UX.** Every competitor — marketplace and software — gets dinged for buggy, clunky, crash-prone apps. A genuinely fast, modern, few-tap native app is a durable differentiator, not a feature.
4. **Updates clients actually see.** Free push + email + report cards + check-in/out beats "email-only, clients miss it."
5. **Transparent pricing to the client.** Live preview + stored breakdown beats "can't see the bill until after."

---

## 5. Parity gaps / risks (be honest)

- **Client acquisition:** marketplaces *bring customers*; we don't (deliberate, D-029). **Answer:** we target providers who already have clients and want off the marketplace/spreadsheets (the Woof WeTreats profile). **Acquisition-assist without becoming a marketplace:** give providers a **shareable marketing card + QR** to post on social (Nextdoor/Facebook/IG) so they grow their *own* book (**F-023**); an authentic **profile story/bio** to convert prospects (**F-024**); and explore **retail/sponsor partnerships** (Pet Food Express, PetSmart, Chewy) as a channel (**F-025**). We help them grow — we just don't broker.
- **GPS at launch:** D-054 makes accurate live tracking a hard launch gate for Crew+. This is both a wedge and the highest reliability/store-review risk; schedule it early and move the date rather than shipping inaccurate tracking. F-026 was dropped because advertising GPS as “coming soon” would contradict launch scope.
- **Deep billing features:** packages, prepay, invoice customization, QuickBooks/accounting integrations — mature competitors have these; we're MVP. Don't over-promise; roadmap them.
- **Feature breadth:** TTP/Gingr have years of surface area. We compete on focus + UX + price, not feature count. Avoid "we do everything" positioning.
- **Support expectations:** we're small; "responsive support" must be real or it becomes our own bad-review theme. Starter (free) = no support by design.

---

## 6. Positioning statement

> **PetAppro is the modern, mobile-first booking app for pet-care providers who already have clients — flat, predictable pricing with a free tier, no per-staff fees, and no marketplace cut. You own your clients, your brand, and your money.**

Threads between the marketplaces (we don't take a cut or own your clients) and the software incumbents (we're cheaper at scale, better-built, and free to start).

---

## 7. Feeds pricing (D-020)

The complaints validate the tier model: **flat-per-band** (vs per-staff outrage), **free Starter** (vs "$25 minimum"), **payments + UX as the paid hooks**, and **best-in-class UX as the through-line** that justifies choosing us over a cheaper flat-unlimited discounter (PetPocketbook $25). Next: firm the placeholder prices against real willingness-to-pay at the D-021 beta.
