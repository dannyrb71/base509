'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePortalPlan } from '@/components/PortalPlanProvider';
import { CapacityField, PortalPageHeader, PortalPanel } from '@/components/PortalShell';

type ServiceKey = 'boarding' | 'daycare' | 'walking';
type DayState = 'available' | 'blocked';
type BulkDayState = DayState | 'mixed';
type CapacityKey = 'boarding' | 'daycare' | 'pool';
type HolidayPeriod = { label: string; dates: string[] };

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SERVICES: Array<[ServiceKey, string]> = [['boarding', 'Boarding'], ['daycare', 'Daycare'], ['walking', 'Dog Walking']];
/* Base capacity defaults + pool state mirror the Business page mockup
   (Boarding 6 / Daycare 8 / Shared Total 10, pool on). In production these
   read from the tenant's service config — D-076's day overrides layer on
   top of them and never replace them. */
const BASE_CAPACITY: Record<CapacityKey, number> = { boarding: 6, daycare: 8, pool: 10 };
const POOL_ENABLED = true;
/* Active Walk Windows + per-walker day-one defaults, mirroring the Business →
   Dog Walking mockup (Midday falls back to walker defaults Morgan 6 / Casey 4;
   Evening and Morning carry window-set values). Production reads tenant
   config; the provider app must mirror this same override surface (D-076
   `service_window_day_overrides`). Solo plans get one dogs-per-walk field
   per window instead of walker rows. */
type WalkWindowMirror = { id: string; name: string; time: string; days: number[]; daysLabel: string; soloDogs: number; walkers: Array<[string, number]> };
const WALK_WINDOWS: WalkWindowMirror[] = [
  { id: 'morning', name: 'Morning', time: '7:00–9:00 AM', days: [1, 2, 3, 4, 5], daysLabel: 'Mon–Fri', soloDogs: 4, walkers: [['Morgan Lee', 4]] },
  { id: 'midday', name: 'Midday', time: '10:00 AM–2:00 PM', days: [1, 2, 3, 4, 5], daysLabel: 'Mon–Fri', soloDogs: 6, walkers: [['Morgan Lee', 6], ['Casey Reed', 4]] },
  { id: 'evening', name: 'Evening', time: '4:00–6:30 PM', days: [1, 3, 5], daysLabel: 'Mon · Wed · Fri', soloDogs: 6, walkers: [['Morgan Lee', 6]] },
];
type WindowDayOverride = { closed?: boolean; walkerDogs?: Record<string, string>; soloDogs?: string };

