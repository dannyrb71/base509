import Image from 'next/image';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Btn, Section } from '@/components/ui';
import { resourceMdxComponents } from '@/components/ResourceMdx';
import { getSection } from '@/data/resources';
import {
  docUrl,
  formatDate,
  listPublished,
  relatedDocs,
  type ResourceDoc,
} from '@/lib/resources';

/**
 * Shared building blocks for the Resources section (build spec 2026-08-19;
 * article template per the approved article-template-mockup ordering:
 * breadcrumb → tag pills → H1 → meta → cover → body → end CTA → related →
 * back link). Articles and guides share every component, parameterized by
 * section, so guides launch later with zero new layout work.
 */

const AUDIENCE_LABEL: Record<ResourceDoc['audience'], string> = {
  owner: 'For dog owners',
  provider: 'For providers',
  both: 'For owners & providers',
};

export function ResourceCard({ doc }: { doc: ResourceDoc }) {
  const section = getSection(doc.section);
  return (
    // Whole card is the link (policy-card pattern — a card that looks
    // clickable must be clickable everywhere).
    <Link
      className="card card--raised res-card"
      href={`${section.route}/${doc.slug}`}
      aria-label={doc.title}
    >
      {doc.coverImage && (
        <div className="res-card__cover">
          <Image
            src={doc.coverImage}
            alt={doc.cardImageAlt ?? ''}
            width={doc.coverImageWidth ?? 640}
            height={doc.coverImageHeight ?? 480}
            sizes="(max-width: 760px) 100vw, 400px"
            unoptimized={doc.coverImageUnoptimized || doc.coverImage.endsWith('.svg')}
          />
        </div>
      )}
      <div className="res-pills">
        <span className="res-pill">{doc.category}</span>
        <span className="res-pill res-pill--audience">{AUDIENCE_LABEL[doc.audience]}</span>
      </div>
      <h3 className="type-title">{doc.title}</h3>
      <p className="res-meta type-caption">
        {formatDate(doc.date)} · {doc.readMinutes} min read
      </p>
      <span className="card__cta type-body-bold">
        Read the article <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

export function ResourceIndex({ section }: { section: 'articles' | 'guides' }) {
  const meta = getSection(section);
  const docs = listPublished(section);
  return (
    <>
      <Section tight className="res-index__head">
        <nav className="res-breadcrumb type-caption" aria-label="Breadcrumb">
          <Link href="/petappro/resources">Resources</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{meta.title}</span>
        </nav>
        <h1 className="type-display">{meta.title}</h1>
        <p className="type-body-lg res-index__intro">{meta.description}</p>
      </Section>
      <Section tight className="res-index__list">
        {docs.length === 0 ? (
          <p className="type-body">Nothing published here yet — check back soon.</p>
        ) : (
          <div className="grid grid--3 res-grid">
            {docs.map((doc) => (
              <ResourceCard key={doc.slug} doc={doc} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

/** Article JSON-LD — PUBLISHED items only (the page 404s before this renders for drafts). */
function ArticleJsonLd({ doc }: { doc: ResourceDoc }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    description: doc.seo?.description ?? doc.excerpt,
    datePublished: doc.date,
    url: docUrl(doc),
    ...(doc.coverImage ? { image: [`https://petappro.com${doc.coverImage}`] } : {}),
    author: { '@type': 'Organization', name: doc.author ?? 'PetAppro' },
    publisher: { '@type': 'Organization', name: 'PetAppro', url: 'https://petappro.com' },
  };
  return (
    // Build-time, repo-authored frontmatter only (never user input); `<` is
    // escaped so copy can never terminate the script element early.
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export function ResourceArticle({ doc }: { doc: ResourceDoc }) {
  const section = getSection(doc.section);
  const related = relatedDocs(doc);
  const backLabel = doc.section === 'articles' ? 'Back to all articles' : 'Back to all guides';
  return (
    <>
      <ArticleJsonLd doc={doc} />
      <Section tight>
        <article className="res-article">
          <nav className="res-breadcrumb type-caption" aria-label="Breadcrumb">
            <Link href="/petappro/resources">Resources</Link>
            <span aria-hidden="true"> / </span>
            <Link href={section.route}>{section.title}</Link>
            <span aria-hidden="true"> / </span>
            <span aria-current="page">{doc.title}</span>
          </nav>
          <div className="res-pills">
            <span className="res-pill">{doc.category}</span>
            <span className="res-pill res-pill--audience">{AUDIENCE_LABEL[doc.audience]}</span>
          </div>
          <h1 className="type-display">{doc.title}</h1>
          <p className="res-meta type-caption">
            {formatDate(doc.date)} · {doc.readMinutes} min read · {doc.author ?? 'PetAppro'}
          </p>
          {doc.coverImage && (
            <div className="res-cover">
              <Image
                src={doc.coverImage}
                alt={doc.coverImageAlt ?? ''}
                width={doc.coverImageWidth ?? 1440}
                height={doc.coverImageHeight ?? 720}
                priority
                sizes="(max-width: 760px) 100vw, 960px"
                unoptimized={doc.coverImageUnoptimized || doc.coverImage.endsWith('.svg')}
              />
            </div>
          )}
          <div className="prose res-body">
            <MDXRemote source={doc.body} components={resourceMdxComponents} />
          </div>
        </article>

        {/* Standard end-of-article CTA — every article funnels to the waitlist. */}
        <div className="res-cta card card--raised">
          <h2 className="type-title">Run your dog-care business on PetAppro</h2>
          <p className="type-body">
            Your clients, your prices, your money — we&rsquo;re pre-launch, and waitlist
            members are first in.
          </p>
          <Btn href="/petappro/signup">Join the waitlist</Btn>
        </div>

        {related.length > 0 && (
          <div className="res-related">
            <h2 className="type-title">Keep reading</h2>
            <div className="grid grid--3 res-grid">
              {related.map((r) => (
                <ResourceCard key={r.slug} doc={r} />
              ))}
            </div>
          </div>
        )}

        <p className="res-back">
          <Link className="type-body-bold" href={section.route}>
            ← {backLabel}
          </Link>
        </p>
      </Section>
    </>
  );
}
