import Image from 'next/image';
import type { ReactNode } from 'react';

/**
 * The three MDX layout components authors may use in resources content
 * (Resources build spec, 2026-08-19). Anything beyond these is plain
 * Markdown — keep the authoring surface small and unbreakable.
 *
 * PetAppro inline images live in public/brands/petappro.com/resources/<slug>/…
 * so multi-domain middleware treats them as static assets. Reference them with
 * absolute public paths, e.g. src="/brands/petappro.com/resources/my-article/kennel.png".
 */

/** Single image with required alt text and an optional caption. */
export function Figure({
  src,
  alt,
  caption,
  width = 1200,
  height = 800,
  unoptimized = false,
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  unoptimized?: boolean;
}) {
  if (!alt) {
    // alt is required by the spec; fail loudly at build (static generation)
    // instead of shipping an inaccessible image.
    throw new Error(`<Figure src="${src}"> requires alt text`);
  }
  return (
    <figure className="res-figure">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(max-width: 760px) 100vw, 720px"
        unoptimized={unoptimized || src.endsWith('.svg')}
      />
      {caption && <figcaption className="type-caption">{caption}</figcaption>}
    </figure>
  );
}

/** Two Figures side by side; stacks on mobile (CSS .res-imagerow). */
export function ImageRow({ children }: { children: ReactNode }) {
  return <div className="res-imagerow">{children}</div>;
}

/** Highlighted aside — brandy-50 background, camo left border. */
export function Callout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="res-callout">
      {title && <p className="res-callout__title type-body-bold">{title}</p>}
      <div className="res-callout__body">{children}</div>
    </aside>
  );
}

/** Component map handed to MDXRemote for every article/guide body. */
export const resourceMdxComponents = { Figure, ImageRow, Callout };
