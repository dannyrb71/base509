import Image from 'next/image';
import { Section, Eyebrow, UnderlineMotif, Btn } from '@/components/ui';
import { CardCarousel } from '@/components/CardCarousel';

/**
 * base509.com — company hub, single page (spec §2).
 * COPY: canonical FINAL from copy/base509-site-copy.md → "✅ CURRENT CANONICAL
 * COPY — from Figma (2026-08-01)" — do not rewrite without a new approved copy
 * doc. Four sections: Hero · What we build ·
 * Who we are · Contact. Anchors #products and #contact are load-bearing.
 * LAYOUT: Figma "Base509.com — Home" file, frame base509.com / Home (1:2).
 * Section pattern from that frame is Eyebrow → underline motif → heading, in
 * every section — keep that order when editing.
 * Guardrails: dogs-now/cats-soon · Instagram/Facebook/Nextdoor only ·
 * no competitor names · "book you directly" (never "clients stay yours").
 * Apple org-verification bar still holds: public, no password, no "coming
 * soon", names Base509 LLC, states what we do, @base509.com contact.
 *
 * REBUILD NOTE (element-by-element from frame 1:2, 1440×3129):
 *   Hero            1:4  y=120  h=711  pad 96/120  bg #0D2B45
 *   What we build   1:5  y=831  h=1267 pad 80/120  bg #F5F0E7
 *   Who we are      1:6  y=2098 h=399  pad 80/120  bg #0D2B45
 *   Contact         1:7  y=2497 h=347  pad 80/120  bg #F5F0E7
 * Header (1:3) and Footer (1:8) live in ./layout.tsx; their brand styling is
 * in src/styles/brand-base509.css.
 * Every vector in the frame (hero stroked rounded rects — Group 6 / 94:1314,
 * and the three "What we build" tile clusters — Groups 62:1026 / 62:1033 /
 * 62:1040) is drawn in CSS below, NOT shipped as an asset.
 */

/* Feature cards — Figma carousel instance 29:793 (5 real cards + 1 loop dupe).
   Titles render UPPERCASE (--display-case); words are verbatim from the frame. */
const FEATURE_CARDS: { title: string; body: string }[] = [
  {
    // Double spaces below are verbatim from the frame — see the pre-wrap rule
    // on .carousel__card h3; they drive the line breaks Figma shows.
    title: 'Fair pricing,  all around.',
    body: 'One predictable monthly subscription. No commissions, no cut of your sales, and no booking fees passed on to your clients.',
  },
  {
    title: 'Built for every side of the booking.',
    body: 'You run the business. Your clients book the care. PetAppro keeps everyone on the same page—with the pet at the center of it all.',
  },
  {
    title: 'Your day, without the juggling.',
    body: 'Work through each service as it happens, and PetAppro keeps your schedule up to date—so you can focus on the pets instead of piecing the day together.',
  },
  {
    title: 'Looks like your business.',
    body: 'Add your logo and choose  a theme that feels like you. Run a bigger business? You can go fully white-label with your own brand fonts and colors—and no PetAppro co-branding.',
  },
  {
    title: 'Grow without the middleman.',
    body: 'PetAppro gives you ready-to-share social media graphics with your booking link or QR code, so you can promote your business your way. Clients book directly with you—no marketplace in the middle and no cut of the sale.',
  },
];

/**
 * Correctly-sized empty placeholder for a raster the Figma CDN would not hand
 * over from this sandbox. Renders at the frame's exact box/radius/shadow so the
 * layout is right the moment Danny drops the real export in at `file`.
 * NEVER swap in a different screenshot — a wrong image is worse than a hole.
 */
