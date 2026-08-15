import { redirect } from 'next/navigation';

export default async function PolicyVersionPage({ params }: { params: Promise<{ slug: string; version: string }> }) {
  const { slug, version } = await params;
  redirect(`https://base509.com/policies/${encodeURIComponent(slug)}/v/${encodeURIComponent(version)}`);
}
