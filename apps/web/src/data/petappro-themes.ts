/**
 * CANONICAL THEME BINDING — the one map from the DB's stable theme keys to
 * portal/marketing display metadata.
 *
 * Key source of truth: the locked roster in apps/web/copy/theme-tiers.md,
 * mirrored by the database's app.known_theme_keys() (CFG-1, Codex round-3:
 * stable keys = snake_case of the locked roster names). Entitlement
 * theme_allowlist values are THESE keys — never display names. The portal
 * previously mixed display names with unrelated CSS slugs (bark/fursisco…);
 * this registry is the cleanup: keys are the currency everywhere, display
 * names and CSS slugs are render-time lookups.
 *
 * ⚠️ Binding touches theme_allowlist/entitlement consistency — routed to
 * CODEX for review with the A-slice batch.
 */

export type ThemeKey =
  | 'brandy_blue'
  | 'husky'
  | 'irish_setter'
  | 'bichon_frise'
  | 'blue_heeler'
  | 'chessie'
  | 'bark_avenue_ny'
  | 'south_bark_miami'
  | 'hollywoowoowood'
  | 'san_fursisco';

export type ThemeMode = 'light' | 'dark';

export type PetApproTheme = {
  key: ThemeKey;
  /** Locked roster display name (theme-tiers.md). */
  name: string;
  /** Fragment of the --pa-theme-<slug>-{light,mid,dark} CSS variables. */
  cssSlug: string;
  /** Display font, loaded by the petappro/portal layouts. */
  font: string;
};

export const PETAPPRO_THEMES: readonly PetApproTheme[] = [
  { key: 'brandy_blue', name: 'Brandy Blue', cssSlug: 'brandy', font: 'Poppins' },
  { key: 'husky', name: 'Husky', cssSlug: 'husky', font: 'Lexend' },
  { key: 'irish_setter', name: 'Irish Setter', cssSlug: 'setter', font: 'Nunito Sans' },
  { key: 'bichon_frise', name: 'Bichon Frise', cssSlug: 'bichon', font: 'Source Serif 4' },
  { key: 'blue_heeler', name: 'Blue Heeler', cssSlug: 'heeler', font: 'Roboto' },
  { key: 'chessie', name: 'Chessie', cssSlug: 'chessie', font: 'Noticia Text' },
  { key: 'bark_avenue_ny', name: 'Bark Avenue NY', cssSlug: 'bark', font: 'Oswald' },
  { key: 'south_bark_miami', name: 'South Bark Miami', cssSlug: 'south', font: 'Ubuntu' },
  { key: 'hollywoowoowood', name: 'Hollywoowoowood', cssSlug: 'hollywood', font: 'Manrope' },
  { key: 'san_fursisco', name: 'San Fursisco', cssSlug: 'fursisco', font: 'Arial' },
] as const;

/** The safe default every tenant can render (Starter's whole allowlist). */
export const DEFAULT_THEME_KEY: ThemeKey = 'brandy_blue';

export function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === 'string' && PETAPPRO_THEMES.some((t) => t.key === value);
}

/** Fail-safe lookup: unknown/missing keys resolve to Brandy Blue. */
export function themeByKey(key: unknown): PetApproTheme {
  return PETAPPRO_THEMES.find((t) => t.key === key) ?? PETAPPRO_THEMES[0];
}

export function themeByName(name: string): PetApproTheme {
  return PETAPPRO_THEMES.find((t) => t.name === name) ?? PETAPPRO_THEMES[0];
}

/** Canonical keys → display names (boundary to name-based UI like ThemeGallery). */
export function themeNamesForKeys(keys: readonly string[]): string[] {
  return keys.filter(isThemeKey).map((k) => themeByKey(k).name);
}
