# Website Build & Launch Runbook — Base509.com + PetAppro.com

**For:** the build day (2026-08-06+). **Goal:** both sites live on real domains, with a working email-capture waitlist form on petappro.com.
**Reality check:** the sites are **already largely built** (`apps/web` is a Next.js multi-domain app with pages for base509, petappro, and the portal). So this is *finish + wire + deploy*, not from-scratch.

---

## 0 · Who does what (tool routing)

| Who | Does |
|---|---|
| **Danny** | Purchases (Vercel), account creation, DNS record approvals in Cloudflare, the A/B decision on the waitlist store, final go. |
| **Claude Code** | The code: copy reconciliation, wiring the waitlist form + API, Vercel build config, tests, the deploy. (It's the committer.) |
| **Cowork (me)** | Copy/content, this plan, and reviewing what Claude Code produces. |

**Golden rule still applies:** Claude Code doesn't commit/deploy without Danny's explicit "ready to deploy."

---

## 1 · Hosting — it's **Vercel** (Vercel Pro)

**What it is:** Vercel is the company that makes **Next.js** (the framework the site is built in). It's the natural, near-zero-config host for it.

**Which plan:** **Vercel Pro — $20/member/month** (billed annually; $24/mo if paid monthly), plus usage. A marketing site + a waitlist form stays inside the included allowances (1 TB transfer, 10M edge requests), so realistically ~$20/mo for your one seat. **You must be on Pro, not the free Hobby tier** — Hobby is licensed for *non-commercial* use only (can't run a business site on it). *(This is BIZ-12.)*

**Steps:**
1. Create/sign in to a **Vercel account** — use a **Base509 business identity** (sign in with the GitHub account that owns the repo, or `developer@base509.com`) so vendor identity stays consistent with the App Store / D&B records.
2. **Upgrade to Pro** (or start the Pro trial). Do this before go-live.
3. **Connect the Git repo** (the GitHub repo Claude Code pushes to) → **Import Project**.
4. **Set the project root to `apps/web`** — it's a monorepo, so point Vercel's "Root Directory" at `apps/web`. Framework preset auto-detects **Next.js**.
5. Add the **environment variables** the waitlist form needs (see §3) in Vercel → Settings → Environment Variables.
6. Deploy → Vercel gives you a `*.vercel.app` **preview URL**. Confirm the build succeeds and both site sections render there **before** touching DNS.

---

## 2 · Point the domains (Cloudflare → Vercel)

You already **own base509.com and petappro.com through Cloudflare** (registrar + DNS). You keep them there; you just point the web records at Vercel. Both domains go to the **same** Vercel project — the app's `middleware.ts` routes each hostname to its section.

**Steps:**
1. In **Vercel → Project → Settings → Domains**, add all four: `base509.com`, `www.base509.com`, `petappro.com`, `www.petappro.com`. Vercel will show the exact **DNS records** it wants.
2. In **Cloudflare → DNS**, add exactly what Vercel shows. Typically:
   - Apex (`@`): an **A record → `76.76.21.21`** (Vercel's anycast IP), or a CNAME-flattened record — *use the value Vercel displays*.
   - `www`: a **CNAME → `cname.vercel-dns.com`**.
3. **Set those records to "DNS only" (grey cloud), not proxied (orange).** Let Vercel handle SSL + CDN. (Orange-clouding Vercel behind Cloudflare's proxy causes SSL redirect loops unless you carefully set Cloudflare SSL to "Full (strict)" — not worth it for launch. Grey-cloud is the safe default.)
4. **Leave your email records alone.** Cloudflare Email Routing (support@, developer@, danny@) is MX/TXT — pointing *web* at Vercel doesn't touch it.
5. Vercel auto-issues SSL certs once DNS resolves (minutes to ~an hour). Verify `https://` loads on both domains with a valid padlock.

---

## 3 · The waitlist email-capture form (petappro.com) — the one real backend

The `petappro.com/signup` page exists; it needs a backend so a submitted email actually gets stored. This is the only piece that needs a decision.

**How it works:** a Next.js **Route Handler** (`/api/waitlist`) validates the email and writes it to a store, with basic spam protection. The page shows a success state ("You're on the list — we'll email you when PetAppro launches").

**DECIDED (Danny, 2026-08-01): Supabase.** Supabase is being stood up with the website, so it's the waitlist store — future-consistent (same backend the app uses; captured emails live where you can query/export/notify later).
- It only needs a **minimal `waitlist` table** (email · signup date · source page) with **insert-only RLS** — the `/api/waitlist` route can write; nobody can publicly read it. You do **not** need the full multi-tenant app schema for the waitlist; it's a tiny table that can live in the PetAppro Supabase project and grow into the real backend later.
- Env vars in Vercel: the Supabase URL + a key with insert rights to that table.

**The form must include (Claude Code):**
- Email validation + a friendly error state.
- **Spam protection** — a hidden honeypot field + basic rate-limiting (waitlist forms attract bots).
- A clear **success state** and the short **privacy line** ("We only use this to tell you when PetAppro launches" — consistent with the published interim Privacy Policy).
- Store: email + signup date + which page it came from (matches what the interim privacy policy says we collect).

**Compliance:** already covered — the interim Privacy Policy + Terms of Use (now Base509-framed, published) describe exactly this (email for waitlist, no selling, unsubscribe). Nothing new needed legally.

---

## 4 · Figma designs → finished code

Because the pages already exist, "Figma → code" here means **finish + reconcile + deploy**, not build-from-scratch:
1. **Reconcile the copy.** The built `base509/page.tsx` (and likely petappro pages) are **behind your newest Figma copy** — we found the drift (e.g. hero "…for people" in code vs "…for you" in your latest; "Smart apps for the doers" vs "Thoughtful apps. Keep things moving."). Claude Code brings the code up to the approved copy. *(Point it at the Figma + the `apps/web/copy/` docs.)*
2. **Apply the locked decisions to the copy** — the branding/tier split (own branding all tiers; "Powered by PetAppro" removed at Crew+), PetAppro spelling in text, casing rules, no stale GPS-"v1.1"/SMS language. All already in `COPY-AUDIT.md`.
3. **Fill dev placeholders** — app screenshots, theme cards (no fake testimonials).
4. **Wire the waitlist form** (§3).
5. **Responsive + accessibility pass** — mobile layouts, contrast, touch targets.
6. **Deploy to the Vercel preview**, review, then promote to production (the real domains).

---

## 5 · Order of operations for the day

1. **(Danny)** Vercel account → **Pro** → connect repo → set root to `apps/web` → get the `*.vercel.app` preview building. *(~30 min)*
2. **(Danny)** Decide the **waitlist store: A or B**.
3. **(Claude Code)** On the preview: reconcile home copy, wire the waitlist form + `/api/waitlist`, fill placeholders. Test a real email end-to-end into the store.
4. **(Cowork)** Review the preview against COPY-AUDIT + the Figma.
5. **(Danny)** "Ready to deploy" → **(Claude Code)** promote to production.
6. **(Danny)** In **Cloudflare**, add the Vercel DNS records (grey cloud). Wait for SSL. Verify both domains load over https.
7. **Final check:** submit a test email on the live petappro.com → confirm it lands in the store. Click through every nav link on both sites (no dead ends).

---

## Gotchas / notes
- **Vercel Pro before go-live** — also unblocks **Apple enrollment** (which needs a *live* base509.com). Two birds.
- **Monorepo:** the #1 misconfig is forgetting to set Vercel's Root Directory to `apps/web`.
- **Cloudflare records = grey cloud (DNS only)** for the Vercel entries — avoids SSL loops.
- **Waitlist = D-061** (portal is *not* live at launch; petappro.com runs in waitlist mode). Don't wire the provider portal to real signups yet.
- **Address:** the footer uses the **SF virtual address** (1875 Mission St…) — never the home/principal address.
- **Legal pages stay attorney-gated.** Interim Privacy + Terms of Use are published (and now Base509-framed); the rest (Cancellation, Refund, Account Ownership, Sub-processors, DPA, Accessibility, Security) are shells with "pending counsel" labels — leave them.
- **Social platforms** named anywhere: Instagram / Facebook / Nextdoor / TikTok / LinkedIn only — never X/Twitter.
