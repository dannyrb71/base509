import type { Metadata } from 'next';
import { Section, Eyebrow } from '@/components/ui';
import { PolicyIndex } from '@/components/PolicyPage';
import { policiesForSurface } from '@/lib/policies';

export const metadata: Metadata = { title: 'All Policies' };

/**
 * base509.com/policies — the canonical policy hub.
 *
 * STRUCTURE (deliberate, do not "consolidate" again): one card per policy,
 * each linking to that policy's OWN page at /base509/policies/<slug>. A prior
 * pass replaced this with a single stacked page printing every policy body
 * end-to-end; that was reverted. Policy bodies belong on their own URLs so
 * they can be linked, versioned and cited individually.
 */
export default function PoliciesHub() {
  return (
    <Section>
      <Eyebrow>Base509 LLC</Eyebrow>
      <h2>All Policies</h2>
      <div style={{ marginTop: 24 }}>
        <PolicyIndex
          policies={policiesForSurface('base509')}
          basePath="/base509/policies"
          intro="These policies govern every Base509 product. Each one is versioned: when a policy changes materially, we publish a new version with a new effective date and notify the people it affects — old versions stay archived here."
        />
      </div>
    </Section>
  );
}
