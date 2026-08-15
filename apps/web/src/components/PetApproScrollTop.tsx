'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const SCROLL_THRESHOLD_IN_VIEWPORTS = 1.5;

export function PetApproScrollTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      const y = window.scrollY;
      setVisible((wasVisible) => {
        if (y >= window.innerHeight * SCROLL_THRESHOLD_IN_VIEWPORTS) return true;
        if (y <= 0) return false;
        return wasVisible;
      });
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);
    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  return (
    <button
      className={`petappro-scroll-top${visible ? ' is-visible' : ''}`}
      type="button"
      aria-label="Scroll to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <Image
        src="/brands/petappro.com/petappro.com/scroll-to-top.svg"
        alt=""
        width={66}
        height={66}
        unoptimized
      />
    </button>
  );
}
