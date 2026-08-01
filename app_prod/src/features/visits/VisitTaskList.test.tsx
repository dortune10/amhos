import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { VisitTaskList } from './VisitTaskList';
import { recordDelivery } from './visitService';
import { registerPatient } from '../registration/registerPatient';
import { localQueueStore } from '../../data/store';

function seedDelivered(name = 'Amina', deliveredAt?: string) {
  const { registration } = registerPatient({
    patientName: name,
    gestationalAgeWeeks: 39,
    riskFactorIds: [],
  });
  recordDelivery(registration.id, deliveredAt);
  return registration;
}

describe('VisitTaskList', () => {
  beforeEach(() => localStorage.clear());

  it('shows an empty state when nothing is scheduled', () => {
    render(<VisitTaskList />);
    expect(screen.getByText(/no scheduled visits/i)).toBeInTheDocument();
  });

  it('lists postnatal checkpoints after a delivery is recorded', () => {
    seedDelivered('Fatima');
    render(<VisitTaskList />);
    const rows = screen.getAllByTestId('visit-row');
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(within(rows[0]).getByText('Fatima')).toBeInTheDocument();
  });

  it('flags a checkpoint whose due time has passed as overdue', () => {
    // Delivered three days ago, so every 0-48h checkpoint is now overdue.
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    seedDelivered('Zainab', threeDaysAgo);
    render(<VisitTaskList />);
    expect(screen.getAllByText(/overdue/i).length).toBeGreaterThan(0);
  });

  it('completing a visit removes it from the list', () => {
    seedDelivered();
    render(<VisitTaskList />);
    const before = screen.getAllByTestId('visit-row').length;

    fireEvent.click(within(screen.getAllByTestId('visit-row')[0]).getByRole('button', { name: /done/i }));

    expect(screen.getAllByTestId('visit-row')).toHaveLength(before - 1);
    expect(localQueueStore.getAll().visits.some((v) => v.completedAt)).toBe(true);
  });
});
