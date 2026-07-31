import type { MotherCheckIn, Referral, Registration, WhatsAppNotification } from './types';

interface LocalQueueData {
  registrations: Registration[];
  referrals: Referral[];
  checkIns: MotherCheckIn[];
}

interface CloudStoreData {
  registrations: Registration[];
  referrals: Referral[];
  checkIns: MotherCheckIn[];
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
});

const emptyCloudStore = (): CloudStoreData => ({
  registrations: [],
  referrals: [],
  checkIns: [],
  notifications: [],
});

export const localQueueStore = {
  getAll(): LocalQueueData {
    return readJSON(LOCAL_QUEUE_KEY, emptyLocalQueue());
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
    return readJSON(CLOUD_STORE_KEY, emptyCloudStore());
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
  }): void {
    const data = this.getAll();
    data.registrations.push(...items.registrations);
    data.referrals.push(...items.referrals);
    data.checkIns.push(...items.checkIns);
    writeJSON(CLOUD_STORE_KEY, data);
  },
  clear(): void {
    writeJSON(CLOUD_STORE_KEY, emptyCloudStore());
  },
};
