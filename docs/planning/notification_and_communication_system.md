# PetAppro Notification and Communication System

Planning document for how PetAppro notifies users and handles communication across a multi-tenant pet care platform.

**Related docs:**

- `docs/prompts/cursor_project_instructions.md`
- `docs/planning/product_brief.md`
- `docs/planning/user_roles_and_permissions.md`
- `docs/decisions/open_decisions.md` (D-001, D-008)
- `docs/specs/platform_notification_and_activity_plan.md` (activity history + earlier notification notes)

**Status:** Planning — product behavior and architecture direction. Implementation specs come in Phase 4.

---

## 1. Purpose

Define how PetAppro delivers **timely operational alerts** and **official records** to owners, admins, staff, and clients — scoped to each business (`business_id`).

This doc covers:

- Which channels PetAppro uses (in-app, email, SMS, push, external messaging)
- What events generate notifications
- How tenant isolation and role preferences work
- What ships in MVP vs. post-MVP add-ons

This doc does **not** define database schemas, Edge Functions, or provider API calls. It does **not** cover activity history UI (see `docs/specs/platform_notification_and_activity_plan.md`).

---

## 2. Core Principles

1. **Tenant-scoped everything** — notifications belong to a business; users only see alerts for businesses they belong to.
2. **Email is for paper trail** — receipts, confirmations, policy acceptance, account recovery, cancellation records.
3. **Urgent ops alerts use in-app first** — new bookings, meet-and-greet requests, schedule-relevant changes.
4. **No global notification config** — Woof Wetreats-style Pushover or single-admin alert routing must not be copied; each business configures its own preferences.
5. **Traceability** — store what happened, who should be notified, which channels were attempted, and delivery outcome.
6. **Role-appropriate delivery** — clients receive client-facing events; staff/owners receive operational events.
7. **Communication ≠ notification** — opening the native Messages app is not the same as in-app messaging; do not conflate them in MVP.

---

## 3. Reference: Woof Wetreats vs PetAppro

### What Woof Wetreats does today

- Meet-and-greet requests notify staff (Pushover in at least one Edge Function)
- Reservation notifications appear tied to database triggers (exact trigger definitions not fully visible in reference checkout)
- Email used for some client flows
- No multi-tenant notification preferences
- Global operational assumptions (single business context)

### What PetAppro must do differently

| Woof Wetreats pattern | PetAppro approach |
|---|---|
| Global Pushover / admin email alerts | Per-business notification preferences and delivery outbox |
| Single-business event scope | Every event tagged with `business_id` |
| Ad hoc notification triggers | Consistent event → notification → delivery pipeline |
| Staff alerted via external tool only | In-app notification center for MVP; SMS as optional add-on |

Use Woof Wetreats to identify **which events matter** (new booking, meet-and-greet request, cancellation). Rebuild **how** they are routed and delivered.

---

## 4. Channel Strategy

### In-app notification center (MVP — required)

Primary channel for operational urgency at MVP.

- Bell/icon with unread count
- List of notifications scoped to active `business_id`
- Mark read / dismiss
- Deep link to relevant booking, client, or meet-and-greet context
- Works for owner, admin, staff, and client (each sees their relevant subset)

