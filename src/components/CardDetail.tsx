import type { ReactNode } from 'react';
import type { KnowledgeCard } from '../types/card';
import { MarkdownLite } from './MarkdownLite';

export type CardDetailPrintOptions = {
  showSummary: boolean;
  showTags: boolean;
  showSource: boolean;
  showCopyText: boolean;
};

type CardDetailProps = {
  card: KnowledgeCard;
  collectionPanel?: ReactNode;
  copyPayloadLabel?: string;
  onCopyPayload?: () => void;
  printOptions?: CardDetailPrintOptions;
};

const defaultPrintOptions: CardDetailPrintOptions = {
  showSummary: true,
  showTags: true,
  showSource: true,
  showCopyText: true,
};

function getValidityClass(validity: KnowledgeCard['validity']) {
  if (validity === '高时效') return 'warning';
  if (validity === '已过期') return 'danger';
  if (validity === '长期有效') return 'stable';
  return 'review';
}

export function CardDetail({
  card,
  collectionPanel,
  copyPayloadLabel = '复制重点内容',
  onCopyPayload,
  printOptions = defaultPrintOptions,
}: CardDetailProps) {
  return (
    <article className="detail-card printable-card print-area">
      <header className="detail-header detail-hero">
        <div className="detail-title-block">
          <div className="card-list-kicker detail-kicker">
            <span className="metadata-pill domain-pill">{card.domain}</span>
            <span className="metadata-pill type-pill">{card.type}</span>
            <span className={`metadata-pill validity-pill ${getValidityClass(card.validity)}`}>
              {card.validity}
            </span>
            <span className="metadata-pill">重要度 {card.importance}</span>
          </div>
          <h1>{card.title}</h1>
          <div className="detail-badges detail-state-row">
            {card.favorite ? <span className="status-pill">收藏</span> : null}
            {card.archived ? <span className="status-pill muted">已归档</span> : null}
            {card.printable ? <span className="status-pill">可打印</span> : null}
          </div>
        </div>
      </header>

      <div className="detail-layout">
        <main className="detail-reading-column">
          {printOptions.showTags && card.tags.length > 0 ? (
            <div className="tag-row detail-tags">
              {card.tags.map((tag) => (
                <span className="tag-chip" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {printOptions.showSummary && card.summary ? (
            <section className="detail-section detail-summary-section">
              <p className="section-label">摘要</p>
              <p>{card.summary}</p>
            </section>
          ) : null}

          <section className="detail-section detail-body-section">
            <div className="detail-section-headline">
              <p className="section-label">正文</p>
              <span>纯文本安全阅读</span>
            </div>
            <MarkdownLite content={card.content} />
            {card.copyText?.trim() ? (
              <div className="inline-copy-block no-print">
                <div className="inline-copy-head">
                  <span className="inline-copy-title">{copyPayloadLabel.replace(/^复制/, '') || '重点内容'}</span>
                  <button className="inline-copy-button" type="button" onClick={onCopyPayload}>
                    <span aria-hidden="true">⧉</span>
                    复制
                  </button>
                </div>
                <pre>{card.copyText}</pre>
              </div>
            ) : null}
          </section>

          {printOptions.showCopyText && card.copyText?.trim() ? (
            <section className="detail-section detail-print-copy-section print-only">
              <p className="section-label">{copyPayloadLabel.replace(/^复制/, '') || '可复制内容'}</p>
              <pre>{card.copyText}</pre>
            </section>
          ) : null}
        </main>

        <aside className="detail-meta-panel no-print">
          <h2>卡片信息</h2>
          <dl className="meta-definition-list">
            <div>
              <dt>领域</dt>
              <dd>{card.domain}</dd>
            </div>
            <div>
              <dt>类型</dt>
              <dd>{card.type}</dd>
            </div>
            <div>
              <dt>时效</dt>
              <dd>{card.validity}</dd>
            </div>
            <div>
              <dt>重要度</dt>
              <dd>{card.importance}</dd>
            </div>
            <div>
              <dt>收藏</dt>
              <dd>{card.favorite ? '是' : '否'}</dd>
            </div>
            <div>
              <dt>可打印</dt>
              <dd>{card.printable ? '是' : '否'}</dd>
            </div>
            <div>
              <dt>归档</dt>
              <dd>{card.archived ? '是' : '否'}</dd>
            </div>
          </dl>
          {collectionPanel ? <div className="detail-side-section">{collectionPanel}</div> : null}
        </aside>
      </div>

      <footer className="detail-footer">
        {printOptions.showSource && card.source ? (
          <p>
            来源：
            {card.sourceUrl ? (
              <a href={card.sourceUrl} target="_blank" rel="noreferrer">
                {card.source}
              </a>
            ) : (
              card.source
            )}
          </p>
        ) : null}
        <p>创建时间：{new Date(card.createdAt).toLocaleString()}</p>
        <p>更新时间：{new Date(card.updatedAt).toLocaleString()}</p>
      </footer>
    </article>
  );
}
