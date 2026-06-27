import { SUPPORTED_BACKUP_VERSION } from './backupValidationService';

export type GptImportTemplateKind = 'general' | 'learning-flow' | 'prompt' | 'qa-record' | 'decision';

export const GPT_IMPORT_TEMPLATE_OPTIONS: Array<{
  kind: GptImportTemplateKind;
  label: string;
  description: string;
}> = [
  {
    kind: 'general',
    label: '通用知识卡',
    description: '适合普通资料、概念、经验总结和网页摘录。',
  },
  {
    kind: 'learning-flow',
    label: '学习流程卡',
    description: '适合德语训练流程、听力步骤、复习方法和学习 SOP。',
  },
  {
    kind: 'prompt',
    label: '提示词卡',
    description: '适合保存可反复复制给 GPT 使用的完整提示词。',
  },
  {
    kind: 'qa-record',
    label: 'QA 记录卡',
    description: '适合记录测试步骤、PASS/FAIL/NOT RUN 和遗留风险。',
  },
  {
    kind: 'decision',
    label: '决策卡',
    description: '适合项目决策、取舍理由、边界和后续影响。',
  },
];

export const GPT_CARD_IMPORT_PROMPT = `你现在要为我的本地知识卡片系统 KnowledgeCard 生成可导入的卡片数据。

你的任务不是写普通文章，而是把我提供的资料、想法、网页内容、笔记、对话记录或学习材料，整理成结构化、高价值、可复用、可搜索、可打印的知识卡片。

必须只输出合法 JSON，不要输出解释文字，不要输出 Markdown 代码块，不要在 JSON 前后添加任何说明。

输出总格式：
{
  "app": "KnowledgeCard",
  "version": 1,
  "exportedAt": "ISO 时间字符串",
  "cards": [
    {
      "id": "稳定且唯一的卡片 ID，建议使用 kebab-case，例如 gpt-import-20260626-topic",
      "title": "卡片标题",
      "domain": "德语 | 投资 | 健康 | 职业发展 | 生活 | 工具 | 通用",
      "type": "方案卡 | 清单卡 | 模板卡 | 练习卡 | 决策卡 | 提示词卡 | 知识卡",
      "tags": ["标签1", "标签2"],
      "summary": "一句话摘要",
      "content": "卡片正文，使用简洁 Markdown。要结构化、可复用、可打印。",
      "copyLabel": "复制按钮名称，可为空字符串",
      "copyText": "最值得复用的一段文本，例如提示词、模板、清单或操作步骤，可为空字符串",
      "primaryDirectoryId": "可为空字符串",
      "directorySortOrder": 9999,
      "source": "来源说明，可为空字符串",
      "sourceUrl": "来源链接，可为空字符串",
      "validity": "长期有效 | 需定期复核 | 高时效 | 已过期",
      "importance": 1,
      "favorite": false,
      "printable": true,
      "archived": false,
      "createdAt": "ISO 时间字符串",
      "updatedAt": "ISO 时间字符串"
    }
  ],
  "collections": [],
  "directories": []
}

字段要求：
1. app 必须是 KnowledgeCard。
2. version 必须是 1。
3. exportedAt、createdAt、updatedAt 必须是合法 ISO 时间字符串。
4. cards 必须是数组。
5. domain、type、validity 必须严格从上面的枚举中选择。
6. importance 必须是 1、2、3、4、5 之一，5 最高。
7. favorite、printable、archived 必须是布尔值。
8. 不确定目录时，primaryDirectoryId 用空字符串，directorySortOrder 用 9999。
9. copyText 应该放最值得一键复制复用的内容；没有就用空字符串。
10. collections 和 directories 可以为空数组。
11. 不要生成重复 id。更新同一张卡时保持 id 不变，并把 updatedAt 设为更新后的时间。

现在请把我接下来提供的内容整理成 KnowledgeCard JSON。`;

function createTemplateId(kind: GptImportTemplateKind, now: string) {
  const stamp = now.slice(0, 19).replace(/[-:T]/g, '');
  return `gpt-template-${kind}-${stamp}`;
}

