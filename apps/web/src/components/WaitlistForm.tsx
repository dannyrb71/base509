'use client';

import { useRef, useState, type ReactNode } from 'react';

/**
 * Pre-launch email capture (portal not live at launch — Danny, 2026-07-18).
 * Posts to /api/waitlist. If no capture backend is configured (route returns
 * 501), falls back to an honest mailto path — we never pretend an email was
 * saved when it wasn't (no dark patterns).
 *
 * `prompt` is the page's pre-submit pitch (heading + "drop your email" line).
 * It renders here, not in the page, so success can replace the whole story —
 * an instruction to sign up must never sit next to "you're on the list".
 */
export function WaitlistForm({
  note,
  buttonLabel = 'Join the waitlist',
  idPrefix = 'waitlist',
  prompt,
}: {
  note?: string;
  buttonLabel?: string;
  idPrefix?: string;
  prompt?: ReactNode;
}) {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'fallback' | 'error'>('idle');
  const startedAt = useRef(Date.now());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState('busy');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: idPrefix, company: honeypot, startedAt: startedAt.current }),
      });
      if (res.ok) setState('done');
      else if (res.status === 501) setState('fallback');
      else setState('error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <div className="waitlist-success" role="status">
        <p className="waitlist-success__lead type-body-lg"><strong>Thanks so much &mdash; you&rsquo;re on the list!</strong></p>
        <p className="type-body">You&rsquo;ll be among the first through the dog door. We&rsquo;ll email you the moment PetAppro is ready to open. 🐾</p>
      </div>
    );
  }
  if (state === 'fallback' || state === 'error') {
    return (
      <>
        {prompt}
        <p role="status">
          Our sign-up form isn&rsquo;t wired up on this preview — email{' '}
          <a href={`mailto:support@base509.com?subject=PetAppro%20waitlist`}>support@base509.com</a>{' '}
          with &ldquo;Waitlist&rdquo; and we&rsquo;ll add you ourselves.
        </p>
      </>
    );
  }
  return (
    <div>
      {prompt}
      <form className="waitlist" onSubmit={submit}>
        {/* Honeypot: hidden from real users; bots that fill it are dropped server-side. */}
        <input
          className="visually-hidden"
          id={`${idPrefix}-company`}
          aria-hidden="true"
          tabIndex={-1}
          type="text"
          name="company"
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
        <input
          id={`${idPrefix}-email`}
          aria-label="Email address"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <button className="btn btn--cta" type="submit" disabled={state === 'busy'}>
          {state === 'busy' ? 'Adding you…' : buttonLabel}
        </button>
      </form>
      {note && <p className="waitlist__note">{note}</p>}
    </div>
  );
}
