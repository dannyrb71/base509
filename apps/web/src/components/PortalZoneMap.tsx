'use client';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { TerraDraw, TerraDrawPolygonMode } from 'terra-draw';
import { TerraDrawGoogleMapsAdapter } from 'terra-draw-google-maps-adapter';
import type { ServiceZone } from '@/components/PortalZoneManager';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MILES_TO_METERS = 1609.34;
const BUSINESS_ANCHOR = { lat: 37.7585, lng: -122.4233 };

function brandColors() {
  const root = document.querySelector<HTMLElement>('[data-brand="petappro"]');
  const styles = root ? getComputedStyle(root) : null;
  return {
    accent: styles?.getPropertyValue('--pa-brand-accent').trim() || '#4ca154',
    muted: styles?.getPropertyValue('--pa-brandy-800').trim() || '#16283a',
  };
}

export function PortalZoneMap({ zones, selectedZoneId, drawing, onBoundaryDrawn }: {
  zones: ServiceZone[];
  selectedZoneId: number | undefined;
  drawing: boolean;
  onBoundaryDrawn: (boundary: [number, number][]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const shapesRef = useRef<Array<google.maps.Circle | google.maps.Polygon>>([]);
  const drawRef = useRef<TerraDraw | null>(null);
  const boundaryHandlerRef = useRef(onBoundaryDrawn);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  boundaryHandlerRef.current = onBoundaryDrawn;

  useEffect(() => {
    if (!MAPS_KEY || !containerRef.current || mapRef.current) return;
    let cancelled = false;
    setOptions({ key: MAPS_KEY, v: 'weekly' });
    importLibrary('maps').then(({ Map }) => {
      if (cancelled || !containerRef.current) return;
      const map = new Map(containerRef.current, {
        center: BUSINESS_ANCHOR,
        zoom: 13,
        clickableIcons: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapRef.current = map;
      new google.maps.Marker({ map, position: BUSINESS_ANCHOR, title: 'Business address' });
      google.maps.event.addListenerOnce(map, 'projection_changed', () => {
        if (!cancelled) setMapReady(true);
      });
    }).catch(() => { if (!cancelled) setMapError(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const colors = brandColors();
    shapesRef.current.forEach((shape) => shape.setMap(null));
    shapesRef.current = zones.map((zone) => {
      const active = zone.id === selectedZoneId;
      const style = { map, strokeColor: active ? colors.accent : colors.muted, strokeWeight: active ? 3 : 2, strokeOpacity: .9, fillColor: active ? colors.accent : colors.muted, fillOpacity: active ? .22 : .1 };
      if (zone.mode === 'custom' && zone.boundary && zone.boundary.length > 2) {
        return new google.maps.Polygon({ ...style, paths: zone.boundary.map(([lng, lat]) => ({ lat, lng })) });
      }
      return new google.maps.Circle({ ...style, center: zone.center ?? BUSINESS_ANCHOR, radius: zone.radius * MILES_TO_METERS });
    });
  }, [zones, selectedZoneId, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (drawing && !drawRef.current) {
      const draw = new TerraDraw({
        adapter: new TerraDrawGoogleMapsAdapter({ lib: google.maps, map }),
        modes: [new TerraDrawPolygonMode()],
      });
      draw.start();
      draw.on('finish', (id) => {
        const feature = draw.getSnapshot().find((item) => item.id === id);
        if (feature && feature.geometry.type === 'Polygon') {
          boundaryHandlerRef.current((feature.geometry.coordinates[0] as [number, number][]).slice());
        }
        draw.clear();
        draw.setMode('static');
      });
      drawRef.current = draw;
    }
    const draw = drawRef.current;
    if (!draw) return;
    draw.setMode(drawing ? 'polygon' : 'static');
  }, [drawing, mapReady]);

  useEffect(() => () => {
    drawRef.current?.stop();
    drawRef.current = null;
    mapRef.current = null;
  }, []);

  if (!MAPS_KEY || mapError) {
    const selectedZone = zones.find((zone) => zone.id === selectedZoneId);
    return (
      <div className={`portal-service-map portal-zone-map${selectedZone?.mode === 'custom' ? ' is-custom' : ''}${drawing ? ' is-drawing' : ''}`} style={{ '--service-radius': `${selectedZone ? Math.min(78, 24 + selectedZone.radius * 4) : 40}%` } as CSSProperties} aria-label={`Map of ${selectedZone?.name ?? 'service zones'}`}>
        <i className="portal-map-road portal-map-road--one" /><i className="portal-map-road portal-map-road--two" /><i className="portal-map-road portal-map-road--three" />
        {zones.map((zone, index) => <i className={`portal-zone-coverage portal-zone-coverage--${index % 3 + 1}${zone.id === selectedZoneId ? ' is-active' : ''}`} key={zone.id} title={zone.name} />)}
        <i className="portal-map-coverage" /><span className="portal-map-pin">W</span><div className="portal-zone-map-labels">{zones.map((zone, index) => <span className={`portal-zone-label portal-zone-label--${index % 3 + 1}${zone.id === selectedZoneId ? ' is-active' : ''}`} key={zone.id}>{zone.name}</span>)}</div><small className="type-caption">{mapError ? 'The map could not load. Check the Google Maps key and connection.' : 'Live map requires a configured Google Maps key.'}</small>
      </div>
    );
  }

  return (
    <div className="portal-zone-gmap-frame">
      <div ref={containerRef} className="portal-zone-gmap" role="application" aria-label="Service zone map" />
      {drawing && <small className="portal-zone-gmap__hint type-caption">Click the map to add boundary points; click the first point again to finish.</small>}
    </div>
  );
}
