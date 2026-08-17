# Fable — hi-fi Screens pass

> ⚠️ **SUPERSEDED 2026-07-21 (evening):** scope broadened from "reviewed flows only" to **ALL flows on Wireframes 2.0**, run as an overnight autonomous pass. Component audit is done + approved; §7 operating-mode ladder applies. Questions get parked (one "PARKED — for Danny" frame), not guessed silently, not blocking. Reference style = flows 03–06. Order: client core loop → provider app → web portal. The current prompt lives in the chat handoff; this doc's original scoped block is kept below for history.

---

Turn the REVIEWED wireframes into full designs on a new "Screens" page. Scope = only the flows Danny reviewed in Review-01 (now corrected). NOT the Phase-2 flows (unreviewed).

Paste block below.

---

```
Create a NEW page: "Screens". Do NOT edit Wireframes 2.0 — it stays as the
low-fi source. This is the hi-fi design pass: real components, real tokens,
theme-ready, ready to build from.

SCOPE — only the flows already REVIEWED + corrected (Review-01). Skip the
Phase-2 flows (M&G cluster, provider setup wizard, operations) — those get a
hi-fi pass after Danny reviews them.
  APP (mobile, 402×874):
    Client core loop first — App shell/auth · Client entry · Sign-up→Dashboard ·
    Booking request · Outstanding→Checkout · Request a refund · Delete account ·
    GPS consent · Notification priming · Payment methods & auto-pay.
    Provider app — Approve request · Record a payment · Refund · Mark
    uncollectible · Price override · Unpaid dashboard · Manual reminder.
  WEB portal (desktop — SEPARATE canvas, not 402×874): Subscription mgmt ·
    Auto-book · Logo upload · Theme selection · Business closure · Share & grow.
    Flag if you want these as a distinct pass — don't force them into the phone frame.

START with the client core loop, REPORT after that flow, then continue. Proving
the theming + component approach on ~10 screens before doing 100 is the point.

═══ REUSE — introduce NOTHING new ═══
Build from the existing screen designs + design system. Reuse buttons, the
booking-card system, headers w/ search bar, service badges, form atoms. If a
prior screen is >50% right, COPY it and edit. A new component/style/variable is
a last resort — STOP and flag it, don't add it silently.

═══ TEXT ═══
Every text frame uses the text component, horizontal FILL so it wraps. No raw
text nodes.

═══ THEMING — must render across ALL options ═══
Bind every fill + text color to EXISTING color variables, every text style to
EXISTING type styles. Nothing hardcoded. Screens must render correctly by
switching:
  • Scheme: light / dark
  • Theme: all 10 (Brandy Blue · Chessie · Irish Setter · Husky · Bichon Frise ·
    Blue Heeler · Bark Avenue NY · South Bark Miami · Hollywoowoowood · San Fursisco)
Respect surface layering: page bg binds surface/canvas (flips per scheme); cards
bind surface/default (white holders); on-surface text family on cards, on-canvas
family on the app background — never mix (on-canvas-variant is illegible on cards).

═══ PROVIDER LOGO / BRANDING SPACE (the work from yesterday) ═══
Client-facing screens must have a place for the PROVIDER's brand, in three
rendering variants — design the screens to hold all three gracefully:
  A. Logo (as uploaded, full color) on a LIGHT holder — never recolored.
  B. Logo theme-tinted (monochrome logos only, opt-in).
  C. Letter avatar + business name in the theme font (no logo / lower tier).
Place it on: the invite/connect screen (first impression), app header/nav,
booking cards (name-or-logo chip — show BOTH variants since logo is top-plans-
only), booking detail, report card. Use the sample brands in
apps/web/public/sample-brands/ (Woof WeTreats, GO!DOG, The Dog Walker). Logos sit
on white/light holders only. Refs: provider-onboarding §5.5, provider-social-ad,
sample-brands/README.

═══ BUILD HYGIENE ═══
Auto-layout throughout; NO spacer frames (Gap/Padding/SPACE_BETWEEN). Icon/back
buttons transparent (no fill/border). NO decorative backgrounds. Annotations as
dashed caption cards BELOW frames, never inside. Provider screens designed once
at Staff base, gate-up as annotation.

═══ REPORT ═══
After each flow: which prior screens you copied, any content added, and anything
you were tempted to build new (and why you didn't).
```
