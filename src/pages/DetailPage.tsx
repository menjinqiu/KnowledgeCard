import { useEffect, useState } from 'react';
import { CardDetail, type CardDetailPrintOptions } from '../components/CardDetail';
import {
  deleteCard,
  getAllCards,
  getCard,
  setArchived,
  setFavorite,
} from '../services/cardService';
import {
  addCardToCollection,
  addCardToQuickAccess,
  getAllCollections,
  getCollectionsContainingCard,
  isQuickAccessCollection,
  removeCardFromQuickAccess,
} from '../services/collectionService';
import { formatDirectoryPath, getAllDirectories } from '../services/directoryService';
import { exportCardToMarkdownFile } from '../services/markdownExportService';
import type { CardCollection, DirectoryNode, KnowledgeCard } from '../types/card';

type DetailPageProps = {
  id: string;
  onNavigate: (path: string) => void;
};

function getDefaultCopyLabel(card: KnowledgeCard) {
  if (card.copyLabel?.trim()) return card.copyLabel.trim();
  if (card.type === '提示词卡') return '复制提示词';
  if (card.type === '模板卡') return '复制模板';
  if (card.type === '清单卡') return '复制清单';
  if (card.type === '练习卡') return '复制练习内容';
  return '复制重点内容';
}

export function DetailPage({ id, onNavigate }: DetailPageProps) {
  const [card, setCard] = useState<KnowledgeCard | null>(null);
  const [allCards, setAllCards] = useState<KnowledgeCard[]>([]);
  const [collections, setCollections] = useState<CardCollection[]>([]);
  const [cardCollections, setCardCollections] = useState<CardCollection[]>([]);
  const [directories, setDirectories] = useState<DirectoryNode[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [message, setMessage] = useState('');
  const [printOptions, setPrintOptions] = useState<CardDetailPrintOptions>({
    showSummary: true,
    showTags: true,
    showSource: true,
    showCopyText: true,
  });

  const reloadCollections = async (cardId: string) => {
    const [allCollections, containingCollections, allDirectories] = await Promise.all([
      getAllCollections(),
      getCollectionsContainingCard(cardId),
      getAllDirectories(),
    ]);
    const availableCollections = allCollections.filter(
      (collection) => !containingCollections.some((existing) => existing.id === collection.id),
    );
    setCollections(allCollections);
    setCardCollections(containingCollections);
    setDirectories(allDirectories);
    setSelectedCollectionId((current) =>
      availableCollections.some((collection) => collection.id === current)
        ? current
        : availableCollections[0]?.id || '',
    );
  };

  const reload = () => {
    Promise.all([getCard(id), getAllCards()])
      .then(([nextCard, nextAllCards]) => {
        setCard(nextCard ?? null);
        setAllCards(nextAllCards);
        if (nextCard) {
          reloadCollections(nextCard.id).catch(console.error);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    reload();
  }, [id]);

  const copyContent = async () => {
    if (!card) return;

    try {
      await navigator.clipboard.writeText(card.content);
      setMessage('正文已复制');
    } catch {
      setMessage('复制失败，请手动选择正文');
    }
  };

  const copyPrimaryPayload = async () => {
    if (!card?.copyText?.trim()) return;
    const label = getDefaultCopyLabel(card);

    try {
      await navigator.clipboard.writeText(card.copyText);
      setMessage(`${label}成功`);
    } catch {
      setMessage(`${label}失败，请手动选择复制内容`);
    }
  };

  const updatePrintOption = <Key extends keyof CardDetailPrintOptions>(
    key: Key,
    value: CardDetailPrintOptions[Key],
  ) => {
    setPrintOptions((current) => ({ ...current, [key]: value }));
  };

  const handleAddToCollection = async () => {
    if (!card || !selectedCollectionId) return;

    try {
      const updated = await addCardToCollection(selectedCollectionId, card.id);
      setMessage(`已加入专题集：${updated.title}`);
      await reloadCollections(card.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加入专题集失败');
    }
  };

  const handleToggleQuickAccess = async () => {
    if (!card) return;
    const isInQuickAccess = cardCollections.some(isQuickAccessCollection);

    try {
      if (isInQuickAccess) {
        await removeCardFromQuickAccess(card.id);
        setMessage('已移出当前常用');
      } else {
        await addCardToQuickAccess(card.id);
        setMessage('已加入当前常用');
      }
      await reloadCollections(card.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '当前常用更新失败');
    }
  };

  const handleDelete = async () => {
    if (!card) return;
    if (!confirm(`确认删除「${card.title}」？`)) return;

    await deleteCard(card.id);
    onNavigate('/library');
  };

  if (!card) {
    return (
      <div className="empty-state">
        <p>未找到卡片</p>
        <button className="secondary-button" onClick={() => onNavigate('/library')}>
          返回卡片库
        </button>
      </div>
    );
  }

  const copyPayloadLabel = getDefaultCopyLabel(card);
  const isInQuickAccess = cardCollections.some(isQuickAccessCollection);
  const directoryPath = formatDirectoryPath(directories, card.primaryDirectoryId);
  const siblingCards = card.primaryDirectoryId
    ? allCards
        .filter((item) => item.primaryDirectoryId === card.primaryDirectoryId && !item.archived)
        .sort(
          (a, b) =>
            (a.directorySortOrder ?? 9999) - (b.directorySortOrder ?? 9999) ||
            b.updatedAt.localeCompare(a.updatedAt),
        )
    : [];
  const currentSiblingIndex = siblingCards.findIndex((item) => item.id === card.id);
  const previousSibling = currentSiblingIndex > 0 ? siblingCards[currentSiblingIndex - 1] : null;
  const nextSibling =
    currentSiblingIndex >= 0 && currentSiblingIndex < siblingCards.length - 1
      ? siblingCards[currentSiblingIndex + 1]
      : null;
  const collectionOptions = collections.filter(
    (collection) => !cardCollections.some((existing) => existing.id === collection.id),
  );

  const collectionPanel = (
    <section className="detail-collection-box">
      <div>
        <p className="section-label">Collections</p>
        <h3>专题集</h3>
        <p>
          {cardCollections.length > 0
            ? `已属于：${cardCollections.map((collection) => collection.title).join('、')}`
            : '还没有加入专题集。'}
        </p>
      </div>
      <div className="detail-collection-actions">
        {collections.length === 0 ? (
          <button className="secondary-button" onClick={() => onNavigate('/collections')}>
            创建专题集
          </button>
        ) : (
          <>
            <select
              value={selectedCollectionId}
              onChange={(event) => setSelectedCollectionId(event.target.value)}
              disabled={collectionOptions.length === 0}
            >
              {collectionOptions.length === 0 ? <option value="">已加入全部专题集</option> : null}
              {collectionOptions.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.title}
                </option>
              ))}
            </select>
            <button
              className="primary-button"
              disabled={collectionOptions.length === 0}
              onClick={handleAddToCollection}
            >
              加入
            </button>
            <button className="text-button" onClick={() => onNavigate('/collections')}>
              管理专题集
            </button>
          </>
        )}
      </div>
    </section>
  );

  return (
    <div className="detail-page">
      <section className="page-head compact no-print">
        <div>
          <button className="text-button" onClick={() => onNavigate('/library')}>
            ← 返回卡片库
          </button>
          <button
            className="text-button"
            onClick={() => onNavigate(card.primaryDirectoryId ? `/directory?directory=${encodeURIComponent(card.primaryDirectoryId)}` : '/directory')}
          >
            目录：{directoryPath}
          </button>
        </div>
        <div className="action-row detail-action-row">
          <button className="primary-button" onClick={() => onNavigate(`/edit/${encodeURIComponent(card.id)}`)}>
            编辑
          </button>
          <button className={isInQuickAccess ? 'primary-button' : 'secondary-button'} onClick={handleToggleQuickAccess}>
            {isInQuickAccess ? '已在常用' : '加入常用'}
          </button>
          <button className="secondary-button" onClick={copyContent}>
            复制正文
          </button>
          <button
            className="secondary-button"
            onClick={async () => {
              const updated = await setFavorite(card.id, !card.favorite);
              setCard(updated);
            }}
          >
            {card.favorite ? '取消收藏' : '收藏'}
          </button>
          <button
            className="secondary-button"
            onClick={async () => {
              const updated = await setArchived(card.id, !card.archived);
              setCard(updated);
            }}
          >
            {card.archived ? '取消归档' : '归档'}
          </button>
          <button
            className="secondary-button low-emphasis-action"
            onClick={() => {
              try {
                const filename = exportCardToMarkdownFile(card);
                setMessage(`Markdown 导出成功：${filename}`);
              } catch (error) {
                setMessage(
                  error instanceof Error
                    ? `Markdown 导出失败：${error.message}`
                    : 'Markdown 导出失败',
                );
              }
            }}
          >
            导出 Markdown
          </button>
          <button className="secondary-button low-emphasis-action" onClick={() => window.print()}>
            打印当前卡片
          </button>
          <button className="danger-button" onClick={handleDelete}>
            删除
          </button>
        </div>
      </section>

      {message ? <div className="status-strip no-print">{message}</div> : null}

      <section className="detail-print-options no-print panel-surface" aria-label="当前卡片打印内容选项">
        <div>
          <p className="section-label">Print Options</p>
          <h2>当前卡片打印内容</h2>
          <p>这些选项只影响“打印当前卡片”的纸面内容，不改变卡片数据。</p>
        </div>
        <div className="detail-print-toggle-grid">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={printOptions.showSummary}
              onChange={(event) => updatePrintOption('showSummary', event.target.checked)}
            />
            打印摘要
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={printOptions.showTags}
              onChange={(event) => updatePrintOption('showTags', event.target.checked)}
            />
            打印标签
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={printOptions.showCopyText}
              onChange={(event) => updatePrintOption('showCopyText', event.target.checked)}
            />
            打印复制粘贴区
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={printOptions.showSource}
              onChange={(event) => updatePrintOption('showSource', event.target.checked)}
            />
            打印来源
          </label>
        </div>
      </section>

      <section className="detail-reuse-strip no-print">
        {card.copyText?.trim() ? (
          <button className="primary-button detail-primary-copy" onClick={copyPrimaryPayload}>
            {copyPayloadLabel}
          </button>
        ) : null}
        <button
          className="secondary-button"
          onClick={() => onNavigate(card.primaryDirectoryId ? `/directory?directory=${encodeURIComponent(card.primaryDirectoryId)}` : '/directory')}
        >
          返回空间
        </button>
        {previousSibling ? (
          <button
            className="secondary-button detail-sibling-button"
            onClick={() => onNavigate(`/cards/${encodeURIComponent(previousSibling.id)}`)}
          >
            ← {previousSibling.title}
          </button>
        ) : null}
        {nextSibling ? (
          <button
            className="secondary-button detail-sibling-button"
            onClick={() => onNavigate(`/cards/${encodeURIComponent(nextSibling.id)}`)}
          >
            {nextSibling.title} →
          </button>
        ) : null}
      </section>

      <CardDetail
        card={card}
        collectionPanel={collectionPanel}
        copyPayloadLabel={copyPayloadLabel}
        onCopyPayload={copyPrimaryPayload}
        printOptions={printOptions}
      />
    </div>
  );
}
