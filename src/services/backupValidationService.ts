import {
  CARD_DOMAINS,
  CARD_TYPES,
  CARD_VALIDITIES,
  IMPORTANCE_LEVELS,
  type CardDomain,
  type CardType,
  type CardValidity,
  type Importance,
  type CardCollection,
  type DirectoryNode,
  type KnowledgeCard,
} from '../types/card';
import { normalizeTags } from './tagService';

export const SUPPORTED_BACKUP_VERSION = 1;

export type KnowledgeCardSyncMeta = {
  packageType: 'manual-sync' | 'bound-sync-file';
  deviceId: string;
  deviceName: string;
  generatedAt: string;
  syncFileId?: string;
  schemaVersion?: number;
  lastWriterDeviceId?: string;
  lastWriterDeviceName?: string;
  lastWriterAt?: string;
  revision?: number;
  contentHash?: string;
};

export type KnowledgeCardBackup = {
  app: 'KnowledgeCard';
  version: 1;
  exportedAt: string;
  cards: KnowledgeCard[];
  collections?: CardCollection[];
  directories?: DirectoryNode[];
  syncMeta?: KnowledgeCardSyncMeta;
};

export type ParsedBackup = {
  cards: KnowledgeCard[];
  collections: CardCollection[];
  directories: DirectoryNode[];
  errors: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value));
}

function isValidTimeString(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isCardDomain(value: unknown): value is CardDomain {
  return CARD_DOMAINS.includes(value as CardDomain);
}

function isCardType(value: unknown): value is CardType {
  return CARD_TYPES.includes(value as CardType);
}

function isCardValidity(value: unknown): value is CardValidity {
  return CARD_VALIDITIES.includes(value as CardValidity);
}

function isImportance(value: unknown): value is Importance {
  return IMPORTANCE_LEVELS.includes(value as Importance);
}

export function validateImportedCard(value: unknown): KnowledgeCard | null {
  if (!isRecord(value)) return null;

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.content) ||
    !isCardDomain(value.domain) ||
    !isCardType(value.type) ||
    !isCardValidity(value.validity) ||
    !isImportance(value.importance) ||
    !Array.isArray(value.tags) ||
    !value.tags.every((tag) => typeof tag === 'string') ||
    typeof value.favorite !== 'boolean' ||
    typeof value.printable !== 'boolean' ||
    typeof value.archived !== 'boolean' ||
    !isValidTimeString(value.createdAt) ||
    !isValidTimeString(value.updatedAt) ||
    !isOptionalString(value.summary) ||
    !isOptionalString(value.copyLabel) ||
    !isOptionalString(value.copyText) ||
    !isOptionalString(value.primaryDirectoryId) ||
    !isOptionalNumber(value.directorySortOrder) ||
    !isOptionalString(value.source) ||
    !isOptionalString(value.sourceUrl)
  ) {
    return null;
  }

  return {
    id: value.id.trim(),
    title: value.title.trim(),
    domain: value.domain,
    type: value.type,
    tags: normalizeTags(value.tags),
    summary: value.summary ?? '',
    content: value.content,
    copyLabel: value.copyLabel?.trim() ?? '',
    copyText: value.copyText ?? '',
    primaryDirectoryId: value.primaryDirectoryId?.trim() ?? '',
    directorySortOrder: value.directorySortOrder ?? 9999,
    source: value.source ?? '',
    sourceUrl: value.sourceUrl ?? '',
    validity: value.validity,
    importance: value.importance,
    favorite: value.favorite,
    printable: value.printable,
    archived: value.archived,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function validateImportedCollection(value: unknown): CardCollection | null {
  if (!isRecord(value)) return null;

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.title) ||
    !Array.isArray(value.cardIds) ||
    !value.cardIds.every((cardId) => typeof cardId === 'string') ||
    typeof value.printable !== 'boolean' ||
    !isValidTimeString(value.createdAt) ||
    !isValidTimeString(value.updatedAt) ||
    !isOptionalString(value.description)
  ) {
    return null;
  }

  const cardIds = value.cardIds as string[];

  return {
    id: value.id.trim(),
    title: value.title.trim(),
    description: value.description ?? '',
    cardIds: Array.from(new Set(cardIds.map((cardId) => cardId.trim()).filter(Boolean))),
    printable: value.printable,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function validateImportedDirectory(value: unknown): DirectoryNode | null {
  if (!isRecord(value)) return null;

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.title) ||
    !isOptionalString(value.parentId) ||
    !isOptionalString(value.description) ||
    typeof value.sortOrder !== 'number' ||
    !Number.isFinite(value.sortOrder) ||
    !isValidTimeString(value.createdAt) ||
    !isValidTimeString(value.updatedAt)
  ) {
    return null;
  }

  return {
    id: value.id.trim(),
    title: value.title.trim(),
    parentId: value.parentId?.trim() || undefined,
    description: value.description ?? '',
    sortOrder: value.sortOrder,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function parseKnowledgeCardBackupText(text: string): ParsedBackup {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSON 文件解析失败，请确认文件内容有效。');
  }

  if (
    !isRecord(parsed) ||
    parsed.app !== 'KnowledgeCard' ||
    parsed.version !== SUPPORTED_BACKUP_VERSION ||
    !Array.isArray(parsed.cards)
  ) {
    throw new Error('JSON 文件不是 KnowledgeCard v1 备份。');
  }

  const cards: KnowledgeCard[] = [];
  const collections: CardCollection[] = [];
  const directories: DirectoryNode[] = [];
  let errors = 0;

  for (const rawCard of parsed.cards) {
    const card = validateImportedCard(rawCard);

    if (!card) {
      errors += 1;
      continue;
    }

    cards.push(card);
  }

  if (Array.isArray(parsed.collections)) {
    for (const rawCollection of parsed.collections) {
      const collection = validateImportedCollection(rawCollection);

      if (!collection) {
        errors += 1;
        continue;
      }

      collections.push(collection);
    }
  }

  if (Array.isArray(parsed.directories)) {
    for (const rawDirectory of parsed.directories) {
      const directory = validateImportedDirectory(rawDirectory);

      if (!directory) {
        errors += 1;
        continue;
      }

      directories.push(directory);
    }
  }

  return { cards, collections, directories, errors };
}

export function isImportedCardNewer(
  imported: Pick<KnowledgeCard, 'updatedAt'>,
  existing: Pick<KnowledgeCard, 'updatedAt'>,
) {
  return Date.parse(imported.updatedAt) > Date.parse(existing.updatedAt);
}
