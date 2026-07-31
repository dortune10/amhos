import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';

describe('App (full golden path via the composed UI)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('registers a high-risk patient offline, syncs, and the facility sees the referral with a notification', () => {
    render(<App />);

    // Caseworker registers a high-risk patient while Airplane Mode is on by default.
    fireEvent.change(screen.getByLabelText(/patient name/i), { target: { value: 'Amina' } });
    fireEvent.change(screen.getByLabelText(/gestational age/i), { target: { value: '30' } });
    fireEvent.click(screen.getByLabelText(/severe hypertension/i));
    fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    // Sync Now should be disabled while Airplane Mode is on.
    expect(screen.getByRole('button', { name: /sync now/i })).toBeDisabled();

    // Turn off Airplane Mode and sync.
    fireEvent.click(screen.getByLabelText(/airplane mode/i));
    fireEvent.click(screen.getByRole('button', { name: /sync now/i }));

    // Switch to the Facility role.
    fireEvent.click(screen.getByRole('tab', { name: /facility/i }));

    expect(screen.getByText('Amina')).toBeInTheDocument();
    expect(screen.getByText(/high-risk referral incoming/i)).toBeInTheDocument();
  });

  it('preserves store state across a role switch', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/patient name/i), { target: { value: 'Chidinma' } });
    fireEvent.change(screen.getByLabelText(/gestational age/i), { target: { value: '18' } });
    fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    fireEvent.click(screen.getByRole('tab', { name: /facility/i }));
    fireEvent.click(screen.getByRole('tab', { name: /caseworker/i }));

    const caseload = within(screen.getByText(/my caseload/i).closest('div')!);
    expect(caseload.getByText('Chidinma')).toBeInTheDocument();
  });
});
