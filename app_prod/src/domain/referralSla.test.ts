import { describe, it, expect } from 'vitest';
import { isSlaBreached, hoursInTransit, SLA_HOURS } from './referralSla';
import type { Referral } from '../data/types';

const NOW = '2026-07-31T12:00:00.000Z';

function referral(overrides: Partial<Referral> = {}): Referral {
  return {
    id: 'ref-1',
    registrationId: 'reg-1',
    patientName: 'Amina',
    riskFactors: [],
    riskReasons: [],
    riskTier: 'High',
    gestationalAgeWeeks: 30,
    status: 'dispatched',
    createdAt: NOW,
    ...overrides,
  };
}

describe('isSlaBreached', () => {
  it('is false for a referral created just now', () => {
    expect(isSlaBreached(referral(), NOW)).toBe(false);
  });

  it('is true once an in-flight referral exceeds the SLA window', () => {
    const old = new Date(new Date(NOW).getTime() - (SLA_HOURS + 1) * 3_600_000).toISOString();
    expect(isSlaBreached(referral({ createdAt: old }), NOW)).toBe(true);
  });

  it('is false for a completed referral no matter how old', () => {
    const ancient = new Date(new Date(NOW).getTime() - 100 * 3_600_000).toISOString();
    expect(
      isSlaBreached(referral({ createdAt: ancient, status: 'outcome_logged' }), NOW),
    ).toBe(false);
  });

  it('is false once the patient has been received', () => {
    const old = new Date(new Date(NOW).getTime() - 50 * 3_600_000).toISOString();
    expect(isSlaBreached(referral({ createdAt: old, status: 'received' }), NOW)).toBe(false);
  });

  it('still flags a referral stuck at flagged, never dispatched', () => {
    const old = new Date(new Date(NOW).getTime() - (SLA_HOURS + 5) * 3_600_000).toISOString();
    expect(isSlaBreached(referral({ createdAt: old, status: 'flagged' }), NOW)).toBe(true);
  });
});

describe('hoursInTransit', () => {
  it('reports elapsed whole hours since the referral was raised', () => {
    const threeHoursAgo = new Date(new Date(NOW).getTime() - 3 * 3_600_000).toISOString();
    expect(hoursInTransit(referral({ createdAt: threeHoursAgo }), NOW)).toBe(3);
  });
});
