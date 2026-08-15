import type { Metadata } from 'next';
import { Section, Eyebrow } from '@/components/ui';
import { PolicyIndex } from '@/components/PolicyPage';
import { policiesForSurface } from '@/lib/policies';

export const metadata: Metadata = { title: 'Policies' };

export default function PoliciesPage() {
  return (
    <div className="petappro-page policies-page">
      <Section className="policies-hero">
        <div className="subpage-heading">
          <Eyebrow>PetAppro</Eyebrow>
          <h1 className="type-display">Policies</h1>
          <p className="type-body-lg">PetAppro is made by Base509 LLC, and these policies govern your use of it. Each policy is versioned — your agreement stays bound to the version you accepted, and old versions stay archived here.</p>
        </div>
      </Section>
      <Section className="policies-index" tint>
        <PolicyIndex
          policies={policiesForSurface('petappro')}
          basePath="https://base509.com/policies"
          intro=""
        />
      </Section>
    </div>
  );
}
