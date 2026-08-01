import { cloudStore } from '../../data/store';
import type { ReferralStatus, RiskTier } from '../../data/types';
import { useStoreVersion } from '../../data/useStoreVersion';
import { SLA_HOURS, isSlaBreached } from '../../domain/referralSla';

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

  const now = new Date().toISOString();
  const breachedCount = referrals.filter((r) => isSlaBreached(r, now)).length;

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
      <section>
        <h3>Transport delays</h3>
        <p className="access-note">
          In-flight referrals past the {SLA_HOURS}h expected transit window — a signal about
          transport capacity, not individual cases.
        </p>
        <ul>
          <li className={breachedCount > 0 ? 'district-alert' : undefined}>
            Delayed in transit: {breachedCount}
          </li>
        </ul>
      </section>
    </div>
  );
}
