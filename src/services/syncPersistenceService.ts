import { knowledgeCardDb } from '../db/db';
import type {
  BrowserStorageStatus,
  RecoverySnapshotListItem,
  RecoverySnapshotReason,
  RecoverySnapshotSummary,
  SyncRecoverySnapshot,
  SyncState,
} from '../types/sync';

const DEFAULT_SYNC_STATE_ID = 'default';
const DEVICE_ID_STORAGE_KEY = 'knowledgecard.syncDeviceId';
const MAX_RECOVERY_SNAPSHOTS = 10;
const MAX_RECOVERY_SNAPSHOT_AGE_DAYS = 7;

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createDeviceId() {
  return createId('kc-device');
}

function getStoredDeviceId() {
  try {
    return localStorage.getItem(DEVICE_ID_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
}

function storeDeviceId(deviceId: string) {
  try {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  } catch {
    // IndexedDB is the source of truth. localStorage mirroring is best-effort only.
  }
}

function getDefaultDeviceName() {
  const platform = typeof navigator !== 'undefined' ? navigator.platform : '';
  const language = typeof navigator !== 'undefined' ? navigator.language : '';
  const userAgentData = typeof navigator !== 'undefined' ? (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData : undefined;
  return [userAgentData?.platform || platform, language].filter(Boolean).join(' · ') || 'KnowledgeCard Device';
}

function createDefaultSyncState(): SyncState {
  const now = new Date().toISOString();
  const deviceId = getStoredDeviceId() || createDeviceId();
  storeDeviceId(deviceId);

  return {
    id: DEFAULT_SYNC_STATE_ID,
    mode: 'manual',
    deviceId,
    deviceName: getDefaultDeviceName(),
    autoSyncEnabled: false,
    pollIntervalMs: 15000,
    conflictPolicy: 'review-required',
    createdAt: now,
    updatedAt: now,
  };
}

export async function getOrCreateSyncState() {
  const existing = await knowledgeCardDb.syncStates.get(DEFAULT_SYNC_STATE_ID);
  if (existing) {
    storeDeviceId(existing.deviceId);
    return existing;
  }

  const state = createDefaultSyncState();
  await knowledgeCardDb.syncStates.put(state);
  return state;
}

export async function updateSyncDeviceName(deviceName: string) {
  const trimmed = deviceName.trim();
  if (!trimmed) throw new Error('设备名称不能为空。');

  const state = await getOrCreateSyncState();
  const updated: SyncState = {
    ...state,
    deviceName: trimmed,
    updatedAt: new Date().toISOString(),
  };

  await knowledgeCardDb.syncStates.put(updated);
  return updated;
}

export async function getBrowserStorageStatus(): Promise<BrowserStorageStatus> {
  if (typeof navigator === 'undefined' || !navigator.storage) {
    return { supported: false, persistent: false, error: '当前浏览器不支持 StorageManager。' };
  }

  try {
    const [persistent, estimate] = await Promise.all([
      typeof navigator.storage.persisted === 'function' ? navigator.storage.persisted() : Promise.resolve(false),
      typeof navigator.storage.estimate === 'function'
        ? navigator.storage.estimate()
        : Promise.resolve({ usage: undefined, quota: undefined } as StorageEstimate),
    ]);

    return {
      supported: true,
      persistent,
      usage: estimate.usage,
      quota: estimate.quota,
    };
  } catch (error) {
    return {
      supported: true,
      persistent: false,
      error: error instanceof Error ? error.message : '读取浏览器存储状态失败。',
    };
  }
}

export async function requestBrowserPersistentStorage(): Promise<BrowserStorageStatus> {
  if (typeof navigator === 'undefined' || !navigator.storage || typeof navigator.storage.persist !== 'function') {
    return { supported: false, persistent: false, error: '当前浏览器不支持请求持久存储。' };
  }

  try {
    await navigator.storage.persist();
    return getBrowserStorageStatus();
  } catch (error) {
    return {
      supported: true,
      persistent: false,
      error: error instanceof Error ? error.message : '请求持久存储失败。',
    };
  }
}

async function pruneRecoverySnapshots() {
  const snapshots = await knowledgeCardDb.recoverySnapshots.orderBy('createdAt').reverse().toArray();
  const minTime = Date.now() - MAX_RECOVERY_SNAPSHOT_AGE_DAYS * 24 * 60 * 60 * 1000;
  const deleteIds = snapshots
    .filter((snapshot, index) => index >= MAX_RECOVERY_SNAPSHOTS || Date.parse(snapshot.createdAt) < minTime)
    .map((snapshot) => snapshot.id);

  if (deleteIds.length > 0) {
    await knowledgeCardDb.recoverySnapshots.bulkDelete(deleteIds);
  }
}

export async function createRecoverySnapshot(reason: RecoverySnapshotReason = 'manual') {
  const [cards, collections, directories] = await Promise.all([
    knowledgeCardDb.cards.toArray(),
    knowledgeCardDb.collections.toArray(),
    knowledgeCardDb.directories.toArray(),
  ]);
  const createdAt = new Date().toISOString();
  const snapshot: SyncRecoverySnapshot = {
    id: createId('recovery'),
    createdAt,
    reason,
    cards,
    collections,
    directories,
  };

  await knowledgeCardDb.recoverySnapshots.put(snapshot);
  await pruneRecoverySnapshots();
  return snapshot;
}

export async function getRecoverySnapshotSummary(): Promise<RecoverySnapshotSummary> {
  const snapshots = await knowledgeCardDb.recoverySnapshots.orderBy('createdAt').reverse().toArray();
  const latest = snapshots[0];

  return {
    count: snapshots.length,
    latestCreatedAt: latest?.createdAt,
    latestReason: latest?.reason,
  };
}

export async function listRecoverySnapshots(limit = 10): Promise<RecoverySnapshotListItem[]> {
  const snapshots = await knowledgeCardDb.recoverySnapshots.orderBy('createdAt').reverse().limit(limit).toArray();

  return snapshots.map((snapshot) => ({
    id: snapshot.id,
    createdAt: snapshot.createdAt,
    reason: snapshot.reason,
    cardCount: snapshot.cards.length,
    collectionCount: snapshot.collections.length,
    directoryCount: snapshot.directories.length,
  }));
}

export async function restoreRecoverySnapshot(snapshotId: string) {
  const snapshot = await knowledgeCardDb.recoverySnapshots.get(snapshotId);
  if (!snapshot) throw new Error('恢复快照不存在。');

  await createRecoverySnapshot('before-restore');

  await knowledgeCardDb.transaction(
    'rw',
    knowledgeCardDb.cards,
    knowledgeCardDb.collections,
    knowledgeCardDb.directories,
    async () => {
      await Promise.all([
        knowledgeCardDb.cards.clear(),
        knowledgeCardDb.collections.clear(),
        knowledgeCardDb.directories.clear(),
      ]);
      await Promise.all([
        snapshot.cards.length > 0 ? knowledgeCardDb.cards.bulkPut(snapshot.cards) : Promise.resolve(),
        snapshot.collections.length > 0 ? knowledgeCardDb.collections.bulkPut(snapshot.collections) : Promise.resolve(),
        snapshot.directories.length > 0 ? knowledgeCardDb.directories.bulkPut(snapshot.directories) : Promise.resolve(),
      ]);
    },
  );

  return snapshot;
}

export async function getSyncPersistenceOverview() {
  const [syncState, storageStatus, recoverySummary] = await Promise.all([
    getOrCreateSyncState(),
    getBrowserStorageStatus(),
    getRecoverySnapshotSummary(),
  ]);

  return {
    syncState,
    storageStatus,
    recoverySummary,
  };
}
