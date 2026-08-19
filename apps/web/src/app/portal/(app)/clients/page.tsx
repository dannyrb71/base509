import type { Metadata } from 'next';
import { PortalPageHeader, PortalPanel } from '@/components/PortalShell';
import { getPortalContext } from '@/lib/portal/session';

export const metadata: Metadata = { title: 'Clients' };

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  blocked: 'Blocked',
  ended: 'Ended',
};

/**
 * Real tenant clients (A1 step 4 — replaced the demo roster). Reads are
 * scoped by RLS to the authenticated membership's business; a brand-new
 * tenant honestly shows zero clients. Client INVITES arrive with the
 * booking/invite slice — this page is read-only until then.
 */
export default async function PortalClientsPage() {
  const ctx = await getPortalContext();
  const { data: clients, error } = await ctx.supabase
    .from('clients')
    .select('id, display_name, status, created_at')
    .eq('business_id', ctx.active.id)
    .order('created_at', { ascending: false });

  return (
    <div className="portal-page">
      <PortalPageHeader
        eyebrow="Clients"
        title="Clients"
        body={`The households connected to ${ctx.active.name}. Client invites open up with the booking slice — new connections will appear here.`}
      />
      <PortalPanel title={`All clients (${clients?.length ?? 0})`} eyebrow="Roster">
        {error && <p className="type-body">Couldn&rsquo;t load clients: {error.message}</p>}
        {!error && (clients?.length ?? 0) === 0 && (
          <p className="type-body">
            No clients yet — when your invite code ships (booking slice), the households
            that join will show up here automatically.
          </p>
        )}
        {!error && (clients?.length ?? 0) > 0 && (
          <table className="portal-table">
            <thead>
              <tr><th>Client</th><th>Status</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {clients!.map((c) => (
                <tr key={c.id as string}>
                  <td className="type-body-bold">{c.display_name as string}</td>
                  <td>{STATUS_LABEL[c.status as string] ?? (c.status as string)}</td>
                  <td>{new Date(c.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PortalPanel>
    </div>
  );
}
