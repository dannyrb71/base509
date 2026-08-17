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
                <h1 className="type-display">Let’s set up your business.</h1>
                <p className="type-body-lg">The portal’s not open just yet — drop your email and you’ll be first in when it is.</p>
              </>
            )}
          />
        </div>
      </Section>
    </div>
  );
}