export default function Base509Home() {
  return (
    <>
      {/* 1 · Hero — 1:4. Navy panel, 96px block padding, 693 / 48 / 459 row. */}
      <Section inverse id="hero">
        {/* Group 6 (94:1314): three stroked rounded rects, #CECECE @20%.
            Coordinates are Hero-frame relative; the layer is pinned to a
            1440-wide centred grid so it tracks the frame at any viewport. */}
        {/* Group 6 (94:1314) — Danny's export. 597×577, frame-relative (845, 68);
            the 507px ring runs off the 1440 canvas, so the art is pre-clipped. */}
        <div className="b509-deco b509-deco--hero" aria-hidden="true">
          <Image
            src="/brands/base509/hero-background-shapes.svg"
            alt=""
            width={597}
            height={577}
            priority={false}
          />
        </div>

        <div className="b509-hero__row">
          <div className="b509-hero__col">
            <Eyebrow>Base509 · Real needs. Good ideas. Well made.</Eyebrow>
            <UnderlineMotif />
            {/* 1:17 — Oswald Bold 60/66, break authored after "that". */}
            <h1 className="b509-h1">
              Software that
              <br />
              shows up for you.
            </h1>
            <p className="b509-hero__body">
              I started Base509 because I needed better software for my own
              business&mdash;tools that made the day easier instead of adding more to it.
            </p>
            <p className="b509-hero__body">
              Now we build straightforward, dependable apps that cut down on emails,
              texts, and everyday admin&mdash;without enterprise pricing. So you can spend
              less time managing the work and more time doing what you love.
            </p>
            <div className="b509-hero__ctas">
              <Btn href="#products" variant="cta" size="lg">See what we&rsquo;re building</Btn>
              <Btn href="#contact" variant="inverse" size="lg">Reach out to us</Btn>
            </div>
          </div>

          {/* Frame 8 (171:8019) — 459×519, contents centred.
              NOTE: the frame's second child, 171:8016 ("App screen slot",
              296.5×641), is visible:false in Figma — deliberately NOT rendered. */}
          <div className="b509-hero__art">
            <Image
              className="b509-hero__phones"
              src="/brands/base509/hero-phones.png"
              alt="Two PetAppro app screens: a booking list and a live walk map"
              width={459}
              height={519}
              priority
            />
          </div>
        </div>
      </Section>

      {/* 2 · What we build — 1:5. Head → wordmark → product → 2-col row. */}
      <Section id="products" className="b509-build">
        {/* Danny's exports. LEFT = Groups 5+4 combined, 561×420 at (120, 677).
            RIGHT = Group 3, 290×250 at (980, 478). Frame-relative coords. */}
        <div className="b509-deco b509-deco--build" aria-hidden="true">
          <Image
            className="b509-deco__left"
            src="/brands/base509/what-we-build-bg-left.svg"
            alt=""
            width={561}
            height={420}
          />
          <Image
            className="b509-deco__right"
            src="/brands/base509/what-we-build-bg-right.svg"
            alt=""
            width={290}
            height={250}
          />
        </div>

        {/* Frame 5 (62:1292) — eyebrow block + H2, 36px trailing pad. */}
        <div className="b509-build__head">
          <Eyebrow>What we build</Eyebrow>
          <UnderlineMotif />
          <h2 className="b509-h2 b509-h2--build">Thoughtful apps. Keep things moving.</h2>
        </div>

        {/* 2:313 — PetAppro wordmark, 300×72. */}
        <div className="b509-wordmark">
          <Image
            src="/brands/petappro/petappro-wordmark.svg"
            alt="PetAppro"
            width={300}
            height={72}
          />
        </div>

        {/* Frame 2 (2:333) — product name + descriptor, 8px apart. */}
        <div className="b509-product">
          <h3 className="b509-product__name">Pets at the heart. People at the helm.</h3>
          <p className="b509-product__desc">
            PetAppro brings bookings, schedules, client details, and day-to-day pet
            care together in one straightforward app for dog-care businesses of any
            size.
          </p>
        </div>

        {/* section 2-column (3:13) — 523 | 629, both vertically centred, h=782. */}
        <div className="b509-build-row">
          <div className="b509-build-row__media">
            {/* Real export is 319×662 — pass the true intrinsic size so
                next/image keeps the aspect ratio. */}
            <Image
              className="b509-appshot"
              src="/brands/petappro/petappro-book-a-service.png"
              alt="The PetAppro app: the Book a service screen, listing boarding, daycare, dog walking, and drop-in visits with starting prices"
              width={319}
              height={662}
            />
            <Btn href="https://petappro.com/" variant="secondary">Visit petappro.com</Btn>
          </div>
          <div className="b509-build-row__cards">
            <CardCarousel cards={[...FEATURE_CARDS]} ariaLabel="What PetAppro does" />
          </div>
        </div>

        {/* COPY-AUDIT §16 — required once per section that shows app screens. */}
        <p className="b509-disclaimer">
          Illustrative screens with sample content. What you see in the app varies by
          provider, plan, and theme.
        </p>
      </Section>

      {/* 3 · Who we are — 1:6. 640 | 16 | 544, CTA centred in the right cell.
          COPY DISCREPANCY: copy/base509-site-copy.md says ONE button here
          ("confirmed Danny"). Figma has two, but 120:4862 ("Reach out to us")
          is visible:false — so the frame renders one too. One button it is. */}
      <Section inverse id="about">
        <div className="b509-who-row">
          <div className="b509-who-row__text">
            <Eyebrow>Who we are</Eyebrow>
            <UnderlineMotif />
            <h2 className="b509-h2 b509-h2--sm">Thoughtfully built. Honestly run.</h2>
            <p className="b509-who__body">
              Base509 is an independent software company with a simple standard: build
              useful things, price them fairly, and be there when people need help.
            </p>
            <p className="b509-who__body">
              We care about the details, communicate plainly, and never put ourselves
              between you and the people you serve. Your business is yours. Your
              customers are yours. We&rsquo;re here to make the work a little easier.
            </p>
          </div>
          <div className="b509-who-row__cta">
            <Btn href="#products" variant="cta" size="lg">See what we&rsquo;re building</Btn>
          </div>
        </div>
      </Section>

      {/* 4 · Get in touch — 1:7. */}
      <Section id="contact">
        <Eyebrow>Get in touch</Eyebrow>
        <UnderlineMotif />
        <h2 className="b509-h2 b509-h2--sm">Reach a real person</h2>
        <p className="b509-contact__body">
          Have a question, an idea, or just want to say hello?
        </p>
        <p className="b509-contact__body">
          Reach us at <a href="mailto:support@base509.com">support@base509.com</a>. We
          read every message, and we&rsquo;ll get back to you.
        </p>
      </Section>
    </>
  );
}
