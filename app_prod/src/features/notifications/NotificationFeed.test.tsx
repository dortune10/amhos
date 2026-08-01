import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationFeed } from './NotificationFeed';
import { registerPatient } from '../registration/registerPatient';
import { syncNow } from '../sync/syncService';

describe('NotificationFeed', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows an empty state before any sync has happened', () => {
    render(<NotificationFeed />);
    expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument();
  });

  it('shows a notification immediately after a sync that includes a referral', () => {
    registerPatient({
      patientName: 'Amina',
      gestationalAgeWeeks: 30,
      riskFactorIds: ['severe_hypertension'],
    });
    syncNow();

    render(<NotificationFeed />);
    expect(screen.getByText(/amina/i)).toBeInTheDocument();
  });

  it('shows newest notifications first', () => {
    registerPatient({
      patientName: 'First',
      gestationalAgeWeeks: 30,
      riskFactorIds: ['severe_hypertension'],
    });
    syncNow();
    registerPatient({
      patientName: 'Second',
      gestationalAgeWeeks: 28,
      riskFactorIds: ['active_bleeding'],
    });
    syncNow();

    render(<NotificationFeed />);
    const bubbles = screen.getAllByTestId('notification-bubble');
    expect(bubbles[0].textContent).toMatch(/second/i);
  });
});
