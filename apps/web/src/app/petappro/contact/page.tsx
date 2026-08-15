import type { Metadata } from 'next';
import { Section, Eyebrow, Btn } from '@/components/ui';

export const metadata: Metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <div className="petappro-page contact-page">
      <Section className="subpage-hero contact-hero">
        <div className="subpage-heading">
          <Eyebrow>Contact</Eyebrow>
          <h1 className="type-display">Get in touch.</h1>
          <p className="type-body-lg">Questions about PetAppro, your account, or anything else — email <a href="mailto:support@base509.com">support@base509.com</a> and a real person will get back to you.</p>
        </div>
      </Section>
      <Section className="contact-details" tint>
        <article className="contact-card">
          <h2 className="type-title-lg">What to include</h2>
          <p className="type-body">Your business name, what you were trying to do, and a screenshot or two help us answer fast. If it’s about billing, the email on your account is all we need — and please don’t send card numbers by email.</p>
        </article>
        <article className="contact-card contact-card--email">
          <h2 className="type-title-lg">Support email:</h2>
          <Btn href="mailto:support@base509.com" variant="secondary">Email support@base509.com</Btn>
        </article>
      </Section>
    </div>
  );
}
