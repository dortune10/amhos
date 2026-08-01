import { cloudStore } from '../../data/store';
import type { ReferralStatus, RiskTier } from '../../data/types';
import { useStoreVersion } from '../../data/useStoreVersion';

const TIERS: RiskTier[] = ['High', 'Medium', 'Low'];
const STATUSES: ReferralStatus[] = ['flagged', 'dispatched', 'received', 'outcome_logged'];

export function DistrictView() {
  useStoreVersion();
  // Aggregate-only, and reads only the synced cloud store -- per PRD access
  // control, this tier never sees patient-level data.
  const { registrations, referrals } = cloudStore.getAll();

  const tierCounts = TIERS.map((tier) => ({
    tier,
    count: registrations.filter((r) => r.riskTier === tier).length,
  }));

  const statusCounts = STATUSES.map((status) => ({
    status,
    count: referrals.filter((r) => r.status === status).length,
  }));

  return (
    <div className="district-view">
      <h2>District overview</h2>
      <p className="access-note">Aggregate-only — no patient-level data shown at this tier.</p>
      <section>
        <h3>Registrations: {registrations.length} total</h3>
        <ul>
          {tierCounts.map(({ tier, count }) => (
            <li key={tier}>
              {tier}: {count}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3>Referrals: {referrals.length} total</h3>
        <ul>
          {statusCounts.map(({ status, count }) => (
            <li key={status}>
              {status.replace('_', ' ')}: {count}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
