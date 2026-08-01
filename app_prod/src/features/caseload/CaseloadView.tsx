import { localQueueStore } from '../../data/store';
import type { Registration } from '../../data/types';
import { useStoreVersion } from '../../data/useStoreVersion';

function sortForCaseload(registrations: Registration[]): Registration[] {
  return [...registrations].sort((a, b) => {
    const aUrgent = a.riskTier === 'High' && !a.syncedAt;
    const bUrgent = b.riskTier === 'High' && !b.syncedAt;
    if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function CaseloadView() {
  useStoreVersion();
  const { registrations } = localQueueStore.getAll();
  const sorted = sortForCaseload(registrations);

  if (sorted.length === 0) {
    return <p className="empty-state">No patients registered yet.</p>;
  }

  return (
    <div className="caseload-view">
      <h2>My caseload</h2>
      <ul>
        {sorted.map((r) => (
          <li key={r.id} className={`caseload-row tier-${r.riskTier.toLowerCase()}`}>
            <span className="patient-name" data-testid="patient-name">
              {r.patientName}
            </span>
            <span className="gestational-age">{r.gestationalAgeWeeks}w</span>
            <span className={`tier-badge tier-badge--${r.riskTier.toLowerCase()}`}>
              {r.riskTier}
            </span>
            <span className={`sync-badge ${r.syncedAt ? 'synced' : 'unsynced'}`}>
              {r.syncedAt ? 'Synced' : 'Pending sync'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
