import { localQueueStore } from '../../data/store';
import type { ScheduledVisit } from '../../data/types';
import { createId } from '../../domain/id';
import { nextAncVisit, postnatalSchedule } from '../../domain/visitSchedule';

/**
 * Recording a birth automatically schedules the 0-48h postnatal checks --
 * the window in which most maternal and newborn deaths occur. This is the
 * "automated task orchestration" pillar: the caseworker never has to
 * remember to create these.
 */
export function recordDelivery(registrationId: string, deliveredAtIso?: string): void {
  const data = localQueueStore.getAll();
  const registration = data.registrations.find((r) => r.id === registrationId);
  if (!registration) return;
  // Already delivered -- don't stack a second set of checkpoints.
  if (registration.deliveredAt) return;

  const deliveredAt = deliveredAtIso ?? new Date().toISOString();
  const createdAt = new Date().toISOString();

  const visits: ScheduledVisit[] = postnatalSchedule(deliveredAt).map((checkpoint) => ({
    id: createId('visit'),
    registrationId: registration.id,
    patientName: registration.patientName,
    kind: 'postnatal',
    label: checkpoint.label,
    dueAt: checkpoint.dueAt,
    createdAt,
  }));

  localQueueStore.updateRegistration(registrationId, (r) => ({ ...r, deliveredAt }));
  localQueueStore.addVisits(visits);
}

export function scheduleNextAnc(registrationId: string, fromIso?: string): void {
  const data = localQueueStore.getAll();
  const registration = data.registrations.find((r) => r.id === registrationId);
  if (!registration || registration.deliveredAt) return;

  const from = fromIso ?? new Date().toISOString();
  const checkpoint = nextAncVisit(registration.gestationalAgeWeeks, from);

  localQueueStore.addVisits([
    {
      id: createId('visit'),
      registrationId: registration.id,
      patientName: registration.patientName,
      kind: 'anc',
      label: checkpoint.label,
      dueAt: checkpoint.dueAt,
      createdAt: from,
    },
  ]);
}

export function completeVisit(visitId: string): void {
  localQueueStore.updateVisit(visitId, (v) =>
    v.completedAt ? v : { ...v, completedAt: new Date().toISOString() },
  );
}

/** Outstanding visits, most urgent (soonest due, including overdue) first. */
export function dueVisits(): ScheduledVisit[] {
  return localQueueStore
    .getAll()
    .visits.filter((v) => !v.completedAt)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}
