'use client';

import { useMemo, useState } from 'react';
import { PortalModal, PortalPageHeader, PortalPanel, PortalStatCard } from '@/components/PortalShell';

type ClientGroup = 'active' | 'pending' | 'meet';
type Client = { client: string; pets: string; petNames: readonly string[]; service: string; date: string; status: string; group: ClientGroup; email: string; phone: string; address: string; emergency: string; notes: string };

const BASE_CLIENTS = [
  { client: 'Alex Morgan', pets: 'Bella · Coco', petNames: ['Bella', 'Coco'], service: 'Boarding', date: 'Aug 18', status: 'Active', group: 'active', email: 'alex@example.com', phone: '(415) 555-0142', address: '128 Castro Street, San Francisco', emergency: 'Jamie Morgan · (415) 555-0191', notes: 'Bella prefers quiet introductions. Coco takes dinner at 5:30 PM.' },
  { client: 'Jules Patel', pets: 'Mabel', petNames: ['Mabel'], service: 'Daycare', date: 'Aug 14', status: 'Active', group: 'active', email: 'jules@example.com', phone: '(415) 555-0155', address: '440 Noe Street, San Francisco', emergency: 'Ravi Patel · (415) 555-0172', notes: 'Mabel is cleared for group play.' },
  { client: 'Priya Shah', pets: 'Buttons · Pepper', petNames: ['Buttons', 'Pepper'], service: 'Boarding', date: 'Aug 16', status: 'Meet & Greet', group: 'meet', email: 'priya@example.com', phone: '(415) 555-0138', address: '919 Valencia Street, San Francisco', emergency: 'Mina Shah · (415) 555-0118', notes: 'Meet & Greet requested for August 16.' },
  { client: 'Sam Rivera', pets: 'Winston', petNames: ['Winston'], service: 'Dog Walking', date: '—', status: 'Invite Pending', group: 'pending', email: 'sam@example.com', phone: '(415) 555-0188', address: '21 Waller Street, San Francisco', emergency: 'Not yet provided', notes: 'Invitation expires August 21.' },
  { client: 'Taylor Kim', pets: 'Luna', petNames: ['Luna'], service: 'Boarding', date: 'Jul 29', status: 'Active', group: 'active', email: 'taylor@example.com', phone: '(415) 555-0121', address: '72 Guerrero Street, San Francisco', emergency: 'Chris Kim · (415) 555-0112', notes: 'Luna is a returning boarding client.' },
  { client: 'Morgan Lee', pets: 'Pepper', petNames: ['Pepper'], service: 'Boarding', date: '—', status: 'Invite Pending', group: 'pending', email: 'morgan@example.com', phone: '(415) 555-0164', address: '601 Haight Street, San Francisco', emergency: 'Not yet provided', notes: 'Invitation sent August 13.' },
  { client: 'Casey Reed', pets: 'Milo', petNames: ['Milo'], service: 'Daycare', date: 'Aug 20', status: 'Meet & Greet', group: 'meet', email: 'casey@example.com', phone: '(415) 555-0107', address: '88 Sanchez Street, San Francisco', emergency: 'Drew Reed · (415) 555-0182', notes: 'First daycare Meet & Greet scheduled.' },
] as const satisfies readonly Client[];

const FIRST_NAMES = ['Avery', 'Blake', 'Cameron', 'Dana', 'Elliot', 'Frankie', 'Georgia', 'Harper', 'Isla', 'Jordan', 'Kendall', 'Logan', 'Maya', 'Noah', 'Olive', 'Parker', 'Quinn', 'Riley', 'Sasha', 'Theo'];
const LAST_NAMES = ['Adams', 'Brooks', 'Carter', 'Diaz', 'Ellis', 'Foster', 'Garcia', 'Hayes', 'Iverson', 'James', 'Keller', 'Lopez'];
const PET_NAMES = ['Archie', 'Biscuit', 'Clover', 'Duke', 'Ember', 'Fig', 'Gus', 'Hazel', 'Indie', 'Juno', 'Koda', 'Lola', 'Maple', 'Nori', 'Otis', 'Poppy', 'Rufus', 'Sunny', 'Tilly', 'Waffles'];
const STREETS = ['Church Street', 'Dolores Street', 'Diamond Street', 'Elizabeth Street', 'Fair Oaks Street', 'Liberty Street'];
const ROSTER_SERVICES = ['Boarding', 'Daycare', 'Dog Walking'];

