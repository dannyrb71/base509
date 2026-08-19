/**
 * SOURCE OF TRUTH: docs/planning/pricing-tiers-and-features.md (2026-07-11;
 * theme rows amended 2026-07-18 per apps/web/copy/theme-tiers.md — locked roster;
 * annual model finalized 2026-08-19: annual = 11× monthly, "1 month free").
 * Transcribed once, verbatim — do NOT edit numbers here without updating the doc
 * (and vice versa). Draft pricing is a PLACEHOLDER to validate at the D-021 beta.
 */

export type Tier = {
  key: string; name: string; seats: string;
  monthly: number | null; annual: number | null;
  blurb: string; featured?: boolean;
};

export const TIERS: Tier[] = [
  { key: 'starter', name: 'Starter', seats: '1 user · up to 5 clients', monthly: 0, annual: null, blurb: 'Your free on-ramp — up to 5 clients, your own logo and brand, with a little “Powered by PetAppro” along for the ride.' },
  { key: 'solo', name: 'Solo', seats: '1 user', monthly: 19, annual: 209, blurb: 'For one-person outfits. Unlimited clients, plus Husky and Irish Setter themes.' },
  { key: 'duo', name: 'Duo', seats: 'up to 2 users', monthly: 39, annual: 429, blurb: 'Where in-app payments unlock — Stripe and tips included.', featured: true },
  { key: 'crew', name: 'Crew', seats: 'up to 5 users', monthly: 79, annual: 869, blurb: 'For small teams. The full theme library, GPS walk tracking, and no “Powered by PetAppro” mark.' },
  { key: 'team', name: 'Team', seats: 'up to 20 users', monthly: 149, annual: 1639, blurb: 'Your biggest team — up to 20 seats with permission-based roles.' },
  { key: 'enterprise', name: 'Enterprise', seats: '20+ users', monthly: null, annual: null, blurb: 'White-label and tenant isolation. Let’s talk.' },
];

type Cell = boolean | string;

/** Row values ordered: Starter, Solo, Duo, Crew, Team, Enterprise */
export const MATRIX: { feature: string; cells: Cell[] }[] = [
  { feature: 'Core booking (boarding, daycare, walking; in-home visits)', cells: [true, true, true, true, true, true] },
  { feature: 'Clients, pets, households, staff schedule', cells: [true, true, true, true, true, true] },
  { feature: 'Explicit-rate pricing + holiday tiers', cells: [true, true, true, true, true, true] },
  { feature: 'Report cards + check-in/out', cells: [true, true, true, true, true, true] },
  { feature: 'Manual payment tracking', cells: [true, true, true, true, true, true] },
  { feature: 'In-app payments — Stripe + tips', cells: [false, false, true, true, true, true] },
  { feature: 'Default theme — Brandy Blue (light + dark)', cells: [true, true, true, true, true, true] },
  { feature: 'Breed themes — Husky, Irish Setter', cells: [false, true, true, true, true, true] },
  { feature: 'All breed themes — + Bichon Frise, Blue Heeler, Chessie', cells: [false, false, true, true, true, true] },
  { feature: 'Full library — city themes + seasonal drops', cells: [false, false, false, true, true, true] },
  { feature: 'GPS walk tracking', cells: [false, false, false, true, true, true] },
  { feature: 'White-label / tenant isolation', cells: [false, false, false, false, false, true] },
  { feature: 'Own branding / logo', cells: [true, true, true, true, true, true] },
  { feature: 'Remove co-branding “Powered by PetAppro”', cells: [false, false, false, true, true, true] },
  { feature: 'Client cap', cells: ['5', '∞', '∞', '∞', '∞', '∞'] },
  { feature: 'Seats', cells: ['1', '1', 'up to 2', 'up to 5', 'up to 20', '20+'] },
];
