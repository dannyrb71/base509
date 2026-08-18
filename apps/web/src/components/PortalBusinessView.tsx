'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { usePortalPlan } from '@/components/PortalPlanProvider';
import { CapacityField, PortalInfo, PortalModal, PortalPageHeader, PortalPanel } from '@/components/PortalShell';
import { PortalWalkingRates } from '@/components/PortalWalkingRates';
import { INITIAL_SERVICE_ZONES, PortalZoneManager } from '@/components/PortalZoneManager';
import { ThemeGallery, type ThemeMode, type ThemeName } from '@/components/ThemeGallery';

type Service = { name: string; enabled: boolean; price: string; holidayPrice: string; extraDog: string; extendedDiscount?: string; unit: string; note: string };
type ServiceTab = 'boarding-daycare' | 'walking';
type BusinessTab = 'profile' | 'services' | 'booking' | 'team';
type Role = 'Owner' | 'Admin' | 'Staff';
type Permission = 'Bookings' | 'Billing' | 'Clients';
type Staff = { id: number; name: string; email: string; role: Role };

const BUSINESS_TABS: Array<[BusinessTab, string]> = [
  ['profile', 'Profile & Brand'],
  ['services', 'Services & Pricing'],
  ['booking', 'Booking Rules'],
  ['team', 'Team'],
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Owner: ['Bookings', 'Billing', 'Clients'],
  Admin: ['Bookings', 'Billing', 'Clients'],
  Staff: ['Bookings', 'Clients'],
};

function initialsFor(name: string) {
  const names = name.trim().split(/\s+/).filter(Boolean);
  if (names.length === 0) return 'PA';
  return names.slice(0, 2).map((item) => item.charAt(0).toUpperCase()).join('');
}

