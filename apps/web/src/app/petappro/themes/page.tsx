import type { Metadata } from 'next';
import Image from 'next/image';
import { Section, Eyebrow, Btn } from '@/components/ui';
import { ThemeGallery } from '@/components/ThemeGallery';

export const metadata: Metadata = { title: 'Themes' };

const PLAN_CARDS = [
  ['Starter', 'Brandy Blue, our default — clean and professional straight out of the box.'],
  ['Solo', 'Brandy Blue plus Husky and Irish Setter.'],
  ['Duo', 'Every breed theme — Bichon Frise, Blue Heeler, and Chessie join the set.'],
  ['Crew & Team', 'The full library: every breed plus Bark Avenue NY, San Fursisco, Hollywoowoowood, and South Bark Miami — plus seasonal drops.'],
] as const;

export default function ThemesPage() {
  return (
    <div className="petappro-page figma-themes">
      <Section className="figma-themes__hero">
        <div className="figma-themes__hero-grid">
          <div className="subpage-heading">
            <Eyebrow>Themes</Eyebrow>
            <h1 className="type-display">Make it yours</h1>
            <p className="type-body-lg">The app your clients tap every day carries your look, not ours. Pick a theme — each one comes in light and dark — and put your own logo up top on any plan.</p>
            <Btn href="/petappro/signup" variant="cta">Get early access</Btn>
          </div>
          <div className="figma-themes__hero-art">
            <Image className="figma-themes__hero-phone" src="/brands/petappro/petappro-book-a-service.png" alt="PetAppro service menu preview" width={319} height={662} priority />
            <Image className="figma-themes__fan" src="/brands/petappro/theme-swatch-fan.png" alt="Fan of PetAppro theme color cards" width={1500} height={1290} priority />
          </div>
        </div>
      </Section>

      <Section className="figma-themes__gallery" tint>
        <div className="subpage-heading">
          <Eyebrow>Gallery</Eyebrow><h2 className="type-headline">Every theme,<br className="themes-mobile-break" /> light and dark</h2>
        </div>
        <ThemeGallery />
      </Section>

      <Section className="figma-themes__plans">
        <div className="subpage-heading subpage-heading--inverse"><Eyebrow>Plans</Eyebrow><h2 className="type-headline">Which plans get what</h2></div>
        <div className="figma-themes__plan-grid">{PLAN_CARDS.map(([title, body]) => <article key={title}><h3 className="type-title">{title}</h3><p className="type-body">{body}</p></article>)}</div>
        <article className="figma-themes__enterprise"><span className="type-label">Enterprise</span><p className="type-body">Your own fully custom brand.</p></article>
        <div className="figma-themes__plans-action"><Btn href="/petappro/pricing" variant="inverse">See full plan breakdown</Btn></div>
      </Section>

      <Section className="figma-themes__branding" tint>
        <div className="subpage-heading"><Eyebrow>Logo &amp; branding</Eyebrow><h2 className="type-headline">Your brand, front and center</h2><p className="type-body-lg">Every plan shows your business name and your own logo in the client app — your brand, front and center. Higher plans (Crew and up) also remove the small “Powered by PetAppro” mark.</p></div>
      </Section>

      <Section className="subpage-cta" inverse tight><h2 className="type-headline">Try it with your branding</h2><Btn href="/petappro/signup" variant="cta">Get early access</Btn></Section>
    </div>
  );
}
