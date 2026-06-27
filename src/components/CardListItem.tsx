import type { KeyboardEvent, MouseEvent } from 'react';
import type { KnowledgeCard } from '../types/card';

type CardListItemProps = {
  card: KnowledgeCard;
  onOpen: (id: string) => void;
  onToggleFavorite: (card: KnowledgeCard) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
};

function getValidityClass(validity: KnowledgeCard['validity']) {
  if (validity === '高时效') return 'warning';
  if (validity === '已过期') return 'danger';
  if (validity === '长期有效') return 'stable';
  return 'review';
}

function getImportanceLabel(importance: KnowledgeCard['importance']) {
  if (importance >= 5) return '高价值';
  if (importance >= 4) return '重点';
  return '普通';
}

function getCardClassName(card: KnowledgeCard, selectable: boolean, selected: boolean) {
  const classNames = ['card-list-item', `importance-${card.importance}`];

  if (card.archived) classNames.push('archived');
  if (card.favorite) classNames.push('favorite-card');
  if (card.validity === '高时效') classNames.push('time-sensitive-card');
  if (card.validity === '已过期') classNames.push('expired-card');
  if (selectable) classNames.push('selectable-card');
  if (selected) classNames.push('selected-card');

  return classNames.join(' ');
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('button, a, input, textarea, select, label'));
}

export function CardListItem({
  card,
  onOpen,
  onToggleFavorite,
  selectable = false,
  selected = false,
  onSelect,
}: CardListItemProps) {
  const updatedDate = new Date(card.updatedAt).toLocaleDateString();
  const visibleTags = card.tags.slice(0, 5);
  const hiddenTagCount = Math.max(card.tags.length - visibleTags.length, 0);

  const runPrimaryAction = () => {
    if (selectable) {
      onSelect?.(card.id, !selected);
      return;
    }

    onOpen(card.id);
  };

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) return;
    runPrimaryAction();
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (isInteractiveTarget(event.target)) return;
    event.preventDefault();
    runPrimaryAction();
  };

  return (
    <article
      className={getCardClassName(card, selectable, selected)}
      role="button"
      tabIndex={0}
      aria-pressed={selectable ? selected : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {selectable ? (
        <label className="card-select" aria-label={`选择 ${card.title}`}>
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelect?.(card.id, event.target.checked)}
          />
        </label>
      ) : null}

      <div className="card-list-main">
        <div className="card-list-kicker">
          <span className="metadata-pill domain-pill">{card.domain}</span>
          <span className="metadata-pill type-pill">{card.type}</span>
          <span className={`metadata-pill validity-pill ${getValidityClass(card.validity)}`}>
            {card.validity}
          </span>
          {card.printable ? <span className="metadata-pill print-pill">可打印</span> : null}
          {card.archived ? <span className="metadata-pill muted">已归档</span> : null}
        </div>

        <div className="card-list-title-row">
          <button className="link-title" onClick={() => onOpen(card.id)}>
            {card.title}
          </button>
          <button
            className={card.favorite ? 'icon-button active' : 'icon-button'}
            onClick={() => onToggleFavorite(card)}
            title={card.favorite ? '取消收藏' : '收藏'}
            aria-label={card.favorite ? '取消收藏' : '收藏'}
          >
            ★
          </button>
        </div>

        {card.summary ? <p className="card-summary">{card.summary}</p> : null}

        <div className="card-meta-grid">
          <span>
            <strong>重要度</strong>
            {card.importance} · {getImportanceLabel(card.importance)}
          </span>
          <span>
            <strong>更新</strong>
            {updatedDate}
          </span>
          {card.source ? (
            <span>
              <strong>来源</strong>
              {card.source}
            </span>
          ) : null}
        </div>

        <div className="tag-row compact-tags">
          {visibleTags.map((tag) => (
            <span className="tag-chip" key={tag}>
              {tag}
            </span>
          ))}
          {hiddenTagCount > 0 ? <span className="tag-chip muted">+{hiddenTagCount}</span> : null}
        </div>
      </div>

      <div className="card-list-actions">
        <button className="secondary-button detail-button" onClick={() => onOpen(card.id)}>
          详情
        </button>
      </div>
    </article>
  );
}
