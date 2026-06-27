import { knowledgeCardDb } from '../db/db';
import type { CardCollection, DirectoryNode, KnowledgeCard } from '../types/card';
import {
  isImportedCardNewer,
  parseKnowledgeCardBackupText,
  SUPPORTED_BACKUP_VERSION,
  type KnowledgeCardBackup,
} from './backupValidationService';
import { downloadBlob, formatFileTimestamp } from './fileExportService';

export type ImportPreviewAction = 'add' | 'update' | 'skip-local-newer' | 'skip-same-timestamp';

export type ImportPreviewItem = {
  id: string;
  title: string;
  entityType: 'card' | 'collection' | 'directory';
  action: ImportPreviewAction;
  reason: string;
};

export type ImportResult = {
  added: number;
  updated: number;
  skipped: number;
  cardSkippedLocalNewer: number;
  cardSkippedSameTimestamp: number;
  collectionAdded: number;
  collectionUpdated: number;
  collectionSkipped: number;
  collectionSkippedLocalNewer: number;
  collectionSkippedSameTimestamp: number;
  directoryAdded: number;
  directoryUpdated: number;
  directorySkipped: number;
  directorySkippedLocalNewer: number;
  directorySkippedSameTimestamp: number;
  errors: number;
};

export type ImportPreview = ImportResult & {
  fileName: string;
  fileSize: number;
  backupVersion: number;
  exportedAt: string;
  parsedCards: number;
  parsedCollections: number;
  parsedDirectories: number;
  previewItems: ImportPreviewItem[];
  syncPackageType?: string;
  syncDeviceId?: string;
  syncDeviceName?: string;
  syncGeneratedAt?: string;
};

function createEmptyImportResult(): ImportResult {
  return {
    added: 0,
    updated: 0,
    skipped: 0,
    cardSkippedLocalNewer: 0,
    cardSkippedSameTimestamp: 0,
    collectionAdded: 0,
    collectionUpdated: 0,
    collectionSkipped: 0,
    collectionSkippedLocalNewer: 0,
    collectionSkippedSameTimestamp: 0,
    directoryAdded: 0,
    directoryUpdated: 0,
    directorySkipped: 0,
    directorySkippedLocalNewer: 0,
    directorySkippedSameTimestamp: 0,
    errors: 0,
  };
}

function compareUpdatedAt(
  imported: Pick<KnowledgeCard | CardCollection | DirectoryNode, 'updatedAt'>,
  existing: Pick<KnowledgeCard | CardCollection | DirectoryNode, 'updatedAt'>,
) {
  const importedTime = Date.parse(imported.updatedAt);
  const existingTime = Date.parse(existing.updatedAt);

  if (importedTime > existingTime) return 'imported-newer' as const;
  if (importedTime < existingTime) return 'local-newer' as const;
  return 'same-timestamp' as const;
}

function pushPreviewItem(
  items: ImportPreviewItem[],
  item: ImportPreviewItem,
  limit = 12,
) {
  if (items.length < limit) items.push(item);
}

function getPreviewReason(action: ImportPreviewAction) {
  const reasons: Record<ImportPreviewAction, string> = {
    add: '本地不存在，确认导入后会新增。',
    update: '导入记录 updatedAt 更新，确认导入后会覆盖本地同 ID 记录。',
    'skip-local-newer': '本地记录 updatedAt 更新，确认导入后会跳过。',
    'skip-same-timestamp': '同 ID 且 updatedAt 相同，确认导入后会跳过。',
  };

  return reasons[action];
}

function isImportedCollectionNewer(
  imported: Pick<CardCollection, 'updatedAt'>,
  existing: Pick<CardCollection, 'updatedAt'>,
) {
  return compareUpdatedAt(imported, existing) === 'imported-newer';
}

function isImportedDirectoryNewer(
  imported: Pick<DirectoryNode, 'updatedAt'>,
  existing: Pick<DirectoryNode, 'updatedAt'>,
) {
  return compareUpdatedAt(imported, existing) === 'imported-newer';
}

