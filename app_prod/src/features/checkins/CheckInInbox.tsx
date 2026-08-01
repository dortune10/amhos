import { useState, type FormEvent } from 'react';
import { localQueueStore } from '../../data/store';
import { useStoreVersion } from '../../data/useStoreVersion';
import { CHECK_IN_SYMPTOMS } from '../../domain/checkInSymptoms';
import { escalateCheckIn, markReviewed, submitCheckIn } from './checkInService';

export function CheckInInbox() {
  useStoreVersion();
  const { registrations, checkIns } = localQueueStore.getAll();
  const [patientName, setPatientName] = useState('');
  const [symptom, setSymptom] = useState(CHECK_IN_SYMPTOMS[0]);

  function handleSimulate(event: FormEvent) {
    event.preventDefault();
    const registration = registrations.find((r) => r.patientName === patientName);
    if (!registration) return;
    submitCheckIn({ registrationId: registration.id, symptom });
    setPatientName('');
  }

  return (
    <div className="checkin-inbox">
      <h2>Mother check-ins</h2>
      <p className="mock-disclaimer">
        Simulated WhatsApp check-in for the prototype — a structured pick-list, not free text.
      </p>
      <form onSubmit={handleSimulate}>
        <label>
          Patient
          <select
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
          >
            <option value="" disabled>
              Select a patient
            </option>
            {registrations.map((r) => (
              <option key={r.id} value={r.patientName}>
                {r.patientName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Symptom
          <select value={symptom} onChange={(e) => setSymptom(e.target.value)}>
            {CHECK_IN_SYMPTOMS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Simulate check-in</button>
      </form>

      {checkIns.length === 0 ? (
        <p className="empty-state">No check-ins yet.</p>
      ) : (
        <ul>
          {checkIns.map((c) => (
            <li key={c.id} data-testid="checkin-row" className="checkin-row">
              <span className="patient-name">{c.patientName}</span>
              <span className="symptom">{c.symptom}</span>
              {c.escalated ? (
                <span className="escalated-badge">Escalated</span>
              ) : (
                <>
                  {!c.reviewed && (
                    <button type="button" onClick={() => markReviewed(c.id)}>
                      Mark reviewed
                    </button>
                  )}
                  <button type="button" onClick={() => escalateCheckIn(c.id)}>
                    Escalate to referral
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
