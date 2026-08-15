'use client';

import Image from 'next/image';
import { useMemo, useState, type CSSProperties } from 'react';
import { PortalModal, PortalPageHeader, PortalStatCard } from '@/components/PortalShell';

type Period = 'week' | 'month' | 'quarter' | 'year';
type ReportTab = 'revenue' | 'bookings' | 'customers' | 'rates';
type Compare = 'previous' | 'yoy' | 'none';

const PERIOD_DATA = {
  week: { earnings: 2480, collected: 2180, bookings: 18, clients: 4, average: 138, discounts: 95, series: [220, 410, 360, 520, 470, 310, 190], collectedSeries: [180, 390, 310, 460, 420, 260, 160], labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] },
  month: { earnings: 8498, collected: 5800, bookings: 33, clients: 11, average: 216, discounts: 310, series: [480, 320, 610, 540, 790, 680, 470, 910, 720, 510, 830, 760], collectedSeries: [510, 190, 290, 0, 650, 610, 0, 780, 0, 0, 420, 140], labels: ['1', '3', '5', '7', '9', '11', '13', '15', '17', '19', '21', '23'] },
  quarter: { earnings: 21340, collected: 17200, bookings: 84, clients: 21, average: 254, discounts: 720, series: [5200, 7900, 8240], collectedSeries: [4400, 6400, 6400], labels: ['Jun', 'Jul', 'Aug'] },
  year: { earnings: 29495, collected: 16802, bookings: 117, clients: 17, average: 252, discounts: 1250, series: [0, 0, 0, 0, 0, 2400, 11900, 8500, 2900, 2500, 900, 395], collectedSeries: [0, 0, 0, 0, 0, 2800, 8400, 5600, 0, 0, 0, 2], labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] },
} as const;

const SERVICES = { all: 1, boarding: .63, daycare: .24, walking: .13 } as const;
const KPI_LABELS = ['Earnings', 'Collected', 'Bookings', 'New Clients', 'Avg. Booking', 'Referrals / Discounts'] as const;
const TOP_CLIENTS = [['Alex Morgan', 10, 1840], ['Jules Patel', 8, 1510], ['Priya Shah', 6, 1280], ['Taylor Kim', 5, 1040], ['Casey Reed', 4, 890]] as const;

function money(value: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value); }

