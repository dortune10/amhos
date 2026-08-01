import { useStoreVersion } from '../../data/useStoreVersion';
import { visitUrgency } from '../../domain/visitSchedule';
import { completeVisit, dueVisits } from './visitService';

const URGENCY_LABEL: Record<string, string> = {
  overdue: 'Overdue',
  'due-soon': 'Due soon',
  upcoming: 'Upcoming',
};

function formatDue(dueAt: string): string {
  return new Date(dueAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function VisitTaskList() {
  useStoreVersion();
  const visits = dueVisits();
  const now = new Date().toISOString();

  if (visits.length === 0) {
    return (
      <div className="visit-task-list">
        <h2>Scheduled visits</h2>
        <p className="empty-state">No scheduled visits.</p>
      </div>
    );
  }

  return (
    <div className="visit-task-list">
      <h2>Scheduled visits</h2>
      <p className="section-note">
        Postnatal checks are scheduled automatically across the critical 0–48h window.
      </p>
      <ul>
        {visits.map((visit) => {
          const urgency = visitUrgency(visit.dueAt, now);
          return (
            <li
              key={visit.id}
              data-testid="visit-row"
              className={`visit-row visit-row--${urgency}`}
            >
              <span className="patient-name">{visit.patientName}</span>
              <span className="visit-label">{visit.label}</span>
              <span className={`visit-urgency visit-urgency--${urgency}`}>
                {URGENCY_LABEL[urgency]}
              </span>
              <span className="visit-due">{formatDue(visit.dueAt)}</span>
              <button type="button" onClick={() => completeVisit(visit.id)}>
                Done
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
