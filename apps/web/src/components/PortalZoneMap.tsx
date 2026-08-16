'use client';

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { TerraDraw, TerraDrawPolygonMode } from 'terra-draw';
import { TerraDrawGoogleMapsAdapter } from 'terra-draw-google-maps-adapter';
import type { ServiceZone } from '@/components/PortalZoneManager';
import { MILES_TO_METERS } from '@/lib/service-area';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function brandColors() {
  const root = document.querySelector<HTMLElement>('[data-brand="petappro"]');
  const styles = root ? getComputedStyle(root) : null;
  return {
    accent: styles?.getPropertyValue('--pa-brand-accent').trim() || '#4ca154',
    muted: styles?.getPropertyValue('--pa-brandy-800').trim() || '#16283a',
  };
}

type Suggestion = { id: string; text: string; prediction: google.maps.places.PlacePrediction };

export function PortalZoneMap({ zones, selectedZoneId, drawing, anchor, onBoundaryDrawn, onAnchorChange }: {
  zones: ServiceZone[];
  selectedZoneId: number | undefined;
  drawing: boolean;
  anchor: { lat: number; lng: number };
  onBoundaryDrawn: (boundary: [number, number][]) => void;
  onAnchorChange: (anchor: { lat: number; lng: number }, label: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const shapesRef = useRef<Array<google.maps.Circle | google.maps.Polygon>>([]);
  const drawRef = useRef<TerraDraw | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const boundaryHandlerRef = useRef(onBoundaryDrawn);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [query, setQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [checkInput, setCheckInput] = useState('');
  const [checkResult, setCheckResult] = useState('');

  boundaryHandlerRef.current = onBoundaryDrawn;

  useEffect(() => {
    if (!MAPS_KEY || !containerRef.current || mapRef.current) return;
    let cancelled = false;
    (window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => { if (!cancelled) setMapError(true); };
    setOptions({ key: MAPS_KEY, v: 'weekly' });
    importLibrary('maps').then(({ Map }) => {
      if (cancelled || !containerRef.current) return;
      const map = new Map(containerRef.current, {
        center: anchor,
        zoom: 13,
        clickableIcons: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapRef.current = map;
      markerRef.current = new google.maps.Marker({ map, position: anchor, title: 'Business address' });
      google.maps.event.addListenerOnce(map, 'projection_changed', () => {
        if (!cancelled) setMapReady(true);
      });
    }).catch(() => { if (!cancelled) setMapError(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapReady || !markerRef.current || !mapRef.current) return;
    markerRef.current.setPosition(anchor);
    mapRef.current.panTo(anchor);
  }, [anchor, mapReady]);

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
      return new google.maps.Circle({ ...style, center: zone.center ?? anchor, radius: zone.radius * MILES_TO_METERS });
    });
  }, [zones, selectedZoneId, mapReady, anchor]);

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

  useEffect(() => {
    if (!mapReady || !searchActive) return;
    const input = query.trim();
    if (input.length < 3) { setSuggestions([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const places = await importLibrary('places');
        if (!sessionTokenRef.current) sessionTokenRef.current = new places.AutocompleteSessionToken();
        const { suggestions: results } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: sessionTokenRef.current,
          locationBias: mapRef.current?.getCenter() ?? anchor,
        });
        if (cancelled) return;
        setSuggestions(results.flatMap((item) => item.placePrediction ? [{ id: item.placePrediction.placeId, text: item.placePrediction.text.text, prediction: item.placePrediction }] : []).slice(0, 5));
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, searchActive, mapReady, anchor]);

  const chooseSuggestion = async (suggestion: Suggestion) => {
    try {
      const place = suggestion.prediction.toPlace();
      await place.fetchFields({ fields: ['location', 'formattedAddress'] });
      sessionTokenRef.current = null;
      setSuggestions([]);
      setSearchActive(false);
      const location = place.location;
      if (!location) return;
      const label = place.formattedAddress ?? suggestion.text;
      setQuery(label);
      onAnchorChange({ lat: location.lat(), lng: location.lng() }, label);
    } catch {
      setSuggestions([]);
    }
  };

  const checkAddress = async () => {
    const address = checkInput.trim();
    if (!address || !mapReady) return;
    try {
      const [{ Geocoder }, geometry] = await Promise.all([importLibrary('geocoding'), importLibrary('geometry')]);
      const { results } = await new Geocoder().geocode({ address });
      const location = results[0]?.geometry.location;
      if (!location) { setCheckResult('That address couldn’t be found.'); return; }
      const inside = zones.filter((zone) => {
        if (zone.mode === 'custom' && zone.boundary && zone.boundary.length > 2) {
          const polygon = new google.maps.Polygon({ paths: zone.boundary.map(([lng, lat]) => ({ lat, lng })) });
          return geometry.poly.containsLocation(location, polygon);
        }
        const center = zone.center ?? anchor;
        return geometry.spherical.computeDistanceBetween(location, new google.maps.LatLng(center)) <= zone.radius * MILES_TO_METERS;
      }).map((zone) => zone.name);
      setCheckResult(inside.length ? `${results[0].formatted_address} is inside: ${inside.join(', ')}.` : `${results[0].formatted_address} is outside your service area.`);
    } catch {
      setCheckResult('Address check failed. Try again.');
    }
  };

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
      <div className="portal-zone-search">
        <label className="visually-hidden" htmlFor="zone-address-search">Business address</label>
        <input id="zone-address-search" type="search" placeholder="Search your business address" value={query} autoComplete="off" onFocus={() => setSearchActive(true)} onChange={(event) => { setQuery(event.target.value); setSearchActive(true); }} />
        {searchActive && suggestions.length > 0 && <ul className="portal-zone-search__list" role="listbox" aria-label="Address suggestions">
          {suggestions.map((suggestion) => <li key={suggestion.id}><button type="button" role="option" aria-selected="false" onClick={() => chooseSuggestion(suggestion)}>{suggestion.text}</button></li>)}
        </ul>}
      </div>
      <div ref={containerRef} className="portal-zone-gmap" role="application" aria-label="Service zone map" />
      {drawing && <small className="portal-zone-gmap__hint type-caption">Click the map to add boundary points; click the first point again to finish.</small>}
      <div className="portal-zone-check">
        <label className="visually-hidden" htmlFor="zone-address-check">Check a client address</label>
        <input id="zone-address-check" type="text" placeholder="Check a client address" value={checkInput} autoComplete="off" onChange={(event) => { setCheckInput(event.target.value); setCheckResult(''); }} onKeyDown={(event) => { if (event.key === 'Enter') checkAddress(); }} />
        <button className="btn btn--secondary type-button" type="button" onClick={checkAddress}>Check Coverage</button>
      </div>
      {checkResult && <p className="type-caption portal-zone-check__result" role="status">{checkResult}</p>}
    </div>
  );
}
