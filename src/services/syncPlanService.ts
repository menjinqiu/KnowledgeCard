import { knowledgeCardDb } from '../db/db';
import type { CardCollection, DirectoryNode, KnowledgeCard } from '../types/card';
import { parseKnowledgeCardBackupText } from './backupValidationService';
import { QUICK_ACCESS_COLLECTION_ID } from './collectionService';

type SyncEntityType = 'card' | 'collection' | 'directory';

type SyncPlanAction =
  | 'local-add'
  | 'remote-add'
  | 'local-newer'
  | 'remote-newer'
  | 'same'
  | 'conflict';

export type SyncPlanItem = {
  id: string;
  title: string;
  entityType: SyncEntityType;
  action: SyncPlanAction;
  localUpdatedAt?: string;
  remoteUpdatedAt?: string;
  reason: string;
};

export type SyncPlanSummary = Record<SyncPlanAction, number>;

export type SyncPreflightIssue = {
  severity: 'info' | 'warning' | 'blocker';
  code:
    | 'conflicts-present'
    | 'directory-cycle-risk'
    | 'missing-directory-parent'
    | 'missing-card-directory'
    | 'remote-format-warning'
    | 'delete-semantics-unknown'
    | 'safe-read-only-plan';
  message: string;
};

export type SyncPreflight = {
  canAutoApply: boolean;
  blockerCount: number;
  warningCount: number;
  issues: SyncPreflightIssue[];
};

export type SyncApplyDraft = {
  canGenerate: boolean;
  generatedAt: string;
  cardCount: number;
  collectionCount: number;
  directoryCount: number;
  localChosen: number;
  remoteChosen: number;
  sameKept: number;
  unresolved: number;
  warnings: string[];
  blockers: string[];
};

export type SyncPlan = {
  generatedAt: string;
  summary: SyncPlanSummary;
  items: SyncPlanItem[];
  preflight: SyncPreflight;
  applyDraft: SyncApplyDraft;
  remoteMeta?: {
    packageType?: string;
    deviceName?: string;
    generatedAt?: string;
    lastWriterDeviceName?: string;
    lastWriterAt?: string;
    revision?: number;
  };
};

export type SyncComparableEntity = KnowledgeCard | CardCollection | DirectoryNode;

