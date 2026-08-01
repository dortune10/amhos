import type {
  MotherCheckIn,
  Referral,
  Registration,
  ScheduledVisit,
  WhatsAppNotification,
} from './types';

interface LocalQueueData {
  registrations: Registration[];
  referrals: Referral[];
  checkIns: MotherCheckIn[];
  visits: ScheduledVisit[];
}

interface CloudStoreData {
  registrations: Registration[];
  referrals: Referral[];
  checkIns: MotherCheckIn[];
  visits: ScheduledVisit[];
  notifications: WhatsAppNotification[];
}

const LOCAL_QUEUE_KEY = 'chw_local_queue';
const CLOUD_STORE_KEY = 'cloud_synced_store';

type ChangeListener = () => void;
const changeListeners = new Set<ChangeListener>();

export function subscribeToStoreChanges(listener: ChangeListener): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

function notifyStoreChanged(): void {
  changeListeners.forEach((listener) => listener());
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
  notifyStoreChanged();
}

const emptyLocalQueue = (): LocalQueueData => ({
  registrations: [],
  referrals: [],
  checkIns: [],
  visits: [],
});

const emptyCloudStore = (): CloudStoreData => ({
  registrations: [],
  referrals: [],
  checkIns: [],
  visits: [],
  notifications: [],
});

/**
 * Data persisted by an older build predates newer collections, so fill any
 * missing array rather than handing back `undefined` and breaking callers.
 */
/**
 * Merge incoming records over existing ones by id, so re-syncing an updated
 * record replaces it instead of appending a duplicate.
 */
function upsertById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const byId = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) byId.set(item.id, item);
  return [...byId.values()];
}

function withDefaults<T extends object>(stored: Partial<T>, empty: T): T {
  const result = { ...empty };
  for (const key of Object.keys(empty) as (keyof T)[]) {
    const value = stored[key];
    if (Array.isArray(value)) result[key] = value as T[keyof T];
  }
  return result;
}

export const localQueueStore = {
  getAll(): LocalQueueData {
    return withDefaults(readJSON(LOCAL_QUEUE_KEY, emptyLocalQueue()), emptyLocalQueue());
  },
  addVisits(visits: ScheduledVisit[]): void {
    const data = this.getAll();
    data.visits.push(...visits);
    writeJSON(LOCAL_QUEUE_KEY, data);
  },
  updateVisit(id: string, updater: (visit: ScheduledVisit) => ScheduledVisit): void {
    const data = this.getAll();
    data.visits = data.visits.map((v) => (v.id === id ? updater(v) : v));
    writeJSON(LOCAL_QUEUE_KEY, data);
  },
  updateRegistration(id: string, updater: (r: Registration) => Registration): void {
    const data = this.getAll();
    data.registrations = data.registrations.map((r) => (r.id === id ? updater(r) : r));
    writeJSON(LOCAL_QUEUE_KEY, data);
  },
  addRegistration(registration: Registration): void {
    const data = this.getAll();
    data.registrations.push(registration);
    writeJSON(LOCAL_QUEUE_KEY, data);
  },
  addReferral(referral: Referral): void {
    const data = this.getAll();
    data.referrals.push(referral);
    writeJSON(LOCAL_QUEUE_KEY, data);
  },
  addCheckIn(checkIn: MotherCheckIn): void {
    const data = this.getAll();
    data.checkIns.push(checkIn);
    writeJSON(LOCAL_QUEUE_KEY, data);
  },
  updateCheckIn(id: string, updater: (checkIn: MotherCheckIn) => MotherCheckIn): void {
    const data = this.getAll();
    data.checkIns = data.checkIns.map((c) => (c.id === id ? updater(c) : c));
    writeJSON(LOCAL_QUEUE_KEY, data);
  },
  replaceAll(data: LocalQueueData): void {
    writeJSON(LOCAL_QUEUE_KEY, data);
  },
  clear(): void {
    writeJSON(LOCAL_QUEUE_KEY, emptyLocalQueue());
  },
};

export const cloudStore = {
  getAll(): CloudStoreData {
    return withDefaults(readJSON(CLOUD_STORE_KEY, emptyCloudStore()), emptyCloudStore());
  },
  addNotification(notification: WhatsAppNotification): void {
    const data = this.getAll();
    data.notifications.push(notification);
    writeJSON(CLOUD_STORE_KEY, data);
  },
  updateReferral(id: string, updater: (referral: Referral) => Referral): void {
    const data = this.getAll();
    data.referrals = data.referrals.map((r) => (r.id === id ? updater(r) : r));
    writeJSON(CLOUD_STORE_KEY, data);
  },
  mergeSyncedItems(items: {
    registrations: Registration[];
    referrals: Referral[];
    checkIns: MotherCheckIn[];
    visits?: ScheduledVisit[];
  }): void {
    const data = this.getAll();
    data.registrations = upsertById(data.registrations, items.registrations);
    data.referrals = upsertById(data.referrals, items.referrals);
    data.checkIns = upsertById(data.checkIns, items.checkIns);
    data.visits = upsertById(data.visits, items.visits ?? []);
    writeJSON(CLOUD_STORE_KEY, data);
  },
  clear(): void {
    writeJSON(CLOUD_STORE_KEY, emptyCloudStore());
  },
};
