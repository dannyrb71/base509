import type { Metadata } from 'next';
import Image from 'next/image';
import { FeatureSpotlightCarousel } from '@/components/FeatureSpotlightCarousel';
import { Section, Eyebrow, Btn } from '@/components/ui';

export const metadata: Metadata = { title: 'Features' };

const FULL_LIST = [
  {
    title: 'Private notes, just for you',
    body: "Jot the things worth remembering — a dog's quirks, a client who tends to run late. Kept private, so nothing slips through the cracks.",
    icon: '/brands/petappro/icon-private-notes.svg',
  },
  {
    title: 'Share the care',
    body: "Clients can share a pet's profile with a partner, so the whole household can manage their furry family together.",
    icon: '/brands/petappro/icon-share-care.svg',
  },
  {
    title: 'Make it your brand',
    body: 'Pick a theme you love, for you and your clients, so the app feels like yours to the people who trust you. New themes added over time.',
    icon: '/brands/petappro/icon-branding.svg',
  },
  {
    title: 'You set how it works',
    body: "Require a meet-and-greet on some services and not others. Skip in-app payments if you'd rather. Choose the payment types that fit how you already run.",
    icon: '/brands/petappro/icon-settings.svg',
  },
  {
    title: 'Room to grow',
    body: 'Bringing on help? Your plan scales with you — add permission-based roles in a few taps, so the right people see the right things.',
    icon: '/brands/petappro/icon-team-growth.svg',
  },
  {
    title: 'Smart pricing',
    body: 'Holiday weekends (Fri–Mon), extended care, puppy rates — rates that follow your rules without a calculator.',
    icon: '/brands/petappro/icon-smart-pricing.svg',
  },
] as const;

const ESSENTIALS = [
  ['Report cards', 'with check-in / check-out', '/brands/petappro/icon-report.svg'],
  ['Opt-in GPS tracking', 'for walks', '/brands/petappro/icon-location.svg'],
  ['A service menu', 'you set up', '/brands/petappro/icon-receipt.svg'],
  ['Blocked calendar days', 'when you need them', '/brands/petappro/icon-calendar.svg'],
  ['Smart pricing', 'holiday weekends (Fri–Mon), extended care, puppy rates', '/brands/petappro/icon-dollar.svg'],
  ['Notifications', 'that keep everyone in the loop', '/brands/petappro/icon-card.svg'],
] as const;

export default function FeaturesPage() {
  return (
    <div className="petappro-page figma-features">
      <Section className="figma-features__hero">
        <div className="figma-features__hero-grid">
          <div className="subpage-heading subpage-heading--inverse">
            <Eyebrow>Star features</Eyebrow>
            <h1 className="type-headline">The app that works<br />the way you do</h1>
            <Btn href="/petappro/signup" variant="cta">Get early access</Btn>
          </div>
          <FeatureSpotlightCarousel />
        </div>
      </Section>

      <Section className="figma-features__full-list">
        <div className="subpage-heading">
          <Eyebrow>The full list</Eyebrow>
          <h2 className="type-headline">Every tool, one app</h2>
        </div>
        <div className="figma-features__cards">
          {FULL_LIST.map((feature) => (
            <article key={feature.title}>
              <div className="figma-features__card-heading">
                <Image src={feature.icon} alt="" width={44} height={44} unoptimized />
                <h3 className="type-title">
                  {feature.title === 'Private notes, just for you'
                    ? <>Private notes,<br />just for you</>
                    : feature.title}
                </h3>
              </div>
              <p className="type-body">{feature.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section className="figma-features__essentials" tint>
        <div className="subpage-heading">
          <Eyebrow>And all the essentials</Eyebrow>
          <h2 className="type-headline">Everything you’d expect, included</h2>
        </div>
        <div className="figma-features__essential-grid">
          {ESSENTIALS.map(([title, body, icon]) => (
            <article key={title}>
              <span className="figma-features__essential-icon">
                <Image src={icon} alt="" width={28} height={28} unoptimized />
              </span>
              <div>
                <h3 className="type-title">{title}</h3>
                <p className="type-body">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section className="subpage-cta" inverse tight>
        <h2 className="type-headline">Ready to own your bookings?</h2>
        <p className="type-body">Free to start. No card required.<br />Cancel anytime — one click, no hard feelings.</p>
        <Btn href="/petappro/signup" variant="cta">Get early access</Btn>
      </Section>
    </div>
  );
}
