import type { Metadata } from 'next';
import { Section, Eyebrow } from '@/components/ui';
import { WaitlistForm } from '@/components/WaitlistForm';

export const metadata: Metadata = { title: 'Sign Up' };

export default function SignupPage() {
  return (
    <div className="petappro-page signup-page">
      <Section className="signup-section" tint>
        <div className="signup-card">
          <Eyebrow>Sign up</Eyebrow>
          <WaitlistForm
            idPrefix="signup"
            note="Starter will be free — no card required for the free plan."
            prompt={(
              <>
                <h1 className="type-display">Coming soon —<br />we’re fetching it.</h1>
                <p className="type-body-lg">The app and business portal are not open just yet —<br /> drop your email and you’ll be first in when they are.</p>
              </>
            )}
          />
        </div>
      </Section>
    </div>
  );
}
