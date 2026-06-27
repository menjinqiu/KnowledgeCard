import { knowledgeCardDb } from '../db/db';
import type {
  CardDomain,
  CardType,
  CardValidity,
  Importance,
  KnowledgeCard,
} from '../types/card';
import { normalizeTags } from './tagService';

export type ArchivedFilter = 'active' | 'archived' | 'all';

export type CardFilters = {
  query: string;
  domain: CardDomain | '';
  type: CardType | '';
  tag: string;
  validity: CardValidity | '';
  importance: Importance | '';
  favorite: boolean;
  archived: ArchivedFilter;
};

export type CardDraft = Omit<KnowledgeCard, 'id' | 'createdAt' | 'updatedAt'>;

export const defaultFilters: CardFilters = {
  query: '',
  domain: '',
  type: '',
  tag: '',
  validity: '',
  importance: '',
  favorite: false,
  archived: 'active',
};

export async function getAllCards() {
  return knowledgeCardDb.cards.orderBy('updatedAt').reverse().toArray();
}

export async function getCard(id: string) {
  return knowledgeCardDb.cards.get(id);
}

export async function createCard(draft: CardDraft) {
  const now = new Date().toISOString();
  const card: KnowledgeCard = {
    ...draft,
    id: crypto.randomUUID(),
    tags: normalizeTags(draft.tags),
    createdAt: now,
    updatedAt: now,
  };

  await knowledgeCardDb.cards.add(card);
  return card;
}

export async function updateCard(
  id: string,
  patch: Partial<Omit<KnowledgeCard, 'id' | 'createdAt' | 'updatedAt'>>,
) {
  const existing = await knowledgeCardDb.cards.get(id);

  if (!existing) {
    throw new Error('卡片不存在，无法更新。');
  }

  const updated: KnowledgeCard = {
    ...existing,
    ...patch,
    tags: patch.tags ? normalizeTags(patch.tags) : existing.tags,
    updatedAt: new Date().toISOString(),
  };

  await knowledgeCardDb.cards.put(updated);
  return updated;
}

export async function deleteCard(id: string) {
  await knowledgeCardDb.cards.delete(id);
}

export async function setFavorite(id: string, favorite: boolean) {
  return updateCard(id, { favorite });
}

export async function setArchived(id: string, archived: boolean) {
  return updateCard(id, { archived });
}

export type BatchCardFlagPatch = Partial<Pick<KnowledgeCard, 'favorite' | 'printable' | 'archived'>>;

export async function updateCardsFlags(cardIds: string[], patch: BatchCardFlagPatch) {
  const uniqueIds = Array.from(new Set(cardIds.filter(Boolean)));
  if (uniqueIds.length === 0) throw new Error('请先选择要批量更新的卡片。');

  const allowedKeys: Array<keyof BatchCardFlagPatch> = ['favorite', 'printable', 'archived'];
  const safePatch = allowedKeys.reduce<BatchCardFlagPatch>((acc, key) => {
    if (typeof patch[key] === 'boolean') {
      acc[key] = patch[key];
    }
    return acc;
  }, {});

  if (Object.keys(safePatch).length === 0) {
    throw new Error('没有可更新的批量字段。');
  }

  const now = new Date().toISOString();
  const cards = await knowledgeCardDb.cards.bulkGet(uniqueIds);
  const existingCards = cards.filter((card): card is KnowledgeCard => Boolean(card));
  const missingCount = uniqueIds.length - existingCards.length;

  const updatedCards = existingCards.map((card) => ({
    ...card,
    ...safePatch,
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

export function getAllTags(cards: KnowledgeCard[]) {
  return Array.from(new Set(cards.flatMap((card) => card.tags))).sort((a, b) =>
    a.localeCompare(b, 'zh-CN'),
  );
}

export function applyCardFilters(cards: KnowledgeCard[], filters: CardFilters) {
  const query = filters.query.trim().toLowerCase();

  return cards.filter((card) => {
    if (filters.archived === 'active' && card.archived) return false;
    if (filters.archived === 'archived' && !card.archived) return false;
    if (filters.domain && card.domain !== filters.domain) return false;
    if (filters.type && card.type !== filters.type) return false;
    if (filters.tag && !card.tags.includes(filters.tag)) return false;
    if (filters.validity && card.validity !== filters.validity) return false;
    if (filters.importance && card.importance !== filters.importance) {
      return false;
    }
    if (filters.favorite && !card.favorite) return false;

    if (!query) return true;

    const searchBlob = [
      card.title,
      card.summary ?? '',
      card.content,
      card.copyLabel ?? '',
      card.copyText ?? '',
      card.tags.join(' '),
    ]
      .join('\n')
      .toLowerCase();

    return searchBlob.includes(query);
  });
}

export function sortCards(cards: KnowledgeCard[], sortMode: string) {
  const sorted = [...cards];

  switch (sortMode) {
    case 'importance-desc':
      return sorted.sort(
        (a, b) =>
          b.importance - a.importance ||
          b.updatedAt.localeCompare(a.updatedAt),
      );
    case 'domain':
      return sorted.sort(
        (a, b) =>
          a.domain.localeCompare(b.domain, 'zh-CN') ||
          b.updatedAt.localeCompare(a.updatedAt),
      );
    case 'type':
      return sorted.sort(
        (a, b) =>
          a.type.localeCompare(b.type, 'zh-CN') ||
          b.updatedAt.localeCompare(a.updatedAt),
      );
    case 'updated-desc':
    default:
      return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}
