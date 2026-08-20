'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { MATRIX, TIERS, type Tier } from '@/data/pricing';

export type PlanEntitlements = {
  cardPayments: boolean;
  gpsTracking: boolean;
  seatLimit: number;
  walkerPlan: 'solo' | 'duo' | 'crew';
  /** undefined = full theme library. Derived from the locked pricing MATRIX rows (Danny 2026-08-15: the matrix stands; the portal conforms). */
  themeAllowlist?: readonly string[];
};

// CANONICAL theme keys (theme-tiers.md roster / DB known_theme_keys) — the
// allowlist currency is keys, never display names (petappro-themes.ts binding).
const BREED_THEMES = ['husky', 'irish_setter'] as const;
const ALL_BREED_THEMES = ['bichon_frise', 'blue_heeler', 'chessie'] as const;

function matrixIncludes(feature: string, tierIndex: number) {
  return MATRIX.find((row) => row.feature.startsWith(feature))?.cells[tierIndex] === true;
}

function entitlementsFor(planKey: string): PlanEntitlements {
  const tierIndex = Math.max(0, TIERS.findIndex((tier) => tier.key === planKey));
  const seatsCell = String(MATRIX.find((row) => row.feature === 'Seats')?.cells[tierIndex] ?? '1');
  const seatLimit = Number(seatsCell.replace(/\D/g, '')) || 1;
  return {
    cardPayments: matrixIncludes('In-app payments', tierIndex),
    gpsTracking: matrixIncludes('GPS walk tracking', tierIndex),
    seatLimit,
    walkerPlan: seatLimit <= 1 ? 'solo' : seatLimit === 2 ? 'duo' : 'crew',
    themeAllowlist: matrixIncludes('Full library', tierIndex) ? undefined : [
      'brandy_blue',
      ...(matrixIncludes('Breed themes', tierIndex) ? BREED_THEMES : []),
      ...(matrixIncludes('All breed themes', tierIndex) ? ALL_BREED_THEMES : []),
    ],
  };
}

/** The authenticated tenant this portal render is bound to (A1). */
export type PortalBusinessContext = {
  id: string;
  name: string;
  slug: string | null;
  role: 'owner' | 'admin' | 'manager' | 'staff';
  email: string;
};

const PortalPlanContext = createContext<{
  planKey: string;
  setPlanKey: (key: string) => void;
  tier: Tier;
  entitlements: PlanEntitlements;
  business: PortalBusinessContext | null;
} | null>(null);

export function PortalPlanProvider({
  children,
  initialPlanKey = 'crew',
  business = null,
  themeAllowlist,
}: {
  children: ReactNode;
  /** Real tier from the server entitlement projection (A1); 'crew' remains
   *  only the legacy demo default for unwired previews. */
  initialPlanKey?: string;
  business?: PortalBusinessContext | null;
  /** SERVER-PROJECTED effective allowlist (canonical keys; null = full
   *  library). When provided it is AUTHORITATIVE — the matrix derivation
   *  above is only the demo fallback for unwired previews (Codex item 2d:
   *  the portal must render the DB projection, not a client re-derivation
   *  that can drift from what set_business_theme will actually accept). */
  themeAllowlist?: string[] | null;
}) {
  const [planKey, setPlanKey] = useState(initialPlanKey);
  const value = useMemo(() => {
    const entitlements = entitlementsFor(planKey);
    if (themeAllowlist !== undefined) {
      entitlements.themeAllowlist = themeAllowlist ?? undefined;
    }
    return {
      planKey,
      setPlanKey,
      tier: TIERS.find((tier) => tier.key === planKey) ?? TIERS[3],
      entitlements,
      business,
    };
  }, [planKey, business, themeAllowlist]);
  return <PortalPlanContext.Provider value={value}>{children}</PortalPlanContext.Provider>;
}

export function usePortalPlan() {
  const context = useContext(PortalPlanContext);
  if (!context) throw new Error('usePortalPlan must be used inside PortalPlanProvider');
  return context;
}
