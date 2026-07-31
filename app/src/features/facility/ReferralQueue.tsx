import { cloudStore } from '../../data/store';
import type { Referral, RiskTier } from '../../data/types';
import { useStoreVersion } from '../../data/useStoreVersion';

const TIER_RANK: Record<RiskTier, number> = { High: 0, Medium: 1, Low: 2 };

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
          </li>
        ))}
      </ul>
    </div>
  );
}
