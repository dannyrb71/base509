'use client';

import Image from 'next/image';
import { useState } from 'react';
import { PortalDrawer, PortalInfo } from '@/components/PortalShell';
import type { ServiceZone } from '@/components/PortalZoneManager';

type DayKey = 'M' | 'Tu' | 'W' | 'Th' | 'F' | 'Sa' | 'Su';
type Recurrence = 'weekly' | 'once';
type SubscriptionPlan = 'solo' | 'duo' | 'crew';
type WalkWindow = {
  id: number;
  name: string;
  days: DayKey[];
  start: string;
  end: string;
  individual: boolean;
  group: boolean;
  zones: string[];
  walkers: string[];
  walkerZones: Record<string, string[]>;
  walkerDogs: Record<string, string>;
  active: boolean;
};

const DAYS: Array<[DayKey, string]> = [['M', 'Monday'], ['Tu', 'Tuesday'], ['W', 'Wednesday'], ['Th', 'Thursday'], ['F', 'Friday'], ['Sa', 'Saturday'], ['Su', 'Sunday']];
export const WALKERS = ['Morgan Lee', 'Casey Reed'];
const INITIAL_WINDOWS: WalkWindow[] = [
  { id: 1, name: 'Midday', days: ['M', 'Tu', 'W', 'Th', 'F'], start: '10:00', end: '14:00', individual: true, group: true, zones: ['Mission', 'Noe Valley', 'Castro'], walkers: [...WALKERS], walkerZones: { 'Morgan Lee': ['Mission', 'Castro'], 'Casey Reed': ['Noe Valley'] }, walkerDogs: {}, active: true },
  { id: 2, name: 'Evening', days: ['M', 'W', 'F'], start: '16:00', end: '18:30', individual: true, group: true, zones: ['Mission', 'Castro'], walkers: ['Morgan Lee'], walkerZones: { 'Morgan Lee': ['Mission', 'Castro'], 'Casey Reed': [] }, walkerDogs: { 'Morgan Lee': '6' }, active: true },
  { id: 3, name: 'Morning', days: ['M', 'Tu', 'W', 'Th', 'F'], start: '07:00', end: '09:00', individual: true, group: false, zones: ['Noe Valley'], walkers: ['Morgan Lee'], walkerZones: { 'Morgan Lee': ['Noe Valley'], 'Casey Reed': [] }, walkerDogs: { 'Morgan Lee': '4' }, active: true },
  { id: 4, name: 'Weekend Adventure', days: ['Sa'], start: '09:00', end: '12:00', individual: false, group: true, zones: ['Mission', 'Noe Valley', 'Castro'], walkers: [...WALKERS], walkerZones: { 'Morgan Lee': ['Mission', 'Castro'], 'Casey Reed': ['Noe Valley'] }, walkerDogs: {}, active: false },
];

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function formatTimeBand(start: string, end: string) {
  const startTime = formatTime(start);
  const endTime = formatTime(end);
  const startSuffix = startTime.slice(-2);
  const endSuffix = endTime.slice(-2);
  return startSuffix === endSuffix ? `${startTime.slice(0, -3)} – ${endTime}` : `${startTime} – ${endTime}`;
}

function shortDayList(days: DayKey[]) {
  return DAYS.filter(([key]) => days.includes(key)).map(([key]) => key === 'Tu' ? 'T' : key === 'Th' ? 'T' : key === 'Sa' ? 'S' : key === 'Su' ? 'S' : key).join(' · ');
}

function compactDayRange(days: DayKey[]) {
  const ordered = DAYS.map(([key]) => key).filter((key) => days.includes(key));
  if (ordered.length === 0) return 'No days';
  const indexes = ordered.map((key) => DAYS.findIndex(([dayKey]) => dayKey === key));
  const consecutive = indexes.every((value, index) => index === 0 || value === indexes[index - 1] + 1);
  if (consecutive && ordered.length > 2) return `${shortDayList([ordered[0]])}–${shortDayList([ordered[ordered.length - 1]])}`;
  return shortDayList(ordered);
}

function compactTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const displayHour = hours % 12 || 12;
  return minutes ? `${displayHour}:${String(minutes).padStart(2, '0')}` : `${displayHour}`;
}

export function PortalWalkWindows({ dogsPerWalker, walkerCapacities, walksPerDay, subscriptionPlan, zones, offering }: { dogsPerWalker: string; walkerCapacities: Record<string, string>; walksPerDay: string; subscriptionPlan: SubscriptionPlan; zones: ServiceZone[]; offering: 'Individual' | 'Group' | 'Both' }) {
  const hasTeamAssignments = subscriptionPlan !== 'solo';
  const offersBoth = offering === 'Both';
  const offersGroup = offering !== 'Individual';
  const offersIndividual = offering !== 'Group';
  const [minimumWalks, setMinimumWalks] = useState('3');
  const [windows, setWindows] = useState<WalkWindow[]>(INITIAL_WINDOWS);
  const [clientDays, setClientDays] = useState<DayKey[]>(['M', 'W', 'F']);
  const [clientWindowId, setClientWindowId] = useState(1);
  const [clientType, setClientType] = useState<'Individual' | 'Group'>('Group');
  const [recurrence, setRecurrence] = useState<Recurrence>('weekly');
  const [notice, setNotice] = useState('');
  const [expandedWindowId, setExpandedWindowId] = useState<number | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [windowsInfoOpen, setWindowsInfoOpen] = useState(false);

  const dogCapacity = Math.max(0, Number.parseInt(dogsPerWalker, 10) || 0);
  const walkCapacity = Math.max(0, Number.parseInt(walksPerDay, 10) || 0);
  const capacityFor = (window: WalkWindow, walker: string) => Math.max(0, Number.parseInt(window.walkerDogs[walker] ?? walkerCapacities[walker] ?? '', 10) || 0);
  const minimum = Math.max(0, Number.parseInt(minimumWalks, 10) || 0);
  const effectiveClientType = offersBoth ? clientType : offersGroup ? 'Group' : 'Individual';
  const selectedClientWindow = windows.find((window) => window.id === clientWindowId) ?? windows[0];
  const clientNeedsApproval = effectiveClientType === 'Group' && recurrence === 'weekly' && minimum > 0 && clientDays.length < minimum;
  const clientStep = (step: number) => offersBoth ? step + 1 : step;

  const updateWindow = (id: number, patch: Partial<WalkWindow>) => {
    setWindows((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const toggleWindowListValue = (id: number, key: 'days' | 'walkers', value: string) => {
    setWindows((items) => items.map((item) => {
      if (item.id !== id) return item;
      const values = item[key] as string[];
      return { ...item, [key]: values.includes(value) ? values.filter((itemValue) => itemValue !== value) : [...values, value] };
    }));
  };

  const toggleWindowZone = (id: number, zone: string) => {
    setWindows((items) => items.map((item) => {
      if (item.id !== id) return item;
      const selected = item.zones.includes(zone);
      const nextZones = selected ? item.zones.filter((itemZone) => itemZone !== zone) : [...item.zones, zone];
      const nextWalkerZones = selected
        ? Object.fromEntries(Object.entries(item.walkerZones).map(([walker, walkerZoneList]) => [walker, walkerZoneList.filter((itemZone) => itemZone !== zone)]))
        : item.walkerZones;
      return { ...item, zones: nextZones, walkerZones: nextWalkerZones };
    }));
  };

  const toggleWalkerZone = (id: number, walker: string, zone: string) => {
    setWindows((items) => items.map((item) => {
      if (item.id !== id) return item;
      const current = item.walkerZones[walker] ?? [];
      return { ...item, walkerZones: { ...item.walkerZones, [walker]: current.includes(zone) ? current.filter((itemZone) => itemZone !== zone) : [...current, zone] } };
    }));
  };

  const duplicateWindow = (window: WalkWindow) => {
    setWindows((items) => [...items, { ...window, id: Date.now(), name: `${window.name} Copy`, active: false, days: [...window.days], zones: [...window.zones], walkers: [...window.walkers], walkerZones: Object.fromEntries(Object.entries(window.walkerZones).map(([walker, walkerZoneList]) => [walker, [...walkerZoneList]])), walkerDogs: { ...window.walkerDogs } }]);
    setNotice(`${window.name} duplicated as a hidden window.`);
  };

  const addWindow = () => {
    const firstZone = zones[0]?.name;
    const id = Date.now();
    setWindows((items) => [...items, { id, name: 'New Walk Window', days: ['M', 'W', 'F'], start: '10:00', end: '14:00', individual: true, group: true, zones: firstZone ? [firstZone] : [], walkers: ['Morgan Lee'], walkerZones: { 'Morgan Lee': firstZone ? [firstZone] : [], 'Casey Reed': [] }, walkerDogs: {}, active: false }]);
    setExpandedWindowId(id);
    setNotice('New hidden Walk Window added.');
  };

  const toggleClientDay = (day: DayKey) => {
    setClientDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
  };

  return (
    <>
      <section className="portal-subcard" aria-label="Availability — Walk Windows">
        <div className="portal-subcard__head">
          <span className="portal-stepnum" aria-hidden="true">3</span>
          <div className="portal-subcard__title"><h3 className="type-body-bold">Availability — Walk Windows<PortalInfo open={windowsInfoOpen} onToggle={() => setWindowsInfoOpen((current) => !current)} /></h3><p className="type-caption">Clients book a window + days, never an exact time</p></div>
          <div className="portal-subcard__actions"><button className="btn btn--secondary type-button" type="button" onClick={() => setPreviewOpen(true)}>Preview Client View</button><button className="btn btn--cta type-button" type="button" onClick={addWindow}>Add Window</button></div>
        </div>
        <div className="portal-subcard__body">
          {windowsInfoOpen && <div className="portal-walk-pricing-note"><strong className="type-body-bold">How this works:</strong><p className="type-body">Clients choose a window and their days — you build the route. Capacity is enforced per window, per day, per walker. Individual and Group walks can share a window; group capacity comes from your Dogs Per Walker setting.</p></div>}

          <div className="portal-walk-rate-list portal-walk-window-list">
            {offersGroup && <article className="portal-walk-policy-row">
              <button className="portal-collapse-summary" type="button" aria-expanded={policyOpen} onClick={() => setPolicyOpen((current) => !current)}>
                <strong className="type-body-bold">Group Walk Policy</strong>
                <span className="type-body">{minimum > 0 ? `Min ${minimum} walks/week to start a recurring schedule · one-offs & approvals still allowed` : 'No weekly minimum · one-offs & approvals still allowed'}</span>
                <Image src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} />
              </button>
              {policyOpen && <>
                <div className="portal-group-walk-policy__field">
                  <label><span className="type-label">Min Walks / Week <small>(Optional)</small></span><input type="number" min="0" inputMode="numeric" value={minimumWalks} onChange={(event) => setMinimumWalks(event.target.value)} /></label>
                  <p className="type-caption">Gates <strong>starting a recurring schedule</strong> only — not every booking.</p>
                </div>
                <p className="portal-concept-note type-caption">Regulars with an active schedule can still book one-off extras. Requests below the minimum aren’t blocked — they come to you for <strong>approval</strong>, and you can always create bookings yourself.</p>
              </>}
            </article>}

            {windows.map((window) => {
              const walkerCount = window.walkers.length;
              const groupCapacity = hasTeamAssignments ? window.walkers.reduce((total, walker) => total + capacityFor(window, walker), 0) : dogCapacity;
              const zoneCapacities = hasTeamAssignments ? window.zones.map((zone) => [zone, window.walkers.filter((walker) => (window.walkerZones[walker] ?? []).includes(zone)).reduce((total, walker) => total + capacityFor(window, walker), 0)] as const) : [];
              const windowWalkCapacity = hasTeamAssignments ? walkCapacity * walkerCount : walkCapacity;
              const winIndividual = window.individual && offersIndividual;
              const winGroup = window.group && offersGroup;
              const notOffered = !winIndividual && !winGroup;
              const expanded = window.id === expandedWindowId;
              const toggleExpand = () => setExpandedWindowId(expanded ? null : window.id);
              const metaParts = [compactDayRange(window.days), `${compactTime(window.start)}–${compactTime(window.end)}`];
              if (offering === 'Individual') {
                if (winIndividual) metaParts.push(`up to ${windowWalkCapacity} walks`);
              } else {
                if (winIndividual && winGroup) metaParts.push('Individual + Group');
                if (winIndividual && !winGroup) metaParts.push('Individual only');
                if (winGroup) metaParts.push(`${groupCapacity} dogs`);
              }
              if (hasTeamAssignments) metaParts.push(`${walkerCount} ${walkerCount === 1 ? 'walker' : 'walkers'}`);
              return (
                <article className={!window.active ? 'is-disabled' : undefined} key={window.id}>
                  <div className="portal-collapse-row">
                    <button className="portal-collapse-summary" type="button" aria-expanded={expanded} onClick={toggleExpand}>
                      <strong className="type-body-bold">{window.name}</strong>
                      <span className="type-body">{metaParts.join(' · ')}</span>
                      {notOffered && window.active && <span className="portal-status portal-status--pending">Not Offered</span>}
                    </button>
                    <div className="portal-collapse-controls"><label className="portal-switch"><span className="visually-hidden">Make {window.name} bookable</span><input type="checkbox" checked={window.active} onChange={(event) => updateWindow(window.id, { active: event.target.checked })} /><i /></label><button className="portal-collapse-toggle" type="button" aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${window.name}`} onClick={toggleExpand}><Image src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} /></button></div>
                  </div>

                  {expanded && <><div className="portal-walk-window-grid">
                    <fieldset><legend className="type-label">Window Name</legend><label className="portal-walk-window-name"><span className="visually-hidden">Window Name</span><input value={window.name} onChange={(event) => updateWindow(window.id, { name: event.target.value })} /></label></fieldset>
                    <fieldset><legend className="type-label">Days</legend><div className="portal-report-periods portal-walk-window-days">{DAYS.map(([key, label]) => <button className={window.days.includes(key) ? 'is-active' : undefined} type="button" aria-pressed={window.days.includes(key)} aria-label={`${label} in ${window.name}`} key={key} onClick={() => toggleWindowListValue(window.id, 'days', key)}>{key}</button>)}</div></fieldset>
                    <fieldset><legend className="type-label">Time Band</legend><div className="portal-walk-window-time"><input type="time" aria-label={`${window.name} start time`} value={window.start} onChange={(event) => updateWindow(window.id, { start: event.target.value })} /><span className="type-caption">to</span><input type="time" aria-label={`${window.name} end time`} value={window.end} onChange={(event) => updateWindow(window.id, { end: event.target.value })} /></div><small className="type-caption">Bounds <strong>walk start</strong> — shown to clients as “between {formatTime(window.start).replace(':00', '')}–{formatTime(window.end).replace(':00', '')}”</small></fieldset>
                    {offersBoth && <fieldset><legend className="type-label">Services</legend><div className="portal-walk-window-services"><label className="portal-checkbox type-body"><input type="checkbox" checked={window.individual} onChange={(event) => updateWindow(window.id, { individual: event.target.checked })} /><span aria-hidden="true" />Individual</label><label className="portal-checkbox type-body"><input type="checkbox" checked={window.group} onChange={(event) => updateWindow(window.id, { group: event.target.checked })} /><span aria-hidden="true" />Group</label></div></fieldset>}
                    <fieldset><legend className="type-label">Zones <small>(From Zone Manager)</small></legend><div className="portal-option-list">{zones.map((zone) => <button className={`portal-chip${window.zones.includes(zone.name) ? ' is-active' : ''}`} type="button" aria-pressed={window.zones.includes(zone.name)} key={zone.id} onClick={() => toggleWindowZone(window.id, zone.name)}>{zone.name}</button>)}</div><small className="type-caption">Choose where this window is offered. Morning and afternoon windows can cover different zones.</small></fieldset>
                    {hasTeamAssignments && <fieldset className="portal-walk-window-walkers"><legend className="type-label">Walkers Assigned</legend><div className="portal-walker-assignment-list">{WALKERS.map((walker) => {
                      const assigned = window.walkers.includes(walker);
                      return <div className={assigned ? 'portal-walker-assignment is-active' : 'portal-walker-assignment'} key={walker}><label className="portal-checkbox type-body"><input type="checkbox" checked={assigned} onChange={() => toggleWindowListValue(window.id, 'walkers', walker)} /><span aria-hidden="true" />{walker}</label>{assigned && <div><label className="portal-walker-dogs"><small className="type-caption">Dogs This Window</small><input type="number" min="1" inputMode="numeric" aria-label={`Dogs per walk for ${walker} in ${window.name}`} value={window.walkerDogs[walker] ?? walkerCapacities[walker] ?? ''} onChange={(event) => updateWindow(window.id, { walkerDogs: { ...window.walkerDogs, [walker]: event.target.value } })} /></label><small className="type-caption">Coverage Zones</small><div className="portal-option-list">{window.zones.map((zone) => <button className={`portal-chip portal-chip--compact${(window.walkerZones[walker] ?? []).includes(zone) ? ' is-active' : ''}`} type="button" aria-pressed={(window.walkerZones[walker] ?? []).includes(zone)} key={zone} onClick={() => toggleWalkerZone(window.id, walker, zone)}>{zone}</button>)}</div></div>}</div>;
                    })}</div><small className="type-caption">Assignments and zone coverage apply only to this window’s days and time band.</small></fieldset>}
                  </div>

                  {notOffered ? null : offering === 'Individual'
                    ? <div className="portal-walk-pricing-note portal-walk-window-capacity"><p className="type-caption">Up to <strong>{windowWalkCapacity} walks</strong> this window — individual walks draw from Max Walks Per Day ({walksPerDay || 'not set'}).</p></div>
                    : winGroup
                      ? <div className="portal-walk-pricing-note portal-walk-window-capacity"><p className="type-caption">{!hasTeamAssignments ? <>Group capacity: <strong>{dogCapacity} dogs</strong> per day in this window.</> : <>Group capacity: {window.walkers.map((walker) => `${walker} ${capacityFor(window, walker)}`).join(' + ') || 'no walkers assigned'} = <strong>{groupCapacity} group dogs</strong> per day in this window.</>} {winIndividual && <>Individual walks draw from Max Walks Per Day ({walksPerDay || 'not set'}).</>}</p>{hasTeamAssignments && zoneCapacities.length > 0 && <p className="type-caption">Zone capacity from walker coverage: {zoneCapacities.map(([zone, capacity]) => `${zone} ${capacity}`).join(' · ')}.</p>}{!hasTeamAssignments && <p className="type-caption">Running with a team? Duo &amp; Crew assign walkers per window.</p>}</div>
                      : <div className="portal-walk-pricing-note portal-walk-window-capacity"><p className="type-caption">Individual walks draw from Max Walks Per Day ({walksPerDay || 'not set'}).</p></div>}

                  <footer><div><button className="portal-text-button type-body-bold" type="button" onClick={() => duplicateWindow(window)}>Duplicate</button><button className="portal-remove-button type-body-bold" type="button" onClick={() => setWindows((items) => items.filter((item) => item.id !== window.id))}>Remove</button></div></footer></>}
                </article>
              );
            })}
          </div>
          <p className="portal-restore-note type-caption">Rates and windows stay independent — windows never set prices, rates never set days.</p>
        </div>
      </section>

      <PortalDrawer open={previewOpen} onClose={() => setPreviewOpen(false)} eyebrow="Client App" title="What the Client Sees">
        <p className="type-body">The client never picks a clock time. They pick <strong>service → days → window → recurrence</strong>. Capacity (“spots”) is the live count for group walks in their zone. GPS tracking pays off the wide window with an “on the way” heads-up.</p>
        <div className="portal-client-walk-phone">
          <h4 className="type-title">Book {effectiveClientType} Walk</h4>
          <p className="type-caption">Buddy · Mission district</p>

          {offersBoth && <fieldset><legend className="type-label">1 · Individual or Group?</legend><div className="portal-record-tabs"><button className={clientType === 'Individual' ? 'is-active' : undefined} type="button" aria-pressed={clientType === 'Individual'} onClick={() => setClientType('Individual')}>Individual</button><button className={clientType === 'Group' ? 'is-active' : undefined} type="button" aria-pressed={clientType === 'Group'} onClick={() => setClientType('Group')}>Group</button></div></fieldset>}

          <fieldset><legend className="type-label">{clientStep(1)} · Which Days?</legend><div className="portal-report-periods portal-walk-window-days">{DAYS.map(([key, label]) => <button className={clientDays.includes(key) ? 'is-active' : undefined} type="button" aria-pressed={clientDays.includes(key)} aria-label={`Book ${label}`} key={key} onClick={() => toggleClientDay(key)}>{key}</button>)}</div></fieldset>

          <fieldset><legend className="type-label">{clientStep(2)} · Which Window?</legend><div className="portal-client-walk-options">{windows.filter((window) => window.active && ['Midday', 'Evening', 'Morning'].includes(window.name)).map((window) => {
            const acceptsType = effectiveClientType === 'Group' ? window.group && offersGroup : window.individual && offersIndividual;
            const disabled = !acceptsType;
            const selected = clientWindowId === window.id;
            const spots = window.name === 'Midday' ? '4 spots left' : window.name === 'Evening' ? '1 spot left Wed' : 'Not offered';
            return <button className={`portal-payment-choice${selected ? ' is-active' : ''}`} type="button" disabled={disabled} aria-pressed={selected} key={window.id} onClick={() => setClientWindowId(window.id)}><span className="portal-payment-choice__copy"><span><strong className="type-body-bold">{window.name}</strong></span><span className="type-caption">{disabled ? (effectiveClientType === 'Group' ? 'Individual walks only' : 'Group walks only') : `Between ${formatTimeBand(window.start, window.end)}`}</span></span>{effectiveClientType === 'Group' && <span className={`portal-status${window.name === 'Evening' ? ' portal-status--pending' : disabled ? ' portal-status--past-due' : ' portal-status--paid'}`}>{disabled ? 'Not offered' : spots}</span>}</button>;
          })}</div></fieldset>

          <fieldset><legend className="type-label">{clientStep(3)} · How Often?</legend><div className="portal-record-tabs"><button className={recurrence === 'weekly' ? 'is-active' : undefined} type="button" aria-pressed={recurrence === 'weekly'} onClick={() => setRecurrence('weekly')}>Weekly</button><button className={recurrence === 'once' ? 'is-active' : undefined} type="button" aria-pressed={recurrence === 'once'} onClick={() => setRecurrence('once')}>Just This Week</button></div></fieldset>

          {clientNeedsApproval && <p className="portal-inline-notice type-caption">Requests below the minimum aren’t blocked — they come to the provider for approval.</p>}

          <div className="portal-client-walk-trust"><div><Image src="/brands/petappro/icon-location.svg" alt="" width={24} height={24} /><p className="type-caption">Your walker will message you when they’re on the way — live GPS during the walk.</p></div><div><Image src="/brands/petappro/icon-report.svg" alt="" width={24} height={24} /><p className="type-caption"><strong>After the walk:</strong> report card with actual start &amp; end times, photos, and the route map — exact times are reported, never promised.</p></div></div>

          <button className="btn btn--cta type-button portal-client-walk-cta" type="button" disabled={clientDays.length === 0 || !selectedClientWindow} onClick={() => setNotice(`${effectiveClientType} walk request submitted.`)}>{clientDays.length === 0 ? 'Choose Days to Continue' : `Request a Spot · ${shortDayList(clientDays)} ${selectedClientWindow?.name ?? ''} — $${effectiveClientType === 'Group' ? '22' : '30'}/walk`}</button>
          <p className="type-caption">Requests confirm per your Booking Rules (24-hr notice, Meet &amp; Greet first).</p>
        </div>
        {notice && <p className="portal-inline-notice type-body" role="status">{notice}</p>}
      </PortalDrawer>

      {!previewOpen && notice && <p className="portal-inline-notice type-body" role="status">{notice}</p>}
    </>
  );
}