> **⭐ Notification center vs. the Home "Needs your attention" queue — distinct surfaces (Danny, 2026-08-01, FR41).** They look similar but do different jobs; keep them behaviorally distinct or they read as duplicates:
> - **Notification center** = the **full chronological feed** — everything that happened (photos, "report card ready," confirmations, reminders, *and* action items). Time-ordered, tap → deep-link. A **log/history**; acting on something does **not** remove it.
> - **Home "Needs your attention"** = only the **action-required subset** — items that *block progress* (pick an M&G slot, approve a price change, approve a pending booking, expiring requests). Promoted above the fold on Home so they aren't buried in the feed. **Task cards with a clear CTA** ("pick a time →", "review & accept →") that **clear from the queue when resolved** (the underlying notification stays in the log).
> - **Navigation:** the attention view is **NOT a separate screen** — it's the client **Home dashboard's attention state** (Home renders normal / empty / live-service / attention from the client's data; archetype-10 system-states). You reach it by opening Home when blocking items exist.
> - **Same component, different variant (Danny, 2026-08-01 — "closer visually: yes").** Both surfaces use the **same card component** (`Card content/Notification row`) so they look consistent/coherent — reuse-first, one card family. The difference is a **variant/state, not a different design:**
>   - **Action-required variant** (Home attention queue): a clear **CTA** ("pick a time →", "review & accept →") + light emphasis; **self-clears** when resolved. It's a task.
>   - **Informational variant** (Notification center): plainer, no task CTA; **persists** as history. It's a log entry.
>   An item can appear as both (the log entry + the promoted task). The semantics live in the **variant**, not in two unrelated card designs — that's what prevents redundancy while keeping the look unified.

> **Scheduled care-task reminders = a notification type (Danny, 2026-08-01).** Feed times, medication times, and similar scheduled nudges are **notifications**, NOT content on the provider Today board. Today stays focused on dogs in/out + capacity; care reminders are reached via the **notifications bell** on the Today top bar (`provider-dashboard.md` §B). Build when the notification system supports scheduled nudges — can be a fast-follow, decoupled from the board.

**Working default (D-001):** Web-first responsive UI. In-app center is the reliable baseline regardless of push support.

### Email (MVP — paper trail only)

**Use for:**

- Booking confirmation copy (official record)
- Cancellation record
- Terms/policy acceptance confirmation
- Password reset / account recovery
- Payment receipt (when online pay exists)
- Optional: digest summaries if configured later

**Do not use for:**

- "New booking — act now" staff alerts
- Meet-and-greet urgency
- Same-day schedule changes requiring immediate attention

Email may still be **cc'd** on confirmations clients/staff expect in inbox, but it must not be the only urgent path.

### SMS (post-MVP add-on — working default D-008)

Automatic SMS requires a backend provider (e.g., Twilio). Requires opt-in, business-level enablement, and ongoing cost.

**Planned add-on use cases:**

- Owner/staff urgent alerts (new booking, cancellation, meet-and-greet request)
- Optional client reminders (drop-off/pick-up) if product adds them later

**Not MVP** unless design partner is blocked without SMS and decision D-008 is changed to **Decided** for MVP inclusion.

### Web push (optional enhancement)

- Conditional: browser support, permission granted, iOS Home Screen PWA constraints
- Treat as **best-effort supplement** to in-app center on web — not primary at MVP
- Native/Expo app (if adopted later) improves push reliability (ties to D-001)

### External native messaging (MVP — lightweight)

**"Send Message" / contact actions** that open the device's SMS, phone, or mail client with prefilled recipient/content where appropriate.

- Does not send automatically — user taps send in native app
- Useful for quick client contact without building in-app chat
- Not a substitute for operational alert routing

---

## 5. Event Catalog (MVP)

Events that should write to the internal notification system. Final list becomes Phase 4 spec acceptance criteria.

### Client-facing events

| Event | In-app | Email (paper trail) | SMS (add-on) |
|---|---|---|---|
| Booking submitted / confirmed | Y | Y (confirmation copy) | Deferred |
| Booking cancelled (by staff or self) | Y | Y (cancellation record) | Deferred |
| Meet-and-greet requested | Y | Optional acknowledgment | Deferred |
| Meet-and-greet scheduled / completed | Y | Optional | Deferred |
| Client blocked / unblocked | Y | Optional notice | N |
| Payment marked paid / receipt available | Y | Y (receipt) | Deferred |
| Terms/policy update requiring re-acceptance | Y | Y | N |

### Staff / owner / admin events

| Event | In-app | Email | SMS (add-on) |
|---|---|---|---|
| New client booking request | Y | N (urgent) | Deferred |
| Client cancelled booking | Y | N (urgent) | Deferred |
| Meet-and-greet requested by client | Y | N (urgent) | Deferred |
| New client completed onboarding | Y | Optional | Deferred |
| Staff-created booking (notify other staff if configured) | Y | N | Deferred |
| Manual payment recorded | Y | Optional | N |

### Explicitly out of MVP event scope

- In-app chat message received
- SMS conversation replies
- Marketing broadcasts
- Cross-business platform announcements (PetAppro operator — future)

---

## 6. Notification Pipeline (Conceptual)

Tenant-aware outbox model — implementation detail in Phase 1 architecture / Phase 4 spec.

```text
1. Business event occurs (booking created, meet-and-greet requested, etc.)
2. System creates a notification record scoped to business_id
   - event type, entity reference, summary text, severity, target roles/users
3. System creates delivery rows per enabled channel
   - in_app, email, sms (if add-on enabled)
4. Workers/dispatchers attempt delivery
5. Store status: pending, sent, failed, skipped (with error/reason)
6. User sees in-app item; email/SMS sent asynchronously where enabled
```

**Rules:**

- Creating the business event and creating notifications should be **server-side** — not client-only
- Failed SMS/email must not block booking success; log and retry policy TBD in spec
- Users only query notifications for their memberships/client profiles in the active business

---

## 7. Role-Based Visibility and Preferences

### Who sees what

| Role | Typical in-app notifications |
|---|---|
| **Client** | Own bookings, meet-and-greet, payment status, policy updates |
| **Staff** | New bookings, cancellations, meet-and-greet requests, schedule-relevant ops |
| **Admin / Owner** | Same as staff plus business-wide ops; configuration alerts optional |

Permissions follow `docs/planning/user_roles_and_permissions.md`. Clients never see staff-only operational noise (internal staff notes, other clients' bookings).

### Business-level preferences (MVP minimum)

Owner/admin can configure per business:

- Which **staff/owner** events also send email (default: off for urgent types)
- Whether **clients** receive email confirmations (default: on for booking confirm/cancel)
- SMS add-on master toggle (when available)
- Optional: notify all staff vs. owner only for new bookings (working default: all staff with membership)

**Deferred:** Per-user granular channel toggles, quiet hours, digest mode.

---

## 8. Communication System (Separate from Notifications)

### MVP: external contact actions

- **Call / text / email client** via native OS handlers where phone/email exists on profile
- **No** threaded in-app messaging
- **No** SMS conversation bridge
- Official booking state changes still happen **inside PetAppro** and generate notifications/emails as defined above

### Post-MVP: in-app messaging add-on (paid)

Planned capabilities (not MVP):

- Staff ↔ client messaging inside the app
- Optional SMS fallback/bridge via Twilio or similar
- Message history tied to client/household and `business_id`
- Usage-based cost → priced as add-on (see packaging in Section 10)

**Requirement — sender attribution (from competitor review mining, R-002).** **Chat/SMS always shows the sender's first name on every message — no conditional logic.** This covers the multi-user cases (provider owner/admin/staff/backups; client multi-owner "add a partner") without special-casing them. Rover's top messaging complaint is exactly this: only one name shows, so people sign each message manually. Applies to in-app chat and any SMS bridge. Ties to `docs/planning/feature-ideas-log.md` F-015 (client partners) and F-020 (provider backups).

**Principle:** Messaging add-on is a **conversation channel**. Notifications are **system events**. Do not merge the two data models at MVP.

---

## 9. MVP Scope Summary

### Include in MVP

| Capability | Notes |
|---|---|
| In-app notification center | All roles; business-scoped; unread state |
| Server-side event → notification creation | For event catalog above |
| Email for paper-trail events | Confirmations, cancellations, terms, receipts |
| External "contact client" actions | Native SMS/phone/mail handoff |
| Business-level email toggles (minimal) | Confirmations on/off; no urgent email |
| Delivery status logging (basic) | At least in-app + email attempt recorded |

### Defer post-MVP

| Capability | Notes |
|---|---|
| SMS automatic alerts | D-008 working default: post-MVP add-on |
| In-app messaging | Paid add-on; Twilio-backed |
| SMS conversation bridge | With messaging add-on |
| Web push as primary channel | Best-effort only if pursued on web |
| Marketing email campaigns | Out of scope |
| Per-user notification fine-grain | After pilot feedback |

---

## 10. Packaging and Monetization (Direction)

Aligns with `docs/specs/platform_notification_and_activity_plan.md` — subject to D-020.

| Tier | Notifications & communication |
|---|---|
| **Base SaaS** | In-app center, email paper trail, activity history |
| **Pro / add-on** | SMS urgent alerts for owner/staff |
| **Premium add-on** | In-app messaging (+ optional SMS bridge) |

PetAppro charges for software and infrastructure-heavy add-ons. SMS and messaging carry ongoing provider cost — do not bundle unlimited SMS in base plan at launch.

---

## 11. UX Surfaces (Planning)

### In-app notification center

- Entry: header bell + badge on owner/staff/client layouts
- List: reverse chronological, unread highlighted
- Empty state: "No notifications yet"
- Error state: failed to load — retry
- Item tap: navigate to booking, meet-and-greet, or profile context

### Email templates (MVP)

- Business-branded header (name, logo where configured)
- Clear subject lines: `[Business Name] Booking confirmed`
- Link back to client/staff portal
- Plain-language body; include booking summary and policy reference

### Activity history (related but separate)

Historical **completed/cancelled bookings** live in activity history — not mixed into the notification center as primary navigation. A notification may deep-link to a booking that also appears in history. See platform spec for activity date picker behavior.

---

## 12. Tenant and Security Rules

1. Every notification record includes `business_id`.
2. Recipients resolved via membership/client relationship for that business only.
3. Notification content must not leak other clients' PII to wrong recipients.
4. Email/SMS payloads include only data the recipient is authorized to see in-app.
5. No platform-wide broadcast to all PetAppro users without explicit future operator tooling.
6. Revoked staff lose access to new and historical in-app notifications for that business (read access TBD in RLS spec — default: no access after removal).

---

## 13. Dependencies on Other Decisions

| Decision ID | Impact on this system |
|---|---|
| **D-001** Web-first vs native | Push reliability; in-app center is MVP baseline either way |
| **D-008** SMS in MVP vs add-on | Whether Twilio integration ships in first release |
| **D-004 / D-012** Multi-business users | Business context picker filters notification lists |
| **D-007** Stripe Connect | Payment receipt emails and payment-confirmed events |
| **D-020** SaaS packaging | Which channels are base vs add-on |

---

## 14. Open Questions

| # | Question | Working default |
|---|---|---|
| N-01 | Notify all staff or owner-only for new bookings? | All staff with active membership |
| N-02 | Client email confirmations opt-out allowed? | Owner can disable client confirmation emails |
| N-03 | Retry policy for failed email | Retry 3x with backoff; log failure |
| N-04 | Notification retention period | 90 days in-app; archive or purge TBD |
| N-05 | Real-time vs poll for in-app center on web | Poll on focus + periodic refresh at MVP |
| N-06 | Web push in MVP at all? | No — in-app only unless D-001 changes |
| N-07 | Staff notified when another staff marks manual payment? | No at MVP |

Record resolutions in `docs/decisions/open_decisions.md` when finalized.

---

## 15. Phase Handoff and Acceptance Criteria

### Ready for Phase 1 (architecture) when:

- [ ] Channel strategy and MVP boundaries are agreed
- [ ] Event catalog listed with role targets
- [ ] Conceptual outbox pipeline documented
- [ ] Woof Wetreats global-alert anti-patterns explicitly rejected

### Ready for Phase 4 (MVP spec) when:

- [ ] Each MVP event has acceptance criteria (trigger, recipients, channels, copy intent)
- [ ] Email vs in-app rules per event are fixed
- [ ] D-008 status is **Decided** or **Working Default** documented for SMS
- [ ] Business preference UI scope defined (minimum toggles)
- [ ] External contact actions scoped (no accidental "sent" claim without user action)

### Ready for Phase 6 (build) when:

- [ ] Notification spec exists under `docs/specs/` (may split from platform spec)
- [ ] RLS and server-side creation aligned with `user_roles_and_permissions.md`
- [ ] Email provider and template approach chosen in implementation plan

---

## 16. Recommended Next Steps

1. Fold activity history details — keep in `docs/specs/platform_notification_and_activity_plan.md`; link from notification specs, do not duplicate
2. Add **Decided** or confirm **Working Default** for D-008 before Phase 4
3. Create Phase 4 spec: `docs/specs/notifications.md` (future) from Section 5 event catalog
4. Cross-check event list against Woof Wetreats reference flows (booking, meet-and-greet, cancellation)
