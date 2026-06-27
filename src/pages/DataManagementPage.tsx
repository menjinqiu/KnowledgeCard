import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { getAllCards } from '../services/cardService';
import { getAllCollections } from '../services/collectionService';
import { getAllDirectories } from '../services/directoryService';
import {
  bindExistingSyncFile,
  createAndBindSyncFile,
  isBoundSyncFileSupported,
  readBoundSyncFileText,
  writeLocalDataToBoundSyncFile,
} from '../services/boundSyncFileService';
import {
  exportFullBackupToJsonFile,
  exportSyncPackageToJsonFile,
  importCardsFromJsonFile,
  importCardsFromPastedJsonText,
  previewImportFromJsonFile,
  previewImportFromPastedJsonText,
  type ImportPreview,
  type ImportPreviewAction,
  type ImportResult,
} from '../services/importExportService';
import { SUPPORTED_BACKUP_VERSION } from '../services/backupValidationService';
import {
  createGptImportJsonTemplate,
  createGptImportPromptForTemplate,
  GPT_CARD_IMPORT_PROMPT,
  GPT_IMPORT_SCHEMA_TIPS,
  GPT_IMPORT_TEMPLATE_OPTIONS,
  type GptImportTemplateKind,
} from '../services/gptImportWorkflowService';
import { applyBoundSyncDraft, type SyncApplyResult } from '../services/syncApplyService';
import { generateSyncPlanFromRemoteText, type SyncPlan } from '../services/syncPlanService';
import {
  createRecoverySnapshot,
  getSyncPersistenceOverview,
  listRecoverySnapshots,
  requestBrowserPersistentStorage,
  restoreRecoverySnapshot,
  updateSyncDeviceName,
} from '../services/syncPersistenceService';
import type { BrowserStorageStatus, RecoverySnapshotListItem, RecoverySnapshotSummary, SyncState } from '../types/sync';

type DataManagementPageProps = {
  onNavigate: (path: string) => void;
};

type Notice = {
  type: 'success' | 'error';
  message: string;
};

type DataStats = {
  cards: number;
  collections: number;
  directories: number;
};

type SyncPersistenceState = {
  syncState: SyncState;
  storageStatus: BrowserStorageStatus;
  recoverySummary: RecoverySnapshotSummary;
};

type ImportSource =
  | { type: 'file'; file: File }
  | { type: 'paste'; text: string }
  | { type: 'bound-file'; text: string; fileName: string };

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function formatOptionalBytes(value: number | undefined) {
  return typeof value === 'number' ? formatBytes(value) : '未记录';
}

function formatStorageStatus(status: BrowserStorageStatus | undefined) {
  if (!status) return '读取中';
  if (!status.supported) return '不支持';
  return status.persistent ? '已持久化' : '未持久化';
}

function formatRecoveryReason(reason: string | undefined) {
  if (!reason) return '无';
  const labels: Record<string, string> = {
    manual: '手动创建',
    'before-auto-sync': '自动同步前',
    'before-one-click-sync': '一键同步前',
    'before-conflict-resolution': '冲突解决前',
    'before-import': '导入前',
    'before-restore': '恢复前',
  };
  return labels[reason] ?? reason;
}

function formatBackupDate(value: string) {
  if (!value) return '未记录';
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return value;
  return new Date(value).toLocaleString();
}

function formatImportResult(result: ImportResult) {
  return `卡片新增 ${result.added}，更新 ${result.updated}，跳过 ${result.skipped}；专题集新增 ${result.collectionAdded}，更新 ${result.collectionUpdated}，跳过 ${result.collectionSkipped}；目录新增 ${result.directoryAdded}，更新 ${result.directoryUpdated}，跳过 ${result.directorySkipped}；错误 ${result.errors}`;
}

function hasSkipReasonDetails(result: ImportResult) {
  return (
    result.cardSkippedLocalNewer +
      result.cardSkippedSameTimestamp +
      result.collectionSkippedLocalNewer +
      result.collectionSkippedSameTimestamp +
      result.directorySkippedLocalNewer +
      result.directorySkippedSameTimestamp >
    0
  );
}

function formatEntityType(value: string) {
  const labels: Record<string, string> = {
    card: '卡片',
    collection: '专题集',
    directory: '目录',
  };
  return labels[value] ?? value;
}

function formatSyncPlanAction(value: string) {
  const labels: Record<string, string> = {
    'local-add': '本地新增',
    'remote-add': '远端新增',
    'local-newer': '本地较新',
    'remote-newer': '远端较新',
    same: '两边相同',
    conflict: '需要确认',
  };
  return labels[value] ?? value;
}

function formatPreflightSeverity(value: string) {
  const labels: Record<string, string> = {
    info: '信息',
    warning: '警告',
    blocker: '阻塞',
  };
  return labels[value] ?? value;
}

function formatImportPreviewAction(value: ImportPreviewAction) {
  const labels: Record<ImportPreviewAction, string> = {
    add: '将新增',
    update: '将更新',
    'skip-local-newer': '跳过：本地较新',
    'skip-same-timestamp': '跳过：时间相同',
  };
  return labels[value];
}

