import type { Metadata } from 'next';
import { Section, Eyebrow, Btn } from '@/components/ui';
import { PlanComparisonTable } from '@/components/PlanComparisonTable';
import { TIERS } from '@/data/pricing';

export const metadata: Metadata = { title: 'Pricing' };

const HONEST = [
  ['No commissions', 'We take no percentage of your bookings. Your clients pay you directly.'],
  ['Flat, predictable tiers', 'One price per tier — you know your price before you grow into the next one.'],
  ['No fees for your clients', 'Your price is the only price — no booking fee or service charge added on their end. What you set is what they pay, and you both see the same total.'],
];

const FAQS = [
  ['Can I change plans anytime?', 'Yes — upgrades and downgrades are self-serve and prorated. Before any downgrade, we show you exactly what changes.'],
  ['Do you take a cut of my bookings?', 'No. Clients pay you directly through Stripe. Your subscription is the only thing you pay us.'],
  ['What happens at the free plan’s 5-client cap?', 'Nothing breaks — you just can’t add a sixth client until you upgrade. Your data and bookings keep right on working.'],
  ['Is there a free trial on paid plans?', 'Yes — paid plans start with a free trial, and we tell you exactly when it ends and what it’ll charge before you confirm. Cancelling is one click, online, anytime.'],
];

export default function PricingPage() {
  return (
    <div className="petappro-page figma-pricing">
      <Section className="figma-pricing__hero" tint>
        <div className="subpage-heading">
          <Eyebrow>Pricing</Eyebrow>
          <h1 className="type-display">Start free.<br />Grow predictably.</h1>
          <p className="type-body-lg">Every plan’s a flat monthly price — go annual and a month’s on us.<br />No commissions on your bookings.</p>
        </div>
        <div className="figma-pricing__tiers">
          {TIERS.map((tier) => (
            <article className={tier.featured ? 'is-featured' : ''} key={tier.key}>
              {/* Variant A hierarchy (Danny, 2026-08-19): name on its own
                  line, monthly amount is the hero, annual is a bold legible
                  subline + "1 month free" pill. Colour discipline: camo green
                  appears ONLY on the pill, the featured Duo border, and
                  "Payments unlock here" — names and prices are navy. */}
              <p className="type-label">{tier.seats}</p>
              <h2 className="figma-pricing__name">{tier.name}</h2>
              <p className="figma-pricing__price">
                {tier.monthly === null ? (
                  <span className="figma-pricing__amount figma-pricing__amount--text">Contact us</span>
                ) : tier.monthly === 0 ? (
                  <span className="figma-pricing__amount figma-pricing__amount--text">Free</span>
                ) : (
                  <>
                    <span className="figma-pricing__amount">${tier.monthly}</span>
                    <span className="figma-pricing__per">/mo</span>
                  </>
                )}
              </p>
              {tier.annual !== null && (
                <p className="figma-pricing__annual">
                  <strong>or ${tier.annual.toLocaleString('en-US')}/yr</strong>
                  <span className="figma-pricing__pill">1 month free</span>
                </p>
              )}
              <p className="type-body">{tier.blurb}</p>
              {tier.key === 'duo' && <span className="figma-pricing__badge type-label">Payments unlock here</span>}
              {tier.key === 'enterprise' && <Btn href="/petappro/contact" variant="secondary" size="sm">Talk to us</Btn>}
            </article>
          ))}
        </div>
      </Section>

      <Section className="figma-pricing__compare">
        <div className="subpage-heading"><Eyebrow>Compare plans</Eyebrow><h2 className="type-headline">The full feature matrix</h2></div>
        <PlanComparisonTable showPrices highlightKeys={['duo', 'crew']} />
        <p className="pricing-footnote type-caption">GPS walk tracking ships at launch; in-app messaging arrives after launch. Draft pricing — final pricing is confirmed at launch.</p>
      </Section>

      <Section className="figma-pricing__honest">
        <div className="subpage-heading subpage-heading--inverse"><Eyebrow>The honest part</Eyebrow><h2 className="type-headline">Nothing hiding,<br className="pricing-mobile-break" /> nothing extra</h2></div>
        <div className="figma-pricing__honest-grid">{HONEST.map(([title, body]) => <article key={title}><h3 className="type-title">{title}</h3><p className="type-body">{body}</p></article>)}</div>
      </Section>

      <Section className="figma-pricing__faq">
        <div className="subpage-heading"><Eyebrow>Questions</Eyebrow><h2 className="type-headline">Pricing FAQ</h2></div>
        <div className="figma-pricing__faq-grid">{FAQS.map(([question, answer]) => <article key={question}><h3 className="type-title">{question}</h3><p className="type-body">{answer}</p></article>)}</div>
      </Section>

      <Section className="subpage-cta" inverse tight>
        <h2 className="type-headline">Start free today</h2><p className="type-body">No card required for Starter.</p><Btn href="/petappro/signup" variant="cta">Get early access</Btn>
      </Section>
    </div>
  );
}
