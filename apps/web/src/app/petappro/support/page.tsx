import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { Section, Eyebrow } from '@/components/ui';

export const metadata: Metadata = { title: 'Support' };

type Topic = {
  title: string;
  questions: { question: string; answer: ReactNode }[];
};

const TOPICS: Topic[] = [
  {
    title: 'Getting set up',
    questions: [
      { question: 'How do I get started?', answer: <>Create your account on the web, add the services you offer with your prices and hours, then invite your clients with a link or a QR code. Most providers are set up in an afternoon. We’re pre-launch right now — join the waitlist and you’ll be first in.</> },
      { question: 'How do my clients find me?', answer: <>They don’t have to — you invite them. Send a link or QR code and they land in your app, under your name. There’s no public directory, and we don’t place you in a marketplace alongside other providers.</> },
      { question: 'Will you contact or market to my clients?', answer: <>No. We don’t use your client list to market PetAppro to them, and we don’t put another provider in front of them. They’re your clients.</> },
      { question: 'Do you check or approve providers?', answer: <>No. We make the software — we don’t vet, screen, certify, or rate providers, and using PetAppro isn’t a credential. Licensing, insurance, and how you run your business are your decisions to make.</> },
      { question: 'Do I need a website?', answer: <>No. PetAppro is where your clients book, pay, and follow along.</> },
      { question: 'What services can I offer?', answer: <>Boarding, daycare, and dog walking at launch — each with your own prices, hours, capacity, and rules. More service types are planned, with timing confirmed before launch.</> },
      { question: 'Can I try it before paying?', answer: <>Yes. Starter is free for up to 5 clients, and paid plans include a free trial. The trial length will be confirmed before launch.</> },
    ],
  },
  {
    title: 'Bookings & scheduling',
    questions: [
      { question: 'Do I have to approve every booking?', answer: <>Only if you want to. Approve each request, or let your regulars auto-book — you decide per service.</> },
      { question: 'How do I keep from getting double-booked?', answer: <>Set capacity per service — how many dogs you can board at once, how many join a walk — and PetAppro holds the line. Overnight services block each other; walks can run alongside them.</> },
      { question: 'Can I block off days?', answer: <>Yes. Block vacation days, full days, or specific times, and they stop being bookable.</> },
      { question: 'Can I require a meet-and-greet first?', answer: <>Yes, and you choose which services need one. Require it for boarding but not for walks, if that’s how you work.</> },
      { question: 'How do holiday rates work?', answer: <>You set them. Holiday weekends cover Friday through Monday automatically, and you can add extended-care and puppy rates. You set the dollar amounts — we don’t take a percentage.</> },
      { question: 'What happens if a client cancels?', answer: <>Your cancellation policy applies. You set the window and any fee, and your clients see it before they book.</> },
      { question: 'Can I offer a flat rate for long stays?', answer: <>Yes. Agree the rate with your client the way you normally would, then apply a price override on the booking and choose “Long-stay flat rate” as the reason. Your client sees the agreed price before they pay, and it’s recorded separately in your reports.</> },
      { question: 'Is walk tracking available?', answer: <>Yes — opt-in GPS tracking for walks, with check-in and check-out coordinates and a route that lands on the client’s report card. Available on Crew and up.</> },
    ],
  },
  {
    title: 'Payments',
    questions: [
      { question: 'How do my clients pay me?', answer: <>Through Stripe, directly into your own account. The money goes to you, not through us — we take no cut of your bookings.</> },
      { question: 'Do I need a Stripe account? How do I set one up?', answer: <>Yes, for in-app payments. Connect an existing Stripe account during setup, or create one at <a href="https://dashboard.stripe.com/register">dashboard.stripe.com/register</a>. Stripe walks you through signup and verification. Your Stripe account stays yours.</> },
      { question: 'Are there payment processing fees?', answer: <>Stripe charges its standard processing fee on each transaction, and that goes to Stripe, not to us — we take no percentage of your bookings. Current rates are on <a href="https://stripe.com/pricing">Stripe’s pricing page</a>.</> },
      { question: 'Do my clients pay a service fee?', answer: <>No. Your price is the only price — no booking fee or service charge is added on their end. What you set is what they pay, and you both see the same total.</> },
      { question: 'Can I take cash, check, or another payment app?', answer: <>Yes. Track payments manually on any plan, and choose which payment types you accept.</> },
      { question: 'When do I get paid?', answer: <>Stripe pays out to your bank on your Stripe payout schedule — we don’t hold your money. Payout timing is set by Stripe.</> },
      { question: 'Can clients leave a tip?', answer: <>Yes — tipping is built into in-app payments, and tips go to you. If you take payment outside the app, your clients tip you directly.</> },
    ],
  },
  {
    title: 'Billing & your subscription',
    questions: [
      { question: 'What does PetAppro cost?', answer: <>Plans are a flat monthly price based on team size, from Starter through Team. Go annual and a month’s on us — see <a href="/petappro/pricing">Pricing</a>.</> },
      { question: 'Do you charge per staff member?', answer: <>Plans use flat team-size tiers rather than metered per-seat charges. You know the price before you move into the next tier.</> },
      { question: 'Is there a free trial on paid plans?', answer: <>Yes. The trial length will be confirmed before launch.</> },
      { question: 'How do I cancel?', answer: <>In your account settings on the web — one click, self-serve. No phone call or email required. You keep access through the end of the term you’ve paid for.</> },
      { question: 'Where do I manage my plan and billing?', answer: <>On the web, in your account. That’s where you subscribe, switch plans, and see billing history.</> },
      { question: 'What happens when I reach Starter’s 5-client limit?', answer: <>We’ll let you know, and you can move up whenever you’re ready. Your clients, pets, and history come with you.</> },
      { question: 'What happens to my data if I leave?', answer: <>It’s yours. Export your records anytime to a spreadsheet or your accounting software. If you close your account, we walk you through it — and your clients get notice and time to download their own records.</> },
    ],
  },
];

