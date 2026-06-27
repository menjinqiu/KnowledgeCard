import type { KnowledgeCard } from '../types/card';
import { CardListItem } from './CardListItem';

type CardListProps = {
  cards: KnowledgeCard[];
  onOpen: (id: string) => void;
  onToggleFavorite: (card: KnowledgeCard) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string, checked: boolean) => void;
  emptyText?: string;
};

export function CardList({
  cards,
  onOpen,
  onToggleFavorite,
  selectable = false,
  selectedIds = new Set(),
  onSelect,
  emptyText = '没有匹配的卡片',
}: CardListProps) {
  if (cards.length === 0) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <div className="card-list">
      {cards.map((card) => (
        <CardListItem
          key={card.id}
          card={card}
          onOpen={onOpen}
          onToggleFavorite={onToggleFavorite}
          selectable={selectable}
          selected={selectedIds.has(card.id)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
