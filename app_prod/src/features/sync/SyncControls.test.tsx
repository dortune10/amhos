import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SyncControls } from './SyncControls';
import { registerPatient } from '../registration/registerPatient';
import { cloudStore } from '../../data/store';

describe('SyncControls', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts in Airplane Mode with Sync Now disabled', () => {
    render(<SyncControls />);
    expect(screen.getByLabelText(/airplane mode/i)).toBeChecked();
    expect(screen.getByRole('button', { name: /sync now/i })).toBeDisabled();
  });

  it('syncs pending items once Airplane Mode is turned off', () => {
    registerPatient({
      patientName: 'Amina',
      gestationalAgeWeeks: 30,
      riskFactorIds: ['severe_hypertension'],
    });
    render(<SyncControls />);

    fireEvent.click(screen.getByLabelText(/airplane mode/i));
    const syncButton = screen.getByRole('button', { name: /sync now/i });
    expect(syncButton).not.toBeDisabled();

    fireEvent.click(syncButton);

    expect(cloudStore.getAll().referrals).toHaveLength(1);
    expect(screen.getByText(/0 pending/i)).toBeInTheDocument();
  });
});
