import { knowledgeCardDb } from '../db/db';
import type { DirectoryNode, DirectoryNodeDraft, KnowledgeCard } from '../types/card';

export const UNCATEGORIZED_DIRECTORY_ID = '__uncategorized__';

export type DirectoryTreeNode = DirectoryNode & {
  children: DirectoryTreeNode[];
  depth: number;
};

export function sortDirectories<T extends DirectoryNode>(directories: T[]) {
  return [...directories].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      a.title.localeCompare(b.title, 'zh-CN') ||
      a.createdAt.localeCompare(b.createdAt),
  );
}

export function buildDirectoryTree(directories: DirectoryNode[]) {
  const nodeMap = new Map<string, DirectoryTreeNode>();
  const roots: DirectoryTreeNode[] = [];

  sortDirectories(directories).forEach((directory) => {
    nodeMap.set(directory.id, { ...directory, children: [], depth: 0 });
  });

  nodeMap.forEach((node) => {
    const parent = node.parentId ? nodeMap.get(node.parentId) : null;
    if (parent) {
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      node.depth = 0;
      roots.push(node);
    }
  });

  const normalizeDepth = (nodes: DirectoryTreeNode[], depth = 0) => {
    nodes.forEach((node) => {
      node.depth = depth;
      node.children = sortDirectories(node.children).map((child) => ({
        ...child,
        children: child.children,
        depth: depth + 1,
      }));
      normalizeDepth(node.children, depth + 1);
    });
  };

  normalizeDepth(roots);
  return roots;
}

export function flattenDirectoryTree(nodes: DirectoryTreeNode[]) {
  const flattened: DirectoryTreeNode[] = [];

  const visit = (items: DirectoryTreeNode[]) => {
    items.forEach((item) => {
      flattened.push(item);
      visit(item.children);
    });
  };

  visit(nodes);
  return flattened;
}

export function getDirectoryPath(directories: DirectoryNode[], directoryId?: string) {
  if (!directoryId) return [];

  const byId = new Map(directories.map((directory) => [directory.id, directory]));
  const path: DirectoryNode[] = [];
  let current = byId.get(directoryId);
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    path.unshift(current);
    visited.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path;
}

export function formatDirectoryPath(directories: DirectoryNode[], directoryId?: string) {
  const path = getDirectoryPath(directories, directoryId);
  return path.length > 0 ? path.map((item) => item.title).join(' / ') : '未设置主目录';
}

export async function getAllDirectories() {
  const directories = await knowledgeCardDb.directories.toArray();
  return sortDirectories(directories);
}

export async function getDirectory(id: string) {
  return knowledgeCardDb.directories.get(id);
}

export async function createDirectory(draft: DirectoryNodeDraft) {
  const title = draft.title.trim();
  if (!title) throw new Error('目录名称必填。');

  if (draft.parentId === draft.parentId?.trim() && draft.parentId === '') {
    draft.parentId = undefined;
  }

  const now = new Date().toISOString();
  const directory: DirectoryNode = {
    id: crypto.randomUUID(),
    title,
    parentId: draft.parentId?.trim() || undefined,
    description: draft.description?.trim() || '',
    sortOrder: Number.isFinite(draft.sortOrder) ? draft.sortOrder : 100,
    createdAt: now,
    updatedAt: now,
  };

  await knowledgeCardDb.directories.add(directory);
  return directory;
}

export async function updateDirectory(
  id: string,
  patch: Partial<Omit<DirectoryNode, 'id' | 'createdAt' | 'updatedAt'>>,
) {
  const existing = await knowledgeCardDb.directories.get(id);
  if (!existing) throw new Error('目录不存在，无法更新。');

  const updated: DirectoryNode = {
    ...existing,
    ...patch,
    title: patch.title?.trim() || existing.title,
    parentId: patch.parentId?.trim() || undefined,
    description: patch.description?.trim() ?? existing.description ?? '',
    sortOrder: Number.isFinite(patch.sortOrder) ? Number(patch.sortOrder) : existing.sortOrder,
    updatedAt: new Date().toISOString(),
  };

  if (updated.parentId === updated.id) {
    throw new Error('目录不能把自己设为父目录。');
  }

  if (updated.parentId) {
    const directories = await knowledgeCardDb.directories.toArray();
    const byId = new Map(directories.map((directory) => [directory.id, directory]));
    const visited = new Set<string>();
    let currentParentId: string | undefined = updated.parentId;

    while (currentParentId) {
      if (currentParentId === updated.id) {
        throw new Error('目录不能移动到自己的子目录下面。');
      }
      if (visited.has(currentParentId)) {
        throw new Error('目录层级已存在循环引用，请先修复目录结构。');
      }
      visited.add(currentParentId);
      currentParentId = byId.get(currentParentId)?.parentId;
    }
  }

  await knowledgeCardDb.directories.put(updated);
  return updated;
}

export async function deleteDirectory(id: string) {
  const [children, cards] = await Promise.all([
    knowledgeCardDb.directories.where('parentId').equals(id).count(),
    knowledgeCardDb.cards.where('primaryDirectoryId').equals(id).count(),
  ]);

  if (children > 0) throw new Error('该目录下还有子目录，不能删除。');
  if (cards > 0) throw new Error('该目录下还有卡片，不能删除。请先移动卡片。');

  await knowledgeCardDb.directories.delete(id);
}

