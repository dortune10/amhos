import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DemoControls } from './DemoControls';
import { localQueueStore } from '../../data/store';
import { registerPatient } from '../registration/registerPatient';

describe('DemoControls', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads the seeded scenario on demand', () => {
    render(<DemoControls />);
    fireEvent.click(screen.getByRole('button', { name: /load demo data/i }));
    expect(localQueueStore.getAll().registrations.length).toBeGreaterThan(0);
  });

  it('clears everything when reset is confirmed', () => {
    registerPatient({ patientName: 'Live Patient', gestationalAgeWeeks: 20, riskFactorIds: [] });
    render(<DemoControls />);

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    expect(localQueueStore.getAll().registrations).toHaveLength(0);
  });

  it('does not clear anything if the reset confirmation is dismissed', () => {
    registerPatient({ patientName: 'Live Patient', gestationalAgeWeeks: 20, riskFactorIds: [] });
    render(<DemoControls />);

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(localQueueStore.getAll().registrations).toHaveLength(1);
  });
});
