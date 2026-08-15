'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';

/**
 * Compact swipeable card carousel (Revision 2 layout: app screen on one side,
 * cards carousel on the other). Scroll-snap + buttons + dots; keyboard and
 * screen-reader friendly. All cards remain in the DOM (SEO + a11y).
 */
export function CardCarousel({
  cards, ariaLabel,
}: { cards: { title: string; body: string; icon?: string }[]; ariaLabel: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(cards.length - 1, i));
    const child = el.children[clamped] as HTMLElement | undefined;
    if (child) {
      // Centre the card ourselves rather than scrollIntoView: mandatory snap
      // interrupts that mid-flight, which is what made it jump and jiggle.
      const t = el.getBoundingClientRect();
      const c = child.getBoundingClientRect();
      const target = el.scrollLeft + (c.left - t.left) - (el.clientWidth - c.width) / 2;
      const max = el.scrollWidth - el.clientWidth;
      el.scrollTo({ left: Math.max(0, Math.min(max, target)), behavior: 'smooth' });
    }
    setIndex(clamped);
  }, [cards.length]);

  const onScroll = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const t = el.getBoundingClientRect();
    const mid = t.left + t.width / 2;
    let best = 0; let bestDist = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const r = (c as HTMLElement).getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setIndex(best);
  }, []);

  return (
    <div className="carousel" role="group" aria-roledescription="carousel" aria-label={ariaLabel}>
      <div className="carousel__track" ref={track} onScroll={onScroll} tabIndex={0}>
        {cards.map((c, i) => (
          <div
            className="card carousel__card"
            key={c.title}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${cards.length}`}
          >
            <div className="carousel__card-heading">
              {c.icon && <Image src={c.icon} alt="" width={36} height={36} unoptimized />}
              <h3 className="type-title">{c.title}</h3>
            </div>
            <p className="type-body">{c.body}</p>
          </div>
        ))}
      </div>
      <div className="carousel__controls">
        <button type="button" className="carousel__btn" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous card"><Image className="pa-chevron-icon pa-chevron-icon--left" src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} /></button>
        <div className="carousel__dots">
          {cards.map((c, i) => (
            <button
              key={c.title}
              type="button"
              className={`carousel__dot${i === index ? ' is-active' : ''}`}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={() => go(i)}
              aria-label={`Go to card ${i + 1}: ${c.title}`}
              aria-current={i === index ? 'true' : undefined}
            />
          ))}
        </div>
        <button type="button" className="carousel__btn" onClick={() => go(index + 1)} disabled={index === cards.length - 1} aria-label="Next card"><Image className="pa-chevron-icon pa-chevron-icon--right" src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} /></button>
      </div>
    </div>
  );
}