const GENERATED_CLIENTS: Client[] = Array.from({ length: 39 }, (_, index) => {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const client = `${first} ${LAST_NAMES[(index * 5 + 3) % LAST_NAMES.length]}`;
  const pet = PET_NAMES[(index * 7 + 1) % PET_NAMES.length];
  const service = ROSTER_SERVICES[index % ROSTER_SERVICES.length];
  const date = `${index % 2 === 0 ? 'Aug' : 'Jul'} ${(index * 3) % 27 + 1}`;
  return {
    client, pets: pet, petNames: [pet], service, date, status: 'Active', group: 'active',
    email: `${first.toLowerCase()}${index}@example.com`, phone: `(415) 555-0${String(200 + index)}`,
    address: `${(index * 13) % 900 + 20} ${STREETS[index % STREETS.length]}, San Francisco`,
    emergency: `${FIRST_NAMES[(index + 9) % FIRST_NAMES.length]} · (415) 555-0${String(300 + index)}`,
    notes: `${pet} is a returning ${service.toLowerCase()} client.`,
  };
});

const EXTRA_STATUS_CLIENTS: Client[] = [
  { client: 'Rowan Bell', pets: 'Ziggy', petNames: ['Ziggy'], service: 'Daycare', date: '—', status: 'Invite Pending', group: 'pending', email: 'rowan@example.com', phone: '(415) 555-0177', address: '310 Dolores Street, San Francisco', emergency: 'Not yet provided', notes: 'Invitation sent August 14.' },
  { client: 'Emerson Cole', pets: 'Banjo', petNames: ['Banjo'], service: 'Dog Walking', date: '—', status: 'Invite Pending', group: 'pending', email: 'emerson@example.com', phone: '(415) 555-0169', address: '52 Liberty Street, San Francisco', emergency: 'Not yet provided', notes: 'Invitation sent August 12.' },
  { client: 'Marley Quinn', pets: 'Pickle', petNames: ['Pickle'], service: 'Boarding', date: 'Aug 22', status: 'Meet & Greet', group: 'meet', email: 'marley@example.com', phone: '(415) 555-0193', address: '740 Church Street, San Francisco', emergency: 'Jesse Quinn · (415) 555-0129', notes: 'Meet & Greet scheduled for August 22.' },
];

const CLIENTS: readonly Client[] = [...BASE_CLIENTS, ...GENERATED_CLIENTS, ...EXTRA_STATUS_CLIENTS].sort((a, b) => a.client.localeCompare(b.client));

type ClientTab = 'overview' | 'pets' | 'history';

const FILTERS = {
  active: ['Active Clients', '42', 'Across 58 pet profiles'],
  pending: ['Pending Invites', '4', 'Invitations awaiting acceptance'],
  meet: ['Meet & Greets', '3', 'Required before first service'],
} as const;

