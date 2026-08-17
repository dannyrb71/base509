# PetAppro.com — Website Build Spec

Rebuild the PetAppro **marketing** website (desktop + mobile) in `apps/web` to match the
finalized Figma, responsive, consuming the published design system. Supersedes the stale
existing PetAppro pages. Correctness over speed. **Do NOT commit or push** without Danny's
explicit "ready to deploy"; test locally and report per page.

## Repo / app
- Repo: `/Users/dannybaker/Documents/Base509/Products/petappro/` (origin `dannyrb71/base509`; **NOT** `Projects/base509`).
- App: `apps/web` — Next.js, multi-domain (base509.com + petappro.com routed by hostname via middleware). PetAppro pages live under `apps/web/src/app/petappro/`.

## Sources of truth — do not deviate
- **LAYOUT / visual:** Figma "PetAppro.com — Website" file `JwMhGwZg5cv3bGAP7306tj`, page `0:1`. Desktop frames are 1440px wide, mobile frames 390px (mapped below). All text is styled with responsive text styles bound to the DS library, so the design already tells you the role of every text element.
- **COPY (verbatim):** `apps/web/copy/petappro-site-copy.md`. Pull the words from there; do NOT rewrite or scrape copy out of Figma.
- **DESIGN TOKENS (code):** `apps/web/src/styles/brand-petappro.css` — the responsive type ramp (`--type-*` custom properties + `.type-*` utility classes, `@media` at 834px tablet / 1280px desktop) plus colors, spacing, radius, shadows. Use these; never hardcode hex/px/sizes.
- **RULES:** `apps/web/copy/COPY-AUDIT.md` — "PetAppro" in body text / "Petappro" logo only; Title Case page titles + service names; never name a competitor; dogs now / cats soon; socials per the doc.
- The published Figma **DS library** is the design source of truth; `brand-petappro.css` mirrors it in code.

## Typography: design → code mapping (1:1)
The Figma text styles map directly to the code utility classes (both auto-scale mobile→desktop):
`Display → .type-display` · `Headline → .type-headline` · `Title Large → .type-title-lg` ·
`Title → .type-title` · `Body Large → .type-body-lg` · `Body → .type-body` ·
`Body Bold → .type-body-bold` · `Body Small → .type-body-sm` · `Body Small Bold → .type-body-sm-bold` ·
`Label → .type-label` · `Label Small → .type-label-sm` · `Button → .type-button` · `Caption → .type-caption`.
Read each text layer's style name in Figma → apply the matching class. This is the whole responsive-type story; don't set font sizes manually.

## Pages to build — desktop frame · mobile frame · route
| Page | Desktop frame | Mobile frame | Route |
|---|---|---|---|
| Home | `2:2` | `300:3431` | petappro.com root |
| Features | `2:19` | `300:3432` | `/petappro/features` |
| Pricing | `2:36` | `300:3433` | `/petappro/pricing` |
| Themes | `2:53` | `300:3434` | `/petappro/themes` |
| Download | `2:70` | `300:3435` | `/petappro/download` |
| Support | `2:87` | `300:3436` | `/petappro/support` |
| Contact | `2:104` | `300:3437` | `/petappro/contact` |
| Sign up | `2:121` | `300:3438` | `/petappro/signup` |
| Policies (index) | `2:138` | — | `/petappro/policies` |

Each page's copy comes from the matching section of `petappro-site-copy.md`.

## Explicitly NOT in this build
- **Privacy / Terms / Additional-Policies pages** are handled by the existing code policy system (`src/lib/policies.ts` + `PolicyPage`). Do NOT rebuild them from the `zz - …/Privacy` / `zz - …/Terms` Figma frames (those are deprecated).
- **Waitlist / Sign-up form wiring** (Supabase + Resend) — separate task; build the form UI, leave the submit wiring stubbed/marked TODO.
- **Theme-picker interactivity** — build the picker's visual design; the live re-theming is a follow-up. Recommended scope for launch: 3–4 themes live + Light/Dark, upgrade to all 10 later.

## Approach
- **Responsive, mobile-first**, one page per route (not separate desktop/mobile files). The desktop + mobile Figma frames are the two reference points; use the `.type-*` classes + `brand-petappro.css` breakpoints (834 / 1280) between them.
- **Reuse shared components** in `apps/web/src/components` (Section, Eyebrow, Btn, CardCarousel, etc. — the Base509 primitives) and the site Header/Footer. Don't rebuild primitives; add PetAppro-specific sections only where needed.
- Copy **verbatim** from the doc; apply casing/brand rules from COPY-AUDIT.

## Build order
Home first → Danny reviews locally → then Features / Pricing / Themes → Download / Support / Contact / Sign up → Policies index. Report after each page with what was built and anything in Figma you couldn't reproduce with existing components/tokens.
