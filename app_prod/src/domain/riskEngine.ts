import type { RiskTier } from '../data/types';
import { TIER_2_MODERATE_FACTORS, TIER_3_RED_FLAGS } from './riskFactors';

export interface RiskScore {
  tier: RiskTier;
  reasons: string[];
}

/**
 * NOT clinically validated -- hackathon placeholder, see AMHOS_PRD.md §6a.
 * Red-flag override: any Tier 3 factor forces High on its own.
 * Otherwise Tier 2 factors accumulate: 0 -> Low, 1 -> Medium, 2+ -> High.
 */
export function scoreRisk(riskFactorIds: string[]): RiskScore {
  const presentTier3 = TIER_3_RED_FLAGS.filter((f) => riskFactorIds.includes(f.id));
  if (presentTier3.length > 0) {
    return { tier: 'High', reasons: presentTier3.map((f) => f.label) };
  }

  const presentTier2 = TIER_2_MODERATE_FACTORS.filter((f) => riskFactorIds.includes(f.id));
  if (presentTier2.length === 0) {
    return { tier: 'Low', reasons: [] };
  }
  if (presentTier2.length === 1) {
    return { tier: 'Medium', reasons: presentTier2.map((f) => f.label) };
  }
  return { tier: 'High', reasons: presentTier2.map((f) => f.label) };
}
