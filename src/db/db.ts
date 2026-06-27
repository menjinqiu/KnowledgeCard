import Dexie, { type Table } from 'dexie';
import type { CardCollection, DirectoryNode, KnowledgeCard } from '../types/card';
import type { SyncRecoverySnapshot, SyncState } from '../types/sync';

type AppMeta = {
  key: string;
  value: boolean | string;
  updatedAt: string;
};

class KnowledgeCardDatabase extends Dexie {
  cards!: Table<KnowledgeCard, string>;
  collections!: Table<CardCollection, string>;
  directories!: Table<DirectoryNode, string>;
  meta!: Table<AppMeta, string>;
  syncStates!: Table<SyncState, string>;
  recoverySnapshots!: Table<SyncRecoverySnapshot, string>;

  constructor() {
    super('knowledgeCardDb');
    this.version(1).stores({
      cards:
        '&id, title, domain, type, validity, importance, favorite, archived, createdAt, updatedAt, *tags',
    });
    this.version(2).stores({
      cards:
        '&id, title, domain, type, validity, importance, favorite, archived, createdAt, updatedAt, *tags',
      meta: '&key',
    });
    this.version(3).stores({
      cards:
        '&id, title, domain, type, validity, importance, favorite, archived, createdAt, updatedAt, *tags',
      collections: '&id, title, printable, createdAt, updatedAt, *cardIds',
      meta: '&key',
    });
    this.version(4).stores({
      cards:
        '&id, title, domain, type, validity, importance, favorite, archived, primaryDirectoryId, directorySortOrder, createdAt, updatedAt, *tags',
      collections: '&id, title, printable, createdAt, updatedAt, *cardIds',
      directories: '&id, title, parentId, sortOrder, createdAt, updatedAt',
      meta: '&key',
    });
    this.version(5).stores({
      cards:
        '&id, title, domain, type, validity, importance, favorite, archived, primaryDirectoryId, directorySortOrder, createdAt, updatedAt, *tags',
      collections: '&id, title, printable, createdAt, updatedAt, *cardIds',
      directories: '&id, title, parentId, sortOrder, createdAt, updatedAt',
      meta: '&key',
      syncStates: '&id, mode, deviceId, updatedAt, lastSuccessfulSyncAt',
      recoverySnapshots: '&id, createdAt, reason',
    });
  }
}

export const knowledgeCardDb = new KnowledgeCardDatabase();

const sampleCards: KnowledgeCard[] = [
  {
    id: 'sample-a1-listening-plan',
    title: 'A1听力专项提高计划',
    domain: '德语',
    type: '方案卡',
    tags: ['A1', '听力', '训练计划'],
    summary: '用 4 周时间建立 A1 日常场景听力输入、跟读和复述节奏。',
    content: `# 目标
在 4 周内把日常问候、购物、预约、交通等 A1 场景听到能抓关键词，并能复述 1-2 句核心信息。

## 每日流程
1. 5 分钟：听一段 30-60 秒慢速材料，只听不看文本。
2. 8 分钟：看文本标出生词和动词位置。
3. 10 分钟：逐句跟读，重点模仿重音和句尾语调。
4. 5 分钟：关文本复述人物、地点、时间、动作。

## 每周复盘
- 周一到周五做新材料。
- 周六重复本周 3 段材料并录音。
- 周日只做轻量泛听，整理高频表达。`,
    source: '个人学习方案',
    sourceUrl: '',
    validity: '需定期复核',
    importance: 5,
    favorite: true,
    printable: true,
    archived: false,
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-20T09:00:00.000Z',
  },
  {
    id: 'sample-german-v2-rule',
    title: 'V2动词第二位规则',
    domain: '德语',
    type: '知识卡',
    tags: ['语法', 'V2', '句序'],
    summary: '德语陈述句中变位动词通常位于第二个句法位置，而不是第二个单词。',
    content: `# 核心规则
德语主句里，变位动词放在第二位。第一位可以是主语、时间、地点、宾语或整个短语。

## 例子
- Ich lerne heute Deutsch.
- Heute lerne ich Deutsch.
- Im Park liest er ein Buch.

## 注意
第二位指“句法成分”的第二位，不等于第二个单词。时间状语提前时，主语通常移到动词后面。`,
    source: '德语语法总结',
    sourceUrl: '',
    validity: '长期有效',
    importance: 4,
    favorite: true,
    printable: true,
    archived: false,
    createdAt: '2026-06-03T09:00:00.000Z',
    updatedAt: '2026-06-18T09:00:00.000Z',
  },
  {
    id: 'sample-short-trade-checklist',
    title: '短线交易前检查清单',
    domain: '投资',
    type: '清单卡',
    tags: ['交易', '风控', '检查清单'],
    summary: '进场前确认趋势、位置、风险收益比、仓位和退出条件。',
    content: `# 交易前必须回答
- 当前是趋势跟随、突破、回踩，还是纯情绪交易？
- 买入点距离止损点是多少？
- 单笔亏损是否小于账户净值的 1%？
- 盈亏比是否至少 2:1？
- 如果开盘 15 分钟剧烈波动，是否仍然符合计划？

## 禁止进场
- 没有明确止损。
- 因为害怕错过而追高。
- 亏损后立刻加倍仓位。
- 同时持有多个高度相关标的。`,
    source: '个人交易规则',
    sourceUrl: '',
    validity: '需定期复核',
    importance: 5,
    favorite: false,
    printable: true,
    archived: false,
    createdAt: '2026-06-04T09:00:00.000Z',
    updatedAt: '2026-06-17T09:00:00.000Z',
  },
  {
    id: 'sample-child-rash-checklist',
    title: '儿童皮疹观察要点',
    domain: '健康',
    type: '清单卡',
    tags: ['儿童', '皮疹', '观察'],
    summary: '记录皮疹变化、伴随症状和需要及时就医的信号。',
    content: `# 先观察并记录
- 皮疹出现时间、位置、颜色、范围。
- 是否发热、精神差、呼吸异常、呕吐或腹泻。
- 是否瘙痒、疼痛、渗液或快速扩散。
- 近期是否吃过新食物、药物，接触过新洗护用品。

## 尽快就医信号
- 高热不退或精神明显变差。
- 皮疹按压不褪色。
- 出现呼吸困难、嘴唇发紫、明显水肿。
- 婴幼儿年龄较小且症状进展快。

## 备注
这张卡只用于家庭观察和记录，不替代医生诊断。`,
    source: '家庭健康记录模板',
    sourceUrl: '',
    validity: '需定期复核',
    importance: 4,
    favorite: false,
    printable: true,
    archived: false,
    createdAt: '2026-06-05T09:00:00.000Z',
    updatedAt: '2026-06-15T09:00:00.000Z',
  },
  {
    id: 'sample-codex-dev-prompt',
    title: '给 Codex 的开发提示词模板',
    domain: '工具',
    type: '提示词卡',
    tags: ['Codex', '提示词', '开发'],
    summary: '用于让 Codex 接手本地项目、先读代码、再小步实现并验证。',
    content: `# 提示词模板
请你接手当前本地项目，先确认真实工作目录和 git 状态，再阅读相关代码。

## 工作要求
- 不要重做已有功能。
- 只修改和当前任务直接相关的文件。
- 每次编辑前说明将要改什么。
- 完成后运行构建或最小可行测试。
- 最终说明改动、验证结果、已知限制。

## 额外上下文
\`\`\`text
目标：
验收标准：
禁止事项：
\`\`\``,
    source: '个人提示词库',
    sourceUrl: '',
    validity: '长期有效',
    importance: 5,
    favorite: true,
    printable: true,
    archived: false,
    createdAt: '2026-06-06T09:00:00.000Z',
    updatedAt: '2026-06-14T09:00:00.000Z',
  },
];

