# Legal & policy drafts

> **Everything in this folder is a DRAFT pending attorney review. Nothing here is legal advice, and nothing publishes until counsel signs off.**
> **Purpose:** give the attorney drafts tailored to our actual facts instead of a blank page. Counsel reviews, edits, approves. Cheaper for us, better for them.
> **Author:** Cowork (product) · **Reviewer:** attorney · **Renders via:** the `/policies` hub (spec `docs/specs/website-content-and-structure.md` §6).

---

## Status

| Document | File | Status | Launch blocker? |
|---|---|---|---|
| **Provider Terms** | `provider-terms.draft.md` | **Draft v0.3 — §§1–12 COMPLETE** (2026-07-17) | **Yes** — store submission |
| ~~Terms of Service~~ | `terms-of-service.draft.md` | ⛔ **RETIRED 2026-07-17 (D-060)** — split into Client + Provider Terms. Reference only; **contents are stale, do not cite** | — |
| **Client Terms** | `client-terms.draft.md` | **Draft v0.2 (2026-07-17)** — cap resolved at **$100, software-specific**. ⛔ 4 product blockers: deletion/bookings · post-booking charges · Provider-scoped payment methods · doc hierarchy | **Yes** |
| Privacy Policy | `privacy-policy.draft.md` | **Draft v0.2 — rebuilt 2026-07-17. ⛔ 6 hard blockers, see below** | **Yes** — Apple/Google require the URL |
| Cancellation Policy | `cancellation-policy.draft.md` | Draft v0.1 | No — but **CARL drives product behavior** |
| Refund Policy | `refund-policy.draft.md` | Draft v0.1 | No |
| Account Ownership Policy | `account-ownership-policy.draft.md` | Draft v0.1 | No — ~~blocked on D-057~~ **D-057 DECIDED 2026-07-17** |
| Sub-processors | `subprocessors.draft.md` | Draft v0.1 | No — **needs engineering to confirm the vendor list** |
| Data Processing Addendum | `dpa.draft.md` | **Skeleton only** | No — **counsel must draft the operative terms** |
| Accessibility Statement | `accessibility-statement.draft.md` | Draft v0.1 | No — **don't publish until it's true** |
| Security Overview | `security-overview.draft.md` | Draft v0.1 | No — **needs engineering verification of every claim** |
| Provider house-rules boilerplate | *not yet written* | TODO | No — layer 2 (F-022) |
| **Enforcement & escalation playbook** | *not yet written* | **TODO — before launch** | Operational, not published |

> **Enforcement & escalation playbook (Provider Terms §7):** internal, not a public policy. Must cover: evidence preservation · severity levels · emergency contacts · who may suspend an account · **how active bookings are handled** · when the Provider Owner is notified · who approves disclosure to authorities.
> ⚠️ **Suspension must preserve tenant isolation and must not strand animals with active services.** Suspending a boarder mid-stay is a safety event, not an account action.

---

## ⚠️ Product/safety requirements surfaced by the legal review

These came out of drafting and are **not legal text** — they're things the product must actually do. They need to reach Fable, Codex, and Claude Code.

