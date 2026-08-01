import { describe, it, expect, beforeEach } from 'vitest';
import { syncNow, getPendingCount } from './syncService';
import { cloudStore } from '../../data/store';
import { registerPatient } from '../registration/registerPatient';

describe('syncNow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('moves unsynced registrations and referrals into the cloud store', () => {
    registerPatient({
      patientName: 'Amina',
      gestationalAgeWeeks: 30,
      riskFactorIds: ['severe_hypertension'],
    });
    expect(cloudStore.getAll().registrations).toHaveLength(0);

    syncNow();

    const cloud = cloudStore.getAll();
    expect(cloud.registrations).toHaveLength(1);
    expect(cloud.referrals).toHaveLength(1);
  });

  it('creates exactly one WhatsApp notification per synced referral, not per registration', () => {
    registerPatient({
      patientName: 'Amina',
      gestationalAgeWeeks: 30,
      riskFactorIds: ['severe_hypertension'],
    });
    registerPatient({ patientName: 'Chidinma', gestationalAgeWeeks: 12, riskFactorIds: [] });

    syncNow();

    const { notifications } = cloudStore.getAll();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].targetRole).toBe('facility');
    expect(notifications[0].kind).toBe('referral_alert');
  });

  it('does not duplicate data on a second sync with nothing new pending', () => {
    registerPatient({
      patientName: 'Amina',
      gestationalAgeWeeks: 30,
      riskFactorIds: ['severe_hypertension'],
    });
    syncNow();
    syncNow();
    expect(cloudStore.getAll().registrations).toHaveLength(1);
    expect(cloudStore.getAll().notifications).toHaveLength(1);
  });

  it('clears the pending count after syncing', () => {
    registerPatient({ patientName: 'Amina', gestationalAgeWeeks: 30, riskFactorIds: [] });
    expect(getPendingCount()).toBeGreaterThan(0);
    syncNow();
    expect(getPendingCount()).toBe(0);
  });
});