async function assertSafeDirectoryImport(importedDirectories: DirectoryNode[], importedCards: KnowledgeCard[]) {
  const hasImportedDirectoryReferences = importedCards.some((card) => Boolean(card.primaryDirectoryId));
  if (importedDirectories.length === 0 && !hasImportedDirectoryReferences) return;

  const existingDirectories = await knowledgeCardDb.directories.toArray();
  const finalDirectoriesById = new Map(existingDirectories.map((directory) => [directory.id, directory]));

  importedDirectories.forEach((directory) => {
    const existing = finalDirectoriesById.get(directory.id);
    if (!existing || isImportedDirectoryNewer(directory, existing)) {
      finalDirectoriesById.set(directory.id, directory);
    }
  });

  const issues: string[] = [];

  importedCards.forEach((card) => {
    if (!card.primaryDirectoryId) return;
    if (!finalDirectoriesById.has(card.primaryDirectoryId)) {
      issues.push(`卡片「${card.title}」指向不存在的目录 ${card.primaryDirectoryId}`);
    }
  });

  for (const directory of finalDirectoriesById.values()) {
    if (!directory.parentId) continue;

    if (directory.parentId === directory.id) {
      issues.push(`「${directory.title}」把自己设为了父目录`);
      continue;
    }

    if (!finalDirectoriesById.has(directory.parentId)) {
      issues.push(`「${directory.title}」的父目录不存在`);
      continue;
    }

    const visited = new Set<string>();
    let currentParentId: string | undefined = directory.parentId;

    while (currentParentId) {
      if (currentParentId === directory.id) {
        issues.push(`「${directory.title}」存在父子循环引用`);
        break;
      }

      if (visited.has(currentParentId)) {
        const cycleDirectory = finalDirectoriesById.get(currentParentId);
        issues.push(`「${cycleDirectory?.title ?? currentParentId}」附近存在目录循环引用`);
        break;
      }

      visited.add(currentParentId);
      currentParentId = finalDirectoriesById.get(currentParentId)?.parentId;
    }
  }

  if (issues.length > 0) {
    const issuePreview = Array.from(new Set(issues)).slice(0, 4).join('；');
    throw new Error(`导入已拦截：目录结构不安全。${issuePreview}。请先修复 JSON 中的 directories 后再导入。`);
  }
}

function readBackupMetadata(text: string) {
  const parsed = JSON.parse(text) as Partial<KnowledgeCardBackup>;
  const syncMeta = parsed.syncMeta;

  return {
    version: typeof parsed.version === 'number' ? parsed.version : SUPPORTED_BACKUP_VERSION,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
    syncPackageType: syncMeta?.packageType,
    syncDeviceId: syncMeta?.deviceId,
    syncDeviceName: syncMeta?.deviceName,
    syncGeneratedAt: syncMeta?.generatedAt,
  };
}

const SYNC_DEVICE_ID_STORAGE_KEY = 'knowledgecard.syncDeviceId';

