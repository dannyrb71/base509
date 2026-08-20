# PetAppro — TASKS.md (single shared to-do list)

> **This is the George-owned master execution list.** George maintains coordination, timeline, task state, and syncs. Product Management (Cowork/Claude) owns specs and prioritization; Codex is read-only Governance; Fable/Code is the only coder, committer, and pusher; Danny is final approver and the only deploy go.
>
> **How to update:** change a task's `Status`, add new tasks at the bottom of the right section, and add a line to the Changelog with today's date. Whoever edits it should keep the format intact so the other tools can parse it.
>
> **Launch status (EOD 2026-08-20):** Phase A provider authentication + portal-on-real-dev-data is essentially built and deployed behind the dark portal domain; no customer-facing portal exposure changed. Email/password signup/sign-in, recovery, tenant isolation, and persisted tenant themes are working. Google/Apple buttons are built but unwired and are a hard pre-launch gate. Next sequence: social auth → booking engine → mobile app → payments. Oct 1 remains tracked. Google Play enrollment is paused pending D&B address propagation.

---

## Status legend
- `TODO` — not started
- `DOING` — in progress
- `REVIEW` — built, awaiting Codex review + Danny's real-device check
- `BLOCKED` — waiting on something (say what in Notes)
- `DONE` — finished and verified

---

## 🔥 This week's focus (update every Monday)
_Week of: 2026-08-17 (George sync)_
1. **Wire Google + Apple provider sign-in — HARD PRE-LAUNCH GATE:** branded buttons exist on sign-up/sign-in; complete provider wiring and test recovery/account-linking behavior before Oct 1.
2. **Booking engine — NEXT BUILD:** build against the working dev database and shared pricing/service foundation; per-occurrence conflict handling remains a separately reviewed/tested slice.
3. **Expo/React Native mobile app:** begin once booking interfaces stabilize; carry the same auth and tenant-isolation guarantees into native.
4. **Payments:** wire Stripe Connect booking payments and web-only Stripe Billing after the booking core; keep the two money rails separate and prohibit native IAP/subscription CTAs.
5. **Store + launch content:** Cowork/Claude prepares the store-listing and launch-content packet by **Aug 28** to protect mid-September submission and the Sep 1 content ramp.
6. **External/store track:** Apple enrollment is DONE. Google Play Organization enrollment remains PAUSED until D&B propagates the current business address.

## Operating lanes and handoff protocol — locked 2026-08-17

| Lane | Owner | May do | Must not do |
|---|---|---|---|
| Project Management | George | Master list, schedule, dependencies, syncs, handoffs | Author product requirements, ratify architecture, code, commit, push, deploy |
| Product Management | Cowork/Claude | Specs, requirements, prioritization, acceptance criteria | Code, commit, push, governance approval |
| Governance | Codex | Read-only architecture/schema/code ratification and review | Author product specs, implement, edit build output, commit, push |
| Coding/Dev | Fable/Code | Plan and implement approved work; sole committer/pusher | Self-approve governance/product decisions; deploy without Danny's exact go |
| Product Owner | Danny | Final approval, push/deploy authorization, scope decisions | — |

**Universal rules:** Fable is the single committer/pusher. No deploy without Danny's explicit **“ready to deploy.”** Every handoff contains one lane's bounded deliverable. **“DONE — ready to commit”** is the signal to Fable that a non-code lane's local artifact is ready for the sole-committer flow. Fable reports commit SHA, push state, and deploy state every time.

## CFG-1 controlled sequence — George owns coordination

| Gate | Owner | Status | Exit / handoff |
|---|---|---|---|
| CFG-1A — Product build packet | Cowork/Claude | DONE | Product requirements and objective acceptance criteria handed to Governance. |
| CFG-1B — Technical ratification | Codex | DONE | Read-only technical direction ratified. |
| CFG-1C — Local implementation | Fable/Code | DONE | Generic multi-tenant foundation, migrations, generated types, RBAC/RLS, and isolation tests built and hardened. |
| CFG-1D — Governance review | Codex | DONE — 4 PASSES | Four read-only review passes completed; a material security hole was caught and closed before acceptance. |
| CFG-1E — Product Owner approval | Danny | DONE — ACCEPTED | Accepted at commit `c7ee515`. Production database application was deliberately excluded. |
| CFG-1F — Push | Fable/Code | DONE | `c7ee515` pushed to `origin/main`; CI green, 103/103 on the real PostGIS service, drift-clean. Deploy/database state: production DB untouched. |

**Pricing engine — build-ready spec DONE (2026-07-08).** Reconciled George v2 → **`docs/specs/booking_and_pricing.md`** (source of truth): canonical enum + pinned order-of-operations + rounding/currency (minor units/bps/ppm, half-up per-line) + storable immutable breakdown + engine-pure boundary. Reconciliation deltas: **walking IN MVP** (D-022; +`duration_tiered`/`per_session`), **deposits OUT** (D-015), **payments = Stripe Connect** (D-007; total feeds the charge), **actor ids = `base509_account_id`** (D-035). Open product decisions resolved for MVP (tax / discount-basis / holiday-granularity / repricing). The shared `packages/pricing` engine now exists; any further build work follows **Product spec → Codex ratification → Fable implementation → Codex review → Danny approval → Fable push**.

