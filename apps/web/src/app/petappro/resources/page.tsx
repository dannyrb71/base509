import type { Metadata } from 'next';
import Link from 'next/link';
import { Eyebrow, Section } from '@/components/ui';
import { liveSections } from '@/lib/resources';

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Articles, guides, and tools for dog-care businesses — practical help for pricing, capacity, and client care from PetAppro.',
};

/**
 * Resources hub (build spec 2026-08-19). A section card appears ONLY when its
 * registry flag is visible AND it has ≥1 published item — so this page can
 * ship dark and light up section by section with zero layout work.
 */
export default function ResourcesHubPage() {
  const sections = liveSections();
  return (
    <>
      <Section tight>
        <Eyebrow>Resources</Eyebrow>
        <h1 className="type-display">Learn the business side of dog care.</h1>
        <p className="type-body-lg res-index__intro">
          Practical reads and tools from the team building PetAppro — for the people
          who board, walk, and care for dogs, and the owners who trust them.
        </p>
      </Section>
      <Section tight>
        {sections.length === 0 ? (
          <p className="type-body">Content is on the way — check back soon.</p>
        ) : (
          <div className="grid grid--3 res-grid">
            {sections.map((s) => (
              <Link key={s.key} className="card card--raised res-card" href={s.route} aria-label={s.title}>
                {s.icon && <div className="res-card__icon" aria-hidden="true">{s.icon}</div>}
                <h3 className="type-title">{s.title}</h3>
                <p className="type-body">{s.description}</p>
                <span className="card__cta type-body-bold">
                  Browse {s.title.toLowerCase()} <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
