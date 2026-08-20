'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';

const THEMES = [
  { name: 'Brandy Blue', font: 'Poppins', light: 'var(--pa-theme-brandy-light)', mid: 'var(--pa-theme-brandy-mid)', dark: 'var(--pa-theme-brandy-dark)' },
  { name: 'Bichon Frise', font: 'Source Serif 4', light: 'var(--pa-theme-bichon-light)', mid: 'var(--pa-theme-bichon-mid)', dark: 'var(--pa-theme-bichon-dark)' },
  { name: 'Blue Heeler', font: 'Roboto', light: 'var(--pa-theme-heeler-light)', mid: 'var(--pa-theme-heeler-mid)', dark: 'var(--pa-theme-heeler-dark)' },
  { name: 'Chessie', font: 'Noticia Text', light: 'var(--pa-theme-chessie-light)', mid: 'var(--pa-theme-chessie-mid)', dark: 'var(--pa-theme-chessie-dark)' },
  { name: 'Hollywoowoowood', font: 'Manrope', light: 'var(--pa-theme-hollywood-light)', mid: 'var(--pa-theme-hollywood-mid)', dark: 'var(--pa-theme-hollywood-dark)' },
  { name: 'Husky', font: 'Lexend', light: 'var(--pa-theme-husky-light)', mid: 'var(--pa-theme-husky-mid)', dark: 'var(--pa-theme-husky-dark)' },
  { name: 'Irish Setter', font: 'Nunito Sans', light: 'var(--pa-theme-setter-light)', mid: 'var(--pa-theme-setter-mid)', dark: 'var(--pa-theme-setter-dark)' },
  { name: 'Bark Avenue NY', font: 'Oswald', light: 'var(--pa-theme-bark-light)', mid: 'var(--pa-theme-bark-mid)', dark: 'var(--pa-theme-bark-dark)' },
  { name: 'San Fursisco', font: 'Arial', light: 'var(--pa-theme-fursisco-light)', mid: 'var(--pa-theme-fursisco-mid)', dark: 'var(--pa-theme-fursisco-dark)' },
  { name: 'South Bark Miami', font: 'Ubuntu', light: 'var(--pa-theme-south-light)', mid: 'var(--pa-theme-south-mid)', dark: 'var(--pa-theme-south-dark)' },
] as const;

const SERVICES = [
  ['Boarding', 'Overnight stays · Meet & Greet required'],
  ['Daycare', 'Full day of play, 7 AM – 6 PM'],
  ['Dog walking', "Solo or group · your provider's durations"],
  ['Drop-in visit', '30-min home visit · feed, potty, play'],
] as const;

type PreviewVars = CSSProperties & Record<`--preview-${string}`, string>;

export type ThemeName = (typeof THEMES)[number]['name'];
export type ThemeMode = 'light' | 'dark';

export function ThemeGallery({ initialTheme = 'Brandy Blue', initialMode = 'dark', onChange, allowedThemes, brand }: {
  initialTheme?: ThemeName;
  initialMode?: ThemeMode;
  onChange?: (theme: ThemeName, mode: ThemeMode) => void;
  allowedThemes?: readonly ThemeName[];
  /** The tenant's brand for the screen mockup (portal): uploaded logo when
   *  set, else a monogram chip — NEVER a broken image. Absent = the
   *  marketing page's sample brand. */
  brand?: { name: string; logoUrl?: string | null; monogram?: string };
} = {}) {
  const [selectedName, setSelectedName] = useState<ThemeName>(initialTheme);
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const themes = allowedThemes ? THEMES.filter((item) => allowedThemes.includes(item.name)) : THEMES;
  const theme = themes.find((item) => item.name === selectedName) ?? themes[0];
  const previewStyle: PreviewVars = {
    '--preview-light': theme.light,
    '--preview-mid': theme.mid,
    '--preview-dark': theme.dark,
    '--preview-screen': mode === 'dark'
      ? theme.dark
      : `color-mix(in srgb, ${theme.light} 20%, white)`,
    '--preview-text': mode === 'dark' ? 'var(--pa-theme-preview-dark-text)' : theme.dark,
    '--preview-card': mode === 'dark' ? 'var(--pa-theme-preview-dark-card)' : 'var(--surface-card)',
    '--preview-font': `'${theme.font}', sans-serif`,
  };

  return (
    <div className="figma-themes__gallery-layout">
      <div className="figma-themes__swatches" aria-label="Choose a theme">
        {themes.map((item) => {
          const selected = item.name === selectedName;
          return (
            <button
              type="button"
              key={item.name}
              className={selected ? 'is-selected' : undefined}
              aria-pressed={selected}
              onClick={() => { setSelectedName(item.name); onChange?.(item.name, mode); }}
            >
              <span className="theme-dot" style={{ background: item.mid }}>
                <i style={{ background: item.light }} />
              </span>
              <span className="theme-chip-copy">
                <strong className="type-body-bold">{item.name}</strong>
                <small className="type-caption">Font: {item.font}</small>
              </span>
              <span className="theme-mini-dots" aria-hidden="true">
                {[item.light, item.mid, item.dark].map((color) => <i key={color} style={{ background: color }} />)}
              </span>
            </button>
          );
        })}
      </div>

      <div className={`figma-themes__phone-preview is-${mode}`} style={previewStyle}>
        <div className="figma-themes__mode type-body" aria-label="Preview appearance">
          {(['light', 'dark'] as const).map((item) => (
            <button
              type="button"
              key={item}
              className={mode === item ? 'is-active' : undefined}
              aria-pressed={mode === item}
              onClick={() => { setMode(item); onChange?.(selectedName, item); }}
            >
              {item === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>

        <div className="theme-phone-shell">
          <div className="theme-phone-screen">
            <div className="theme-phone-brand">
              {brand ? (
                brand.logoUrl ? (
                  // Tenant logo (may be a data: URL from the upload field).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.logoUrl} alt={`${brand.name} logo`} height={32} style={{ maxHeight: 32, width: 'auto' }} />
                ) : (
                  <>
                    <span className="theme-phone-brand__monogram" aria-hidden="true">{brand.monogram ?? 'PA'}</span>
                    <strong>{brand.name}</strong>
                  </>
                )
              ) : (
                <Image src="/sample-brands/woof-wetreats/logo-horizontal.svg" alt="Woof Wetreats" width={143} height={32} />
              )}
            </div>
            <h3>Care for every pet</h3>
            <div className="theme-phone-services">
              {SERVICES.map(([name, detail]) => (
                <div className="theme-phone-service" key={name}>
                  <span><strong>{name}</strong><small>{detail}</small></span>
                  <Image className="pa-chevron-icon pa-chevron-icon--right" src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} />
                </div>
              ))}
            </div>
            <div className="theme-phone-book">Book Now</div>
          </div>
        </div>
        <p className="type-body">Previewing <strong>{theme.name}</strong> · {mode === 'light' ? 'Light' : 'Dark'}</p>
      </div>
    </div>
  );
}
