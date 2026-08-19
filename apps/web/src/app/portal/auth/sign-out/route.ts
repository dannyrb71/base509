import { type NextRequest } from 'next/server';
import { portalRedirect } from '@/lib/portal/redirect';
import { createPortalServerClient } from '@/lib/portal/supabase-server';
import { ACTIVE_BUSINESS_COOKIE } from '@/lib/portal/session';

/** Signs out the current portal session (POST — never a crawlable GET). */
export async function POST(req: NextRequest) {
  const supabase = await createPortalServerClient();
  await supabase.auth.signOut();
  const res = portalRedirect(req, '/sign-in', 303);
  res.cookies.delete(ACTIVE_BUSINESS_COOKIE);
  return res;
}
