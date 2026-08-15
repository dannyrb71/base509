import Link from 'next/link';

/**
 * DEV SURFACE SWITCHER — only reachable on localhost / preview hosts.
 * Production domains are rewritten by middleware.ts before they get here.
 */
export default function DevSwitcher() {
  const surfaces = [
    { name: 'base509.com', href: '/base509', alt: 'http://base509.localhost:3000', desc: 'Company hub — Apple org verification target' },
    { name: 'petappro.com', href: '/petappro', alt: 'http://petappro.localhost:3000', desc: 'Product marketing site' },
    { name: 'app.petappro.com', href: '/portal', alt: 'http://app.petappro.localhost:3000', desc: 'Provider portal (placeholder shell)' },
  ];
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 24 }}>Base509 web — dev surface switcher</h1>
      <p style={{ color: '#555' }}>
        You&apos;re on a development host, so no domain rewrite applied. Each production domain
        maps to one of these surfaces (see <code>middleware.ts</code>). For the true
        per-domain experience use the <code>*.localhost</code> URLs.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 16 }}>
        {surfaces.map((s) => (
          <li key={s.name} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 20 }}>
            <Link href={s.href} style={{ fontSize: 18, fontWeight: 600 }}>{s.name}</Link>
            <div style={{ color: '#555', margin: '6px 0' }}>{s.desc}</div>
            <code style={{ fontSize: 13 }}>{s.alt}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
