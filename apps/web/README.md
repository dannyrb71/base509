# Base509 web — base509.com · petappro.com · app.petappro.com

One Next.js codebase, multi-domain by hostname (D-056). Built to
`docs/specs/website-content-and-structure.md` — that spec is the source of truth.

## Run it locally

```bash
cd Products/petappro/apps/web
npm install        # first time only
npm run dev
```

Then open (each one is a full standalone brand experience):

| URL | Surface |
|---|---|
| http://base509.localhost:3000 | base509.com — company hub |
| http://petappro.localhost:3000 | petappro.com — product site |
| http://app.petappro.localhost:3000 | app.petappro.com — portal (placeholder shell) |
| http://localhost:3000 | dev switcher (never reachable in production) |

`*.localhost` needs no setup — modern browsers resolve it automatically.

Production build check: `npm run build`.

## How it's put together

- **`middleware.ts`** — the hostname → brand map. Adding hairappro.com later =
  one map entry + one brand CSS file + a page tree. Nothing else changes.
- **`src/styles/semantic.css`** — the shared skeleton. It only uses semantic
  tokens (`--surface-page`, `--text-primary`, `--action-cta`, …). Never put a
  brand color or font in here.
- **`src/styles/brand-base509.css`** — Base509 palette + Oswald/Montserrat, from
  `Design/Website/Base509 design system.zip` (hexes verbatim). The
  Oswald/Montserrat rule is Base509-only and must not leak to product brands.
- **`src/styles/brand-petappro.css`** — Brandy Blue + Poppins, by reference from
  the app's token JSON (`design-system/tokens/`). The app owns those hexes.
- **`src/app/base509|petappro|portal/`** — one page tree per surface. Brands
  never import from each other's tree.
- **`src/data/pricing.ts`** — transcribed once from
  `docs/planning/pricing-tiers-and-features.md` (the single source of truth).
  Change the doc first, then mirror here.

## Policies (spec §6)

- **One canonical source**: `src/lib/policies.ts` (registry) +
  `content/policies/*.md` (versioned content). Canonical URLs live at
  base509.com/policies/*; petappro.com/privacy, /terms, /policies render the
  same content PetAppro-styled (short stable paths for the store consoles).
- **Versioned**: every policy version has a number + effective date; old
  versions stay viewable at `/policies/<slug>/v/<version>`.
- **Publishing is deliberate**: a draft only becomes the live agreement when
  `published` is set on its registry entry — an explicit edit + deploy, never a
  live-mutating page. Until then every draft renders a
  "DRAFT — PENDING COUNSEL" banner.
- **No legal copy is written here.** Drafts come from `docs/legal/*.draft.md`
  (attorney reviews before publish); undrafted policies render placeholders.

## Deploy (later — Claude Code, MKT-4)

Vercel: one project, all three domains attached; middleware does the rest.
`base509.com` is the urgent one (Apple Developer enrollment).
