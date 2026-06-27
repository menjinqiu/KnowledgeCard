import { knowledgeCardDb } from '../db/db';
import type { CardCollection, CardCollectionDraft, KnowledgeCard } from '../types/card';

export type CollectionCardSummary = {
  collection: CardCollection;
  cards: KnowledgeCard[];
};

export const QUICK_ACCESS_COLLECTION_ID = '__quick_access__';
export const QUICK_ACCESS_COLLECTION_TITLE = '当前常用';
export const QUICK_ACCESS_UPDATED_EVENT = 'quick-access-updated';

export function isQuickAccessCollection(collection: Pick<CardCollection, 'id'>) {
  return collection.id === QUICK_ACCESS_COLLECTION_ID;
}

function notifyQuickAccessUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(QUICK_ACCESS_UPDATED_EVENT));
}

function normalizeCardIds(cardIds: string[]) {
  return Array.from(new Set(cardIds.filter(Boolean)));
}

export async function getAllCollections() {
  return knowledgeCardDb.collections.orderBy('updatedAt').reverse().toArray();
}

export async function getCollection(id: string) {
  return knowledgeCardDb.collections.get(id);
}

export async function createCollection(draft: CardCollectionDraft) {
  const now = new Date().toISOString();
  const collection: CardCollection = {
    id: crypto.randomUUID(),
    title: draft.title.trim(),
    description: draft.description?.trim() ?? '',
    cardIds: normalizeCardIds(draft.cardIds),
    printable: draft.printable,
    createdAt: now,
    updatedAt: now,
  };

  if (!collection.title) {
    throw new Error('专题集名称必填。');
  }

  await knowledgeCardDb.collections.add(collection);
  return collection;
}

export async function updateCollection(
  id: string,
  patch: Partial<Omit<CardCollection, 'id' | 'createdAt' | 'updatedAt'>>,
) {
  const existing = await knowledgeCardDb.collections.get(id);

  if (!existing) {
    throw new Error('专题集不存在，无法更新。');
  }

  const updated: CardCollection = {
    ...existing,
    ...patch,
    title: patch.title !== undefined ? patch.title.trim() : existing.title,
    description: patch.description !== undefined ? patch.description.trim() : existing.description,
    cardIds: patch.cardIds ? normalizeCardIds(patch.cardIds) : existing.cardIds,
    updatedAt: new Date().toISOString(),
  };

  if (!updated.title) {
    throw new Error('专题集名称必填。');
  }

  await knowledgeCardDb.collections.put(updated);
  return updated;
}

export async function deleteCollection(id: string) {
  if (id === QUICK_ACCESS_COLLECTION_ID) {
    throw new Error('当前常用是系统入口，不能删除。');
  }

  await knowledgeCardDb.collections.delete(id);
}

export async function ensureQuickAccessCollection() {
  const existing = await getCollection(QUICK_ACCESS_COLLECTION_ID);

  if (existing) {
    if (existing.title === QUICK_ACCESS_COLLECTION_TITLE && existing.printable === false) return existing;

    const patched: CardCollection = {
      ...existing,
      title: QUICK_ACCESS_COLLECTION_TITLE,
      description: '当前一段时间最常打开的卡片。用于左侧栏快速进入。',
      printable: false,
      updatedAt: new Date().toISOString(),
    };
    await knowledgeCardDb.collections.put(patched);
    return patched;
  }

  const now = new Date().toISOString();
  const collection: CardCollection = {
    id: QUICK_ACCESS_COLLECTION_ID,
    title: QUICK_ACCESS_COLLECTION_TITLE,
    description: '当前一段时间最常打开的卡片。用于左侧栏快速进入。',
    cardIds: [],
    printable: false,
    createdAt: now,
    updatedAt: now,
  };

  await knowledgeCardDb.collections.add(collection);
  return collection;
}

export async function getQuickAccessCards(limit = 5) {
  const collection = await ensureQuickAccessCollection();
  const records = await knowledgeCardDb.cards.bulkGet(collection.cardIds);
  return records.filter((card): card is KnowledgeCard => Boolean(card)).slice(0, limit);
}

export async function isCardInQuickAccess(cardId: string) {
  const collection = await ensureQuickAccessCollection();
  return collection.cardIds.includes(cardId);
}

export async function addCardToQuickAccess(cardId: string) {
  const collection = await ensureQuickAccessCollection();
  const updated = await updateCollection(collection.id, {
    cardIds: normalizeCardIds([cardId, ...collection.cardIds]),
  });
  notifyQuickAccessUpdated();
  return updated;
}

export async function removeCardFromQuickAccess(cardId: string) {
  const collection = await ensureQuickAccessCollection();
  const updated = await updateCollection(collection.id, {
    cardIds: collection.cardIds.filter((id) => id !== cardId),
  });
  notifyQuickAccessUpdated();
  return updated;
}

export async function addCardToCollection(collectionId: string, cardId: string) {
  return addCardsToCollection(collectionId, [cardId]);
}

export async function addCardsToCollection(collectionId: string, cardIds: string[]) {
  const collection = await getCollection(collectionId);

  if (!collection) {
    throw new Error('专题集不存在。');
  }

  const nextCardIds = normalizeCardIds([...collection.cardIds, ...cardIds]);

  if (nextCardIds.length === collection.cardIds.length) {
    return collection;
  }

  const updated = await updateCollection(collection.id, {
    cardIds: nextCardIds,
  });

  if (isQuickAccessCollection(collection)) notifyQuickAccessUpdated();
  return updated;
}

export async function removeCardFromCollection(collectionId: string, cardId: string) {
  const collection = await getCollection(collectionId);

  if (!collection) {
    throw new Error('专题集不存在。');
  }

  const updated = await updateCollection(collection.id, {
    cardIds: collection.cardIds.filter((id) => id !== cardId),
  });

  if (isQuickAccessCollection(collection)) notifyQuickAccessUpdated();
  return updated;
}

export async function moveCardInCollection(
  collectionId: string,
  cardId: string,
  direction: 'up' | 'down',
) {
  const collection = await getCollection(collectionId);

  if (!collection) {
    throw new Error('专题集不存在。');
  }

  const currentIndex = collection.cardIds.indexOf(cardId);
  if (currentIndex < 0) {
    throw new Error('卡片不在当前专题集中。');
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= collection.cardIds.length) {
    return collection;
  }

  const nextCardIds = [...collection.cardIds];
  const [movedCardId] = nextCardIds.splice(currentIndex, 1);
  nextCardIds.splice(targetIndex, 0, movedCardId);

  const updated = await updateCollection(collection.id, {
    cardIds: nextCardIds,
  });

  if (isQuickAccessCollection(collection)) notifyQuickAccessUpdated();
  return updated;
}

export async function getCollectionsContainingCard(cardId: string) {
  const collections = await getAllCollections();
  return collections.filter((collection) => collection.cardIds.includes(cardId));
}

export async function getCardsForCollection(collection: CardCollection) {
  const records = await knowledgeCardDb.cards.bulkGet(collection.cardIds);
  return records.filter((card): card is KnowledgeCard => Boolean(card));
}

export async function getCollectionWithCards(id: string): Promise<CollectionCardSummary | null> {
  const collection = await getCollection(id);

  if (!collection) {
    return null;
  }

  const cards = await getCardsForCollection(collection);
  return { collection, cards };
}
