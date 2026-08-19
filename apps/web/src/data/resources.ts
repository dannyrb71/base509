/**
 * RESOURCES SECTION REGISTRY — the one place a content section is turned on.
 * (Resources build spec, 2026-08-19. Registry style mirrors src/data/pricing.ts.)
 *
 * Visibility model (two independent gates, BOTH must pass to surface a section):
 *   1. `visible` here — the deliberate launch flag (an edit + deploy, like
 *      policy publishing). `visible: false` → the section index 404s and the
 *      hub/nav never mention it, even if content files exist.
 *   2. ≥1 published item — a visible section with nothing published stays
 *      hidden from the hub and nav (see src/lib/resources.ts).
 *
 * Launch state: articles ready to go live (flips when George's first article
 * lands with published: true); guides + toolbox are built but DARK.
 */

export type ResourceSectionKey = 'articles' | 'guides' | 'toolbox';

export type ResourceSection = {
  key: ResourceSectionKey;
  title: string;
  description: string;
  /** Route inside the petappro brand tree (petappro.com strips the prefix via D-056). */
  route: string;
  /** Small emoji/icon shown on the hub card (optional). */
  icon?: string;
  /** The launch flag — see visibility model above. */
  visible: boolean;
};

export const RESOURCE_SECTIONS: ResourceSection[] = [
  {
    key: 'articles',
    title: 'Articles',
    description:
      'Practical reads for dog-care businesses — pricing, capacity, client care, and running the operation without losing your evenings.',
    route: '/petappro/resources/articles',
    icon: '📰',
    visible: true,
  },
  {
    key: 'guides',
    title: 'Guides',
    description:
      'Step-by-step walkthroughs — longer, structured how-tos you can follow start to finish.',
    route: '/petappro/resources/guides',
    icon: '🧭',
    // DARK until the first guides are written (portal how-tos wait for the portal).
    visible: false,
  },
  {
    key: 'toolbox',
    title: 'Toolbox',
    description:
      'Curated tools, templates, and outside resources we actually recommend.',
    route: '/petappro/resources/toolbox',
    icon: '🧰',
    // DARK until the link list is curated.
    visible: false,
  },
];

export function getSection(key: ResourceSectionKey): ResourceSection {
  const section = RESOURCE_SECTIONS.find((s) => s.key === key);
  if (!section) throw new Error(`Unknown resources section: ${key}`);
  return section;
}
