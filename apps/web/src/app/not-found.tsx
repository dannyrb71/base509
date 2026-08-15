import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '120px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 28 }}>Page not found</h1>
      <p style={{ color: '#555' }}>That page doesn&rsquo;t exist on this site.</p>
      <p><Link href="/">Go to the homepage</Link></p>
    </main>
  );
}