| # | Requirement | Source |
|---|---|---|
| 1 | **Offline access to critical care info.** An outage must not leave a provider without medication instructions, emergency contacts, home-access info, or today's bookings. Candidates: offline cache of today's schedule + care sheet, printable/exportable daily care sheet, cached read-only mode. **Launch testing, not just Terms.** | Provider Terms §8 |
| 2 | **Suspension must not strand animals mid-service.** The product must distinguish suspending an idle account from one with active bookings. | Provider Terms §7 |
| 3 | **Every later charge needs a traceable authorization captured at booking** — no-show, cancellation, damage, added service. Constrains the D-043 off-hours surcharge + timed-service no-show fee designs. | Provider Terms §5 |
| 4 | **Stripe: direct charges only, no `application_fee_amount`.** The §2 liability position depends on it. | Provider Terms §5 |
| 5 | **Clickwrap acceptance evidence:** version hashes, exact screen wording, UI version, checkbox state, timestamp, app version, session/device. Retain **≥3 years or 1 year post-termination, whichever is longer.** | Provider Terms §§1, 3, 4 |
| 6 | **Auto-renewal controls:** separate unchecked consent beside the buy button; amount/date dynamically rendered; retainable confirmation; trial (3–21d if >31d), annual, ≥1-yr (15–45d), and price-change (7–30d) notices; backup cancellation path. | Provider Terms §4 |
| 7 | **Version + retain the plan/support description shown at purchase** with the subscription record. The pricing page must not silently redefine what an existing provider bought. | Provider Terms §8 |
| 8 | **Deleting a business account must auto-cancel the SaaS renewal.** | Provider Terms §3 |
| 9 | **Both deletion paths:** Apple requires in-app; **Google requires in-app AND a web resource.** | Provider Terms §3 |
| 10 | **Successor must affirmatively accept the Owner permission.** No auto-promotion — nomination → acceptance → identity verification → recorded → admins notified. Nobody gets drafted into running a business. | §9 · D-057 |
| 11 | **30-day read-only Client export window** on business closure: pets, care instructions, report cards, photos, booking history, invoices/receipts, Provider closure contact. No new bookings or charges during it. | §9 · D-057 |
| 12 | **Safety closure state.** If an animal is in custody or a service is in progress, **accept the deletion request immediately** but delay *final* closure only as long as safe handoff needs. Restricted account = safety, comms, documentation, refunds, closure only. **This is the sharp edge of #2.** | §9 · D-057 |
| 13 | **Auto-refund prepaid, undelivered future services** on closure. PetAppro transmits the Stripe instruction; **needs a fallback path when Stripe can't complete** (insufficient balance) — Provider stays liable. | §9 · D-057 |
| 14 | **Simultaneous cancellation notices** to Client and Provider. Never "Provider knew first." | §9 · D-057 |
| 15 | **Debt never blocks deletion.** Never gate a deletion request on an unpaid balance. | §9 · D-057 |
| 16 | ⛔ **Never retain a functional login to preserve foreign keys or invoices.** Delete the human identity; re-point FKs at tombstones. A retained record must not permit sign-in or let a closed business resume operating. **Schema constraint, not a policy footnote.** | §9 · D-057 |
| 17 | **Immediate closure must exist alongside term-end closure.** Apple requires an immediate option wherever scheduled deletion is offered. Immediate closure cancels SaaS renewal at once. | §9 · D-057 |
| 18 | ⛔ **NO VETTING — a product constraint, permanently.** Danny killed the insurance covenant (2026-07-17, D-058). We do not vet, verify, screen, background-check, certify, rate, endorse, or badge Providers. **Therefore the UI must never imply we do:** no "verified," "trusted," "certified," "approved," "screened," or "background-checked" badging; no star ratings or rankings by us; no language that reads as endorsement. This binds **product, design, and marketing** — the moment a badge appears, §10 becomes false and we look like the guarantor we've spent twelve sections denying we are. | §10 · D-058 |
| 19 | **Version + effective date + archived prior text on every policy**, plus **correction metadata** for non-substantive fixes, plus **fresh-acceptance gating** for changes to payment/renewal/cancellation/liability/indemnity/ownership/disputes. This is the §11 machinery — it's a build, not a page. | §11 |
| 20 | ⛔ **GPS consent + auto-stop — DESIGNED 2026-07-17 (D-054), now build it.** **(a)** Interstitial before the OS prompt + **unchecked, unbundled** confirmation checkbox, stating specifics (precise location · background collection · who sees the route · retention · how it stops). **(b) Auto-stop, day one:** check-out **+ report-card submission kills tracking** + booking-window cutoff + hard max duration; geofence/idle as *prompts only*; live map dies at service end. **(c) Provider covenant (TO DRAFT)** — Provider gives staff monitoring notice + obtains consent, and represents it before dispatching. **(d) Onboarding surface on petappro.com** explaining GPS + the staff-notice duty at the point tracking is enabled. Cal. Penal Code §637.7 — counsel review. **(e)** ⛔ **No vague sign-up "consent" to background tracking** — fails Google's just-in-time rule *and* is weak consent. | Privacy §2 · **D-054 launch gate** |
| 21 | **Marketing email must be a separate, independently unsubscribable stream** from transactional/service mail. Opt-outs honored within **10 business days** (CAN-SPAM). Booking confirmations, security alerts, subscription and policy notices continue regardless. | Privacy §8 |
| 22 | **Client deletion must match what we promise.** v0.1 claimed deletion erases pets/profile "from every provider" — **false**, and it contradicted our own processor role. Build: erase PetAppro-controlled identity data, unlink, initiate the Provider-data workflow, **and disclose that Providers may lawfully retain records.** The deletion UI must say this too — not just the policy. | Privacy §7 |
| 23 | **Advertising change-control gate.** Any future use of customer lists, pixels, retargeting, conversion APIs, or custom audiences must trigger a **privacy-policy + subprocessor + cookie/tracking + app-store disclosure review BEFORE activation.** "Do not currently" is only honest if something enforces the "currently." | Privacy §4 |
| 24 | **Retention schedule is a build, not a document.** Every `[PERIOD]` in Privacy §6 needs a real number *and a job that enforces it.* Highest-risk categories: **precise GPS routes** and **home-access codes/lockbox info** — defaults should be short and aggressive. Engineering must confirm the **Supabase backup cycle** before we publish a number we can't meet. | Privacy §6 |
| 25 | **Store disclosure sync.** Apple **App Privacy** details, Google **Data Safety** answers, permission purpose strings, and every third-party SDK's behavior must match the final policy. Apple requires third-party data practices and linked data to be declared. | Privacy — all · MKT-12 |
| 26 | ⚠️ **Client-side live route shows a WORKER's real-time location.** The person on the map is a human with their own privacy interest, and they're the *Provider's* staff, not the Client's. **Build: live map during the active service only** (map dies at service end), **NO post-hoc replay of precise coordinates to Clients** — a summary (time, distance, path overview) is what a Client wants, at a fraction of the risk. **Worker notice = "your location is being shared and your client MAY be viewing it" — persistent, never a live "someone is watching now" indicator** (Danny, 2026-07-17 — D-054). | Client Terms §5 · D-054 |
| 27 | **Client-side "leave a provider" must exist as a distinct action** from account deletion, and must not disturb other Provider relationships (F-011). Both Client Terms §9 and Privacy §7 promise it. | Client Terms §9 |
| 28 | **Prompt Clients to rotate home-access codes when a Provider relationship ends.** Client Terms §5 now *recommends* temporary/service-specific codes and changing them after a relationship ends — **so the product should make that easy**, or it's advice we don't support. | Client Terms §5 |
| 29 | **Separate Provider-terms acceptance at the BOOKING-REVIEW step.** Sign-up acceptance does **not** double as acceptance of a Provider's policies. Store: Provider legal identity · policy version/hash · total · payment timing · contingent-fee terms · checkbox state · timestamp · booking ID · app version. (Berman.) | Client Terms §1 |
| 30 | ⛔ **California all-in pricing (SB 478).** A displayed price to a CA consumer must **include mandatory Provider fees** (excluding government taxes). **Revealing a mandatory surcharge at checkout is insufficient.** ⚠️ **Not a Provider toggle and not our option** — what the Provider configures is whether a fee is **mandatory or optional**; SB 478 then dictates the display. **Engine rule: the displayed price for a given booking configuration always includes everything mandatory for that configuration** — computed, not opted into. Constrains **D-043** off-hours surcharge (auto-applies by time = mandatory = must be in the shown price). Optional add-ons the Client selects may be separate. | Client Terms §4 |
| 31 | ⛔ **Damage charges + added services require NEW affirmative approval** after the amount is known — they cannot ride on booking-time consent. Cancellation/no-show fees *may* be authorized at booking **only if the exact amount or objective calculation is clear**. Otherwise the Provider invoices. Constrains D-043 + timed-service no-show design. (Stripe saved-payment consent rules.) | Client Terms §4 |
| 32 | ⛔ **Saved payment methods must be Provider-scoped — tenant isolation with money attached.** Direct charges hit **separate Standard connected accounts**; a method saved for Provider A **must not become chargeable by Provider B**. Scope the authorization *and the payment object* to the identified merchant. | Client Terms §4 |
| 33 | **Home-access visibility scoped to role/assignment, not blanket staff.** Client Terms §5 now promises access is limited to personnel **authorized for that service or role**. If the permission model can't scope to assignment, that sentence is false. | Client Terms §5 |
| 34 | ⛔ **Client deletion must cancel unstarted future bookings**, with simultaneous notice to Client + each Provider, and **the cancellation amount shown BEFORE confirmation**. A future booking cannot survive the Client losing access to its details, payment controls, and cancellation tools. Scheduled deletion after the last booking may be offered but **never as the only option** (Apple 5.1.1(v)). Active service → restricted safety-completion state. | Client Terms §9 |

