# PetAppro Security Overview

> ## ⚠️ DRAFT — PENDING ATTORNEY REVIEW + ENGINEERING VERIFICATION. DO NOT PUBLISH.
> **Status:** Draft v0.1 (Cowork, 2026-07-16).
> ⚠️ **Every claim on this page must be TRUE at publish time.** A security page is a set of representations — overstating is both a misrepresentation risk and, if there's ever an incident, the first document anyone reads. **Codex/Claude Code must verify each line before this ships.**
> Not a launch blocker — this is a **trust/sales asset**. Publish when providers start asking, and when it's accurate.

**Effective date:** [TBD] · **Version:** 0.1 (draft)

---

## The short version

You're trusting us with your clients' information — their names, their homes, sometimes the code to get in the front door. We take that seriously, and here's specifically how.

---

## Tenant isolation

PetAppro is multi-tenant: many businesses, one platform. **One provider can never see another provider's data.**

That's enforced **at the database**, not in application code — every record belonging to a business carries its business identity, and row-level security policies enforce it on every query. A bug in a screen can't leak another business's data, because the database won't return it.

`[ENGINEERING: verify — RLS on every tenant-owned table; RLS tests in CI (D-034–D-038, and the CLAUDE.md rule requiring RLS tests when schema changes).]`

## Home access codes

Some services need a lockbox code or an alarm code. We treat those as the most sensitive thing we hold.

- **Encrypted at rest**, with **keys held separately** from the data
- **Never written to logs**, error reports, or diagnostics
- **Revealed in the app only behind a biometric or re-authentication check**
- **Tenant-scoped ciphertext** — decryption is server-side and audited

Worth noting: some platforms handle this with a *rule* — "don't type codes into the notes field, or you'll be deactivated." We handle it with a **feature**, so there's no reason to put a code anywhere else.

`[ENGINEERING: verify against decision D-044 — tenant-scoped ciphertext, separated keys, audited server-side decryption, no plaintext leakage.]`

## Accounts and access

- **Passwordless-first** sign-in (Apple, Google, email links) — fewer passwords, fewer breaches
- **Multi-factor authentication required** for owners and admins
- **Re-authentication** before sensitive actions — billing, financial settings, permission changes, and **any change to personal information** like email or phone
- Sessions are separate between the mobile app and the web portal; portal cookies are scoped to the portal subdomain only

`[ENGINEERING: verify against D-031 (LOCKED) + D-038 and Codex's auth architecture in technical_architecture.md.]`

## Payments

**We never see or store card numbers.** Card data goes directly to **Stripe**, which is PCI-DSS compliant. Client→provider booking payments go **straight to the provider's own Stripe account** — the money never passes through us.

## Data in transit and at rest

Encrypted in transit (TLS) and at rest. `[ENGINEERING: confirm specifics before publishing — don't name an algorithm we haven't verified.]`

## Our infrastructure

We run on **Supabase** (database, auth, storage) and **Vercel** (web), with **Stripe** for payments and **Sentry** for error monitoring. The full list is on our [sub-processors page](/policies/subprocessors).

## How we build

- Server-authoritative pricing and bookings — the client is a preview; the server decides
- Entitlements enforced server-side, not by hiding buttons
- Automated tests in CI — including the pricing engine's golden tests and tenant-isolation tests
- Crash and error monitoring in production, so we find problems from data rather than from complaints

## Reporting a vulnerability

Found something? Please tell us — we'd rather hear it from you.

**support@base509.com** `[COUNSEL/PRODUCT: consider a dedicated security@ address and a short responsible-disclosure statement — commit to acknowledging within X days and not pursuing good-faith researchers. Wag publishes one; it's a low-cost trust signal.]`

## Incidents

If a breach affects your information, we'll tell you — what happened, what was affected, and what we're doing — as required by law and as fast as we responsibly can. `[COUNSEL: confirm notification obligations, timeframes, and what we can commit to in the DPA.]`

---

## What we're not claiming

We're a small company. We don't have SOC 2 today `[CONFIRM]`, and we're not going to imply otherwise. What we have is a small, well-understood system, sensible defaults, and a genuine commitment to being straight with you about it.

`[COUNSEL: is this paragraph wise? Product view: yes — honesty about our size is more credible than vague enterprise-speak, and it's consistent with how we've said we operate. But confirm it doesn't undercut us contractually.]`

---

## Contact

**support@base509.com** · Base509 LLC, California
