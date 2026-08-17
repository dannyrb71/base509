'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

const SLIDES = [
  {
    title: 'Clear your day as it happens',
    body: "Check off a drop-off or pick-up and that pet's card moves out of your way — so you're always looking at what's next, not everything at once.",
    image: '/brands/petappro/features-clear-day.png',
    alt: 'PetAppro schedule cards showing a completed walk, the current daycare visit, and a later drop-in',
    width: 1400,
    height: 526,
  },
  {
    title: 'Every detail, right where you need it',
    body: "Emergencies don't give notice. Contacts, care instructions, medications, and each pet's needs are a tap away — ready the moment you need them, no scrambling.",
    image: '/brands/petappro/features-bookings.png',
    alt: 'PetAppro pet card showing a client contact, medication, veterinarian, allergy, and gate code',
    width: 1250,
    height: 307,
  },
  {
    title: 'Watch your business grow',
    body: "A reporting dashboard shows your busiest days and hours, how you're trending, and when you can finally take some time for yourself.",
    image: '/brands/petappro/features-clients.png',
    alt: 'PetAppro bookings chart showing monthly growth',
    width: 1304,
    height: 544,
  },
  {
    title: 'Your data, your way',
    body: "Export anytime to your spreadsheet app or accounting software. It's your business — and your data.",
    image: '/brands/petappro/features-reports.png',
    alt: 'PetAppro invoice report with spreadsheet and accounting export options',
    width: 1240,
    height: 614,
  },
] as const;

export function FeatureSpotlightCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);

  const show = useCallback((index: number) => {
    setActive((index + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => show(active + 1), 6000);
    return () => window.clearInterval(timer);
  }, [active, paused, show]);

  return (
    <div
      className="feature-spotlight-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="PetAppro star features"
      tabIndex={0}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') show(active - 1);
        if (event.key === 'ArrowRight') show(active + 1);
      }}
      onPointerDown={(event) => {
        pointerStart.current = event.clientX;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={(event) => {
        if (pointerStart.current === null) return;
        const distance = event.clientX - pointerStart.current;
        pointerStart.current = null;
        if (Math.abs(distance) < 48) return;
        show(distance > 0 ? active - 1 : active + 1);
      }}
    >
      {/* All slides stay mounted on a translating track so changes slide
          left/right instead of hard-swapping. Motion is CSS-only, so
          prefers-reduced-motion can disable it in the stylesheet. */}
      <div className="feature-spotlight-carousel__viewport">
        <div
          className="feature-spotlight-carousel__track"
          aria-live="polite"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {SLIDES.map((item, index) => (
            <div className="feature-spotlight-carousel__slide" key={item.title} aria-hidden={index !== active}>
              <div className="feature-spotlight-carousel__image">
                <Image src={item.image} alt={item.alt} width={item.width} height={item.height} priority={index === 0} />
              </div>
              <div className="feature-spotlight-carousel__copy">
                <h2 className="type-title">{item.title}</h2>
                <p className="type-body">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="feature-spotlight-carousel__dots" aria-label="Choose a feature slide">
        {SLIDES.map((item, index) => (
          <button
            type="button"
            className={index === active ? 'is-active' : undefined}
            key={item.title}
            aria-label={`Show slide ${index + 1}: ${item.title}`}
            aria-current={index === active ? 'true' : undefined}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={() => show(index)}
          />
        ))}
      </div>
      <p className="feature-spotlight-carousel__disclaimer type-caption">Illustrative screens — sample content.</p>
    </div>
  );
}
