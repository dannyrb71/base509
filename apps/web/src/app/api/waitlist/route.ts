import { NextRequest, NextResponse } from 'next/server';

/**
 * Waitlist capture endpoint (pre-launch mode).
 *
 * ⚠️ DEPLOY BLOCKER (Claude Code, MKT-4): before the sites go live, set
 * WAITLIST_WEBHOOK_URL (or replace this with a Supabase insert / email-provider
 * call). Without it this returns 501 and the form falls back to a mailto path —
 * honest, but not what we want at launch.
 */
export async function POST(req: NextRequest) {
  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  const webhook = process.env.WAITLIST_WEBHOOK_URL;
  if (!webhook) {
    // No capture backend configured — tell the client so it can offer mailto.
    return NextResponse.json({ error: 'capture not configured' }, { status: 501 });
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'petappro-waitlist', at: new Date().toISOString() }),
    });
    if (!res.ok) throw new Error(`webhook ${res.status}`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'capture failed' }, { status: 502 });
  }
}