export async function setCardPrimaryDirectory(cardId: string, directoryId: string | undefined) {
  const card = await knowledgeCardDb.cards.get(cardId);
  if (!card) throw new Error('卡片不存在，无法设置目录。');

  if (directoryId) {
    const directory = await knowledgeCardDb.directories.get(directoryId);
    if (!directory) throw new Error('目录不存在，无法归入。');
  }

  const updated: KnowledgeCard = {
    ...card,
    primaryDirectoryId: directoryId || '',
    updatedAt: new Date().toISOString(),
  };

  await knowledgeCardDb.cards.put(updated);
  return updated;
}

export async function setCardsPrimaryDirectory(cardIds: string[], directoryId: string | undefined) {
  const uniqueIds = Array.from(new Set(cardIds.filter(Boolean)));
  if (uniqueIds.length === 0) throw new Error('请先选择要整理的卡片。');

  if (directoryId) {
    const directory = await knowledgeCardDb.directories.get(directoryId);
    if (!directory) throw new Error('目录不存在，无法批量归入。');
  }

  const now = new Date().toISOString();
  const cards = await knowledgeCardDb.cards.bulkGet(uniqueIds);
  const existingCards = cards.filter((card): card is KnowledgeCard => Boolean(card));
  const missingCount = uniqueIds.length - existingCards.length;

  const updatedCards = existingCards.map((card) => ({
    ...card,
    primaryDirectoryId: directoryId || '',
    updatedAt: now,
  }));

  if (updatedCards.length > 0) {
    await knowledgeCardDb.cards.bulkPut(updatedCards);
  }

  return {
    requested: uniqueIds.length,
    updated: updatedCards.length,
    missing: missingCount,
  };
}

function isDirectoryPinned(card: KnowledgeCard) {
  return (card.directorySortOrder ?? 9999) < 0;
}

function sortDirectorySiblings(cards: KnowledgeCard[]) {
  return [...cards].sort(
    (a, b) =>
      (a.directorySortOrder ?? 9999) - (b.directorySortOrder ?? 9999) ||
      b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function pinCardInDirectory(cardId: string) {
  const card = await knowledgeCardDb.cards.get(cardId);
  if (!card) throw new Error('卡片不存在，无法置顶。');
  if (!card.primaryDirectoryId) throw new Error('卡片没有主目录，无法在目录中置顶。');

  const siblings = await knowledgeCardDb.cards
    .where('primaryDirectoryId')
    .equals(card.primaryDirectoryId)
    .toArray();
  const minPinnedOrder = Math.min(
    0,
    ...siblings.filter(isDirectoryPinned).map((item) => item.directorySortOrder ?? 0),
  );
  const updated: KnowledgeCard = {
    ...card,
    directorySortOrder: minPinnedOrder - 10,
    updatedAt: new Date().toISOString(),
  };

  await knowledgeCardDb.cards.put(updated);
  return updated;
}

export async function unpinCardInDirectory(cardId: string) {
  const card = await knowledgeCardDb.cards.get(cardId);
  if (!card) throw new Error('卡片不存在，无法取消置顶。');
  if (!card.primaryDirectoryId) throw new Error('卡片没有主目录，无法取消目录置顶。');

  const siblings = await knowledgeCardDb.cards
    .where('primaryDirectoryId')
    .equals(card.primaryDirectoryId)
    .toArray();
  const maxNormalOrder = Math.max(
    0,
    ...siblings.filter((item) => !isDirectoryPinned(item)).map((item) => item.directorySortOrder ?? 9999),
  );
  const updated: KnowledgeCard = {
    ...card,
    directorySortOrder: maxNormalOrder + 10,
    updatedAt: new Date().toISOString(),
  };

  await knowledgeCardDb.cards.put(updated);
  return updated;
}

export async function moveCardInDirectory(cardId: string, direction: 'up' | 'down') {
  const card = await knowledgeCardDb.cards.get(cardId);
  if (!card) throw new Error('卡片不存在，无法调整排序。');
  if (!card.primaryDirectoryId) throw new Error('卡片没有主目录，无法调整目录排序。');

  const pinned = isDirectoryPinned(card);
  const siblings = await knowledgeCardDb.cards
    .where('primaryDirectoryId')
    .equals(card.primaryDirectoryId)
    .toArray();
  const group = sortDirectorySiblings(siblings.filter((item) => isDirectoryPinned(item) === pinned));
  const currentIndex = group.findIndex((item) => item.id === card.id);
  if (currentIndex < 0) throw new Error('卡片不在当前目录排序组中。');

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= group.length) return card;

  const reordered = [...group];
  const [target] = reordered.splice(currentIndex, 1);
  reordered.splice(nextIndex, 0, target);

  const now = new Date().toISOString();
  const length = reordered.length;
  const updatedGroup = reordered.map((item, index) => ({
    ...item,
    directorySortOrder: pinned ? -((length - index) * 10) : (index + 1) * 10,
    updatedAt: item.id === card.id ? now : item.updatedAt,
  }));

  await knowledgeCardDb.cards.bulkPut(updatedGroup);
  return updatedGroup.find((item) => item.id === card.id) ?? card;
}

export function getCardsInDirectory(cards: KnowledgeCard[], directoryId: string) {
  if (directoryId === UNCATEGORIZED_DIRECTORY_ID) {
    return cards.filter((card) => !card.primaryDirectoryId);
  }

  return cards
    .filter((card) => card.primaryDirectoryId === directoryId)
    .sort(
      (a, b) =>
        (a.directorySortOrder ?? 9999) - (b.directorySortOrder ?? 9999) ||
        b.updatedAt.localeCompare(a.updatedAt),
    );
}
