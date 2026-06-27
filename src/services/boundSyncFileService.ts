import { knowledgeCardDb } from '../db/db';
import { SUPPORTED_BACKUP_VERSION, type KnowledgeCardBackup } from './backupValidationService';
import { getOrCreateSyncState } from './syncPersistenceService';

const DEFAULT_SYNC_FILE_NAME = 'knowledgecard-sync.json';

type FilePickerAcceptType = {
  description?: string;
  accept: Record<string, string[]>;
};

type FilePickerOptions = {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
  multiple?: boolean;
};

type FileSystemWritableFileStream = WritableStream & {
  write(data: BlobPart): Promise<void>;
  close(): Promise<void>;
};

type FileSystemHandlePermissionDescriptor = {
  mode?: 'read' | 'readwrite';
};

type SyncFileHandle = FileSystemFileHandle & {
  queryPermission?: (descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>;
  requestPermission?: (descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>;
  createWritable: () => Promise<FileSystemWritableFileStream>;
};

type FileSystemWindow = Window & {
  showOpenFilePicker?: (options?: FilePickerOptions) => Promise<SyncFileHandle[]>;
  showSaveFilePicker?: (options?: FilePickerOptions) => Promise<SyncFileHandle>;
};

function getFileSystemWindow() {
  return window as FileSystemWindow;
}

export function isBoundSyncFileSupported() {
  const fsWindow = getFileSystemWindow();
  return typeof fsWindow.showOpenFilePicker === 'function' && typeof fsWindow.showSaveFilePicker === 'function';
}

async function ensureFilePermission(handle: SyncFileHandle, mode: 'read' | 'readwrite') {
  const descriptor = { mode };
  if (typeof handle.queryPermission === 'function') {
    const current = await handle.queryPermission(descriptor);
    if (current === 'granted') return;
  }

  if (typeof handle.requestPermission === 'function') {
    const requested = await handle.requestPermission(descriptor);
    if (requested === 'granted') return;
  }

  throw new Error(mode === 'readwrite' ? '没有同步文件读写权限，请重新绑定文件。' : '没有同步文件读取权限，请重新绑定文件。');
}

async function createBoundSyncBackup(): Promise<KnowledgeCardBackup> {
  const [cards, collections, directories, syncState] = await Promise.all([
    knowledgeCardDb.cards.toArray(),
    knowledgeCardDb.collections.toArray(),
    knowledgeCardDb.directories.toArray(),
    getOrCreateSyncState(),
  ]);
  const now = new Date().toISOString();

  return {
    app: 'KnowledgeCard',
    version: SUPPORTED_BACKUP_VERSION,
    exportedAt: now,
    cards,
    collections,
    directories,
    syncMeta: {
      packageType: 'bound-sync-file',
      deviceId: syncState.deviceId,
      deviceName: syncState.deviceName,
      generatedAt: now,
      schemaVersion: 1,
      lastWriterDeviceId: syncState.deviceId,
      lastWriterDeviceName: syncState.deviceName,
      lastWriterAt: now,
      revision: (syncState.lastKnownRemoteRevision ?? 0) + 1,
    },
  };
}

async function writeBackupToHandle(handle: SyncFileHandle, backup: KnowledgeCardBackup) {
  await ensureFilePermission(handle, 'readwrite');
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(backup, null, 2));
  await writable.close();
}

async function saveBoundHandle(handle: SyncFileHandle, revision?: number) {
  const state = await getOrCreateSyncState();
  const now = new Date().toISOString();
  const updated = {
    ...state,
    mode: 'file-bound' as const,
    fileName: handle.name,
    fileHandle: handle,
    lastKnownRemoteRevision: revision ?? state.lastKnownRemoteRevision,
    updatedAt: now,
  };

  await knowledgeCardDb.syncStates.put(updated);
  return updated;
}

export async function createAndBindSyncFile() {
  const fsWindow = getFileSystemWindow();
  if (!isBoundSyncFileSupported() || !fsWindow.showSaveFilePicker) {
    throw new Error('当前浏览器不支持绑定本地同步文件。请继续使用手动同步包。');
  }

  const handle = await fsWindow.showSaveFilePicker({
    suggestedName: DEFAULT_SYNC_FILE_NAME,
    types: [
      {
        description: 'KnowledgeCard Sync JSON',
        accept: { 'application/json': ['.json'] },
      },
    ],
  });
  const backup = await createBoundSyncBackup();
  await writeBackupToHandle(handle, backup);
  await saveBoundHandle(handle, backup.syncMeta?.revision);
  return handle.name;
}

export async function bindExistingSyncFile() {
  const fsWindow = getFileSystemWindow();
  if (!isBoundSyncFileSupported() || !fsWindow.showOpenFilePicker) {
    throw new Error('当前浏览器不支持绑定本地同步文件。请继续使用手动同步包。');
  }

  const [handle] = await fsWindow.showOpenFilePicker({
    multiple: false,
    types: [
      {
        description: 'KnowledgeCard Sync JSON',
        accept: { 'application/json': ['.json'] },
      },
    ],
  });
  if (!handle) throw new Error('未选择同步文件。');
  await ensureFilePermission(handle, 'read');
  await saveBoundHandle(handle);
  return handle.name;
}

export async function writeLocalDataToBoundSyncFile() {
  const state = await getOrCreateSyncState();
  const handle = state.fileHandle as SyncFileHandle | undefined;
  if (!handle) throw new Error('尚未绑定同步文件。');

  const backup = await createBoundSyncBackup();
  await writeBackupToHandle(handle, backup);

  const updated = {
    ...state,
    mode: 'file-bound' as const,
    fileName: handle.name,
    fileHandle: handle,
    lastWriteRemoteAt: new Date().toISOString(),
    lastKnownRemoteRevision: backup.syncMeta?.revision,
    updatedAt: new Date().toISOString(),
  };
  await knowledgeCardDb.syncStates.put(updated);
  return { fileName: handle.name, backup };
}

export async function readBoundSyncFileText() {
  const state = await getOrCreateSyncState();
  const handle = state.fileHandle as SyncFileHandle | undefined;
  if (!handle) throw new Error('尚未绑定同步文件。');

  await ensureFilePermission(handle, 'read');
  const file = await handle.getFile();
  const text = await file.text();
  await knowledgeCardDb.syncStates.put({
    ...state,
    mode: 'file-bound',
    fileName: handle.name,
    fileHandle: handle,
    lastReadRemoteAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return {
    fileName: file.name || handle.name,
    fileSize: file.size,
    text,
  };
}
