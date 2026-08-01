export type VisitUrgency = 'overdue' | 'due-soon' | 'upcoming';

export interface ScheduledCheckpoint {
  label: string;
  dueAt: string;
}

/**
 * The 0-48h postpartum window is when most maternal and newborn deaths occur,
 * so the platform schedules these automatically rather than relying on a
 * caseworker to remember. Checkpoints follow the standard early-postnatal
 * pattern (first day, then 24h and 48h).
 *
 * NOT clinically validated -- prototype placeholder, same caveat as the risk
 * engine. See AMHOS_PRD.md.
 */
export const POSTNATAL_CHECKPOINTS: { label: string; hoursAfter: number }[] = [
  { label: '6h check', hoursAfter: 6 },
  { label: '24h check', hoursAfter: 24 },
  { label: '48h check', hoursAfter: 48 },
];

export function postnatalSchedule(deliveryIso: string): ScheduledCheckpoint[] {
  const delivery = new Date(deliveryIso).getTime();
  return POSTNATAL_CHECKPOINTS.map(({ label, hoursAfter }) => ({
    label,
    dueAt: new Date(delivery + hoursAfter * 3_600_000).toISOString(),
  }));
}

/**
 * ANC contact spacing tightens as pregnancy progresses -- monthly early on,
 * fortnightly in the third trimester, weekly near term.
 */
export function nextAncVisit(gestationalAgeWeeks: number, fromIso: string): ScheduledCheckpoint {
  const daysUntilNext =
    gestationalAgeWeeks >= 36 ? 7 : gestationalAgeWeeks >= 28 ? 14 : 28;
  const from = new Date(fromIso).getTime();
  return {
    label: `ANC visit (${gestationalAgeWeeks + Math.round(daysUntilNext / 7)}w)`,
    dueAt: new Date(from + daysUntilNext * 86_400_000).toISOString(),
  };
}

const DUE_SOON_WINDOW_HOURS = 6;

export function visitUrgency(dueAtIso: string, nowIso: string): VisitUrgency {
  const hoursUntilDue = (new Date(dueAtIso).getTime() - new Date(nowIso).getTime()) / 3_600_000;
  if (hoursUntilDue < 0) return 'overdue';
  if (hoursUntilDue <= DUE_SOON_WINDOW_HOURS) return 'due-soon';
  return 'upcoming';
}
