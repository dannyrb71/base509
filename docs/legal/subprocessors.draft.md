# Base509 — Sub-processors

> ## ⚠️ DRAFT — PENDING REVIEW. NOT YET IN EFFECT.
> **Status:** Draft v0.2 (Cowork, 2026-08-11). Vendor list confirmed by Danny for the current stack. **Engineering (Codex / Claude Code) confirms regions + any app-side additions before this is relied on.** An inaccurate or incomplete sub-processor list is worse than none.
> Supports the [DPA](/policies/dpa) and [Privacy Policy](/policies/privacy) §5.

## What this page is

To run **Base509's products (starting with PetAppro)** we use a small number of vendors ("sub-processors"). They process data **only** to provide their piece of the service, under contract, and cannot use it for their own purposes. We keep this list current and notify providers before a new sub-processor starts processing their client data.

---

## Current sub-processors

| Vendor | What it does for us | Data it may touch | Location |
|---|---|---|---|
| **Vercel** | Website + app hosting, CDN, serverless functions | Request/IP logs; form submissions in transit | US `[CONFIRM: region]` |
| **Supabase** | Database, authentication, file storage | Waitlist emails (now); at launch — account data, provider business data, client + pet records, photos | US `[CONFIRM: region]` |
| **Google Workspace** (Google LLC) | Business email + document storage | Email we send/receive (e.g. support@), any attachments | US |
| **Resend** | Transactional + notification email delivery (waitlist confirmation, launch notice; later receipts/reminders) | Name, email, message content | US |
| **Stripe** ⚠️ | Payments — provider subscriptions (Billing) and client→provider payments (Connect). **Added when payments go live at launch.** | Name, email, billing details, transaction data. **Card numbers go to Stripe, not us.** | US |

> ### ⚠️ Stripe is not a blanket sub-processor
> For much of what Stripe does — **payments, identity verification, fraud prevention, regulatory compliance** — **Stripe acts as an independent controller** for its own purposes, under its own agreements and privacy notice, not our DPA. `[COUNSEL: split Stripe's activities into (a) processed on our/the Provider's instruction vs. (b) Stripe as independent controller. Same question applies to any push provider. Mis-classifying an independent controller as our sub-processor over-promises control we don't have.]`

**Added as the PetAppro mobile app ships** (confirmed before they process any data): app build/update + push delivery (e.g. Expo/EAS, Apple APNs, Google FCM) and error monitoring. These are **not active yet** and are intentionally not listed until they are.

---

## Not sub-processors (deliberately noted)

- **GitHub** — hosts our source *code*, not customer data. A developer tool, not a data processor.
- **Cloudflare** — our domain registrar + DNS. With email handled by Google Workspace's mail servers, Cloudflare does not process customer personal data.

## What we deliberately don't use

- **No third-party advertising or tracking pixels** — not on our sites, not in the app.
- **No data brokers** — we don't buy or enrich personal information.
- **No analytics that sells or shares your data.**

---

## Changes to this list

We'll post changes here and notify providers who've subscribed to updates before a new sub-processor starts processing their client data. `[COUNSEL: confirm the notice period + objection right — typically 30 days + a right to object, consistent with the DPA.]`

---

## Contact
**support@base509.com** · Base509 LLC, 1875 Mission St Ste 103 #660, San Francisco, CA 94103.
