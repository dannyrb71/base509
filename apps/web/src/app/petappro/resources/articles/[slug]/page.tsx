import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResourceArticle } from '@/components/ResourcePages';
import { docUrl, getPublishedDoc, listPublished, sectionVisible } from '@/lib/resources';

/**
 * Only PUBLISHED articles get params, and dynamicParams=false turns every
 * other slug — drafts included — into a static 404. A dark section
 * (visible:false) emits no params at all.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  if (!sectionVisible('articles')) return [];
  return listPublished('articles').map((d) => ({ slug: d.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const doc = getPublishedDoc('articles', slug);
  if (!doc) return {};
  const title = doc.seo?.title ?? doc.title;
  const description = doc.seo?.description ?? doc.excerpt;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: docUrl(doc),
      siteName: 'PetAppro',
      ...(doc.coverImage ? { images: [{ url: `https://petappro.com${doc.coverImage}` }] } : {}),
    },
  };
}

export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!sectionVisible('articles')) notFound();
  const doc = getPublishedDoc('articles', slug);
  if (!doc) notFound();
  return <ResourceArticle doc={doc} />;
}
