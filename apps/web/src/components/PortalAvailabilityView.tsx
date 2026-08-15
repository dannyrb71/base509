'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PortalPageHeader, PortalPanel } from '@/components/PortalShell';

type ServiceKey = 'boarding' | 'daycare' | 'walking';
type AvailabilityState = 'open' | 'limited' | 'blocked';
type BulkAvailabilityState = AvailabilityState | 'mixed';
type HolidayPeriod = { label: string; dates: string[] };

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SERVICES: Array<[ServiceKey, string]> = [['boarding', 'Boarding'], ['daycare', 'Daycare'], ['walking', 'Dog Walking']];

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

function availabilityForDate(date: string, blockedDates: Set<string>, limitedDates: Record<string, ServiceKey[]>): AvailabilityState {
  if (blockedDates.has(date)) return 'blocked';
  if (limitedDates[date]) return 'limited';
  return 'open';
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
  const sampleLimited = toYmd(addDays(initialCalendarDate, 3));

  const [viewYear, setViewYear] = useState(initialCalendarDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialCalendarDate.getMonth());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => new Set([nextHoliday]));
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [holidayDates, setHolidayDates] = useState<Set<string>>(() => new Set(initialHolidayDates));
  const [blockedDates, setBlockedDates] = useState<Set<string>>(() => new Set([sampleBlocked]));
  const [limitedDates, setLimitedDates] = useState<Record<string, ServiceKey[]>>({ [sampleLimited]: ['boarding'] });
  const [notes, setNotes] = useState<Record<string, string>>({ [sampleBlocked]: 'Personal day' });
  const [notice, setNotice] = useState('');

  const days = monthDays(viewYear, viewMonth);
  const monthOffset = new Date(viewYear, viewMonth, 1).getDay();
  const displayedPeriods = defaultHolidayPeriods(viewYear).map((period) => ({ ...period, dates: period.dates.filter((date) => holidayDates.has(date)) })).filter((period) => period.dates.length > 0);
  const defaultDatesForYear = new Set(defaultHolidayPeriods(viewYear).flatMap((period) => period.dates));
  const customHolidayDates = [...holidayDates].filter((date) => date.startsWith(`${viewYear}-`) && !defaultDatesForYear.has(date)).sort();
  const selectedDateKeys = [...selectedDates].sort();
  const selectedDate = selectedDateKeys[0] ?? nextHoliday;
  const selectedAvailabilityStates = new Set(selectedDateKeys.map((date) => availabilityForDate(date, blockedDates, limitedDates)));
  const selectedAvailability: BulkAvailabilityState = selectedAvailabilityStates.size === 1 ? [...selectedAvailabilityStates][0] : 'mixed';
  const selectedServices = SERVICES.map(([key]) => key).filter((key) => selectedDateKeys.every((date) => limitedDates[date]?.includes(key)));
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

  const setAvailability = (state: AvailabilityState) => {
    setBlockedDates((current) => {
      const next = new Set(current);
      selectedDateKeys.forEach((date) => {
        if (state === 'blocked') next.add(date); else next.delete(date);
      });
      return next;
    });
    setLimitedDates((current) => {
      const next = { ...current };
      selectedDateKeys.forEach((date) => {
        if (state === 'limited') next[date] = next[date] ?? ['boarding']; else delete next[date];
      });
      return next;
    });
    setNotice(`${state === 'open' ? 'Open availability' : state === 'limited' ? 'Service limits' : 'Blocked availability'} applied to ${selectedDateKeys.length === 1 ? formatDate(selectedDate) : `${selectedDateKeys.length} selected dates`}.`);
  };

  const setServiceLimit = (service: ServiceKey, enabled: boolean) => {
    setLimitedDates((current) => {
      const next = { ...current };
      selectedDateKeys.forEach((date) => {
        const services = next[date] ?? [];
        next[date] = enabled ? [...new Set([...services, service])] : services.filter((item) => item !== service);
      });
      return next;
    });
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
      <PortalPageHeader eyebrow="Business" title="Availability" body="Manage holiday pricing dates, closures, service-level limits, and existing demand from one calendar. These settings will be shared by the web portal and provider app." action={<button className="btn btn--cta type-button" type="button" onClick={() => setNotice('Availability changes saved.')}>Save Changes</button>} />

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
                const limited = Boolean(limitedDates[date]);
                const count = bookingCounts[date as keyof typeof bookingCounts] ?? 0;
                const selected = selectedDates.has(date);
                const stateText = [holiday && 'holiday pricing', blocked && 'blocked', limited && 'limited availability', count > 0 && `${count} bookings`].filter(Boolean).join(', ') || 'open';
                return <button className={`${holiday ? 'is-holiday ' : ''}${blocked ? 'is-blocked ' : ''}${limited ? 'is-limited ' : ''}${selected ? 'is-selected' : ''}`.trim()} type="button" key={date} aria-pressed={selected} aria-label={`${formatDate(date)} — ${stateText}`} onClick={() => selectDate(date)}><span>{Number(date.slice(-2))}</span>{holiday && <i className="portal-calendar-marker portal-calendar-marker--holiday" aria-hidden="true" />}{limited && <i className="portal-calendar-marker portal-calendar-marker--limited" aria-hidden="true" />}{count > 0 && <small aria-label={`${count} bookings`}>{count}</small>}</button>;
              })}
            </div>
            <div className="portal-calendar-legend type-caption"><span><i className="is-holiday" />Holiday Pricing</span><span><i className="is-blocked" />Blocked</span><span><i className="is-limited" />Limited</span><span><i className="has-bookings" />Bookings</span></div>
          </section>

          <aside className="portal-date-editor">
            <div><span className="type-eyebrow">{selectedDateKeys.length === 1 ? 'Selected Date' : `${selectedDateKeys.length} Selected Dates`}</span><h3 className="type-title">{selectedDateSummary}</h3>{selectedDateKeys.length > 1 && <small className="type-caption">Changes below apply to every selected date.</small>}</div>
            <label className="portal-date-editor__toggle"><span><strong className="type-body-bold">Holiday Pricing</strong><small className="type-caption">{hasMixedHolidayPricing ? 'Mixed across the selected dates. Turn on to apply to all.' : 'Use each service’s explicit holiday rate.'}</small></span><span className="portal-switch"><input type="checkbox" aria-label={`Use holiday pricing on ${selectedDateKeys.length} selected ${selectedDateKeys.length === 1 ? 'date' : 'dates'}`} checked={allSelectedUseHolidayPricing} onChange={(event) => setHoliday(event.target.checked)} /><i /></span></label>
            <fieldset className="portal-date-editor__availability"><legend className="type-body-bold">Availability</legend>{(['open', 'limited', 'blocked'] as AvailabilityState[]).map((state) => <label className={selectedAvailability === state ? 'is-active' : undefined} key={state}><input type="radio" name="availability-state" checked={selectedAvailability === state} onChange={() => setAvailability(state)} /><span className="type-body-bold">{state === 'open' ? 'Open' : state === 'limited' ? 'Limit Services' : 'Block All'}</span></label>)}</fieldset>
            {selectedAvailability === 'mixed' && <p className="portal-date-editor__mixed type-caption">Availability differs across these dates. Choose an option to apply it to all.</p>}
            {selectedAvailability === 'limited' && <fieldset className="portal-date-editor__services"><legend className="type-caption">Services Closed On {selectedDateKeys.length === 1 ? 'This Date' : 'Selected Dates'}</legend>{SERVICES.map(([key, label]) => <label className="portal-checkbox type-body" key={key}><input type="checkbox" checked={selectedServices.includes(key)} onChange={(event) => setServiceLimit(key, event.target.checked)} /><span aria-hidden="true" />{label}</label>)}</fieldset>}
            <label className="portal-date-editor__note type-caption"><span>Staff Note <small>(Optional)</small></span><textarea rows={3} value={selectedNote} placeholder={selectedNotes.size > 1 ? 'Notes differ. Type to replace all selected notes.' : 'Reason or internal context'} onChange={(event) => setStaffNote(event.target.value)} /></label>
          </aside>
        </div>
      </PortalPanel>

      <div className="portal-settings-grid">
        <PortalPanel title={`${viewYear} Holiday Pricing Dates`} eyebrow="Woof WeTreats defaults" action={<button className="portal-text-button type-body-bold" type="button" onClick={resetDefaults}>Reset Defaults</button>}>
          <p className="type-body">PetAppro starts with the proven Woof WeTreats holiday windows. Keep them, remove individual dates, or add custom dates directly from the calendar.</p>
          <div className="portal-holiday-list">{displayedPeriods.map((period) => <article key={period.label}><div><strong className="type-body-bold">{period.label}</strong><span className="type-caption">{formatPeriod(period)}</span></div><button className="portal-remove-button type-body-bold" type="button" onClick={() => { setHolidayDates((current) => { const next = new Set(current); period.dates.forEach((date) => next.delete(date)); return next; }); setNotice(`${period.label} removed from ${viewYear} holiday pricing.`); }}>Remove</button></article>)}{customHolidayDates.map((date) => <article key={date}><div><strong className="type-body-bold">Custom Holiday Date</strong><span className="type-caption">{formatDate(date)}</span></div><button className="portal-remove-button type-body-bold" type="button" onClick={() => { setHolidayDates((current) => { const next = new Set(current); next.delete(date); return next; }); setNotice(`${formatDate(date)} removed from holiday pricing.`); }}>Remove</button></article>)}</div>
        </PortalPanel>

        <PortalPanel title="How Pricing Uses This Calendar" eyebrow="Explicit rates">
          <div className="portal-pricing-calendar-guide"><p className="type-body">The calendar selects <em>when</em> holiday pricing applies. Each service controls <em>how much</em> the client pays.</p><ul className="portal-check-list type-body"><li>Boarding uses its holiday price per selected night.</li><li>Daycare uses its holiday price per selected day.</li><li>Dog Walking uses the matching duration’s holiday price per session.</li><li>Blocked and limited availability are enforced separately from price.</li></ul><Link className="btn btn--secondary type-button" href="/portal/business">Edit Service Rates</Link></div>
        </PortalPanel>
      </div>

      {notice && <p className="portal-inline-notice type-body" role="status">{notice}</p>}
    </div>
  );
}
