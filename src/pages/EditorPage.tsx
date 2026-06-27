import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { TagInput } from '../components/TagInput';
import {
  CARD_DOMAINS,
  CARD_TYPES,
  CARD_VALIDITIES,
  type KnowledgeCard,
} from '../types/card';
import {
  createCard,
  getCard,
  updateCard,
  type CardDraft,
} from '../services/cardService';
import {
  buildDirectoryTree,
  flattenDirectoryTree,
  formatDirectoryPath,
  getAllDirectories,
} from '../services/directoryService';
import type { DirectoryNode } from '../types/card';

type EditorPageProps = {
  id?: string;
  onNavigate: (path: string) => void;
};

const emptyDraft: CardDraft = {
  title: '',
  domain: '通用',
  type: '知识卡',
  tags: [],
  summary: '',
  content: '',
  copyLabel: '',
  copyText: '',
  primaryDirectoryId: '',
  directorySortOrder: 9999,
  source: '',
  sourceUrl: '',
  validity: '长期有效',
  importance: 3,
  favorite: false,
  printable: true,
  archived: false,
};

function toDraft(card: KnowledgeCard): CardDraft {
  return {
    title: card.title,
    domain: card.domain,
    type: card.type,
    tags: card.tags,
    summary: card.summary ?? '',
    content: card.content,
    copyLabel: card.copyLabel ?? '',
    copyText: card.copyText ?? '',
    primaryDirectoryId: card.primaryDirectoryId ?? '',
    directorySortOrder: card.directorySortOrder ?? 9999,
    source: card.source ?? '',
    sourceUrl: card.sourceUrl ?? '',
    validity: card.validity,
    importance: card.importance,
    favorite: card.favorite,
    printable: card.printable,
    archived: card.archived,
  };
}

