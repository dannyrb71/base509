import { notFound } from 'next/navigation';
import { Section } from '@/components/ui';
import { PolicyArticle } from '@/components/PolicyPage';
import { POLICIES, getPolicy, getVersion, isPubliclyLinkable, publicVersions } from '@/lib/policies';

export function generateStaticParams() {
  return POLICIES.flatMap((p) =>
    publicVersions(p).map((v) => ({ slug: p.slug, version: v.version })),
  );
}

export default async function ArchivedVersionPage({
  params,
}: { params: Promise<{ slug: string; version: string }> }) {
  const { slug, version } = await params;
  const policy = getPolicy(slug);
  if (!policy) notFound();
  const v = getVersion(policy, version);
  // Draft versions have no public permalink — they render only at
  // /policies/<slug> behind the DRAFT banner, never at a versioned URL.
  if (!v || !isPubliclyLinkable(v)) notFound();
  return (
    <Section>
      <PolicyArticle policy={policy} version={v} basePath="/base509/policies" />
    </Section>
  );
}
