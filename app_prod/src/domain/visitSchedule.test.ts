import { describe, it, expect } from 'vitest';
import { postnatalSchedule, nextAncVisit, visitUrgency, POSTNATAL_CHECKPOINTS } from './visitSchedule';

const DELIVERY = '2026-07-31T08:00:00.000Z';

describe('postnatalSchedule', () => {
  it('schedules a check at every defined checkpoint in the 0-48h window', () => {
    const visits = postnatalSchedule(DELIVERY);
    expect(visits).toHaveLength(POSTNATAL_CHECKPOINTS.length);
  });

  it('places the first check within the first 24 hours, when most deaths occur', () => {
    const [first] = postnatalSchedule(DELIVERY);
    const hoursAfter =
      (new Date(first.dueAt).getTime() - new Date(DELIVERY).getTime()) / 3_600_000;
    expect(hoursAfter).toBeGreaterThan(0);
    expect(hoursAfter).toBeLessThanOrEqual(24);
  });

  it('covers through 48 hours postpartum', () => {
    const visits = postnatalSchedule(DELIVERY);
    const last = visits[visits.length - 1];
    const hoursAfter =
      (new Date(last.dueAt).getTime() - new Date(DELIVERY).getTime()) / 3_600_000;
    expect(hoursAfter).toBe(48);
  });

  it('returns checkpoints in chronological order', () => {
    const times = postnatalSchedule(DELIVERY).map((v) => new Date(v.dueAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('labels each checkpoint so a caseworker knows which check it is', () => {
    for (const visit of postnatalSchedule(DELIVERY)) {
      expect(visit.label).toMatch(/\d+\s*h/i);
    }
  });
});

describe('nextAncVisit', () => {
  it('schedules sooner in the third trimester than the first', () => {
    const early = nextAncVisit(12, DELIVERY);
    const late = nextAncVisit(36, DELIVERY);
    expect(new Date(late.dueAt).getTime()).toBeLessThan(new Date(early.dueAt).getTime());
  });

  it('always schedules in the future', () => {
    const visit = nextAncVisit(20, DELIVERY);
    expect(new Date(visit.dueAt).getTime()).toBeGreaterThan(new Date(DELIVERY).getTime());
  });
});

describe('visitUrgency', () => {
  const now = '2026-07-31T12:00:00.000Z';

  it('marks a visit past its due time as overdue', () => {
    expect(visitUrgency('2026-07-31T10:00:00.000Z', now)).toBe('overdue');
  });

  it('marks a visit due within the next 6 hours as due-soon', () => {
    expect(visitUrgency('2026-07-31T15:00:00.000Z', now)).toBe('due-soon');
  });

  it('marks a visit well in the future as upcoming', () => {
    expect(visitUrgency('2026-08-05T12:00:00.000Z', now)).toBe('upcoming');
  });
});
