import { useEffect, useMemo, useState } from 'react';
import { CardList } from '../components/CardList';
import {
  groupCardsForManual,
  PrintPreview,
  type ManualGroupingMode,
  type ManualLayoutMode,
  type ManualPrintSettings,
} from '../components/PrintPreview';
import { SearchBox } from '../components/SearchBox';
import { SidebarFilters } from '../components/SidebarFilters';
import {
  applyCardFilters,
  defaultFilters,
  getAllCards,
  getAllTags,
  setFavorite,
  sortCards,
  type CardFilters,
} from '../services/cardService';
import { getCollection } from '../services/collectionService';
import {
  buildDirectoryTree,
  flattenDirectoryTree,
  formatDirectoryPath,
  getAllDirectories,
} from '../services/directoryService';
import type { DirectoryNode, KnowledgeCard } from '../types/card';

type DirectoryPrintScope = 'direct' | 'deep';

type PrintCenterPageProps = {
  initialCollectionId?: string;
  initialDirectoryId?: string;
  initialDirectoryScope?: DirectoryPrintScope;
  onNavigate: (path: string) => void;
};

type PrintCenterMode = 'select' | 'preview';

const defaultPrintSettings: ManualPrintSettings = {
  groupingMode: 'domain',
  layoutMode: 'page-per-card',
  showCover: true,
  showToc: true,
  showSummary: true,
  showTags: true,
  showSource: true,
  showCopyText: true,
};

function getDescendantDirectoryIds(directories: DirectoryNode[], directoryId: string): string[] {
  const childrenByParent = new Map<string, DirectoryNode[]>();
  directories.forEach((directory) => {
    if (!directory.parentId) return;
    const current = childrenByParent.get(directory.parentId) ?? [];
    current.push(directory);
    childrenByParent.set(directory.parentId, current);
  });

  const ids = [directoryId];
  const visit = (id: string) => {
    const children = childrenByParent.get(id) ?? [];
    children.forEach((child) => {
      ids.push(child.id);
      visit(child.id);
    });
  };

  visit(directoryId);
  return ids;
}

function getDirectoryPrintableCards(
  cards: KnowledgeCard[],
  directories: DirectoryNode[],
  directoryId: string,
  scope: DirectoryPrintScope,
) {
  const directoryIds =
    scope === 'deep' ? getDescendantDirectoryIds(directories, directoryId) : [directoryId];
  const directoryIdSet = new Set(directoryIds);

  return cards
    .filter((card) => card.primaryDirectoryId && directoryIdSet.has(card.primaryDirectoryId))
    .sort(
      (a, b) =>
        (a.directorySortOrder ?? 9999) - (b.directorySortOrder ?? 9999) ||
        b.updatedAt.localeCompare(a.updatedAt),
    );
}

function estimateManualPages(
  cardCount: number,
  sectionCount: number,
  settings: ManualPrintSettings,
) {
  const coverPages = settings.showCover ? 1 : 0;
  const tocPages = settings.showToc ? Math.max(1, Math.ceil(sectionCount / 18)) : 0;
  const cardPages = settings.layoutMode === 'compact' ? Math.max(1, Math.ceil(cardCount / 2)) : cardCount;
  return coverPages + tocPages + cardPages;
}

