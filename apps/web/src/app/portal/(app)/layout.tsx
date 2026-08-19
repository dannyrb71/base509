import { PortalPlanProvider } from '@/components/PortalPlanProvider';
import { PortalShell } from '@/components/PortalShell';
import { getPortalContext } from '@/lib/portal/session';

/**
 * Authenticated portal frame (A1 steps 3–4). Everything tenant-shaped is
 * resolved SERVER-side once per request (React cache): verified session →
 * idempotent bootstrap → the caller's own memberships → active business →
 * effective entitlements (fail-closed Starter). The plan provider is seeded
 * with the REAL tier — the portal renders the tenant's actual entitlements,
 * not the old demo default.
 */
export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getPortalContext();
  return (
    <PortalPlanProvider
      initialPlanKey={ctx.entitlements.planKey}
      business={{
        id: ctx.active.id,
        name: ctx.active.name,
        slug: ctx.active.slug,
        role: ctx.active.role,
        email: ctx.user.email ?? '',
      }}
    >
      <PortalShell businessName={ctx.active.name} userEmail={ctx.user.email ?? ''}>
        {children}
      </PortalShell>
    </PortalPlanProvider>
  );
}
