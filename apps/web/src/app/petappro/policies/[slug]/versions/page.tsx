import { redirect } from 'next/navigation';

export default async function PolicyVersionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`https://base509.com/policies/${encodeURIComponent(slug)}/versions`);
}
