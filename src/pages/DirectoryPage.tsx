import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { getAllCards } from '../services/cardService';
import { getQuickAccessCards, QUICK_ACCESS_UPDATED_EVENT } from '../services/collectionService';
import {
  buildDirectoryTree,
  createDirectory,
  deleteDirectory,
  flattenDirectoryTree,
  formatDirectoryPath,
  getAllDirectories,
  getCardsInDirectory,
  getDirectoryPath,
  moveCardInDirectory,
  pinCardInDirectory,
  setCardPrimaryDirectory,
  unpinCardInDirectory,
  updateDirectory,
  UNCATEGORIZED_DIRECTORY_ID,
  type DirectoryTreeNode,
} from '../services/directoryService';
import type { DirectoryNode, KnowledgeCard } from '../types/card';

type DirectoryPageProps = {
  initialDirectoryId?: string;
  onNavigate: (path: string) => void;
};

type DirectoryViewMode = 'direct' | 'deep';
type PageMode = 'browse' | 'edit';

const SPACE_HOME_ID = '__space_home__';
const QUICK_ACCESS_SPACE_ID = '__quick_access_space__';

function countCardsByDirectory(cards: KnowledgeCard[]) {
  const counts = new Map<string, number>();
  cards.forEach((card) => {
    const key = card.primaryDirectoryId || UNCATEGORIZED_DIRECTORY_ID;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

function findTreeNode(nodes: DirectoryTreeNode[], id: string): DirectoryTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findTreeNode(node.children, id);
    if (found) return found;
  }
  return null;
}

function collectTreeIds(node: DirectoryTreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...node.children.flatMap((child) => collectTreeIds(child))];
}

function countCardsInTree(cards: KnowledgeCard[], node: DirectoryTreeNode | null) {
  const ids = new Set(collectTreeIds(node));
  return cards.filter((card) => card.primaryDirectoryId && ids.has(card.primaryDirectoryId)).length;
}

