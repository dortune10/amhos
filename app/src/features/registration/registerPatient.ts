import { localQueueStore } from '../../data/store';
import type { Referral, Registration } from '../../data/types';
import { createId } from '../../domain/id';
import { scoreRisk } from '../../domain/riskEngine';

export interface RegisterPatientInput {
  patientName: string;
  gestationalAgeWeeks: number;
  riskFactorIds: string[];
}

export interface RegisterPatientResult {
  registration: Registration;
  referral: Referral | null;
}

export function registerPatient(input: RegisterPatientInput): RegisterPatientResult {
  const { tier, reasons } = scoreRisk(input.riskFactorIds);

  const registration: Registration = {
    id: createId('reg'),
    patientName: input.patientName,
    gestationalAgeWeeks: input.gestationalAgeWeeks,
    riskFactors: input.riskFactorIds,
    riskTier: tier,
    riskReasons: reasons,
    createdAt: new Date().toISOString(),
  };
  localQueueStore.addRegistration(registration);

  let referral: Referral | null = null;
  if (tier === 'High') {
    referral = {
      id: createId('ref'),
      registrationId: registration.id,
      patientName: registration.patientName,
      riskFactors: registration.riskFactors,
      riskReasons: registration.riskReasons,
      riskTier: tier,
      gestationalAgeWeeks: registration.gestationalAgeWeeks,
      status: 'flagged',
      createdAt: new Date().toISOString(),
    };
    localQueueStore.addReferral(referral);
  }

  return { registration, referral };
}
