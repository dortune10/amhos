import { describe, it, expect } from 'vitest';
import { scoreRisk } from './riskEngine';

describe('scoreRisk', () => {
  it('returns Low with no reasons when no factors are present', () => {
    const result = scoreRisk([]);
    expect(result.tier).toBe('Low');
    expect(result.reasons).toEqual([]);
  });

  it('returns Medium with one reason when exactly one Tier 2 factor is present', () => {
    const result = scoreRisk(['prior_csection']);
    expect(result.tier).toBe('Medium');
    expect(result.reasons).toEqual(['Prior C-section']);
  });

  it('returns High when two or more Tier 2 factors are present', () => {
    const result = scoreRisk(['prior_csection', 'advanced_maternal_age']);
    expect(result.tier).toBe('High');
    expect(result.reasons).toContain('Prior C-section');
    expect(result.reasons).toContain('Advanced maternal age (>35)');
    expect(result.reasons).toHaveLength(2);
  });

  it('returns High on a single Tier 3 red-flag factor regardless of others', () => {
    const result = scoreRisk(['severe_hypertension']);
    expect(result.tier).toBe('High');
    expect(result.reasons).toEqual(['Severe hypertension (BP ≥160/110)']);
  });

  it('a Tier 3 red flag overrides Tier 2 accounting -- reasons list only the red flag', () => {
    const result = scoreRisk(['active_bleeding', 'adolescent_pregnancy']);
    expect(result.tier).toBe('High');
    expect(result.reasons).toEqual(['Active vaginal bleeding']);
  });

  it('multiple Tier 3 red flags all appear in reasons', () => {
    const result = scoreRisk(['active_bleeding', 'severe_abdominal_pain']);
    expect(result.tier).toBe('High');
    expect(result.reasons).toContain('Active vaginal bleeding');
    expect(result.reasons).toContain('Severe abdominal pain');
  });

  it('ignores unrecognized factor ids without throwing', () => {
    expect(() => scoreRisk(['not_a_real_factor'])).not.toThrow();
    expect(scoreRisk(['not_a_real_factor']).tier).toBe('Low');
  });
});
