import Image from 'next/image';
import { CardCarousel } from '@/components/CardCarousel';
import { Section, Eyebrow, Btn, Card } from '@/components/ui';

const featureCards = [
  {
    title: 'Booking & scheduling',
    body: 'Requests, approvals, capacity, blocked dates — and a schedule your whole team can see at a glance.',
    icon: '/brands/petappro/icon-calendar.svg',
  },
  {
    title: 'Prices you control',
    body: 'Rates you set in dollars, holidays included — not a percentage some marketplace decided for you.',
    icon: '/brands/petappro/icon-dollar.svg',
  },
  {
    title: 'Report cards',
    body: 'Check-in, check-out, photos, and the little updates clients love — in the app and/or forward to your messaging app.',
    icon: '/brands/petappro/icon-report.svg',
  },
  {
    title: 'Payments & tips',
    body: 'Clients pay you directly through Stripe, tips and all — and we take no cut of your bookings.',
    icon: '/brands/petappro/icon-card.svg',
  },
  {
    title: 'Invoices & reports dashboard',
    body: 'Tidy invoices under your name, plus spreadsheet or QuickBooks-ready exports your accountant will thank you for.',
    icon: '/brands/petappro/icon-receipt.svg',
  },
  {
    title: 'Opt-in walk tracking',
    body: 'Every walk mapped from leash-up to drop-off — and it lands right on the client’s report card.',
    icon: '/brands/petappro/icon-location.svg',
  },
];

const themes = [
  { name: 'Brandy Blue', image: '/brands/petappro/theme-brandy-blue.png' },
  { name: 'San Fursisco', image: '/brands/petappro/theme-san-fursisco.png' },
  { name: 'Irish Setter', image: '/brands/petappro/theme-irish-setter.png' },
];