function createEmptySummary(): SyncPlanSummary {
  return {
    'local-add': 0,
    'remote-add': 0,
    'local-newer': 0,
    'remote-newer': 0,
    same: 0,
    conflict: 0,
  };
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value
      .map((item) =>
        item === undefined || typeof item === 'function' || typeof item === 'symbol' ? 'null' : stableStringify(item),
      )
      .join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .filter((key) => {
      const item = record[key];
      return item !== undefined && typeof item !== 'function' && typeof item !== 'symbol';
    })
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

function getEntityTitle(entity: SyncComparableEntity | undefined, fallbackId: string) {
  return entity && 'title' in entity && entity.title ? entity.title : fallbackId;
}

function isQuickAccessCollectionEntity(entity: SyncComparableEntity | undefined): entity is CardCollection {
  return Boolean(entity && 'cardIds' in entity && entity.id === QUICK_ACCESS_COLLECTION_ID);
}

function isEmptyQuickAccessCollection(entity: SyncComparableEntity | undefined) {
  return isQuickAccessCollectionEntity(entity) && entity.cardIds.length === 0;
}

function isNonEmptyQuickAccessCollection(entity: SyncComparableEntity | undefined) {
  return isQuickAccessCollectionEntity(entity) && entity.cardIds.length > 0;
}

function normalizeEntityForComparison(entityType: SyncEntityType, entity: SyncComparableEntity) {
  if (entityType === 'card') {
    const card = entity as KnowledgeCard;

    return {
      ...card,
      tags: [...card.tags],
      summary: card.summary ?? '',
      copyLabel: card.copyLabel ?? '',
      copyText: card.copyText ?? '',
      primaryDirectoryId: card.primaryDirectoryId ?? '',
      directorySortOrder: card.directorySortOrder ?? 9999,
      source: card.source ?? '',
      sourceUrl: card.sourceUrl ?? '',
    };
  }

  if (entityType === 'collection') {
    const collection = entity as CardCollection;

    return {
      ...collection,
      description: collection.description ?? '',
      cardIds: [...collection.cardIds],
    };
  }

  const directory = entity as DirectoryNode;

  return {
    ...directory,
    parentId: directory.parentId?.trim() || undefined,
    description: directory.description ?? '',
  };
}

function compareEntities(
  entityType: SyncEntityType,
  id: string,
  local: SyncComparableEntity | undefined,
  remote: SyncComparableEntity | undefined,
): SyncPlanItem {
  if (!local && remote) {
    return {
      id,
      title: getEntityTitle(remote, id),
      entityType,
      action: 'remote-add',
      remoteUpdatedAt: remote.updatedAt,
      reason: '远端存在，本地不存在。',
    };
  }

  if (local && !remote) {
    return {
      id,
      title: getEntityTitle(local, id),
      entityType,
      action: 'local-add',
      localUpdatedAt: local.updatedAt,
      reason: '本地存在，远端不存在。',
    };
  }

  if (!local || !remote) {
    return {
      id,
      title: id,
      entityType,
      action: 'conflict',
      reason: '同步计划内部状态异常。',
    };
  }

  if (entityType === 'collection' && id === QUICK_ACCESS_COLLECTION_ID) {
    if (isEmptyQuickAccessCollection(local) && isNonEmptyQuickAccessCollection(remote)) {
      return {
        id,
        title: getEntityTitle(remote, id),
        entityType,
        action: 'remote-newer',
        localUpdatedAt: local.updatedAt,
        remoteUpdatedAt: remote.updatedAt,
        reason: '本地当前常用为空，远端当前常用有内容；优先保留远端常用入口，避免新设备自动创建的空集合覆盖旧设备。',
      };
    }

    if (isNonEmptyQuickAccessCollection(local) && isEmptyQuickAccessCollection(remote)) {
      return {
        id,
        title: getEntityTitle(local, id),
        entityType,
        action: 'local-newer',
        localUpdatedAt: local.updatedAt,
        remoteUpdatedAt: remote.updatedAt,
        reason: '远端当前常用为空，本地当前常用有内容；优先保留本地常用入口，避免空集合覆盖已有常用入口。',
      };
    }
  }

  const localHash = stableStringify(normalizeEntityForComparison(entityType, local));
  const remoteHash = stableStringify(normalizeEntityForComparison(entityType, remote));
  const localTime = Date.parse(local.updatedAt);
  const remoteTime = Date.parse(remote.updatedAt);

  if (localHash === remoteHash) {
    return {
      id,
      title: getEntityTitle(local, id),
      entityType,
      action: 'same',
      localUpdatedAt: local.updatedAt,
      remoteUpdatedAt: remote.updatedAt,
      reason: '本地和远端内容相同。',
    };
  }

  if (localTime > remoteTime) {
    return {
      id,
      title: getEntityTitle(local, id),
      entityType,
      action: 'local-newer',
      localUpdatedAt: local.updatedAt,
      remoteUpdatedAt: remote.updatedAt,
      reason: '本地 updatedAt 更新。',
    };
  }

  if (remoteTime > localTime) {
    return {
      id,
      title: getEntityTitle(remote, id),
      entityType,
      action: 'remote-newer',
      localUpdatedAt: local.updatedAt,
      remoteUpdatedAt: remote.updatedAt,
      reason: '远端 updatedAt 更新。',
    };
  }

  return {
    id,
    title: getEntityTitle(local, id),
    entityType,
    action: 'conflict',
    localUpdatedAt: local.updatedAt,
    remoteUpdatedAt: remote.updatedAt,
    reason: '本地和远端 updatedAt 相同，但内容不同，需要人工确认。',
  };
}

function buildItemsForEntityType<T extends SyncComparableEntity>(
  entityType: SyncEntityType,
  localItems: T[],
  remoteItems: T[],
) {
  const localById = new Map(localItems.map((item) => [item.id, item]));
  const remoteById = new Map(remoteItems.map((item) => [item.id, item]));
  const ids = Array.from(new Set([...localById.keys(), ...remoteById.keys()])).sort();

  return ids.map((id) => compareEntities(entityType, id, localById.get(id), remoteById.get(id)));
}

function parseRemoteMeta(text: string): SyncPlan['remoteMeta'] {
  try {
    const parsed = JSON.parse(text) as {
      syncMeta?: {
        packageType?: string;
        deviceName?: string;
        generatedAt?: string;
        lastWriterDeviceName?: string;
        lastWriterAt?: string;
        revision?: number;
      };
    };
    return parsed.syncMeta;
  } catch {
    return undefined;
  }
}

function checkCardDirectoryReferences(cards: KnowledgeCard[], directories: DirectoryNode[]) {
  const directoryIds = new Set(directories.map((directory) => directory.id));
  const missing = cards.filter((card) => card.primaryDirectoryId && !directoryIds.has(card.primaryDirectoryId));

  if (missing.length === 0) return [];

  const preview = missing
    .slice(0, 4)
    .map((card) => `「${card.title}」→ ${card.primaryDirectoryId}`)
    .join('；');

  return [
    {
      severity: 'blocker' as const,
      code: 'missing-card-directory' as const,
      message: `存在 ${missing.length} 张卡片指向不存在的目录，不能自动应用，否则目录页会看不到这些卡片。${preview}`,
    },
  ];
}

function checkDirectorySafety(directories: DirectoryNode[]) {
  const directoriesById = new Map(directories.map((directory) => [directory.id, directory]));
  const issues: SyncPreflightIssue[] = [];

  for (const directory of directoriesById.values()) {
    if (!directory.parentId) continue;

    if (directory.parentId === directory.id) {
      issues.push({
        severity: 'blocker',
        code: 'directory-cycle-risk',
        message: `目录「${directory.title}」把自己设为父目录，不能自动应用。`,
      });
      continue;
    }

    if (!directoriesById.has(directory.parentId)) {
      issues.push({
        severity: 'blocker',
        code: 'missing-directory-parent',
        message: `目录「${directory.title}」的父目录不存在，不能自动应用。`,
      });
      continue;
    }

    const visited = new Set<string>();
    let parentId: string | undefined = directory.parentId;

    while (parentId) {
      if (parentId === directory.id || visited.has(parentId)) {
        issues.push({
          severity: 'blocker',
          code: 'directory-cycle-risk',
          message: `目录「${directory.title}」存在父子循环风险，不能自动应用。`,
        });
        break;
      }

      visited.add(parentId);
      parentId = directoriesById.get(parentId)?.parentId;
    }
  }

  return issues;
}

export function buildFinalEntityList<T extends SyncComparableEntity>(
  localItems: T[],
  remoteItems: T[],
  items: SyncPlanItem[],
) {
  const localById = new Map(localItems.map((item) => [item.id, item]));
  const remoteById = new Map(remoteItems.map((item) => [item.id, item]));
  const itemById = new Map(items.map((item) => [item.id, item]));
  const ids = Array.from(new Set([...localById.keys(), ...remoteById.keys()])).sort();
  const result: T[] = [];
  let localChosen = 0;
  let remoteChosen = 0;
  let sameKept = 0;
  let unresolved = 0;

  ids.forEach((id) => {
    const item = itemById.get(id);
    const local = localById.get(id);
    const remote = remoteById.get(id);

    if (!item) {
      unresolved += 1;
      return;
    }

    if (item.action === 'same') {
      const chosen = local ?? remote;
      if (chosen) {
        result.push(chosen);
        sameKept += 1;
      }
      return;
    }

    if (item.action === 'local-add' || item.action === 'local-newer') {
      if (local) {
        result.push(local);
        localChosen += 1;
      } else {
        unresolved += 1;
      }
      return;
    }

    if (item.action === 'remote-add' || item.action === 'remote-newer') {
      if (remote) {
        result.push(remote);
        remoteChosen += 1;
      } else {
        unresolved += 1;
      }
      return;
    }

    unresolved += 1;
  });

  return { result, localChosen, remoteChosen, sameKept, unresolved };
}

function createApplyDraft(
  planItems: SyncPlanItem[],
  preflight: SyncPreflight,
  localCards: KnowledgeCard[],
  remoteCards: KnowledgeCard[],
  localCollections: CardCollection[],
  remoteCollections: CardCollection[],
  localDirectories: DirectoryNode[],
  remoteDirectories: DirectoryNode[],
): SyncApplyDraft {
  const cardDraft = buildFinalEntityList(
    localCards,
    remoteCards,
    planItems.filter((item) => item.entityType === 'card'),
  );
  const collectionDraft = buildFinalEntityList(
    localCollections,
    remoteCollections,
    planItems.filter((item) => item.entityType === 'collection'),
  );
  const directoryDraft = buildFinalEntityList(
    localDirectories,
    remoteDirectories,
    planItems.filter((item) => item.entityType === 'directory'),
  );

  const blockers = preflight.issues.filter((issue) => issue.severity === 'blocker').map((issue) => issue.message);
  const warnings = preflight.issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message);
  const unresolved = cardDraft.unresolved + collectionDraft.unresolved + directoryDraft.unresolved;

  if (unresolved > 0) {
    blockers.push(`草案中仍有 ${unresolved} 条记录无法自动选择来源。`);
  }

  const finalDirectoryIssues = checkDirectorySafety(directoryDraft.result as DirectoryNode[]).map((issue) => issue.message);
  const finalCardDirectoryIssues = checkCardDirectoryReferences(
    cardDraft.result as KnowledgeCard[],
    directoryDraft.result as DirectoryNode[],
  ).map((issue) => issue.message);
  blockers.push(...finalDirectoryIssues, ...finalCardDirectoryIssues);

  return {
    canGenerate: blockers.length === 0,
    generatedAt: new Date().toISOString(),
    cardCount: cardDraft.result.length,
    collectionCount: collectionDraft.result.length,
    directoryCount: directoryDraft.result.length,
    localChosen: cardDraft.localChosen + collectionDraft.localChosen + directoryDraft.localChosen,
    remoteChosen: cardDraft.remoteChosen + collectionDraft.remoteChosen + directoryDraft.remoteChosen,
    sameKept: cardDraft.sameKept + collectionDraft.sameKept + directoryDraft.sameKept,
    unresolved,
    warnings,
    blockers,
  };
}

