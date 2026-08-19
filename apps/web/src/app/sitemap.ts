import type { MetadataRoute } from 'next';
import { POLICIES } from '@/lib/policies';
import { docUrl, listPublished, liveSections, sectionVisible } from '@/lib/resources';

/**
 * Sitemap for both branded hosts (Resources build spec, 2026-08-19 — first
 * sitemap for the site). One codebase serves base509.com and petappro.com by
 * hostname (D-056); /sitemap.xml passes through the middleware un-rewritten,
 * so a single file lists both domains' canonical absolute URLs. Crawlers
 * apply only the URLs matching the host they fetched it from — acceptable
 * single-file behavior for a two-brand site this size.
 *
 * PUBLISHING RULES: resources items appear ONLY when published (drafts are
 * never listed); dark sections (visible:false or no published content)
 * contribute nothing; policies appear only with a published version.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // petappro.com marketing pages (the middleware strips the /petappro prefix).
  for (const p of ['', '/features', '/pricing', '/themes', '/download', '/support', '/contact', '/signup']) {
    entries.push({ url: `https://petappro.com${p}` });
  }

  // Resources: hub only when something is live; indexes for live sections;
  // every published article/guide.
  if (liveSections().length > 0) {
    entries.push({ url: 'https://petappro.com/resources' });
    for (const s of liveSections()) {
      entries.push({ url: `https://petappro.com/resources/${s.key}` });
    }
  }
  for (const section of ['articles', 'guides'] as const) {
    if (!sectionVisible(section)) continue;
    for (const doc of listPublished(section)) {
      entries.push({ url: docUrl(doc), lastModified: doc.date });
    }
  }

  // base509.com core pages + published policies.
  entries.push({ url: 'https://base509.com' });
  entries.push({ url: 'https://base509.com/policies' });
  for (const policy of POLICIES) {
    if (policy.published) {
      entries.push({ url: `https://base509.com/policies/${policy.slug}` });
    }
  }

  return entries;
}
