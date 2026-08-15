# Sample provider brands

Real logos used in PetAppro mockups so we can see whether provider branding actually **works** — placeholder "[Provider Name]" text hides fit, contrast, and lockup problems.

Screens using these are sample content; the mockup disclaimer applies (`COPY-AUDIT.md` §16).

## The set — chosen because each breaks something different

| Brand | Folder | Files | What it tests |
|---|---|---|---|
| **Woof WeTreats** | `woof-wetreats/` | `logo-horizontal.svg` ✅ · `logo-stacked.svg` ✅ | **Monochrome SVG** — the only case that can be safely **theme-tinted**. Also Danny's business + first test tenant (D-028). |
| **The Dog Walker** | `the-dog-walker/` | `logo-horizontal.png` ⬅️ *Danny to add* | **Two-color, wide horizontal** with a tagline. Tests a long lockup in narrow spaces (header, card chip) and proves multi-color logos **can't** be tinted. |
| **GO!DOG WALKER GO!** | `go-dog-walker-go/` | `logo-stacked.png` ⬅️ *Danny to add* | **Multi-color, near-square, illustrative** — and critically, **contains white artwork.** |

> ⚠️ **GO!DOG is the important edge case.** The dog illustration uses **white as part of the artwork** — on a pure-white holder, parts of the logo disappear. This is exactly why we need to decide the holder treatment: a subtle border, a faint shadow, or a very slightly off-white holder. Test this one first; if the holder works for GO!DOG, it works for everything.

## The three rendering variants

Every branded surface must render all three gracefully — this is the real design constraint.

| Variant | When | Treatment |
|---|---|---|
| **A · Logo, as uploaded** | Top plans, multi-color logo | Placed on a **light holder**. Never recolored — their brand colors are their brand. |
| **B · Logo, theme-tinted** | Top plans, **monochrome logo only**, **opt-in** | Tinted to the theme's primary. Offered only when we detect a single-color file: *"Your logo is one color. Match it to your theme?"* Default **off**. |
| **C · Letter avatar + business name** | Lower tiers (no logo entitlement), or an unusable upload | Letter avatar in theme primary + business name in the **theme font**. This is a **good-looking intentional treatment**, not a failure state. |

## Upload rules (see provider onboarding spec)

- **Accept:** SVG (sanitized server-side — XSS vector) and **transparent** PNG.
- **Reject:** JPEG / opaque PNG — clear message + offer variant C.
- **Always place on a light holder** — our dark scheme is "light islands," so one file works in both schemes. No inversion, no generated variants.
- Logo upload is **top plans only**; every surface must also work as variant C.
