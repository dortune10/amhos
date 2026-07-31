import { describe, it, expect, beforeEach } from 'vitest';
import { submitCheckIn, markReviewed, escalateCheckIn } from './checkInService';
import { registerPatient } from '../registration/registerPatient';
import { localQueueStore } from '../../data/store';

describe('checkInService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('submits a check-in against an existing registration', () => {
    const { registration } = registerPatient({
      patientName: 'Amina',
      gestationalAgeWeeks: 20,
      riskFactorIds: [],
    });
    const checkIn = submitCheckIn({ registrationId: registration.id, symptom: 'Severe headache' });
    expect(checkIn.patientName).toBe('Amina');
    expect(checkIn.reviewed).toBe(false);
    expect(checkIn.escalated).toBe(false);
    expect(localQueueStore.getAll().checkIns).toHaveLength(1);
  });

  it('marks a check-in reviewed and persists it', () => {
    const { registration } = registerPatient({
      patientName: 'Amina',
      gestationalAgeWeeks: 20,
      riskFactorIds: [],
    });
    const checkIn = submitCheckIn({
      registrationId: registration.id,
      symptom: 'All fine, no concerns',
    });
    markReviewed(checkIn.id);
    const stored = localQueueStore.getAll().checkIns.find((c) => c.id === checkIn.id);
    expect(stored?.reviewed).toBe(true);
  });

  it('escalates a check-in into exactly one new referral, linked to the registration', () => {
    const { registration } = registerPatient({
      patientName: 'Chidinma',
      gestationalAgeWeeks: 22,
      riskFactorIds: [],
    });
    const checkIn = submitCheckIn({ registrationId: registration.id, symptom: 'Vaginal bleeding' });

    const referral = escalateCheckIn(checkIn.id);

    expect(referral).not.toBeNull();
    expect(referral?.registrationId).toBe(registration.id);
    expect(referral?.status).toBe('flagged');
    expect(localQueueStore.getAll().referrals).toHaveLength(1);
    expect(localQueueStore.getAll().checkIns.find((c) => c.id === checkIn.id)?.escalated).toBe(
      true,
    );
  });

  it('escalating twice does not create a second referral (idempotent)', () => {
    const { registration } = registerPatient({
      patientName: 'Zainab',
      gestationalAgeWeeks: 26,
      riskFactorIds: [],
    });
    const checkIn = submitCheckIn({
      registrationId: registration.id,
      symptom: 'Reduced baby movement',
    });

    escalateCheckIn(checkIn.id);
    const secondResult = escalateCheckIn(checkIn.id);

    expect(secondResult).toBeNull();
    expect(localQueueStore.getAll().referrals).toHaveLength(1);
  });
});
