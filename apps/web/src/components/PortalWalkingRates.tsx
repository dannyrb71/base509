'use client';

import Image from 'next/image';
import { useState } from 'react';
import { PortalInfo } from '@/components/PortalShell';
import { PortalWalkWindows, WALKERS } from '@/components/PortalWalkWindows';
import type { ServiceZone } from '@/components/PortalZoneManager';

type WalkType = 'Individual' | 'Group';
type WalkOffering = WalkType | 'Both';
type WalkRate = {
  id: number;
  type: WalkType;
  duration: string;
  price: string;
  holidayPrice: string;
  extraDog: string;
  capacity: string;
  enabled: boolean;
};

const INITIAL_RATES: WalkRate[] = [
  { id: 1, type: 'Individual', duration: '30', price: '30', holidayPrice: '38', extraDog: '10', capacity: '1', enabled: true },
  { id: 2, type: 'Individual', duration: '60', price: '50', holidayPrice: '62', extraDog: '15', capacity: '1', enabled: true },
  { id: 3, type: 'Group', duration: '30', price: '22', holidayPrice: '28', extraDog: '8', capacity: '6', enabled: true },
  { id: 4, type: 'Group', duration: '60', price: '35', holidayPrice: '44', extraDog: '12', capacity: '6', enabled: true },
];

const PREFERENCES = [
  ['meetGreet', 'Require Meet & Greet'],
  ['recurring', 'Offer Recurring Walks'],
  ['serviceArea', 'Use Business Service Area'],
  ['gps', 'GPS Route Tracking'],
] as const;

