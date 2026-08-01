import type { Referral } from '../data/types';

/**
 * Expected time from a referral being raised to the patient being received.
 * Exceeding it is a signal about the transport system, not the individual
 * case -- surfacing these on the district view is how systemic bottlenecks
 * become visible rather than being absorbed as individual bad luck.
 *
 * Prototype placeholder value; a real deployment would set this per district.
 */
export const SLA_HOURS = 12;

/** Statuses meaning the patient has arrived -- the clock stops. */
const ARRIVED: Referral['status'][] = ['received', 'outcome_logged'];

export function hoursInTransit(referral: Referral, nowIso: string): number {
  const elapsedMs = new Date(nowIso).getTime() - new Date(referral.createdAt).getTime();
  return Math.floor(elapsedMs / 3_600_000);
}

export function isSlaBreached(referral: Referral, nowIso: string): boolean {
  if (ARRIVED.includes(referral.status)) return false;
  return hoursInTransit(referral, nowIso) > SLA_HOURS;
}
