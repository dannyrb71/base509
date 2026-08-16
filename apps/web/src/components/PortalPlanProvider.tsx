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

const BREED_THEMES = ['Husky', 'Irish Setter'] as const;
const ALL_BREED_THEMES = ['Bichon Frise', 'Blue Heeler', 'Chessie'] as const;

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
      'Brandy Blue',
      ...(matrixIncludes('Breed themes', tierIndex) ? BREED_THEMES : []),
      ...(matrixIncludes('All breed themes', tierIndex) ? ALL_BREED_THEMES : []),
    ],
  };
}

const PortalPlanContext = createContext<{ planKey: string; setPlanKey: (key: string) => void; tier: Tier; entitlements: PlanEntitlements } | null>(null);

export function PortalPlanProvider({ children }: { children: ReactNode }) {
  const [planKey, setPlanKey] = useState('crew');
  const value = useMemo(() => ({
    planKey,
    setPlanKey,
    tier: TIERS.find((tier) => tier.key === planKey) ?? TIERS[3],
    entitlements: entitlementsFor(planKey),
  }), [planKey]);
  return <PortalPlanContext.Provider value={value}>{children}</PortalPlanContext.Provider>;
}

export function usePortalPlan() {
  const context = useContext(PortalPlanContext);
  if (!context) throw new Error('usePortalPlan must be used inside PortalPlanProvider');
  return context;
}