function getImportPreviewWriteCount(preview: ImportPreview) {
  return (
    preview.added +
    preview.updated +
    preview.collectionAdded +
    preview.collectionUpdated +
    preview.directoryAdded +
    preview.directoryUpdated
  );
}

function getImportPreviewSkipCount(preview: ImportPreview) {
  return preview.skipped + preview.collectionSkipped + preview.directorySkipped;
}

export function DataManagementPage({ onNavigate }: DataManagementPageProps) {
  const [stats, setStats] = useState<DataStats>({ cards: 0, collections: 0, directories: 0 });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [importSource, setImportSource] = useState<ImportSource | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);
  const [importSafetyConfirmed, setImportSafetyConfirmed] = useState(false);
  const [syncPlan, setSyncPlan] = useState<SyncPlan | null>(null);
  const [syncApplyConfirmed, setSyncApplyConfirmed] = useState(false);
  const [lastSyncApplyResult, setLastSyncApplyResult] = useState<SyncApplyResult | null>(null);
  const [syncPersistence, setSyncPersistence] = useState<SyncPersistenceState | null>(null);
  const [recoverySnapshots, setRecoverySnapshots] = useState<RecoverySnapshotListItem[]>([]);
  const [restoreSnapshotId, setRestoreSnapshotId] = useState('');
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
  const [deviceNameDraft, setDeviceNameDraft] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const reloadStats = async () => {
    const [cards, collections, directories] = await Promise.all([
      getAllCards(),
      getAllCollections(),
      getAllDirectories(),
    ]);
    setStats({ cards: cards.length, collections: collections.length, directories: directories.length });
  };

  const reloadSyncPersistence = async () => {
    const [overview, snapshots] = await Promise.all([
      getSyncPersistenceOverview(),
      listRecoverySnapshots(6),
    ]);
    setSyncPersistence(overview);
    setRecoverySnapshots(snapshots);
    setDeviceNameDraft(overview.syncState.deviceName);
    if (restoreSnapshotId && !snapshots.some((snapshot) => snapshot.id === restoreSnapshotId)) {
      setRestoreSnapshotId('');
      setRestoreConfirmed(false);
    }
  };

  useEffect(() => {
    reloadStats().catch((error) => {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : '读取本地数据统计失败。',
      });
    });
    reloadSyncPersistence().catch((error) => {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : '读取本地持久化状态失败。',
      });
    });
  }, []);

  const handleExport = async () => {
    setNotice(null);
    setIsBusy(true);

    try {
      const filename = await exportFullBackupToJsonFile();
      setNotice({ type: 'success', message: `完整 JSON 备份已导出：${filename}` });
      await reloadStats();
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? `JSON 导出失败：${error.message}` : 'JSON 导出失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleExportSyncPackage = async () => {
    setNotice(null);
    setIsBusy(true);

    try {
      const filename = await exportSyncPackageToJsonFile();
      setNotice({ type: 'success', message: `同步包已导出：${filename}。把它放到另一台设备后，通过导入预览合并。` });
      await reloadStats();
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? `同步包导出失败：${error.message}` : '同步包导出失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateAndBindSyncFile = async () => {
    setNotice(null);
    setIsBusy(true);

    try {
      const fileName = await createAndBindSyncFile();
      await reloadSyncPersistence();
      setNotice({ type: 'success', message: `已创建并绑定同步文件：${fileName}` });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : '创建并绑定同步文件失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleBindExistingSyncFile = async () => {
    setNotice(null);
    setIsBusy(true);

    try {
      const fileName = await bindExistingSyncFile();
      await reloadSyncPersistence();
      setNotice({ type: 'success', message: `已绑定同步文件：${fileName}` });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : '绑定同步文件失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleWriteLocalToBoundFile = async () => {
    setNotice(null);
    setIsBusy(true);

    try {
      const result = await writeLocalDataToBoundSyncFile();
      await reloadSyncPersistence();
      setNotice({ type: 'success', message: `已把当前本地数据写入绑定同步文件：${result.fileName}` });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : '写入绑定同步文件失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handlePreviewBoundSyncFile = async () => {
    setNotice(null);
    setLastImportResult(null);
    setPreview(null);
    setSyncPlan(null);
    setSelectedFile(null);
    setImportSource(null);
    setIsBusy(true);

    try {
      const boundFile = await readBoundSyncFileText();
      const nextPreview = await previewImportFromPastedJsonText(boundFile.text);
      setPreview({ ...nextPreview, fileName: boundFile.fileName, fileSize: boundFile.fileSize });
      setImportSource({ type: 'bound-file', text: boundFile.text, fileName: boundFile.fileName });
      setImportSafetyConfirmed(false);
      await reloadSyncPersistence();
      setNotice({
        type: 'success',
        message: `绑定同步文件预览完成：${nextPreview.parsedCards} 张卡片，${nextPreview.parsedCollections} 个专题集，${nextPreview.parsedDirectories} 个目录。确认后才会写入本地数据。`,
      });
    } catch (error) {
      setPreview(null);
      setImportSource(null);
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : '读取绑定同步文件失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleGenerateSyncPlan = async () => {
    setNotice(null);
    setSyncPlan(null);
    setIsBusy(true);

    try {
      const boundFile = await readBoundSyncFileText();
      const plan = await generateSyncPlanFromRemoteText(boundFile.text);
      setSyncPlan(plan);
      setSyncApplyConfirmed(false);
      setLastSyncApplyResult(null);
      await reloadSyncPersistence();
      setNotice({
        type: 'success',
        message: `同步计划已生成：共 ${plan.items.length} 条记录。本步骤只读不写，不会修改本地或同步文件。`,
      });
    } catch (error) {
      setSyncPlan(null);
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : '生成同步计划失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleApplySyncDraft = async () => {
    if (!syncPlan || !syncApplyConfirmed) return;
    setNotice(null);
    setIsBusy(true);

    try {
      const result = await applyBoundSyncDraft();
      setLastSyncApplyResult(result);
      setSyncApplyConfirmed(false);
      setSyncPlan(null);
      await Promise.all([reloadStats(), reloadSyncPersistence()]);
      setNotice({
        type: 'success',
        message: `同步草案已应用：${result.cards} 张卡片，${result.collections} 个专题集，${result.directories} 个目录；已写入 ${result.writtenFileName}。`,
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : '应用同步草案失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleRequestPersistentStorage = async () => {
    setNotice(null);
    setIsBusy(true);

    try {
      const status = await requestBrowserPersistentStorage();
      await reloadSyncPersistence();
      setNotice({
        type: status.persistent ? 'success' : 'error',
        message: status.persistent
          ? '浏览器已授予持久存储，本地 IndexedDB 被清理的风险会降低。'
          : `浏览器未授予持久存储${status.error ? `：${status.error}` : '。这不代表数据已丢失，但建议定期导出备份。'}`,
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? `请求持久存储失败：${error.message}` : '请求持久存储失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveDeviceName = async () => {
    setNotice(null);
    setIsBusy(true);

    try {
      const updated = await updateSyncDeviceName(deviceNameDraft);
      await reloadSyncPersistence();
      setNotice({ type: 'success', message: `设备名称已保存：${updated.deviceName}` });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : '保存设备名称失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateRecoverySnapshot = async () => {
    setNotice(null);
    setIsBusy(true);

    try {
      const snapshot = await createRecoverySnapshot('manual');
      await reloadSyncPersistence();
      setNotice({
        type: 'success',
        message: `恢复快照已创建：${snapshot.cards.length} 张卡片，${snapshot.collections.length} 个专题集，${snapshot.directories.length} 个目录。`,
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? `创建恢复快照失败：${error.message}` : '创建恢复快照失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleRestoreRecoverySnapshot = async () => {
    if (!restoreSnapshotId || !restoreConfirmed) return;
    setNotice(null);
    setIsBusy(true);

    try {
      const snapshot = await restoreRecoverySnapshot(restoreSnapshotId);
      setRestoreSnapshotId('');
      setRestoreConfirmed(false);
      await Promise.all([reloadStats(), reloadSyncPersistence()]);
      setNotice({
        type: 'success',
        message: `已从恢复快照还原：${snapshot.cards.length} 张卡片，${snapshot.collections.length} 个专题集，${snapshot.directories.length} 个目录。恢复前已自动创建 before-restore 快照。`,
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? `恢复快照失败：${error.message}` : '恢复快照失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handlePreviewFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNotice(null);
    setLastImportResult(null);
    setPreview(null);
    setSelectedFile(file);
    setImportSource(null);
    setIsBusy(true);

    try {
      const nextPreview = await previewImportFromJsonFile(file);
      setPreview(nextPreview);
      setImportSource({ type: 'file', file });
      setImportSafetyConfirmed(false);
      setNotice({
        type: 'success',
        message: `导入预览完成：${nextPreview.parsedCards} 张卡片，${nextPreview.parsedCollections} 个专题集，${nextPreview.parsedDirectories} 个目录。确认后才会写入本地数据。`,
      });
    } catch (error) {
      setSelectedFile(null);
      setImportSource(null);
      setPreview(null);
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : '导入预览失败。',
      });
    } finally {
      setIsBusy(false);
      event.target.value = '';
    }
  };

  const handlePreviewPastedJson = async () => {
    setNotice(null);
    setLastImportResult(null);
    setPreview(null);
    setSelectedFile(null);
    setImportSource(null);
    setIsBusy(true);

    try {
      const nextPreview = await previewImportFromPastedJsonText(pastedJsonText);
      setPreview(nextPreview);
      setImportSource({ type: 'paste', text: pastedJsonText });
      setImportSafetyConfirmed(false);
      setNotice({
        type: 'success',
        message: `粘贴 JSON 预览完成：${nextPreview.parsedCards} 张卡片，${nextPreview.parsedCollections} 个专题集，${nextPreview.parsedDirectories} 个目录。确认后才会写入本地数据。`,
      });
    } catch (error) {
      setPreview(null);
      setImportSource(null);
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : '粘贴 JSON 预览失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  const clearPreview = () => {
    setSelectedFile(null);
    setImportSource(null);
    setPreview(null);
    setLastImportResult(null);
    setImportSafetyConfirmed(false);
  };

  const clearPastedJson = () => {
    setPastedJsonText('');
    clearPreview();
  };

  const copyTextToClipboard = async (text: string, successMessage: string) => {
    setNotice(null);

    try {
      await navigator.clipboard.writeText(text);
      setNotice({ type: 'success', message: successMessage });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? `复制失败：${error.message}` : '复制失败，请手动选中文本复制。',
      });
    }
  };

  const insertGptJsonTemplate = (kind: GptImportTemplateKind = 'general') => {
    const option = GPT_IMPORT_TEMPLATE_OPTIONS.find((item) => item.kind === kind);
    setPastedJsonText(createGptImportJsonTemplate(kind));
    setPreview(null);
    setImportSource(null);
    setSelectedFile(null);
    setLastImportResult(null);
    setImportSafetyConfirmed(false);
    setNotice({ type: 'success', message: `已插入 ${option?.label ?? 'KnowledgeCard'} JSON 骨架。请替换示例内容后再预览。` });
  };

  const confirmImport = async () => {
    if (!importSource || !preview) {
      setNotice({ type: 'error', message: '请先选择 JSON 文件或粘贴 JSON，并完成导入预览。' });
      return;
    }

    if (!importSafetyConfirmed) {
      setNotice({ type: 'error', message: '请先确认你已理解导入会按 ID 和更新时间合并数据。' });
      return;
    }

    setIsBusy(true);
    setNotice(null);

    try {
      await createRecoverySnapshot('before-import');
      const result =
        importSource.type === 'file'
          ? await importCardsFromJsonFile(importSource.file)
          : await importCardsFromPastedJsonText(importSource.text);
      setLastImportResult(result);
      setNotice({ type: 'success', message: `JSON 导入完成：${formatImportResult(result)}；已自动创建导入前恢复快照。` });
      await Promise.all([reloadStats(), reloadSyncPersistence()]);
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : 'JSON 导入失败。',
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="data-page">
      <section className="page-head compact data-head">
        <div>
          <p className="eyebrow">Data Management</p>
          <h1>数据管理</h1>
          <p>集中处理本地 JSON 备份、导入预览和数据安全说明。导入确认前不会写入 IndexedDB。</p>
        </div>
        <div className="action-row">
          <button className="secondary-button" onClick={() => onNavigate('/library')}>
            返回卡片库
          </button>
          <button className="secondary-button" onClick={() => onNavigate('/collections')}>
            专题集
          </button>
          <button className="secondary-button" onClick={handleExportSyncPackage} disabled={isBusy}>
            导出同步包
          </button>
          <button className="primary-button" onClick={handleExport} disabled={isBusy}>
            导出完整备份
          </button>
        </div>
      </section>

      {notice ? (
        <div className={notice.type === 'error' ? 'error-strip' : 'status-strip'}>
          {notice.message}
        </div>
      ) : null}

      <section className="data-stat-grid">
        <div className="manual-stat-card">
          <span>卡片</span>
          <strong>{stats.cards}</strong>
          <small>当前 IndexedDB</small>
        </div>
        <div className="manual-stat-card">
          <span>专题集</span>
          <strong>{stats.collections}</strong>
          <small>当前 IndexedDB</small>
        </div>
        <div className="manual-stat-card">
          <span>目录</span>
          <strong>{stats.directories}</strong>
          <small>固定位置</small>
        </div>
        <div className="manual-stat-card">
          <span>备份版本</span>
          <strong>v{SUPPORTED_BACKUP_VERSION}</strong>
          <small>JSON backup schema</small>
        </div>
      </section>

      <section className="data-layout">
        <main className="data-main panel-surface">
          <section className="data-section gpt-import-workflow">
            <div className="data-section-head">
              <div>
                <p className="section-label">GPT Import Workflow</p>
                <h2>GPT 卡片导入工作流</h2>
                <p>把提示词复制给 GPT，让它只输出 KnowledgeCard JSON；再粘贴到下方预览区。这个流程适合学习流程、提示词、项目决策、QA 记录和术语卡。</p>
              </div>
              <div className="data-section-actions">
                <button
                  className="primary-button"
                  onClick={() => copyTextToClipboard(GPT_CARD_IMPORT_PROMPT, '已复制 GPT 卡片生成提示词。')}
                  disabled={isBusy}
                >
                  复制生成提示词
                </button>
                <button className="secondary-button" onClick={() => insertGptJsonTemplate('general')} disabled={isBusy}>
                  插入通用骨架
                </button>
              </div>
            </div>

            <div className="gpt-workflow-steps">
              <div>
                <span>1</span>
                <b>复制提示词</b>
                <small>把提示词和原始材料一起发给 GPT。</small>
              </div>
              <div>
                <span>2</span>
                <b>只收 JSON</b>
                <small>不要 Markdown 代码块，不要解释文字。</small>
              </div>
              <div>
                <span>3</span>
                <b>粘贴预览</b>
                <small>先预览新增、更新、跳过和无效记录。</small>
              </div>
              <div>
                <span>4</span>
                <b>确认导入</b>
                <small>确认前不会写入 IndexedDB。</small>
              </div>
            </div>

            <div className="gpt-template-grid">
              {GPT_IMPORT_TEMPLATE_OPTIONS.map((option) => (
                <div className="gpt-template-card" key={option.kind}>
                  <div>
                    <b>{option.label}</b>
                    <small>{option.description}</small>
                  </div>
                  <div className="gpt-template-actions">
                    <button className="secondary-button" onClick={() => insertGptJsonTemplate(option.kind)} disabled={isBusy}>
                      插入骨架
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => copyTextToClipboard(createGptImportPromptForTemplate(option.kind), `已复制 ${option.label} 生成提示词。`)}
                      disabled={isBusy}
                    >
                      复制提示词
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="gpt-schema-panel">
              <div>
                <strong>固定枚举</strong>
                <p><b>domain</b>：德语 / 投资 / 健康 / 职业发展 / 生活 / 工具 / 通用</p>
                <p><b>type</b>：方案卡 / 清单卡 / 模板卡 / 练习卡 / 决策卡 / 提示词卡 / 知识卡</p>
                <p><b>validity</b>：长期有效 / 需定期复核 / 高时效 / 已过期</p>
              </div>
              <div>
                <strong>导入校验重点</strong>
                <ul>
                  {GPT_IMPORT_SCHEMA_TIPS.map((tip) => <li key={tip}>{tip}</li>)}
                </ul>
              </div>
            </div>
          </section>

          <section className="data-section">
            <div className="data-section-head">
              <div>
                <p className="section-label">Import Preview</p>
                <h2>导入前预览</h2>
                <p>选择 JSON 文件，或直接粘贴 AI 生成的 KnowledgeCard v{SUPPORTED_BACKUP_VERSION} JSON。系统会先预览，不会立即写入。</p>
              </div>
              <div className="data-section-actions">
                <button
                  className="secondary-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                >
                  选择 JSON 文件
                </button>
                <button className="secondary-button" onClick={clearPreview} disabled={!preview || isBusy}>
                  清空预览
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={handlePreviewFile}
            />

            <div className="paste-json-panel">
              <label className="editor-field">
                <span>粘贴 JSON</span>
                <textarea
                  rows={12}
                  value={pastedJsonText}
                  placeholder="把 AI 生成的完整 KnowledgeCard JSON 粘贴到这里，然后点击预览粘贴内容。"
                  onChange={(event) => {
                    setPastedJsonText(event.target.value);
                    if (importSource?.type === 'paste') {
                      setPreview(null);
                      setImportSource(null);
                    }
                  }}
                />
              </label>
              <div className="paste-json-actions">
                <button
                  className="primary-button"
                  onClick={handlePreviewPastedJson}
                  disabled={isBusy || !pastedJsonText.trim()}
                >
                  预览粘贴内容
                </button>
                <button
                  className="secondary-button"
                  onClick={() => copyTextToClipboard(createGptImportJsonTemplate(), '已复制 KnowledgeCard v1 JSON 骨架。')}
                  disabled={isBusy}
                >
                  复制 JSON 骨架
                </button>
                <button className="secondary-button" onClick={clearPastedJson} disabled={isBusy || !pastedJsonText}>
                  清空粘贴
                </button>
              </div>
            </div>

            {preview ? (
              <div className="import-preview-card">
                <div className="import-preview-head">
                  <div>
                    <h3>{preview.fileName}</h3>
                    <p>
                      {formatBytes(preview.fileSize)} · 备份 v{preview.backupVersion} · 导出时间：{formatBackupDate(preview.exportedAt)}
                    </p>
                    {preview.syncPackageType === 'manual-sync' ? (
                      <p className="sync-preview-meta">
                        同步包 · 来源设备：{preview.syncDeviceName || '未记录'} · 生成时间：{formatBackupDate(preview.syncGeneratedAt || preview.exportedAt)}
                      </p>
                    ) : null}
                  </div>
                  <button className="primary-button" onClick={confirmImport} disabled={isBusy || !importSafetyConfirmed}>
                    已预览，确认合并导入
                  </button>
                </div>

                <div className="import-risk-box">
                  <strong>导入安全提示</strong>
                  <p>
                    本次预览预计写入 {getImportPreviewWriteCount(preview)} 条，跳过 {getImportPreviewSkipCount(preview)} 条，无效 {preview.errors} 条。
                    导入不会整库清空；系统会按 ID 合并。只有导入记录的 `updatedAt` 晚于本地记录时，才会覆盖本地同 ID 记录。
                    同步包也使用同一套规则，适合在两台设备之间手动合并。导入前建议先导出完整备份。
                  </p>
                  <label>
                    <input
                      type="checkbox"
                      checked={importSafetyConfirmed}
                      onChange={(event) => setImportSafetyConfirmed(event.target.checked)}
                    />
                    我已查看预览统计，并理解本次导入会合并 cards / collections / directories。
                  </label>
                </div>

                <div className="import-preview-grid">
                  <div>
                    <span>卡片新增</span>
                    <strong>{preview.added}</strong>
                  </div>
                  <div>
                    <span>卡片更新</span>
                    <strong>{preview.updated}</strong>
                  </div>
                  <div>
                    <span>卡片跳过</span>
                    <strong>{preview.skipped}</strong>
                  </div>
                  <div>
                    <span>专题集新增</span>
                    <strong>{preview.collectionAdded}</strong>
                  </div>
                  <div>
                    <span>专题集更新</span>
                    <strong>{preview.collectionUpdated}</strong>
                  </div>
                  <div>
                    <span>专题集跳过</span>
                    <strong>{preview.collectionSkipped}</strong>
                  </div>
                  <div>
                    <span>目录新增</span>
                    <strong>{preview.directoryAdded}</strong>
                  </div>
                  <div>
                    <span>目录更新</span>
                    <strong>{preview.directoryUpdated}</strong>
                  </div>
                  <div>
                    <span>目录跳过</span>
                    <strong>{preview.directorySkipped}</strong>
                  </div>
                  <div>
                    <span>无效记录</span>
                    <strong>{preview.errors}</strong>
                  </div>
                </div>

                {preview.previewItems.length > 0 ? (
                  <div className="import-preview-list">
                    <div className="import-preview-list-head">
                      <strong>预览明细</strong>
                      <small>仅显示前 {preview.previewItems.length} 条代表记录，完整结果以统计为准。</small>
                    </div>
                    {preview.previewItems.map((item) => (
                      <div className="import-preview-item" key={`${item.entityType}-${item.id}`}>
                        <span>{formatEntityType(item.entityType)} · {formatImportPreviewAction(item.action)}</span>
                        <b>{item.title}</b>
                        <small>{item.reason}</small>
                      </div>
                    ))}
                  </div>
                ) : null}

                {hasSkipReasonDetails(preview) ? (
                  <div className="skip-reason-grid">
                    <div>
                      <span>卡片：本地较新</span>
                      <strong>{preview.cardSkippedLocalNewer}</strong>
                    </div>
                    <div>
                      <span>卡片：时间相同</span>
                      <strong>{preview.cardSkippedSameTimestamp}</strong>
                    </div>
                    <div>
                      <span>专题集：本地较新</span>
                      <strong>{preview.collectionSkippedLocalNewer}</strong>
                    </div>
                    <div>
                      <span>专题集：时间相同</span>
                      <strong>{preview.collectionSkippedSameTimestamp}</strong>
                    </div>
                    <div>
                      <span>目录：本地较新</span>
                      <strong>{preview.directorySkippedLocalNewer}</strong>
                    </div>
                    <div>
                      <span>目录：时间相同</span>
                      <strong>{preview.directorySkippedSameTimestamp}</strong>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="empty-state compact-empty">尚未选择导入文件。预览完成前不会写入任何数据。</div>
            )}

            {lastImportResult ? (
              <div className="status-strip compact-empty">
                最近导入结果：{formatImportResult(lastImportResult)}
              </div>
            ) : null}
          </section>
        </main>

        <aside className="data-side panel-surface">
          <section className="data-section">
            <p className="section-label">Local Safety</p>
            <h2>本地持久化</h2>
            <p>IndexedDB 是主数据库。同步文件不可用不代表本地数据丢失；页面刷新或重启开发服务也不应要求重新导入。</p>

            <div className="sync-safety-card">
              <span>浏览器持久存储</span>
              <strong>{formatStorageStatus(syncPersistence?.storageStatus)}</strong>
              <small>
                已用 {formatOptionalBytes(syncPersistence?.storageStatus.usage)} / 配额 {formatOptionalBytes(syncPersistence?.storageStatus.quota)}
              </small>
              {syncPersistence?.storageStatus.error ? <small>{syncPersistence.storageStatus.error}</small> : null}
            </div>

            <button className="secondary-button" onClick={handleRequestPersistentStorage} disabled={isBusy}>
              请求持久存储
            </button>

            <label className="editor-field compact-field">
              <span>当前设备名称</span>
              <input
                value={deviceNameDraft}
                placeholder="例如 MacBook / Windows Desktop"
                onChange={(event) => setDeviceNameDraft(event.target.value)}
              />
            </label>
            <button className="secondary-button" onClick={handleSaveDeviceName} disabled={isBusy || !deviceNameDraft.trim()}>
              保存设备名称
            </button>

            <div className="sync-safety-card">
              <span>恢复快照</span>
              <strong>{syncPersistence?.recoverySummary.count ?? 0}</strong>
              <small>
                最近：{formatBackupDate(syncPersistence?.recoverySummary.latestCreatedAt ?? '')} · {formatRecoveryReason(syncPersistence?.recoverySummary.latestReason)}
              </small>
            </div>
            <button className="primary-button" onClick={handleCreateRecoverySnapshot} disabled={isBusy}>
              创建恢复快照
            </button>

            <div className="recovery-list">
              <strong>最近恢复快照</strong>
              {recoverySnapshots.length > 0 ? (
                recoverySnapshots.map((snapshot) => (
                  <label className="recovery-item" key={snapshot.id}>
                    <input
                      type="radio"
                      name="recoverySnapshot"
                      checked={restoreSnapshotId === snapshot.id}
                      onChange={() => {
                        setRestoreSnapshotId(snapshot.id);
                        setRestoreConfirmed(false);
                      }}
                    />
                    <span>
                      <b>{formatBackupDate(snapshot.createdAt)}</b>
                      <small>
                        {formatRecoveryReason(snapshot.reason)} · {snapshot.cardCount} 卡片 · {snapshot.collectionCount} 专题集 · {snapshot.directoryCount} 目录
                      </small>
                    </span>
                  </label>
                ))
              ) : (
                <p>暂无恢复快照。</p>
              )}
            </div>

            {restoreSnapshotId ? (
              <div className="restore-confirm-box">
                <label>
                  <input
                    type="checkbox"
                    checked={restoreConfirmed}
                    onChange={(event) => setRestoreConfirmed(event.target.checked)}
                  />
                  我理解恢复会替换当前 cards / collections / directories，恢复前会自动再创建一个快照。
                </label>
                <button
                  className="danger-button"
                  onClick={handleRestoreRecoverySnapshot}
                  disabled={isBusy || !restoreConfirmed}
                >
                  从所选快照恢复
                </button>
              </div>
            ) : null}
          </section>

          <section className="data-section">
            <p className="section-label">Bound File Sync</p>
            <h2>绑定同步文件</h2>
            <p>用于选择坚果云或其他网盘同步目录里的 `knowledgecard-sync.json`。当前只支持手动读写，不会自动覆盖本地数据。</p>

            <div className="sync-safety-card">
              <span>文件访问能力</span>
              <strong>{isBoundSyncFileSupported() ? '支持' : '不支持'}</strong>
              <small>{isBoundSyncFileSupported() ? '可以绑定本地 JSON 文件。' : '当前浏览器不支持 File System Access API，请继续使用手动同步包。'}</small>
            </div>

            <div className="sync-safety-card">
              <span>当前绑定文件</span>
              <strong>{syncPersistence?.syncState.fileName || '未绑定'}</strong>
              <small>模式：{syncPersistence?.syncState.mode === 'file-bound' ? '文件绑定' : '手动同步'}</small>
              <small>最近读取：{formatBackupDate(syncPersistence?.syncState.lastReadRemoteAt ?? '')}</small>
              <small>最近写入：{formatBackupDate(syncPersistence?.syncState.lastWriteRemoteAt ?? '')}</small>
            </div>

            <div className="bound-file-actions">
              <button className="secondary-button" onClick={handleCreateAndBindSyncFile} disabled={isBusy || !isBoundSyncFileSupported()}>
                创建并绑定同步文件
              </button>
              <button className="secondary-button" onClick={handleBindExistingSyncFile} disabled={isBusy || !isBoundSyncFileSupported()}>
                绑定已有同步文件
              </button>
              <button className="secondary-button" onClick={handleWriteLocalToBoundFile} disabled={isBusy || !syncPersistence?.syncState.fileName}>
                写入本地数据到文件
              </button>
              <button className="secondary-button" onClick={handleGenerateSyncPlan} disabled={isBusy || !syncPersistence?.syncState.fileName}>
                生成同步计划
              </button>
              <button className="primary-button" onClick={handlePreviewBoundSyncFile} disabled={isBusy || !syncPersistence?.syncState.fileName}>
                读取文件并预览导入
              </button>
            </div>

            {lastSyncApplyResult ? (
              <div className="sync-apply-result-box">
                <strong>最近同步应用结果</strong>
                <small>
                  {formatBackupDate(lastSyncApplyResult.appliedAt)} · {lastSyncApplyResult.cards} 卡片 · {lastSyncApplyResult.collections} 专题集 · {lastSyncApplyResult.directories} 目录 · 写入 {lastSyncApplyResult.writtenFileName}
                </small>
              </div>
            ) : null}

            {syncPlan ? (
              <div className="sync-plan-panel">
                <strong>同步计划</strong>
                <small>
                  生成时间：{formatBackupDate(syncPlan.generatedAt)} · 远端：{syncPlan.remoteMeta?.deviceName || syncPlan.remoteMeta?.lastWriterDeviceName || '未记录'}
                </small>
                <div className={syncPlan.preflight.canAutoApply ? 'preflight-box safe' : 'preflight-box blocked'}>
                  <b>{syncPlan.preflight.canAutoApply ? '预检通过' : '预检未通过'}</b>
                  <small>
                    阻塞 {syncPlan.preflight.blockerCount} · 警告 {syncPlan.preflight.warningCount}。当前仍为只读计划，不会自动应用。
                  </small>
                  {syncPlan.preflight.issues.map((issue) => (
                    <p key={`${issue.code}-${issue.message}`}>
                      <span>{formatPreflightSeverity(issue.severity)}</span>
                      {issue.message}
                    </p>
                  ))}
                </div>
                <div className="sync-plan-grid">
                  <div><span>本地新增</span><b>{syncPlan.summary['local-add']}</b></div>
                  <div><span>远端新增</span><b>{syncPlan.summary['remote-add']}</b></div>
                  <div><span>本地较新</span><b>{syncPlan.summary['local-newer']}</b></div>
                  <div><span>远端较新</span><b>{syncPlan.summary['remote-newer']}</b></div>
                  <div><span>相同</span><b>{syncPlan.summary.same}</b></div>
                  <div><span>需确认</span><b>{syncPlan.summary.conflict}</b></div>
                </div>
                <div className={syncPlan.applyDraft.canGenerate ? 'apply-draft-box safe' : 'apply-draft-box blocked'}>
                  <b>{syncPlan.applyDraft.canGenerate ? '应用草案可生成' : '应用草案不可直接应用'}</b>
                  <small>草案只读，不会写入本地或同步文件。</small>
                  <div className="sync-plan-grid">
                    <div><span>草案卡片</span><b>{syncPlan.applyDraft.cardCount}</b></div>
                    <div><span>草案专题集</span><b>{syncPlan.applyDraft.collectionCount}</b></div>
                    <div><span>草案目录</span><b>{syncPlan.applyDraft.directoryCount}</b></div>
                    <div><span>采用本地</span><b>{syncPlan.applyDraft.localChosen}</b></div>
                    <div><span>采用远端</span><b>{syncPlan.applyDraft.remoteChosen}</b></div>
                    <div><span>保持相同</span><b>{syncPlan.applyDraft.sameKept}</b></div>
                  </div>
                  {syncPlan.applyDraft.blockers.length > 0 ? (
                    <div className="draft-issue-list">
                      <strong>草案阻塞</strong>
                      {syncPlan.applyDraft.blockers.map((issue) => <p key={issue}>{issue}</p>)}
                    </div>
                  ) : null}
                  {syncPlan.applyDraft.warnings.length > 0 ? (
                    <div className="draft-issue-list">
                      <strong>草案警告</strong>
                      {syncPlan.applyDraft.warnings.map((issue) => <p key={issue}>{issue}</p>)}
                    </div>
                  ) : null}
                  {syncPlan.applyDraft.canGenerate && syncPlan.preflight.blockerCount === 0 ? (
                    <div className="sync-apply-confirm-box">
                      <label>
                        <input
                          type="checkbox"
                          checked={syncApplyConfirmed}
                          onChange={(event) => setSyncApplyConfirmed(event.target.checked)}
                        />
                        我确认要重新读取绑定文件并应用当前非冲突草案。应用前会创建 before-one-click-sync 恢复快照，随后写入 IndexedDB 和绑定同步文件。
                      </label>
                      <button className="danger-button" onClick={handleApplySyncDraft} disabled={isBusy || !syncApplyConfirmed}>
                        应用非冲突草案
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="sync-plan-list">
                  {syncPlan.items.slice(0, 12).map((item) => (
                    <div className="sync-plan-item" key={`${item.entityType}-${item.id}`}>
                      <span>{formatEntityType(item.entityType)} · {formatSyncPlanAction(item.action)}</span>
                      <b>{item.title}</b>
                      <small>{item.reason}</small>
                    </div>
                  ))}
                  {syncPlan.items.length > 12 ? <small>仅显示前 12 条，共 {syncPlan.items.length} 条。</small> : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="data-section">
            <p className="section-label">Manual Sync</p>
            <h2>手动同步包</h2>
            <p>同步包包含 cards、collections 和 directories，并附带来源设备信息。适合放进坚果云、网盘或局域网共享后，在另一台设备导入合并。</p>
            <button className="primary-button" onClick={handleExportSyncPackage} disabled={isBusy}>
              导出同步包
            </button>
            <ol className="data-note-list sync-step-list">
              <li>在当前设备导出同步包。</li>
              <li>把 JSON 文件复制到另一台设备。</li>
              <li>在另一台设备选择文件并预览。</li>
              <li>确认后按 ID + updatedAt 合并。</li>
            </ol>
          </section>

          <section className="data-section">
            <p className="section-label">Export</p>
            <h2>完整备份</h2>
            <p>完整备份更适合长期存档和恢复。它也能被导入合并，但不附带同步来源设备提示。</p>
            <button className="secondary-button" onClick={handleExport} disabled={isBusy}>
              导出完整 JSON
            </button>
          </section>

          <section className="data-section">
            <p className="section-label">Import Files</p>
            <h2>内置可导入文件</h2>
            <ul className="data-note-list">
              <li><code>docs/imports/knowledgecard-generation-prompts.json</code>：卡片生成提示词。</li>
              <li><code>docs/imports/knowledgecard-card-templates.json</code>：卡片模板体系。</li>
              <li><code>docs/imports/knowledgecard-sync-workflow.json</code>：手动同步流程与风险检查。</li>
            </ul>
            <p>这些文件仍需通过导入预览和安全确认后才会写入 IndexedDB。</p>
          </section>

          <section className="data-section">
            <p className="section-label">Schema</p>
            <h2>备份格式说明</h2>
            <ul className="data-note-list">
              <li>当前 JSON 备份格式版本：v{SUPPORTED_BACKUP_VERSION}。</li>
              <li>备份格式版本不同于 Dexie 数据库版本。</li>
              <li>导入按 ID 合并；远端记录更新时间更晚才会覆盖本地记录。</li>
              <li>专题集只保存 cardIds，不会复制卡片内容。</li>
              <li>目录保存为 directories；卡片通过 primaryDirectoryId 指向主目录。</li>
              <li>导入前必须预览并确认，避免误把旧备份合并回当前数据。</li>
            </ul>
          </section>
        </aside>
      </section>
    </div>
  );
}