function toYmd(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fromYmd(value: string) {
  return new Date(`${value}T00:00:00`);
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function nthWeekday(year: number, month: number, weekday: number, occurrence: number) {
  const first = new Date(year, month - 1, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month - 1, 1 + offset + ((occurrence - 1) * 7));
}

function lastWeekday(year: number, month: number, weekday: number) {
  const last = new Date(year, month, 0);
  return addDays(last, -((last.getDay() - weekday + 7) % 7));
}

function fridayToMonday(anchor: Date) {
  const offsetToFriday: Record<number, number> = { 5: 0, 6: -1, 0: -2, 1: -3 };
  const friday = addDays(anchor, offsetToFriday[anchor.getDay()]);
  return Array.from({ length: 4 }, (_, index) => toYmd(addDays(friday, index)));
}

function fixedHolidayWindow(date: Date) {
  return [2, 3, 4].includes(date.getDay()) ? [toYmd(date)] : fridayToMonday(date);
}

function defaultHolidayPeriods(year: number): HolidayPeriod[] {
  const thanksgiving = nthWeekday(year, 11, 4, 4);
  return [
    { label: 'New Year’s Day', dates: [`${year}-01-01`] },
    { label: 'Presidents Day Weekend', dates: fridayToMonday(nthWeekday(year, 2, 1, 3)) },
    { label: 'Memorial Day Weekend', dates: fridayToMonday(lastWeekday(year, 5, 1)) },
    { label: 'Independence Day', dates: fixedHolidayWindow(new Date(year, 6, 4)) },
    { label: 'Labor Day Weekend', dates: fridayToMonday(nthWeekday(year, 9, 1, 1)) },
    { label: 'Veterans Day', dates: fixedHolidayWindow(new Date(year, 10, 11)) },
    { label: 'Thanksgiving Weekend', dates: Array.from({ length: 4 }, (_, index) => toYmd(addDays(thanksgiving, index))) },
    { label: 'Christmas', dates: [`${year}-12-24`, `${year}-12-25`] },
    { label: 'New Year’s Eve', dates: [`${year}-12-31`] },
  ];
}

function formatDate(value: string) {
  return fromYmd(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatPeriod(period: HolidayPeriod) {
  const dates = [...period.dates].sort();
  if (dates.length === 1) return formatDate(dates[0]);
  const consecutive = dates.every((date, index) => index === 0 || toYmd(addDays(fromYmd(dates[index - 1]), 1)) === date);
  if (!consecutive) return `${dates.map((date) => fromYmd(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })).join(', ')}, ${fromYmd(dates[0]).getFullYear()}`;
  const first = fromYmd(dates[0]);
  const last = fromYmd(dates[dates.length - 1]);
  return `${first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${last.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function monthDays(year: number, month: number) {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, index) => toYmd(new Date(year, month, index + 1)));
}

function dayStateFor(date: string, blockedDates: Set<string>): DayState {
  return blockedDates.has(date) ? 'blocked' : 'available';
}

function datesAreConsecutive(dates: string[]) {
  return dates.every((date, index) => index === 0 || toYmd(addDays(fromYmd(dates[index - 1]), 1)) === date);
}

export function PortalAvailabilityView() {
  const today = useMemo(() => new Date(), []);
  const todayKey = toYmd(today);
  const initialPeriods = useMemo(() => [today.getFullYear(), today.getFullYear() + 1].flatMap(defaultHolidayPeriods), [today]);
  const initialHolidayDates = useMemo(() => new Set(initialPeriods.flatMap((period) => period.dates)), [initialPeriods]);
  const nextHoliday = useMemo(() => [...initialHolidayDates].sort().find((date) => date >= todayKey) ?? todayKey, [initialHolidayDates, todayKey]);
  const initialCalendarDate = fromYmd(nextHoliday);
  const sampleBlocked = toYmd(addDays(initialCalendarDate, 7));
  const sampleClosed = toYmd(addDays(initialCalendarDate, 3));
  const sampleOverride = toYmd(addDays(initialCalendarDate, 5));

  const [viewYear, setViewYear] = useState(initialCalendarDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialCalendarDate.getMonth());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => new Set([nextHoliday]));
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [holidayDates, setHolidayDates] = useState<Set<string>>(() => new Set(initialHolidayDates));
  const [blockedDates, setBlockedDates] = useState<Set<string>>(() => new Set([sampleBlocked]));
  const [closedServices, setClosedServices] = useState<Record<string, ServiceKey[]>>({ [sampleClosed]: ['boarding'] });
  const [capacityOverrides, setCapacityOverrides] = useState<Record<string, Partial<Record<CapacityKey, string>>>>({ [sampleOverride]: { daycare: '4' } });
  const [windowOverrides, setWindowOverrides] = useState<Record<string, Record<string, WindowDayOverride>>>({});
  const { entitlements } = usePortalPlan();
  const teamPlan = entitlements.walkerPlan !== 'solo';
  const [notes, setNotes] = useState<Record<string, string>>({ [sampleBlocked]: 'Personal day' });
  const [notice, setNotice] = useState('');

  const days = monthDays(viewYear, viewMonth);
  const monthOffset = new Date(viewYear, viewMonth, 1).getDay();
  const displayedPeriods = defaultHolidayPeriods(viewYear).map((period) => ({ ...period, dates: period.dates.filter((date) => holidayDates.has(date)) })).filter((period) => period.dates.length > 0);
  const defaultDatesForYear = new Set(defaultHolidayPeriods(viewYear).flatMap((period) => period.dates));
  const customHolidayDates = [...holidayDates].filter((date) => date.startsWith(`${viewYear}-`) && !defaultDatesForYear.has(date)).sort();
  const selectedDateKeys = [...selectedDates].sort();
  const selectedDate = selectedDateKeys[0] ?? nextHoliday;
  const selectedDayStates = new Set(selectedDateKeys.map((date) => dayStateFor(date, blockedDates)));
  const selectedDayState: BulkDayState = selectedDayStates.size === 1 ? [...selectedDayStates][0] : 'mixed';
  /* A service reads "available" only when open on EVERY selected date. */
  const serviceOpenAcrossSelection = (key: ServiceKey) => selectedDateKeys.every((date) => !closedServices[date]?.includes(key));
  /* Uniform override value across the selection, or null when they differ. */
  const overrideAcrossSelection = (key: CapacityKey) => {
    const values = new Set(selectedDateKeys.map((date) => capacityOverrides[date]?.[key] ?? ''));
    return values.size === 1 ? [...values][0] : null;
  };
  const selectionHasExceptions = selectedDateKeys.some((date) => blockedDates.has(date) || (closedServices[date]?.length ?? 0) > 0 || capacityOverrides[date] || windowOverrides[date]);
  /* Window-level uniformity across the selection (null = values differ). */
  const windowOpenAcrossSelection = (windowId: string) => selectedDateKeys.every((date) => !windowOverrides[date]?.[windowId]?.closed);
  const windowValueAcrossSelection = (windowId: string, read: (override: WindowDayOverride | undefined) => string) => {
    const values = new Set(selectedDateKeys.map((date) => read(windowOverrides[date]?.[windowId])));
    return values.size === 1 ? [...values][0] : null;
  };
  const holidaySelectionCount = selectedDateKeys.filter((date) => holidayDates.has(date)).length;
  const allSelectedUseHolidayPricing = holidaySelectionCount === selectedDateKeys.length;
  const hasMixedHolidayPricing = holidaySelectionCount > 0 && !allSelectedUseHolidayPricing;
  const selectedNotes = new Set(selectedDateKeys.map((date) => notes[date] ?? ''));
  const selectedNote = selectedNotes.size === 1 ? [...selectedNotes][0] : '';
  const selectedDateSummary = selectedDateKeys.length === 1
    ? formatDate(selectedDate)
    : datesAreConsecutive(selectedDateKeys)
      ? `${formatDate(selectedDateKeys[0])}–${formatDate(selectedDateKeys[selectedDateKeys.length - 1])}`
      : `${selectedDateKeys.length} nonconsecutive dates`;
  const bookingCounts = useMemo(() => ({ [toYmd(addDays(initialCalendarDate, 1))]: 3, [toYmd(addDays(initialCalendarDate, 2))]: 6, [toYmd(addDays(initialCalendarDate, 8))]: 9 }), [initialCalendarDate]);

  const moveMonth = (amount: number) => {
    const next = new Date(viewYear, viewMonth + amount, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const selectDate = (date: string) => {
    if (!isMultiSelecting) {
      setSelectedDates(new Set([date]));
      return;
    }
    setSelectedDates((current) => {
      const next = new Set(current);
      if (next.has(date) && next.size > 1) next.delete(date); else next.add(date);
      return next;
    });
  };

  const selectVisibleMonth = () => {
    setSelectedDates((current) => new Set([...current, ...days]));
    setNotice(`${MONTH_NAMES[viewMonth]} ${viewYear} added to the selection.`);
  };

  const keepFirstSelectedDate = () => {
    setSelectedDates(new Set([selectedDate]));
    setIsMultiSelecting(false);
  };

  const setHoliday = (enabled: boolean) => {
    setHolidayDates((current) => {
      const next = new Set(current);
      selectedDateKeys.forEach((date) => {
        if (enabled) next.add(date); else next.delete(date);
      });
      return next;
    });
    setNotice(`${selectedDateKeys.length === 1 ? formatDate(selectedDate) : `${selectedDateKeys.length} selected dates`} now ${enabled ? 'use holiday pricing' : 'use regular pricing'}.`);
  };

  const selectionLabel = selectedDateKeys.length === 1 ? formatDate(selectedDate) : `${selectedDateKeys.length} selected dates`;

  const setDayState = (state: DayState) => {
    setBlockedDates((current) => {
      const next = new Set(current);
      selectedDateKeys.forEach((date) => {
        if (state === 'blocked') next.add(date); else next.delete(date);
      });
      return next;
    });
    setNotice(`${state === 'blocked' ? 'Block All' : 'Services Available'} applied to ${selectionLabel}.`);
  };

  const setServiceOpen = (service: ServiceKey, open: boolean) => {
    setClosedServices((current) => {
      const next = { ...current };
      selectedDateKeys.forEach((date) => {
        const closed = next[date] ?? [];
        const updated = open ? closed.filter((item) => item !== service) : [...new Set([...closed, service])];
        if (updated.length) next[date] = updated; else delete next[date];
      });
      return next;
    });
  };

  /* Empty value = delete the override (fall back to the base default) —
     the mockup's stand-in for D-076's delete-the-override-row semantics. */
  const setCapacityOverride = (key: CapacityKey, value: string) => {
    setCapacityOverrides((current) => {
      const next = { ...current };
      selectedDateKeys.forEach((date) => {
        const overrides = { ...(next[date] ?? {}) };
        if (value) overrides[key] = value; else delete overrides[key];
        if (Object.keys(overrides).length) next[date] = overrides; else delete next[date];
      });
      return next;
    });
  };

  /* Shared mutate-per-date helper for window overrides: the patch returns
     the next override (or null to drop it); empty records collapse away so
     "no overrides" and "never touched" stay the same state. */
  const patchWindowOverride = (windowId: string, patch: (current: WindowDayOverride) => WindowDayOverride | null) => {
    setWindowOverrides((current) => {
      const next = { ...current };
      selectedDateKeys.forEach((date) => {
        const forDate = { ...(next[date] ?? {}) };
        const updated = patch(forDate[windowId] ?? {});
        const cleaned = updated && (updated.closed || updated.soloDogs || Object.keys(updated.walkerDogs ?? {}).length) ? updated : null;
        if (cleaned) forDate[windowId] = cleaned; else delete forDate[windowId];
        if (Object.keys(forDate).length) next[date] = forDate; else delete next[date];
      });
      return next;
    });
  };

  const setWindowOpen = (windowId: string, open: boolean) => patchWindowOverride(windowId, (current) => ({ ...current, closed: open ? undefined : true }));
  const setWindowWalkerDogs = (windowId: string, walker: string, value: string) => patchWindowOverride(windowId, (current) => {
    const walkerDogs = { ...(current.walkerDogs ?? {}) };
    if (value) walkerDogs[walker] = value; else delete walkerDogs[walker];
    return { ...current, walkerDogs };
  });
  const setWindowSoloDogs = (windowId: string, value: string) => patchWindowOverride(windowId, (current) => ({ ...current, soloDogs: value || undefined }));

  const resetSelectedDates = () => {
    setBlockedDates((current) => {
      const next = new Set(current);
      selectedDateKeys.forEach((date) => next.delete(date));
      return next;
    });
    setClosedServices((current) => {
      const next = { ...current };
      selectedDateKeys.forEach((date) => delete next[date]);
      return next;
    });
    setCapacityOverrides((current) => {
      const next = { ...current };
      selectedDateKeys.forEach((date) => delete next[date]);
      return next;
    });
    setWindowOverrides((current) => {
      const next = { ...current };
      selectedDateKeys.forEach((date) => delete next[date]);
      return next;
    });
    setNotice(`${selectionLabel} reset to defaults — every service and window open at base capacity. Holiday pricing and notes kept.`);
  };

  const setStaffNote = (value: string) => {
    setNotes((current) => {
      const next = { ...current };
      selectedDateKeys.forEach((date) => { next[date] = value; });
      return next;
    });
  };

  const resetDefaults = () => {
    const yearDates = defaultHolidayPeriods(viewYear).flatMap((period) => period.dates);
    setHolidayDates((current) => {
      const next = new Set([...current].filter((date) => !date.startsWith(`${viewYear}-`)));
      yearDates.forEach((date) => next.add(date));
      return next;
    });
    setNotice(`${viewYear} holiday pricing dates reset to the Woof WeTreats defaults.`);
  };

  return (
    <div className="portal-page">
      <PortalPageHeader eyebrow="Business" title="Availability" body="The per-date override surface: block a day, close a single service, or change capacity for just that date. Recurring service configuration lives in Business — date exceptions set here always win. These settings will be shared by the web portal and provider app." action={<button className="btn btn--cta type-button" type="button" onClick={() => setNotice('Availability changes saved.')}>Save Changes</button>} />

      <PortalPanel title="Availability Calendar" eyebrow="America/Los_Angeles">
        <div className="portal-availability-layout">
          <section className="portal-availability-calendar" aria-label="Business availability calendar">
            <div className="portal-calendar-nav">
              <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}><Image src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} /></button>
              <h3 className="type-title">{MONTH_NAMES[viewMonth]} {viewYear}</h3>
              <button type="button" aria-label="Next month" onClick={() => moveMonth(1)}><Image src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} /></button>
            </div>
            <div className="portal-calendar-selection-tools">
              <button className={isMultiSelecting ? 'is-active' : undefined} type="button" aria-pressed={isMultiSelecting} onClick={() => setIsMultiSelecting((current) => !current)}>{isMultiSelecting ? 'Finish Selecting' : 'Edit Multiple Dates'}</button>
              {isMultiSelecting && <button type="button" onClick={selectVisibleMonth}>Select This Month</button>}
              {selectedDateKeys.length > 1 && <button type="button" onClick={keepFirstSelectedDate}>Keep First Date</button>}
            </div>
            {isMultiSelecting && <p className="portal-calendar-selection-help type-caption">Choose any dates to edit together. Select a chosen date again to remove it.</p>}
            <div className="portal-calendar-grid portal-calendar-grid--labels">{DAY_LABELS.map((label) => <span className="type-label" key={label}>{label}</span>)}</div>
            <div className="portal-calendar-grid">
              {Array.from({ length: monthOffset }, (_, index) => <span aria-hidden="true" key={`empty-${index}`} />)}
              {days.map((date) => {
                const holiday = holidayDates.has(date);
                const blocked = blockedDates.has(date);
                const adjusted = !blocked && (Boolean(closedServices[date]?.length) || Boolean(capacityOverrides[date]) || Boolean(windowOverrides[date]));
                const count = bookingCounts[date as keyof typeof bookingCounts] ?? 0;
                const selected = selectedDates.has(date);
                const stateText = [holiday && 'holiday pricing', blocked && 'blocked', adjusted && 'adjusted availability or capacity', count > 0 && `${count} bookings`].filter(Boolean).join(', ') || 'open';
                return <button className={`${holiday ? 'is-holiday ' : ''}${blocked ? 'is-blocked ' : ''}${adjusted ? 'is-limited ' : ''}${selected ? 'is-selected' : ''}`.trim()} type="button" key={date} aria-pressed={selected} aria-label={`${formatDate(date)} — ${stateText}`} onClick={() => selectDate(date)}><span>{Number(date.slice(-2))}</span>{holiday && <i className="portal-calendar-marker portal-calendar-marker--holiday" aria-hidden="true" />}{adjusted && <i className="portal-calendar-marker portal-calendar-marker--limited" aria-hidden="true" />}{count > 0 && <small aria-label={`${count} bookings`}>{count}</small>}</button>;
              })}
            </div>
            <div className="portal-calendar-legend type-caption"><span><i className="is-holiday" />Holiday Pricing</span><span><i className="is-blocked" />Blocked</span><span><i className="is-limited" />Adjusted</span><span><i className="has-bookings" />Bookings</span></div>
          </section>

          <aside className="portal-date-editor">
            <div><span className="type-eyebrow">{selectedDateKeys.length === 1 ? 'Selected Date' : `${selectedDateKeys.length} Selected Dates`}</span><h3 className="type-title">{selectedDateSummary}</h3>{selectedDateKeys.length > 1 && <small className="type-caption">Changes below apply to every selected date.</small>}</div>
            <label className="portal-date-editor__toggle"><span><strong className="type-body-bold">Holiday Pricing</strong><small className="type-caption">{hasMixedHolidayPricing ? 'Mixed across the selected dates. Turn on to apply to all.' : 'Use each service’s explicit holiday rate.'}</small></span><span className="portal-switch"><input type="checkbox" aria-label={`Use holiday pricing on ${selectedDateKeys.length} selected ${selectedDateKeys.length === 1 ? 'date' : 'dates'}`} checked={allSelectedUseHolidayPricing} onChange={(event) => setHoliday(event.target.checked)} /><i /></span></label>
            <fieldset className="portal-date-editor__availability"><legend className="type-body-bold">Availability</legend>{(['available', 'blocked'] as DayState[]).map((state) => <label className={selectedDayState === state ? 'is-active' : undefined} key={state}><input type="radio" name="availability-state" checked={selectedDayState === state} onChange={() => setDayState(state)} /><span className="type-body-bold">{state === 'available' ? 'Services Available' : 'Block All'}</span></label>)}</fieldset>
            {selectedDayState === 'mixed' && <p className="portal-date-editor__mixed type-caption">Availability differs across these dates. Choose an option to apply it to all.</p>}
            {selectedDayState === 'blocked' && <p className="type-caption">Every service is closed on {selectedDateKeys.length === 1 ? 'this date' : 'these dates'} — including any service you add later. Switch back to Services Available to reopen.</p>}
            {selectionHasExceptions && <button className="portal-text-button type-body-bold" type="button" onClick={resetSelectedDates}>Reset to Defaults</button>}
            <label className="portal-date-editor__note type-caption"><span>Staff Note <small>(Optional)</small></span><textarea rows={3} value={selectedNote} placeholder={selectedNotes.size > 1 ? 'Notes differ. Type to replace all selected notes.' : 'Reason or internal context'} onChange={(event) => setStaffNote(event.target.value)} /></label>
            <p className="type-caption">Precedence: Block All → service off → this date&apos;s capacity → base default. Date exceptions always win over recurring Walk Windows — set those in <Link href="/portal/business">Business → Dog Walking</Link>.</p>
          </aside>

          {selectedDayState === 'available' && <section className="portal-day-occupancy" aria-label="Boarding and Daycare on the selected dates">
            <div className="portal-day-service__heading"><span><strong className="type-body-bold">Boarding &amp; Daycare</strong> <small className="type-caption">{selectedDateSummary}</small></span></div>
            <div className="portal-date-editor__day-services">
              {SERVICES.filter(([key]) => key !== 'walking').map(([key, label]) => {
                const open = serviceOpenAcrossSelection(key);
                const override = overrideAcrossSelection(key as CapacityKey);
                return <div className={open ? 'portal-day-service' : 'portal-day-service is-closed'} key={key}>
                  <div className="portal-day-service__heading"><strong className="type-body-bold">{label}</strong><label className="portal-switch"><span className="visually-hidden">{label} available on {selectedDateKeys.length === 1 ? 'this date' : 'selected dates'}</span><input type="checkbox" checked={open} onChange={(event) => setServiceOpen(key, event.target.checked)} /><i /></label></div>
                  {open && <CapacityField label="Capacity for this date" ariaLabel={`${label} capacity override`} value={override ?? ''} placeholder={override === null ? 'Mixed' : `Default: ${BASE_CAPACITY[key as CapacityKey]}`} hint={override ? `Overrides the default of ${BASE_CAPACITY[key as CapacityKey]}. Clear to restore.` : `Default: ${BASE_CAPACITY[key as CapacityKey]} — type a number to override just ${selectedDateKeys.length === 1 ? 'this date' : 'these dates'}.`} onChange={(value) => setCapacityOverride(key as CapacityKey, value)} />}
                </div>;
              })}
              {POOL_ENABLED && serviceOpenAcrossSelection('boarding') && serviceOpenAcrossSelection('daycare') && <div className="portal-day-service">
                <div className="portal-day-service__heading"><strong className="type-body-bold">Shared Total Capacity</strong></div>
                {(() => { const override = overrideAcrossSelection('pool'); return <CapacityField label="Total dogs on site for this date" ariaLabel="Shared Total Capacity override" value={override ?? ''} placeholder={override === null ? 'Mixed' : `Default: ${BASE_CAPACITY.pool}`} hint={override ? `Overrides the default of ${BASE_CAPACITY.pool}. Clear to restore.` : `Default: ${BASE_CAPACITY.pool} — follows Business → Shared Total Capacity.`} onChange={(value) => setCapacityOverride('pool', value)} />; })()}
              </div>}
              <p className="type-caption">Lowering a day below already-confirmed bookings flags it over-capacity and pauses auto-approval — it never cancels bookings.</p>
            </div>
          </section>}

          {selectedDayState === 'available' && (() => {
            const walkingOpen = serviceOpenAcrossSelection('walking');
            /* Day/date-specific: only windows that RUN on a selected date's
               weekday appear — a walker with no window that day never shows. */
            const runningWindows = WALK_WINDOWS.filter((window) => selectedDateKeys.some((date) => window.days.includes(fromYmd(date).getDay())));
            return <section className={walkingOpen ? 'portal-day-walking' : 'portal-day-walking is-closed'} aria-label="Dog Walking on the selected dates">
              <div className="portal-day-service__heading"><span><strong className="type-body-bold">Dog Walking</strong> <small className="type-caption">{selectedDateSummary}</small></span><label className="portal-switch"><span className="visually-hidden">Dog Walking available on {selectedDateKeys.length === 1 ? 'this date' : 'selected dates'}</span><input type="checkbox" checked={walkingOpen} onChange={(event) => setServiceOpen('walking', event.target.checked)} /><i /></label></div>
              {!walkingOpen && <small className="type-caption">All Walk Windows are suppressed on {selectedDateKeys.length === 1 ? 'this date' : 'these dates'}. The recurring schedule in Business is untouched.</small>}
              {walkingOpen && runningWindows.length === 0 && <small className="type-caption">No Walk Windows run on {selectedDateKeys.length === 1 ? `${fromYmd(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })}s` : 'these dates'} — nothing to override. The schedule lives in Business → Dog Walking.</small>}
              {walkingOpen && runningWindows.length > 0 && <>
                <div className="portal-day-windows">
                  {runningWindows.map((window) => {
                    const windowOpen = windowOpenAcrossSelection(window.id);
                    return <div className={windowOpen ? 'portal-day-window' : 'portal-day-window is-closed'} key={window.id}>
                      <div className="portal-day-service__heading"><span><strong className="type-body-bold">{window.name}</strong> <small className="type-caption">{window.daysLabel} · {window.time}</small></span><label className="portal-switch"><span className="visually-hidden">{window.name} window runs on {selectedDateKeys.length === 1 ? 'this date' : 'selected dates'}</span><input type="checkbox" checked={windowOpen} onChange={(event) => setWindowOpen(window.id, event.target.checked)} /><i /></label></div>
                      {!windowOpen && <small className="type-caption">Off for {selectedDateKeys.length === 1 ? 'this date' : 'these dates'} only.</small>}
                      {windowOpen && (teamPlan
                        ? window.walkers.map(([walker, defaultDogs]) => {
                            const value = windowValueAcrossSelection(window.id, (item) => item?.walkerDogs?.[walker] ?? '');
                            return <CapacityField key={walker} label={`${walker} — dogs this date`} ariaLabel={`${walker} dogs in ${window.name} on this date`} value={value ?? ''} placeholder={value === null ? 'Mixed' : `Default: ${defaultDogs}`} hint={value ? `Overrides ${walker}’s default of ${defaultDogs} for just ${selectedDateKeys.length === 1 ? 'this date' : 'these dates'}.` : undefined} onChange={(next) => setWindowWalkerDogs(window.id, walker, next)} />;
                          })
                        : (() => { const value = windowValueAcrossSelection(window.id, (item) => item?.soloDogs ?? ''); return <CapacityField label="Dogs this date" ariaLabel={`${window.name} dogs on this date`} value={value ?? ''} placeholder={value === null ? 'Mixed' : `Default: ${window.soloDogs}`} hint={value ? `Overrides the default of ${window.soloDogs} for just ${selectedDateKeys.length === 1 ? 'this date' : 'these dates'}.` : undefined} onChange={(next) => setWindowSoloDogs(window.id, next)} />; })())}
                    </div>;
                  })}
                </div>
                <small className="type-caption">Training a new hire on a group walk? Raise that walker&apos;s dogs for just this date — the next run of the window returns to its default.</small>
              </>}
            </section>;
          })()}
        </div>
      </PortalPanel>

      <div className="portal-settings-grid">
        <PortalPanel title={`${viewYear} Holiday Pricing Dates`} eyebrow="Woof WeTreats defaults" action={<button className="portal-text-button type-body-bold" type="button" onClick={resetDefaults}>Reset Defaults</button>}>
          <p className="type-body">PetAppro starts with the proven Woof WeTreats holiday windows. Keep them, remove individual dates, or add custom dates directly from the calendar.</p>
          <div className="portal-holiday-list">{displayedPeriods.map((period) => <article key={period.label}><div><strong className="type-body-bold">{period.label}</strong><span className="type-caption">{formatPeriod(period)}</span></div><button className="portal-remove-button type-body-bold" type="button" onClick={() => { setHolidayDates((current) => { const next = new Set(current); period.dates.forEach((date) => next.delete(date)); return next; }); setNotice(`${period.label} removed from ${viewYear} holiday pricing.`); }}>Remove</button></article>)}{customHolidayDates.map((date) => <article key={date}><div><strong className="type-body-bold">Custom Holiday Date</strong><span className="type-caption">{formatDate(date)}</span></div><button className="portal-remove-button type-body-bold" type="button" onClick={() => { setHolidayDates((current) => { const next = new Set(current); next.delete(date); return next; }); setNotice(`${formatDate(date)} removed from holiday pricing.`); }}>Remove</button></article>)}</div>
        </PortalPanel>

        <PortalPanel title="How Pricing Uses This Calendar" eyebrow="Explicit rates">
          <div className="portal-pricing-calendar-guide"><p className="type-body">The calendar selects <em>when</em> holiday pricing applies. Each service controls <em>how much</em> the client pays.</p><ul className="portal-check-list type-body"><li>Boarding uses its holiday price per selected night.</li><li>Daycare uses its holiday price per selected day.</li><li>Dog Walking uses the matching duration’s holiday price per session.</li><li>Blocked days and per-date capacity are enforced separately from price.</li></ul><Link className="btn btn--secondary type-button" href="/portal/business">Edit Service Rates</Link></div>
        </PortalPanel>
      </div>

      {notice && <p className="portal-inline-notice type-body" role="status">{notice}</p>}
    </div>
  );
}
