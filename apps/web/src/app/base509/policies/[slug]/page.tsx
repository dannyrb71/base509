import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Section } from '@/components/ui';
import { PolicyArticle } from '@/components/PolicyPage';
import { POLICIES, getPolicy } from '@/lib/policies';

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug);
  return { title: policy ? policy.title : 'Policy' };
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();
  return (
    <Section>
      <PolicyArticle policy={policy} basePath="/base509/policies" />
    </Section>
  );
}
