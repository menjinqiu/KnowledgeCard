# KnowledgeCard Next Session Prompt

Copy this prompt into a fresh ChatGPT/CodexPro session to continue the project without relying on previous chat memory.

```text
你现在接管我的本地项目 KnowledgeCard。不要依赖任何聊天历史，必须从项目文件和文档重新确认真实状态。

项目路径：
/Users/menjinqiu/work/codex_workspace/KnowledgeCard

一、必须先读取的 canonical 文档

请按顺序读取：

1. PROJECT_BRIEF.md
2. ARCHITECTURE.md
3. DECISION_LOG.md
4. CURRENT_STATE.md
5. NEXT_SESSION_PROMPT.md
6. QA_CHECKLIST.md
7. README.md

旧文档只作为历史 / 补充参考，不能覆盖根目录 canonical 文档：

8. docs/PROJECT_CONTEXT_LONG_TERM.md
9. docs/NEXT_SESSION_HANDOFF.md
10. DESIGN.md
11. docs/UI_STYLE_DECISIONS.md
12. docs/UI_ACCEPTANCE_CHECKLIST.md

打印视觉系统相关文档：

13. docs/PRINT_VISUAL_SYSTEM_PHASE_A.md

二、接管后先输出

请先输出：

1. 你理解的项目长期目标。
2. 当前已验证事实。
3. 当前推断。
4. 待确认事项。
5. 当前最大风险。
6. 不应触碰的边界。
7. 下一步第一件事。

三、当前真实状态

项目基本信息：

```text
Project: KnowledgeCard
Path: /Users/menjinqiu/work/codex_workspace/KnowledgeCard
Git: 当前 workspace 已初始化为 git 仓库，main 跟踪 origin/main（https://github.com/menjinqiu/KnowledgeCard.git）。审查变更优先用 CodexPro.show_changes，不要用 bash git status/diff。
Stack: Vite 6 + React 19 + TypeScript 5.7 + Dexie 4 + IndexedDB + plain CSS
Routing: manual hash routing
Dev: npm run dev，127.0.0.1:5175
Build: npm run build
```

Dexie 当前 schema：

```text
version 5
cards
collections
directories
meta
syncStates
recoverySnapshots
```

已实现核心能力：

```text
卡片库
搜索 / 筛选 / 排序
卡片详情
卡片编辑
copyLabel / copyText
详情页 inline copy block
专题集 collections
Quick Access 系统集合
Knowledge Spaces / directories
目录浏览 / 修改模式
目录内卡片置顶和排序
批量主目录 / flags 操作
JSON 导入导出
粘贴 JSON 导入
GPT 卡片导入工作流
打印中心
手动同步包
绑定同步文件 MVP
同步计划
同步 preflight
非冲突同步草案 apply
Data Management 同步主界面已简化为：生成同步文件 / 绑定同步文件 / 立即同步
立即同步会先只读对账，有阻塞/冲突时不写入，无冲突时走现有 guarded apply
请求持久存储、设备名称、手动恢复快照、恢复入口已降级到高级本地安全 / 故障恢复
导出同步包已降级为备份区里的旧式手动同步包兼容入口，不再作为主同步路径
before-import / before-restore / before-one-click-sync 快照
同步失败后的 IndexedDB rollback 逻辑
```

GPT 导入工作流已实现：

```text
复制通用 GPT 卡片生成提示词
插入通用 KnowledgeCard v1 JSON 骨架
复制 JSON 骨架
显示 domain / type / validity 固定枚举
显示导入校验提示
导入预览写入 / 跳过 / 无效统计
导入预览代表明细
通用知识卡 / 学习流程卡 / 提示词卡 / QA 记录卡 / 决策卡骨架
每类模板卡有两个动作：插入骨架 / 复制定向提示词
```

打印体验已实现：

```text
Print Center 支持 page-per-card / compact continuous
Print Center 支持 cover / TOC / summary / tags / source / copyText 显示开关
Print Center 显示预估页数
PrintPreview 会把 card.copyText 渲染为独立 reusable-content block
compact 模式下不再每卡强制分页
单卡详情页支持打印内容选项：summary / tags / source / copyText
单卡详情页 copyText 通过 print-only 区块打印，屏幕 copy widget 保持 no-print
src/styles/print.css 已重构为温润纸面视觉系统
docs/PRINT_VISUAL_SYSTEM_PHASE_A.md 已保存打印视觉系统设计方案
```

打印视觉方向：

```text
目标不是网页截图，而是温润的现代学习手册。
黑白灰为主体，低饱和色只用于强调。
A4 边距更舒展。
正文宽度受控。
封面、目录、卡片标题、摘要、正文、copyText、页脚都已重新建立纸面层级。
```

重要澄清：

```text
Print Center 当前仍然使用 card.printable 过滤候选卡片。
“弱化 / 移除 printable 作为打印入口门槛”只是讨论过，没有实现。
不要写成已完成。
```

四、最近一次严格交接补落盘状态

2026-06-27 已重新执行严格接管检查：

```text
PASS: CodexPro 可打开 /Users/menjinqiu/work/codex_workspace/KnowledgeCard
PASS: 确认当前 workspace 已初始化 git，main 跟踪 origin/main；审查变更用 CodexPro.show_changes
PASS: 已按顺序读取 canonical 文档
PASS: 已读取旧文档和 docs/PRINT_VISUAL_SYSTEM_PHASE_A.md
PASS: 已抽查 package.json、src/db/db.ts、PrintCenterPage、PrintPreview、CardDetail、DetailPage、print.css、gptImportWorkflowService.ts
PASS: 确认 Print Center 仍按 card.printable 过滤候选卡片
PASS: src/ 静态搜索未发现 dangerouslySetInnerHTML / TODO / FIXME / mock / stub / stage6.css.tmp 引用
PASS: src/ 静态搜索未发现 BroadcastChannel / setInterval 使用
PASS: CURRENT_STATE.md 已补写严格交接真实状态
PASS: NEXT_SESSION_PROMPT.md 已重写为新会话可直接复制使用
PASS: DECISION_LOG.md 已补写 D-016：打印输出应是设计过的学习手册，不是网页截图
```

上一轮中断原因必须保留记录：

```text
上一轮最后一次尝试中 CodexPro 出现连续 502，导致：
未能重新执行最终 npm run build
未能完成 show_changes
未能完成 TODO/mock/stub 静态搜索
未能把本次严格交接内容落盘写入 CURRENT_STATE.md / NEXT_SESSION_PROMPT.md
未能补写 DECISION_LOG.md 的打印视觉系统决策 D-016
```

五、当前未完成 / 待验证事项

必须明确区分：

```text
NOT RUN: Chrome 系统打印预览 QA
NOT RUN: 另存 PDF 验证
NOT RUN: 真实 A4 打印验证
NOT RUN: rollback after forced bound-file write failure QA
```

2026-06-27 本轮尝试进入打印 QA，但当前可用工具缺少浏览器控制接口，无法打开 Chrome 系统打印预览或另存 PDF；因此打印 QA 仍保持 NOT RUN。

当前这次交接刷新后的最终验证记录：

```text
PASS: npm run build
PASS: ✓ 78 modules transformed
PASS: ✓ built in 1.24s
COMPLETED: CodexPro.show_changes
NOTE: 当前有未提交变更：src/pages/DataManagementPage.tsx、src/styles/data-management.css、CURRENT_STATE.md、NEXT_SESSION_PROMPT.md。
```

同步仍未实现：

```text
自动轮询 / 文件监听
浏览器 tab 关闭后的后台同步
base/local/remote 三方合并
tombstone 删除语义
diff 冲突解决 UI
多标签 writer lock / BroadcastChannel 协调
外部 sync 文件部分写入损坏自动恢复
```

六、当前最大风险

打印最大风险：

```text
打印 CSS 已重构，但没有经过真实 Chrome 打印预览 / PDF / A4 纸面验收。
不要把 npm run build 当作打印 QA。
不要继续盲调 print.css，必须先看真实打印预览。
```

同步最大风险：

```text
绑定同步文件读取预览、只读计划、disposable remote-add apply 成功路径已完成真实浏览器 QA；但 rollback 路径仍未验证。
不要用真实主力数据测试 rollback。
```

七、下一步第一件事

当前刚完成同步界面简化。下一步第一优先级是浏览器 QA 这个同步主流程；打印 QA 仍然重要，但排在同步 UI QA 之后。

```text
1. 运行 npm run build，确认仍 PASS。
2. 启动 npm run dev。
3. 打开 #/data。
4. 确认“多设备同步”区域主流程只突出：生成同步文件、绑定同步文件、立即同步。
5. 确认未绑定同步文件时，“立即同步”不可点击。
6. 使用 disposable 同步文件测试“生成同步文件”或“绑定同步文件”。不要用真实主力数据做破坏性测试。
7. 点击“查看同步详情 / 问题诊断”，确认只读检查差异和从同步文件预览导入仍可用。
8. 对无冲突 disposable 文件测试“立即同步”：应先对账，再安全合并，成功后显示同步结果。
9. 对有阻塞/冲突的文件测试“立即同步”：应拒绝写入并展开同步详情。
10. 记录 PASS / FAIL / NOT RUN。
11. 修复后运行 npm run build。
12. 更新 CURRENT_STATE.md 和 NEXT_SESSION_PROMPT.md。
13. 同步 UI QA 稳定后，再进入 #/print 的 Chrome 打印预览 / PDF QA。
```

八、禁止事项

```text
不要凭聊天历史推进。
审查变更不要用 bash git status/diff，优先用 CodexPro.show_changes。提交/推送只有在用户明确要求时再做。
不要把“讨论过/设计过”写成“已实现”。
不要把“构建通过”写成“浏览器 QA 通过”。
不要继续盲调 print.css，必须先看真实打印预览。
不要把 printable 弱化写成已完成；当前 Print Center 仍使用 printable 过滤。
不要用真实主力数据直接测试 sync apply 或 rollback。
不要实现自动轮询/监听/后台同步，除非手动 bound-file apply 和 rollback 路径已完成浏览器 QA。
不要实现 diff 冲突 UI，除非 preflight/apply/rollback QA 已稳定。
不要删除旧 docs 或 stage6.css.tmp，除非用户明确批准。
不要添加 backend、login、account sync、direct cloud API sync、PDF 生成库、大 UI 框架、不安全 HTML 渲染。
```

九、验收标准

交接补落盘验收：

```text
CURRENT_STATE.md 区分已实现 / 已构建 / 已浏览器 QA / NOT RUN。
NEXT_SESSION_PROMPT.md 可以直接复制到新会话使用。
DECISION_LOG.md 只记录重大决策，不当日常 changelog。
npm run build PASS。
show_changes 完成。
明确记录 CodexPro 502 导致上一轮交接未完全落盘。
```

打印 QA 验收：

```text
Chrome 系统打印预览完成。
另存 PDF 完成。
每卡一页和 compact continuous 都检查。
summary / tags / source / copyText 开关有效。
长 copyText 正常换行。
长正文跨页没有明显灾难性空白。
纸面颜色以黑白灰为主，低饱和强调色克制。
最终结果适合学习、复习、长期保存。
```
```
