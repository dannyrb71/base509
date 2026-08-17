# Base509 / PetAppro — Website Launch Checklist
*As of Tue, Aug 11, 2026. This is the short list — just what's needed to get the websites live. Not the whole roadmap.*

---

## 🧵 Pull this thread first (the critical path)
If you only do one thing at a time, do them in this order:
1. **Vercel** account → Pro → connect the repo (gets a preview URL building).
2. **Supabase** + **Resend** (the two the waitlist form needs).
3. **Claude Code builds** — copy + waitlist form + policies (from the RIGHT repo).
4. **Deploy → point DNS → verify.**

**Google Workspace** can happen anytime in parallel — it's not blocking the site.

Everything below is just that, broken out. Most items are 15–30 minutes.

---

## Phase 1 — Accounts & vendors *(your part; ~1–2 hrs total)*
- [ ] **Google Workspace** — business email for `@base509.com`. After setup, point the domain's **MX records at Google** (this replaces the old Cloudflare email forwarding).
- [ ] **Vercel** — create account (sign in with the GitHub that owns the repo), **upgrade to Pro** (~$20/mo), **connect the repo**, and **set the project Root Directory to `apps/web`** (it's a monorepo — the #1 misconfig).
- [x] **Supabase** — ✅ project created (ref `ecdmtldlqvkdvmyxgpzr`, free tier; Data API ON, auto-expose OFF, auto-RLS ON). Still needs the `waitlist` table (email · created_at · source) as the **first `supabase/` migration** + anon-insert RLS policy — Code does this when wiring the form. Grows into the app backend later.
- [x] **Resend** — ✅ account created under Base509, **base509.com verified** (auto-configured via Cloudflare; Google MX preserved). Free tier = 1 domain, so PetAppro mail sends from base509.com with a "PetAppro" display name until we upgrade to Pro (~$20/mo, at portal launch). Free tier covers the waitlist.
- [ ] **Cloudflare** — nothing to buy (you own the domains). You'll add the Vercel DNS records here in Phase 3.

## Phase 2 — Build the sites *(Claude Code — hand it these)*
- [ ] ⚠️ **Point Claude Code at the RIGHT repo:** `/Users/dannybaker/Documents/Base509/Products/petappro/` — **NOT** `Projects/base509` (that's the decoy scaffold that keeps tripping it up).
- [ ] **Reconcile the home copy** to the Figma — Base509 first (prompt is ready), then PetAppro. Source: `apps/web/copy/base509-site-copy.md`.
- [ ] **Wire the waitlist form** → stores to Supabase, sends confirmation via Resend, with spam protection + a success state.
- [ ] **Wire the legal policy drafts** (draft-banner state) — the task you already have, from the correct repo.
- [ ] **Fill placeholders** — app screenshots, theme cards.

## Phase 3 — Deploy & go live
- [ ] Deploy to the **Vercel preview URL** → Cowork reviews against the Figma + copy rules.
- [ ] Your **"ready to deploy"** → Claude Code promotes to production.
- [ ] In **Cloudflare**, add the Vercel DNS records (**grey cloud / DNS-only**). Wait for SSL (minutes to ~an hour).
- [ ] **Verify:** both domains load over `https://`; submit a **test waitlist email** end-to-end; click every nav link (no dead ends).

## Phase 4 — Right after the sites are live *(unblocked by launch)*
- [ ] **Apple Developer enrollment** — it needs a *live* base509.com, so this waits on Phase 3.
- [ ] **Propagate the SF business address** (1875 Mission St…) to D&B, bank, IRS, store enrollment so everything matches.

---

## ✅ Already decided — don't re-open these (de-swirl)
- Hosting = **Vercel Pro**. Waitlist store = **Supabase**. Email sending = **Resend**. Business email = **Google Workspace**. Domains = **Cloudflare** (owned).
- Websites launch in **waitlist mode** (portal not live yet — D-061).
- Legal pages: interim Privacy + Terms are **published**; the rest go up as **labeled drafts**; Security is **held** (monthly reminder is set).
- Branding/tiers, naming (PetAppro in text / Petappro logo), casing — all locked.

## Who does what
- **You:** accounts, purchases, DNS approvals, the "ready to deploy" word.
- **Claude Code:** build, wire, deploy — *from the correct repo.*
- **Cowork (me):** copy, review, keeping this list current.

---
*Feeling swirly? Just do the top of "Pull this thread first." One box at a time.*
