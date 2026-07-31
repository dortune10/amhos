import { useState, type FormEvent } from 'react';
import { ALL_RISK_FACTORS } from '../../domain/riskFactors';
import type { RiskScore } from '../../domain/riskEngine';
import { registerPatient } from './registerPatient';

interface RegistrationFormProps {
  onRegistered: () => void;
}

export function RegistrationForm({ onRegistered }: RegistrationFormProps) {
  const [patientName, setPatientName] = useState('');
  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState('');
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<RiskScore | null>(null);

  function toggleFactor(id: string) {
    setSelectedFactors((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const { registration } = registerPatient({
      patientName,
      gestationalAgeWeeks: Number(gestationalAgeWeeks) || 0,
      riskFactorIds: selectedFactors,
    });
    setLastResult({ tier: registration.riskTier, reasons: registration.riskReasons });
    setPatientName('');
    setGestationalAgeWeeks('');
    setSelectedFactors([]);
    onRegistered();
  }

  return (
    <div className="registration-form">
      <h2>New registration</h2>
      <p className="offline-note">Works fully offline — nothing here depends on a network call.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Patient name
          <input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
          />
        </label>
        <label>
          Gestational age (weeks)
          <input
            type="number"
            min={0}
            max={45}
            value={gestationalAgeWeeks}
            onChange={(e) => setGestationalAgeWeeks(e.target.value)}
            required
          />
        </label>
        <fieldset>
          <legend>Risk factors</legend>
          {ALL_RISK_FACTORS.map((factor) => (
            <label key={factor.id} className="risk-factor-option">
              <input
                type="checkbox"
                checked={selectedFactors.includes(factor.id)}
                onChange={() => toggleFactor(factor.id)}
              />
              {factor.label}
            </label>
          ))}
        </fieldset>
        <button type="submit">Register</button>
      </form>
      {lastResult && (
        <div
          className={`risk-result risk-result--${lastResult.tier.toLowerCase()}`}
          role="status"
        >
          <strong>{lastResult.tier} risk</strong>
          {lastResult.reasons.length > 0 && (
            <ul>
              {lastResult.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