export function PrintCenterPage({
  initialCollectionId,
  initialDirectoryId,
  initialDirectoryScope = 'direct',
  onNavigate,
}: PrintCenterPageProps) {
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [directories, setDirectories] = useState<DirectoryNode[]>([]);
  const [filters, setFilters] = useState<CardFilters>(defaultFilters);
  const [sortMode, setSortMode] = useState('updated-desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewIds, setPreviewIds] = useState<string[]>([]);
  const [sourceLabel, setSourceLabel] = useState('');
  const [sourceDirectoryId, setSourceDirectoryId] = useState('');
  const [sourceDirectoryScope, setSourceDirectoryScope] = useState<DirectoryPrintScope>(initialDirectoryScope);
  const [mode, setMode] = useState<PrintCenterMode>('select');
  const [printSettings, setPrintSettings] = useState<ManualPrintSettings>(defaultPrintSettings);

  const reload = () => {
    Promise.all([getAllCards(), getAllDirectories()])
      .then(([nextCards, nextDirectories]) => {
        setCards(nextCards);
        setDirectories(nextDirectories);
        setSourceDirectoryId((current) => {
          if (current && nextDirectories.some((directory) => directory.id === current)) return current;
          return nextDirectories[0]?.id ?? '';
        });
      })
      .catch(console.error);
  };

  useEffect(() => {
    reload();
  }, []);

  const printableCards = useMemo(() => cards.filter((card) => card.printable), [cards]);
  const directoryOptions = useMemo(
    () => flattenDirectoryTree(buildDirectoryTree(directories)),
    [directories],
  );
  const tags = useMemo(() => getAllTags(printableCards), [printableCards]);
  const visibleCards = useMemo(
    () => sortCards(applyCardFilters(printableCards, filters), sortMode),
    [printableCards, filters, sortMode],
  );
  const sourceDirectoryCards = useMemo(() => {
    if (!sourceDirectoryId) return [];
    return getDirectoryPrintableCards(
      printableCards,
      directories,
      sourceDirectoryId,
      sourceDirectoryScope,
    );
  }, [directories, printableCards, sourceDirectoryId, sourceDirectoryScope]);

  const previewCards = useMemo(() => {
    const byId = new Map(printableCards.map((card) => [card.id, card]));
    return previewIds
      .map((id) => byId.get(id))
      .filter((card): card is KnowledgeCard => Boolean(card));
  }, [printableCards, previewIds]);

  const previewSections = useMemo(
    () => groupCardsForManual(previewCards, printSettings.groupingMode),
    [previewCards, printSettings.groupingMode],
  );
  const estimatedPages = useMemo(
    () => estimateManualPages(previewCards.length, previewSections.length, printSettings),
    [previewCards.length, previewSections.length, printSettings],
  );

  useEffect(() => {
    if (!initialCollectionId || printableCards.length === 0) return;

    getCollection(initialCollectionId)
      .then((collection) => {
        if (!collection) return;
        const printableIds = collection.cardIds.filter((cardId) =>
          printableCards.some((card) => card.id === cardId),
        );
        setSelectedIds(new Set(printableIds));
        setPreviewIds(printableIds);
        setSourceLabel(`专题集：${collection.title}`);
        setPrintSettings((current) => ({
          ...current,
          groupingMode: 'none',
        }));
        setMode('preview');
      })
      .catch(console.error);
  }, [initialCollectionId, printableCards]);

  useEffect(() => {
    if (!initialDirectoryId || initialCollectionId || printableCards.length === 0 || directories.length === 0) return;
    if (!directories.some((directory) => directory.id === initialDirectoryId)) return;

    const printableIds = getDirectoryPrintableCards(
      printableCards,
      directories,
      initialDirectoryId,
      initialDirectoryScope,
    ).map((card) => card.id);

    setSourceDirectoryId(initialDirectoryId);
    setSourceDirectoryScope(initialDirectoryScope);
    setSelectedIds(new Set(printableIds));
    setPreviewIds(printableIds);
    setSourceLabel(
      `空间：${formatDirectoryPath(directories, initialDirectoryId)}${
        initialDirectoryScope === 'deep' ? '（含子空间）' : ''
      }`,
    );
    setPrintSettings((current) => ({
      ...current,
      groupingMode: 'none',
    }));
    setMode('preview');
  }, [initialCollectionId, initialDirectoryId, initialDirectoryScope, directories, printableCards]);

  const updatePrintSetting = <Key extends keyof ManualPrintSettings>(
    key: Key,
    value: ManualPrintSettings[Key],
  ) => {
    setPrintSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(visibleCards.map((card) => card.id)));
    setSourceLabel('当前筛选结果');
  };

  const selectDirectoryCards = (openPreview: boolean) => {
    const printableIds = sourceDirectoryCards.map((card) => card.id);
    const nextSourceLabel = sourceDirectoryId
      ? `空间：${formatDirectoryPath(directories, sourceDirectoryId)}${
          sourceDirectoryScope === 'deep' ? '（含子空间）' : ''
        }`
      : '';

    setSelectedIds(new Set(printableIds));
    setSourceLabel(nextSourceLabel);
    setPrintSettings((current) => ({ ...current, groupingMode: 'none' }));

    if (openPreview) {
      setPreviewIds(printableIds);
      setMode('preview');
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setPreviewIds([]);
    setSourceLabel('');
    setMode('select');
  };

  const generatePreview = () => {
    const orderedIds = visibleCards
      .filter((card) => selectedIds.has(card.id))
      .map((card) => card.id);
    const selectedFromVisible = orderedIds.length === selectedIds.size;

    if (selectedFromVisible) {
      setPreviewIds(orderedIds);
      setSourceLabel(sourceLabel || '当前筛选结果');
    } else {
      setPreviewIds(Array.from(selectedIds));
      setSourceLabel(sourceLabel || '手动选择');
    }

    setMode('preview');
  };

  return (
    <div className="print-center-page">
      <section className="page-head compact print-head no-print">
        <div>
          <p className="eyebrow">Manual Builder</p>
          <h1>打印中心</h1>
          <p>
            {mode === 'select'
              ? '从筛选结果、专题集或知识空间选择可打印卡片，再生成 A4 手册预览。'
              : `正在预览手册。${sourceLabel ? `来源：${sourceLabel}` : '来源：手动选择'}`}
          </p>
        </div>
        <div className="action-row print-action-row">
          <button className="secondary-button" onClick={() => onNavigate('/library')}>
            返回卡片库
          </button>
          {mode === 'select' ? (
            <>
              <button className="secondary-button" onClick={selectAllVisible}>
                选择当前结果
              </button>
              <button className="secondary-button" onClick={clearSelection}>
                清空选择
              </button>
              <button className="primary-button" onClick={generatePreview} disabled={selectedIds.size === 0}>
                生成打印预览
              </button>
            </>
          ) : (
            <>
              <button className="secondary-button" onClick={() => setMode('select')}>
                继续选择
              </button>
              <button className="secondary-button" onClick={clearSelection}>
                清空选择
              </button>
              <button
                className="primary-button"
                disabled={previewIds.length === 0}
                title={previewIds.length === 0 ? '请先生成打印预览' : '打印当前预览'}
                onClick={() => window.print()}
              >
                打印
              </button>
            </>
          )}
        </div>
      </section>

      <section className="manual-builder-stats no-print" aria-label="打印手册统计">
        <div className="manual-stat-card">
          <span>可打印</span>
          <strong>{visibleCards.length}</strong>
          <small>当前筛选结果</small>
        </div>
        <div className="manual-stat-card">
          <span>已选择</span>
          <strong>{selectedIds.size}</strong>
          <small>等待生成预览</small>
        </div>
        <div className="manual-stat-card">
          <span>预览</span>
          <strong>{previewCards.length}</strong>
          <small>将进入打印手册</small>
        </div>
        <div className="manual-stat-card">
          <span>章节</span>
          <strong>{previewSections.length}</strong>
          <small>
            {printSettings.groupingMode === 'domain'
              ? '按领域分组'
              : printSettings.groupingMode === 'type'
                ? '按类型分组'
                : '保留顺序'}
          </small>
        </div>
        <div className="manual-stat-card">
          <span>预估页</span>
          <strong>{previewCards.length > 0 ? estimatedPages : 0}</strong>
          <small>{printSettings.layoutMode === 'compact' ? '紧凑连续' : '每卡一页'}</small>
        </div>
      </section>

      {mode === 'select' ? (
        <>
          <section className="manual-source-panel no-print panel-surface">
            <div>
              <p className="section-label">Print Source</p>
              <h2>按知识空间选择</h2>
              <p>这里只选择已标记为“可打印”的卡片。普通卡片不会进入手册，除非先在卡片库批量设为可打印。</p>
            </div>
            <label className="editor-field">
              <span>知识空间</span>
              <select
                value={sourceDirectoryId}
                onChange={(event) => setSourceDirectoryId(event.target.value)}
                disabled={directoryOptions.length === 0}
              >
                {directoryOptions.length === 0 ? <option value="">暂无空间</option> : null}
                {directoryOptions.map((directory) => (
                  <option key={directory.id} value={directory.id}>
                    {'　'.repeat(directory.depth)}{directory.depth > 0 ? '└ ' : ''}{directory.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="editor-field">
              <span>范围</span>
              <select
                value={sourceDirectoryScope}
                onChange={(event) => setSourceDirectoryScope(event.target.value as DirectoryPrintScope)}
              >
                <option value="direct">只取本空间</option>
                <option value="deep">包含子空间</option>
              </select>
            </label>
            <div className="manual-source-actions">
              <span className="metadata-pill">{sourceDirectoryCards.length} 张可打印</span>
              <button
                className="secondary-button"
                onClick={() => selectDirectoryCards(false)}
                disabled={!sourceDirectoryId || sourceDirectoryCards.length === 0}
              >
                选中空间卡片
              </button>
              <button
                className="primary-button"
                onClick={() => selectDirectoryCards(true)}
                disabled={!sourceDirectoryId || sourceDirectoryCards.length === 0}
              >
                直接预览空间手册
              </button>
            </div>
          </section>

          <section className="toolbar manual-toolbar no-print">
            <SearchBox
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

          <div className="manual-selection-layout no-print">
            <SidebarFilters filters={filters} tags={tags} onChange={setFilters} compact />
            <section className="manual-card-picker panel-surface">
              <div className="manual-picker-head">
                <div>
                  <h2>选择卡片</h2>
                  <p>只显示标记为“可打印”的卡片。生成预览后再进入 A4 手册检查区。</p>
                </div>
                <span className="metadata-pill">{visibleCards.length} 张</span>
              </div>
              <CardList
                cards={visibleCards}
                onOpen={(id) => onNavigate(`/cards/${encodeURIComponent(id)}`)}
                onToggleFavorite={async (card) => {
                  await setFavorite(card.id, !card.favorite);
                  reload();
                }}
                selectable
                selectedIds={selectedIds}
                onSelect={handleSelect}
                emptyText="没有可打印卡片"
              />
            </section>
          </div>
        </>
      ) : (
        <div className="manual-preview-workspace">
          <section className="manual-settings-panel no-print panel-surface" aria-label="打印手册设置">
            <div>
              <p className="section-label">Manual Settings</p>
              <h2>手册设置</h2>
              <p>这些设置只影响当前预览和浏览器打印结果，不改变卡片、专题集或知识空间数据。</p>
            </div>
            <div className="manual-settings-selects">
              <label className="editor-field">
                <span>分组方式</span>
                <select
                  value={printSettings.groupingMode}
                  onChange={(event) =>
                    updatePrintSetting('groupingMode', event.target.value as ManualGroupingMode)
                  }
                >
                  <option value="domain">按领域分组</option>
                  <option value="type">按类型分组</option>
                  <option value="none">不分组，保留当前顺序</option>
                </select>
              </label>
              <label className="editor-field">
                <span>排版密度</span>
                <select
                  value={printSettings.layoutMode}
                  onChange={(event) =>
                    updatePrintSetting('layoutMode', event.target.value as ManualLayoutMode)
                  }
                >
                  <option value="page-per-card">每卡一页，适合归档</option>
                  <option value="compact">紧凑连续，节省纸张</option>
                </select>
              </label>
            </div>
            <div className="manual-settings-toggles" aria-label="显示内容">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={printSettings.showCover}
                  onChange={(event) => updatePrintSetting('showCover', event.target.checked)}
                />
                显示封面
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={printSettings.showToc}
                  onChange={(event) => updatePrintSetting('showToc', event.target.checked)}
                />
                显示目录
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={printSettings.showSummary}
                  onChange={(event) => updatePrintSetting('showSummary', event.target.checked)}
                />
                显示摘要
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={printSettings.showTags}
                  onChange={(event) => updatePrintSetting('showTags', event.target.checked)}
                />
                显示标签
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={printSettings.showSource}
                  onChange={(event) => updatePrintSetting('showSource', event.target.checked)}
                />
                显示来源
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={printSettings.showCopyText}
                  onChange={(event) => updatePrintSetting('showCopyText', event.target.checked)}
                />
                显示可复制内容
              </label>
            </div>
          </section>

          <div className="manual-preview-frame no-print">
            <div>
              <h2>手册预览</h2>
              <p>
                当前预览包含 {previewCards.length} 张卡片，{previewSections.length} 个章节，预估约 {estimatedPages} 页。需要调整卡片时，点击“继续选择”。
              </p>
            </div>
            <div className="manual-preview-frame-actions">
              <span className="metadata-pill">A4</span>
              <span className="metadata-pill">{previewCards.length} 张</span>
              <span className="metadata-pill">{previewSections.length} 章</span>
              <span className="metadata-pill">约 {estimatedPages} 页</span>
              <span className="metadata-pill">{printSettings.layoutMode === 'compact' ? '紧凑连续' : '每卡一页'}</span>
            </div>
          </div>
          <PrintPreview cards={previewCards} settings={printSettings} />
        </div>
      )}
    </div>
  );
}
