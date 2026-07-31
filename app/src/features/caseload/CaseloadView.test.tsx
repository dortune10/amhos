import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CaseloadView } from './CaseloadView';
import { registerPatient } from '../registration/registerPatient';

describe('CaseloadView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows an empty state when there are no registrations', () => {
    render(<CaseloadView />);
    expect(screen.getByText(/no patients registered yet/i)).toBeInTheDocument();
  });

  it('lists a registered patient with tier and pending-sync status', () => {
    registerPatient({
      patientName: 'Amina',
      gestationalAgeWeeks: 30,
      riskFactorIds: ['severe_hypertension'],
    });
    render(<CaseloadView />);
    expect(screen.getByText('Amina')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText(/pending sync/i)).toBeInTheDocument();
  });

  it('sorts unsynced high-risk patients first', () => {
    registerPatient({
      patientName: 'LowRiskPatient',
      gestationalAgeWeeks: 10,
      riskFactorIds: [],
    });
    registerPatient({
      patientName: 'HighRiskPatient',
      gestationalAgeWeeks: 30,
      riskFactorIds: ['severe_hypertension'],
    });
    render(<CaseloadView />);
    const names = screen.getAllByTestId('patient-name').map((el) => el.textContent);
    expect(names[0]).toBe('HighRiskPatient');
  });
});