> Removed from focus (2026-07-07): "form LLC → start D-U-N-S clock" (**done** — LLC approved, D-U-N-S 11-314-3683 in hand) and "line up 5–6 PCSP beta testers" (**too early** — that's post-freeze, ~late Aug; see BIZ-7).

---

## Closed historical sprint — Sprint 1 (Jul 7–18): reconciled to repository reality

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| S1-1 | Set up monorepo (apps/mobile, apps/web, packages/*, supabase/) | Fable/Code | DONE | Workspace, packages, web scaffold, mobile config, and Supabase migration infrastructure now exist. |
| S1-2 | Extract single `packages/pricing` from the 3 existing copies | Fable/Code | DONE | One shared package exists; 39 tests pass, 8 planned cases skipped. |
| S1-3 | Fix stale pricing test (15-night cap was removed) | Fable/Code | DONE | Verified in current suite. D-063 creates a new, separate correction below. |
| S1-4 | Extract `packages/booking` (validation + availability) | Fable/Code | TODO | Package absent; sequence after CFG-1 contract. |
| S1-5 | Generate Supabase DB types → `packages/data` | Fable/Code | DONE | Landed and drift-checked with CFG-1 at `c7ee515`. |
| S1-6 | GitHub Actions CI: typecheck + lint + test on every PR | Fable/Code | DONE | `ci.yml` and `eas-build.yml` exist. Re-verify enforcement after the authorized push. |
| S1-R | Codex review of S1-2/S1-3 (money logic) | Codex | DONE | Independent review completed; pricing fixes and regression coverage landed locally. |

**Sprint 1 outcome:** its pricing/CI exit criteria are materially present, but the broader foundation did not land. The missing schema/RLS half is now the recovery sprint and cannot be traded away.

## Closed recovery window — Foundation Recovery (Jul 31–Aug 14)

CFG-1 recovery completed 2026-08-18. Production application remains a later launch operation, not unfinished foundation work.

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| REC-0 | Protect and synchronize the ~2-week local work batch | Fable/Code · Danny approval | DONE | Authorized commits were pushed through the single-committer flow; current accepted foundation is on `origin/main`. |
| REC-1 | Ratify generic capacity persistence contract | George/Codex | DONE | `capacity_model = bounded | unlimited`; shared resources use tenant-scoped `capacity_group_id`; conflict groups remain scheduling-only. |
| REC-2 | Correct D-063 Boarding Extra behavior + golden tests | Fable/Code · Codex money review | TODO | Current engine uses actual-vs-scheduled pickup. Required behavior is deterministic at booking from booked pickup vs booked drop-off + covered hours, one flat optional fee, per-booking waiver, and boundary tests. |
| CFG-1 | Add Supabase migration infrastructure + generic service/tenant schema | Fable/Code · Codex review | DONE — ACCEPTED | Accepted at `c7ee515`; pushed to `origin/main`. Live database intentionally untouched. |
| REC-3 | Apply and test RLS at every tenant boundary | Fable/Code · Codex review | DONE | Negative tenant-isolation coverage hardened through four Governance review passes; security defect found during review was fixed. |
| REC-4 | Reconcile CI against migrations, generated types, and RLS tests | Fable/Code | DONE | CI green: 103/103 against PostGIS and schema drift clean. |

## App build phase — active from Aug 18

> Environment rule: feature work uses a CFG-1 dev/staging database. The production database remains untouched until Danny authorizes the near-launch apply. Every feature adds its own tests to the CI gate and follows the bounded Product → Governance → Fable → Governance → Danny → Fable handoff.

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| ENV-1 | Stand up CFG-1 dev/staging database | Fable/Code · Codex review | DONE | Phase A is running on real non-production data. Production remains untouched. |
| AUTH-1 | Provider email/password signup, sign-in, and recovery | Fable/Code · Codex review | DONE — DEV DEPLOYED | Authenticated portal uses real tenant data; tenant isolation verified; password recovery live. Portal remains behind the dark domain. |
| AUTH-2 | Wire Google and Apple provider sign-in | Fable/Code · Codex security review | TODO — HARD LAUNCH GATE | Brand-spec buttons are built on signup/sign-in but unwired. Must be complete and tested before Oct 1. |
| BOOK-1 | Build shared booking engine against real non-production data | Fable/Code · Codex money/security review | TODO — NEXT | Use the shared pricing engine and generic service model; client preview, staff edit, and server booking must not diverge. Start after AUTH-2. |
| BOOK-2 | Add per-occurrence conflict handling | Cowork/Claude → Codex → Fable/Code | BLOCKED by BOOK-1 SPEC | Separate Product packet, Governance ratification, implementation, review, and tests. Do not fold silently into BOOK-1. |
| PORTAL-2 | Bind portal theme keys to tenant configuration | Fable/Code · Codex review | DONE — DEV DEPLOYED | Tenant themes render fonts, logos, and live previews and persist to real dev data. |
| PORTAL-3 | Add tenant-safe client theme read | Fable/Code · Codex security review | DONE — VERIFIED | Portal theme state is tenant-scoped; multi-tenant isolation verified on Phase A. |
| PAY-1 | Wire Stripe Connect booking payments | Fable/Code · Codex money/security review | BLOCKED by BOOK-1 | Client→provider physical-service payments; keep provider-scoped Stripe objects and direct-charge posture. |
| PAY-2 | Wire Stripe Billing subscription experience | Fable/Code · Codex money/security review | DOING — TEST MODE | Provider→Base509 subscription, web-only. Stripe account and sandbox exist; keep fully separate from Connect. |
| APP-1 | Build Expo/React Native mobile application | Fable/Code · Codex review | BLOCKED by BOOK-1 interfaces | Native booking flow and authentication; store submission tracked separately. |
| STORE-1 | Complete app-store policy review and submission readiness | Codex → George/Danny | TODO | Apple enrollment done; Google Play remains externally blocked. Track deletion paths, privacy/location disclosures, no-IAP rule, metadata, and review buffer. |
| CI-1 | Upgrade minor CI `actions/*` dependencies to v5 | Fable/Code | TODO — NON-BLOCKING | Batch maintenance change with the normal CI evidence; do not displace app critical-path work. |
| PROD-DB-1 | Apply accepted foundation migrations to production | Fable/Code · Danny explicit approval | DEFERRED — NEAR LAUNCH | Target near Oct 1 only after staging evidence, backup/rollback readiness, Governance review, and Danny's explicit go. |

## Web launch + subscription critical path (Aug 12 onward)

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| WEB-R1 | Local production preflight: multi-domain `apps/web` | Codex | DONE — PUSH-READY | Aug 15: `npm run build` passed; 53 routes generated. The prior `Section.className` type failure is resolved. Push/deploy review still checks hostname isolation, brand separation, secrets, a11y, and links. |
| WEB-R2 | Policy registry publication/history change | Codex · legal owner | REVIEW — AWAITING PUSH/DEPLOY | Policies are published in the local registry. Verify stable URLs/content hashes and absence of draft/counsel placeholders on preview and production. |
| WEB-1 | First `apps/web` GitHub push → Vercel preview/domains | Fable/Code · Danny approval | DONE | Pushed and deployed; Base509/PetAppro domains and HTTPS verified live. |
| WEB-2 | Build PetAppro marketing site from real Figma content | Fable/Code · Codex review | DONE — LIVE | Live in the shared multi-domain app. |
| WEB-3 | Activate Supabase + Resend waitlist | Fable/Code · Codex review | DONE — LIVE | Production submission verified: persistence + branded Resend email. |
| PORTAL-EXPOSURE | Keep provider portal dark in production | Fable/Code | DONE — RESOLVED | Guard is live; `/portal` returns 404, including preview-host exposure. Do not reopen without Danny. |
| PORTAL-404 | Branded 404 page | Cowork/Claude → Fable/Code | DONE — LIVE | Branded 404 pages shipped and are live. |
| PORTAL-1 | Provider portal — Phase A auth + real data | Fable/Code · Codex review | DONE — DEV DEPLOYED / DARK | Provider signup/sign-in, recovery, real tenant data, isolation, and persisted themes are live on dev. Authenticated portal remains behind the dark domain; nothing customer-facing changed. |
| EMAIL-1 | Branded transactional-email infrastructure | Fable/Code · Codex review | DONE — LIVE | Sends as PetAppro <noreply@petappro.com>; support@ mailbox and branded transactional templates are configured. Launch requirement satisfied. |
| BILL-1 | Implement provider subscription checkout and account flow | Fable/Code · Codex money/security review | DOING — LONG POLE | Authenticated **web-only Stripe Billing in test mode**: plan/price lookup, trial/renewal disclosure + affirmative consent, Checkout, return/reconciliation, Customer Portal, invoices, cancellation, discounts via Stripe, Test Clocks, idempotent verified webhooks. |
| BILL-2 | Project Billing subscription state into PetAppro entitlements | Fable/Code · Codex review | BLOCKED by BILL-1 | Base509 Billing is commercial truth; PetAppro receives server-written tenant-scoped capabilities. Fail closed; ordinary clients cannot write tier/entitlement state. |
| BILL-R | Enforce Billing-vs-Connect and no-IAP boundaries | Codex | BLOCKED — AWAITING BUILD | Billing = provider→Base509 SaaS subscription, web only. Connect = client→provider physical-service payment. Reject shared Customers/payment methods/webhooks/ledgers, native purchase links/CTAs, and client-writable entitlement state. |

### Aug 15 foundation GO/NO-GO — closed GREEN on Aug 18

- **D-U-N-S in hand:** GREEN — Base509 LLC, 11-314-3683.
- **Tenant schema + RBAC/RLS:** GREEN — accepted at `c7ee515` after four Governance review passes and pushed to `origin/main`.
- **Verification:** 103/103 CI checks passed on the real PostGIS service; generated-schema drift is clean. A material security hole found during review was closed before acceptance.
- **Environment state:** live database untouched. Dev/staging apply is next; production apply is deliberately deferred until near launch.
- **Timeline effect:** the foundation architecture and major external-verification unknowns are materially de-risked roughly six weeks before Oct 1. The app build, payments, mobile delivery, and store review now determine the launch path.

---

## Provider configuration build gate — D-061 / onboarding spec

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| CFG-1 | **Implement generic five-axis `business_services` migration + generated DB types** | CFG-1A→F owners above | DONE — ACCEPTED | `c7ee515` on `origin/main`; CI green and production database untouched. |
| CFG-2 | **Wizard shell + Steps 1–2 using one generic service DTO/API** | Fable/Code | TODO — AFTER BOOK-1 | Dev data is available. Sequence after the booking core unless Product reprioritizes; boarding/daycare/walking remain preset data over the generic axes. |
| CFG-3 | **Provider-defined service type configuration UI** | Fable/Code · Codex review | TODO — NEAR-TERM | Danny priority, not launch scope. Expose the same generic axes and provider-defined name/key; completing this must not require a migration or rewrite of CFG-1/CFG-2. |

---

## Product/legal build gates — triaged 2026-07-19

> Source: `docs/legal/README.md` requirements #1–34. These are implementation constraints, not legal-copy tasks. **P0** items shape schema, money, tenant isolation, or safety and must be incorporated before the affected build slice begins. **Launch** items may be implemented later in sequence but must pass before store submission/public use. Counsel-owned retention periods and boundary language remain blocked on counsel; engineering must not invent them.

| ID | Work package | Priority | Owner | Status | Legal requirements / build gate |
|---|---|---|---|---|---|
| LG-1 | **Safety continuity states + offline critical-care access** | P0 / Launch | Fable/Code · Codex review | TODO | #1, #2, #12. Model active-service safety restrictions separately from account suspension/closure; cached read-only care sheet/today schedule and outage tests are launch gates. |
| LG-2 | **All-in pricing + later-charge authorization ledger** | P0 / Engine | Fable/Code · Codex money review | BLOCKED — spec/tests first | #3, #30, #31. Server price shown for a booking configuration includes every mandatory non-tax fee; damage/added-service charges require new affirmative approval; exact/objective cancellation/no-show authorization is snapshotted. Must update `packages/pricing` golden tests before checkout work. |
| LG-3 | **Stripe direct-charge and Provider-scoped payment boundary** | P0 / Money + tenancy | Fable/Code · Codex security review | TODO | #4, #32. Standard Connect direct charges only; reject `application_fee_amount`; authorization, Customer/payment method, PaymentIntent, and saved-method lookup remain scoped to the identified connected account/business. Cross-tenant money-isolation tests required. |
| LG-4 | **Versioned consent/evidence ledger** | P0 / Schema | Fable/Code · Codex review | BLOCKED — retention counsel input | #5, #19, #29. Version/hash exact text and UI, checkbox state, actor/session/device/app version, timestamps, provider legal identity, booking total/timing, and booking ID; fresh acceptance for material changes. Retention duration cannot be finalized without counsel. |
| LG-5 | **SaaS auto-renewal + purchase snapshot controls** | P0 / Billing | Fable/Code · Codex review | BLOCKED — counsel/CARL timing confirmation | #6, #7, #8. Separate unchecked renewal consent, dynamic amount/date, notices and fallback cancellation; snapshot plan/support description; business deletion cancels renewal immediately. Validate with Stripe Test Clocks. |
| LG-6 | **Deletion, leave-provider, ownership transfer, and closure saga** | P0 / Store + safety | Fable/Code · Codex security review | TODO | #9–17, #22, #27, #34. In-app + web deletion paths; affirmative successor acceptance; immediate option; future-booking cancellation amount preview; simultaneous notices; safe active-service restriction; exports/refunds/fallback; tombstones, no functional retained login, debt never blocks deletion. |
| LG-7 | **GPS consent, worker notice, lifecycle, and auto-stop** | P0 / D-054 launch gate | Fable/Code · Codex reliability/privacy review | BLOCKED — exact retention period/counsel covenant | #20, #24 (GPS), #26. Just-in-time unchecked consent before OS prompt; persistent worker notice; tracking only during active service; check-out/report-card/window/max-duration kill switches; no client coordinate replay; reliability and store-review tests scheduled early. |
| LG-8 | **Privacy lifecycle jobs + disclosure change control** | P0 / Launch | Fable/Code · Codex review | BLOCKED — counsel periods + backup-cycle confirmation | #21, #23–25. Separate marketing/transactional streams, enforceable retention/deletion jobs, SDK/subprocessor inventory, store-disclosure sync, and a review gate before advertising/tracking activation. |
| LG-9 | **Assignment-scoped home-access security** | P0 / Security | Fable/Code · Codex security review | TODO | #28, #33. Home-access data is visible only to assigned/authorized personnel during the service window; prompt code rotation when a Provider relationship ends. RLS and negative cross-role/cross-tenant tests required. |
| LG-10 | **No-vetting product-language invariant** | Permanent guardrail / Launch | George/PM | TODO | #18. Product defines the invariant; Fable implements it; Codex reviews it in separate lane handoffs. No verified/trusted/certified/approved/screened badges, ratings, rankings, or endorsement implications in product, design, or marketing. |
| LG-11 | **Enforcement and active-booking escalation playbook** | Launch / Operations | Danny · PM · counsel · Codex review | TODO | Legal README operational requirement. Define evidence preservation, severity, emergency handling, suspension authority, active-booking handling, Provider notice, and disclosure approval; product states must support the playbook. |

**Dependency rule:** LG-2/LG-3 must land in pricing/Connect design before checkout; LG-4/LG-6/LG-8 must shape migrations before identity/legal tables are frozen; LG-7 must shape GPS storage and background-location work before implementation; LG-9 must shape home-access RLS before any client-location data ships.

---

## Business / app-store track (runs in parallel — Danny owns)

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| BIZ-1 | Form **Base509 LLC** — sole owner: Danny (single-member). PetAppro = product/IP under it | Danny | DONE | **Approved 2026-07-06.** Entity No. **B20260309172**, file date 2026-07-04. Member-managed. Registered agent: Launch RA (Vista, CA). Operating Agreement finalized → `Company/Formation/` (needs signature). Save stamped Articles PDF here. |
| BIZ-2 | Get EIN (free, irs.gov) | Danny | DONE | **Obtained 2026-07-06.** EIN stored in `Company/Formation/` (confidential). Download CP 575 letter → save there. Unblocks bank acct + D-U-N-S |
| BIZ-3 | Open business bank account | Danny | DONE | **Account open + funded 2026-07-09** (owner capital contribution; self-fund ~6 mo). Details in `Finance/Banking/Wells-Fargo-Business-Checking.md`. |
| BIZ-4 | Request D-U-N-S number (free) | Danny | DONE | **Obtained 2026-07-07 (same day) via myD&B free flow — D-U-N-S 11-314-3683.** Stored in `Company/Formation/Base509-LLC-Key-Identifiers.md`. **RESOLVED 2026-07-14 — D&B Profile Manager now shows `Base509 LLC · D-U-N-S 11-314-3683` (case #34660335 closed). Legal name + State (CA) correct = the fields Apple matches → BIZ-5 unblocked.** **Record cleanup still needed (do before enrolling):** Phone **blank but required\***; **Year Business Started = 2019 → should be 2026** (LLC formed 2026-07-04 — last ghost of the stale record); **Date Incorporated blank → 2026-07-04**; Company Website blank → `base509.com`; Total Employees = 2 → verify (Base509 is single-member). |
| BIZ-5 | Open Apple Developer acct (Organization, $99) | Danny | DONE | Apple Organization enrollment complete. Track App Store Connect/listing/build submission separately. |
| BIZ-6 | Open Google Play acct (Organization, $25) | Danny | PAUSED — D&B ADDRESS | Enrollment is blocked until D&B propagates the current business address, the same root cause encountered during Apple enrollment. Resume as soon as D&B clears. |
| BIZ-7 | Recruit 5–6 PCSP beta testers | Danny | TODO | Via local Facebook PCSP group + Danny's network. Post-freeze beta (late-Aug, TestFlight/closed track) — **not** the MVP-complete freeze bar (that's Danny+Marco's own business as first test tenant, D-028) |
| BIZ-8 | **Elect S-corp tax status** — file IRS Form 2553, effective **2027-01-01** | Danny | TODO | **File Jan 2027** (hard deadline ~Mar 15, 2027 for a 1/1/27 effective date). LLC stays default disregarded-entity for 2026. Once active: reasonable-salary payroll + EDD reg, Form 1120-S / CA Form 100S, CPA. **Confirm with a CPA before filing.** |
| BIZ-9 | **Bind business insurance (E&O + GL + cyber) just before launch** | Danny | TODO | Get quotes early Sept (Vouch/Embroker or Next/Hiscox/Thimble). Bind ~late Sept so it's **active before the first real provider/client uses the app** (~Oct 1). Budget models it starting Sept. |
| BIZ-11 | **Set up Base509's own Stripe account for SaaS subscription billing** | Danny · Fable/Code | DOING — ACCOUNT CREATED | Stripe account exists in sandbox/test mode. Next: Billing Products/Prices, promotion codes, Checkout, Customer Portal, verified webhooks, and Test Clocks. Provider→Base509, web-only, separate from Connect. |
| BIZ-12 | **First `apps/web` push + Vercel Pro connection** | Danny · Fable/Code | DONE | Sites and waitlist are live; domains/HTTPS and production submission/email were verified. |
| BIZ-10 | Virtual SF address + initial Statement of Information | Danny | **✅ DONE 2026-07-17** | ✅ Address: **Base509 LLC, 1875 Mission St Ste 103 #660, San Francisco, CA 94103** (PostScan Mail Starter, $100/yr, Form 1583 filed). ✅ **SOI filed** with it in both principal + mailing fields — home address is off the CA record of record (still permanent in the Articles). Applied to Provider Terms §12, Client Terms §12, Privacy §14, Key Identifiers. **↳ BIZ-10b: propagate the new address to D&B (Case #34660335), Wells Fargo, IRS, and Apple/Google enrollment so everything matches before store submission (BIZ-5/BIZ-6).** | File the SOI with 434 Hanover and you publish the home address a *second* time, make it the standing record, and need another filing to undo it. File it with a CMRA address and the home address stays in **one** historical doc (the Articles). Same deadline, same fee, opposite outcome. **There is no "edit address" button — the SOI *is* the edit mechanism** (Danny hit this 2026-07-17; Articles are a permanent filed record, the SOI supersedes the displayed address). **Confirmed:** Articles B20260309172 (filed 7/4/2026) list 434 Hanover as *both* principal + mailing; SOS search displays it. **Articles are permanent — mitigation, not a scrub.** Steps: (1) **CMRA in SF County now** — notarized USPS Form 1583 is the slow part, budget days; (2) counsel confirms CMRA acceptable for CA principal office — **the vendors saying "yes" sell mailboxes**; (3) file LLC-12 at bizfileOnline, virtual address in **both** address fields; (4) propagate to D&B (11-314-3683), bank, IRS, **Apple/Google enrollment (BIZ-5/BIZ-6 — store listings surface address data)**; (5) aggregator opt-outs (Bizapedia/OpenCorporates — **partial, assume already scraped**). Amending Articles (LLC-2) not worth it. `[VERIFY in bizfile: LLC SOI cadence (biennial?) + fee — determines how often the address reprints.]` → **D-059** |

---

## Marketing & launch track (website + social — runs in parallel)

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| MKT-1 | Register domain(s): petappro.com (+ defensive names) | Danny | DONE | **petappro.com + base509.com registered 2026-07-07, both under one Cloudflare account.** Defensive vertical names (hairappro/cleanappro) optional/later |
| MKT-2 | Reserve social handles (IG, FB, Threads, TikTok, LinkedIn) @petappro | Danny | TODO | Grab early (~Aug 15). No X/Musk platforms |
| MKT-3 | Brand kit: logo, profile/banner art, palette | Danny | TODO | PetAppro has tokens+logo; **Base509 corporate identity is the open item** (positioning, wordmark, palette, name story). Gates site visual pass only |
| MKT-4 | Website scaffold + core pages (Next.js `apps/web`, **Vercel**) | Fable/Code | DONE — LIVE | Base509/PetAppro and both www hosts live with HTTPS. Portal remains dark by explicit guard. |
| MKT-5 | **Policy registry + Privacy / Terms / Support URLs** | Danny/Fable | DONE — LIVE | Published policy routes live; version-history behavior remains part of ongoing governance review. |
| MKT-5b | **Contact page** (petappro.com + base509.com) | Danny/Fable/Code | TODO | Form/email reachable; expected alongside support for store trust. = Roadmap LR-3 |
| MKT-5c | **PetAppro site / app landing experience (Figma → code)** | Fable/Code · Codex review | DONE — LIVE | Live in the shared multi-domain app. |
| MKT-6 | Provider portal + Stripe Billing account path | Fable/Code · Codex review | DOING — LONG POLE / MONEY | Portal remains 404 in production. Stripe test-mode Billing is the active path; web-only, no native IAP/link/CTA. |
| MKT-7 | Pre-launch content calendar + posts | Danny | TODO | Ramp from ~Sep 1 |
| MKT-8 | Demo/sizzle video (Adobe Quick Cut) | Danny | TODO | Reuse on site + stores |
| MKT-9 | Launch posts + store links | Danny | TODO | Oct 1 (fallback: late Oct) |
| MKT-10 | Base509.com company/marketing hub page | Fable/Code | DONE — LIVE | Production verified. |
| MKT-13 | Publish annual “1 month free” pricing model | Fable/Code | DONE — LIVE | Public pricing now shows annual totals: Starter $209, Solo $429, Duo $869, Crew $1,639; cards rebalanced. |
| MKT-14 | Store-listing + launch-content packet | Cowork/Claude | TODO — DUE AUG 28 | Supply approved store metadata/copy, screenshot narrative, launch messaging, and Sep 1 content-calendar inputs to George. Protects the mid-September submission window; no product blocker today. |
| MKT-12 | **App Store Review Guidelines compliance pass** — governance review **before** App Store Connect setup/submission | Codex | TODO | Product supplies the approved requirements as a separate handoff. Codex reviews PetAppro against Apple and Google Play policies and reports gaps to George. Known hotspots: in-app + web deletion paths, Sign in with Apple, no native SaaS purchase CTA/IAP, background-location consent, push-notification consent, privacy disclosures, accurate metadata, and support URLs. |
| MKT-11 | Create + submit app-store listings (App Store Connect + Play Console) | Danny/Fable/Code | TODO | **Submit ~mid-Sep**; set release date = Oct 1 and hold, then keep a **review buffer to Oct 1** (= Roadmap LR-8). Needs org accounts (BIZ-5/6 = LR-6/7) + live legal URLs (MKT-5 = LR-1/2). = Roadmap LR-6/7 prep |

---

## Design & Research track (runs in parallel — feeds DS + flows)

> Home: `docs/research/`. Working rule: every item names the decision it informs; findings hand off to `open_decisions.md` and `docs/design-system/`. Keep in concert with the **Base509 brand (MKT-3)** and **PetAppro Design System** — research → archetypes → flows → DS.

| ID | Task | Owner | Status | Notes |
|---|---|---|---|---|
| DR-1 | Red-pen JTBD + archetypes draft (`docs/research/jobs-to-be-done.md`, R-001) | Danny | REVIEW | Cowork drafted; PCSP job story + 6 archetype starters await Danny's edits. Anchor decided (**D-027**) |
| DR-2 | Experience-first competitive teardowns (Time To Pet, Gingr, Precise Petcare + Rover/Wag contrast) | Cowork | DOING | Charter/rubric/scorecards in `teardowns/README.md`; Rover review-mining done; feeds archetypes |
| DR-3 | Map archetypes → jobs → user-flows | Cowork | TODO | After DR-1 sign-off; feeds `docs/user-flows/` |
| DR-4 | Hand JTBD/archetype signals into DS decisions (mobile-native, glanceable, one-handed) | Cowork | TODO | Interlock with PetAppro Design System |
| DR-5 | Pricing study — capture each competitor's pricing *model* as a scorecard column | Cowork | TODO | Runs with DR-2 (two birds); see `teardowns/_scorecards.md` |
| DR-6 | Migrate Notion Discovery content → repo SSOT; slim Notion to PM + pointers | Cowork | TODO | Notion = project management, repo = content (Danny 2026-07-07). Migrate JTBD, archetypes, competitive first-pass, Flow Inventory into repo *before* slimming; journeys/flows stay in FigJam. Don't delete Notion content until safely in repo |
| DR-7 | **Pricing-model study across target verticals** (dog boarding/daycare/walking/sitting/training, + hair stylists, massage therapists) → common pricing primitives vs per-service unique | Cowork | IN PROGRESS (George v1+v2 drafted) | **MVP verticals = boarding + daycare + walking; GPS ships at launch for Crew+ under D-054 but remains outside pricing math.** Study covers others as design-for-later. Validates/corrects the generalized `services.pricing_model` + `pricing_config` bet (annex §5) before the pricing engine is built. Feeds a new pricing-generalization decision + `packages/pricing` design. Gates un-holding the pricing extraction |

**Interlocks:** DR work stays synced with **MKT-3** (Base509 brand identity — the open dependency) and the **Design System**; the bank account (**BIZ-3**) remains the live business-track item to finish. Standup should surface all three together.

---

## Upcoming sequence

The active app-build work is tracked in `ENV-1` through `PROD-DB-1` above. Phase A and the non-production environment are complete. Current sequence: wire Google/Apple provider auth → booking engine → separately reviewed per-occurrence conflicts → Expo/RN app → Connect/Billing wiring → store review/submission → production database apply near launch. Keep **Stripe Connect** (client→provider booking money) separate from **Stripe Billing** (provider→Base509 web-only subscription); no native IAP or subscription purchase CTA.

---

## Blocked / waiting
- **Google Play Organization enrollment:** PAUSED pending D&B propagation of the current business address; resume immediately when cleared. Apple enrollment is DONE and paid.
- **Production database:** deliberately untouched; CFG-1 production apply is deferred until near launch and requires staging evidence plus Danny's explicit approval.
- **Stripe wiring:** account exists in sandbox/test mode; implementation remains active across separate Billing and Connect workstreams.
- **Google/Apple provider auth:** not externally blocked, but unwired and now the immediate hard launch gate before booking work proceeds.
- ~~ARCH → Codex review~~ **DONE:** Codex ratified D-034–D-038; the stable account/identity/membership seam subsequently landed with CFG-1 at `c7ee515`.

---

## Decisions still needed from Danny
- [x] LLC: solo or with Marco? → **Resolved: sole owner, Danny (single-member LLC), filing 2026-07-04**
- [ ] Bring in a contract React Native dev for the September crunch? (biggest factor for hitting Oct 1)
- [ ] Confirm "Appro" brand family after a trademark clearance search
- [ ] Migrate existing Woof clients onto PetAppro as tenant #1, or run in parallel?

---

## Changelog (newest first)
- 2026-08-20 (George/PM, EOD report) — **Phase A essentially complete; critical path advanced to social auth → booking → mobile → payments.** Provider email/password signup/sign-in, recovery, real dev data, multi-tenant isolation, and persisted tenant-theme rendering are built and dev-deployed behind the dark portal domain. Google/Apple buttons meet brand spec but remain unwired and are a hard pre-launch gate. Public annual “1 month free” pricing is live at $209/$429/$869/$1,639. Branded transactional email is live from `noreply@petappro.com`, with support@ and branded templates configured. Added Product's Aug 28 store-listing/launch-content packet to protect mid-September submission. Oct 1 remains tracked. Local PM edit only — **DONE — ready to commit**; no commit/push/deploy by George.
- 2026-08-18 (George/PM) — **CFG-1 foundation milestone closed GREEN and app-build phase opened.** Recorded `c7ee515` as accepted and pushed to `origin/main` after four Codex review passes; a material security defect was caught and fixed before acceptance. CI is green (103/103 against PostGIS; drift-clean). Production database remains untouched by design. Added the active sequence: CFG-1 dev/staging database → booking engine + portal on real non-production data → separately reviewed per-occurrence conflict handling → Stripe Connect/Billing → Expo/RN → store review → production apply near launch. Apple enrollment is approved/paid; Stripe account exists in sandbox/test mode; branded 404s are live; capacity contract/docs and portal exposure are resolved. Google Play is paused on D&B address propagation. Every feature adds tests to CI. Local PM edit only — **DONE — ready to commit**; no commit/push/deploy/database apply by George.
- 2026-08-17 (George/PM) — **Four-lane operating model locked and master list reconciled.** George owns coordination/timeline/task tracking; Cowork/Claude owns Product; Codex is read-only Governance; Fable/Code is the sole coder/committer/pusher; Danny is final approver/deploy go. Added the explicit CFG-1A→F handoff chain. Current threads: docs commit `49911b5` awaits Danny's push call; portal exposure resolved (`/portal` 404); branded 404 in Product design; Stripe test mode and Google Play are long poles; Apple enrollment DONE. Marketing sites/waitlist are live. Local PM edit only — **DONE — ready to commit**; no commit/push/deploy by George.
- 2026-08-15 (Codex, from Danny status) — **Board/timeline re-baselined around the actual web bottleneck.** Base509 is push-ready; policies are published locally; the design system is published as a library; PetAppro marketing is built from real Figma content; provider portal is in progress with optional/offline booking payments. Verified `apps/web` production build green (53 routes). `apps/web` has never been pushed to GitHub: Danny-authorized first push by Claude Code is now the explicit launch bottleneck, gating Vercel (`Root Directory = apps/web`) → preview/domains → Supabase/Resend waitlist. No commit/push/deploy.
- 2026-08-12 (George/PM + Codex) — **Web critical path and review queue updated.** Base509 multi-domain site and policy registry are local/push-ready; GitHub/Vercel connection is scheduled Aug 13, so neither item is marked deployed. Queued Codex reviews for the first `apps/web` push and the six-policy v1.0/public-history change. Promoted the PetAppro Figma→code site and provider Stripe Billing web experience to launch-critical. Added explicit no-IAP and Stripe separation gates: Billing is provider→Base509 web-only SaaS; Connect is client→provider physical-service money. Pre-push finding: policy-registry provenance says publication approval occurred 2026-08-13 while the effective/current status is Aug 12; correct or confirm before push. No commit/push/deploy.
- 2026-07-31 — **Codex + Claude Code review reconciliation (Cowork doc-honesty pass).** Both reviewers returned CHANGES-NEEDED; the consensus is *specs sound/ratified, nothing implemented yet* (no `supabase/`, capacity schema, D-063 engine, tenant-isolation, LG-2/3). Fixed the safe doc contradictions so the batch commits honest: **D-063** status → "decided/spec complete; engine PENDING" (was "implemented"); **Payments working-default row** → Stripe Connect IS in MVP (D-007 Option A), was stale "deferred post-MVP"; **D-064** M&G gate reconciled with **D-006** ("configurable; hard *when enabled*"); **15-night cap** confirmed a **phantom** (never in PetAppro; mis-transcribed Woof 14-night self-service cap) and de-flagged in roadmap/technical_architecture/strategy (S1-3 satisfied by clean extraction); **`auth_identities`** draft synced to the architecture contract (unique by `(issuer, provider_subject)`). Verified already-fixed: `capacity_model = bounded|unlimited`, `capacity_group_id` separate from `conflict_group_id`. **Routed to Codex (pre-migration):** capacity_config dual window (service-cap-at-bedtime vs pool-consumption-spans-presence), generic per-pet service-incompatibility rule, `capacity_groups` entity in the map + `business_availability` pool-override FK, `PRICING_MODELS as const`. **Routed to Claude Code (gated):** D-063 engine correction, real tenant-isolation validation in the pricing engine, D-057 closure-refund job, forbidden-Stripe-param executable tests. No commit/push/deploy. (Cowork)
- 2026-07-31 (pm2) — **"15-night cap" confirmed a phantom (Danny).** PetAppro has **no night cap** on boarding — long-stay is manual/provider-decided (D-062k). Claude Code + current suite verified no cap in `packages/pricing`/`reference/`/tests; `S1-3` already `DONE`. Origin: a mis-transcription of **Woof WeTreats'** 14-night *client-self-service* cap (staff-bypassable), deliberately not ported. Logged the clarification under **D-062k**. Stale "fix the removed 15-night-cap test" references remain in `PetAppro-Roadmap-and-Project-Plan.md`, `technical_architecture.md` §L293, `PetAppro-Strategy-and-Business-Plan.md` → flag for EOD sweep. No commit/push/deploy. (Cowork)
- 2026-07-31 (pm) — **D-063 two open flags resolved (Danny).** Name **LOCKED = "Boarding Extra"** (rejected "Late Pickup fee" — implies an after-hours charge; and "Extra Hours"). Fee is a **single flat one-time fee, NOT per-hour** (interpretation flag closed). Specs (`booking_and_pricing.md` §5B, `provider-onboarding-configuration.md` §5.1a) already matched — no spec change; only `open_decisions.md` D-063 updated. **D-063 now fully unambiguous → nothing ambiguous left for Codex to ratify or Claude Code to implement.** No commit/push/deploy. (Cowork)
- 2026-07-31 (George/PM + Codex governance) — **Calendar re-baselined and Sprint 1 reconciled.** Oct 1 is RED/trending NO-GO; Oct 21 is the working recovery target, conditional on the formal Aug 15 gate. D-U-N-S is green; tenant schema/RBAC/RLS is red because `supabase/` is absent. Opened the Jul 31–Aug 14 Foundation Recovery Sprint, ratified separate tenant-scoped capacity groups and `bounded | unlimited` capacity configuration, and flagged D-063 as specified but not yet implemented by the current pricing engine. Store order: BIZ-12 → minimal live base509.com/MKT-4 → BIZ-5 Apple Org → BIZ-6 Google Play; BIZ-10b address propagation before submission. No commit/push/deploy.
- 2026-07-30 (pm) — **Three product decisions logged (Danny, via Daily Checkin follow-up).** **D-063** — Boarding "Extended Care" overage: optional Provider fee via the existing `partial_unit_overage` model (no new primitive); Provider-set covered window measured from **booked drop-off time**; single flat "Boarding Extra" rate elected by a yes/no in onboarding/services mgmt; per-booking waive; Rover-style tiering deferred; **no same-day daycare+boarding** (boarding covers the day, still counts against the shared location pool). **D-064** — Meet & Greet is **free** at MVP (no fee field; hard gate stays but is not a paywall; reversed the initial "M&Gs have a fee"). **D-065** — scheduled care-task reminders **in MVP scope** as transactional notifications (flex under D-023; messaging stays OUT per D-053). Dashboard in-progress grouping deferred to the in-flight Figma app pass (not a blocker). Reaffirmed **D-062k** (Danny): long-stay flat pricing = **15+ days / Provider-decided**, stays a **price override** for MVP; the engine's `extended` reduced-rate tier is **not surfaced in onboarding** at launch. **Follow-through DONE (same day):** `booking_and_pricing.md` §5B + §6 and `provider-onboarding-configuration.md` §4/§5.1a written; Codex to ratify D-063 with `capacity-model.md`. No commit/push/deploy. (Cowork)
- 2026-07-30 — **Catch-up standup + sync (Cowork).** Reconciled an 8-day standup gap (last STATUS entry 07-22). Surfaced the critical state: **~2 weeks of spec/decision work is uncommitted/unpushed** — the GitHub mirror is stuck at `09ac2ad` (~Jul 16), so **Codex and Claude Code cannot see any of it.** Untracked: `CANONICAL-SOURCES.md`, `provider-onboarding-configuration.md`, `transactions-payments-and-invoicing.md` v2, `provider-dashboard.md`, `provider-reports.md`, `capacity-model.md`, `design-system-components.md`, `legal/`, `apps/web/`, `marketing/`. Modified: `open_decisions.md` (+454 lines / D-056+), `mvp_roadmap.md`, `website-content-and-structure.md` (+447), `pricing-tiers-and-features.md`, `provider-settings-ia.md`, `user_roles_and_permissions.md`, `data_model_draft.md`, `technical_architecture.md`, `booking_and_pricing.md`, `competitive-analysis.md`, `CLAUDE.md`. **Sprint 1 board is stale (pricing engine + CI + tokens/ui already exist, never marked done); the real gap is `supabase/`/CFG-1 (migrations + five-axis schema + RLS)** → needs a Danny/PM re-cut-vs-rebaseline decision + board reconciliation ahead of the ~Aug 15 GO/NO-GO. Refreshed the stale "This week's focus" block (was 07-06). Issued hand-off prompts (Codex review queue · George/PM alignment · Claude Code push + Sprint-1 work order). No commit/push/deploy. (Cowork)
- 2026-07-25 — **Provider Reports page spec created (`docs/specs/provider-reports.md`), built off the Woof reports page.** Generalizes Woof's proven page (Earned/Collected accrual, tabs, CSV export) to the PetAppro service engine + multi-tenant model, and adds: **write-offs / bad debt as a first-class metric broken out by time increment** (day/week/month/quarter/year — Danny's ask), **tips as a separate line** (never folded into service revenue), a **Financial/Accounting tab** (adjustments by reason code), and **CSV export on every report + a QuickBooks-friendly financial export** (invoice CSV mapped to QBO's import template using our §4.2 invoice numbers; live QBO API sync stays a post-MVP add-on). Registered in CANONICAL-SOURCES; absorbed the transactions-spec "Reports requirements" collector; dashboard B3 now points to it. **Follow-ups:** Fable hi-fi design (after wireframe/hi-fi passes), Claude Code build (accrual math shared with dashboard Earnings so they can't diverge), confirm current QBO invoice-import columns at build time. Also fixed two Fable copy drifts on PROV-REMIND (SMS-not-MVP per D-008; invented "Pack" tier) → COPY-AUDIT §15/§15a. No commit/push/deploy. (Cowork)
- 2026-07-19 — **Provider onboarding technical-governance pass (George/Codex).** Found the planned service schema missing all five engine axes under canonical column names and confirmed there is no migration/generated DB type layer yet, so the wizard is blocked on CFG-1. Reconciled `business_services` as generic five-axis instances (launch services are presets, provider-defined types require no rewrite); mapped daycare “per day” UI to canonical `per_session`; aligned Crew+ GPS to D-054 launch-gate status; documented two-boundary theme entitlement enforcement; triaged legal README #1–34 into LG-1…LG-11. Pricing regression suite: 39 passed, 8 skipped. No commit/push/deploy.
- 2026-07-08 (pm2) — **Pricing engine build-ready spec.** Cowork reconciled George's v2 → **`docs/specs/booking_and_pricing.md`** (source of truth). Applied post-George deltas: walking IN MVP (D-022), deposits OUT (D-015), payments = Stripe Connect (D-007), actor ids = `base509_account_id` (D-035); resolved George's 4 open product decisions for MVP; added walking golden tests; Staff-level arch-review notes (partial_unit_overage timezone risk, snapshot=charge contract, no-floats). **Resolved 2 open items (Danny):** provider **tips IN MVP** (billing-layer Connect line, 100% to provider, not engine-priced — §5A); **no platform fee / Standard Connect accounts** (Base509 pays Stripe $0 per txn; provider bears ~2.9%+30¢; tiered-subscription cost-recoup only relevant if we ever move to Express/Custom). Next: Claude Code builds `packages/pricing` golden-tests-first. (Cowork)
- 2026-07-08 (pm) — **Architecture ratified + payments decision.** Codex reviewed the operator/multi-app doc and **D-034–D-038 are now Decided (Danny locked)**: (D-034) Base509 thin master + per-app isolated DBs, no per-row app_id; (D-035) stable `base509_account_id` (not raw `auth.uid()`) — mandatory migration hygiene; (D-036) Supabase Auth for MVP, no external IdP yet + **field-naming maps cleanly to prepackaged IdPs** (Danny); (D-037) shared layer = account + billing only; (D-038) passwordless-first (Apple/Google/email-code) + owner/admin step-up MFA, biometric = local only. Codex patched `technical_architecture.md` + `data_model_draft.md` (auth.uid → base509_account_id + `base509_accounts`/`auth_identities`). **Payments: D-007 → Option A — ship WITH in-app payments (Stripe Connect) in MVP**; **date flexes ~late Oct (D-023 updated)**; **D-028 freeze bar → real paid booking**; **pricing engine UN-HELD & on critical path**; deposits stay OUT (D-015 — Danny declined; revisit only on customer feedback). (Cowork/Codex/Danny)
- 2026-07-08 — **Base509 operator back-office + multi-app architecture captured → routed to Codex.** New doc `docs/planning/base509-operator-admin-console.md`: the "2-sided" site (customer-facing + internal operator console), SaaS-customer-management inventory, multi-level verification on destructive/financial actions. Architecture proposals for Codex: Base509 master → per-app **isolated** DBs (no per-row app_id); shared account-service holds **account only**, not app records; auth **path 1** (per-app Supabase auth + product-agnostic account model, extract later) w/ two non-negotiable hygiene constraints (stable Base509 account id; **passwordless-first**). **D-031** updated (passwordless-first Decided by Danny). Not launch-blocking (D-001). Also logged **F-021** (invite-scoped provider preview before signup) w/ Danny's decisions. (Cowork)
- 2026-07-07 (pm) — **Store-clock progress.** Registered `petappro.com` + `base509.com` (Cloudflare, one account) → **MKT-1 DONE**. Stood up free Cloudflare Email Routing: `developer@`, `support@`, `danny@base509.com` all forward to Gmail (verified). Note: Cloudflare won't forward senders that fail SPF/DKIM — surfaced that `dannyraydesign.com`'s own email auth is broken (separate fix). **D-U-N-S obtained same-day (free, myD&B): 11-314-3683 → BIZ-4 DONE**, unblocks BIZ-5/6. Business phone = Google Voice #. Business Apple ID deferred to tomorrow (Apple new-account throttle/lockout). D-U-N-S cheat sheet added in `Company/Formation/`. (Cowork)
- 2026-07-07 — **Two scope decisions locked (from Danny).** (1) **D-007 Decided — Stripe Connect deferred post-MVP**: manual payment tracking is the sole MVP client→provider payment path (Connect is a nice-to-have, not launch-critical). SaaS Stripe **Billing** (MKT-6, provider→Base509) stays in. Reflected in `mvp_roadmap.md` (scope lists, Phase 4/6, calendar), annex (Sprint 4, milestones, backlog→post-launch). (2) **D-028 Decided — MVP-complete / feature-freeze definition**: *Danny + Marco's own business runs a genuine booking end-to-end on physical iOS+Android, tenant isolation verified, payment manual* → then features freeze. Own business = first **test tenant** (freeze bar); the **5–6 PCSPs** = **beta testers** after the freeze. Retired "design partner" for this context; **renamed BIZ-7** → "Recruit 5–6 PCSP beta testers". Reframed D-021. (Cowork/PM)
- 2026-07-07 — **Roadmap: Launch Readiness promoted to a first-class parallel track.** Added an **LR track (LR-1…LR-8)** to `docs/roadmap/mvp_roadmap.md` (phase overview + dedicated section + parallel-track note in the phase diagram): legal pages, support, contact, app landing page(s), Base509 marketing site, Apple prep, Google prep, and the store-review buffer — all framed as **launch dependencies, not post-launch**, with the binding D-U-N-S→accounts→URLs→submit→buffer→Oct 1 chain. Synced MKT track: MKT-5 now covers Terms explicitly; added **MKT-5b (Contact page)** and **MKT-5c (app landing/download page)**; cross-tagged MKT-10/11 + BIZ-5/6 to their LR ids. (Cowork/PM)
- 2026-07-06 — **Design research thread** started: `docs/research/` scaffolded (README, research-log, teardown template, synthesis). Drafted `jobs-to-be-done.md` (PCSP-anchored JTBD + client/staff supporting jobs + 6 archetype starters, archetypes-over-personas). Logged **D-027** (JTBD anchor: owner/PCSP; supporting jobs rise to primary in their own flows). Added **Design & Research track** (DR-1..4) + focus item 4; DR-1 awaiting Danny's red-pen. Keep synced w/ MKT-3 (Base509 brand) + Design System + BIZ-3 (bank). (Cowork)
- 2026-07-06 — Danny review of Phase 1 arch → folded in: glossary, scaling seam (future tablet/web on same backend), client relationship lifecycle (leave/switch provider), connect via code/QR only. Logged new decisions **D-024** (support/break-glass role, redacted+audited), **D-025** (multi-currency), **D-026** (connect method), and captured **D-020** subscription requirements (seat-based tiers, first user=owner + add-user role prompt w/ financial disclaimer, monthly/annual, prorated upgrades, referral promo + reversal/fraud). (Cowork/PM)
- 2026-07-06 — Phase 1 planning: drafted `docs/planning/technical_architecture.md` (stack, tenancy, RLS, pricing authority, notif outbox, repo shape) + `docs/planning/data_model_draft.md` (19 tenant-scoped tables). Also `docs/roadmap/planning-doc-sequencing.md` (dependency-ranked doc backlog; billing deferred per D-020/D-021). Awaiting Codex review. (Cowork/PM)
- 2026-07-06 — Website + store plan drafted: `docs/roadmap/website-and-store-launch-plan.md` (one-deployment/multi-domain, **Vercel** hosting, store-approval sequence, **mid-Sep submit / late-Oct fallback**) + `docs/specs/website-content-and-structure.md` (sitemap + draft copy). Added MKT-10/11; updated MKT-3/4/5. Launch date-flex to late-Oct accepted. Base509 corporate brand flagged as the open dependency. (Cowork)
- 2026-07-06 — BIZ-3 **DOING**: WF business checking opens 2026-07-07 (branch, $400 bonus code YT2FB2). Funding **$10,000** (self-fund 6 mo) via personal-cash bridge; ~$10k AMZN sale (41 sh) freed the cash. Budget model in `Finance/Accounting/`; account details in `Finance/Banking/`. (Cowork)
- 2026-07-06 — BIZ-2 **DONE**: Federal EIN obtained for Base509 LLC (stored in `Company/Formation/Base509-LLC-Key-Identifiers.md`, confidential). Unblocks bank account (BIZ-3) + D-U-N-S (BIZ-4). (Cowork)
- 2026-07-06 — Tax decision: keep **default LLC (disregarded entity) for 2026**; **elect S-corp effective 2027-01-01** via Form 2553 (file Jan 2027; deadline ~Mar 15, 2027). Added **BIZ-8**. EIN still filed as an LLC. (Cowork)
- 2026-07-06 — BIZ-1 **DONE**: Base509 LLC **approved** (Entity No. B20260309172). Operating Agreement finalized in `Company/Formation/`. Unblocks EIN (BIZ-2, next) + D-U-N-S (BIZ-4). Deadlines: Statement of Info (LLC-12) by ~2026-10-02; $800 franchise tax by ~2026-11-15. (Cowork)
- 2026-07-04 — BIZ-1: Base509 LLC **submitted** to CA SoS (bizfile, standard processing); registered agent = Launch RA; Operating Agreement drafted to `Company/Formation/`. Awaiting approval → then EIN (BIZ-2).
- 2026-07-04 — File created; seeded with Sprint 1 + business track from the roadmap doc.
```
