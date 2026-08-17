# Pet profile — Report-card carousel (PET·02)

**Source:** Danny design review, 2026-08-01 (Figma FLOW REVIEW 44 feedback). **Audience:** product management · Claude Code · Codex.

## What

The client Pet profile view (PET·02) gains a **carousel of report cards** from that pet's completed bookings — surfacing report cards somewhere findable per pet, not only via booking history.

- Carousel card = `Card content/Care report` (existing library component, 4 variants). Full view opens the locked report card (CLIENT-UPDATES·02 pattern, D-046 edit-lock).

## Picker logic (grows with visit history)

1. **≤ 5 visits:** plain carousel, no picker.
2. **> 5 visits:** introduce a **month picker** (same control as `Control/Day picker`'s built-in month picker).
3. **After Dec 31 of the first year the pet had bookings with that provider:** add a **year picker** alongside the month picker.

## Notes

- Scoped per provider relationship (pet records are per-business — roles doc §8).
- Client is always read-only on report cards (D-046).
- Design not yet built; logged as PARKED #11 in the Figma question log (#103).
