import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { RESOURCE_SECTIONS, getSection, type ResourceSectionKey } from '@/data/resources';
import { TOOLBOX } from '@/data/resources-toolbox';

/**
 * RESOURCES CONTENT LIBRARY (Resources build spec, 2026-08-19).
 * Content-rendering model mirrors src/lib/policies.ts: content lives ONCE as
 * files under content/resources/{articles,guides}/, read from disk at build
 * time and statically generated. No DB, no CMS.
 *
 * PUBLISHING IS A DELIBERATE ACT: an item ships only when its frontmatter has
 * `published: true`. False or missing → excluded from every index, from
 * generateStaticParams, from the sitemap, and from related-article lists;
 * visiting its slug directly 404s. Drafts can live in the repo indefinitely.
 */

export type ResourceAudience = 'owner' | 'provider' | 'both';

export type ResourceDoc = {
  section: Extract<ResourceSectionKey, 'articles' | 'guides'>;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  audience: ResourceAudience;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  author?: string;
  coverImage?: string;
  seo?: { title?: string; description?: string };
  published: boolean;
  /** Raw MDX body (frontmatter stripped). */
  body: string;
  /** Auto-computed reading time, minimum 1. */
  readMinutes: number;
};

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'resources');

const AUDIENCES: ResourceAudience[] = ['owner', 'provider', 'both'];

function contentDir(section: 'articles' | 'guides') {
  return path.join(CONTENT_ROOT, section);
}

/** Rough word count over the MDX body with syntax stripped. */
function readingMinutes(body: string): number {
  const text = body
    .replace(/```[\s\S]*?```/g, ' ') // code fences
    .replace(/<[^>]+>/g, ' ') // JSX/HTML tags
    .replace(/\{[^}]*\}/g, ' ') // JSX expressions
    .replace(/[#>*_`[\]()!-]/g, ' '); // md punctuation
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

function parseDoc(section: 'articles' | 'guides', file: string): ResourceDoc {
  const fullPath = path.join(contentDir(section), file);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(raw);

  const published = data.published === true;
  const slug = typeof data.slug === 'string' && data.slug ? data.slug : file.replace(/\.mdx$/, '');

  // A published item must be complete — fail the BUILD rather than ship a
  // half-formed page. Drafts are allowed to be ragged.
  if (published) {
    for (const field of ['title', 'excerpt', 'category', 'audience', 'date'] as const) {
      if (!data[field] || typeof data[field] !== 'string') {
        throw new Error(`content/resources/${section}/${file}: published item is missing frontmatter "${field}"`);
      }
    }
    if (!AUDIENCES.includes(data.audience)) {
      throw new Error(`content/resources/${section}/${file}: audience must be owner | provider | both`);
    }
    if (data.section && data.section !== section) {
      throw new Error(`content/resources/${section}/${file}: frontmatter section "${data.section}" does not match its directory`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      throw new Error(`content/resources/${section}/${file}: date must be YYYY-MM-DD`);
    }
  }

  return {
    section,
    slug,
    title: String(data.title ?? slug),
    excerpt: String(data.excerpt ?? ''),
    category: String(data.category ?? 'General'),
    audience: AUDIENCES.includes(data.audience) ? data.audience : 'both',
    date: String(data.date ?? ''),
    author: typeof data.author === 'string' ? data.author : undefined,
    coverImage: typeof data.coverImage === 'string' ? data.coverImage : undefined,
    seo:
      data.seo && typeof data.seo === 'object'
        ? {
            title: typeof data.seo.title === 'string' ? data.seo.title : undefined,
            description: typeof data.seo.description === 'string' ? data.seo.description : undefined,
          }
        : undefined,
    published,
    body: content,
    readMinutes: readingMinutes(content),
  };
}

function allDocs(section: 'articles' | 'guides'): ResourceDoc[] {
  const dir = contentDir(section);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => parseDoc(section, f));
}

/** Published items only, newest first — the ONLY list any surface renders. */
export function listPublished(section: 'articles' | 'guides'): ResourceDoc[] {
  return allDocs(section)
    .filter((d) => d.published)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** A doc by slug — PUBLISHED ONLY. Drafts and unknown slugs both return null (→ 404). */
export function getPublishedDoc(
  section: 'articles' | 'guides',
  slug: string,
): ResourceDoc | null {
  return listPublished(section).find((d) => d.slug === slug) ?? null;
}

/** Same-category published items (excluding self); fallback pads with newest. */
export function relatedDocs(doc: ResourceDoc, limit = 3): ResourceDoc[] {
  const pool = listPublished(doc.section).filter((d) => d.slug !== doc.slug);
  const sameCategory = pool.filter((d) => d.category === doc.category);
  const rest = pool.filter((d) => d.category !== doc.category);
  return [...sameCategory, ...rest].slice(0, limit);
}

/** ≥1-published-item gate per section (toolbox items publish by existing). */
export function sectionHasContent(key: ResourceSectionKey): boolean {
  if (key === 'toolbox') return TOOLBOX.length > 0;
  return listPublished(key).length > 0;
}

/** Sections that appear on the hub: `visible` flag AND ≥1 published item. */
export function liveSections() {
  return RESOURCE_SECTIONS.filter((s) => s.visible && sectionHasContent(s.key));
}

/** Nav/footer "Resources" link renders only when something is actually live. */
export function resourcesNavVisible(): boolean {
  return liveSections().length > 0;
}

/** True when a section's own index may render (the `visible` launch flag). */
export function sectionVisible(key: ResourceSectionKey): boolean {
  return getSection(key).visible;
}

/** Absolute petappro.com URL for a doc (sitemap / OG / JSON-LD). */
export function docUrl(doc: ResourceDoc): string {
  return `https://petappro.com/resources/${doc.section}/${doc.slug}`;
}

/** "August 19, 2026" — parsed as UTC so the date never shifts a day (PolicyPage pattern). */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
