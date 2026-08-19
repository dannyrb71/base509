/**
 * TOOLBOX REGISTRY — the curated external-link list for /resources/toolbox.
 * (Resources build spec, 2026-08-19. Registry style mirrors src/data/pricing.ts.)
 *
 * Adding an entry here is publishing it: the toolbox has no per-item draft
 * flag — an entry in this array renders as soon as the section itself is
 * visible (src/data/resources.ts) . Keep it empty until the list is curated;
 * an empty array keeps the section hidden from the hub/nav even when the
 * section flag flips (the ≥1-item gate).
 *
 * External links render with target="_blank" rel="noopener noreferrer".
 */

export type ToolboxEntry = {
  title: string;
  description: string;
  url: string;
  /** Display grouping on the toolbox page (e.g. "Templates", "Calculators"). */
  category: string;
  audience: 'owner' | 'provider' | 'both';
};

export const TOOLBOX: ToolboxEntry[] = [
  // Example shape (delete when the real list is curated):
  // {
  //   title: 'Vaccination record template',
  //   description: 'A one-page record providers can hand new clients.',
  //   url: 'https://example.com/template',
  //   category: 'Templates',
  //   audience: 'provider',
  // },
];

/** Category display order = first appearance order in TOOLBOX. */
export function toolboxByCategory(): Map<string, ToolboxEntry[]> {
  const grouped = new Map<string, ToolboxEntry[]>();
  for (const entry of TOOLBOX) {
    const list = grouped.get(entry.category) ?? [];
    list.push(entry);
    grouped.set(entry.category, list);
  }
  return grouped;
}
