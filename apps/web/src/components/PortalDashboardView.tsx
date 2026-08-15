'use client';

import { useState } from 'react';
import { Btn } from '@/components/ui';
import { PortalPageHeader, PortalPanel, PortalStatCard } from '@/components/PortalShell';

const SUMMARY = {
  bookings: {
    label: 'Today’s Bookings', value: '8', detail: '4 services across 7 households', tone: 'accent' as const,
    rows: [
      ['Alex Morgan', 'Bella', '8:00 AM · Dog Walking', 'In Progress', ''],
      ['Jules Patel', 'Mabel', '9:30 AM · Daycare', 'Upcoming', ''],
      ['Priya Shah', 'Buttons', '11:00 AM · Boarding', 'Upcoming', ''],
      ['Taylor Kim', 'Luna', '1:30 PM · Boarding', 'Upcoming', ''],
    ],
  },
  requests: {
    label: 'Pending Requests', value: '3', detail: 'Oldest request received yesterday', tone: 'default' as const,
    rows: [
      ['Morgan Lee', 'Pepper', 'Aug 17–19 · Boarding', 'Pending', '$180'],
      ['Chris Nguyen', 'Scout', 'Aug 18 · Daycare', 'Pending', '$40'],
      ['Avery Jones', 'Moose', 'Aug 20 · Dog Walking', 'Pending', '$30'],
    ],
  },
  charges: {
    label: 'Pending & Past-Due Charges', value: '$615', detail: '4 client charges need attention', tone: 'warning' as const,
    rows: [
      ['Sam Rivera', 'Winston', 'INV-0241 · Due Aug 13', 'Past Due', '$240'],
      ['Priya Shah', 'Buttons', 'INV-0242 · Due Today', 'Pending', '$174'],
      ['Jordan Mills', 'Frankie', 'INV-0243 · Due Aug 15', 'Pending', '$116'],
      ['Casey Reed', 'Milo', 'INV-0244 · Due Aug 16', 'Pending', '$85'],
    ],
  },
  clients: {
    label: 'Active Clients', value: '42', detail: '6 joined in the last 30 days', tone: 'default' as const,
    listLabel: 'Newest Clients', listNote: '4 most recently joined of 42 active — see Clients for the full roster',
    rows: [
      ['Morgan Lee', 'Pepper', 'Joined Aug 8', 'New', ''],
      ['Priya Shah', 'Buttons · Pepper', 'Joined Aug 2', 'New', ''],
      ['Casey Reed', 'Milo', 'Joined Jul 27', 'New', ''],
      ['Sam Rivera', 'Winston', 'Joined Jul 21', 'New', ''],
    ],
  },
} as const;

const SCHEDULE = [
  ['8:00 AM', 'Bella', 'Dog Walking', 'In-Progress'],
  ['9:30 AM', 'Mabel', 'Daycare', 'Upcoming'],
  ['11:00 AM', 'Buttons', 'Boarding', 'Upcoming'],
  ['1:30 PM', 'Coco', 'Boarding', 'Pending'],
] as const;

export function PortalDashboardView() {
  const [selected, setSelected] = useState<keyof typeof SUMMARY>('bookings');
  const current = SUMMARY[selected];

  return (
    <div className="portal-page">
      <PortalPageHeader eyebrow="Dashboard" title="Good Morning, Danny" body="Here’s the shape of your day across bookings, clients, and payments." action={<Btn href="/portal/business" variant="cta">Manage Business</Btn>} />

      <div className="portal-stat-grid">
        {(Object.keys(SUMMARY) as (keyof typeof SUMMARY)[]).map((key) => {
          const card = SUMMARY[key];
          return <PortalStatCard key={key} {...card} active={selected === key} onClick={() => setSelected(key)} />;
        })}
      </div>

      <PortalPanel title={'listLabel' in current ? current.listLabel : current.label} eyebrow="Selected summary" action={<span className="type-caption">{'listNote' in current ? current.listNote : `${current.rows.length} shown`}</span>}>
        <div className="portal-list portal-summary-list" aria-live="polite">
          {current.rows.map(([client, pet, detail, status, amount]) => (
            <article className="portal-summary-row" key={`${client}-${detail}`}>
              <div><strong className="type-body-bold">{client}</strong><span className="type-caption">{pet}</span></div>
              <span className="type-body">{detail}</span>
              {amount && <strong className="type-body-bold">{amount}</strong>}
              <span className={`portal-status portal-status--${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>
            </article>
          ))}
        </div>
      </PortalPanel>

      <div className="portal-dashboard-grid">
        <PortalPanel title="Today’s Schedule" eyebrow="Friday, August 14" action={<span className="type-caption">8 bookings</span>}>
          <div className="portal-list">
            {SCHEDULE.map(([time, pet, service, status]) => (
              <article className="portal-list-row" key={`${time}-${pet}`}>
                <time className="type-body-bold">{time}</time>
                <div><strong className="type-body-bold">{pet}</strong><span className="type-caption">{service}</span></div>
                <span className={`portal-status portal-status--${status.toLowerCase()}`}>{status}</span>
              </article>
            ))}
          </div>
        </PortalPanel>

        <PortalPanel title="Needs Your Attention" eyebrow="Up next">
          <div className="portal-task-list">
            <article><span className="portal-task-icon">3</span><div><strong className="type-body-bold">Booking Requests</strong><p className="type-caption">Review dates, capacity, and service details.</p></div></article>
            <article><span className="portal-task-icon">4</span><div><strong className="type-body-bold">Client Charges</strong><p className="type-caption">Pending and past-due charges total $615.</p></div></article>
            <article><span className="portal-task-icon">2</span><div><strong className="type-body-bold">Missing Pet Details</strong><p className="type-caption">Two profiles need care instructions.</p></div></article>
          </div>
        </PortalPanel>
      </div>

    </div>
  );
}