function createPreflight(
  items: SyncPlanItem[],
  remoteCards: KnowledgeCard[],
  remoteDirectories: DirectoryNode[],
  remoteMeta: SyncPlan['remoteMeta'],
): SyncPreflight {
  const issues: SyncPreflightIssue[] = [];
  const conflictCount = items.filter((item) => item.action === 'conflict').length;
  const missingRemoteCount = items.filter((item) => item.action === 'local-add').length;
  const missingLocalCount = items.filter((item) => item.action === 'remote-add').length;

  if (!remoteMeta?.packageType) {
    issues.push({
      severity: 'warning',
      code: 'remote-format-warning',
      message: '远端文件没有 syncMeta.packageType，可能是普通备份文件，不建议直接自动应用。',
    });
  }

  if (conflictCount > 0) {
    issues.push({
      severity: 'blocker',
      code: 'conflicts-present',
      message: `存在 ${conflictCount} 条同时间戳但内容不同的冲突，必须人工确认。`,
    });
  }

  if (missingRemoteCount > 0 || missingLocalCount > 0) {
    issues.push({
      severity: 'warning',
      code: 'delete-semantics-unknown',
      message: '存在只在一侧出现的记录。当前尚未实现 tombstone 删除语义，自动应用前需谨慎确认这些是新增而不是删除。',
    });
  }

  issues.push(...checkDirectorySafety(remoteDirectories));
  issues.push(...checkCardDirectoryReferences(remoteCards, remoteDirectories));

  if (issues.length === 0) {
    issues.push({
      severity: 'info',
      code: 'safe-read-only-plan',
      message: '当前只读计划未发现阻塞项。后续仍需在应用前创建 before-one-click-sync 快照。',
    });
  }

  const blockerCount = issues.filter((issue) => issue.severity === 'blocker').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length;

  return {
    canAutoApply: blockerCount === 0 && warningCount === 0,
    blockerCount,
    warningCount,
    issues,
  };
}