export function PortalWalkingRates({ dogsPerWalker, onDogsPerWalkerChange, walksPerDay, onWalksPerDayChange, subscriptionPlan, zones, onManageZones }: {
  dogsPerWalker: string;
  onDogsPerWalkerChange: (value: string) => void;
  walksPerDay: string;
  onWalksPerDayChange: (value: string) => void;
  subscriptionPlan: 'solo' | 'duo' | 'crew';
  zones: ServiceZone[];
  onManageZones: () => void;
}) {
  const [walkingEnabled, setWalkingEnabled] = useState(true);
  const [offering, setOffering] = useState<WalkOffering>('Both');
  const [rates, setRates] = useState<WalkRate[]>(INITIAL_RATES);
  const [travelBuffer, setTravelBuffer] = useState('15');
  const [preferences, setPreferences] = useState({ meetGreet: true, recurring: true, serviceArea: true, gps: true });
  const [notice, setNotice] = useState('');
  const [expandedRateId, setExpandedRateId] = useState<number | null>(null);
  const [pricingInfoOpen, setPricingInfoOpen] = useState(false);
  const [walkerCapacities, setWalkerCapacities] = useState<Record<string, string>>({ 'Morgan Lee': '6', 'Casey Reed': '4' });

  const hasTeam = subscriptionPlan !== 'solo';
  const offersBoth = offering === 'Both';
  const offersGroup = offering !== 'Individual';
  const visibleRates = rates.filter((rate) => offersBoth || rate.type === offering);
  const hiddenRateCount = rates.length - visibleRates.length;
  const restoreNotice = offering === 'Individual'
    ? `${hiddenRateCount > 0 ? `${hiddenRateCount} Group rate${hiddenRateCount === 1 ? '' : 's'} and ` : ''}1 policy hidden — restored if you re-enable Group.`
    : offering === 'Group' && hiddenRateCount > 0
      ? `${hiddenRateCount} Individual rate${hiddenRateCount === 1 ? '' : 's'} hidden — restored if you re-enable Individual.`
      : '';

  const updateRate = (id: number, patch: Partial<WalkRate>) => setRates((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  const duplicateRate = (rate: WalkRate) => setRates((items) => [...items, { ...rate, id: Date.now(), duration: rate.duration, enabled: false }]);
  const addRateOption = () => {
    const type: WalkType = offering === 'Group' ? 'Group' : 'Individual';
    const id = Date.now();
    setRates((items) => [...items, { id, type, duration: '30', price: '', holidayPrice: '', extraDog: '', capacity: type === 'Group' ? dogsPerWalker : '1', enabled: false }]);
    setExpandedRateId(id);
    setNotice('New hidden rate option added.');
  };

  const eqRate = offersGroup ? '30-min Group · $22/dog' : '30-min Individual · $30';
  const eqWindow = offersGroup ? 'Midday · M–F · 10–2 · 12 dogs' : 'Midday · M–F · 10–2';
  const eqResult = offersGroup ? '“Group 30-min · Midday M/W/F · $22”' : '“Individual 30-min · Midday M/W/F · $30”';

  return (
    <div className="portal-walking-editor">
      <section className="portal-subcard" aria-label="Service Basics">
        <div className="portal-subcard__head">
          <span className="portal-stepnum" aria-hidden="true">1</span>
          <div className="portal-subcard__title"><h3 className="type-body-bold">Service Basics</h3><p className="type-caption">What you offer and how you operate — set once, rarely touched</p></div>
          <div className="portal-subcard__actions"><label className="portal-switch portal-switch--labeled"><span className="type-body-bold">Service Active</span><input type="checkbox" checked={walkingEnabled} onChange={(event) => setWalkingEnabled(event.target.checked)} /><i /></label></div>
        </div>
        <div className={walkingEnabled ? 'portal-subcard__body' : 'portal-subcard__body is-disabled'} inert={!walkingEnabled}>
          <fieldset className="portal-walk-offering">
            <legend className="visually-hidden">Which Walk Types Do You Offer?</legend>
            <div role="radiogroup" aria-label="Walk types offered">{(['Individual', 'Group', 'Both'] as WalkOffering[]).map((option) => <label className={offering === option ? 'is-active' : undefined} key={option}><input type="radio" name="walk-offering" value={option} checked={offering === option} onChange={() => setOffering(option)} /><span className="type-body-bold">{option}</span><small className="type-caption">{option === 'Individual' ? 'One household per slot' : option === 'Group' ? 'Multiple households share a slot' : 'Clients choose at booking'}</small></label>)}</div>
          </fieldset>

          <div className="portal-walk-settings">
            <label><span>Service Location</span><select defaultValue="at-client"><option value="at-client">At Client Location</option><option value="either">Client or Provider Area</option></select></label>
            <label><span>Service Zones</span><button className="portal-service-area-trigger" type="button" onClick={onManageZones}><span>{zones.length} Walking Zones</span><Image src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} /></button><small>Zones are managed per service.</small></label>
            {offersGroup && !hasTeam && <label><span>Dogs Per Walk</span><input type="number" min="1" inputMode="numeric" value={dogsPerWalker} onChange={(event) => onDogsPerWalkerChange(event.target.value)} /><small>How many dogs you take on one group walk.</small></label>}
            {offersGroup && hasTeam && WALKERS.map((walker) => <label key={walker}><span>Dogs Per Walk · {walker}</span><input type="number" min="1" inputMode="numeric" value={walkerCapacities[walker] ?? ''} onChange={(event) => setWalkerCapacities((current) => ({ ...current, [walker]: event.target.value }))} /><small>Default for {walker} — adjustable per window next to their name in Availability.</small></label>)}
            <label><span>Travel Buffer</span><span className="portal-input-suffix"><input type="number" min="0" inputMode="numeric" value={travelBuffer} onChange={(event) => setTravelBuffer(event.target.value)} /><b>min</b></span></label>
            <label><span>Max Walks Per Day / Walker <small>(Optional)</small></span><input type="number" min="1" inputMode="numeric" value={walksPerDay} onChange={(event) => onWalksPerDayChange(event.target.value)} /></label>
          </div>

          <div className="portal-option-list">
            {PREFERENCES.map(([key, label]) => <button className={`portal-chip${preferences[key] ? ' is-active' : ''}`} type="button" aria-pressed={preferences[key]} key={key} onClick={() => setPreferences((current) => ({ ...current, [key]: !current[key] }))}>{preferences[key] ? '✓ ' : ''}{label}{key === 'gps' && <small className="portal-status">Crew+</small>}</button>)}
          </div>
        </div>
      </section>

      <div className={walkingEnabled ? 'portal-walking-body' : 'portal-walking-body is-disabled'} inert={!walkingEnabled}>
        <div className="portal-eq" aria-label="How rates and windows combine">
          <div className="portal-eq__box">
            <span className="type-label">② Rates — what a walk costs</span>
            <p className="type-caption">Durations &amp; prices. No days or times here.</p>
            <p className="portal-eq__example type-caption">{eqRate}</p>
          </div>
          <span className="portal-eq__op" aria-hidden="true">×</span>
          <div className="portal-eq__box">
            <span className="type-label">③ Windows — when walks happen</span>
            <p className="type-caption">Days, time bands &amp; capacity. No prices here.</p>
            <p className="portal-eq__example type-caption">{eqWindow}</p>
          </div>
          <span className="portal-eq__op" aria-hidden="true">=</span>
          <div className="portal-eq__box portal-eq__box--result">
            <span className="type-label">What clients can book</span>
            <p className="type-caption">Every rate is offered in every window that accepts its walk type.</p>
            <p className="portal-eq__example type-caption">{eqResult}</p>
          </div>
        </div>

        <section className="portal-subcard" aria-label="Pricing — Walking Rate Options">
          <div className="portal-subcard__head">
            <span className="portal-stepnum" aria-hidden="true">2</span>
            <div className="portal-subcard__title"><h3 className="type-body-bold">Pricing — Walking Rate Options<PortalInfo open={pricingInfoOpen} onToggle={() => setPricingInfoOpen((current) => !current)} /></h3><p className="type-caption">Each duration priced independently</p></div>
            <div className="portal-subcard__actions"><button className="btn btn--cta type-button" type="button" onClick={addRateOption}>Add Rate Option</button></div>
          </div>
          <div className="portal-subcard__body">
            {pricingInfoOpen && <div className="portal-walk-pricing-note"><strong className="type-body-bold">Pricing and capacity stay separate.</strong><p className="type-body">Each duration has its own fixed price. Individual walks cover one household; Extra Dog applies to additional dogs from that household. Group capacity controls how many dogs can share a slot and is enforced by scheduling—not added into the price.</p></div>}
            <div className="portal-walk-rate-list">
              {visibleRates.map((rate) => {
                const expanded = rate.id === expandedRateId;
                const toggleExpand = () => setExpandedRateId(expanded ? null : rate.id);
                return <article className={!rate.enabled ? 'is-disabled' : undefined} key={rate.id}>
                  <div className="portal-collapse-row">
                    <button className="portal-collapse-summary" type="button" aria-expanded={expanded} onClick={toggleExpand}>
                      <strong className="type-body-bold">{rate.type} · {rate.duration} min</strong>
                      <span className="type-body">${rate.price || '0'}{rate.type === 'Group' ? '/dog' : ''}{rate.extraDog ? ` · +$${rate.extraDog} extra dog` : ''}{rate.type === 'Group' ? (hasTeam ? '' : ` · ${dogsPerWalker || '—'} dogs/walk`) : ' · 1 household'}</span>
                    </button>
                    <div className="portal-collapse-controls"><label className="portal-switch"><span className="visually-hidden">Make {rate.type} {rate.duration}-minute walk bookable</span><input type="checkbox" checked={rate.enabled} onChange={(event) => updateRate(rate.id, { enabled: event.target.checked })} /><i /></label><button className="portal-collapse-toggle" type="button" aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${rate.type} ${rate.duration}-minute walk`} onClick={toggleExpand}><Image src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} /></button></div>
                  </div>
                  {expanded && <><div className="portal-walk-rate-fields">
                    {offersBoth && <label><span>Walk Type</span><select value={rate.type} onChange={(event) => updateRate(rate.id, { type: event.target.value as WalkType, capacity: event.target.value === 'Group' ? dogsPerWalker : '1' })}><option>Individual</option><option>Group</option></select></label>}
                    <label><span>Duration</span><span className="portal-input-suffix"><input type="number" min="1" inputMode="numeric" value={rate.duration} onChange={(event) => updateRate(rate.id, { duration: event.target.value })} /><b>min</b></span></label>
                    <label><span>{rate.type === 'Group' ? 'Rate / Dog' : 'Base Rate'}</span><span className="portal-price-input"><b>$</b><input inputMode="decimal" value={rate.price} onChange={(event) => updateRate(rate.id, { price: event.target.value })} /></span></label>
                    <label><span>Holiday Rate</span><span className="portal-price-input"><b>$</b><input inputMode="decimal" value={rate.holidayPrice} onChange={(event) => updateRate(rate.id, { holidayPrice: event.target.value })} /></span></label>
                    <label><span>Extra Dog <small>(Optional)</small></span><span className="portal-price-input"><b>$</b><input inputMode="decimal" value={rate.extraDog} onChange={(event) => updateRate(rate.id, { extraDog: event.target.value })} /></span></label>
                    {rate.type === 'Group' && !hasTeam && <label><span>Dogs / Walk</span><input value={`${dogsPerWalker || '—'} dogs`} disabled /></label>}
                    {rate.type !== 'Group' && offersBoth && <label><span>Capacity</span><input value="1 household" disabled /></label>}
                  </div>
                  <footer><div><button className="portal-text-button type-body-bold" type="button" onClick={() => duplicateRate(rate)}>Duplicate</button><button className="portal-remove-button type-body-bold" type="button" onClick={() => setRates((items) => items.filter((item) => item.id !== rate.id))}>Remove</button></div></footer></>}
                </article>;
              })}
            </div>
            {visibleRates.length === 0 && <p className="portal-empty-state type-body">No {offering} rate options yet. Add the first one to make this walk type bookable.</p>}
            {restoreNotice && <p className="portal-restore-note type-caption">{restoreNotice}</p>}
          </div>
        </section>

        <PortalWalkWindows dogsPerWalker={dogsPerWalker} walkerCapacities={walkerCapacities} walksPerDay={walksPerDay} subscriptionPlan={subscriptionPlan} zones={zones} offering={offering} />
      </div>

      {notice && <p className="portal-inline-notice type-body" role="status">{notice}</p>}
    </div>
  );
}
