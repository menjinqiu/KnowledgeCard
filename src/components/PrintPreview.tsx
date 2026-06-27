import type { KnowledgeCard } from '../types/card';
import { MarkdownLite } from './MarkdownLite';

export type ManualGroupingMode = 'domain' | 'type' | 'none';
export type ManualLayoutMode = 'page-per-card' | 'compact';

export type ManualPrintSettings = {
  groupingMode: ManualGroupingMode;
  layoutMode: ManualLayoutMode;
  showCover: boolean;
  showToc: boolean;
  showSummary: boolean;
  showTags: boolean;
  showSource: boolean;
  showCopyText: boolean;
};

type PrintPreviewProps = {
  cards: KnowledgeCard[];
  settings: ManualPrintSettings;
};

type ManualSection = {
  key: string;
  title: string;
  cards: KnowledgeCard[];
};

function getGroupingLabel(groupingMode: ManualGroupingMode) {
  if (groupingMode === 'domain') return '按领域分组';
  if (groupingMode === 'type') return '按类型分组';
  return '不分组，保留当前顺序';
}

function getLayoutLabel(layoutMode: ManualLayoutMode) {
  if (layoutMode === 'compact') return '紧凑连续排版';
  return '每卡一页';
}

function getSectionValue(card: KnowledgeCard, groupingMode: ManualGroupingMode) {
  if (groupingMode === 'domain') return card.domain;
  if (groupingMode === 'type') return card.type;
  return '全部卡片';
}

export function groupCardsForManual(
  cards: KnowledgeCard[],
  groupingMode: ManualGroupingMode,
): ManualSection[] {
  if (groupingMode === 'none') {
    return [
      {
        key: 'all-cards',
        title: '全部卡片',
        cards,
      },
    ];
  }

  const groups = new Map<string, KnowledgeCard[]>();

  cards.forEach((card) => {
    const groupKey = getSectionValue(card, groupingMode);
    const current = groups.get(groupKey) ?? [];
    current.push(card);
    groups.set(groupKey, current);
  });

  return Array.from(groups.entries()).map(([title, sectionCards]) => ({
    key: title,
    title,
    cards: sectionCards,
  }));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export function PrintPreview({ cards, settings }: PrintPreviewProps) {
  if (cards.length === 0) {
    return (
      <div className="manual-empty-state empty-state">
        <h2>尚未生成手册预览</h2>
        <p>先在左侧选择可打印卡片，再点击“生成打印预览”。预览会生成封面、目录、分组章节和卡片正文。</p>
      </div>
    );
  }

  const sections = groupCardsForManual(cards, settings.groupingMode);
  const generatedAt = new Date().toLocaleString();
  const groupingLabel = getGroupingLabel(settings.groupingMode);
  const layoutLabel = getLayoutLabel(settings.layoutMode);

  return (
    <section className={`print-preview manual-preview print-area manual-layout-${settings.layoutMode}`}>
      {settings.showCover ? (
        <section className="manual-cover manual-page printable-card">
          <div className="manual-cover-topline">
            <p className="manual-kicker">KnowledgeCard Manual</p>
            <span>Local Study Pack</span>
          </div>
          <h1>高价值内容打印手册</h1>
          <p className="manual-cover-summary">
            由 {cards.length} 张卡片组成，{groupingLabel}，{layoutLabel}，共 {sections.length}{' '}
            个章节。适合离线阅读、复盘、学习、讨论和纸质归档。
          </p>
          <div className="manual-cover-divider" aria-hidden="true" />
          <dl className="manual-cover-meta">
            <div>
              <dt>卡片数量</dt>
              <dd>{cards.length}</dd>
            </div>
            <div>
              <dt>章节数量</dt>
              <dd>{sections.length}</dd>
            </div>
            <div>
              <dt>生成时间</dt>
              <dd>{generatedAt}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {settings.showToc ? (
        <section className="manual-toc manual-page printable-card">
          <p className="manual-kicker">Contents</p>
          <h2>目录</h2>
          <ol>
            {sections.map((section, sectionIndex) => (
              <li key={section.key}>
                <span>
                  {sectionIndex + 1}. {section.title}
                </span>
                <small>{section.cards.length} 张卡片</small>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {sections.map((section, sectionIndex) => (
        <section className="manual-section" key={section.key}>
          <header className="manual-section-header printable-card">
            <p className="manual-kicker">Section {sectionIndex + 1}</p>
            <h2>{section.title}</h2>
            <p>
              本章节包含 {section.cards.length} 张可打印卡片。{settings.groupingMode === 'none' ? '已保留当前预览顺序。' : ''}
            </p>
          </header>

          {section.cards.map((card, cardIndex) => (
            <article className="print-card manual-card manual-page printable-card" key={card.id}>
              <header className="manual-card-header">
                <div>
                  <p className="manual-kicker">Card {sectionIndex + 1}.{cardIndex + 1}</p>
                  <h1>{card.title}</h1>
                </div>
                <div className="manual-card-index">{String(cardIndex + 1).padStart(2, '0')}</div>
              </header>

              <div className="manual-meta-line">
                <span>{card.domain}</span>
                <span>{card.type}</span>
                <span>{card.validity}</span>
                <span>重要度 {card.importance}</span>
                <span>更新 {formatDate(card.updatedAt)}</span>
              </div>

              {settings.showTags && card.tags.length > 0 ? (
                <div className="tag-row manual-tags">
                  {card.tags.map((tag) => (
                    <span className="tag-chip" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {settings.showSummary && card.summary ? (
                <section className="manual-summary-block">
                  <h2>摘要</h2>
                  <p>{card.summary}</p>
                </section>
              ) : null}

              <section className="manual-content-block">
                <h2>正文</h2>
                <MarkdownLite content={card.content} />
              </section>

              {settings.showCopyText && card.copyText ? (
                <section className="manual-copy-block">
                  <h2>{card.copyLabel || '可复制内容'}</h2>
                  <pre>{card.copyText}</pre>
                </section>
              ) : null}

              <footer className="manual-card-footer">
                <span>KnowledgeCard · {section.title}</span>
                {settings.showSource ? (
                  card.source ? <span>来源：{card.source}</span> : <span>来源：未记录</span>
                ) : null}
                <span>创建：{formatDate(card.createdAt)}</span>
              </footer>
            </article>
          ))}
        </section>
      ))}
    </section>
  );
}
