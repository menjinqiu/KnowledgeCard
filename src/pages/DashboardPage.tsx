import { useEffect, useMemo, useState } from 'react';
import { getAllCards } from '../services/cardService';
import { CARD_DOMAINS } from '../types/card';
import type { KnowledgeCard } from '../types/card';

type DashboardPageProps = {
  onNavigate: (path: string) => void;
};

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [cards, setCards] = useState<KnowledgeCard[]>([]);

  useEffect(() => {
    getAllCards().then(setCards).catch(console.error);
  }, []);

  const stats = useMemo(() => {
    const activeCards = cards.filter((card) => !card.archived);
    const favoriteCards = activeCards.filter((card) => card.favorite);
    const recent = [...activeCards]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5);
    const importantCards = activeCards
      .filter((card) => card.importance >= 4)
      .sort((a, b) => b.importance - a.importance);
    const reviewCards = activeCards.filter(
      (card) => card.validity === '需定期复核' || card.validity === '高时效',
    );

    const domainCounts = CARD_DOMAINS.map((domain) => ({
      domain,
      count: activeCards.filter((card) => card.domain === domain).length,
    }));

    return {
      total: activeCards.length,
      favoriteTotal: favoriteCards.length,
      favorites: favoriteCards.slice(0, 5),
      recent,
      importantTotal: importantCards.length,
      important: importantCards.slice(0, 5),
      reviewTotal: reviewCards.length,
      needsReview: reviewCards.slice(0, 5),
      domainCounts,
    };
  }, [cards]);

  return (
    <div className="dashboard-page">
      <section className="page-head">
        <div>
          <p className="eyebrow">个人高价值内容卡片库</p>
          <h1>KnowledgeCard</h1>
        </div>
        <div className="action-row">
          <button className="primary-button" onClick={() => onNavigate('/new')}>
            新建卡片
          </button>
          <button className="secondary-button" onClick={() => onNavigate('/library')}>
            进入卡片库
          </button>
          <button className="secondary-button" onClick={() => onNavigate('/print')}>
            打印中心
          </button>
        </div>
      </section>

      <section className="metric-grid">
        <div className="metric">
          <span>未归档卡片</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric">
          <span>收藏</span>
          <strong>{stats.favoriteTotal}</strong>
        </div>
        <div className="metric">
          <span>高重要度</span>
          <strong>{stats.importantTotal}</strong>
        </div>
        <div className="metric">
          <span>待复核/高时效</span>
          <strong>{stats.reviewTotal}</strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <Panel title="收藏卡片" cards={stats.favorites} onNavigate={onNavigate} />
        <Panel title="最近更新" cards={stats.recent} onNavigate={onNavigate} />
        <Panel title="高重要度卡片" cards={stats.important} onNavigate={onNavigate} />
        <Panel title="需定期复核 / 高时效" cards={stats.needsReview} onNavigate={onNavigate} />

        <section className="dashboard-panel">
          <h2>各领域卡片数量</h2>
          <div className="domain-counts">
            {stats.domainCounts.map((item) => (
              <button
                key={item.domain}
                className="domain-count-row"
                onClick={() => onNavigate(`/library?domain=${encodeURIComponent(item.domain)}`)}
              >
                <span>{item.domain}</span>
                <strong>{item.count}</strong>
              </button>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function Panel({
  title,
  cards,
  onNavigate,
}: {
  title: string;
  cards: KnowledgeCard[];
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="dashboard-panel">
      <h2>{title}</h2>
      {cards.length === 0 ? (
        <p className="muted-text">暂无卡片</p>
      ) : (
        <div className="compact-list">
          {cards.map((card) => (
            <button key={card.id} onClick={() => onNavigate(`/cards/${encodeURIComponent(card.id)}`)}>
              <span>{card.title}</span>
              <small>
                {card.domain} · {card.type} · {card.importance}
              </small>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
