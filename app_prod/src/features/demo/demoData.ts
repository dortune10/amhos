import { cloudStore, localQueueStore } from '../../data/store';
import type { MotherCheckIn, Referral, Registration, ScheduledVisit } from '../../data/types';
import { scoreRisk } from '../../domain/riskEngine';
import { postnatalSchedule } from '../../domain/visitSchedule';

interface SeedPatient {
  id: string;
  patientName: string;
  gestationalAgeWeeks: number;
  riskFactors: string[];
  daysAgo: number;
  referralStatus?: Referral['status'];
  /** Set to seed a delivered patient mid-way through her 0-48h postnatal window. */
  deliveredHoursAgo?: number;
}

// Northern-Nigeria-plausible names and a spread of gestational ages / risk
// factors, so the caseload reads like a real week of fieldwork rather than
// "Test Patient 1..5".
const SEED_PATIENTS: SeedPatient[] = [
  {
    id: 'demo-reg-1',
    patientName: 'Hauwa Ibrahim',
    gestationalAgeWeeks: 34,
    riskFactors: ['prior_csection', 'advanced_maternal_age'],
    daysAgo: 6,
    referralStatus: 'outcome_logged',
    // Delivered 30h ago: her 6h and 24h checks are overdue, 48h is upcoming.
    deliveredHoursAgo: 30,
  },
  {
    id: 'demo-reg-2',
    patientName: 'Ngozi Okafor',
    gestationalAgeWeeks: 28,
    riskFactors: ['hypertension_non_severe'],
    daysAgo: 5,
  },
  {
    id: 'demo-reg-3',
    patientName: 'Fatima Bello',
    gestationalAgeWeeks: 39,
    riskFactors: ['severe_hypertension'],
    daysAgo: 3,
    referralStatus: 'received',
  },
  {
    id: 'demo-reg-4',
    patientName: 'Blessing Adeyemi',
    gestationalAgeWeeks: 16,
    riskFactors: [],
    daysAgo: 2,
  },
  {
    id: 'demo-reg-5',
    patientName: 'Zainab Musa',
    gestationalAgeWeeks: 31,
    riskFactors: ['adolescent_pregnancy', 'short_interpregnancy_interval'],
    daysAgo: 1,
    referralStatus: 'dispatched',
  },
  {
    id: 'demo-reg-6',
    patientName: 'Amara Nwosu',
    gestationalAgeWeeks: 22,
    riskFactors: [],
    daysAgo: 1,
  },
];

const SEED_CHECK_INS: { id: string; registrationId: string; symptom: string; hoursAgo: number; reviewed: boolean }[] = [
  {
    id: 'demo-checkin-1',
    registrationId: 'demo-reg-2',
    symptom: 'Swelling in hands, face, or legs',
    hoursAgo: 20,
    reviewed: false,
  },
  {
    id: 'demo-checkin-2',
    registrationId: 'demo-reg-4',
    symptom: 'All fine, no concerns',
    hoursAgo: 8,
    reviewed: true,
  },
];

// Anchored to real "now" so relative states the UI derives from the clock --
// overdue visits, SLA-breached referrals -- are genuinely true at demo time.
const daysAgoIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
const hoursAgoIso = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

export function resetDemo(): void {
  localQueueStore.clear();
  cloudStore.clear();
}

/**
 * Seeds a believable week of prior fieldwork, fully synced, so a presenter can
 * open on a populated caseload and demo the live golden path on top of it
 * rather than typing a first patient into an empty app.
 */
export function loadDemoScenario(): void {
  resetDemo();

  const registrations: Registration[] = [];
  const referrals: Referral[] = [];
  const visits: ScheduledVisit[] = [];

  for (const seed of SEED_PATIENTS) {
    const { tier, reasons } = scoreRisk(seed.riskFactors);
    const createdAt = daysAgoIso(seed.daysAgo);
    const syncedAt = daysAgoIso(Math.max(seed.daysAgo - 0.5, 0));
    const deliveredAt =
      seed.deliveredHoursAgo !== undefined ? hoursAgoIso(seed.deliveredHoursAgo) : undefined;

    const registration: Registration = {
      id: seed.id,
      patientName: seed.patientName,
      gestationalAgeWeeks: seed.gestationalAgeWeeks,
      riskFactors: seed.riskFactors,
      riskTier: tier,
      riskReasons: reasons,
      createdAt,
      syncedAt,
      deliveredAt,
    };
    registrations.push(registration);

    if (deliveredAt) {
      postnatalSchedule(deliveredAt).forEach((checkpoint, index) => {
        visits.push({
          id: `${seed.id}-visit-${index}`,
          registrationId: seed.id,
          patientName: seed.patientName,
          kind: 'postnatal',
          label: checkpoint.label,
          dueAt: checkpoint.dueAt,
          createdAt: deliveredAt,
          syncedAt: deliveredAt,
        });
      });
    }

    if (tier === 'High') {
      referrals.push({
        id: `${seed.id}-ref`,
        registrationId: seed.id,
        patientName: seed.patientName,
        riskFactors: seed.riskFactors,
        riskReasons: reasons,
        riskTier: tier,
        gestationalAgeWeeks: seed.gestationalAgeWeeks,
        status: seed.referralStatus ?? 'flagged',
        createdAt,
        syncedAt,
      });
    }
  }

  const checkIns: MotherCheckIn[] = SEED_CHECK_INS.map((seed) => {
    const registration = registrations.find((r) => r.id === seed.registrationId);
    return {
      id: seed.id,
      registrationId: seed.registrationId,
      patientName: registration?.patientName ?? 'Unknown patient',
      symptom: seed.symptom,
      createdAt: hoursAgoIso(seed.hoursAgo),
      reviewed: seed.reviewed,
      escalated: false,
      syncedAt: hoursAgoIso(seed.hoursAgo),
    };
  });

  localQueueStore.replaceAll({ registrations, referrals, checkIns, visits });
  cloudStore.mergeSyncedItems({ registrations, referrals, checkIns, visits });

  for (const referral of referrals) {
    cloudStore.addNotification({
      id: `${referral.id}-notif`,
      kind: 'referral_alert',
      targetRole: 'facility',
      message: `High-risk referral incoming: ${referral.patientName} (${referral.gestationalAgeWeeks}w) — ${
        referral.riskReasons.join(', ') || 'flagged for review'
      }`,
      createdAt: referral.createdAt,
    });
  }
}
