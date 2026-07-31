import { describe, it, expect, beforeEach } from 'vitest';
import { localQueueStore, cloudStore } from './store';
import type { Registration } from './types';

const makeRegistration = (overrides: Partial<Registration> = {}): Registration => ({
  id: 'reg-1',
  patientName: 'Amina',
  gestationalAgeWeeks: 20,
  riskFactors: [],
  riskTier: 'Low',
  riskReasons: [],
  createdAt: new Date(0).toISOString(),
  ...overrides,
});

describe('localQueueStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists a registration and reads it back after a simulated reload', () => {
    localQueueStore.addRegistration(makeRegistration());
    const data = localQueueStore.getAll();
    expect(data.registrations).toHaveLength(1);
    expect(data.registrations[0].patientName).toBe('Amina');
  });

  it('does not leak data into the cloud store', () => {
    localQueueStore.addRegistration(makeRegistration());
    expect(cloudStore.getAll().registrations).toHaveLength(0);
  });

  it('appends referrals independently of registrations', () => {
    localQueueStore.addReferral({
      id: 'ref-1',
      registrationId: 'reg-1',
      patientName: 'Amina',
      riskFactors: ['severe_hypertension'],
      riskReasons: ['Severe hypertension'],
      riskTier: 'High',
      gestationalAgeWeeks: 20,
      status: 'flagged',
      createdAt: new Date(0).toISOString(),
    });
    expect(localQueueStore.getAll().referrals).toHaveLength(1);
  });
});

describe('cloudStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not leak data into the local queue store', () => {
    cloudStore.mergeSyncedItems({
      registrations: [makeRegistration()],
      referrals: [],
      checkIns: [],
    });
    expect(localQueueStore.getAll().registrations).toHaveLength(0);
    expect(cloudStore.getAll().registrations).toHaveLength(1);
  });

  it('updates a referral status in place without duplicating it', () => {
    cloudStore.mergeSyncedItems({
      registrations: [],
      referrals: [
        {
          id: 'ref-1',
          registrationId: 'reg-1',
          patientName: 'Amina',
          riskFactors: [],
          riskReasons: [],
          riskTier: 'High',
          gestationalAgeWeeks: 20,
          status: 'flagged',
          createdAt: new Date(0).toISOString(),
        },
      ],
      checkIns: [],
    });
    cloudStore.updateReferral('ref-1', (r) => ({ ...r, status: 'dispatched' }));
    const { referrals } = cloudStore.getAll();
    expect(referrals).toHaveLength(1);
    expect(referrals[0].status).toBe('dispatched');
  });
});
