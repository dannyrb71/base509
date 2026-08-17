# Provider Social Ad — auto-generated marketing card (F-023)

**Status:** Spec for build (Cowork, 2026-07-21). Feature = F-023 (competitive-analysis §5 — acquisition-assist without becoming a marketplace).
**Design source:** `Design/Website/social_ad/` (template PNG + service-badge PNGs); Figma "PetAppro.com — Website", node 281-4539 (layered, dynamic content, dev-mode CSS).
**Related:** D-020 (free-tier funnel rationale) · D-026/D-029 (invite-code connect, no marketplace) · D-058 (no vetting) · logo rules (`provider-onboarding-configuration.md` §5.5) · `apps/web/copy/COPY-AUDIT.md`.

---

## What it is
A **downloadable social-media graphic** each provider can post to grow their **own** book of clients. It carries the provider's brand + a **public new-client invite code + QR**, and PetAppro branding. The client who scans it discovers PetAppro → **two-sided word-of-mouth**, which is the core rationale for the free tier (D-020).

**Auto-generated at signup**, available to **all tiers including free**, for the life of the account. **Regenerates automatically** when the provider edits their name, logo, or adds a logo. **Not manually editable** — locked template guarantees on-brand output and kills "my card looks bad" support tickets.

---

## Format — DECIDED (Danny, 2026-07-21)

**Feed post only. One format. No Stories for MVP.**
- Stories was built and **held in reserve** (`Design/Website/social_ad/`) for future demand.
- **Why skipped:** a Stories QR is near-useless — it auto-advances on a timer, you can't scan a screen you're holding, and the fallback is hand-typing a URL. Most sharing is to group feeds anyway. Revisit only on real request.

---

## Placement — DECIDED
A **"Share & grow"** card, **not** buried in the profile-edit form (a marketing tool inside a settings form gets missed). Reads *from* profile data.
- **In-app:** primary sharing surface (phone has the social apps + native share sheet).
- **Web portal:** download the PNG.

---

## Dynamic vs. static layers

**Dynamic (auto-generated / auto-updated):**
- Provider **name / logo** — three cases per §5.5: square/vertical logo · horizontal logo · **no logo → business name in theme font**. Logo on a **light holder** (never recolored).
- **Service pills** — render **only services the provider has enabled AND that exist in the product.** MVP = Boarding / Daycare / Walking. Grooming/Training/Sitting badge assets exist but stay **dormant** until those service types ship.
- **Public new-client invite code** (e.g. `WOOF12345`) — ⛔ **NEVER the existing-customer code** (that one is meet-and-greet pre-cleared; posting it publicly would let strangers skip the M&G gate).
- **QR** — encodes a **smart deep link**: opens the app if installed, store if not, pre-filled with the provider code.
- **CTA line** (see below).

**Static:** headline ("Loving pet care, just a tap away."), eyebrow, PetAppro branding, background, dog photo.

---

## CTA line — conditional on the provider's Meet & Greet setting
The "when prompted" sub-line must match reality (M&G is a per-service provider setting that may be off):
- **M&G off:** *"Enter my code and book in minutes."*
- **M&G on:** *"New clients start with a quick meet & greet."*
- **Safe single line (Danny's pick if not branching):** *"Download, enter my code, and let's get started."*

---

## ⚠️ PetAppro branding here is INTENTIONAL — the opposite of the invoice rule
On invoices/receipts, PetAppro appears **nowhere** (the provider is merchant of record). **On this card, PetAppro branding is the point** — it's the acquisition funnel; the client learning about the app is the whole feature. **Do not "fix" this by applying the invoice rule.** This is the one surface where PetAppro deliberately co-brands with the provider.

---

## Build notes (Codex / Claude Code)
- **Server-side image composition** — dynamic text + logo + QR + pills rendered onto the template PNG at signup and on profile edits (satori/resvg, headless render, or canvas).
- Logo handling reuses the §5.5 sanitize + light-holder rules (no inline SVG; `<img>` or CSS mask).
- QR generation + smart deep link (deferred-deep-link so the code survives an install).
- Output: downloadable PNG; in-app, wire to the native share sheet.
- Free tier included — no entitlement gate. (Consistent with Starter's "Powered by PetAppro" posture.)

---

## Open
- `[Danny: format dimensions — confirm the feed canvas size (1080×1080 square vs 1080×1350 portrait).]`
- `[Marketing policy: social platforms per brand rule — Meta (IG/FB/Threads), TikTok, LinkedIn only; never X/Musk platforms. The card is platform-agnostic, but any in-product "share to…" targets must respect this.]`
