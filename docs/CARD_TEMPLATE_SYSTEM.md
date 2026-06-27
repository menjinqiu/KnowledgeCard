# KnowledgeCard Card Template System

This document defines the card-quality and template rules for long-term KnowledgeCard use.

The goal is not to make cards longer. The goal is to make every imported or AI-generated card easy to search, easy to reuse, easy to place, and safe to print later.

## 1. Core Principle

Every card should answer four questions clearly:

```text
What is this?
When should I use it?
Where should it live?
What exact content can I reuse?
```

A card that cannot answer these four questions will become hard to find later.

## 2. Required Card Quality Rules

### Title

A title must be specific enough to identify the card without opening it.

Good:

```text
新会话接管本地项目提示词
股票短线交易前风险检查清单
德语 A1 地点介词 in/auf 练习卡
```

Bad:

```text
提示词
学习资料
复盘
很重要的内容
```

### Summary

The summary must state the use case, not repeat the title.

Good:

```text
用于新会话开始时，让 AI 先读取项目 canonical 文档，再接管当前任务，避免凭聊天记忆继续开发。
```

Bad:

```text
这是一个新会话接管提示词。
```

### Content

Content is the readable explanation and context. It should be useful even when `copyText` is not copied.

Recommended structure:

```text
## 使用场景
## 核心内容
## 使用步骤
## 注意事项
## 适合放入的专题集
```

### copyLabel

Use a short label. Do not repeat long button text.

Recommended labels:

```text
提示词
模板
清单
练习
复盘框架
决策框架
```

### copyText

`copyText` is the exact reusable payload. It should be ready to copy and paste.

Rules:

- Put only the reusable payload in `copyText`.
- Preserve line breaks and indentation.
- Do not include commentary such as “下面是提示词”.
- For prompt cards, `copyText` should be a complete prompt.
- For checklist cards, `copyText` should be an actionable checklist.
- For template cards, `copyText` should be a fillable template.

### Tags

Tags are horizontal attributes, not folders.

Good tags:

```text
AI协作
提示词
项目接管
高频使用
可打印
德语A1
投资复盘
风险检查
```

Avoid tags that duplicate the whole title.

### Primary Directory

Each card should have exactly one main home location.

Directory answers:

```text
Where should I normally go to find this card?
```

Collections answer:

```text
What manual, task package, or reusable bundle should include this card?
```

Tags answer:

```text
What horizontal attributes does this card have?
```

## 3. Card Type Templates

## 3.1 Prompt Card Template

Use for reusable AI prompts.

Recommended metadata:

```text
type: 提示词卡
copyLabel: 提示词
importance: 4 or 5
printable: true if it belongs in a manual
```

Recommended content:

```markdown
## 使用场景
说明什么时候使用这个提示词。

## 解决的问题
说明它避免什么错误，或提高什么质量。

## 使用方法
1. 什么时候复制
2. 复制到哪里
3. 使用前要替换哪些占位符

## 提示词正文
见下方复制块。

## 注意事项
说明不要用于哪些场景。
```

`copyText` should be the complete prompt.

## 3.2 Checklist Card Template

Use for repeatable checks before action.

Recommended metadata:

```text
type: 清单卡
copyLabel: 清单
importance: 4 or 5
printable: true
```

Recommended content:

```markdown
## 使用场景
说明执行什么任务前/中/后使用。

## 检查目标
说明这个清单要防止什么问题。

## 检查清单
- [ ] 项目 1
- [ ] 项目 2
- [ ] 项目 3

## 通过标准
说明全部通过后可以做什么。

## 失败处理
说明如果有项目不通过要怎么处理。
```

`copyText` should be a clean checklist.

## 3.3 Decision Card Template

Use for tradeoffs and choice frameworks.

Recommended metadata:

```text
type: 决策卡
copyLabel: 决策框架
importance: 4 or 5
printable: true if useful in a manual
```

Recommended content:

```markdown
## 决策问题
要做什么选择？

## 背景
为什么现在要做这个决策？

## 选项
### 选项 A
优点 / 缺点 / 成本 / 风险

### 选项 B
优点 / 缺点 / 成本 / 风险

## 判断标准
- 标准 1
- 标准 2
- 标准 3

## 推荐结论
给出当前推荐和原因。

## 触发重新评估的条件
什么时候需要重看这个决策？
```

`copyText` should be a reusable decision worksheet if the card is meant for repeated use.

## 3.4 Learning Card Template

Use for learning material, especially German study.

Recommended metadata:

```text
type: 练习卡 or 知识卡
copyLabel: 练习
importance: 3 to 5
printable: depends on manual use
```

Recommended content:

```markdown
## 学习目标
学完后应该能做什么？

## 核心知识
说明规则、例句、常见误区。

## 练习
给出题目或训练方式。

## 答案 / 纠错标准
说明如何判断对错。

## 复习方式
说明如何复习和什么时候复习。
```

`copyText` can be a practice prompt or exercise block.

## 3.5 Project Handoff Card Template

Use for long-running local projects and AI-assisted development.

Recommended metadata:

```text
type: 提示词卡 or 模板卡
copyLabel: 项目交接模板
importance: 5
printable: true
```

Recommended content:

```markdown
## 使用场景
项目切换会话、交接、重启任务时使用。

## 必读资料
列出 canonical docs 和重要文件。

## 当前状态
记录已完成、待确认、风险。

## 下一步任务
列出明确顺序。

## 禁止事项
列出不能做的事。

## 交接提示词
见复制块。
```

`copyText` should be a complete handoff prompt.

## 3.6 Investment Review Card Template

Use for trading and investment review. This is not financial advice; it is a decision hygiene template.

Recommended metadata:

```text
type: 决策卡 or 清单卡
copyLabel: 复盘框架
importance: 5
printable: false or true depending on use
```

Recommended content:

```markdown
## 标的 / 交易背景
写清楚标的、仓位、时间、初始逻辑。

## 当前变化
价格、消息、财报、行业、技术面、风险事件。

## 原始逻辑是否仍成立
逐条检查。

## 风险控制
最大亏损、补仓条件、止损条件、仓位上限。

## 可选动作
继续持有 / 减仓 / 加仓 / 止损 / 观望。

## 复盘结论
记录下次如何改进。
```

`copyText` should be a repeatable review worksheet.

## 4. Importable Template Cards

The importable template cards are stored at:

```text
docs/imports/knowledgecard-card-templates.json
```

They can be imported through:

```text
#/data
```

After import, they should appear as normal KnowledgeCard cards and can be placed into:

```text
AI 协作 / 提示词库
本地工具 / KnowledgeCard
```

## 5. Do Not Overbuild Yet

Do not build a complex template engine yet.

For now, the correct workflow is:

```text
Import template cards → open template card → copy copyText → ask AI to generate cards → import generated JSON
```

A template engine can be considered later only if real use proves copying template prompts is too slow.