function createTemplateCard(kind: GptImportTemplateKind, now: string) {
  const id = createTemplateId(kind, now);

  const common = {
    id,
    primaryDirectoryId: '',
    directorySortOrder: 9999,
    source: 'GPT 生成',
    sourceUrl: '',
    favorite: false,
    printable: true,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  switch (kind) {
    case 'learning-flow':
      return {
        ...common,
        title: '学习流程卡｜替换为具体主题',
        domain: '德语',
        type: '方案卡',
        tags: ['学习流程', '训练方法', '待替换'],
        summary: '把一个学习任务拆成可执行、可复盘、可打印的训练流程。',
        content:
          '## 适用场景\n\n说明这个流程适合什么材料、什么水平、什么目标。\n\n## 训练步骤\n\n1. 听前预测：主题、场景、关键词。\n2. 第一遍盲听：只抓人物、地点、大意。\n3. 第二遍关键词：记录人物、地点、动作、时间、数字。\n4. 分句精听：每句最多 3 遍。\n5. 对照纠错：标记没听出的词和误判原因。\n6. 复述输出：用自己的话复述。\n\n## 验收标准\n\n- 能说出大意。\n- 能抓住关键数字/否定/动作。\n- 能复述核心句。\n\n## 常见错误\n\n- 过早看全文。\n- 试图听清每个词。\n- 根据常识脑补。',
        copyLabel: '复制训练流程',
        copyText:
          '听前预测 → 第一遍盲听 → 第二遍关键词 → 分句精听 → 对照纠错 → 复述输出。每一步只追求当前目标，不提前看全文。',
        validity: '长期有效',
        importance: 4,
      };
    case 'prompt':
      return {
        ...common,
        title: '提示词卡｜替换为具体用途',
        domain: '工具',
        type: '提示词卡',
        tags: ['提示词', 'GPT', '待替换'],
        summary: '保存一段可反复复制使用的高质量提示词。',
        content:
          '## 使用目的\n\n说明这个提示词要解决什么问题。\n\n## 使用场景\n\n- 适合什么输入。\n- 不适合什么输入。\n\n## 提示词正文\n\n```text\n把完整提示词放在这里。\n```\n\n## 输出要求\n\n- 格式要求。\n- 质量标准。\n- 禁止项。\n\n## 使用注意\n\n记录容易失败的地方和修正方法。',
        copyLabel: '复制提示词',
        copyText: '把完整可复用提示词放在 copyText，方便卡片详情页一键复制。',
        validity: '需定期复核',
        importance: 4,
      };
    case 'qa-record':
      return {
        ...common,
        title: 'QA 记录卡｜替换为测试主题',
        domain: '工具',
        type: '清单卡',
        tags: ['QA', '测试记录', '验收', '待替换'],
        summary: '记录一次功能 QA 的范围、步骤、结果、缺陷和未验证项。',
        content:
          '## QA 范围\n\n说明本次测试覆盖哪些页面、功能和数据。\n\n## 测试环境\n\n- 路由：\n- 浏览器：\n- 数据源：\n- 测试文件：\n\n## PASS\n\n- [ ] 通过项 1。\n- [ ] 通过项 2。\n\n## FAIL\n\n### Finding ID: KC-QA-001\n\n- Route:\n- Steps:\n- Expected:\n- Actual:\n- Severity: low / medium / high / blocker\n- Impact:\n- Fix:\n- Status: open / fixed / wontfix\n\n## NOT RUN\n\n- 未执行项及原因。\n\n## 结论\n\n说明本次是否可以验收，以及剩余风险。',
        copyLabel: '复制 QA 记录模板',
        copyText:
          'Finding ID:\nRoute:\nSteps:\nExpected:\nActual:\nSeverity:\nImpact:\nFix:\nStatus:',
        validity: '需定期复核',
        importance: 4,
      };
    case 'decision':
      return {
        ...common,
        title: '决策卡｜替换为决策主题',
        domain: '工具',
        type: '决策卡',
        tags: ['决策', '取舍', '项目记录', '待替换'],
        summary: '记录一个项目决策的背景、选项、结论、理由和后续影响。',
        content:
          '## 背景\n\n说明为什么需要做这个决策。\n\n## 目标\n\n- 目标 1。\n- 目标 2。\n\n## 可选方案\n\n### 方案 A\n\n- 优点：\n- 缺点：\n- 风险：\n\n### 方案 B\n\n- 优点：\n- 缺点：\n- 风险：\n\n## 最终决策\n\n写清楚选择哪个方案。\n\n## 决策理由\n\n1. 理由一。\n2. 理由二。\n3. 理由三。\n\n## 不做什么\n\n明确排除项，防止后续范围膨胀。\n\n## 后续影响\n\n说明需要更新的代码、文档、QA 或使用习惯。',
        copyLabel: '复制决策记录模板',
        copyText:
          '背景：\n目标：\n可选方案：\n最终决策：\n决策理由：\n不做什么：\n后续影响：',
        validity: '长期有效',
        importance: 5,
      };
    case 'general':
    default:
      return {
        ...common,
        title: '示例卡片标题',
        domain: '通用',
        type: '知识卡',
        tags: ['示例', '待替换'],
        summary: '用一句话说明这张卡片解决什么问题。',
        content:
          '## 核心内容\n\n- 要点一\n- 要点二\n\n## 使用方法\n\n把这里替换成结构化正文。\n\n## 注意事项\n\n记录限制、风险或需要复核的地方。',
        copyLabel: '复制核心内容',
        copyText: '这里放最值得一键复制复用的文本。',
        validity: '长期有效',
        importance: 3,
      };
  }
}

export function createGptImportJsonTemplate(kind: GptImportTemplateKind = 'general') {
  const now = new Date().toISOString();

  return JSON.stringify(
    {
      app: 'KnowledgeCard',
      version: SUPPORTED_BACKUP_VERSION,
      exportedAt: now,
      cards: [createTemplateCard(kind, now)],
      collections: [],
      directories: [],
    },
    null,
    2,
  );
}

function getTemplatePromptInstruction(kind: GptImportTemplateKind) {
  const instructions: Record<GptImportTemplateKind, string> = {
    general:
      '本次请生成「通用知识卡」。适合普通资料、概念解释、网页摘录、经验总结。type 优先使用「知识卡」，domain 根据材料选择；不确定就用「通用」。content 要有清晰小标题，copyText 放最值得复用的一段核心内容。',
    'learning-flow':
      '本次请生成「学习流程卡」。适合德语学习、听力训练、复习 SOP、练习流程。domain 必须优先用「德语」，type 优先用「方案卡」。content 至少包含：适用场景、材料要求、训练步骤、验收标准、常见错误。copyText 放可直接执行的训练流程。',
    prompt:
      '本次请生成「提示词卡」。type 必须优先用「提示词卡」，domain 优先用「工具」。content 至少包含：使用目的、使用场景、提示词正文、输出要求、禁止项、使用注意。copyText 必须放完整可复制提示词，不要只放摘要。',
    'qa-record':
      '本次请生成「QA 记录卡」。适合记录测试过程、PASS/FAIL/NOT RUN、bug finding 和验收结论。type 优先用「清单卡」，domain 优先用「工具」。content 至少包含：QA 范围、测试环境、PASS、FAIL、NOT RUN、结论。FAIL 项必须使用 Finding ID / Route / Steps / Expected / Actual / Severity / Impact / Fix / Status 结构。',
    decision:
      '本次请生成「决策卡」。适合记录项目决策、取舍、边界、风险和后续影响。type 必须优先用「决策卡」，domain 可根据主题选择；项目工具类优先用「工具」。content 至少包含：背景、目标、可选方案、最终决策、决策理由、不做什么、后续影响。copyText 放可复用的决策摘要或决策记录模板。',
  };

  return instructions[kind];
}

export function createGptImportPromptForTemplate(kind: GptImportTemplateKind = 'general') {
  const option = GPT_IMPORT_TEMPLATE_OPTIONS.find((item) => item.kind === kind);
  const templateJson = createGptImportJsonTemplate(kind);

  return `${GPT_CARD_IMPORT_PROMPT}

# 本次卡片类型要求

${getTemplatePromptInstruction(kind)}

# 参考 JSON 骨架

下面是 ${option?.label ?? 'KnowledgeCard'} 的可导入 JSON 骨架。请根据我提供的材料替换示例内容，保持 JSON 结构合法：

${templateJson}`;
}

export const GPT_IMPORT_SCHEMA_TIPS = [
  '只接受完整 KnowledgeCard v1 JSON：app=KnowledgeCard，version=1，cards 为数组。',
  'domain / type / validity 必须使用页面列出的固定枚举，不能自造分类。',
  'createdAt / updatedAt / exportedAt 必须是合法 ISO 时间字符串。',
  '导入按 ID + updatedAt 合并；同 ID 卡片只有远端 updatedAt 更新时才会覆盖本地。',
  'copyText 放最值得复用的一段文本，适合提示词、清单、模板、训练流程。',
];
