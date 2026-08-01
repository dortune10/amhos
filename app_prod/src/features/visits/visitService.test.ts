import { describe, it, expect, beforeEach } from 'vitest';
import { recordDelivery, completeVisit, dueVisits, scheduleNextAnc } from './visitService';
import { localQueueStore } from '../../data/store';
import { registerPatient } from '../registration/registerPatient';

function seedPatient(name = 'Amina', weeks = 39) {
  return registerPatient({
    patientName: name,
    gestationalAgeWeeks: weeks,
    riskFactorIds: [],
  }).registration;
}

describe('recordDelivery', () => {
  beforeEach(() => localStorage.clear());

  it('auto-schedules the full postnatal checkpoint set', () => {
    const reg = seedPatient();
    recordDelivery(reg.id);
    const visits = localQueueStore.getAll().visits.filter((v) => v.kind === 'postnatal');
    expect(visits.length).toBeGreaterThanOrEqual(3);
  });

  it('stamps deliveredAt on the registration', () => {
    const reg = seedPatient();
    recordDelivery(reg.id);
    const stored = localQueueStore.getAll().registrations.find((r) => r.id === reg.id);
    expect(stored?.deliveredAt).toBeTruthy();
  });

  it('links every scheduled visit back to the patient', () => {
    const reg = seedPatient('Fatima');
    recordDelivery(reg.id);
    for (const visit of localQueueStore.getAll().visits) {
      expect(visit.registrationId).toBe(reg.id);
      expect(visit.patientName).toBe('Fatima');
    }
  });

  it('is idempotent -- recording delivery twice does not double-schedule', () => {
    const reg = seedPatient();
    recordDelivery(reg.id);
    const firstCount = localQueueStore.getAll().visits.length;
    recordDelivery(reg.id);
    expect(localQueueStore.getAll().visits).toHaveLength(firstCount);
  });

  it('does nothing for an unknown registration', () => {
    expect(() => recordDelivery('does-not-exist')).not.toThrow();
    expect(localQueueStore.getAll().visits).toHaveLength(0);
  });
});

describe('scheduleNextAnc', () => {
  beforeEach(() => localStorage.clear());

  it('schedules an ANC visit for an undelivered patient', () => {
    const reg = seedPatient('Ngozi', 30);
    scheduleNextAnc(reg.id);
    const anc = localQueueStore.getAll().visits.filter((v) => v.kind === 'anc');
    expect(anc).toHaveLength(1);
    expect(anc[0].patientName).toBe('Ngozi');
  });
});

describe('completeVisit', () => {
  beforeEach(() => localStorage.clear());

  it('marks a visit complete and it stops appearing as due', () => {
    const reg = seedPatient();
    recordDelivery(reg.id);
    const target = localQueueStore.getAll().visits[0];

    completeVisit(target.id);

    const stored = localQueueStore.getAll().visits.find((v) => v.id === target.id);
    expect(stored?.completedAt).toBeTruthy();
    expect(dueVisits().some((v) => v.id === target.id)).toBe(false);
  });
});

describe('dueVisits', () => {
  beforeEach(() => localStorage.clear());

  it('returns outstanding visits sorted most-urgent first', () => {
    const reg = seedPatient();
    recordDelivery(reg.id);
    const due = dueVisits();
    const times = due.map((v) => new Date(v.dueAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('excludes completed visits', () => {
    const reg = seedPatient();
    recordDelivery(reg.id);
    const all = localQueueStore.getAll().visits;
    all.forEach((v) => completeVisit(v.id));
    expect(dueVisits()).toHaveLength(0);
  });
});
