# PetAppro — Service-Area Maps (Google Maps + Terra Draw)

**Status:** Stack decided + key provisioned 2026-08-15 (Danny PO). Fake-map UI (`PortalZoneMap.tsx`) built; Code wired the real map 2026-08-15.
**Surface:** Web provider portal (`apps/web`) only — **not** the mobile app (native walk GPS is a separate app-feature; see below). Walk Windows §6: **single Service Area for MVP.**

## Decision
Provider defines one Service Area on a map as either a **drawn polygon** or a **circle (center + radius)**; used for "is this client inside your area" checks at booking time.

**Chosen stack (Google Maps):**
- **Base map:** Google Maps JavaScript API. (Code loads `places`/`geometry` via **dynamic import**, not the initial `libraries=` URL param — both are valid.)
- **Drawing:** **Terra Draw** (`terra-draw` + `terra-draw-google-maps-adapter`) — polygon + circle/radius modes + select/edit.
- **Address autocomplete:** Places API (New), session tokens.
- **Geocoding:** Geocoding API (address → lat/lng for the radius center + client-address checks).
- **Containment math:** the `geometry` library (or turf.js).

**Why Terra Draw, not Google's Drawing library:** Google **deprecated** the Maps JS Drawing library (DrawingManager) in **August 2025**; removed ~mid-2026 (v3.65.3b). **Terra Draw is a third-party library Google illustrates and suggests** (via an official Terra Draw Maps JS example) **but does not support** — it is map-provider-agnostic (adapters for Google, Mapbox, MapLibre, OpenLayers, Leaflet) and outputs standard **GeoJSON**.

**Why Google over MapLibre:** MapLibre is only a renderer — it still needs a keyed tile vendor (or self-hosted tiles), which is the same operational model as Google without the bundled Places/Geocoding. At launch volume Google's free tier covers it, one vendor is simpler. (MapLibre does **not** require storing map tiles in our DB — a common misconception; only self-hosting would.)

## Guardrail — store GeoJSON only
Persist the drawn zone as **GeoJSON** (Terra Draw's native output), never a Google-proprietary shape. This keeps the base map swappable forever and is exactly what dodges the next provider deprecation. **Stub the save for now** (DB foundation not stood up yet).

**Persistence + enforcement (Codex, 2026-08-15):** booking containment must be **server-authoritative** — the client-side Google geometry check (`PortalZoneMap`) is **preview-only**. On persistence, store **each zone's geometry** as a validated Polygon/MultiPolygon (one row per zone), **not** the whole FeatureCollection in a single column — `ST_GeomFromGeoJSON` consumes a geometry fragment, not a FeatureCollection (the current `service-area.ts` note is wrong on this). Server must validate coordinate ranges, ring closure, polygon validity/self-intersection, geometry size, and max service-area extent.

> ✅ **RESOLVED (PO, Danny, 2026-08-15): multi-zone KEPT.** Providers serve different areas on different days/times, so the wired multi-zone build stays. A single area (or single radius) is a valid simple case. See `walk-windows-scheduling.md` §8.

## Key / config
- Env var: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (in `apps/web/.env.local`, gitignored; also add to Vercel later).
- Browser key → **HTTP-referrer restricted** (`petappro.com/*`, `*.petappro.com/*`, `localhost:3000/*`) + **API-restricted** to Maps JavaScript API, Places API (New), Geocoding API.
- **Cost:** a **billing account must be enabled** in Google Cloud even below the free caps (done via the trial). Free tier (≈10k map loads + 10k geocodes/month) covers launch volume (a provider draws a zone once; occasional lookups). Places Autocomplete billing depends on **how the session ends + which Place Details fields are requested** — not simply "free."

## Native walk GPS is separate (not this)
Live walk GPS (D-054) is a **mobile app** feature: device location via `expo-location` (free, native) + a map to render the dot (Apple Maps free on iOS; Google Maps SDK on Android). It is **not** a Google Maps Platform billed API and does **not** belong to this web service-area work.
