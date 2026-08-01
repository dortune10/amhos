export type RiskTier = 'Low' | 'Medium' | 'High';

export interface Registration {
  id: string;
  patientName: string;
  gestationalAgeWeeks: number;
  riskFactors: string[];
  riskTier: RiskTier;
  riskReasons: string[];
  createdAt: string;
  syncedAt?: string;
  /** Set when the caseworker records the birth; triggers postnatal scheduling. */
  deliveredAt?: string;
}

export type ReferralStatus = 'flagged' | 'dispatched' | 'received' | 'outcome_logged';

export interface Referral {
  id: string;
  registrationId: string;
  patientName: string;
  riskFactors: string[];
  riskReasons: string[];
  riskTier: RiskTier;
  gestationalAgeWeeks: number;
  status: ReferralStatus;
  createdAt: string;
  syncedAt?: string;
}

export interface MotherCheckIn {
  id: string;
  registrationId: string;
  patientName: string;
  symptom: string;
  createdAt: string;
  reviewed: boolean;
  escalated: boolean;
  syncedAt?: string;
}

export type VisitKind = 'anc' | 'postnatal';

export interface ScheduledVisit {
  id: string;
  registrationId: string;
  patientName: string;
  kind: VisitKind;
  label: string;
  dueAt: string;
  completedAt?: string;
  createdAt: string;
  syncedAt?: string;
}

export interface WhatsAppNotification {
  id: string;
  kind: 'referral_alert' | 'checkin_alert';
  targetRole: 'facility' | 'caseworker';
  message: string;
  createdAt: string;
}
