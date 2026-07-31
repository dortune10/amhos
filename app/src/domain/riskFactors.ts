export interface RiskFactorDefinition {
  id: string;
  label: string;
}

// Tier 3: any single one present forces High, overriding everything else.
export const TIER_3_RED_FLAGS: RiskFactorDefinition[] = [
  { id: 'active_bleeding', label: 'Active vaginal bleeding' },
  { id: 'severe_abdominal_pain', label: 'Severe abdominal pain' },
  {
    id: 'convulsions_eclampsia_history',
    label: 'Convulsions or history of eclampsia/severe pre-eclampsia',
  },
  { id: 'severe_hypertension', label: 'Severe hypertension (BP ≥160/110)' },
  { id: 'obstructed_labor_signs', label: 'Signs of obstructed/prolonged labor' },
  {
    id: 'malpresentation_at_term',
    label: 'Known malpresentation (e.g., breech) at or near term',
  },
];

// Tier 2: 0 -> Low, 1 -> Medium, 2+ -> High.
export const TIER_2_MODERATE_FACTORS: RiskFactorDefinition[] = [
  { id: 'adolescent_pregnancy', label: 'Adolescent pregnancy (<18 years)' },
  { id: 'prior_csection', label: 'Prior C-section' },
  { id: 'hypertension_non_severe', label: 'Hypertension (below severe threshold)' },
  { id: 'prior_pph', label: 'History of postpartum hemorrhage' },
  { id: 'grand_multipara', label: 'Grand multipara (5+ prior pregnancies)' },
  {
    id: 'short_interpregnancy_interval',
    label: 'Short inter-pregnancy interval (<18 months)',
  },
  { id: 'multiple_gestation', label: 'Multiple gestation (twins/triplets)' },
  { id: 'advanced_maternal_age', label: 'Advanced maternal age (>35)' },
];

export const ALL_RISK_FACTORS: RiskFactorDefinition[] = [
  ...TIER_3_RED_FLAGS,
  ...TIER_2_MODERATE_FACTORS,
];
