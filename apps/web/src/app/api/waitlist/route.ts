import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { WAITLIST_CONFIRMATION_HTML } from '@/lib/waitlist-email';

export const runtime = 'nodejs';

/** Humans don't complete an email field in under 2.5 seconds. */
const MIN_FILL_MS = 2500;

const CONFIRMATION_TEXT = `Hi!

You're on the waitlist for PetAppro — the booking app for dog-care providers. We'll email you the day the doors open.

Questions in the meantime? Just reply to this email.

— The PetAppro team (a Base509 product)`;

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.json({ error: 'capture backend not configured' }, { status: 501 });

  let body: { email?: unknown; source?: unknown; company?: unknown; startedAt?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'bad request' }, { status: 400 }); }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: 'invalid email' }, { status: 400 });

  // Spam guards. Submissions missing our form's markers, carrying honeypot
  // content, or arriving inhumanly fast get a silent "success" — nothing is
  // stored and bots get no signal to iterate on.
  const startedAt = typeof body.startedAt === 'number' ? body.startedAt : 0;
  const tooFast = !startedAt || Date.now() - startedAt < MIN_FILL_MS;
  if ((typeof body.company === 'string' && body.company.length > 0) || tooFast) return NextResponse.json({ ok: true });

  const source = typeof body.source === 'string' ? body.source.slice(0, 40) : null;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { error } = await supabase.from('waitlist').insert({ email, source });
  const duplicate = error?.code === '23505';
  if (error && !duplicate) return NextResponse.json({ error: 'could not save signup' }, { status: 502 });

  // Confirmation email is best-effort: the signup is already stored, so a mail
  // failure must not fail the request. Duplicates don't get re-mailed.
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && !duplicate) {
    try {
      await new Resend(resendKey).emails.send({
        from: 'PetAppro <hello@base509.com>',
        replyTo: 'support@base509.com',
        to: email,
        subject: 'You’re on the PetAppro waitlist',
        html: WAITLIST_CONFIRMATION_HTML,
        text: CONFIRMATION_TEXT, // plain-text fallback

      });
    } catch {
      // best-effort — see above
    }
  }

  return NextResponse.json({ ok: true });
}
