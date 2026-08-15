'use client';

import Image from 'next/image';
import { useState } from 'react';

const SCREENS = {
  provider: [
    ['/brands/petappro/download-provider-1.png', 'Provider client list'],
    ['/brands/petappro/download-provider-2.png', 'Provider roles and permissions'],
    ['/brands/petappro/download-provider-3.png', 'Provider dashboard'],
    ['/brands/petappro/download-provider-4.png', 'Provider reports'],
  ],
  client: [
    ['/brands/petappro/appscreen-5a.png', 'Client home with upcoming bookings and pet profiles'],
    ['/brands/petappro/petappro-book-a-service.png', 'Client service menu for booking pet care'],
  ],
} as const;

export function DownloadScreensTabs() {
  const [side, setSide] = useState<keyof typeof SCREENS>('provider');

  return (
    <div className="download-screen-picker">
      <div className="figma-download__tabs type-button" role="tablist" aria-label="Choose app view">
        {(['provider', 'client'] as const).map((item) => (
          <button
            type="button"
            role="tab"
            id={`download-${item}-tab`}
            aria-controls={`download-${item}-screens`}
            aria-selected={side === item}
            className={side === item ? 'is-active' : undefined}
            key={item}
            onClick={() => setSide(item)}
          >
            {item === 'provider' ? 'Provider side' : 'Client side'}
          </button>
        ))}
      </div>
      <div
        className={`figma-download__screens figma-download__screens--${side}`}
        role="tabpanel"
        id={`download-${side}-screens`}
        aria-labelledby={`download-${side}-tab`}
      >
        {SCREENS[side].map(([src, alt]) => (
          <Image key={src} src={src} alt={alt} width={804} height={1748} />
        ))}
      </div>
    </div>
  );
}
