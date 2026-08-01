import { describe, it, expect, beforeEach } from 'vitest';
import { loadDemoScenario, resetDemo } from './demoData';
import { cloudStore, localQueueStore } from '../../data/store';

describe('loadDemoScenario', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('seeds a realistic caseload spanning all three risk tiers', () => {
    loadDemoScenario();
    const { registrations } = localQueueStore.getAll();
    expect(registrations.length).toBeGreaterThanOrEqual(5);
    const tiers = new Set(registrations.map((r) => r.riskTier));
    expect(tiers).toContain('High');
    expect(tiers).toContain('Medium');
    expect(tiers).toContain('Low');
  });

  it('leaves history already synced and visible to the facility', () => {
    loadDemoScenario();
    const cloud = cloudStore.getAll();
    expect(cloud.registrations.length).toBeGreaterThan(0);
    expect(cloud.referrals.length).toBeGreaterThan(0);
  });

  it('leaves referrals at varied lifecycle stages, not all flagged', () => {
    loadDemoScenario();
    const statuses = new Set(cloudStore.getAll().referrals.map((r) => r.status));
    expect(statuses.size).toBeGreaterThan(1);
  });

  it('leaves at least one unreviewed mother check-in for the live demo', () => {
    loadDemoScenario();
    const { checkIns } = localQueueStore.getAll();
    expect(checkIns.some((c) => !c.reviewed && !c.escalated)).toBe(true);
  });

  it('leaves nothing pending sync, so the presenter starts from a clean slate', () => {
    loadDemoScenario();
    const { registrations, referrals } = localQueueStore.getAll();
    expect(registrations.every((r) => r.syncedAt)).toBe(true);
    expect(referrals.every((r) => r.syncedAt)).toBe(true);
  });

  it('is idempotent -- re-running replaces rather than duplicates', () => {
    loadDemoScenario();
    const firstCount = localQueueStore.getAll().registrations.length;
    loadDemoScenario();
    expect(localQueueStore.getAll().registrations).toHaveLength(firstCount);
  });
});

describe('resetDemo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clears both stores completely', () => {
    loadDemoScenario();
    resetDemo();
    expect(localQueueStore.getAll().registrations).toHaveLength(0);
    expect(localQueueStore.getAll().referrals).toHaveLength(0);
    expect(cloudStore.getAll().registrations).toHaveLength(0);
    expect(cloudStore.getAll().referrals).toHaveLength(0);
    expect(cloudStore.getAll().notifications).toHaveLength(0);
  });
});
