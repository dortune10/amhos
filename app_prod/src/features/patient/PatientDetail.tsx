import { localQueueStore } from '../../data/store';
import { useStoreVersion } from '../../data/useStoreVersion';

interface PatientDetailProps {
  registrationId: string;
  onClose: () => void;
}

interface TimelineEntry {
  id: string;
  at: string;
  kind: string;
  summary: string;
  detail?: string;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function PatientDetail({ registrationId, onClose }: PatientDetailProps) {
  useStoreVersion();
  const { registrations, referrals, checkIns, visits } = localQueueStore.getAll();
  const registration = registrations.find((r) => r.id === registrationId);

  if (!registration) {
    return (
      <div className="patient-detail">
        <p className="empty-state">Patient not found.</p>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  const entries: TimelineEntry[] = [
    {
      id: `reg-${registration.id}`,
      at: registration.createdAt,
      kind: 'Registered',
      summary: `Registered at ${registration.gestationalAgeWeeks} weeks`,
      detail: registration.riskReasons.join(', ') || undefined,
    },
    ...referrals
      .filter((r) => r.registrationId === registrationId)
      .map((r) => ({
        id: r.id,
        at: r.createdAt,
        kind: 'Referral',
        summary: `Referral — ${r.status.replace('_', ' ')}`,
        detail: r.riskReasons.join(', ') || undefined,
      })),
    ...checkIns
      .filter((c) => c.registrationId === registrationId)
      .map((c) => ({
        id: c.id,
        at: c.createdAt,
        kind: 'Check-in',
        summary: c.symptom,
        detail: c.escalated ? 'Escalated to referral' : c.reviewed ? 'Reviewed' : 'Awaiting review',
      })),
    ...visits
      .filter((v) => v.registrationId === registrationId)
      .map((v) => ({
        id: v.id,
        at: v.dueAt,
        kind: v.kind === 'postnatal' ? 'Postnatal' : 'ANC',
        summary: v.label,
        detail: v.completedAt ? 'Completed' : 'Scheduled',
      })),
  ];

  if (registration.deliveredAt) {
    entries.push({
      id: `delivery-${registration.id}`,
      at: registration.deliveredAt,
      kind: 'Delivery',
      summary: 'Delivery recorded',
    });
  }

  entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="patient-detail">
      <div className="patient-detail-header">
        <div>
          <h2>{registration.patientName}</h2>
          <p className="patient-meta">
            {registration.gestationalAgeWeeks} weeks
            {registration.deliveredAt ? ' · delivered' : ''}
          </p>
        </div>
        <span className={`tier-badge tier-badge--${registration.riskTier.toLowerCase()}`}>
          {registration.riskTier}
        </span>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {registration.riskReasons.length > 0 && (
        <div className="patient-risk-reasons">
          <h3>Why this patient is flagged</h3>
          <ul>
            {registration.riskReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      <h3>Timeline</h3>
      <ol className="patient-timeline" data-testid="patient-timeline">
        {entries.map((entry) => (
          <li
            key={entry.id}
            data-testid="timeline-entry"
            data-at={new Date(entry.at).getTime()}
            className="timeline-entry"
          >
            <span className="timeline-kind">{entry.kind}</span>
            <span className="timeline-summary">{entry.summary}</span>
            {entry.detail && <span className="timeline-detail">{entry.detail}</span>}
            <span className="timeline-when">{formatWhen(entry.at)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
