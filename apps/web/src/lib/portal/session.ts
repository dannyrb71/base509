import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createPortalServerClient } from './supabase-server';

/**
 * Portal session + tenant resolution (Phase A/A1).
 *
 * The server resolves everything (architecture §3.4/§8): the caller's
 * account comes from the verified session via the CFG-1 bootstrap RPC; the
 * active business comes from the caller's OWN memberships. A client-supplied
 * slug/cookie is only ever a SELECTOR validated against those memberships —
 * never trusted; RLS independently enforces every row's tenancy.
 */

export type PortalBusiness = {
  id: string;
  name: string;
  slug: string | null;
  timezone: string;
  currency: string;
  role: 'owner' | 'admin' | 'manager' | 'staff';
};

export type PortalEntitlements = {
  planKey: string;
  clientLimit: number | null;
  seatLimit: number | null;
  themeAllowlist: string[] | null;
};

/** UX hint only — always re-validated against memberships (never authority). */
export const ACTIVE_BUSINESS_COOKIE = 'pa-active-business';

export async function getPortalUser(): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const supabase = await createPortalServerClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

/** Middleware already gates protected routes; this is the in-page belt. */
export async function requirePortalUser(): Promise<{ supabase: SupabaseClient; user: User }> {
  const { supabase, user } = await getPortalUser();
  // /portal/sign-in canonicalizes to /sign-in on the app host (middleware).
  if (!user) redirect('/portal/sign-in');
  return { supabase, user };
}

export async function listMemberships(supabase: SupabaseClient): Promise<PortalBusiness[]> {
  const { data: memberships, error } = await supabase
    .from('business_memberships')
    .select('business_id, role, created_at')
    .eq('status', 'active')
    .order('created_at');
  if (error) throw new Error(`membership lookup failed: ${error.message}`);
  if (!memberships || memberships.length === 0) return [];

  const ids = memberships.map((m) => m.business_id as string);
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, slug, timezone, currency')
    .in('id', ids);
  if (bizError) throw new Error(`business lookup failed: ${bizError.message}`);

  return memberships.flatMap((m) => {
    const b = (businesses ?? []).find((x) => x.id === m.business_id);
    return b
      ? [{
          id: b.id as string,
          name: b.name as string,
          slug: (b.slug as string | null) ?? null,
          timezone: b.timezone as string,
          currency: b.currency as string,
          role: m.role as PortalBusiness['role'],
        }]
      : [];
  });
}

/**
 * Idempotent first-session bootstrap (A1 step 2): resolve/mint the stable
 * account, record the owner's display name once, and create the FIRST
 * business for a brand-new account from the sign-up metadata (business name
 * falls back to the owner's name — names are not unique; the tenant key is
 * business_id). The idempotency key for the first business is the auth user
 * id, so retries after crashes/redirect loops can never double-create.
 * Additional businesses per account arrive via a later portal flow with
 * fresh keys (many-to-many by design).
 */
export async function ensureBootstrap(
  supabase: SupabaseClient,
  user: User,
): Promise<PortalBusiness[]> {
  const { data: accountId, error: bootErr } = await supabase.rpc('bootstrap_account');
  if (bootErr) throw new Error(`account bootstrap failed: ${bootErr.message}`);

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const ownerName = typeof meta.owner_name === 'string' ? meta.owner_name.trim() : '';
  if (ownerName) {
    // Self-scoped write (RLS: own row, display_name column only); set-once.
    await supabase
      .from('base509_accounts')
      .update({ display_name: ownerName })
      .eq('base509_account_id', accountId)
      .is('display_name', null);
  }

  let memberships = await listMemberships(supabase);
  if (memberships.length === 0) {
    const businessName =
      (typeof meta.business_name === 'string' && meta.business_name.trim()) ||
      ownerName ||
      user.email?.split('@')[0] ||
      'My business';
    const { error: bizErr } = await supabase.rpc('create_business', {
      p_name: businessName,
      p_idempotency_key: user.id,
    });
    if (bizErr) throw new Error(`business bootstrap failed: ${bizErr.message}`);
    memberships = await listMemberships(supabase);
  }
  return memberships;
}

export async function resolveActiveBusiness(
  memberships: PortalBusiness[],
): Promise<PortalBusiness | null> {
  if (memberships.length === 0) return null;
  const hint = (await cookies()).get(ACTIVE_BUSINESS_COOKIE)?.value;
  return memberships.find((m) => m.slug === hint) ?? memberships[0];
}

export async function getEntitlements(
  supabase: SupabaseClient,
  businessId: string,
): Promise<PortalEntitlements> {
  const { data, error } = await supabase.rpc('get_effective_entitlements', {
    p_business_id: businessId,
  });
  if (error || !data) {
    // Fail closed to Starter, matching the DB's own fail-safe posture.
    return { planKey: 'starter', clientLimit: 5, seatLimit: 1, themeAllowlist: ['brandy_blue'] };
  }
  const e = data as Record<string, unknown>;
  const tier = typeof e.tier_key === 'string' ? e.tier_key : 'starter';
  return {
    planKey: ['starter', 'solo', 'duo', 'crew', 'team', 'enterprise'].includes(tier) ? tier : 'starter',
    clientLimit: typeof e.client_limit === 'number' ? e.client_limit : null,
    seatLimit: typeof e.seat_limit === 'number' ? e.seat_limit : null,
    themeAllowlist: Array.isArray(e.theme_allowlist) ? (e.theme_allowlist as string[]) : null,
  };
}

export type PortalContext = {
  supabase: SupabaseClient;
  user: User;
  memberships: PortalBusiness[];
  active: PortalBusiness;
  entitlements: PortalEntitlements;
};

/** One resolution per request, shared by layout + pages (React cache). */
export const getPortalContext = cache(async (): Promise<PortalContext> => {
  const { supabase, user } = await requirePortalUser();
  const memberships = await ensureBootstrap(supabase, user);
  const active = await resolveActiveBusiness(memberships);
  if (!active) {
    // Bootstrap guarantees a business; reaching here means it failed hard.
    throw new Error('No active business membership for this account');
  }
  const entitlements = await getEntitlements(supabase, active.id);
  return { supabase, user, memberships, active, entitlements };
});