const defaultDirectories: DirectoryNode[] = [
  {
    id: 'dir-ai-collaboration',
    title: 'AI 协作',
    description: '提示词、项目接管、长期协作流程和 AI 辅助开发资料。',
    sortOrder: 10,
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
  },
  {
    id: 'dir-ai-project-handoff',
    title: '项目接管',
    parentId: 'dir-ai-collaboration',
    description: '旧会话结束、新会话接管、状态核验和交接提示词。',
    sortOrder: 10,
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
  },
  {
    id: 'dir-ai-prompt-library',
    title: '提示词库',
    parentId: 'dir-ai-collaboration',
    description: '可一键复制复用的提示词、模板和检查清单。',
    sortOrder: 20,
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
  },
  {
    id: 'dir-german-study',
    title: '德语学习',
    description: '德语语法、词汇、练习、听说读写和求职表达。',
    sortOrder: 20,
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
  },
  {
    id: 'dir-investment-trading',
    title: '投资交易',
    description: '交易流程、风控清单、复盘框架和资产配置资料。',
    sortOrder: 30,
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
  },
  {
    id: 'dir-career-growth',
    title: '职业发展',
    description: '德国求职、简历项目、面试准备和技术作品集。',
    sortOrder: 40,
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
  },
  {
    id: 'dir-family-life',
    title: '家庭生活',
    description: '家庭决策、子女教育、健康医疗、车辆保险和生活资料。',
    sortOrder: 50,
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
  },
  {
    id: 'dir-local-tools',
    title: '本地工具',
    description: 'KnowledgeCard、FocusBlock、SharpLingo、stock-platform 等本地系统。',
    sortOrder: 60,
    createdAt: '2026-06-26T00:00:00.000Z',
    updatedAt: '2026-06-26T00:00:00.000Z',
  },
];

const SAMPLE_SEED_META_KEY = 'hasSeededSamples';

export async function seedSampleCardsIfEmpty() {
  await knowledgeCardDb.transaction(
    'rw',
    knowledgeCardDb.cards,
    knowledgeCardDb.directories,
    knowledgeCardDb.meta,
    async () => {
      const seeded = await knowledgeCardDb.meta.get(SAMPLE_SEED_META_KEY);

      const directoryCount = await knowledgeCardDb.directories.count();
      if (directoryCount === 0) {
        await knowledgeCardDb.directories.bulkPut(defaultDirectories);
      }

      if (seeded?.value === true) {
        return;
      }

      const count = await knowledgeCardDb.cards.count();

      if (count === 0) {
        await knowledgeCardDb.cards.bulkPut(sampleCards);
      }

      await knowledgeCardDb.meta.put({
        key: SAMPLE_SEED_META_KEY,
        value: true,
        updatedAt: new Date().toISOString(),
      });
    },
  );
}
