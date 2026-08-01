import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { CaseloadView } from './CaseloadView';
import { registerPatient } from '../registration/registerPatient';
import { localQueueStore } from '../../data/store';

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
    // Scoped to the row: "High" also appears as a risk-tier filter option.
    const row = within(screen.getAllByTestId('caseload-row')[0]);
    expect(row.getByText('Amina')).toBeInTheDocument();
    expect(row.getByText('High')).toBeInTheDocument();
    expect(row.getByText(/pending sync/i)).toBeInTheDocument();
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

  describe('search and filter', () => {
    beforeEach(() => {
      registerPatient({ patientName: 'Amina Yusuf', gestationalAgeWeeks: 30, riskFactorIds: ['severe_hypertension'] });
      registerPatient({ patientName: 'Ngozi Okafor', gestationalAgeWeeks: 22, riskFactorIds: ['prior_csection'] });
      registerPatient({ patientName: 'Blessing Ade', gestationalAgeWeeks: 14, riskFactorIds: [] });
    });

    it('filters the list by name as the caseworker types', () => {
      render(<CaseloadView />);
      fireEvent.change(screen.getByLabelText(/search/i), { target: { value: 'ngozi' } });
      const names = screen.getAllByTestId('patient-name').map((el) => el.textContent);
      expect(names).toEqual(['Ngozi Okafor']);
    });

    it('filters by risk tier', () => {
      render(<CaseloadView />);
      fireEvent.change(screen.getByLabelText(/risk tier/i), { target: { value: 'High' } });
      const names = screen.getAllByTestId('patient-name').map((el) => el.textContent);
      expect(names).toEqual(['Amina Yusuf']);
    });

    it('tells the caseworker when a filter matches nothing', () => {
      render(<CaseloadView />);
      fireEvent.change(screen.getByLabelText(/search/i), { target: { value: 'zzzz' } });
      expect(screen.getByText(/no patients match/i)).toBeInTheDocument();
    });
  });

  describe('recording a delivery', () => {
    beforeEach(() => {
      registerPatient({ patientName: 'Fatima Bello', gestationalAgeWeeks: 39, riskFactorIds: [] });
    });

    it('schedules postnatal checks when delivery is recorded', () => {
      render(<CaseloadView />);
      fireEvent.click(screen.getByRole('button', { name: /record delivery/i }));
      expect(localQueueStore.getAll().visits.length).toBeGreaterThanOrEqual(3);
    });

    it('replaces the action with a delivered marker afterwards', () => {
      render(<CaseloadView />);
      fireEvent.click(screen.getByRole('button', { name: /record delivery/i }));
      expect(screen.queryByRole('button', { name: /record delivery/i })).not.toBeInTheDocument();
      expect(screen.getByText(/delivered/i)).toBeInTheDocument();
    });
  });

  describe('selecting a patient', () => {
    it('notifies the parent with the selected patient id', () => {
      const { registration } = registerPatient({
        patientName: 'Amara Nwosu',
        gestationalAgeWeeks: 20,
        riskFactorIds: [],
      });
      const onSelect = vi.fn();
      render(<CaseloadView onSelectPatient={onSelect} />);

      fireEvent.click(within(screen.getAllByTestId('caseload-row')[0]).getByText('Amara Nwosu'));

      expect(onSelect).toHaveBeenCalledWith(registration.id);
    });
  });
});