export default function PetApproHome() {
  return (
    <div className="petappro-home">
      <Section id="home-hero">
        <div className="home-hero__row">
          <div className="home-hero__copy">
            <Eyebrow>For dog-care providers</Eyebrow>
            <h1 className="type-display">
              Your own<br />
              booking app.<br />
              No marketplace.<br />
              No cut.
            </h1>
            <p className="type-body-lg">
              PetAppro runs the boarding, daycare, walking, and drop-ins for dog folks who already have a full leash of clients. Your day, your prices, your people — in an app they’ll actually like opening. No marketplace in the middle, and we never take a percentage of your bookings.
            </p>
            <div className="home-actions">
              <Btn href="/petappro/signup" variant="cta">Get early access</Btn>
              <Btn href="/petappro/pricing" variant="secondary">See pricing</Btn>
            </div>
          </div>
          <figure className="home-hero__art">
            <Image
              src="/brands/petappro/home-hero-phones.png"
              alt="Illustrative PetAppro client booking and provider schedule screens"
              width={1791}
              height={1958}
              priority
            />
            <figcaption className="type-caption">Illustrative screens — sample content.</figcaption>
          </figure>
        </div>
      </Section>

      <Section id="home-all-in-one" tint tight>
        <div className="home-section-heading home-section-heading--compact">
          <Eyebrow>All-in-one</Eyebrow>
          <h2 className="type-headline">One app, tailored for you</h2>
          <p className="type-body">
            Booking requests buried in texts. Schedules living in a spreadsheet. A marketplace taking a slice of every job and calling your clients theirs. PetAppro puts your bookings, your clients, and your money in one place that’s actually yours.
          </p>
        </div>
      </Section>

      <Section id="home-why">
        <div className="home-section-heading">
          <Eyebrow>Why PetAppro</Eyebrow>
          <h2 className="type-headline">
            Built for providers,<br className="home-mobile-break" />{' '}not marketplaces
          </h2>
        </div>
        <div className="home-card-grid home-card-grid--four">
          <Card title="Own your clients">Your clients book with you, not through us. We take no cut, and we don’t market to them behind your back.</Card>
          <Card title="Flat pricing">One flat price per tier, not per head — you always know it before you grow. No commissions.</Card>
          <Card title="One home for everything">Bookings, schedules, pet records, payments — both sides of the relationship, one app.</Card>
          <Card title="An app clients love">Your clients get a fast, native app to book, pay, and follow along — all under your name, not ours.</Card>
        </div>
      </Section>

      <Section id="home-how" inverse>
        <div className="home-section-heading">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="type-headline">
            Booking in three,<br className="home-mobile-break" />{' '}easy steps
          </h2>
        </div>
        <div className="home-steps">
          {[
            ['1', 'Set up your services', 'Add what you offer — boarding, daycare, walks, drop-ins — with your prices, your hours, and your rules.'],
            ['2', 'Invite your clients', 'Send a link or a QR code. Your clients land in your app, wearing your branding.'],
            ['3', 'Get booked and paid', 'Approve each request or let the regulars auto-book. Run your day, get paid directly — tips and all.'],
          ].map(([number, title, body]) => (
            <article className="home-step" key={number}>
              <span className="home-step__number type-title-lg">{number}</span>
              <h3 className="type-title">{title}</h3>
              <p className="type-body">{body}</p>
            </article>
          ))}
        </div>
        <div className="home-centered-action">
          <Btn href="/petappro/features" variant="inverse">See all features</Btn>
        </div>
      </Section>

      <Section id="home-features">
        <Image
          className="home-feature-paws"
          src="/brands/petappro/home-feature-paws.svg"
          alt=""
          width={787}
          height={443}
          unoptimized
        />
        <div className="home-section-heading">
          <Eyebrow>What’s inside</Eyebrow>
          <h2 className="type-headline">Run your whole day</h2>
        </div>
        <div className="home-feature-grid">
          {featureCards.map((feature) => (
            <article className="home-feature-card" key={feature.title}>
              <div className="home-feature-card__heading">
                <Image src={feature.icon} alt="" width={36} height={36} unoptimized />
                <h3 className="type-title">{feature.title}</h3>
              </div>
              <p className="type-body">{feature.body}</p>
            </article>
          ))}
        </div>
        <div className="home-feature-carousel">
          <CardCarousel cards={featureCards} ariaLabel="PetAppro feature highlights" />
        </div>
        <div className="home-centered-action">
          <Btn href="/petappro/features" variant="secondary">See all features</Btn>
        </div>
      </Section>

      <Section id="home-themes" tint>
        <div className="home-section-heading">
          <Eyebrow>Make it yours</Eyebrow>
          <h2 className="type-headline">Your app, your look</h2>
          <p className="type-body-lg">Pick a theme your clients see everywhere they tap — and put your own logo up front on any plan.</p>
        </div>
        <div className="home-theme-grid">
          {themes.map((theme) => (
            <figure className="home-theme" key={theme.name}>
              <Image src={theme.image} alt={`${theme.name} light and dark theme preview`} width={995} height={603} />
              <figcaption className="type-title">{theme.name}</figcaption>
            </figure>
          ))}
        </div>
        <div className="home-centered-action">
          <Btn href="/petappro/themes" variant="secondary">Browse themes</Btn>
        </div>
      </Section>

      <Section id="home-payment-quote" tight>
        <h2 className="type-headline">Your clients pay you directly.<br />We take no cut.</h2>
      </Section>

      <Section id="home-pricing">
        <div className="home-section-heading">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="type-headline">
            Start free.<br className="home-mobile-break" />{' '}Grow predictably.
          </h2>
        </div>
        <div className="home-card-grid home-card-grid--three">
          <Card kicker="1 user · up to 5 clients" title="Starter — Free">Free. Your on-ramp — up to 5 clients, with a little “Powered by PetAppro” along for the ride.</Card>
          <Card kicker="Up to 2 users" title="Duo — $39/mo">Where in-app payments unlock — Stripe and tips, ready to go.</Card>
          <Card kicker="Up to 20 users" title="Team — $149/mo">Your biggest team — up to 20 seats with roles.</Card>
        </div>
        <div className="home-centered-action">
          <Btn href="/petappro/pricing" variant="secondary">See all plans</Btn>
        </div>
      </Section>

      <Section id="home-final-cta" inverse tight>
        <h2 className="type-headline">
          Ready to own<br className="home-mobile-break" />{' '}your bookings?
        </h2>
        <p className="type-body">Free to start. No card required. Cancel anytime — one click, no hard feelings.</p>
        <Btn href="/petappro/signup" variant="cta">Get early access</Btn>
      </Section>
    </div>
  );
}
