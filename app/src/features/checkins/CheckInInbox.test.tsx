import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CheckInInbox } from './CheckInInbox';
import { registerPatient } from '../registration/registerPatient';

describe('CheckInInbox', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lets the caseworker simulate a WhatsApp check-in against a registered patient', () => {
    registerPatient({ patientName: 'Amina', gestationalAgeWeeks: 20, riskFactorIds: [] });
    render(<CheckInInbox />);

    fireEvent.change(screen.getByLabelText(/patient/i), { target: { value: 'Amina' } });
    fireEvent.change(screen.getByLabelText(/symptom/i), { target: { value: 'Severe headache' } });
    fireEvent.click(screen.getByRole('button', { name: /simulate/i }));

    const row = within(screen.getByTestId('checkin-row'));
    expect(row.getByText('Amina')).toBeInTheDocument();
    expect(row.getByText('Severe headache')).toBeInTheDocument();
  });

  it('escalates a check-in into a referral and marks it escalated', () => {
    registerPatient({ patientName: 'Chidinma', gestationalAgeWeeks: 22, riskFactorIds: [] });
    render(<CheckInInbox />);

    fireEvent.change(screen.getByLabelText(/patient/i), { target: { value: 'Chidinma' } });
    fireEvent.change(screen.getByLabelText(/symptom/i), {
      target: { value: 'Vaginal bleeding' },
    });
    fireEvent.click(screen.getByRole('button', { name: /simulate/i }));

    fireEvent.click(screen.getByRole('button', { name: /escalate/i }));

    expect(screen.getByText(/escalated/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /escalate/i })).not.toBeInTheDocument();
  });
});
