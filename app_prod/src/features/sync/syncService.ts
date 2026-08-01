import { cloudStore, localQueueStore } from '../../data/store';
import { createId } from '../../domain/id';

export function getPendingCount(): number {
  const { registrations, referrals, checkIns, visits } = localQueueStore.getAll();
  return (
    registrations.filter((r) => !r.syncedAt).length +
    referrals.filter((r) => !r.syncedAt).length +
    checkIns.filter((c) => !c.syncedAt).length +
    visits.filter((v) => !v.syncedAt).length
  );
}

export function syncNow(): { syncedReferrals: number } {
  const local = localQueueStore.getAll();
  const now = new Date().toISOString();

  const syncedRegistrations = local.registrations
    .filter((r) => !r.syncedAt)
    .map((r) => ({ ...r, syncedAt: now }));
  const syncedReferrals = local.referrals
    .filter((r) => !r.syncedAt)
    .map((r) => ({ ...r, syncedAt: now }));
  const syncedCheckIns = local.checkIns
    .filter((c) => !c.syncedAt)
    .map((c) => ({ ...c, syncedAt: now }));
  const syncedVisits = local.visits
    .filter((v) => !v.syncedAt)
    .map((v) => ({ ...v, syncedAt: now }));

  cloudStore.mergeSyncedItems({
    registrations: syncedRegistrations,
    referrals: syncedReferrals,
    checkIns: syncedCheckIns,
    visits: syncedVisits,
  });

  for (const referral of syncedReferrals) {
    cloudStore.addNotification({
      id: createId('notif'),
      kind: 'referral_alert',
      targetRole: 'facility',
      message: `High-risk referral incoming: ${referral.patientName} (${referral.gestationalAgeWeeks}w) — ${
        referral.riskReasons.join(', ') || 'flagged for review'
      }`,
      createdAt: now,
    });
  }

  // Mark the local (device) copies as synced too, so the caseload view's
  // sync badges and the pending count reflect what just happened. The local
  // queue is never emptied -- it's the caseworker's permanent device record.
  localQueueStore.replaceAll({
    registrations: local.registrations.map((r) => (r.syncedAt ? r : { ...r, syncedAt: now })),
    referrals: local.referrals.map((r) => (r.syncedAt ? r : { ...r, syncedAt: now })),
    checkIns: local.checkIns.map((c) => (c.syncedAt ? c : { ...c, syncedAt: now })),
    visits: local.visits.map((v) => (v.syncedAt ? v : { ...v, syncedAt: now })),
  });

  return { syncedReferrals: syncedReferrals.length };
}
