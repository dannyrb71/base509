import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResourceArticle } from '@/components/ResourcePages';
import { docUrl, getPublishedDoc, listPublished, sectionVisible } from '@/lib/resources';

/** Same publishing model as articles — see articles/[slug]/page.tsx. */
export const dynamicParams = false;

export function generateStaticParams() {
  if (!sectionVisible('guides')) return [];
  return listPublished('guides').map((d) => ({ slug: d.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const doc = getPublishedDoc('guides', slug);
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

export default async function GuidePage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!sectionVisible('guides')) notFound();
  const doc = getPublishedDoc('guides', slug);
  if (!doc) notFound();
  return <ResourceArticle doc={doc} />;
}
