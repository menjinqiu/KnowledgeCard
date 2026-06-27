export type CardDomain =
  | '德语'
  | '投资'
  | '健康'
  | '职业发展'
  | '生活'
  | '工具'
  | '通用';

export type CardType =
  | '方案卡'
  | '清单卡'
  | '模板卡'
  | '练习卡'
  | '决策卡'
  | '提示词卡'
  | '知识卡';

export type CardValidity =
  | '长期有效'
  | '需定期复核'
  | '高时效'
  | '已过期';

export type KnowledgeCard = {
  id: string;
  title: string;
  domain: CardDomain;
  type: CardType;
  tags: string[];
  summary?: string;
  content: string;
  copyLabel?: string;
  copyText?: string;
  primaryDirectoryId?: string;
  directorySortOrder?: number;
  source?: string;
  sourceUrl?: string;
  validity: CardValidity;
  importance: 1 | 2 | 3 | 4 | 5;
  favorite: boolean;
  printable: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Importance = KnowledgeCard['importance'];

export const CARD_DOMAINS: CardDomain[] = [
  '德语',
  '投资',
  '健康',
  '职业发展',
  '生活',
  '工具',
  '通用',
];

export const CARD_TYPES: CardType[] = [
  '方案卡',
  '清单卡',
  '模板卡',
  '练习卡',
  '决策卡',
  '提示词卡',
  '知识卡',
];

export const CARD_VALIDITIES: CardValidity[] = [
  '长期有效',
  '需定期复核',
  '高时效',
  '已过期',
];

export const IMPORTANCE_LEVELS: Importance[] = [5, 4, 3, 2, 1];

export type CardCollection = {
  id: string;
  title: string;
  description?: string;
  cardIds: string[];
  printable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CardCollectionDraft = Omit<CardCollection, 'id' | 'createdAt' | 'updatedAt'>;

export type DirectoryNode = {
  id: string;
  title: string;
  parentId?: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type DirectoryNodeDraft = Omit<DirectoryNode, 'id' | 'createdAt' | 'updatedAt'>;
