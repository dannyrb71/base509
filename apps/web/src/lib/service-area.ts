import type { ServiceZone } from '@/components/PortalZoneManager';

/**
 * Service-area geometry as plain GeoJSON — never a Google-proprietary shape,
 * so the base map stays swappable. Circles are stored as 64-segment polygon
 * rings computed spherically (no map-vendor dependency).
 */
export type ServiceAreaFeature = {
  type: 'Feature';
  geometry: { type: 'Polygon'; coordinates: [number, number][][] };
  properties: { zoneId: number; name: string; mode: 'radius' | 'custom'; radiusMiles?: number; center?: { lat: number; lng: number } };
};

export type ServiceAreaCollection = { type: 'FeatureCollection'; features: ServiceAreaFeature[] };

const EARTH_RADIUS_METERS = 6371008.8;
export const MILES_TO_METERS = 1609.34;
const DEGREES = 180 / Math.PI;
const RADIANS = Math.PI / 180;

/** Spherical circle → GeoJSON polygon ring ([lng, lat], closed). */
export function circleRing(center: { lat: number; lng: number }, radiusMiles: number, segments = 64): [number, number][] {
  const distance = (radiusMiles * MILES_TO_METERS) / EARTH_RADIUS_METERS;
  const lat = center.lat * RADIANS;
  const lng = center.lng * RADIANS;
  const ring: [number, number][] = [];
  for (let step = 0; step <= segments; step += 1) {
    const bearing = (step * 360 / segments) * RADIANS;
    const pointLat = Math.asin(Math.sin(lat) * Math.cos(distance) + Math.cos(lat) * Math.sin(distance) * Math.cos(bearing));
    const pointLng = lng + Math.atan2(
      Math.sin(bearing) * Math.sin(distance) * Math.cos(lat),
      Math.cos(distance) - Math.sin(lat) * Math.sin(pointLat),
    );
    ring.push([pointLng * DEGREES, pointLat * DEGREES]);
  }
  return ring;
}

export function buildServiceArea(zones: readonly ServiceZone[], fallbackCenter: { lat: number; lng: number }): ServiceAreaCollection {
  return {
    type: 'FeatureCollection',
    features: zones.map((zone) => {
      const center = zone.center ?? fallbackCenter;
      const ring = zone.mode === 'custom' && zone.boundary && zone.boundary.length > 2 ? [...zone.boundary] : circleRing(center, zone.radius);
      if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) ring.push([...ring[0]]);
      return {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [ring] },
        properties: { zoneId: zone.id, name: zone.name, mode: zone.mode, ...(zone.mode === 'radius' ? { radiusMiles: zone.radius, center } : {}) },
      };
    }),
  };
}

/**
 * Persistence stub — the DB foundation isn't stood up yet. Production replaces
 * this with an authorized server action upserting the FeatureCollection into
 * Supabase/PostGIS (`geography(Polygon, 4326)` via `ST_GeomFromGeoJSON`),
 * `business_id`-scoped with RLS per CFG-1.
 */
export function saveServiceArea(area: ServiceAreaCollection): ServiceAreaCollection {
  if (typeof window !== 'undefined') console.debug('[service-area] GeoJSON captured, persistence pending', area);
  return area;
}
