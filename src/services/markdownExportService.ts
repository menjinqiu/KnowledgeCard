import type { KnowledgeCard } from '../types/card';
import {
  downloadBlob,
  formatFileTimestamp,
  safeFilenamePart,
} from './fileExportService';

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  return downloadBlob(blob, filename);
}

function formatCopyPayloadSection(card: KnowledgeCard) {
  if (!card.copyText?.trim()) return '';

  return `
## 一键复制内容

${card.copyText}
`;
}

export function cardToMarkdown(card: KnowledgeCard) {
  return `# ${card.title}

- 领域：${card.domain}
- 类型：${card.type}
- 标签：${card.tags.join('、')}
- 时效：${card.validity}
- 重要程度：${card.importance}
- 来源：${card.source ?? ''}
- 更新时间：${card.updatedAt}

## 摘要

${card.summary ?? ''}

## 正文

${card.content}
${formatCopyPayloadSection(card)}`;
}

export function exportCardToMarkdownFile(card: KnowledgeCard) {
  const title = safeFilenamePart(card.title, 'knowledgecard-card', 72);
  return downloadText(
    cardToMarkdown(card),
    `${title}-${formatFileTimestamp()}.md`,
  );
}
