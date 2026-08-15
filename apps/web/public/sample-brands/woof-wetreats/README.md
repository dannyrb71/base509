# Woof WeTreats — sample provider brand

**What this is:** Danny's own pet-care business, used as the **sample provider brand** in PetAppro mockups and demos. It's also our **first test tenant** (D-028).

**Why use a real brand:** placeholder "[Provider Name]" text hides whether provider branding actually *works*. A real logo reveals fit, contrast, and lockup problems the placeholder can't.

| File | Lockup | Use |
|---|---|---|
| `logo-horizontal.svg` | 143 × 32 — paw + wordmark, horizontal | App headers, nav bars, invoice/receipt headers, booking cards |
| `logo-stacked.svg` | 120 × 120 — paw above wordmark, square | Invite/connect screen, splash-style moments, avatar/tile contexts |

## ⚠️ Both files are single-color BLACK

This matters for our theming model:

- **Dark scheme is "light islands"** (brand-tinted canvas, white card holders) — a black logo sits fine on a white island. ✅
- **A black logo on a themed or dark surface fails.** Any surface that places the logo directly on a dark/colored background needs an **inverted (white) version.**

**Open product question:** do we require providers to upload **both** a light-surface and dark-surface logo, or do we constrain logo placement to white/light holders only so one file always works? *The second is simpler for the provider and safer for us — recommend it unless design finds a reason otherwise.*

## Related
- Provider-branding surfaces (where a provider's brand appears in the client app) — see the branding-surface discussion; spec pending.
- Logo upload is **top plans only**; lower tiers render the business name as text (`COPY-AUDIT.md` §14). Every branded surface must render gracefully **both ways**.
- Screens using this brand are sample content — the mockup disclaimer applies (`COPY-AUDIT.md` §16).
