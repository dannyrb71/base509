'use client';

import { useEffect, useState } from 'react';

/**
 * Mobile "back to top" affordance. Appears once the page has scrolled past
 * `showAfterViewports` × the viewport height, then stays put while scrolling.
 * Lives in the brand layout, so every page in that brand gets it.
 *
 * The artwork carries its own drop shadow (the SVG has a filter baked in) —
 * do NOT add a CSS box-shadow on top or it doubles up.
 */
export function ScrollTop({
  src = '/brands/base509/scroll-to-top.svg',
  label = 'Back to top',
  showAfterViewports = 1.5,
}: { src?: string; label?: string; showAfterViewports?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * showAfterViewports);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [showAfterViewports]);

  return (
    <button
      type="button"
      className={`b509-scrolltop${show ? ' is-visible' : ''}`}
      aria-label={label}
      hidden={!show}
      onClick={(e) => {
        // Blur first: the button hides itself partway up, and losing focus on a
        // still-focused element cancels the in-flight smooth scroll.
        e.currentTarget.blur();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={63} height={59} aria-hidden="true" />
    </button>
  );
}
