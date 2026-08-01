import { cloudStore } from '../../data/store';
import type { Referral, ReferralStatus, RiskTier } from '../../data/types';
import { useStoreVersion } from '../../data/useStoreVersion';

const TIER_RANK: Record<RiskTier, number> = { High: 0, Medium: 1, Low: 2 };

const STATUS_SEQUENCE: ReferralStatus[] = ['flagged', 'dispatched', 'received', 'outcome_logged'];

function nextStatus(status: ReferralStatus): ReferralStatus | null {
  const index = STATUS_SEQUENCE.indexOf(status);
  return index >= 0 && index < STATUS_SEQUENCE.length - 1 ? STATUS_SEQUENCE[index + 1] : null;
}

function advanceReferral(referralId: string, next: ReferralStatus): void {
  cloudStore.updateReferral(referralId, (r) => ({ ...r, status: next }));
}

function sortReferrals(referrals: Referral[]): Referral[] {
  return [...referrals].sort((a, b) => {
    const tierDelta = TIER_RANK[a.riskTier] - TIER_RANK[b.riskTier];
    if (tierDelta !== 0) return tierDelta;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function ReferralQueue() {
  useStoreVersion();
  // Facility view reads only from the cloud/synced store -- unsynced data on
  // a caseworker's device must never be visible here.
  const { referrals } = cloudStore.getAll();
  const sorted = sortReferrals(referrals);

  if (sorted.length === 0) {
    return <p className="empty-state">No incoming referrals yet.</p>;
  }

  return (
    <div className="referral-queue">
      <h2>Incoming referrals</h2>
      <ul>
        {sorted.map((r) => (
          <li key={r.id} data-testid="referral-row" className={`referral-row tier-${r.riskTier.toLowerCase()}`}>
            <span className="patient-name">{r.patientName}</span>
            <span className="gestational-age">{r.gestationalAgeWeeks}w</span>
            <span className={`tier-badge tier-badge--${r.riskTier.toLowerCase()}`}>{r.riskTier}</span>
            {r.riskReasons.length > 0 && (
              <ul className="risk-reasons">
                {r.riskReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
            <span className="referral-status">{r.status.replace('_', ' ')}</span>
            {nextStatus(r.status) && (
              <button type="button" onClick={() => advanceReferral(r.id, nextStatus(r.status)!)}>
                Mark {nextStatus(r.status)!.replace('_', ' ')}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