export async function generateSyncPlanFromRemoteText(remoteText: string): Promise<SyncPlan> {
  const remote = parseKnowledgeCardBackupText(remoteText);
  const [localCards, localCollections, localDirectories] = await Promise.all([
    knowledgeCardDb.cards.toArray(),
    knowledgeCardDb.collections.toArray(),
    knowledgeCardDb.directories.toArray(),
  ]);

  const items = [
    ...buildItemsForEntityType('card', localCards, remote.cards),
    ...buildItemsForEntityType('collection', localCollections, remote.collections),
    ...buildItemsForEntityType('directory', localDirectories, remote.directories),
  ].sort((a, b) => a.entityType.localeCompare(b.entityType) || a.action.localeCompare(b.action) || a.title.localeCompare(b.title));

  const summary = createEmptySummary();
  items.forEach((item) => {
    summary[item.action] += 1;
  });
  const remoteMeta = parseRemoteMeta(remoteText);
  const preflight = createPreflight(items, remote.cards, remote.directories, remoteMeta);

  return {
    generatedAt: new Date().toISOString(),
    summary,
    items,
    preflight,
    applyDraft: createApplyDraft(
      items,
      preflight,
      localCards,
      remote.cards,
      localCollections,
      remote.collections,
      localDirectories,
      remote.directories,
    ),
    remoteMeta,
  };
}
