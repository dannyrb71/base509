import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResourceIndex } from '@/components/ResourcePages';
import { sectionVisible } from '@/lib/resources';

export const metadata: Metadata = {
  title: 'Articles',
  description:
    'Practical articles for dog-care businesses — pricing, capacity, client care, and running the operation.',
};

export default function ArticlesIndexPage() {
  // The launch flag gates the whole section: not visible → 404 (build spec).
  if (!sectionVisible('articles')) notFound();
  return <ResourceIndex section="articles" />;
}
