# Website & Store Launch Plan (annex)

> Annex to `mvp_roadmap.md`. Owns: web architecture, hosting, the website workstreams, and the app-store approval sequence/timing. Cross-links to the MKT track in `../../TASKS.md`.
>
> **Status 2026-08-15:** Base509 is push-ready, policies are published in the local registry, the design system is published as a library, and the PetAppro marketing site is built from real Figma content. The provider portal is in progress with optional/offline booking payments. **The first GitHub push of `apps/web` is the current launch bottleneck**; it gates Vercel (`Root Directory = apps/web`) → preview/domains → hosted Supabase/Resend waitlist. Late October remains the recovery target.

## 1. Web architecture — one deployment, many URLs

One Next.js app (`apps/web`) serves multiple domains/subdomains attached to the same deployment:

- **petappro.com — canonical product site (critical path).** Serves directly (no redirect away). Hosts the app-store-required legal at stable paths: `/privacy`, `/terms`, `/support`.
- **base509.com — light company hub.** One page: what Base509 is + product list linking to PetAppro + contact. Same deployment, different route. Structured to grow as more "Appro" apps ship.
- Subdomains (e.g., a future `nextapp.base509.com`) are for separating *whole apps*; use plain paths for legal/support pages.
- Store consoles just need working HTTPS URLs — you paste the chosen petappro.com URLs into App Store Connect / Play Console.

## 2. Hosting

- **Vercel** (Next.js-native; cleanest multi-domain; git-push deploys with PR previews, same workflow as Netlify). Monorepo: set project root to `apps/web`.
- Netlify remains a valid fallback (Woof WeTreats already there), but Vercel is the pick for the new site. ~$20/mo Pro.
- Backend stays Supabase; provider subscriptions via Stripe Billing on the web (keeps Apple/Google IAP cut off subscription revenue).

## 3. Workstreams

| # | Workstream | Depends on | Owner | Notes |
|---|---|---|---|---|
| A | Base509 site + policy registry | — | Danny / Claude Code | **DONE LOCALLY / PUSH-READY.** Policies published locally; Aug 15 production build green |
| B | First GitHub push + Vercel connection | A + Danny go | Danny / Claude Code | **CURRENT LAUNCH BOTTLENECK.** `apps/web` has never been pushed. After Claude Code's first push, set Vercel Root Directory to `apps/web`; preview before production; verify domains, HTTPS, contact and policy routes |
| C | PetAppro product site — real Figma→code | B for hosted QA | Claude Code · Codex review | **DONE LOCALLY / AWAITING PREVIEW.** Shared published library; responsive, accessibility, performance and visual QA remain |
| D | Provider portal + Stripe subscriber/billing web experience | B + Stripe test catalogue + account/business mapping | Claude Code · Codex money/security review | **IN PROGRESS.** Optional/offline booking payments; authenticated web-only SaaS checkout/account remains separate, with webhook authority, entitlements, renewal/cancel/recovery, Test Clocks |
| E | Supabase + Resend waitlist | B + preview/domains | Claude Code · Codex review | **BLOCKED by first push.** Configure hosted services/secrets and prove submission, persistence, consent, duplicate/error handling, and email delivery end to end |
| F | Store enrollment/listing URLs | Live Base509 + PetAppro legal/support routes | Danny | Apple then Google; BIZ-10b before submission |

### Critical-path acceptance gates

- **Base509 live:** `base509.com` resolves over HTTPS; company/contact content and every published policy link work in production; preview/rollback remains available.
- **PetAppro site:** approved Figma is implemented with governed tokens/components; responsive, keyboard/accessibility, performance and visual QA pass; `/privacy`, `/terms`, `/support`, and contact paths are stable.
- **Stripe Billing:** Base509 test Products/Prices exist; the authenticated provider maps to the correct business; verified webhooks are authoritative and idempotent; subscription state projects to server-written tenant entitlements; trial, renewal, failure/recovery, cancellation and management paths pass Test Clock tests; the native app exposes no SaaS purchase/link/upgrade CTA.

## 4. App-store approval sequence (grounded in 2026 timelines)

Approval timing — not the website — sets the dates:

- **D-U-N-S:** ~up to 5 business days to issue (+2 for Apple to ingest).
- **Apple org enrollment:** manual, **1–2 weeks** (sometimes longer).
- **Apple app review (2026):** new apps 2–7 days; budget a rejection/resubmit loop (submission volume up 60–100% YoY).
- **Google org account:** avoids the 12-tester/14-day rule (Organization choice pays off); **new-account first review 7–14 days**.

Sequence:

1. **Current bottleneck:** Danny gives the go; Claude Code makes the first GitHub push of `apps/web`.
2. **Immediately after push:** connect Vercel with `Root Directory = apps/web`; review preview, attach domains, verify HTTPS/routes, and promote with Danny's approval.
3. **After preview/domains:** configure hosted Supabase + Resend and validate the waitlist end to end.
4. **In parallel:** continue provider portal/Billing and the non-cuttable tenant/RBAC/RLS foundation.
5. **After Base509 is live:** proceed with Apple Organization enrollment, then Google Play; complete BIZ-10b before submission.
6. **Before submission:** make PetAppro `/privacy`, `/terms`, `/support`, and contact URLs stable; create listings and hold release for the approved date.

**Deadline note (2026-08-15):** the missed first push is consuming launch-readiness buffer and is now the single web bottleneck. Surface any further delay immediately against the October target.

## 5. Brand dependency

- **PetAppro** already has a foundation (color tokens + logo assets in the design system) — enough to skin the product site.
- **Base509 corporate identity is the open item** (positioning, wordmark, palette, name story). It blocks only the visual pass (workstream C/D), not content or legal.