function createLocalSyncDeviceId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `kc-device-${crypto.randomUUID()}`;
  }

  return `kc-device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getLocalSyncDeviceId() {
  try {
    const existing = localStorage.getItem(SYNC_DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;

    const next = createLocalSyncDeviceId();
    localStorage.setItem(SYNC_DEVICE_ID_STORAGE_KEY, next);
    return next;
  } catch {
    return createLocalSyncDeviceId();
  }
}

function getLocalSyncDeviceName() {
  const platform = typeof navigator !== 'undefined' ? navigator.platform : '';
  const language = typeof navigator !== 'undefined' ? navigator.language : '';
  return [platform, language].filter(Boolean).join(' · ') || 'Unknown device';
}

async function createKnowledgeCardBackup(cards: KnowledgeCard[], includeSyncMeta = false): Promise<KnowledgeCardBackup> {
  const [collections, directories] = await Promise.all([
    knowledgeCardDb.collections.toArray(),
    knowledgeCardDb.directories.toArray(),
  ]);
  const exportedAt = new Date().toISOString();

  return {
    app: 'KnowledgeCard',
    version: SUPPORTED_BACKUP_VERSION,
    exportedAt,
    cards,
    collections,
    directories,
    ...(includeSyncMeta
      ? {
          syncMeta: {
            packageType: 'manual-sync' as const,
            deviceId: getLocalSyncDeviceId(),
            deviceName: getLocalSyncDeviceName(),
            generatedAt: exportedAt,
          },
        }
      : {}),
  };
}

export async function exportCardsToJsonFile(cards: KnowledgeCard[]) {
  const backup = await createKnowledgeCardBackup(cards);
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const filename = `knowledgecard-backup-${formatFileTimestamp()}.json`;
  return downloadBlob(blob, filename);
}

export async function exportFullBackupToJsonFile() {
  const cards = await knowledgeCardDb.cards.toArray();
  return exportCardsToJsonFile(cards);
}

export async function exportSyncPackageToJsonFile() {
  const cards = await knowledgeCardDb.cards.toArray();
  const backup = await createKnowledgeCardBackup(cards, true);
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const filename = `knowledgecard-sync-package-${formatFileTimestamp()}.json`;
  return downloadBlob(blob, filename);
}

async function previewImportFromJsonText(text: string, source: { name: string; size: number }): Promise<ImportPreview> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error('JSON 内容为空，请先粘贴或选择有效的 KnowledgeCard JSON。');
  }

  const metadata = readBackupMetadata(trimmedText);
  const parsed = parseKnowledgeCardBackupText(trimmedText);
  await assertSafeDirectoryImport(parsed.directories, parsed.cards);
  const result = createEmptyImportResult();
  const previewItems: ImportPreviewItem[] = [];
  result.errors = parsed.errors;

  const [existingCards, existingCollections, existingDirectories] = await Promise.all([
    knowledgeCardDb.cards.bulkGet(parsed.cards.map((card) => card.id)),
    knowledgeCardDb.collections.bulkGet(parsed.collections.map((collection) => collection.id)),
    knowledgeCardDb.directories.bulkGet(parsed.directories.map((directory) => directory.id)),
  ]);
  const cardsById = new Map(
    existingCards.filter((card): card is KnowledgeCard => Boolean(card)).map((card) => [card.id, card]),
  );
  const collectionsById = new Map(
    existingCollections
      .filter((collection): collection is CardCollection => Boolean(collection))
      .map((collection) => [collection.id, collection]),
  );
  const directoriesById = new Map(
    existingDirectories
      .filter((directory): directory is DirectoryNode => Boolean(directory))
      .map((directory) => [directory.id, directory]),
  );

  parsed.cards.forEach((card) => {
    const existing = cardsById.get(card.id);

    if (!existing) {
      result.added += 1;
      pushPreviewItem(previewItems, {
        id: card.id,
        title: card.title,
        entityType: 'card',
        action: 'add',
        reason: getPreviewReason('add'),
      });
      return;
    }

    const comparison = compareUpdatedAt(card, existing);
    if (comparison === 'imported-newer') {
      result.updated += 1;
      pushPreviewItem(previewItems, {
        id: card.id,
        title: card.title,
        entityType: 'card',
        action: 'update',
        reason: getPreviewReason('update'),
      });
    } else {
      result.skipped += 1;
      const action = comparison === 'local-newer' ? 'skip-local-newer' : 'skip-same-timestamp';
      if (comparison === 'local-newer') result.cardSkippedLocalNewer += 1;
      else result.cardSkippedSameTimestamp += 1;
      pushPreviewItem(previewItems, {
        id: card.id,
        title: card.title,
        entityType: 'card',
        action,
        reason: getPreviewReason(action),
      });
    }
  });

  parsed.collections.forEach((collection) => {
    const existing = collectionsById.get(collection.id);

    if (!existing) {
      result.collectionAdded += 1;
      pushPreviewItem(previewItems, {
        id: collection.id,
        title: collection.title,
        entityType: 'collection',
        action: 'add',
        reason: getPreviewReason('add'),
      });
      return;
    }

    const comparison = compareUpdatedAt(collection, existing);
    if (comparison === 'imported-newer') {
      result.collectionUpdated += 1;
      pushPreviewItem(previewItems, {
        id: collection.id,
        title: collection.title,
        entityType: 'collection',
        action: 'update',
        reason: getPreviewReason('update'),
      });
    } else {
      result.collectionSkipped += 1;
      const action = comparison === 'local-newer' ? 'skip-local-newer' : 'skip-same-timestamp';
      if (comparison === 'local-newer') result.collectionSkippedLocalNewer += 1;
      else result.collectionSkippedSameTimestamp += 1;
      pushPreviewItem(previewItems, {
        id: collection.id,
        title: collection.title,
        entityType: 'collection',
        action,
        reason: getPreviewReason(action),
      });
    }
  });

  parsed.directories.forEach((directory) => {
    const existing = directoriesById.get(directory.id);

    if (!existing) {
      result.directoryAdded += 1;
      pushPreviewItem(previewItems, {
        id: directory.id,
        title: directory.title,
        entityType: 'directory',
        action: 'add',
        reason: getPreviewReason('add'),
      });
      return;
    }

    const comparison = compareUpdatedAt(directory, existing);
    if (comparison === 'imported-newer') {
      result.directoryUpdated += 1;
      pushPreviewItem(previewItems, {
        id: directory.id,
        title: directory.title,
        entityType: 'directory',
        action: 'update',
        reason: getPreviewReason('update'),
      });
    } else {
      result.directorySkipped += 1;
      const action = comparison === 'local-newer' ? 'skip-local-newer' : 'skip-same-timestamp';
      if (comparison === 'local-newer') result.directorySkippedLocalNewer += 1;
      else result.directorySkippedSameTimestamp += 1;
      pushPreviewItem(previewItems, {
        id: directory.id,
        title: directory.title,
        entityType: 'directory',
        action,
        reason: getPreviewReason(action),
      });
    }
  });

  return {
    ...result,
    fileName: source.name,
    fileSize: source.size,
    backupVersion: metadata.version,
    exportedAt: metadata.exportedAt,
    parsedCards: parsed.cards.length,
    parsedCollections: parsed.collections.length,
    parsedDirectories: parsed.directories.length,
    previewItems,
    syncPackageType: metadata.syncPackageType,
    syncDeviceId: metadata.syncDeviceId,
    syncDeviceName: metadata.syncDeviceName,
    syncGeneratedAt: metadata.syncGeneratedAt,
  };
}

export async function previewImportFromJsonFile(file: File): Promise<ImportPreview> {
  return previewImportFromJsonText(await file.text(), {
    name: file.name,
    size: file.size,
  });
}

export async function previewImportFromPastedJsonText(text: string): Promise<ImportPreview> {
  const normalizedText = text.trim();
  return previewImportFromJsonText(normalizedText, {
    name: '粘贴的 JSON',
    size: new Blob([normalizedText]).size,
  });
}

async function importCardsFromJsonText(text: string): Promise<ImportResult> {
  const result = createEmptyImportResult();
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error('JSON 内容为空，请先粘贴或选择有效的 KnowledgeCard JSON。');
  }

  const parsed = parseKnowledgeCardBackupText(trimmedText);
  await assertSafeDirectoryImport(parsed.directories, parsed.cards);
  result.errors = parsed.errors;

  await knowledgeCardDb.transaction('rw', knowledgeCardDb.cards, knowledgeCardDb.collections, knowledgeCardDb.directories, async () => {
    for (const directory of parsed.directories) {
      const existing = await knowledgeCardDb.directories.get(directory.id);

      if (!existing) {
        await knowledgeCardDb.directories.add(directory);
        result.directoryAdded += 1;
        continue;
      }

      const comparison = compareUpdatedAt(directory, existing);
      if (comparison === 'imported-newer') {
        await knowledgeCardDb.directories.put(directory);
        result.directoryUpdated += 1;
      } else {
        result.directorySkipped += 1;
        if (comparison === 'local-newer') result.directorySkippedLocalNewer += 1;
        else result.directorySkippedSameTimestamp += 1;
      }
    }

    for (const card of parsed.cards) {
      const existing = await knowledgeCardDb.cards.get(card.id);

      if (!existing) {
        await knowledgeCardDb.cards.add(card);
        result.added += 1;
        continue;
      }

      const comparison = compareUpdatedAt(card, existing);
      if (comparison === 'imported-newer') {
        await knowledgeCardDb.cards.put(card);
        result.updated += 1;
      } else {
        result.skipped += 1;
        if (comparison === 'local-newer') result.cardSkippedLocalNewer += 1;
        else result.cardSkippedSameTimestamp += 1;
      }
    }

    for (const collection of parsed.collections) {
      const existing = await knowledgeCardDb.collections.get(collection.id);

      if (!existing) {
        await knowledgeCardDb.collections.add(collection);
        result.collectionAdded += 1;
        continue;
      }

      const comparison = compareUpdatedAt(collection, existing);
      if (comparison === 'imported-newer') {
        await knowledgeCardDb.collections.put(collection);
        result.collectionUpdated += 1;
      } else {
        result.collectionSkipped += 1;
        if (comparison === 'local-newer') result.collectionSkippedLocalNewer += 1;
        else result.collectionSkippedSameTimestamp += 1;
      }
    }
  });

  return result;
}

export async function importCardsFromJsonFile(file: File): Promise<ImportResult> {
  return importCardsFromJsonText(await file.text());
}

export async function importCardsFromPastedJsonText(text: string): Promise<ImportResult> {
  return importCardsFromJsonText(text);
}
