import type { Metadata } from 'next';
import { PortalBusinessView } from '@/components/PortalBusinessView';
import { getPortalContext } from '@/lib/portal/session';
import { saveBrandTheme, saveBusinessProfile } from './actions';

export const metadata: Metadata = { title: 'Business' };

export default async function PortalBusinessPage() {
  const ctx = await getPortalContext();
  return (
    <PortalBusinessView
      initialProfile={{
        name: ctx.active.name,
        timezone: ctx.active.timezone,
        currency: ctx.active.currency,
      }}
      saveProfile={saveBusinessProfile}
      initialBrand={{ themeKey: ctx.active.themeKey, themeMode: ctx.active.themeMode }}
      saveTheme={saveBrandTheme}
    />
  );
}
