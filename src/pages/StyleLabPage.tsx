export function StyleLabPage() {
  return (
    <div className="style-lab-page">
      <section className="page-head compact">
        <div>
          <p className="eyebrow">Design System Preview</p>
          <h1>Style Lab</h1>
          <p>验证 KnowledgeCard 的基础视觉语言、组件层级、信息密度和打印手册方向。</p>
        </div>
        <div className="action-row">
          <button className="primary-button">Primary</button>
          <button className="secondary-button">Secondary</button>
          <button className="text-button">Ghost</button>
          <button className="danger-button">Danger</button>
        </div>
      </section>

      <section className="style-lab-grid">
        <aside className="style-lab-sidebar panel-surface">
          <h2>Sidebar</h2>
          <button className="lab-nav-item active">全部卡片</button>
          <button className="lab-nav-item">收藏</button>
          <button className="lab-nav-item">需复核</button>
          <button className="lab-nav-item">打印手册</button>
          <div className="lab-sidebar-group">
            <span>领域</span>
            <button className="lab-nav-item compact">德语</button>
            <button className="lab-nav-item compact">投资</button>
            <button className="lab-nav-item compact">工具</button>
          </div>
        </aside>

        <main className="style-lab-main">
          <section className="lab-section panel-surface">
            <div className="lab-section-head">
              <h2>Top search / command bar</h2>
              <span className="metadata-pill">Command</span>
            </div>
            <div className="lab-command-bar">
              <input value="搜索：A1 听力 / 投资检查清单 / Codex 提示词" readOnly />
              <button className="primary-button">快速收录</button>
              <button className="secondary-button">导入</button>
            </div>
          </section>

          <section className="lab-section panel-surface">
            <div className="lab-section-head">
              <h2>Controls</h2>
              <span className="metadata-pill">Buttons / Inputs / Filters</span>
            </div>
            <div className="lab-control-grid">
              <label>
                Text input
                <input value="KnowledgeCard" readOnly />
              </label>
              <label>
                Search input
                <input value="domain:德语 tag:A1" readOnly />
              </label>
              <label>
                Select / filter
                <select value="需定期复核" onChange={() => undefined}>
                  <option>长期有效</option>
                  <option>需定期复核</option>
                  <option>高时效</option>
                </select>
              </label>
            </div>
            <div className="tag-row">
              <span className="tag-chip">德语</span>
              <span className="tag-chip">A1</span>
              <span className="tag-chip">听力</span>
              <span className="metadata-pill">方案卡</span>
              <span className="metadata-pill warning">高时效</span>
            </div>
          </section>

          <section className="lab-section panel-surface">
            <div className="lab-section-head">
              <h2>Cards</h2>
              <span className="metadata-pill">Normal / Dense / High-value / Archived</span>
            </div>
            <div className="lab-card-stack">
              <article className="lab-card normal">
                <div className="lab-card-title-row">
                  <h3>Normal card：A1 听力专项提高计划</h3>
                  <button className="icon-button active">★</button>
                </div>
                <p>用于保存可反复执行的听力训练方案，强调目标、流程、验收标准和复习节奏。</p>
                <div className="metadata-line">
                  <span>德语</span><span>方案卡</span><span>重要度 5</span><span>长期有效</span><span>更新 2026/06/25</span>
                </div>
                <div className="tag-row"><span className="tag-chip">A1</span><span className="tag-chip">听力</span><span className="tag-chip">精听</span></div>
              </article>

              <article className="lab-card dense">
                <h3>Dense card：短线交易前检查清单</h3>
                <p>入场理由、仓位、止损、事件风险、流动性、隔夜风险。</p>
                <div className="metadata-line"><span>投资</span><span>清单卡</span><span>需定期复核</span></div>
              </article>

              <article className="lab-card high-value">
                <h3>High-value card：给 Codex 的开发提示词模板</h3>
                <p>可直接复制复用，要求独立、自洽、含目标、约束、验收标准和禁止事项。</p>
                <div className="metadata-line"><span>工具</span><span>提示词卡</span><span>重要度 5</span></div>
              </article>

              <article className="lab-card archived">
                <h3>Archived card：旧版本投资判断</h3>
                <p>已归档内容需要降低视觉权重，但在显式筛选时仍可读。</p>
                <div className="metadata-line"><span>投资</span><span>决策卡</span><span>已归档</span></div>
              </article>
            </div>
          </section>

          <section className="lab-section panel-surface">
            <div className="lab-section-head">
              <h2>States</h2>
              <span className="metadata-pill">Empty / Loading / Error / Alert</span>
            </div>
            <div className="lab-state-grid">
              <div className="empty-state">暂无卡片。建议先快速收录一条高价值内容。</div>
              <div className="loading-state">正在读取本地 IndexedDB...</div>
              <div className="error-strip">导入失败：JSON 格式不符合 KnowledgeCard 备份结构。</div>
              <div className="status-strip">导出成功：knowledgecard-backup-20260625-090807.json</div>
            </div>
          </section>

          <section className="lab-section panel-surface">
            <div className="lab-section-head">
              <h2>Reading blocks</h2>
              <span className="metadata-pill">Article / Checklist / Prompt</span>
            </div>
            <article className="reading-block">
              <h3>长文本阅读区</h3>
              <p>阅读区应该安静、宽松、层级清楚。正文适合学习方案、健康处理流程、投资检查清单、职业发展路径等长期复用内容。</p>
              <div className="checklist-block">
                <strong>Checklist block</strong>
                <ul>
                  <li>标题是否明确？</li>
                  <li>执行步骤是否可操作？</li>
                  <li>是否标明时效性和复核要求？</li>
                </ul>
              </div>
              <pre className="prompt-block">{`请基于以下约束生成 Codex 开发提示词：\n1. 目标明确\n2. 输入输出清晰\n3. 验收标准完整\n4. 禁止事项明确`}</pre>
            </article>
          </section>
        </main>

        <aside className="style-lab-detail panel-surface">
          <h2>Detail panel</h2>
          <p className="muted-text">右侧详情栏用于预览卡片、编辑元数据、查看打印预览。后续壳层重构时应迁移为 360px - 460px 可折叠面板。</p>
          <div className="detail-mini-card">
            <h3>V2 动词第二位规则</h3>
            <div className="metadata-line"><span>德语</span><span>知识卡</span><span>长期有效</span></div>
            <p>变位动词在德语陈述句中位于第二位。第一成分不是主语时，主语通常紧随变位动词之后。</p>
          </div>

          <div className="manual-preview-block">
            <h3>Manual preview block</h3>
            <p>打印预览应该像正式资料：标题、摘要、正文、来源、更新时间清楚，黑白打印仍可读。</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
