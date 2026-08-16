'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { PortalModal } from '@/components/PortalShell';
import { PortalZoneMap } from '@/components/PortalZoneMap';
import { buildServiceArea, saveServiceArea } from '@/lib/service-area';

const BUSINESS_ANCHOR = { lat: 37.7585, lng: -122.4233 };

export type ZoneMode = 'radius' | 'custom';
export type ServiceZone = { id: number; name: string; mode: ZoneMode; radius: number; center?: { lat: number; lng: number }; boundary?: [number, number][] };

export const INITIAL_SERVICE_ZONES: ServiceZone[] = [
  { id: 1, name: 'Mission', mode: 'custom', radius: 3, boundary: [[-122.4265, 37.7695], [-122.4068, 37.7663], [-122.4048, 37.7485], [-122.4204, 37.7472], [-122.4262, 37.7563], [-122.4265, 37.7695]] },
  { id: 2, name: 'Noe Valley', mode: 'radius', radius: 2, center: { lat: 37.7508, lng: -122.4331 } },
  { id: 3, name: 'Castro', mode: 'custom', radius: 2, boundary: [[-122.4432, 37.7672], [-122.4278, 37.7665], [-122.4264, 37.7568], [-122.4382, 37.7551], [-122.4438, 37.7601], [-122.4432, 37.7672]] },
];

export function PortalZoneManager({ open, onClose, zones, setZones }: {
  open: boolean;
  onClose: () => void;
  zones: ServiceZone[];
  setZones: Dispatch<SetStateAction<ServiceZone[]>>;
}) {
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0]?.id ?? 0);
  const [zoneName, setZoneName] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [anchor, setAnchor] = useState(BUSINESS_ANCHOR);
  const [anchorLabel, setAnchorLabel] = useState('');
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[0];

  useEffect(() => {
    if (!zones.some((zone) => zone.id === selectedZoneId)) setSelectedZoneId(zones[0]?.id ?? 0);
  }, [selectedZoneId, zones]);

  const updateSelectedZone = (patch: Partial<ServiceZone>) => {
    if (!selectedZone) return;
    setZones((items) => items.map((zone) => zone.id === selectedZone.id ? { ...zone, ...patch } : zone));
  };

  const addZone = () => {
    const name = zoneName.trim();
    if (!name || zones.some((zone) => zone.name.toLowerCase() === name.toLowerCase())) return;
    const zone = { id: Date.now(), name, mode: 'radius' as ZoneMode, radius: 2 };
    setZones((items) => [...items, zone]);
    setSelectedZoneId(zone.id);
    setZoneName('');
  };

  return (
    <PortalModal open={open} onClose={onClose} eyebrow="Business Coverage" title="Manage Service Zones" wide>
      <p className="type-body">Create and map each zone once. Service builders use this shared list to decide where a service is offered; schedules can narrow coverage by day, time, and assigned team member.</p>
      <div className="portal-map-layout portal-zone-manager">
        <div className="portal-map-controls">
          <div className="portal-zone-list" role="list" aria-label="Service zones">{zones.map((zone) => <div className={selectedZone?.id === zone.id ? 'is-active' : undefined} role="listitem" key={zone.id}><button type="button" onClick={() => { setSelectedZoneId(zone.id); setDrawing(false); }}><strong className="type-body-bold">{zone.name}</strong><span className="type-caption">{zone.mode === 'radius' ? `${zone.radius}-mile radius` : 'Custom boundary'}</span></button><button className="portal-remove-button type-caption" type="button" aria-label={`Remove ${zone.name}`} onClick={() => setZones((items) => items.filter((item) => item.id !== zone.id))}>Remove</button></div>)}</div>
          <div className="portal-inline-form portal-zone-add"><label><span className="type-label">New Zone Name</span><input value={zoneName} placeholder="e.g. Bernal Heights" onChange={(event) => setZoneName(event.target.value)} /></label><button className="btn btn--secondary type-button" type="button" onClick={addZone}>Add Zone</button></div>
          {selectedZone && <><div className="portal-segmented" role="group" aria-label="Zone boundary type"><button className={selectedZone.mode === 'radius' ? 'is-active' : undefined} type="button" aria-pressed={selectedZone.mode === 'radius'} onClick={() => { updateSelectedZone({ mode: 'radius' }); setDrawing(false); }}>Radius</button><button className={selectedZone.mode === 'custom' ? 'is-active' : undefined} type="button" aria-pressed={selectedZone.mode === 'custom'} onClick={() => updateSelectedZone({ mode: 'custom' })}>Custom Boundary</button></div>{selectedZone.mode === 'radius' ? <label><span className="type-label">Radius · {selectedZone.radius} miles</span><input type="range" min="1" max="12" value={selectedZone.radius} onChange={(event) => updateSelectedZone({ radius: Number(event.target.value) })} /></label> : <button className="btn btn--secondary type-button" type="button" onClick={() => setDrawing((current) => !current)}>{drawing ? 'Cancel Drawing' : 'Draw Boundary'}</button>}<p className="type-caption">Radius zones circle your business address; custom boundaries are drawn directly on the map.</p></>}
        </div>
        <PortalZoneMap zones={zones} selectedZoneId={selectedZone?.id} drawing={drawing} anchor={anchor} onBoundaryDrawn={(boundary) => { updateSelectedZone({ mode: 'custom', boundary }); setDrawing(false); }} onAnchorChange={(nextAnchor, label) => { setAnchor(nextAnchor); setAnchorLabel(label); }} />
      </div>
      <div className="portal-modal-actions">{anchorLabel && <span className="type-caption portal-zone-anchor-label">Anchored to {anchorLabel}</span>}<button className="btn btn--cta type-button" type="button" onClick={() => { saveServiceArea(buildServiceArea(zones, anchor)); setDrawing(false); onClose(); }}>Done</button></div>
    </PortalModal>
  );
}