function getRecentCards(cards: KnowledgeCard[], limit = 6) {
  return [...cards]
    .filter((card) => !card.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

function getSpaceCards(cards: KnowledgeCard[], directoryIds: string[], mode: DirectoryViewMode) {
  const scope = new Set(directoryIds);
  return cards
    .filter((card) => card.primaryDirectoryId && scope.has(card.primaryDirectoryId))
    .sort(
      (a, b) =>
        (mode === 'direct' ? (a.directorySortOrder ?? 9999) - (b.directorySortOrder ?? 9999) : 0) ||
        b.updatedAt.localeCompare(a.updatedAt),
    );
}

function getDescendantDirectoryIds(directories: DirectoryNode[], directoryId: string) {
  const childrenByParent = new Map<string, DirectoryNode[]>();
  directories.forEach((directory) => {
    if (!directory.parentId) return;
    const current = childrenByParent.get(directory.parentId) ?? [];
    current.push(directory);
    childrenByParent.set(directory.parentId, current);
  });

  const ids = new Set<string>();
  const visit = (id: string) => {
    const children = childrenByParent.get(id) ?? [];
    children.forEach((child) => {
      if (ids.has(child.id)) return;
      ids.add(child.id);
      visit(child.id);
    });
  };

  visit(directoryId);
  return ids;
}

export function DirectoryPage({ initialDirectoryId, onNavigate }: DirectoryPageProps) {
  const [directories, setDirectories] = useState<DirectoryNode[]>([]);
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [quickAccessCards, setQuickAccessCards] = useState<KnowledgeCard[]>([]);
  const [selectedId, setSelectedId] = useState(SPACE_HOME_ID);
  const [viewMode, setViewMode] = useState<DirectoryViewMode>('direct');
  const [pageMode, setPageMode] = useState<PageMode>('browse');
  const [query, setQuery] = useState('');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditSpaceOpen, setIsEditSpaceOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editSpaceId, setEditSpaceId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editParentId, setEditParentId] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(100);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const isEditMode = pageMode === 'edit';
  const directoryTree = useMemo(() => buildDirectoryTree(directories), [directories]);
  const flatDirectories = useMemo(() => flattenDirectoryTree(directoryTree), [directoryTree]);
  const cardCounts = useMemo(() => countCardsByDirectory(cards), [cards]);
  const rootDirectories = useMemo(() => directories.filter((directory) => !directory.parentId), [directories]);
  const selectedDirectory = directories.find((directory) => directory.id === selectedId);
  const selectedTreeNode = useMemo(
    () =>
      selectedId === SPACE_HOME_ID ||
      selectedId === QUICK_ACCESS_SPACE_ID ||
      selectedId === UNCATEGORIZED_DIRECTORY_ID
        ? null
        : findTreeNode(directoryTree, selectedId),
    [directoryTree, selectedId],
  );
  const childDirectories = useMemo(
    () => directories.filter((directory) => directory.parentId === selectedDirectory?.id),
    [directories, selectedDirectory],
  );
  const directoryPath = useMemo(
    () => getDirectoryPath(directories, selectedDirectory?.id),
    [directories, selectedDirectory],
  );
  const uncategorizedCards = useMemo(
    () => getCardsInDirectory(cards, UNCATEGORIZED_DIRECTORY_ID),
    [cards],
  );
  const selectedScopeIds = useMemo(() => {
    if (
      selectedId === SPACE_HOME_ID ||
      selectedId === QUICK_ACCESS_SPACE_ID ||
      selectedId === UNCATEGORIZED_DIRECTORY_ID
    ) {
      return [];
    }
    if (viewMode === 'deep') return collectTreeIds(selectedTreeNode);
    return selectedId ? [selectedId] : [];
  }, [selectedId, selectedTreeNode, viewMode]);
  const selectedCards = useMemo(() => {
    if (selectedId === QUICK_ACCESS_SPACE_ID) return quickAccessCards;
    if (selectedId === UNCATEGORIZED_DIRECTORY_ID) return uncategorizedCards;
    return getSpaceCards(cards, selectedScopeIds, viewMode);
  }, [cards, selectedId, selectedScopeIds, quickAccessCards, uncategorizedCards, viewMode]);
  const recentCards = useMemo(() => getRecentCards(cards, 7), [cards]);
  const normalizedQuery = query.trim().toLowerCase();
  const editableParentOptions = useMemo(() => {
    if (!editSpaceId) return flatDirectories;
    const blockedIds = getDescendantDirectoryIds(directories, editSpaceId);
    blockedIds.add(editSpaceId);
    return flatDirectories.filter((directory) => !blockedIds.has(directory.id));
  }, [directories, editSpaceId, flatDirectories]);

  const quickMatches = useMemo(() => {
    if (!normalizedQuery) return [];
    const directoryMatches = flatDirectories
      .filter((directory) => {
        const haystack = `${directory.title} ${directory.description ?? ''}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 5);
    const cardMatches = cards
      .filter((card) => {
        const haystack = `${card.title} ${card.summary ?? ''} ${card.tags.join(' ')}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5);
    return [
      ...directoryMatches.map((directory) => ({
        type: 'space' as const,
        id: directory.id,
        title: directory.title,
        meta: formatDirectoryPath(directories, directory.id),
      })),
      ...cardMatches.map((card) => ({
        type: 'card' as const,
        id: card.id,
        title: card.title,
        meta: card.primaryDirectoryId ? formatDirectoryPath(directories, card.primaryDirectoryId) : '未设置主目录',
      })),
    ];
  }, [cards, directories, flatDirectories, normalizedQuery]);

  const reloadQuickAccessCards = async () => {
    const nextQuickAccessCards = await getQuickAccessCards(20);
    setQuickAccessCards(nextQuickAccessCards);
  };

  const reload = async () => {
    const [nextDirectories, nextCards, nextQuickAccessCards] = await Promise.all([
      getAllDirectories(),
      getAllCards(),
      getQuickAccessCards(20),
    ]);
    setDirectories(nextDirectories);
    setCards(nextCards);
    setQuickAccessCards(nextQuickAccessCards);
    setSelectedId((current) => {
      if (initialDirectoryId === UNCATEGORIZED_DIRECTORY_ID) return UNCATEGORIZED_DIRECTORY_ID;
      if (initialDirectoryId && nextDirectories.some((directory) => directory.id === initialDirectoryId)) {
        return initialDirectoryId;
      }
      if (current === SPACE_HOME_ID || current === QUICK_ACCESS_SPACE_ID || current === UNCATEGORIZED_DIRECTORY_ID) {
        return current;
      }
      if (current && nextDirectories.some((directory) => directory.id === current)) return current;
      return SPACE_HOME_ID;
    });
  };

  useEffect(() => {
    reload().catch((err) => setError(err instanceof Error ? err.message : '目录读取失败'));
  }, [initialDirectoryId]);

  useEffect(() => {
    const handleQuickAccessUpdated = () => {
      reloadQuickAccessCards().catch(console.error);
    };
    window.addEventListener(QUICK_ACCESS_UPDATED_EVENT, handleQuickAccessUpdated);
    return () => window.removeEventListener(QUICK_ACCESS_UPDATED_EVENT, handleQuickAccessUpdated);
  }, []);

  const closeEditPanels = () => {
    setIsInfoOpen(false);
    setIsCreateOpen(false);
    setIsEditSpaceOpen(false);
  };

  const switchMode = (nextMode: PageMode) => {
    setPageMode(nextMode);
    setNotice('');
    setError('');
    if (nextMode === 'browse') {
      closeEditPanels();
    }
  };

  const selectSpace = (directoryId: string) => {
    setSelectedId(directoryId);
    setNotice('');
    setError('');
    setQuery('');
    closeEditPanels();
  };

  const openCreateForm = (parentId?: string) => {
    if (!isEditMode) return;
    setNewParentId(parentId ?? '');
    setIsCreateOpen(true);
    setIsEditSpaceOpen(false);
  };

  const openEditSpaceForm = (directory: DirectoryNode) => {
    if (!isEditMode) return;
    setEditSpaceId(directory.id);
    setEditTitle(directory.title);
    setEditParentId(directory.parentId ?? '');
    setEditDescription(directory.description ?? '');
    setEditSortOrder(directory.sortOrder);
    setIsEditSpaceOpen(true);
    setIsCreateOpen(false);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!isEditMode) return;
    setError('');
    setNotice('');

    try {
      const created = await createDirectory({
        title: newTitle,
        parentId: newParentId || undefined,
        description: newDescription,
        sortOrder: (flatDirectories.length + 1) * 10,
      });
      setNewTitle('');
      setNewDescription('');
      setNewParentId('');
      setIsCreateOpen(false);
      setSelectedId(created.id);
      setNotice(`已创建空间：${created.title}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '目录创建失败');
    }
  };

  const handleUpdateSpace = async (event: FormEvent) => {
    event.preventDefault();
    if (!isEditMode || !editSpaceId) return;
    setError('');
    setNotice('');

    try {
      const updated = await updateDirectory(editSpaceId, {
        title: editTitle,
        parentId: editParentId || undefined,
        description: editDescription,
        sortOrder: editSortOrder,
      });
      setIsEditSpaceOpen(false);
      setNotice(`已更新空间：${updated.title}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '空间信息更新失败');
    }
  };

  const handleDeleteSelected = async () => {
    if (!isEditMode || !selectedDirectory) return;
    if (!confirm(`确认删除空间「${selectedDirectory.title}」？只有空空间才能删除。`)) return;

    try {
      await deleteDirectory(selectedDirectory.id);
      setSelectedId(SPACE_HOME_ID);
      setNotice(`已删除空间：${selectedDirectory.title}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '目录删除失败');
    }
  };

  const handleAssignCard = async (cardId: string, directoryId: string | undefined) => {
    if (!isEditMode) return;
    setError('');
    setNotice('');

    try {
      const updated = await setCardPrimaryDirectory(cardId, directoryId);
      setNotice(directoryId ? `已归入当前空间：${updated.title}` : `已移出主目录：${updated.title}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '设置主目录失败');
    }
  };

  const handlePinCard = async (card: KnowledgeCard) => {
    if (!isEditMode) return;
    setError('');
    setNotice('');

    try {
      const isPinned = (card.directorySortOrder ?? 9999) < 0;
      const updated = isPinned
        ? await unpinCardInDirectory(card.id)
        : await pinCardInDirectory(card.id);
      setNotice(isPinned ? `已取消置顶：${updated.title}` : `已置顶：${updated.title}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '调整置顶失败');
    }
  };

  const handleMoveCard = async (card: KnowledgeCard, direction: 'up' | 'down') => {
    if (!isEditMode) return;
    setError('');
    setNotice('');

    try {
      const updated = await moveCardInDirectory(card.id, direction);
      setNotice(direction === 'up' ? `已上移：${updated.title}` : `已下移：${updated.title}`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '调整排序失败');
    }
  };

  const renderMiniMapNode = (node: DirectoryTreeNode) => {
    const directCount = cardCounts.get(node.id) ?? 0;
    const totalCount = countCardsInTree(cards, node);
    const isActive = node.id === selectedId;

    return (
      <div className="space-map-node" key={node.id}>
        <button className={isActive ? 'space-map-item active' : 'space-map-item'} onClick={() => selectSpace(node.id)}>
          <span className="space-map-dot" />
          <span className="space-map-main">
            <strong>{node.title}</strong>
            <small>{directCount}{totalCount !== directCount ? ` / ${totalCount}` : ''}</small>
          </span>
        </button>
        {node.children.length > 0 ? <div className="space-map-children">{node.children.map(renderMiniMapNode)}</div> : null}
      </div>
    );
  };

  const isHome = selectedId === SPACE_HOME_ID;
  const isQuickAccess = selectedId === QUICK_ACCESS_SPACE_ID;
  const isUncategorized = selectedId === UNCATEGORIZED_DIRECTORY_ID;
  const directCardCount = isQuickAccess
    ? quickAccessCards.length
    : isUncategorized
      ? uncategorizedCards.length
      : selectedDirectory
        ? cardCounts.get(selectedDirectory.id) ?? 0
        : cards.length;
  const subtreeCardCount = isQuickAccess
    ? quickAccessCards.length
    : isUncategorized
      ? uncategorizedCards.length
      : selectedDirectory
        ? countCardsInTree(cards, selectedTreeNode)
        : cards.filter((card) => card.primaryDirectoryId).length;

  const renderSpaceTile = (directory: DirectoryNode, compact = false) => {
    const node = findTreeNode(directoryTree, directory.id);
    return (
      <article className={compact ? 'space-tile compact' : 'space-tile'} key={directory.id}>
        <button className="space-tile-main" onClick={() => selectSpace(directory.id)}>
          <strong>{directory.title}</strong>
          <span>{directory.description || '暂无说明。'}</span>
          <small>本级 {cardCounts.get(directory.id) ?? 0} · 含子级 {countCardsInTree(cards, node)}</small>
        </button>
        {isEditMode ? (
          <div className="space-tile-actions">
            <button className="secondary-button" onClick={() => openEditSpaceForm(directory)}>
              空间信息
            </button>
            <button className="secondary-button" onClick={() => openCreateForm(directory.id)}>
              新建子空间
            </button>
          </div>
        ) : null}
      </article>
    );
  };

  const renderCardRow = (card: KnowledgeCard) => {
    const isPinned = (card.directorySortOrder ?? 9999) < 0;

    return (
      <article className={isPinned ? 'space-card-row pinned-card' : 'space-card-row'} key={card.id}>
        <button className="space-card-main" onClick={() => onNavigate(`/cards/${encodeURIComponent(card.id)}`)}>
          <strong>
            {card.title}
            {isPinned ? <span className="space-pin-badge">置顶</span> : null}
          </strong>
          <span>{card.summary || '暂无摘要。'}</span>
          <small>
            {card.domain} · {card.type} · 重要度 {card.importance}
            {card.primaryDirectoryId ? ` · ${formatDirectoryPath(directories, card.primaryDirectoryId)}` : ' · 未设置主目录'}
          </small>
        </button>
        {isEditMode ? (
          <div className="space-card-actions">
            {card.primaryDirectoryId ? (
              <>
                <button className="secondary-button" onClick={() => handlePinCard(card)}>
                  {isPinned ? '取消置顶' : '置顶'}
                </button>
                <button className="secondary-button" onClick={() => handleMoveCard(card, 'up')}>
                  上移
                </button>
                <button className="secondary-button" onClick={() => handleMoveCard(card, 'down')}>
                  下移
                </button>
              </>
            ) : null}
            <button className="secondary-button" onClick={() => onNavigate(`/edit/${encodeURIComponent(card.id)}`)}>
              编辑卡片
            </button>
            {card.primaryDirectoryId ? (
              <button className="secondary-button" onClick={() => handleAssignCard(card.id, undefined)}>
                移出主目录
              </button>
            ) : selectedDirectory ? (
              <button className="secondary-button" onClick={() => handleAssignCard(card.id, selectedDirectory.id)}>
                归入当前空间
              </button>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <div className={isEditMode ? 'directory-page space-page edit-mode' : 'directory-page space-page browse-mode'}>
      <section className="space-command-shell panel-surface">
        <div className="space-command-title">
          <p className="eyebrow">Knowledge Spaces</p>
          <h1>知识空间</h1>
          <span>{isEditMode ? '修改模式 · 结构与卡片整理' : '浏览模式 · 固定位置与快速进入'}</span>
        </div>
        <button className={isHome ? 'space-home-button active' : 'space-home-button'} onClick={() => selectSpace(SPACE_HOME_ID)}>
          首页
        </button>
        <div className="space-search-box">
          <input
            value={query}
            placeholder="搜索空间或卡片"
            onChange={(event) => setQuery(event.target.value)}
          />
          {quickMatches.length > 0 ? (
            <div className="space-search-results">
              {quickMatches.map((match) => (
                <button
                  key={`${match.type}-${match.id}`}
                  onClick={() => (match.type === 'space' ? selectSpace(match.id) : onNavigate(`/cards/${encodeURIComponent(match.id)}`))}
                >
                  <strong>{match.title}</strong>
                  <small>{match.type === 'space' ? '空间' : '卡片'} · {match.meta}</small>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-command-actions">
          <div className="space-mode-switch" aria-label="浏览和修改模式">
            <button className={!isEditMode ? 'active' : ''} onClick={() => switchMode('browse')}>
              浏览
            </button>
            <button className={isEditMode ? 'active' : ''} onClick={() => switchMode('edit')}>
              修改
            </button>
          </div>
          <button className="secondary-button" onClick={() => onNavigate('/library')}>
            卡片库
          </button>
          <button className="secondary-button" onClick={() => onNavigate('/collections')}>
            专题集
          </button>
          {isEditMode ? (
            <>
              <button className="secondary-button" onClick={() => openCreateForm(selectedDirectory?.id)}>
                {selectedDirectory ? '新建子空间' : '新建空间'}
              </button>
              <button className="primary-button" onClick={() => onNavigate('/new')}>
                新建卡片
              </button>
            </>
          ) : null}
        </div>
      </section>

      {error ? <div className="error-strip">{error}</div> : null}
      {notice ? <div className="status-strip">{notice}</div> : null}

      <section className="space-layout">
        <aside className="space-map-panel panel-surface">
          <div className="space-panel-head">
            <div>
              <p className="section-label">Mini Map</p>
              <h2>小地图</h2>
            </div>
            <span className="metadata-pill">{directories.length}</span>
          </div>
          <div className="space-map-list">
            <button
              className={isQuickAccess ? 'space-map-item active quick-access-node' : 'space-map-item quick-access-node'}
              onClick={() => selectSpace(QUICK_ACCESS_SPACE_ID)}
            >
              <span className="space-map-dot quick" />
              <span className="space-map-main">
                <strong>常用</strong>
                <small>{quickAccessCards.length}</small>
              </span>
            </button>
            {directoryTree.length > 0 ? directoryTree.map(renderMiniMapNode) : <div className="empty-state compact-empty">暂无空间。</div>}
            <button className={isUncategorized ? 'space-map-item active unassigned' : 'space-map-item unassigned'} onClick={() => selectSpace(UNCATEGORIZED_DIRECTORY_ID)}>
              <span className="space-map-dot warning" />
              <span className="space-map-main">
                <strong>未归位</strong>
                <small>{uncategorizedCards.length}</small>
              </span>
            </button>
          </div>
        </aside>

        <main className="space-main-panel panel-surface">
          {isHome ? (
            <>
              <section className="space-hero">
                <div>
                  <p className="section-label">Home</p>
                  <h2>知识空间首页</h2>
                  <p>先选大空间，再逐层进入子空间。修改模式下才显示结构与卡片整理入口。</p>
                </div>
                <div className="space-compact-stats">
                  <span>一级 <strong>{rootDirectories.length}</strong></span>
                  <span>卡片 <strong>{cards.length}</strong></span>
                  <span>未归位 <strong>{uncategorizedCards.length}</strong></span>
                </div>
              </section>

              {isEditMode && isCreateOpen ? (
                <CreateSpacePanel
                  flatDirectories={flatDirectories}
                  newTitle={newTitle}
                  newParentId={newParentId}
                  newDescription={newDescription}
                  setNewTitle={setNewTitle}
                  setNewParentId={setNewParentId}
                  setNewDescription={setNewDescription}
                  onClose={() => setIsCreateOpen(false)}
                  onSubmit={handleCreate}
                />
              ) : null}

              <section className="space-section">
                <div className="space-section-head">
                  <div>
                    <p className="section-label">Root Spaces</p>
                    <h3>一级知识空间</h3>
                  </div>
                  {isEditMode ? (
                    <button className="secondary-button" onClick={() => openCreateForm()}>
                      新建一级空间
                    </button>
                  ) : null}
                </div>
                <div className="space-card-grid">
                  {rootDirectories.map((directory) => renderSpaceTile(directory))}
                </div>
              </section>

              <section className="space-section">
                <div className="space-section-head">
                  <div>
                    <p className="section-label">Recent</p>
                    <h3>最近更新</h3>
                  </div>
                </div>
                <div className="space-card-list">{recentCards.map(renderCardRow)}</div>
              </section>
            </>
          ) : (
            <>
              <section className="space-hero current-space-hero">
                <div>
                  <p className="section-label">Current Space</p>
                  <h2>{isQuickAccess ? '常用' : isUncategorized ? '未归位卡片' : selectedDirectory?.title || '空间'}</h2>
                  <p>
                    {isQuickAccess
                      ? '当前最常打开的一组卡片。这里是虚拟入口，不改变卡片主目录。'
                      : isUncategorized
                        ? '这些卡片还没有固定主位置。修改模式下可以批量归入当前空间。'
                        : selectedDirectory?.description || '暂无说明。'}
                  </p>
                  {selectedDirectory ? (
                    <nav className="space-breadcrumb" aria-label="空间路径">
                      <button onClick={() => selectSpace(SPACE_HOME_ID)}>首页</button>
                      {directoryPath.map((item) => (
                        <button key={item.id} onClick={() => selectSpace(item.id)}>
                          / {item.title}
                        </button>
                      ))}
                    </nav>
                  ) : null}
                </div>
                <div className="space-compact-actions">
                  <span>本级 <strong>{directCardCount}</strong></span>
                  <span>含子级 <strong>{subtreeCardCount}</strong></span>
                  <span>未归位 <strong>{uncategorizedCards.length}</strong></span>
                  {selectedDirectory ? (
                    <button
                      className="secondary-button"
                      onClick={() => onNavigate(`/print?directory=${encodeURIComponent(selectedDirectory.id)}&scope=deep`)}
                    >
                      打印空间
                    </button>
                  ) : null}
                  {isEditMode && selectedDirectory ? (
                    <>
                      <button className="secondary-button" onClick={() => openEditSpaceForm(selectedDirectory)}>
                        空间信息
                      </button>
                      <button className="secondary-button" onClick={() => setIsInfoOpen((open) => !open)}>
                        {isInfoOpen ? '收起' : '更多'}
                      </button>
                      <button className="secondary-button" onClick={() => openCreateForm(selectedDirectory.id)}>
                        新建子空间
                      </button>
                    </>
                  ) : null}
                </div>
              </section>

              {isEditMode && isInfoOpen && selectedDirectory ? (
                <section className="space-inline-panel">
                  <div className="space-info-grid compact-info-grid">
                    <div>
                      <span>本级</span>
                      <strong>{directCardCount}</strong>
                    </div>
                    <div>
                      <span>含子级</span>
                      <strong>{subtreeCardCount}</strong>
                    </div>
                    <div>
                      <span>未归位</span>
                      <strong>{uncategorizedCards.length}</strong>
                    </div>
                  </div>
                  <div className="space-inline-actions">
                    <button className="danger-button" onClick={handleDeleteSelected}>
                      删除空空间
                    </button>
                    <button className="secondary-button" onClick={() => onNavigate('/library')}>
                      去卡片库整理
                    </button>
                    <button className="secondary-button" onClick={() => selectSpace(UNCATEGORIZED_DIRECTORY_ID)}>
                      查看未归位
                    </button>
                  </div>
                </section>
              ) : null}

              {isEditMode && isCreateOpen ? (
                <CreateSpacePanel
                  flatDirectories={flatDirectories}
                  newTitle={newTitle}
                  newParentId={newParentId}
                  newDescription={newDescription}
                  setNewTitle={setNewTitle}
                  setNewParentId={setNewParentId}
                  setNewDescription={setNewDescription}
                  onClose={() => setIsCreateOpen(false)}
                  onSubmit={handleCreate}
                />
              ) : null}

              {isEditMode && isEditSpaceOpen ? (
                <section className="space-inline-panel edit-space-form">
                  <div className="space-section-head">
                    <div>
                      <p className="section-label">Edit Space</p>
                      <h3>修改空间信息</h3>
                    </div>
                    <button className="secondary-button" onClick={() => setIsEditSpaceOpen(false)}>
                      收起
                    </button>
                  </div>
                  <form onSubmit={handleUpdateSpace}>
                    <label className="editor-field">
                      <span>名称</span>
                      <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                    </label>
                    <label className="editor-field">
                      <span>父空间</span>
                      <select value={editParentId} onChange={(event) => setEditParentId(event.target.value)}>
                        <option value="">作为一级空间</option>
                        {editableParentOptions.map((directory) => (
                          <option key={directory.id} value={directory.id}>
                            {'　'.repeat(directory.depth)}{directory.depth > 0 ? '└ ' : ''}{directory.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="editor-field">
                      <span>排序</span>
                      <input
                        type="number"
                        value={editSortOrder}
                        onChange={(event) => setEditSortOrder(Number(event.target.value))}
                      />
                    </label>
                    <label className="editor-field wide-field">
                      <span>说明</span>
                      <textarea rows={3} value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
                    </label>
                    <button className="primary-button" type="submit">保存修改</button>
                  </form>
                </section>
              ) : null}

              {!isQuickAccess && !isUncategorized ? (
                <div className="space-view-strip">
                  <div className="space-view-switch">
                    <button className={viewMode === 'direct' ? 'active' : ''} onClick={() => setViewMode('direct')}>
                      本空间
                    </button>
                    <button className={viewMode === 'deep' ? 'active' : ''} onClick={() => setViewMode('deep')}>
                      含子空间
                    </button>
                  </div>
                  <span>{viewMode === 'deep' ? '显示当前空间及下级空间卡片。' : '只显示直接归属当前空间的卡片。'}</span>
                </div>
              ) : null}

              {selectedDirectory && childDirectories.length > 0 ? (
                <section className="space-section">
                  <div className="space-section-head">
                    <div>
                      <p className="section-label">Subspaces</p>
                      <h3>子空间</h3>
                    </div>
                    <span className="metadata-pill">{childDirectories.length}</span>
                  </div>
                  <div className="space-card-grid compact-grid">
                    {childDirectories.map((directory) => renderSpaceTile(directory, true))}
                  </div>
                </section>
              ) : null}

              <section className="space-section">
                <div className="space-section-head">
                  <div>
                    <p className="section-label">Cards</p>
                    <h3>{isQuickAccess ? '常用卡片' : isUncategorized ? '待归位卡片' : viewMode === 'deep' ? '当前空间卡片' : '本空间卡片'}</h3>
                  </div>
                  <span className="metadata-pill">{selectedCards.length} 张</span>
                </div>
                {selectedCards.length === 0 ? (
                  <div className="empty-state">当前范围还没有卡片。</div>
                ) : (
                  <div className="space-card-list">{selectedCards.map(renderCardRow)}</div>
                )}
              </section>

              {isEditMode && selectedDirectory && uncategorizedCards.length > 0 ? (
                <section className="space-section muted-section">
                  <div className="space-section-head">
                    <div>
                      <p className="section-label">Triage</p>
                      <h3>快速归位</h3>
                      <p>只把确实属于当前空间的卡片归入。</p>
                    </div>
                    <span className="metadata-pill">{uncategorizedCards.length} 张</span>
                  </div>
                  <div className="space-unassigned-list">
                    {uncategorizedCards.slice(0, 6).map((card) => (
                      <div className="space-unassigned-row" key={card.id}>
                        <span>
                          <strong>{card.title}</strong>
                          <small>{card.domain} · {card.type}</small>
                        </span>
                        <button className="secondary-button" onClick={() => handleAssignCard(card.id, selectedDirectory.id)}>
                          归入当前空间
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </main>
      </section>
    </div>
  );
}

type CreateSpacePanelProps = {
  flatDirectories: DirectoryTreeNode[];
  newTitle: string;
  newParentId: string;
  newDescription: string;
  setNewTitle: (value: string) => void;
  setNewParentId: (value: string) => void;
  setNewDescription: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

function CreateSpacePanel({
  flatDirectories,
  newTitle,
  newParentId,
  newDescription,
  setNewTitle,
  setNewParentId,
  setNewDescription,
  onClose,
  onSubmit,
}: CreateSpacePanelProps) {
  return (
    <section className="space-inline-panel create-space-form">
      <div className="space-section-head">
        <div>
          <p className="section-label">Create</p>
          <h3>新建空间</h3>
        </div>
        <button className="secondary-button" onClick={onClose}>
          收起
        </button>
      </div>
      <form onSubmit={onSubmit}>
        <label className="editor-field">
          <span>名称</span>
          <input value={newTitle} placeholder="例如：系统项目" onChange={(event) => setNewTitle(event.target.value)} />
        </label>
        <label className="editor-field">
          <span>父空间</span>
          <select value={newParentId} onChange={(event) => setNewParentId(event.target.value)}>
            <option value="">作为一级空间</option>
            {flatDirectories.map((directory) => (
              <option key={directory.id} value={directory.id}>
                {'　'.repeat(directory.depth)}{directory.depth > 0 ? '└ ' : ''}{directory.title}
              </option>
            ))}
          </select>
        </label>
        <label className="editor-field">
          <span>说明</span>
          <textarea rows={3} value={newDescription} onChange={(event) => setNewDescription(event.target.value)} />
        </label>
        <button className="primary-button" type="submit">创建</button>
      </form>
    </section>
  );
}
