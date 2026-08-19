import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResourceIndex } from '@/components/ResourcePages';
import { sectionVisible } from '@/lib/resources';

export const metadata: Metadata = {
  title: 'Guides',
  description: 'Step-by-step guides for dog-care businesses from PetAppro.',
};

export default function GuidesIndexPage() {
  // Built but DARK at launch (registry visible:false) → 404 until flipped.
  if (!sectionVisible('guides')) notFound();
  return <ResourceIndex section="guides" />;
}
