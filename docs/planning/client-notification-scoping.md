# Client notification settings — per-provider + app-wide model

**Source:** Danny decision, 2026-08-01. **Audience:** product management · Claude Code · Codex.

## Model

Client notification preferences are **scoped per provider relationship**, with a small **app-wide layer** on top.

1. **Per-provider prefs (default scope).** A prefs record hangs off the per-business client profile — keyed by (user, `business_id`), not by user alone. This falls straight out of the existing tenancy rules: client profiles are already per-business (roles doc §6, open-decision #9), and notification delivery already resolves the user↔business relationship (§11 rule 9). The send pipeline checks the same join, one table over. Defaults are stamped when the client joins a new provider.
   - Per-provider at MVP: booking updates, report cards & photos, payments & invoices, reminders from the provider (push) · receipts, monthly summary (email).
2. **App-wide prefs (account-level).** Settings that apply across every provider the client is connected to. **Confirmed contents: Announcements & marketing** (one master switch — a client with five providers should not have to opt out five times). More app-wide items may be added later; the layer exists as of this decision.
3. **Global by nature (not a preference row):** the OS push permission and device push token — the device either allows PetAppro notifications or it doesn't; this cannot be split per provider.

## Precedence at send time

OS permission → app-wide switch (if the category is app-wide) → per-provider pref for the active `business_id`. First "off" wins.

## Design state

MORE·03 (client Notification preferences) now reflects this: PUSH + EMAIL sections read as per-provider (the screen sits inside the active space, provider brand header on top), and a new **"APP-WIDE — ALL PROVIDERS"** section holds Announcements & marketing with the caption "Applies across every provider you're connected to."
