import type { CardCollection, DirectoryNode, KnowledgeCard } from './card';

export type SyncMode = 'manual' | 'file-bound';

export type ConflictPolicy = 'review-required';

export type SyncState = {
  id: 'default';
  mode: SyncMode;
  deviceId: string;
  deviceName: string;
  fileName?: string;
  fileHandle?: FileSystemFileHandle;
  autoSyncEnabled: boolean;
  pollIntervalMs: number;
  conflictPolicy: ConflictPolicy;
  lastLocalSnapshotHash?: string;
  lastRemoteSnapshotHash?: string;
  lastSuccessfulSyncAt?: string;
  lastReadRemoteAt?: string;
  lastWriteRemoteAt?: string;
  lastKnownRemoteRevision?: number;
  createdAt: string;
  updatedAt: string;
};

export type RecoverySnapshotReason =
  | 'manual'
  | 'before-auto-sync'
  | 'before-one-click-sync'
  | 'before-conflict-resolution'
  | 'before-import'
  | 'before-restore';

export type SyncRecoverySnapshot = {
  id: string;
  createdAt: string;
  reason: RecoverySnapshotReason;
  cards: KnowledgeCard[];
  collections: CardCollection[];
  directories: DirectoryNode[];
};

export type RecoverySnapshotSummary = {
  count: number;
  latestCreatedAt?: string;
  latestReason?: RecoverySnapshotReason;
};

export type RecoverySnapshotListItem = {
  id: string;
  createdAt: string;
  reason: RecoverySnapshotReason;
  cardCount: number;
  collectionCount: number;
  directoryCount: number;
};

export type BrowserStorageStatus = {
  supported: boolean;
  persistent: boolean;
  usage?: number;
  quota?: number;
  error?: string;
};