function periodLabel(period: Period, dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00`);
  if (period === 'year') return String(date.getFullYear());
  if (period === 'quarter') return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
  if (period === 'month') return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
  const start = new Date(date); start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return `${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(start)}–${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(end)}`;
}

function monotonePath(points: Array<[number, number]>) {
  const count = points.length;
  if (count === 0) return '';
  if (count === 1) return `M${points[0][0]},${points[0][1]}`;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let index = 0; index < count - 1; index += 1) {
    dx[index] = points[index + 1][0] - points[index][0];
    slope[index] = (points[index + 1][1] - points[index][1]) / dx[index];
  }
  const tangent: number[] = [slope[0]];
  for (let index = 1; index < count - 1; index += 1) tangent[index] = slope[index - 1] * slope[index] <= 0 ? 0 : (slope[index - 1] + slope[index]) / 2;
  tangent[count - 1] = slope[count - 2];
  for (let index = 0; index < count - 1; index += 1) {
    if (slope[index] === 0) { tangent[index] = 0; tangent[index + 1] = 0; continue; }
    const alpha = tangent[index] / slope[index];
    const beta = tangent[index + 1] / slope[index];
    const magnitude = alpha * alpha + beta * beta;
    if (magnitude > 9) {
      const scale = 3 / Math.sqrt(magnitude);
      tangent[index] = scale * alpha * slope[index];
      tangent[index + 1] = scale * beta * slope[index];
    }
  }
  let path = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let index = 0; index < count - 1; index += 1) {
    const control1X = points[index][0] + dx[index] / 3;
    const control1Y = points[index][1] + tangent[index] * dx[index] / 3;
    const control2X = points[index + 1][0] - dx[index] / 3;
    const control2Y = points[index + 1][1] - tangent[index + 1] * dx[index] / 3;
    path += `C${control1X.toFixed(1)},${control1Y.toFixed(1)} ${control2X.toFixed(1)},${control2Y.toFixed(1)} ${points[index + 1][0].toFixed(1)},${points[index + 1][1].toFixed(1)}`;
  }
  return path;
}

function LineChart({ earned, collected, comparisonEarned, comparisonCollected, labels, chartKey }: { earned: readonly number[]; collected: readonly number[]; comparisonEarned?: readonly number[]; comparisonCollected?: readonly number[]; labels: readonly string[]; chartKey: string }) {
  const maximum = Math.max(...earned, ...collected, ...(comparisonEarned ?? []), ...(comparisonCollected ?? []), 1);
  const curve = (values: readonly number[]) => monotonePath(values.map((value, index) => [40 + (index * 520 / Math.max(1, values.length - 1)), 205 - value / maximum * 165]));
  return <div className="portal-chart" key={chartKey}><svg viewBox="0 0 600 240" role="img" aria-label="Earnings and Collected over the selected period"><g className="portal-chart__grid">{[40, 80, 120, 160, 200].map((y) => <line x1="40" x2="560" y1={y} y2={y} key={y} />)}</g>{comparisonEarned && <path className="portal-chart__line portal-chart__line--comparison" d={curve(comparisonEarned)} />}{comparisonCollected && <path className="portal-chart__line portal-chart__line--comparison portal-chart__line--comparison-collected" d={curve(comparisonCollected)} />}<path className="portal-chart__line portal-chart__line--earnings" d={curve(earned)} pathLength={1} /><path className="portal-chart__line portal-chart__line--collected" d={curve(collected)} pathLength={1} />{labels.map((label, index) => <text x={40 + (index * 520 / Math.max(1, labels.length - 1))} y="228" textAnchor="middle" key={`${label}-${index}`}>{label}</text>)}</svg><div className="portal-chart-legend"><span><i className="is-earnings" />Earnings</span><span><i className="is-collected" />Collected</span>{comparisonEarned && <span><i className="is-comparison" />Comparison Period</span>}</div></div>;
}

function Donut({ primary, first, second }: { primary: number; first: string; second: string }) {
  const style = { '--donut-stop': `${primary}%` } as CSSProperties;
  return <div className="portal-donut-layout"><div className="portal-donut" style={style} aria-label={`${first} ${primary} percent; ${second} ${100 - primary} percent`} /><div className="portal-chart-legend portal-chart-legend--stack"><span><i className="is-earnings" />{first} <strong>{primary}%</strong></span><span><i className="is-collected" />{second} <strong>{100 - primary}%</strong></span></div></div>;
}

export function PortalReportsView() {
  const [period, setPeriod] = useState<Period>('month');
  const [anchorDate, setAnchorDate] = useState('2026-08-14');
  const [compare, setCompare] = useState<Compare>('previous');
  const [service, setService] = useState<keyof typeof SERVICES>('all');
  const [tab, setTab] = useState<ReportTab>('revenue');
  const [detail, setDetail] = useState<string | null>(null);
  const factor = SERVICES[service];
  const base = PERIOD_DATA[period];
  const metrics = useMemo(() => ({ earnings: base.earnings * factor, collected: base.collected * factor, bookings: Math.round(base.bookings * factor), clients: Math.max(1, Math.round(base.clients * factor)), average: base.average, discounts: base.discounts * factor }), [base, factor]);
  const series = base.series.map((value) => Math.round(value * factor));
  const collectedSeries = base.collectedSeries.map((value) => Math.round(value * factor));
  const comparisonFactor = compare === 'yoy' ? .88 : 1.08;
  const comparisonSeries = compare === 'none' ? undefined : series.map((value) => Math.round(value * comparisonFactor));
  const comparisonCollectedSeries = compare === 'none' ? undefined : collectedSeries.map((value) => Math.round(value * comparisonFactor));
  const delta = compare === 'none' ? 'No comparison' : compare === 'yoy' ? '+12% vs. last year' : '-8% vs. previous';
  const label = periodLabel(period, anchorDate);
  const chartKey = `${period}-${anchorDate}-${compare}-${service}`;

  const shiftPeriod = (direction: -1 | 1) => {
    const next = new Date(`${anchorDate}T12:00:00`);
    if (period === 'week') next.setDate(next.getDate() + direction * 7);
    if (period === 'month') next.setMonth(next.getMonth() + direction);
    if (period === 'quarter') next.setMonth(next.getMonth() + direction * 3);
    if (period === 'year') next.setFullYear(next.getFullYear() + direction);
    setAnchorDate(next.toISOString().slice(0, 10));
  };

  const exportCsv = () => {
    const rows = [['Period', 'Service', 'Earnings', 'Collected', 'Bookings', 'New Clients', 'Average Booking', 'Referrals / Discounts'], [label, service, metrics.earnings.toFixed(2), metrics.collected.toFixed(2), String(metrics.bookings), String(metrics.clients), metrics.average.toFixed(2), metrics.discounts.toFixed(2)]];
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a'); link.href = url; link.download = `petappro-reports-${period}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  const cards = [money(metrics.earnings), money(metrics.collected), String(metrics.bookings), String(metrics.clients), money(metrics.average), money(metrics.discounts)];

  return (
    <div className="portal-page portal-reports">
      <PortalPageHeader eyebrow="Reports" title="Business Reports" body="Compare performance across periods and services, understand demand and client behavior, and export the current view." action={<button className="btn btn--cta type-button portal-download-button" type="button" onClick={exportCsv}><span aria-hidden="true">↓</span> Export CSV</button>} />

      <div className="portal-report-controls">
        <div className="portal-report-periods" aria-label="Report period">{(['week', 'month', 'quarter', 'year'] as Period[]).map((item) => <button type="button" className={period === item ? 'is-active' : undefined} aria-pressed={period === item} key={item} onClick={() => setPeriod(item)}>{item.charAt(0).toUpperCase() + item.slice(1)}</button>)}</div>
        <div className="portal-report-date"><button type="button" aria-label="Previous period" onClick={() => shiftPeriod(-1)}><Image src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} /></button><strong className="type-body-bold">{label}</strong><button type="button" aria-label="Next period" onClick={() => shiftPeriod(1)}><Image src="/brands/petappro.com/icon-chevron-down.svg" alt="" width={24} height={24} /></button></div>
        <label className="portal-report-calendar type-caption"><span>Calendar Date</span><input type="date" value={anchorDate} onChange={(event) => setAnchorDate(event.target.value)} /></label>
        <select className="portal-role-select" aria-label="Compare report" value={compare} onChange={(event) => setCompare(event.target.value as Compare)}><option value="none">No comparison</option><option value="previous">vs. previous</option><option value="yoy">vs. last year (YoY)</option></select>
        <select className="portal-role-select" aria-label="Filter reports by service" value={service} onChange={(event) => setService(event.target.value as keyof typeof SERVICES)}><option value="all">All Services</option><option value="boarding">Boarding</option><option value="daycare">Daycare</option><option value="walking">Dog Walking</option></select>
      </div>

      <div className="portal-report-kpis">{KPI_LABELS.map((kpi, index) => <PortalStatCard key={kpi} label={kpi} value={cards[index]} detail={delta} tone={index === 0 ? 'accent' : 'default'} onClick={() => setDetail(kpi)} />)}</div>

      <div className="portal-report-tabs" role="tablist" aria-label="Report categories">{([['revenue', 'Revenue'], ['bookings', 'Bookings & Demand'], ['customers', 'Customers'], ['rates', 'Rate Mix']] as const).map(([key, title]) => <button role="tab" aria-selected={tab === key} type="button" className={tab === key ? 'is-active' : undefined} key={key} onClick={() => setTab(key)}>{title}</button>)}</div>

      {tab === 'revenue' && <div className="portal-report-section"><section className="card portal-report-card portal-report-card--wide"><h2 className="type-title">Earnings vs. Collected</h2><LineChart earned={series} collected={collectedSeries} comparisonEarned={comparisonSeries} comparisonCollected={comparisonCollectedSeries} labels={base.labels} chartKey={chartKey} /><p className="type-caption">Earnings = value of services delivered in the period. Collected = payments received in the period.</p></section><div className="portal-report-card-grid"><section className="card portal-report-card"><h2 className="type-title">Earnings by Service</h2><Donut primary={service === 'all' ? 76 : 100} first={service === 'all' ? 'Boarding' : service} second={service === 'all' ? 'Daycare & Walking' : 'Other'} /></section><section className="card portal-report-card"><h2 className="type-title">Booked Value by Payment</h2><Donut primary={84} first="Stripe Card" second="Cash & Other" /></section></div></div>}

      {tab === 'bookings' && <section className="card portal-report-card portal-report-card--wide"><h2 className="type-title">Bookings Over Time</h2><div className="portal-bar-chart" key={chartKey}>{base.series.map((value, index) => <span key={index}><i style={{ height: `${Math.max(3, value / Math.max(...base.series) * 100)}%`, animationDelay: `${index * 45}ms` }} /><small>{base.labels[index]}</small></span>)}</div><p className="type-body">Median booking lead time this period: <strong>5 days</strong> from booking to service.</p></section>}

      {tab === 'customers' && <div className="portal-report-section"><div className="portal-report-card-grid"><section className="card portal-report-card"><h2 className="type-title">New vs. Returning</h2><Donut primary={38} first="New" second="Returning" /></section><section className="card portal-report-card portal-cadence"><h2 className="type-title">Booking Cadence</h2><strong className="type-display">8</strong><p className="type-body">median days between a client’s bookings</p></section></div><section className="card portal-report-card portal-report-card--wide"><h2 className="type-title">Top Clients This Period</h2><ol className="portal-top-clients">{TOP_CLIENTS.map(([name, bookings, amount]) => <li key={name}><span className="type-body-bold">{name}</span><small className="type-body">{bookings} bookings</small><strong className="type-body-bold">{money(amount * factor)}</strong></li>)}</ol></section></div>}

      {tab === 'rates' && <section className="card portal-report-card portal-report-card--wide"><h2 className="type-title">Units by Rate Type</h2><div className="portal-rate-mix"><Donut primary={56} first="Extended" second="Regular & Holiday" /><dl className="portal-definition-list type-body"><div><dt>Regular</dt><dd>27%</dd></div><div><dt>Extended</dt><dd>56%</dd></div><div><dt>Holiday</dt><dd>9%</dd></div><div><dt>Daycare</dt><dd>8%</dd></div></dl></div><p className="type-caption">Rate dimensions adapt to the selected service’s pricing model.</p></section>}

      <PortalModal open={Boolean(detail)} onClose={() => setDetail(null)} eyebrow={`${label} · ${service === 'all' ? 'All Services' : service}`} title={`${detail ?? ''} Detail`}>
        <div className="portal-kpi-detail"><p className="type-body">Breakdown by the next-finer time increment in the selected period.</p><div className="portal-kpi-detail__rows">{base.labels.slice(0, 6).map((item, index) => <div key={`${item}-${index}`}><span className="type-body">{item}</span><strong className="type-body-bold">{detail?.includes('Booking') || detail === 'New Clients' ? Math.max(1, Math.round((index + 1) * factor)) : money((index + 1) * 112 * factor)}</strong></div>)}</div></div>
      </PortalModal>

    </div>
  );
}
