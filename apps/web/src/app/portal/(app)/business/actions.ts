'use server';

import { revalidatePath } from 'next/cache';
import { getPortalContext } from '@/lib/portal/session';

const TIMEZONES = ['America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York'];

/**
 * Minimal tenant profile write (A1 step 4 — proves the tenant round-trips).
 * The active business is resolved SERVER-side from the session; the update
 * is RLS-enforced (businesses_update_admin + column grants), the role check
 * here is just a friendlier error ahead of it. The service-area save stays
 * STUBBED (deferred to the booking slice — see PortalZoneManager).
 */
export async function saveBusinessProfile(input: {
  name: string;
  timezone: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const ctx = await getPortalContext();
  if (ctx.active.role !== 'owner' && ctx.active.role !== 'admin') {
    return { error: 'Only Owners and Admins can edit the business profile.' };
  }
  const name = (input.name ?? '').trim();
  if (!name) return { error: 'Business name can’t be empty.' };
  if (name.length > 120) return { error: 'Business name is too long (120 max).' };
  if (!TIMEZONES.includes(input.timezone)) return { error: 'Pick a listed time zone.' };

  const { error } = await ctx.supabase
    .from('businesses')
    .update({ name, timezone: input.timezone })
    .eq('id', ctx.active.id)
    .select('id')
    .single();
  if (error) return { error: error.message };

  revalidatePath('/portal', 'layout');
  return { ok: true };
}

/**
 * Persist the tenant's selected theme (canonical KEY + mode) into
 * businesses.settings. The key must be in the SERVER-resolved effective
 * entitlement allowlist (canonical keys from the DB projection — null means
 * the full library), so a tampered request can't store a theme the tier
 * doesn't include. Owner/Admin only (business config), RLS-enforced beneath.
 */
export async function saveBrandTheme(input: {
  themeKey: string;
  themeMode: string;
}): Promise<{ ok?: boolean; error?: string }> {
  const { isThemeKey } = await import('@/data/petappro-themes');
  const ctx = await getPortalContext();
  if (ctx.active.role !== 'owner' && ctx.active.role !== 'admin') {
    return { error: 'Only Owners and Admins can change the client-app theme.' };
  }
  if (!isThemeKey(input.themeKey)) return { error: 'Unknown theme.' };
  if (input.themeMode !== 'light' && input.themeMode !== 'dark') {
    return { error: 'Theme mode must be light or dark.' };
  }
  const allowlist = ctx.entitlements.themeAllowlist;
  if (allowlist !== null && !allowlist.includes(input.themeKey)) {
    return { error: 'That theme isn’t included in your plan.' };
  }

  const { data: current, error: readError } = await ctx.supabase
    .from('businesses')
    .select('settings')
    .eq('id', ctx.active.id)
    .single();
  if (readError) return { error: readError.message };

  const settings = {
    ...((current?.settings as Record<string, unknown>) ?? {}),
    theme_key: input.themeKey,
    theme_mode: input.themeMode,
  };
  const { error } = await ctx.supabase
    .from('businesses')
    .update({ settings })
    .eq('id', ctx.active.id)
    .select('id')
    .single();
  if (error) return { error: error.message };

  revalidatePath('/portal', 'layout');
  return { ok: true };
}