export function EditorPage({ id, onNavigate }: EditorPageProps) {
  const [draft, setDraft] = useState<CardDraft>(emptyDraft);
  const [directories, setDirectories] = useState<DirectoryNode[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');

  const directoryOptions = useMemo(
    () => flattenDirectoryTree(buildDirectoryTree(directories)),
    [directories],
  );

  useEffect(() => {
    getAllDirectories()
      .then(setDirectories)
      .catch((err) => setError(err instanceof Error ? err.message : '目录读取失败'));
  }, []);

  useEffect(() => {
    if (!id) {
      setDraft(emptyDraft);
      setLoading(false);
      return;
    }

    setLoading(true);
    getCard(id)
      .then((card) => {
        if (!card) {
          setError('未找到要编辑的卡片');
          return;
        }
        setDraft(toDraft(card));
      })
      .catch((err) => setError(err instanceof Error ? err.message : '读取失败'))
      .finally(() => setLoading(false));
  }, [id]);

  const patchDraft = (patch: Partial<CardDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!draft.title.trim()) {
      setError('标题必填');
      return;
    }

    if (!draft.content.trim()) {
      setError('正文必填');
      return;
    }

    const payload: CardDraft = {
      ...draft,
      title: draft.title.trim(),
      summary: draft.summary?.trim(),
      copyLabel: draft.copyLabel?.trim(),
      copyText: draft.copyText,
      primaryDirectoryId: draft.primaryDirectoryId?.trim() || '',
      directorySortOrder: Number.isFinite(draft.directorySortOrder) ? draft.directorySortOrder : 9999,
      source: draft.source?.trim(),
      sourceUrl: draft.sourceUrl?.trim(),
      content: draft.content.trim(),
    };

    try {
      const saved = id ? await updateCard(id, payload) : await createCard(payload);
      onNavigate(`/cards/${encodeURIComponent(saved.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  if (loading) {
    return <div className="empty-state">读取中...</div>;
  }

  return (
    <form className="editor-page" onSubmit={handleSubmit}>
      <section className="page-head compact editor-head">
        <div>
          <button type="button" className="text-button" onClick={() => onNavigate('/library')}>
            ← 返回卡片库
          </button>
          <p className="eyebrow">Card Editor</p>
          <h1>{id ? '编辑卡片' : '新建卡片'}</h1>
          <p>正文优先，元数据靠右。先把高价值内容保存下来，再逐步补全分类信息。</p>
        </div>
        <div className="action-row">
          <button type="button" className="secondary-button" onClick={() => onNavigate('/library')}>
            取消
          </button>
          <button type="submit" className="primary-button">
            保存卡片
          </button>
        </div>
      </section>

      {error ? <div className="error-strip">{error}</div> : null}

      <section className="editor-grid editor-workspace-grid">
        <main className="editor-main editor-content-panel">
          <section className="editor-section">
            <div className="editor-section-head">
              <div>
                <p className="section-label">核心内容</p>
                <h2>标题、摘要、正文</h2>
              </div>
              <span className="metadata-pill">必填：标题 / 正文</span>
            </div>

            <label className="editor-field title-field">
              <span>标题</span>
              <input
                required
                value={draft.title}
                placeholder="例如：A1 听力专项提高计划"
                onChange={(event) => patchDraft({ title: event.target.value })}
              />
            </label>

            <label className="editor-field">
              <span>摘要</span>
              <textarea
                rows={3}
                value={draft.summary}
                placeholder="用 1-3 句话说明这张卡片的用途、适用场景和价值。"
                onChange={(event) => patchDraft({ summary: event.target.value })}
              />
            </label>

            <label className="editor-field content-field">
              <span>正文</span>
              <textarea
                required
                className="content-editor"
                rows={18}
                value={draft.content}
                placeholder="粘贴或编写完整正文。第一版按纯文本安全显示，保留换行。"
                onChange={(event) => patchDraft({ content: event.target.value })}
              />
            </label>
          </section>

          <section className="editor-section copy-payload-section">
            <div className="editor-section-head">
              <div>
                <p className="section-label">Copy Payload</p>
                <h2>一键复制内容</h2>
                <p>适合提示词、模板、清单或练习题。填写后会在正文阅读区内以内嵌可复制块展示。</p>
              </div>
              <span className="metadata-pill">可选</span>
            </div>

            <label className="editor-field">
              <span>按钮文案</span>
              <input
                value={draft.copyLabel}
                placeholder="例如：复制提示词 / 复制模板 / 复制清单"
                onChange={(event) => patchDraft({ copyLabel: event.target.value })}
              />
            </label>

            <label className="editor-field content-field">
              <span>复制内容</span>
              <textarea
                className="content-editor copy-payload-editor"
                rows={10}
                value={draft.copyText}
                placeholder="这里填写真正要一键复制使用的内容。正文负责说明，复制内容负责拿来就用。"
                onChange={(event) => patchDraft({ copyText: event.target.value })}
              />
            </label>
          </section>
        </main>

        <aside className="editor-side editor-meta-panel">
          <section className="editor-meta-section">
            <div className="editor-section-head compact-head">
              <div>
                <p className="section-label">Metadata</p>
                <h2>分类</h2>
              </div>
            </div>

            <label className="editor-field">
              <span>领域</span>
              <select
                required
                value={draft.domain}
                onChange={(event) => patchDraft({ domain: event.target.value as CardDraft['domain'] })}
              >
                {CARD_DOMAINS.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </label>

            <label className="editor-field">
              <span>类型</span>
              <select
                required
                value={draft.type}
                onChange={(event) => patchDraft({ type: event.target.value as CardDraft['type'] })}
              >
                {CARD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="editor-field">
              <span>标签</span>
              <TagInput value={draft.tags} onChange={(tags) => patchDraft({ tags })} />
            </label>
          </section>

          <section className="editor-meta-section">
            <div className="editor-section-head compact-head">
              <div>
                <p className="section-label">Directory</p>
                <h2>主目录位置</h2>
              </div>
            </div>

            <label className="editor-field">
              <span>主目录</span>
              <select
                value={draft.primaryDirectoryId ?? ''}
                onChange={(event) => patchDraft({ primaryDirectoryId: event.target.value })}
              >
                <option value="">未设置主目录</option>
                {directoryOptions.map((directory) => (
                  <option key={directory.id} value={directory.id}>
                    {'—'.repeat(directory.depth)} {directory.title}
                  </option>
                ))}
              </select>
            </label>

            <p className="editor-help-text">
              {draft.primaryDirectoryId
                ? `当前位置：${formatDirectoryPath(directories, draft.primaryDirectoryId)}`
                : '建议给每张卡一个稳定主位置，专题集只负责复用和成册。'}
            </p>
          </section>

          <section className="editor-meta-section">
            <div className="editor-section-head compact-head">
              <div>
                <p className="section-label">Validity</p>
                <h2>时效与权重</h2>
              </div>
            </div>

            <label className="editor-field">
              <span>时效</span>
              <select
                value={draft.validity}
                onChange={(event) =>
                  patchDraft({ validity: event.target.value as CardDraft['validity'] })
                }
              >
                {CARD_VALIDITIES.map((validity) => (
                  <option key={validity} value={validity}>
                    {validity}
                  </option>
                ))}
              </select>
            </label>

            <label className="editor-field">
              <span>重要程度</span>
              <input
                type="number"
                min={1}
                max={5}
                value={draft.importance}
                onChange={(event) =>
                  patchDraft({
                    importance: Math.min(5, Math.max(1, Number(event.target.value))) as CardDraft['importance'],
                  })
                }
              />
            </label>

            <div className="editor-switch-stack">
              <label className="checkbox-row editor-switch-row">
                <input
                  type="checkbox"
                  checked={draft.favorite}
                  onChange={(event) => patchDraft({ favorite: event.target.checked })}
                />
                <span>收藏</span>
              </label>

              <label className="checkbox-row editor-switch-row">
                <input
                  type="checkbox"
                  checked={draft.printable}
                  onChange={(event) => patchDraft({ printable: event.target.checked })}
                />
                <span>可打印</span>
              </label>

              <label className="checkbox-row editor-switch-row">
                <input
                  type="checkbox"
                  checked={draft.archived}
                  onChange={(event) => patchDraft({ archived: event.target.checked })}
                />
                <span>归档</span>
              </label>
            </div>
          </section>

          <section className="editor-meta-section">
            <div className="editor-section-head compact-head">
              <div>
                <p className="section-label">Source</p>
                <h2>来源</h2>
              </div>
            </div>

            <label className="editor-field">
              <span>来源</span>
              <input
                value={draft.source}
                placeholder="例如：ChatGPT / 网页 / 个人总结"
                onChange={(event) => patchDraft({ source: event.target.value })}
              />
            </label>

            <label className="editor-field">
              <span>来源链接</span>
              <input
                type="url"
                value={draft.sourceUrl}
                placeholder="https://..."
                onChange={(event) => patchDraft({ sourceUrl: event.target.value })}
              />
            </label>
          </section>
        </aside>
      </section>
    </form>
  );
}
