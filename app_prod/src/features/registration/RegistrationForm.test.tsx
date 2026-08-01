import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { RegistrationForm } from './RegistrationForm';

describe('RegistrationForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('submitting with a red-flag factor shows a High risk result with reasons, offline by construction', () => {
    const onRegistered = vi.fn();
    render(<RegistrationForm onRegistered={onRegistered} />);

    fireEvent.change(screen.getByLabelText(/patient name/i), {
      target: { value: 'Amina' },
    });
    fireEvent.change(screen.getByLabelText(/gestational age/i), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByLabelText(/severe hypertension/i));
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    const status = screen.getByRole('status');
    expect(within(status).getByText(/high risk/i)).toBeInTheDocument();
    expect(within(status).getByText(/severe hypertension/i)).toBeInTheDocument();
    expect(onRegistered).toHaveBeenCalledTimes(1);
  });

  it('submitting with no risk factors shows Low risk', () => {
    render(<RegistrationForm onRegistered={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/patient name/i), {
      target: { value: 'Chidinma' },
    });
    fireEvent.change(screen.getByLabelText(/gestational age/i), {
      target: { value: '12' },
    });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    const status = screen.getByRole('status');
    expect(within(status).getByText(/low risk/i)).toBeInTheDocument();
  });

  it('clears the form after a successful submission', () => {
    render(<RegistrationForm onRegistered={vi.fn()} />);
    const nameInput = screen.getByLabelText(/patient name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Amina' } });
    fireEvent.change(screen.getByLabelText(/gestational age/i), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(nameInput.value).toBe('');
  });
});
