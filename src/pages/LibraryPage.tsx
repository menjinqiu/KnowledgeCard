import { useEffect, useMemo, useRef, useState } from 'react';
import { CardList } from '../components/CardList';
import { SearchBox } from '../components/SearchBox';
import { SidebarFilters } from '../components/SidebarFilters';
import {
  applyCardFilters,
  defaultFilters,
  getAllCards,
  getAllTags,
  setFavorite,
  sortCards,
  updateCardsFlags,
  type BatchCardFlagPatch,
  type CardFilters,
} from '../services/cardService';
import {
  addCardsToCollection,
  createCollection,
  getAllCollections,
} from '../services/collectionService';
import {
  buildDirectoryTree,
  flattenDirectoryTree,
  formatDirectoryPath,
  getAllDirectories,
  setCardsPrimaryDirectory,
} from '../services/directoryService';
import type { CardCollection, DirectoryNode, KnowledgeCard } from '../types/card';

type LibraryPageProps = {
  initialDomain?: string;
  initialQuery?: string;
  focusSearch?: boolean;
  onNavigate: (path: string) => void;
};

type Notice = {
  type: 'success' | 'error';
  message: string;
};

type CollectionCreateScope = 'selected' | 'visible';

export function LibraryPage({
  initialDomain = '',
  initialQuery = '',
  focusSearch = false,
  onNavigate,
}: LibraryPageProps) {
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [collections, setCollections] = useState<CardCollection[]>([]);
  const [directories, setDirectories] = useState<DirectoryNode[]>([]);
  const [filters, setFilters] = useState<CardFilters>({
    ...defaultFilters,
    domain: initialDomain as CardFilters['domain'],
    query: initialQuery,
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [batchNotice, setBatchNotice] = useState<Notice | null>(null);
  const [sortMode, setSortMode] = useState('updated-desc');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetCollectionId, setTargetCollectionId] = useState('');
  const [targetDirectoryId, setTargetDirectoryId] = useState('');
  const [collectionTitle, setCollectionTitle] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionCreateScope, setCollectionCreateScope] =
    useState<CollectionCreateScope>('selected');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    const [nextCards, nextCollections, nextDirectories] = await Promise.all([
      getAllCards(),
      getAllCollections(),
      getAllDirectories(),
    ]);
    const existingCardIds = new Set(nextCards.map((card) => card.id));

    setCards(nextCards);
    setCollections(nextCollections);
    setDirectories(nextDirectories);
    setSelectedIds((current) => new Set(Array.from(current).filter((id) => existingCardIds.has(id))));
    setTargetCollectionId((current) => {
      if (current && nextCollections.some((collection) => collection.id === current)) return current;
      return nextCollections[0]?.id ?? '';
    });
    setTargetDirectoryId((current) => {
      if (current && nextDirectories.some((directory) => directory.id === current)) return current;
      return nextDirectories[0]?.id ?? '';
    });
  };

  useEffect(() => {
    reload().catch(console.error);
  }, []);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      domain: initialDomain as CardFilters['domain'],
      query: initialQuery,
    }));
  }, [initialDomain, initialQuery]);

  useEffect(() => {
    if (!focusSearch) return;
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  }, [focusSearch]);

  const tags = useMemo(() => getAllTags(cards), [cards]);
  const directoryOptions = useMemo(
    () => flattenDirectoryTree(buildDirectoryTree(directories)),
    [directories],
  );
  const visibleCards = useMemo(
    () => sortCards(applyCardFilters(cards, filters), sortMode),
    [cards, filters, sortMode],
  );
  const selectedCards = useMemo(
    () => cards.filter((card) => selectedIds.has(card.id)),
    [cards, selectedIds],
  );
  const selectedVisibleCount = useMemo(
    () => visibleCards.filter((card) => selectedIds.has(card.id)).length,
    [visibleCards, selectedIds],
  );
  const collectionSourceCards = collectionCreateScope === 'visible' ? visibleCards : selectedCards;
  const selectedCollection = useMemo(
    () => collections.find((collection) => collection.id === targetCollectionId),
    [collections, targetCollectionId],
  );

  const handleToggleFavorite = async (card: KnowledgeCard) => {
    await setFavorite(card.id, !card.favorite);
    await reload();
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedIds(new Set());
      setBatchNotice(null);
    } else {
      setBatchNotice({ type: 'success', message: '已进入批量管理：点击卡片框体即可选中。' });
    }
    setSelectionMode(!selectionMode);
  };

  const selectVisibleCards = () => {
    setSelectedIds(new Set(visibleCards.map((card) => card.id)));
    setBatchNotice({ type: 'success', message: `已选择当前结果 ${visibleCards.length} 张卡片。` });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBatchNotice({ type: 'success', message: '已清空当前选择。' });
  };

  const handleAddSelectedToCollection = async () => {
    if (!selectedCollection) {
      const nextNotice = { type: 'error' as const, message: '请先选择一个专题集。' };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
      return;
    }

    if (selectedCards.length === 0) {
      const nextNotice = { type: 'error' as const, message: '请先选择要加入专题集的卡片。' };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
      return;
    }

    try {
      const selectedCardIds = selectedCards.map((card) => card.id);
      const newCardCount = selectedCardIds.filter(
        (id) => !selectedCollection.cardIds.includes(id),
      ).length;
      await addCardsToCollection(selectedCollection.id, selectedCardIds);
      const nextNotice = {
        type: 'success' as const,
        message: `已加入专题集「${selectedCollection.title}」：处理 ${selectedCards.length} 张，新增 ${newCardCount} 张。`,
      };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
      await reload();
    } catch (error) {
      const nextNotice = {
        type: 'error' as const,
        message: error instanceof Error ? error.message : '批量加入专题集失败。',
      };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
    }
  };

  const handleSetSelectedPrimaryDirectory = async (directoryId: string | undefined) => {
    if (selectedCards.length === 0) {
      const nextNotice = { type: 'error' as const, message: '请先选择要设置主目录的卡片。' };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
      return;
    }

    try {
      const result = await setCardsPrimaryDirectory(
        selectedCards.map((card) => card.id),
        directoryId,
      );
      const directoryLabel = directoryId ? formatDirectoryPath(directories, directoryId) : '未设置主目录';
      const nextNotice = {
        type: 'success' as const,
        message: `已批量设置主目录为「${directoryLabel}」：更新 ${result.updated} 张，缺失 ${result.missing} 张。`,
      };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
      await reload();
    } catch (error) {
      const nextNotice = {
        type: 'error' as const,
        message: error instanceof Error ? error.message : '批量设置主目录失败。',
      };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
    }
  };

  const handleBatchFlagUpdate = async (patch: BatchCardFlagPatch, label: string) => {
    if (selectedCards.length === 0) {
      const nextNotice = { type: 'error' as const, message: '请先选择要批量更新的卡片。' };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
      return;
    }

    try {
      const result = await updateCardsFlags(
        selectedCards.map((card) => card.id),
        patch,
      );
      const nextNotice = {
        type: 'success' as const,
        message: `${label}：更新 ${result.updated} 张，缺失 ${result.missing} 张。`,
      };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
      await reload();
    } catch (error) {
      const nextNotice = {
        type: 'error' as const,
        message: error instanceof Error ? error.message : `${label}失败。`,
      };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
    }
  };

  const handleCreateCollectionFromCards = async () => {
    if (collectionSourceCards.length === 0) {
      const nextNotice = {
        type: 'error' as const,
        message:
          collectionCreateScope === 'visible'
            ? '当前筛选结果为空，无法创建专题集。'
            : '请先选择卡片，再创建专题集。',
      };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
      return;
    }

    try {
      const created = await createCollection({
        title: collectionTitle,
        description: collectionDescription,
        cardIds: collectionSourceCards.map((card) => card.id),
        printable: true,
      });
      setCollectionTitle('');
      setCollectionDescription('');
      setTargetCollectionId(created.id);
      const nextNotice = {
        type: 'success' as const,
        message: `已创建专题集「${created.title}」，包含 ${created.cardIds.length} 张卡片。`,
      };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
      await reload();
    } catch (error) {
      const nextNotice = {
        type: 'error' as const,
        message: error instanceof Error ? error.message : '创建专题集失败。',
      };
      setNotice(nextNotice);
      setBatchNotice(nextNotice);
    }
  };

  return (
    <div className="library-page">
      <section className="page-head compact">
        <div>
          <h1>卡片库</h1>
          <p>{visibleCards.length} / {cards.length} 张卡片</p>
        </div>
        <div className="action-row">
          <button className="primary-button" onClick={() => onNavigate('/new')}>
            新建卡片
          </button>
          <button className="secondary-button" onClick={toggleSelectionMode}>
            {selectionMode ? '退出批量' : '批量管理'}
          </button>
          <button className="secondary-button" onClick={() => onNavigate('/data')}>
            数据管理
          </button>
          <button className="secondary-button" onClick={() => onNavigate('/print')}>
            打印中心
          </button>
        </div>
      </section>

      {notice ? (
        <div className={notice.type === 'error' ? 'error-strip' : 'status-strip'}>
          {notice.message}
        </div>
      ) : null}

      <section className="toolbar no-print">
        <SearchBox
          ref={searchInputRef}
          value={filters.query}
          onChange={(query) => setFilters((current) => ({ ...current, query }))}
        />
        <label className="sort-control">
          排序
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            <option value="updated-desc">更新时间倒序</option>
            <option value="importance-desc">重要程度倒序</option>
            <option value="domain">领域</option>
            <option value="type">类型</option>
          </select>
        </label>
      </section>

      {selectionMode ? (
        <section className="library-batch-panel panel-surface no-print" aria-label="批量管理操作">
          <div className="library-batch-summary">
            <p className="section-label">Batch Manage</p>
            <h2>批量管理</h2>
            <p>
              已选 {selectedCards.length} 张，其中当前结果内 {selectedVisibleCount} 张。当前筛选结果共有{' '}
              {visibleCards.length} 张。
            </p>
            <div className="library-batch-actions">
              <button className="secondary-button" onClick={selectVisibleCards} disabled={visibleCards.length === 0}>
                选择当前结果
              </button>
              <button className="secondary-button" onClick={clearSelection} disabled={selectedCards.length === 0}>
                清空选择
              </button>
            </div>
          </div>

          {batchNotice ? (
            <div className={batchNotice.type === 'error' ? 'batch-feedback error' : 'batch-feedback success'} aria-live="polite">
              {batchNotice.message}
            </div>
          ) : null}

          <div className="library-batch-box">
            <p className="section-label">Primary directory</p>
            <label className="editor-field">
              <span>目标主目录</span>
              <select
                value={targetDirectoryId}
                onChange={(event) => setTargetDirectoryId(event.target.value)}
                disabled={directoryOptions.length === 0}
              >
                {directoryOptions.length === 0 ? <option value="">暂无目录</option> : null}
                {directoryOptions.map((directory) => (
                  <option key={directory.id} value={directory.id}>
                    {'　'.repeat(directory.depth)}{directory.depth > 0 ? '└ ' : ''}{directory.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button"
              onClick={() => handleSetSelectedPrimaryDirectory(targetDirectoryId)}
              disabled={selectedCards.length === 0 || directoryOptions.length === 0}
            >
              设置主目录
            </button>
            <button
              className="secondary-button"
              onClick={() => handleSetSelectedPrimaryDirectory(undefined)}
              disabled={selectedCards.length === 0}
            >
              清除主目录
            </button>
          </div>

          <div className="library-batch-box batch-flags-box">
            <p className="section-label">Card flags</p>
            <div className="library-batch-flag-grid">
              <button
                className="secondary-button"
                onClick={() => handleBatchFlagUpdate({ printable: true }, '已批量设为可打印')}
                disabled={selectedCards.length === 0}
              >
                设为可打印
              </button>
              <button
                className="secondary-button"
                onClick={() => handleBatchFlagUpdate({ printable: false }, '已批量取消可打印')}
                disabled={selectedCards.length === 0}
              >
                取消可打印
              </button>
              <button
                className="secondary-button"
                onClick={() => handleBatchFlagUpdate({ favorite: true }, '已批量收藏')}
                disabled={selectedCards.length === 0}
              >
                收藏
              </button>
              <button
                className="secondary-button"
                onClick={() => handleBatchFlagUpdate({ favorite: false }, '已批量取消收藏')}
                disabled={selectedCards.length === 0}
              >
                取消收藏
              </button>
              <button
                className="secondary-button"
                onClick={() => handleBatchFlagUpdate({ archived: true }, '已批量归档')}
                disabled={selectedCards.length === 0}
              >
                归档
              </button>
              <button
                className="secondary-button"
                onClick={() => handleBatchFlagUpdate({ archived: false }, '已批量取消归档')}
                disabled={selectedCards.length === 0}
              >
                取消归档
              </button>
            </div>
          </div>

          <div className="library-batch-box">
            <p className="section-label">Add to existing</p>
            <label className="editor-field">
              <span>目标专题集</span>
              <select
                value={targetCollectionId}
                onChange={(event) => setTargetCollectionId(event.target.value)}
                disabled={collections.length === 0}
              >
                {collections.length === 0 ? <option value="">暂无专题集</option> : null}
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title}（{collection.cardIds.length}）
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button"
              onClick={handleAddSelectedToCollection}
              disabled={selectedCards.length === 0 || collections.length === 0}
            >
              加入已有专题集
            </button>
          </div>

          <div className="library-batch-box">
            <p className="section-label">Create from cards</p>
            <label className="editor-field">
              <span>新专题集名称</span>
              <input
                value={collectionTitle}
                placeholder="例如：赴德求职资料包"
                onChange={(event) => setCollectionTitle(event.target.value)}
              />
            </label>
            <label className="editor-field">
              <span>来源范围</span>
              <select
                value={collectionCreateScope}
                onChange={(event) => setCollectionCreateScope(event.target.value as CollectionCreateScope)}
              >
                <option value="selected">已选卡片（{selectedCards.length}）</option>
                <option value="visible">当前筛选结果（{visibleCards.length}）</option>
              </select>
            </label>
            <label className="editor-field">
              <span>说明</span>
              <textarea
                rows={2}
                value={collectionDescription}
                placeholder="这组卡片用来解决什么问题？"
                onChange={(event) => setCollectionDescription(event.target.value)}
              />
            </label>
            <button
              className="primary-button"
              onClick={handleCreateCollectionFromCards}
              disabled={!collectionTitle.trim() || collectionSourceCards.length === 0}
            >
              创建专题集
            </button>
          </div>
        </section>
      ) : null}

      <div className="library-layout">
        <SidebarFilters filters={filters} tags={tags} onChange={setFilters} />
        <CardList
          cards={visibleCards}
          onOpen={(id) => onNavigate(`/cards/${encodeURIComponent(id)}`)}
          onToggleFavorite={handleToggleFavorite}
          selectable={selectionMode}
          selectedIds={selectedIds}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
}
