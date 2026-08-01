import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PatientDetail } from './PatientDetail';
import { registerPatient } from '../registration/registerPatient';
import { recordDelivery } from '../visits/visitService';
import { submitCheckIn } from '../checkins/checkInService';

function seedHighRisk(name = 'Amina Yusuf') {
  return registerPatient({
    patientName: name,
    gestationalAgeWeeks: 34,
    riskFactorIds: ['severe_hypertension'],
  }).registration;
}

describe('PatientDetail', () => {
  beforeEach(() => localStorage.clear());

  it('shows the patient name, gestational age and risk tier', () => {
    const reg = seedHighRisk();
    render(<PatientDetail registrationId={reg.id} onClose={vi.fn()} />);
    // Header is scoped separately: gestational age and risk reasons also
    // legitimately appear again inside the timeline below.
    const header = within(document.querySelector('.patient-detail-header') as HTMLElement);
    expect(screen.getByRole('heading', { name: /amina yusuf/i })).toBeInTheDocument();
    expect(header.getByText(/34/)).toBeInTheDocument();
    expect(header.getByText('High')).toBeInTheDocument();
  });

  it('explains why the patient was flagged', () => {
    const reg = seedHighRisk();
    render(<PatientDetail registrationId={reg.id} onClose={vi.fn()} />);
    const reasons = within(document.querySelector('.patient-risk-reasons') as HTMLElement);
    expect(reasons.getByText(/severe hypertension/i)).toBeInTheDocument();
  });

  it('includes the auto-generated referral in the timeline', () => {
    const reg = seedHighRisk();
    render(<PatientDetail registrationId={reg.id} onClose={vi.fn()} />);
    const timeline = screen.getByTestId('patient-timeline');
    expect(timeline.textContent).toMatch(/referral/i);
  });

  it('includes mother check-ins in the timeline', () => {
    const reg = seedHighRisk();
    submitCheckIn({ registrationId: reg.id, symptom: 'Severe headache' });
    render(<PatientDetail registrationId={reg.id} onClose={vi.fn()} />);
    expect(screen.getByTestId('patient-timeline').textContent).toMatch(/severe headache/i);
  });

  it('includes scheduled postnatal visits in the timeline once delivery is recorded', () => {
    const reg = seedHighRisk();
    recordDelivery(reg.id);
    render(<PatientDetail registrationId={reg.id} onClose={vi.fn()} />);
    expect(screen.getByTestId('patient-timeline').textContent).toMatch(/48h check/i);
  });

  it('orders timeline entries chronologically, newest first', () => {
    const reg = seedHighRisk();
    submitCheckIn({ registrationId: reg.id, symptom: 'Feeling dizzy' });
    render(<PatientDetail registrationId={reg.id} onClose={vi.fn()} />);
    const entries = screen.getAllByTestId('timeline-entry');
    const times = entries.map((e) => Number(e.getAttribute('data-at')));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('can be dismissed', () => {
    const reg = seedHighRisk();
    const onClose = vi.fn();
    render(<PatientDetail registrationId={reg.id} onClose={onClose} />);
    screen.getByRole('button', { name: /close/i }).click();
    expect(onClose).toHaveBeenCalled();
  });

  it('handles a missing patient without crashing', () => {
    expect(() =>
      render(<PatientDetail registrationId="nope" onClose={vi.fn()} />),
    ).not.toThrow();
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
