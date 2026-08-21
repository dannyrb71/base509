/**
 * A2.4 — the Owner/Admin AAL2 gate decision, extracted pure so it is unit-
 * testable (Codex round-1 P1-2: the gate must FAIL CLOSED — an errored,
 * missing, or malformed assurance-level answer gates exactly like AAL1).
 */
export type AalAnswer = { currentLevel: string | null } | null;

export function ownerAdminNeedsMfa(
  role: 'owner' | 'admin' | 'manager' | 'staff',
  aal: AalAnswer,
  error: unknown,
): boolean {
  if (role !== 'owner' && role !== 'admin') return false;
  if (error) return true; // fail closed: cannot PROVE aal2 → gate
  if (!aal || aal.currentLevel !== 'aal2') return true;
  return false;
}