export function PortalClientsView() {
  const [filter, setFilter] = useState<keyof typeof FILTERS>('active');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientTab, setClientTab] = useState<ClientTab>('overview');
  const rows = useMemo(() => CLIENTS.filter((client) => {
    const matchesFilter = client.group === filter;
    const needle = query.trim().toLowerCase();
    return matchesFilter && (!needle || `${client.client} ${client.pets}`.toLowerCase().includes(needle));
  }), [filter, query]);

  const downloadCsv = () => {
    const header = ['Client', 'Email', 'Phone', 'Pets', 'Last Service', 'Last Booking', 'Status'];
    const lines = CLIENTS.map((client) => [client.client, client.email, client.phone, client.pets, client.service, client.date, client.status]);
    const csv = [header, ...lines].map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'petappro-client-roster.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('Client roster CSV downloaded.');
  };

  const openClient = (client: Client) => { setSelectedClient(client); setClientTab('overview'); };
  const clientAction = (action: string) => {
    if (!selectedClient) return;
    setNotice(`${action} opened for ${selectedClient.client}.`);
  };

  return (
    <div className="portal-page">
      <PortalPageHeader eyebrow="Clients" title="Clients & Roster" body="Manage households, pets, invitations, meet-and-greets, and the records your team needs." action={<button className="btn btn--cta type-button" type="button" onClick={() => setNotice('Add Client opened.')}>Add Client</button>} />
      <div className="portal-stat-grid portal-stat-grid--three">
        {(Object.keys(FILTERS) as (keyof typeof FILTERS)[]).map((key) => {
          const [label, value, detail] = FILTERS[key];
          return <PortalStatCard key={key} label={label} value={value} detail={detail} tone={key === 'active' ? 'accent' : 'default'} active={filter === key} onClick={() => setFilter(key)} />;
        })}
      </div>
      <PortalPanel title="Client Roster" eyebrow={FILTERS[filter][0]} action={<button className="btn btn--cta type-button portal-download-button" type="button" onClick={downloadCsv}><span aria-hidden="true">↓</span> Download CSV</button>}>
        <div className="portal-toolbar portal-client-toolbar">
          <label className="portal-search type-body" htmlFor="portal-client-search"><span className="type-body-bold">Search Clients</span><input id="portal-client-search" type="search" placeholder="Search clients or pets" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <span className="type-caption">{rows.length} clients</span>
        </div>
        <div className="portal-table-wrap portal-table-wrap--scroll">
          <table className="portal-table type-body">
            <thead><tr><th>Client</th><th>Pets</th><th>Last Service</th><th>Last Booking</th><th>Status</th><th><span className="visually-hidden">Manage</span></th></tr></thead>
            <tbody>{rows.map((client) => <tr key={client.client}><th scope="row">{client.client}</th><td>{client.pets}</td><td>{client.service}</td><td>{client.date}</td><td><span className={`portal-status portal-status--${client.group}`}>{client.status}</span></td><td><button className="portal-text-button type-body-bold" type="button" onClick={() => openClient(client)}>Manage</button></td></tr>)}</tbody>
          </table>
          {rows.length === 0 && <p className="portal-empty-state type-body">No clients match this filter and search.</p>}
        </div>
      </PortalPanel>

      <PortalModal open={Boolean(selectedClient)} onClose={() => setSelectedClient(null)} eyebrow="Client Record" title={selectedClient?.client ?? 'Client'} wide>
        {selectedClient && <>
          <div className="portal-client-record__summary"><div><span className={`portal-status portal-status--${selectedClient.group}`}>{selectedClient.status}</span><p className="type-body">{selectedClient.pets} · {selectedClient.service}</p></div><div className="portal-client-record__actions"><button className="btn btn--cta type-button" type="button" onClick={() => clientAction('Edit Client')}>Edit Client</button><button className="btn btn--secondary type-button" type="button" onClick={() => clientAction('Create Booking')}>Create Booking</button></div></div>
          <div className="portal-record-tabs" role="tablist" aria-label="Client record sections">{(['overview', 'pets', 'history'] as ClientTab[]).map((tab) => <button type="button" role="tab" aria-selected={clientTab === tab} className={clientTab === tab ? 'is-active' : undefined} key={tab} onClick={() => setClientTab(tab)}>{tab === 'pets' ? 'Pets' : tab === 'history' ? 'Booking History' : 'Overview'}</button>)}</div>
          {clientTab === 'overview' && <div className="portal-client-record-grid"><section><h3 className="type-title">Contact & Household</h3><dl className="portal-definition-list type-body"><div><dt>Email</dt><dd>{selectedClient.email}</dd></div><div><dt>Phone</dt><dd>{selectedClient.phone}</dd></div><div><dt>Address</dt><dd>{selectedClient.address}</dd></div><div><dt>Emergency Contact</dt><dd>{selectedClient.emergency}</dd></div></dl></section><section><h3 className="type-title">Provider Notes</h3><textarea className="portal-record-notes type-body" rows={8} defaultValue={selectedClient.notes} /><p className="type-caption">Private to the provider team. Never visible to the client.</p></section></div>}
          {clientTab === 'pets' && <div className="portal-pet-record-grid">{selectedClient.petNames.map((pet, index) => <article key={pet}><span className="portal-pet-avatar type-title">{pet.charAt(0)}</span><div><h3 className="type-title">{pet}</h3><p className="type-body">{index === 0 ? 'Care instructions, feeding, medications, vet and emergency details.' : 'Pet profile, household relationship, photos, and service eligibility.'}</p></div><button className="portal-text-button type-body-bold" type="button" onClick={() => clientAction(`Edit ${pet}`)}>Edit Profile</button></article>)}</div>}
          {clientTab === 'history' && <div className="portal-table-wrap"><table className="portal-table type-body"><thead><tr><th>Date</th><th>Service</th><th>Status</th><th>Amount</th></tr></thead><tbody><tr><th scope="row">{selectedClient.date}</th><td>{selectedClient.service}</td><td><span className="portal-status portal-status--paid">Completed</span></td><td>$120.00</td></tr><tr><th scope="row">Jul 12</th><td>{selectedClient.service}</td><td><span className="portal-status portal-status--paid">Paid</span></td><td>$80.00</td></tr></tbody></table></div>}
          <div className="portal-client-record__footer"><button className="portal-remove-button type-body-bold" type="button" onClick={() => clientAction('Archive Client')}>Archive Client</button><button className="portal-text-button type-body-bold" type="button" onClick={() => clientAction(selectedClient.group === 'pending' ? 'Resend Invite' : 'Send Message')}>{selectedClient.group === 'pending' ? 'Resend Invite' : 'Send Message'}</button></div>
        </>}
      </PortalModal>

      {notice && <p className="portal-inline-notice type-body" role="status">{notice}</p>}
    </div>
  );
}
