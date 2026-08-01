import { useMemo, useState } from 'react';
import { localQueueStore } from '../../data/store';
import type { Registration, RiskTier } from '../../data/types';
import { useStoreVersion } from '../../data/useStoreVersion';
import { recordDelivery } from '../visits/visitService';

interface CaseloadViewProps {
  onSelectPatient?: (registrationId: string) => void;
}

type TierFilter = 'all' | RiskTier;

function sortForCaseload(registrations: Registration[]): Registration[] {
  return [...registrations].sort((a, b) => {
    const aUrgent = a.riskTier === 'High' && !a.syncedAt;
    const bUrgent = b.riskTier === 'High' && !b.syncedAt;
    if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function CaseloadView({ onSelectPatient }: CaseloadViewProps) {
  useStoreVersion();
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<TierFilter>('all');
  const { registrations } = localQueueStore.getAll();

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return sortForCaseload(
      registrations.filter((r) => {
        const matchesName = !term || r.patientName.toLowerCase().includes(term);
        const matchesTier = tier === 'all' || r.riskTier === tier;
        return matchesName && matchesTier;
      }),
    );
  }, [registrations, search, tier]);

  if (registrations.length === 0) {
    return <p className="empty-state">No patients registered yet.</p>;
  }

  return (
    <div className="caseload-view">
      <h2>My caseload</h2>

      <div className="caseload-filters">
        <label>
          Search
          <input
            type="search"
            value={search}
            placeholder="Patient name"
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          Risk tier
          <select value={tier} onChange={(e) => setTier(e.target.value as TierFilter)}>
            <option value="all">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="empty-state">No patients match this filter.</p>
      ) : (
        <ul>
          {visible.map((r) => (
            <li
              key={r.id}
              data-testid="caseload-row"
              className={`caseload-row tier-${r.riskTier.toLowerCase()}`}
            >
              <button
                type="button"
                className="patient-name patient-name-button"
                data-testid="patient-name"
                onClick={() => onSelectPatient?.(r.id)}
              >
                {r.patientName}
              </button>
              <span className="gestational-age">{r.gestationalAgeWeeks}w</span>
              <span className={`tier-badge tier-badge--${r.riskTier.toLowerCase()}`}>
                {r.riskTier}
              </span>
              <span className={`sync-badge ${r.syncedAt ? 'synced' : 'unsynced'}`}>
                {r.syncedAt ? 'Synced' : 'Pending sync'}
              </span>
              {r.deliveredAt ? (
                <span className="delivered-badge">Delivered</span>
              ) : (
                <button
                  type="button"
                  className="record-delivery"
                  onClick={() => recordDelivery(r.id)}
                >
                  Record delivery
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
