import { notFound } from 'next/navigation';
import { Section } from '@/components/ui';
import { PolicyVersionList } from '@/components/PolicyPage';
import { POLICIES, getPolicy } from '@/lib/policies';

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export default async function VersionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();
  return (
    <Section>
      <PolicyVersionList policy={policy} basePath="/base509/policies" />
    </Section>
  );
}
