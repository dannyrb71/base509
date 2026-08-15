import type { Metadata } from 'next';
import Image from 'next/image';
import { DownloadScreensTabs } from '@/components/DownloadScreensTabs';
import { Section, Eyebrow, Btn } from '@/components/ui';
import { WaitlistForm } from '@/components/WaitlistForm';

export const metadata: Metadata = { title: 'Download' };

export default function DownloadPage() {
  return (
    <div className="petappro-page figma-download">
      <Section className="figma-download__hero">
        <div className="figma-download__hero-grid">
          <div className="subpage-heading">
            <Eyebrow>Download</Eyebrow><h1 className="type-display">PetAppro<br />on your phone.</h1><p className="type-body-lg">One app for you and your clients — iPhone and Android.</p>
            <div className="figma-download__badges">
              <Image src="/brands/petappro/app-store-preorder.png" alt="Pre-order on the App Store" width={121} height={41} />
              <Image src="/brands/petappro/google-play-preregister.png" alt="Pre-register on Google Play" width={135} height={40} />
            </div>
          </div>
          <Image className="figma-download__hero-art" src="/brands/petappro/download-hero.png" alt="PetAppro provider and client app screens" width={2090} height={2052} priority />
        </div>
      </Section>

      <Section className="figma-download__notify" tint>
        <div className="figma-download__notify-card">
          <Eyebrow>Pre-launch</Eyebrow><h2 className="type-headline">Want a nudge<br className="download-mobile-break" /> the day it lands?</h2><p className="type-body">Not on the stores just yet — drop your email and we’ll tell you the moment it is.</p>
          <WaitlistForm buttonLabel="Notify me" idPrefix="download-notify" />
        </div>
      </Section>

      <Section className="figma-download__inside">
        <div className="subpage-heading subpage-heading--inverse"><Eyebrow>A look inside*</Eyebrow><h2 className="type-headline">Provider side,<br className="download-mobile-break" /> client side</h2></div>
        <DownloadScreensTabs />
        <p className="figma-download__disclaimer type-body">* Illustrative screens with sample content. What you see in the app varies by provider, plan, and theme.</p>
      </Section>

      <Section className="subpage-cta" inverse tight><h2 className="type-headline">New to PetAppro?</h2><p className="type-body">Join the waitlist and we’ll bring it to you the day it launches.</p><Btn href="/petappro/signup" variant="cta">Get early access</Btn></Section>
    </div>
  );
}
