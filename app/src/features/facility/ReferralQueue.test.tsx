import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ReferralQueue } from './ReferralQueue';
import { registerPatient } from '../registration/registerPatient';
import { syncNow } from '../sync/syncService';
import { cloudStore } from '../../data/store';
import type { Referral } from '../../data/types';

describe('ReferralQueue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows a synced high-risk referral with its risk context', () => {
    registerPatient({
      patientName: 'Amina',
      gestationalAgeWeeks: 30,
      riskFactorIds: ['severe_hypertension'],
    });
    syncNow();

    render(<ReferralQueue />);

    expect(screen.getByText('Amina')).toBeInTheDocument();
    expect(screen.getByText(/severe hypertension/i)).toBeInTheDocument();
  });

  it('never shows a referral that has not been synced', () => {
    registerPatient({
      patientName: 'Unsynced Patient',
      gestationalAgeWeeks: 28,
      riskFactorIds: ['active_bleeding'],
    });
    // deliberately no syncNow() call

    render(<ReferralQueue />);

    expect(screen.queryByText('Unsynced Patient')).not.toBeInTheDocument();
  });

  it('sorts High risk before Medium before Low', () => {
    // Seeded directly: a Medium/Low referral can only reach the queue via a
    // mother-check-in escalation (Task 9), which carries its own riskTier
    // independent of the auto-creation gate in registerPatient.
    const base: Omit<Referral, 'id' | 'patientName' | 'riskTier'> = {
      registrationId: 'reg-x',
      riskFactors: [],
      riskReasons: [],
      gestationalAgeWeeks: 20,
      status: 'flagged',
      createdAt: new Date().toISOString(),
      syncedAt: new Date().toISOString(),
    };
    cloudStore.mergeSyncedItems({
      registrations: [],
      checkIns: [],
      referrals: [
        { ...base, id: 'ref-low', patientName: 'LowPatient', riskTier: 'Low' },
        { ...base, id: 'ref-high', patientName: 'HighPatient', riskTier: 'High' },
        { ...base, id: 'ref-medium', patientName: 'MediumPatient', riskTier: 'Medium' },
      ],
    });

    render(<ReferralQueue />);
    const rows = screen.getAllByTestId('referral-row');
    expect(within(rows[0]).getByText('HighPatient')).toBeInTheDocument();
    expect(within(rows[1]).getByText('MediumPatient')).toBeInTheDocument();
    expect(within(rows[2]).getByText('LowPatient')).toBeInTheDocument();
  });
});
