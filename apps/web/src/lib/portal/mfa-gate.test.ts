import { describe, expect, it } from 'vitest';
import { ownerAdminNeedsMfa } from './mfa-gate';

// Codex round-1 P1-2: the web MFA gate must FAIL CLOSED. Every ambiguous
// answer from the auth layer gates exactly like AAL1.
describe('ownerAdminNeedsMfa', () => {
  it('gates owner/admin below AAL2', () => {
    expect(ownerAdminNeedsMfa('owner', { currentLevel: 'aal1' }, null)).toBe(true);
    expect(ownerAdminNeedsMfa('admin', { currentLevel: 'aal1' }, null)).toBe(true);
  });

  it('passes owner/admin at AAL2', () => {
    expect(ownerAdminNeedsMfa('owner', { currentLevel: 'aal2' }, null)).toBe(false);
    expect(ownerAdminNeedsMfa('admin', { currentLevel: 'aal2' }, null)).toBe(false);
  });

  it('FAILS CLOSED on an errored assurance answer', () => {
    expect(ownerAdminNeedsMfa('owner', { currentLevel: 'aal2' }, new Error('boom'))).toBe(true);
    expect(ownerAdminNeedsMfa('admin', null, { message: 'network' })).toBe(true);
  });

  it('FAILS CLOSED on null data and null currentLevel', () => {
    expect(ownerAdminNeedsMfa('owner', null, null)).toBe(true);
    expect(ownerAdminNeedsMfa('owner', { currentLevel: null }, null)).toBe(true);
  });

  it('never gates staff/manager (launch scope)', () => {
    expect(ownerAdminNeedsMfa('staff', null, new Error('boom'))).toBe(false);
    expect(ownerAdminNeedsMfa('manager', { currentLevel: 'aal1' }, null)).toBe(false);
  });
});