export function PortalBusinessView() {
  const [businessName, setBusinessName] = useState('Woof Wetreats');
  const [logo, setLogo] = useState<string>('');
  const [theme, setTheme] = useState<ThemeName>('Husky');
  const [mode, setMode] = useState<ThemeMode>('light');
  const [themeOpen, setThemeOpen] = useState(false);
  const [zoneManagerOpen, setZoneManagerOpen] = useState(false);
  const [zones, setZones] = useState(INITIAL_SERVICE_ZONES);
  const [notice, setNotice] = useState('');
  const [businessTab, setBusinessTab] = useState<BusinessTab>('profile');
  const [serviceTab, setServiceTab] = useState<ServiceTab>('boarding-daycare');
  const [puppySurchargeEnabled, setPuppySurchargeEnabled] = useState(true);
  const [puppySurcharge, setPuppySurcharge] = useState('10');
  const [puppyServices, setPuppyServices] = useState({ boarding: true, daycare: true, walking: false });
  const [surchargesOpen, setSurchargesOpen] = useState(false);
  const [dogsPerWalker, setDogsPerWalker] = useState('6');
  const [walksPerDay, setWalksPerDay] = useState('6');
  /* D-075 occupancy capacity: required per-service limit; shared location
     pool is an extra ceiling only when boarding + daycare share the home. */
  const [boardingCapacity, setBoardingCapacity] = useState('6');
  const [daycareCapacity, setDaycareCapacity] = useState('8');
  const [locationPoolEnabled, setLocationPoolEnabled] = useState(true);
  const [locationCapacity, setLocationCapacity] = useState('10');
  const [capacityInfoOpen, setCapacityInfoOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([
    { name: 'Boarding', enabled: true, price: '60', holidayPrice: '75', extraDog: '25', extendedDiscount: '5', unit: 'per night', note: 'Meet & Greet required' },
    { name: 'Daycare', enabled: true, price: '40', holidayPrice: '50', extraDog: '18', unit: 'per day', note: '' },
  ]);
  const [staff, setStaff] = useState<Staff[]>([
    { id: 1, name: 'Danny Baker', email: 'danny@example.com', role: 'Owner' },
    { id: 2, name: 'Avery Jones', email: 'avery@example.com', role: 'Admin' },
    { id: 3, name: 'Morgan Lee', email: 'morgan@example.com', role: 'Staff' },
    { id: 4, name: 'Casey Reed', email: 'casey@example.com', role: 'Staff' },
  ]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const { tier, entitlements } = usePortalPlan();
  const seatLimit = entitlements.seatLimit;
  const subscriptionPlan = entitlements.walkerPlan;
  const initials = initialsFor(businessName);

  const updateService = (index: number, patch: Partial<Service>) => setServices((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const boardingOn = services.find((item) => item.name === 'Boarding')?.enabled ?? false;
  const daycareOn = services.find((item) => item.name === 'Daycare')?.enabled ?? false;
  const boardingCap = Math.max(1, parseInt(boardingCapacity, 10) || 1);
  const daycareCap = Math.max(1, parseInt(daycareCapacity, 10) || 1);
  const locationCap = Math.max(1, parseInt(locationCapacity, 10) || 1);
  const addStaff = () => {
    if (staff.length >= seatLimit) { setNotice(`No seats remain on ${tier.name}. Upgrade to add another staff member.`); return; }
    if (!newStaffName || !newStaffEmail) { setNotice('Enter a staff name and email first.'); return; }
    setStaff((items) => [...items, { id: Date.now(), name: newStaffName, email: newStaffEmail, role: 'Staff' }]);
    setNewStaffName(''); setNewStaffEmail(''); setNotice('Staff invitation sent.');
  };

  return (
    <div className="portal-page">
      <PortalPageHeader eyebrow="Business" title="Business Settings" body="Manage the identity, client-app appearance, service menu, pricing rules, booking policies, service area, and team structure clients rely on." />

      <div className="portal-service-tabs" role="tablist" aria-label="Business Settings sections">
        {BUSINESS_TABS.map(([key, label]) => <button className={businessTab === key ? 'is-active' : undefined} type="button" role="tab" aria-selected={businessTab === key} key={key} onClick={() => setBusinessTab(key)}>{label}</button>)}
      </div>

      {businessTab === 'profile' && <div className="portal-business-tab-panel" role="tabpanel">
      <div className="portal-settings-grid">
        <PortalPanel title="Business Profile" eyebrow="Identity">
          <div className="portal-logo-upload">
            <div className="portal-logo-upload__preview">{logo ? <Image src={logo} alt="Uploaded business logo preview" width={96} height={96} unoptimized /> : <span className="type-title">{initials}</span>}</div>
            <div><strong className="type-body-bold">Business Logo</strong><p className="type-caption">Without a logo, initials update automatically from the first two words in the business name.</p><label className="btn btn--cta type-button" htmlFor="portal-logo-upload">Upload Logo</label><input id="portal-logo-upload" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setLogo(String(reader.result)); reader.readAsDataURL(file); }} /></div>
          </div>
          <div className="portal-field-grid">
            <label className="type-body"><span>Business Name</span><input value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></label>
            <label className="type-body"><span>Support Email</span><input type="email" defaultValue="hello@woofwetreats.example" /></label>
            <label className="type-body"><span>Service Area</span><button className="portal-service-area-trigger" type="button" onClick={() => setZoneManagerOpen(true)}><span>San Francisco · {zones.length} Service Zones</span><Image src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} /></button></label>
            <label className="type-body"><span>Time Zone</span><select defaultValue="America/Los_Angeles"><option>America/Los_Angeles</option><option>America/Denver</option><option>America/Chicago</option><option>America/New_York</option></select></label>
          </div>
        </PortalPanel>

        <PortalPanel title="Brand Appearance" eyebrow="Client app" action={<button className="portal-text-button type-body-bold" type="button" onClick={() => setThemeOpen(true)}>Choose Theme</button>}>
          <div className={`portal-brand-preview portal-brand-preview--${mode}`}><span className="portal-brand-preview__mark">{logo ? <Image src={logo} alt="" width={48} height={48} unoptimized /> : initials}</span><div><strong className="type-title">{businessName || 'Your Business'}</strong><p className="type-caption">{theme} · {mode === 'light' ? 'Light' : 'Dark'}</p></div></div>
          <p className="type-body">This uses the same live theme picker as the PetAppro Themes page.</p>
        </PortalPanel>
      </div>
      <div className="portal-tab-save"><button className="btn btn--cta type-button" type="button" onClick={() => setNotice('Profile & Brand saved.')}>Save Profile &amp; Brand</button></div>
      </div>}

      {businessTab === 'services' && <div className="portal-business-tab-panel" role="tabpanel">
      <PortalPanel title="Services & Pricing" eyebrow="Editable service menu">
        <div className="portal-service-tabs" role="tablist" aria-label="Service families">
          <button className={serviceTab === 'boarding-daycare' ? 'is-active' : undefined} type="button" role="tab" aria-selected={serviceTab === 'boarding-daycare'} onClick={() => setServiceTab('boarding-daycare')}>Boarding &amp; Daycare</button>
          <button className={serviceTab === 'walking' ? 'is-active' : undefined} type="button" role="tab" aria-selected={serviceTab === 'walking'} onClick={() => setServiceTab('walking')}>Dog Walking</button>
          <button type="button" role="tab" aria-selected="false" aria-label="In-Home — Drop-In Visits and In-Home Sitting, coming soon" disabled><span>In-Home</span><small>Soon</small></button>
          <button type="button" role="tab" aria-selected="false" disabled><span>Training</span><small>Soon</small></button>
          <button type="button" role="tab" aria-selected="false" disabled><span>Grooming</span><small>Soon</small></button>
        </div>

        {serviceTab === 'boarding-daycare' && <div role="tabpanel">
          <div className="portal-service-editor-grid portal-service-editor-grid--two">
          {services.map((service, index) => (
            <article className={service.enabled ? undefined : 'is-inactive'} key={service.name}>
              <div className="portal-service-editor__heading"><strong className="type-title">{service.name}</strong><label className="portal-switch"><span className="visually-hidden">Enable {service.name}</span><input type="checkbox" checked={service.enabled} onChange={(event) => updateService(index, { enabled: event.target.checked })} /><i /></label></div>
              {service.name === 'Boarding'
                ? <CapacityField label="Capacity" ariaLabel="Boarding Capacity" hint="Dogs per night — a dog counts on arrival and each overnight, not pickup day." value={boardingCapacity} onChange={setBoardingCapacity} disabled={!service.enabled} />
                : <CapacityField label="Capacity" ariaLabel="Daycare Capacity" hint="Dogs per day." value={daycareCapacity} onChange={setDaycareCapacity} disabled={!service.enabled} />}
              <label className="type-body"><span>Base Price</span><span className="portal-price-input"><b>$</b><input inputMode="decimal" value={service.price} disabled={!service.enabled} onChange={(event) => updateService(index, { price: event.target.value })} /></span></label>
              <label className="type-body"><span>Holiday Price</span><span className="portal-price-input"><b>$</b><input inputMode="decimal" value={service.holidayPrice} disabled={!service.enabled} onChange={(event) => updateService(index, { holidayPrice: event.target.value })} /></span><small className="type-caption">Applied {service.name === 'Boarding' ? 'per holiday night' : 'per holiday day'} selected in Availability.</small></label>
              <label className="type-body"><span>Extra Dog Rate <small>(Optional)</small></span><span className="portal-price-input"><b>$</b><input inputMode="decimal" value={service.extraDog} disabled={!service.enabled} onChange={(event) => updateService(index, { extraDog: event.target.value })} /></span></label>
              {service.name === 'Boarding' && <label className="type-body"><span>Extended Rate Discount <small>(Optional)</small></span><span className="portal-price-input"><b>$</b><input inputMode="decimal" value={service.extendedDiscount} disabled={!service.enabled} onChange={(event) => updateService(index, { extendedDiscount: event.target.value })} /></span><small className="type-caption">Discount per night for stays of 8+ days.</small></label>}
              <span className="type-caption">{service.unit}{service.note && <> · {service.note}</>}</span>
            </article>
          ))}

          {boardingOn && daycareOn && <article className={locationPoolEnabled ? 'portal-capacity-card' : 'portal-capacity-card is-inactive'} aria-label="Shared Total Capacity">
            <div className="portal-service-editor__heading"><strong className="type-title">Shared Total Capacity<PortalInfo open={capacityInfoOpen} onToggle={() => setCapacityInfoOpen((current) => !current)} /></strong><label className="portal-switch"><span className="visually-hidden">Enable Shared Total Capacity</span><input type="checkbox" checked={locationPoolEnabled} onChange={(event) => setLocationPoolEnabled(event.target.checked)} /><i /></label></div>
            {capacityInfoOpen && <div className="portal-walk-pricing-note"><strong className="type-body-bold">How this works:</strong><p className="type-body">A dog counts against capacity on its arrival day and each overnight — never on pickup day. Boarding and Daycare use the same day-by-day count, and with Shared Total Capacity on they also count against this one ceiling for your home — the lower limit always wins.</p></div>}
            <CapacityField label="Total Dogs On Site" ariaLabel="Shared Total Capacity" hint="Boarding and Daycare together never exceed this on the same day." value={locationCapacity} onChange={setLocationCapacity} disabled={!locationPoolEnabled} />
            <div className="portal-walk-pricing-note portal-walk-window-capacity">
              <p className="type-caption">
                {locationPoolEnabled
                  ? <>Boarding up to {boardingCap} + Daycare up to {daycareCap} = {boardingCap + daycareCap} by service caps — but never more than <strong>{locationCap} dogs on site</strong> on any day.</>
                  : <>Boarding up to <strong>{boardingCap} dogs</strong> per night · Daycare up to <strong>{daycareCap} dogs</strong> per day, counted independently.</>}
              </p>
            </div>
          </article>}
          </div>
        </div>}

        {serviceTab === 'walking' && <div className="portal-walking-tab" role="tabpanel"><PortalWalkingRates dogsPerWalker={dogsPerWalker} onDogsPerWalkerChange={setDogsPerWalker} walksPerDay={walksPerDay} onWalksPerDayChange={setWalksPerDay} subscriptionPlan={subscriptionPlan} zones={zones} onManageZones={() => setZoneManagerOpen(true)} /></div>}

        <section className="portal-subcard portal-subcard--plain">
          <div className="portal-subcard__head">
            <span className="portal-stepnum portal-stepnum--muted" aria-hidden="true">＋</span>
            <div className="portal-subcard__title"><h3 className="type-body-bold">Service Surcharges</h3><p className="type-caption">Puppy Handling · ${puppySurcharge || '0'}{(() => { const applied = ([['boarding', 'Boarding'], ['daycare', 'Daycare'], ['walking', 'Dog Walking']] as const).filter(([key]) => puppyServices[key]).map(([, label]) => label); return applied.length ? ` · ${applied.length > 2 ? `${applied.slice(0, -1).join(', ')} & ${applied[applied.length - 1]}` : applied.join(' & ')}` : ''; })()}</p></div>
            <div className="portal-subcard__actions"><label className="portal-switch"><span className="visually-hidden">Enable Puppy Handling Surcharge</span><input type="checkbox" checked={puppySurchargeEnabled} onChange={(event) => setPuppySurchargeEnabled(event.target.checked)} /><i /></label><button className="portal-collapse-toggle" type="button" aria-expanded={surchargesOpen} aria-label={`${surchargesOpen ? 'Collapse' : 'Expand'} Service Surcharges`} onClick={() => setSurchargesOpen((current) => !current)}><Image src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} /></button></div>
          </div>
          {surchargesOpen && <div className="portal-subcard__body">
            <div className="portal-service-surcharge"><div className="portal-service-surcharge__heading"><div><strong className="type-body-bold">Puppy Handling Surcharge</strong><p className="type-caption">Optional added charge for the additional care and handling puppies require.</p></div></div><div className={puppySurchargeEnabled ? 'portal-service-surcharge__controls' : 'portal-service-surcharge__controls is-disabled'}><label><span>Surcharge Amount</span><span className="portal-price-input"><b>$</b><input inputMode="decimal" value={puppySurcharge} disabled={!puppySurchargeEnabled} onChange={(event) => setPuppySurcharge(event.target.value)} /></span></label><fieldset disabled={!puppySurchargeEnabled}><legend className="type-caption">Apply To</legend>{([['boarding', 'Boarding'], ['daycare', 'Daycare'], ['walking', 'Dog Walking']] as const).map(([key, label]) => <label className="portal-checkbox type-body" key={key}><input type="checkbox" checked={puppyServices[key]} onChange={(event) => setPuppyServices((current) => ({ ...current, [key]: event.target.checked }))} /><span aria-hidden="true" />{label}</label>)}</fieldset></div></div>
          </div>}
        </section>
      </PortalPanel>
      <div className="portal-tab-save"><button className="btn btn--cta type-button" type="button" onClick={() => setNotice('Services & Pricing saved.')}>Save Services &amp; Pricing</button></div>
      </div>}

      {businessTab === 'booking' && <div className="portal-business-tab-panel" role="tabpanel">
        <PortalPanel title="Booking Rules" eyebrow="Client-facing policy"><label className="portal-editor type-body" htmlFor="booking-rules"><span>Rules shown before booking</span><textarea id="booking-rules" rows={28} defaultValue={'1 · Meet & Greet first\nA Meet & Greet is required before your dog’s first stay.\n\n2 · Vaccinations up to date\nAll pets must be current on their vaccinations. Keeping everyone vaccinated protects your dog and every other guest in our care.\n\n3 · House training\nDogs over 6 months are expected to be house trained. We’ll happily extend some flexibility to senior dogs at our discretion — age earns grace. For younger dogs, persistent house-training issues may unfortunately mean we can’t continue hosting.\n\n4 · Complete your profile\nPlease fill out every field in your profile. If you don’t know your dog’s exact birthdate, a rough age estimate is fine. A veterinarian must be listed — if you don’t have a regular one, the SF SPCA, Sage, or SF Animal Medical Center all work as defaults.\n\n5 · Where we go in an emergency\nIn an emergency, we take pets to [name of preferred vet or pet hospital]. For anything non-emergency, we’ll use the vet listed on your profile.\n\n6 · Traveling far? A card on file helps\nIf you’ll be traveling internationally, across significant time-zone differences, or otherwise hard to reach, we recommend keeping a credit card on file with your vet. That way care is never delayed while we try to track you down.\n\n7 · Tell us about your dog (care notes)\nYour care notes are where the little things live. Please include:\n• Personality quirks — what makes your dog tick (or nervous)\n• House rules — furniture and bed policy (allowed up or not?)\n• Medication — schedule and exact details\n• Food allergies and any dietary needs\n\n8 · Feeling under the weather? Stay home\nWe can’t accept pets showing signs of a possible contagious illness — it puts every other guest at risk, and repeat violations may result in a ban. It’s nothing personal: we love our furry friends, who come first here :)\n\n9 · Drop-off & pick-up etiquette\nPlease share a real ETA — an actual time, not “I’m on my way.” When you’re close, send your ETA and use maps to confirm the address.\nPlease don’t double-park — cars speed down this street and it’s not safe for you, us, or your pup. If you need to block a driveway (ours or an adjacent neighbor’s) for a moment, that’s totally fine — go ahead. We’ll be quick, and our neighbors know us and are used to it.\n\n10 · We’ll keep you posted\nExpect photos and updates while your dog is with us. If anything seems off — appetite, mood, energy — we’ll proactively flag it so you’re never in the dark.\n\n11 · Terms of Service\nBy booking with us, you agree to our Terms of Service and Policies.'} /></label></PortalPanel>
        <div className="portal-tab-save"><button className="btn btn--cta type-button" type="button" onClick={() => setNotice('Booking Rules saved.')}>Save Booking Rules</button></div>
      </div>}

      {businessTab === 'team' && <div className="portal-business-tab-panel" role="tabpanel">
        <PortalPanel title="Team & Roles" eyebrow={`${staff.length} of ${seatLimit} seats`} action={<Link className="portal-text-button type-body-bold" href="/portal/billing">Manage Plan</Link>}>
          <p className="portal-role-note type-body"><strong>Owner</strong> has ownership and billing control. <strong>Admin</strong> manages configuration and operations. <strong>Staff</strong> handles bookings and clients. Custom permission sets arrive after launch.</p>
          <div className="portal-team-list">{staff.map((person) => <article key={person.id}><div><strong className="type-body-bold">{person.name}</strong><span className="type-caption">{person.email}</span></div><select className="portal-role-select" value={person.role} disabled={person.role === 'Owner'} aria-label={`${person.name} role`} onChange={(event) => setStaff((items) => items.map((item) => item.id === person.id ? { ...item, role: event.target.value as Role } : item))}>{person.role === 'Owner' && <option>Owner</option>}<option>Admin</option><option>Staff</option></select><div className="portal-permissions">{(['Bookings', 'Billing', 'Clients'] as Permission[]).map((permission) => <label className="portal-checkbox" key={permission}><input type="checkbox" checked={ROLE_PERMISSIONS[person.role].includes(permission)} readOnly /><span aria-hidden="true" />{permission}</label>)}</div>{person.role !== 'Owner' && <button className="portal-remove-button type-body-bold" type="button" onClick={() => setStaff((items) => items.filter((item) => item.id !== person.id))}>Remove Staff Member</button>}</article>)}</div>
          <div className="portal-add-staff"><input placeholder="Staff name" value={newStaffName} onChange={(event) => setNewStaffName(event.target.value)} /><input type="email" placeholder="Email address" value={newStaffEmail} onChange={(event) => setNewStaffEmail(event.target.value)} /><button className="btn btn--cta type-button" type="button" onClick={addStaff}>Add Staff</button></div>
          {staff.length >= seatLimit && <div className="portal-seat-warning"><p className="type-body">You’ve used every {tier.name} seat. Upgrade before adding another person.</p><Link className="btn btn--cta type-button" href="/portal/billing">Upgrade Plan</Link></div>}
        </PortalPanel>
        <div className="portal-tab-save"><button className="btn btn--cta type-button" type="button" onClick={() => setNotice('Team saved.')}>Save Team</button></div>
      </div>}

      <PortalModal open={themeOpen} onClose={() => setThemeOpen(false)} eyebrow="Client App" title="Choose a Theme" wide>
        <div className="portal-theme-picker"><ThemeGallery initialTheme={theme} initialMode={mode} allowedThemes={entitlements.themeAllowlist as readonly ThemeName[] | undefined} onChange={(nextTheme, nextMode) => { setTheme(nextTheme); setMode(nextMode); }} /></div>
        <div className="portal-modal-actions"><button className="btn btn--cta type-button" type="button" onClick={() => setThemeOpen(false)}>Apply Theme</button></div>
      </PortalModal>

      <PortalZoneManager open={zoneManagerOpen} onClose={() => setZoneManagerOpen(false)} zones={zones} setZones={setZones} />

      {notice && <p className="portal-inline-notice type-body" role="status">{notice}</p>}
    </div>
  );
}