export default function SupportPage() {
  return (
    <div className="petappro-page figma-support">
      <Section className="figma-support__hero">
        <div className="subpage-heading">
          <Eyebrow>Support</Eyebrow>
          <h1 className="type-display">We’re here to help.</h1>
          <p className="type-body-lg">Stuck on something? Start with the common questions below, or just write us — a real person reads every message.</p>
        </div>
      </Section>

      <Section className="figma-support__topics" tint>
        <Eyebrow>Common topics</Eyebrow>
        <h2 className="type-headline">Frequently asked questions</h2>
        <div className="figma-support__accordion">
          {TOPICS.map((topic, index) => (
            <details key={topic.title} open={index === 2}>
              <summary className="type-title">
                {topic.title}
                <span className="figma-support__chevron" aria-hidden="true">
                  <Image className="figma-support__chevron-down" src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} unoptimized />
                  <Image className="figma-support__chevron-up" src="/brands/petappro.com/icon-chevron-up.svg" alt="" width={24} height={24} unoptimized />
                </span>
              </summary>
              <div className="figma-support__questions">
                {topic.questions.map((item) => (
                  <article key={item.question}>
                    <h3 className="type-title">{item.question}</h3>
                    <p className="type-body">{item.answer}</p>
                  </article>
                ))}
              </div>
            </details>
          ))}
        </div>
        <p className="figma-support__closing type-body">A full help center is on the way — until then, email us and we’ll get you sorted, quick.</p>
      </Section>

      <Section className="figma-support__contact" inverse tight>
        <h2 className="type-headline">Talk to us</h2>
        <p className="type-body">Email <a href="mailto:support@base509.com">support@base509.com</a>. We aim to reply within one business day.</p>
      </Section>
    </div>
  );
}
