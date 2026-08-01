import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DistrictView } from './DistrictView';
import { registerPatient } from '../registration/registerPatient';
import { syncNow } from '../sync/syncService';

describe('DistrictView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows aggregate registration counts after a sync, with no patient names', () => {
    registerPatient({
      patientName: 'Amina',
      gestationalAgeWeeks: 30,
      riskFactorIds: ['severe_hypertension'],
    });
    registerPatient({ patientName: 'Chidinma', gestationalAgeWeeks: 12, riskFactorIds: [] });
    syncNow();

    render(<DistrictView />);

    expect(screen.getByText(/2 total/i)).toBeInTheDocument();
    expect(screen.queryByText('Amina')).not.toBeInTheDocument();
    expect(screen.queryByText('Chidinma')).not.toBeInTheDocument();
  });

  it('shows referral counts by status after a sync', () => {
    registerPatient({
      patientName: 'Amina',
      gestationalAgeWeeks: 30,
      riskFactorIds: ['severe_hypertension'],
    });
    syncNow();

    render(<DistrictView />);
    expect(screen.getByText(/flagged: 1/i)).toBeInTheDocument();
  });
});
