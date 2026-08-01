import { describe, it, expect, beforeEach } from 'vitest';
import { registerPatient } from './registerPatient';
import { localQueueStore } from '../../data/store';

describe('registerPatient', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes a Low-risk registration to the local queue with no referral', () => {
    const { registration, referral } = registerPatient({
      patientName: 'Chidinma',
      gestationalAgeWeeks: 12,
      riskFactorIds: [],
    });
    expect(registration.riskTier).toBe('Low');
    expect(referral).toBeNull();
    expect(localQueueStore.getAll().registrations).toHaveLength(1);
    expect(localQueueStore.getAll().referrals).toHaveLength(0);
  });

  it('auto-creates exactly one flagged referral for a High-risk registration', () => {
    const { registration, referral } = registerPatient({
      patientName: 'Amina',
      gestationalAgeWeeks: 30,
      riskFactorIds: ['severe_hypertension'],
    });
    expect(registration.riskTier).toBe('High');
    expect(referral).not.toBeNull();
    expect(referral?.status).toBe('flagged');
    expect(referral?.registrationId).toBe(registration.id);
    expect(localQueueStore.getAll().referrals).toHaveLength(1);
  });

  it('creates no referral for a Medium-risk registration', () => {
    registerPatient({
      patientName: 'Zainab',
      gestationalAgeWeeks: 22,
      riskFactorIds: ['prior_csection'],
    });
    expect(localQueueStore.getAll().referrals).toHaveLength(0);
  });

  it('persists the registration in the local queue immediately, before any sync', () => {
    registerPatient({
      patientName: 'Ngozi',
      gestationalAgeWeeks: 18,
      riskFactorIds: [],
    });
    const stored = localQueueStore.getAll().registrations[0];
    expect(stored.syncedAt).toBeUndefined();
  });
});
