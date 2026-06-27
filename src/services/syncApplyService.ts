import { knowledgeCardDb } from '../db/db';
import type { CardCollection, DirectoryNode, KnowledgeCard } from '../types/card';
import { parseKnowledgeCardBackupText } from './backupValidationService';
import { readBoundSyncFileText, writeLocalDataToBoundSyncFile } from './boundSyncFileService';
import { createRecoverySnapshot } from './syncPersistenceService';
import { buildFinalEntityList, generateSyncPlanFromRemoteText } from './syncPlanService';

export type SyncApplyResult = {
  appliedAt: string;
  cards: number;
  collections: number;
  directories: number;
  localChosen: number;
  remoteChosen: number;
  sameKept: number;
  writtenFileName: string;
};

function getItemsByType(planItems: Awaited<ReturnType<typeof generateSyncPlanFromRemoteText>>['items'], entityType: 'card' | 'collection' | 'directory') {
  return planItems.filter((item) => item.entityType === entityType);
}

function assertSafeToApply(plan: Awaited<ReturnType<typeof generateSyncPlanFromRemoteText>>) {
  if (!plan.applyDraft.canGenerate) {
    throw new Error(`同步草案不可应用：${plan.applyDraft.blockers.join('；') || '存在未解决问题。'}`);
  }

  if (plan.preflight.blockerCount > 0) {
    throw new Error(`同步预检存在阻塞项：${plan.preflight.issues.filter((issue) => issue.severity === 'blocker').map((issue) => issue.message).join('；')}`);
  }
}

async function restoreSnapshotData(snapshot: Awaited<ReturnType<typeof createRecoverySnapshot>>) {
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
}

export async function applyBoundSyncDraft() {
  const boundFile = await readBoundSyncFileText();
  const plan = await generateSyncPlanFromRemoteText(boundFile.text);
  assertSafeToApply(plan);

  const remote = parseKnowledgeCardBackupText(boundFile.text);
  const [localCards, localCollections, localDirectories] = await Promise.all([
    knowledgeCardDb.cards.toArray(),
    knowledgeCardDb.collections.toArray(),
    knowledgeCardDb.directories.toArray(),
  ]);

  const cardDraft = buildFinalEntityList<KnowledgeCard>(
    localCards,
    remote.cards,
    getItemsByType(plan.items, 'card'),
  );
  const collectionDraft = buildFinalEntityList<CardCollection>(
    localCollections,
    remote.collections,
    getItemsByType(plan.items, 'collection'),
  );
  const directoryDraft = buildFinalEntityList<DirectoryNode>(
    localDirectories,
    remote.directories,
    getItemsByType(plan.items, 'directory'),
  );

  const unresolved = cardDraft.unresolved + collectionDraft.unresolved + directoryDraft.unresolved;
  if (unresolved > 0) {
    throw new Error(`同步草案仍有 ${unresolved} 条记录未解决，不能应用。`);
  }

  const rollbackSnapshot = await createRecoverySnapshot('before-one-click-sync');

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
        cardDraft.result.length > 0 ? knowledgeCardDb.cards.bulkPut(cardDraft.result) : Promise.resolve(),
        collectionDraft.result.length > 0 ? knowledgeCardDb.collections.bulkPut(collectionDraft.result) : Promise.resolve(),
        directoryDraft.result.length > 0 ? knowledgeCardDb.directories.bulkPut(directoryDraft.result) : Promise.resolve(),
      ]);
    },
  );

  let writeResult: Awaited<ReturnType<typeof writeLocalDataToBoundSyncFile>>;
  try {
    writeResult = await writeLocalDataToBoundSyncFile();
  } catch (writeError) {
    try {
      await restoreSnapshotData(rollbackSnapshot);
    } catch (rollbackError) {
      const writeMessage = writeError instanceof Error ? writeError.message : '绑定同步文件写入失败。';
      const rollbackMessage = rollbackError instanceof Error ? rollbackError.message : '自动回滚失败。';
      throw new Error(`同步文件写入失败，且自动回滚 IndexedDB 失败。写入错误：${writeMessage}；回滚错误：${rollbackMessage}。请立即使用恢复快照手动恢复。`);
    }

    const writeMessage = writeError instanceof Error ? writeError.message : '绑定同步文件写入失败。';
    throw new Error(`同步文件写入失败，已自动回滚 IndexedDB 到 before-one-click-sync 快照。原始错误：${writeMessage}`);
  }

  return {
    appliedAt: new Date().toISOString(),
    cards: cardDraft.result.length,
    collections: collectionDraft.result.length,
    directories: directoryDraft.result.length,
    localChosen: cardDraft.localChosen + collectionDraft.localChosen + directoryDraft.localChosen,
    remoteChosen: cardDraft.remoteChosen + collectionDraft.remoteChosen + directoryDraft.remoteChosen,
    sameKept: cardDraft.sameKept + collectionDraft.sameKept + directoryDraft.sameKept,
    writtenFileName: writeResult.fileName,
  } satisfies SyncApplyResult;
}
