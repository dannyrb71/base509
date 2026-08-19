import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Section } from '@/components/ui';
import { toolboxByCategory } from '@/data/resources-toolbox';
import { sectionVisible } from '@/lib/resources';

export const metadata: Metadata = {
  title: 'Toolbox',
  description: 'Curated tools, templates, and outside resources for dog-care businesses.',
};

const AUDIENCE_LABEL = {
  owner: 'For dog owners',
  provider: 'For providers',
  both: 'For owners & providers',
} as const;

/** Built but DARK at launch (registry visible:false) → 404 until flipped. */
export default function ToolboxPage() {
  if (!sectionVisible('toolbox')) notFound();
  const grouped = toolboxByCategory();
  return (
    <>
      <Section tight>
        <nav className="res-breadcrumb type-caption" aria-label="Breadcrumb">
          <Link href="/petappro/resources">Resources</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Toolbox</span>
        </nav>
        <h1 className="type-display">Toolbox</h1>
        <p className="type-body-lg res-index__intro">
          Tools, templates, and outside resources we actually recommend.
        </p>
      </Section>
      <Section tight>
        {grouped.size === 0 ? (
          <p className="type-body">Nothing here yet — check back soon.</p>
        ) : (
          [...grouped.entries()].map(([category, entries]) => (
            <div key={category} className="res-toolbox-group">
              <h2 className="type-title">{category}</h2>
              <div className="grid grid--3 res-grid">
                {entries.map((entry) => (
                  <a
                    key={entry.url}
                    className="card card--raised res-card"
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${entry.title} (opens in a new tab)`}
                  >
                    <div className="res-pills">
                      <span className="res-pill res-pill--audience">{AUDIENCE_LABEL[entry.audience]}</span>
                    </div>
                    <h3 className="type-title">{entry.title}</h3>
                    <p className="type-body">{entry.description}</p>
                    <span className="card__cta type-body-bold">
                      Open <span aria-hidden="true">↗</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))
        )}
      </Section>
    </>
  );
}
