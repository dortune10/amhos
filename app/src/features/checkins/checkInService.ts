import { localQueueStore } from '../../data/store';
import type { MotherCheckIn, Referral } from '../../data/types';
import { createId } from '../../domain/id';

export interface SubmitCheckInInput {
  registrationId: string;
  symptom: string;
}

export function submitCheckIn(input: SubmitCheckInInput): MotherCheckIn {
  const { registrations } = localQueueStore.getAll();
  const registration = registrations.find((r) => r.id === input.registrationId);

  const checkIn: MotherCheckIn = {
    id: createId('checkin'),
    registrationId: input.registrationId,
    patientName: registration?.patientName ?? 'Unknown patient',
    symptom: input.symptom,
    createdAt: new Date().toISOString(),
    reviewed: false,
    escalated: false,
  };
  localQueueStore.addCheckIn(checkIn);
  return checkIn;
}

export function markReviewed(checkInId: string): void {
  localQueueStore.updateCheckIn(checkInId, (c) => ({ ...c, reviewed: true }));
}

/** Idempotent: escalating an already-escalated check-in returns null and creates nothing new. */
export function escalateCheckIn(checkInId: string): Referral | null {
  const local = localQueueStore.getAll();
  const checkIn = local.checkIns.find((c) => c.id === checkInId);
  if (!checkIn || checkIn.escalated) return null;

  const registration = local.registrations.find((r) => r.id === checkIn.registrationId);
  if (!registration) return null;

  const referral: Referral = {
    id: createId('ref'),
    registrationId: registration.id,
    patientName: registration.patientName,
    riskFactors: registration.riskFactors,
    riskReasons: [
      ...registration.riskReasons,
      `Caseworker-escalated mother check-in: ${checkIn.symptom}`,
    ],
    riskTier: registration.riskTier,
    gestationalAgeWeeks: registration.gestationalAgeWeeks,
    status: 'flagged',
    createdAt: new Date().toISOString(),
  };
  localQueueStore.addReferral(referral);
  localQueueStore.updateCheckIn(checkInId, (c) => ({ ...c, escalated: true }));
  return referral;
}