---

## How these were written

- **Structure + plain-language style** adapted from [37signals' policies](https://37signals.com/policies), which are **Creative Commons Attribution** licensed — explicitly open-sourced to be reused and adapted. **Attribution is required** where we ship materially similar text, and is included in the drafts.
- **Layer-1 framing** (we're software, the provider is a separate business) shaped by **Housecall Pro** — our structural twin, SaaS for service pros rather than a marketplace.
- **Wag/Rover were deliberately NOT used for platform terms.** They're marketplaces; they stand between the parties and we don't. Their operational substance belongs in the **provider house-rules boilerplate** (layer 2). See spec §6.1a source map.
- **Substance is ours** — the two-sided relationship, processor role, Stripe Connect, GPS, pet data, CARL, tenant ownership. None of that is copied.

## The two layers (D-055)

1. **Platform policies** — Base509 ↔ everyone using PetAppro. **This folder.**
2. **Provider policies** — provider ↔ their clients (house rules, cancellation window, meet-&-greet). Shipped **in-app as an editable template** (F-022), not here. *Still to write — this is where Wag's home-access material gets rewritten in our voice.*

---

## Open items counsel must resolve

- ~~**D-057**~~ — **DECIDED 2026-07-17** (hybrid: transfer first, closure fallback; 9 product decisions). Counsel to sanity-check the flow, not design it. See decisions log.
- **⚠️ RETENTION DUTY — the correction that matters most.** We withdrew the claim that *"the law requires PetAppro to retain issued invoices and tax records."* **The Provider is the merchant and tax-reporting party for booking revenue; PetAppro may be only its processor for those records.** Counsel must assign, **per record category: which party retains it · legal basis · exact period.** This blocks Privacy §6–7, DPA §8, Provider Terms §9, ToS, and the ownership policy — all five now carry the flag rather than the claim. **Nothing publishes with an unsupported retention justification.**
- **CARL scope** — does California's Automatic Renewal Law reach *business* subscribers? Many of our providers are sole proprietors. **We are not relying on a B2B exemption** either way.
- ~~**Arbitration / class-action waiver**~~ — **ANSWERED 2026-07-17: NO, not at launch.** Reasoned, not defaulted: mixed Provider/consumer users · consumer venue can't simply be waived · McGill preserves public-injunction rights · Civ. Code §1670.15 (SB 82) limits consumer dispute provisions · the machinery (administrator, fees, opt-out, mass-filing, small-claims, severability) is real work. Provider Terms §12 now says so affirmatively. Counsel to confirm.
- ~~**VENUE**~~ — **RESOLVED 2026-07-17: San Francisco, San Francisco County.** (The San Diego placeholder was wrong and is gone.)
- ~~**NOTICE ADDRESS**~~ — **RESOLVED 2026-07-17.** Both Terms name the registered agent already on file (Launch Registered Agent, Vista CA) for **service of process only**; email for ordinary notices. Home address stays out. *(Provider Terms originally said "formal legal notice" while Client Terms said service-of-process — narrowed to match.)* **If we want a physical address for ordinary contract notices, add a virtual address in SF County** — don't assume the agent forwards mail.
- **⚠️ PRINCIPAL OFFICE — open, and it's a privacy issue not a drafting one.** The registered agent solves service of process; it does **not** hide the principal office, which is filed as Danny's home and is **public record** on the CA Statement of Information. **Danny to check the SOS business search.** A forward-looking refiling is possible; retraction isn't. → D-059.
- **DPA necessity** — CCPA doesn't currently apply to us, GDPR doesn't (US-only). Offer one anyway? (Product view: yes — providers will ask, and some of *them* may be covered.)
- **Sensitive-data classification** — do home access codes, pet medication records, or precise staff location count as "sensitive personal information" under CPRA?
- **⭐ DANNY'S CALL — the "never poach your clients" promise.** The review softened v0.1's absolutes to *"do not currently."* **Cowork recommends splitting them:** drop *"we don't market to a provider's clients"* (too broad to keep honestly — Clients are our users too), but **keep a firm, permanent prohibition on promotional email to a Provider's Clients using addresses obtained through the Provider relationship.** That one isn't legal hygiene — it's the trust proposition. Every PCSP's deepest fear about a booking platform is *"will you use my client list against me?"* Marketplaces did exactly that. **A "never" is a differentiator; "do not currently" is the hedge providers have learned to distrust.** Coherent with D-029 + D-058. See Privacy §4. **Counsel: if adopted, word it to survive a change of control.**
- **CalOPPA** — now addressed in Privacy §12 (applies independently of CCPA thresholds). Confirm the DNT/GPC posture is accurate for what we actually ship.
- **Retention periods** — see the retention-duty flag above. Do not assume PetAppro is the retaining party.
- **Age threshold** (18+ assumed) and COPPA posture.

## Before publishing — non-negotiables

1. **Attorney review + sign-off.** Every document.
2. **Engineering verification** of `subprocessors` and `security-overview` — every claim must be true.
3. **Accessibility statement** must describe reality, including known gaps.
4. **Version + effective date** set, and the versioning model live (spec §6.1: numbered, dated, old versions archived, notice before material changes take effect).
5. **Remove the DRAFT banners** only when all of the above is done.
