import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react';
import {
  createCollection,
  deleteCollection,
  getAllCollections,
  isQuickAccessCollection,
  moveCardInCollection,
  removeCardFromCollection,
} from '../services/collectionService';
import { getAllCards, setFavorite } from '../services/cardService';
import type { CardCollection, KnowledgeCard } from '../types/card';

type CollectionsPageProps = {
  initialCollectionId?: string;
  onNavigate: (path: string) => void;
};

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('button, a, input, textarea, select, label'));
}

export function CollectionsPage({ initialCollectionId, onNavigate }: CollectionsPageProps) {
  const [collections, setCollections] = useState<CardCollection[]>([]);
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedCollection = useMemo(
    () => collections.find((collection) => collection.id === selectedId) ?? collections[0],
    [collections, selectedId],
  );

  const collectionCards = useMemo(() => {
    if (!selectedCollection) return [];
    const byId = new Map(cards.map((card) => [card.id, card]));
    return selectedCollection.cardIds
      .map((cardId) => byId.get(cardId))
      .filter((card): card is KnowledgeCard => Boolean(card));
  }, [cards, selectedCollection]);

  const reload = async () => {
    const [nextCollections, nextCards] = await Promise.all([getAllCollections(), getAllCards()]);
    setCollections(nextCollections);
    setCards(nextCards);
    setSelectedId((current) => {
      if (initialCollectionId && nextCollections.some((collection) => collection.id === initialCollectionId)) {
        return initialCollectionId;
      }
      return current || nextCollections[0]?.id || '';
    });
  };

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : '专题集读取失败'));
  }, [initialCollectionId]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');

    try {
      const created = await createCollection({
        title,
        description,
        cardIds: [],
        printable: true,
      });
      setTitle('');
      setDescription('');
      setIsCreateOpen(false);
      setSelectedId(created.id);
      setNotice(`已创建专题集：${created.title}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '专题集创建失败');
    }
  };

  const handleDelete = async (collection: CardCollection) => {
    if (isQuickAccessCollection(collection)) {
      setNotice('当前常用是系统入口，不能删除；可以移除其中的卡片。');
      return;
    }

    if (!confirm(`确认删除专题集「${collection.title}」？不会删除其中的卡片。`)) return;

    try {
      await deleteCollection(collection.id);
      setSelectedId('');
      setNotice(`已删除专题集：${collection.title}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '专题集删除失败');
    }
  };

  const handleRemoveCard = async (cardId: string) => {
    if (!selectedCollection) return;
    setError('');
    setNotice('');

    try {
      await removeCardFromCollection(selectedCollection.id, cardId);
      setNotice('已从专题集中移除卡片。');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '移除卡片失败');
    }
  };

  const handleMoveCard = async (cardId: string, direction: 'up' | 'down') => {
    if (!selectedCollection) return;
    setError('');
    setNotice('');

    try {
      await moveCardInCollection(selectedCollection.id, cardId, direction);
      setNotice('专题集顺序已更新。');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '调整卡片顺序失败');
    }
  };

  const openCard = (cardId: string) => {
    onNavigate(`/cards/${encodeURIComponent(cardId)}`);
  };

  const handleOrderItemClick = (event: MouseEvent<HTMLElement>, cardId: string) => {
    if (isInteractiveTarget(event.target)) return;
    openCard(cardId);
  };

  const handleOrderItemKeyDown = (event: KeyboardEvent<HTMLElement>, cardId: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (isInteractiveTarget(event.target)) return;
    event.preventDefault();
    openCard(cardId);
  };

  return (
    <div className="collections-page">
      <section className="page-head compact collections-head">
        <div>
          <p className="eyebrow">Collections</p>
          <h1>专题集</h1>
          <p>用专题集组织一组卡片，形成学习包、资料包、检查清单包或可打印手册。</p>
        </div>
        <div className="action-row">
          <button className="secondary-button" onClick={() => onNavigate('/library')}>
            卡片库
          </button>
          <button
            className="primary-button"
            disabled={!selectedCollection || isQuickAccessCollection(selectedCollection)}
            onClick={() => selectedCollection && onNavigate(`/print?collection=${encodeURIComponent(selectedCollection.id)}`)}
          >
            生成手册
          </button>
        </div>
      </section>

      {error ? <div className="error-strip">{error}</div> : null}
      {notice ? <div className="status-strip">{notice}</div> : null}

      <section className="collections-layout">
        <aside className="collections-sidebar panel-surface">
          <section className={isCreateOpen ? 'collection-create-box open' : 'collection-create-box'}>
            <button className="collection-create-toggle" type="button" onClick={() => setIsCreateOpen((open) => !open)}>
              <span>
                <strong>新建专题集</strong>
                <small>创建学习包 / 手册包</small>
              </span>
              <em>{isCreateOpen ? '−' : '+'}</em>
            </button>
            {isCreateOpen ? (
              <form className="collection-create-form" onSubmit={handleCreate}>
                <label className="editor-field">
                  <span>名称</span>
                  <input
                    value={title}
                    placeholder="例如：德语 A1 冲刺手册"
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>
                <label className="editor-field">
                  <span>说明</span>
                  <textarea
                    rows={3}
                    value={description}
                    placeholder="这组卡片用来解决什么问题？"
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>
                <button className="primary-button" type="submit">
                  创建专题集
                </button>
              </form>
            ) : null}
          </section>

          <div className="collection-list">
            <div className="collection-list-head">
              <h2>全部专题集</h2>
              <span className="metadata-pill">{collections.length}</span>
            </div>
            {collections.length === 0 ? (
              <div className="empty-state compact-empty">还没有专题集。先创建一个，再从卡片详情页加入卡片。</div>
            ) : (
              collections.map((collection) => (
                <button
                  key={collection.id}
                  className={collection.id === selectedCollection?.id ? 'collection-list-item active' : 'collection-list-item'}
                  onClick={() => setSelectedId(collection.id)}
                >
                  <strong>
                    {collection.title}
                    {isQuickAccessCollection(collection) ? <em>Quick</em> : null}
                  </strong>
                  <span>{collection.cardIds.length} 张卡片</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="collection-detail-panel panel-surface">
          {selectedCollection ? (
            <>
              <header className="collection-detail-head">
                <div>
                  <p className="section-label">Collection</p>
                  <h2>
                    {selectedCollection.title}
                    {isQuickAccessCollection(selectedCollection) ? <span className="metadata-pill">系统入口</span> : null}
                  </h2>
                  {selectedCollection.description ? <p>{selectedCollection.description}</p> : <p>暂无说明。</p>}
                </div>
                {!isQuickAccessCollection(selectedCollection) ? (
                  <div className="collection-detail-actions">
                    <button
                      className="secondary-button"
                      onClick={() => onNavigate(`/print?collection=${encodeURIComponent(selectedCollection.id)}`)}
                    >
                      生成手册
                    </button>
                    <button className="danger-button" onClick={() => handleDelete(selectedCollection)}>
                      删除专题集
                    </button>
                  </div>
                ) : null}
              </header>

              <div className="collection-stat-grid">
                <div className="manual-stat-card">
                  <span>卡片</span>
                  <strong>{collectionCards.length}</strong>
                  <small>实际存在</small>
                </div>
                <div className="manual-stat-card">
                  <span>可打印</span>
                  <strong>{collectionCards.filter((card) => card.printable).length}</strong>
                  <small>可进入手册</small>
                </div>
                <div className="manual-stat-card">
                  <span>高价值</span>
                  <strong>{collectionCards.filter((card) => card.importance >= 5).length}</strong>
                  <small>重要度 5</small>
                </div>
              </div>

              {collectionCards.length === 0 ? (
                <div className="empty-state">这个专题集还没有卡片。打开任意卡片详情页，把卡片加入专题集。</div>
              ) : (
                <div className="collection-order-panel">
                  <div className="collection-order-head">
                    <div>
                      <p className="section-label">Manual Order</p>
                      <h3>手册顺序编排</h3>
                      <p>这里的上下顺序会写入专题集，并被打印中心按专题集顺序继承。</p>
                    </div>
                    <span className="metadata-pill">{collectionCards.length} 张</span>
                  </div>

                  <ol className="collection-order-list">
                    {collectionCards.map((card, index) => (
                      <li
                        className="collection-order-item"
                        key={card.id}
                        role="button"
                        tabIndex={0}
                        onClick={(event) => handleOrderItemClick(event, card.id)}
                        onKeyDown={(event) => handleOrderItemKeyDown(event, card.id)}
                      >
                        <div className="collection-order-rank">{String(index + 1).padStart(2, '0')}</div>
                        <div className="collection-order-main">
                          <button
                            className="link-title collection-order-title"
                            onClick={() => onNavigate(`/cards/${encodeURIComponent(card.id)}`)}
                          >
                            {card.title}
                          </button>
                          <p>{card.summary || '暂无摘要。'}</p>
                          <div className="metadata-line">
                            <span>{card.domain}</span>
                            <span>{card.type}</span>
                            <span>重要度 {card.importance}</span>
                            <span>{card.printable ? '可打印' : '不打印'}</span>
                          </div>
                        </div>
                        <div className="collection-order-actions">
                          <button
                            className="secondary-button"
                            disabled={index === 0}
                            onClick={() => handleMoveCard(card.id, 'up')}
                          >
                            上移
                          </button>
                          <button
                            className="secondary-button"
                            disabled={index === collectionCards.length - 1}
                            onClick={() => handleMoveCard(card.id, 'down')}
                          >
                            下移
                          </button>
                          <button
                            className="icon-button"
                            aria-label={card.favorite ? '取消收藏' : '收藏'}
                            onClick={async () => {
                              await setFavorite(card.id, !card.favorite);
                              await reload();
                            }}
                          >
                            {card.favorite ? '★' : '☆'}
                          </button>
                          <button className="danger-button" onClick={() => handleRemoveCard(card.id)}>
                            移除
                          </button>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">创建专题集后，这里会显示专题集详情。</div>
          )}
        </main>
      </section>
    </div>
  );
}
