# KnowledgeCard Current State

This document records the current, concrete, verifiable state of the project. It was refreshed during the strict handoff on 2026-06-27 after reading the canonical docs, historical docs, print visual system notes, and key source files.

## 1. Canonical Handoff Documents

### Verified Facts

The root-level canonical documents are:

```text
PROJECT_BRIEF.md
ARCHITECTURE.md
DECISION_LOG.md
CURRENT_STATE.md
NEXT_SESSION_PROMPT.md
QA_CHECKLIST.md
README.md
```

Older documents under `docs/` still exist as historical / supplemental references. They must not override root-level canonical documents when they conflict.

Important historical / supplemental documents currently present:

```text
docs/PROJECT_CONTEXT_LONG_TERM.md
docs/NEXT_SESSION_HANDOFF.md
DESIGN.md
docs/UI_STYLE_DECISIONS.md
docs/UI_ACCEPTANCE_CHECKLIST.md
docs/PRINT_VISUAL_SYSTEM_PHASE_A.md
```

`docs/PROJECT_CONTEXT_LONG_TERM.md` and `docs/NEXT_SESSION_HANDOFF.md` are visibly stale in places. For example, the historical long-term context still describes an older Dexie version/table set. Treat it as implementation history only.

## 2. Project Identity and Runtime

### Verified Facts

```text
Project: KnowledgeCard
Path: /Users/menjinqiu/work/codex_workspace/KnowledgeCard
Git: initialized repository on main; tracks origin/main at https://github.com/menjinqiu/KnowledgeCard.git. Use CodexPro.show_changes for review instead of bash git status/diff.
Type: local-first browser knowledge-card app
Stack: Vite 6 + React 19 + TypeScript 5.7 + Dexie 4 + IndexedDB + plain CSS
Routing: manual hash routing in src/app/App.tsx
```

Verified scripts from `package.json`:

```bash
npm run dev      # vite --host 127.0.0.1 --port 5175
npm run build    # tsc -b && vite build
npm run preview  # vite preview --host 127.0.0.1
```

Runtime dependencies remain local/browser-only:

```text
react
react-dom
dexie
```

No backend, login, account system, PDF generation library, direct cloud API sync, or large UI framework is present in `package.json`.

## 3. Current File Structure Snapshot

Important current directories/files verified from the workspace tree:

```text
docs/
  AUTO_SYNC_DESIGN.md
  CARD_TEMPLATE_SYSTEM.md
  PRINT_VISUAL_SYSTEM_PHASE_A.md
  SYNC_WORKFLOW.md
  imports/
  test-data/sync/

src/
  app/App.tsx
  components/CardDetail.tsx
  components/PrintPreview.tsx
  db/db.ts
  pages/DataManagementPage.tsx
  pages/DetailPage.tsx
  pages/DirectoryPage.tsx
  pages/PrintCenterPage.tsx
  services/
    backupValidationService.ts
    boundSyncFileService.ts
    cardService.ts
    collectionService.ts
    directoryService.ts
    gptImportWorkflowService.ts
    importExportService.ts
    syncApplyService.ts
    syncPersistenceService.ts
    syncPlanService.ts
  styles/
    data-management.css
    directory.css
    print-center.css
    print.css
    stage6.css.tmp
  types/
    card.ts
    sync.ts
```

`src/styles/stage6.css.tmp` still exists. Static source search found no current `src/` reference to it. Do not delete it unless cleanup is explicitly approved.

## 4. Current Data Model

### Verified From `src/db/db.ts`

Dexie database name:

```text
knowledgeCardDb
```

Current Dexie schema version:

```text
version 5
```

Current tables:

```text
cards
collections
directories
meta
syncStates
recoverySnapshots
```

Important card fields include:

```text
copyLabel
copyText
primaryDirectoryId
directorySortOrder
favorite
printable
archived
createdAt
updatedAt
```

Synchronization support includes:

```text
syncStates          device identity, mode, file binding metadata, timestamps
recoverySnapshots   cards / collections / directories snapshots for rollback and restore
```

`SyncState.fileHandle` may store a browser-granted `FileSystemFileHandle` where supported. Permission can still be lost or require re-approval after browser restart.

## 5. Implemented Product Capabilities

### Build-backed / Source-verified Capabilities

Core app:

- Dashboard.
- Card library with search / filter / sort.
- Card create / edit / detail.
- Safe Markdown-lite rendering.
- One primary reusable copy payload per card through `copyLabel` / `copyText`.
- Inline copy block in card detail flow.
- Collections / topic sets.
- Quick Access implemented as a system collection and virtual Knowledge Space node.
- Knowledge Spaces / directories.
- Directory browse / edit mode separation.
- Card pinning and ordering inside directory edit mode.
- Batch operations for primary directory and card flags.
- JSON export / import and pasted JSON import.
- Import preview and safety confirmation.
- Directory import safety guard.

GPT card import workflow:

- `src/services/gptImportWorkflowService.ts` exists.
- Data Management includes a GPT card import workflow.
- The workflow supports copying a general GPT card-generation prompt.
- The workflow supports inserting / copying a valid KnowledgeCard v1 JSON skeleton.
- The workflow displays fixed enum guidance for domain / type / validity.
- The workflow displays import validation tips.
- The workflow includes skeletons for general knowledge card, learning flow card, prompt card, QA record card, and decision card.
- Each template type has two actions: insert JSON skeleton and copy type-specific GPT prompt.
- Existing preview-confirm-import safety flow remains; inserting / copying a prompt or skeleton does not write IndexedDB.

Print center and print output:

- Print Center supports `page-per-card` and `compact` layout modes.
- Print Center supports cover / TOC / summary / tags / source / copyText display toggles.
- Print Center shows estimated page count.
- PrintPreview renders `card.copyText` as a dedicated `manual-copy-block` when enabled.
- Compact mode no longer forces `manual-card` page breaks after every card.
- Single-card detail page supports print options for summary / tags / source / copyText.
- Single-card detail page keeps the screen inline copy widget `no-print` and renders print copyText through a `print-only` section.
- `src/styles/print.css` has been refactored into a warm paper-oriented visual system using `--print-*` tokens.
- `docs/PRINT_VISUAL_SYSTEM_PHASE_A.md` records the Phase A print visual system plan and constraints.

Important clarification:

```text
Print Center still filters candidate cards by card.printable.
Weakening or removing printable as a print-entry gate was only discussed. It is not implemented.
```

Manual sync and bound-file sync:

- Export manual sync package JSON with `syncMeta.packageType = manual-sync`.
- Import sync packages through existing preview / safety confirmation / ID + updatedAt merge.
- Preview skip reasons for local-newer and same-timestamp skips.
- Sync workflow documentation and importable sync workflow cards exist.
- Fixed sync QA fixtures exist under `docs/test-data/sync/`.
- Browser persistent-storage status read/request exists in Data Management.
- Stable device identity and editable device name exist.
- Recovery snapshots table exists.
- Manual recovery snapshot creation / list / restore exists.
- `before-import` snapshot exists before confirmed import.
- `before-restore` snapshot exists before restoring a snapshot.
- Bound sync file MVP exists where File System Access API is supported:
  - create and bind `knowledgecard-sync.json`;
  - bind existing sync file;
  - write local data to bound file;
  - read bound file and preview import.
- Sync plan generator exists for local IndexedDB vs bound sync file.
- Sync preflight with blockers / warnings exists.
- Read-only apply draft preview exists.
- Confirmed apply of non-conflict sync draft exists.
- `before-one-click-sync` snapshot exists before applying sync draft.
- Automatic IndexedDB rollback exists if bound-file write fails after local IndexedDB write.
- Data Management sync UI is now simplified around three main user actions: generate sync file, bind sync file, and immediate sync.
- Immediate sync internally reads the bound file, generates a safety plan, blocks on blockers/conflicts, applies safe non-conflict changes, writes IndexedDB and the bound sync file, and keeps the snapshot/rollback guard.
- Advanced sync details are still available for read-only difference checking and sync-file import preview, but are no longer the main user path.
- Persistent storage request, device name editing, manual recovery snapshot creation, and restore controls are now treated as advanced local-safety / failure-recovery tools, not daily workflow actions.
- Manual sync-package export is now a legacy/fallback compatibility path under Backup, not the main “generate sync file” action.

## 6. Key Implementation Details Verified From Source

`src/pages/PrintCenterPage.tsx`:

- Uses `cards.filter((card) => card.printable)` to create `printableCards`.
- Directory and collection print flows only select printable cards.
- Supports `layoutMode`, `showCover`, `showToc`, `showSummary`, `showTags`, `showSource`, and `showCopyText` settings.
- Calculates estimated pages based on selected card count, section count, cover, TOC, and layout mode.

`src/components/PrintPreview.tsx`:

- Supports grouping by domain, type, or none.
- Renders optional cover and TOC.
- Renders each card with metadata, tags, summary, MarkdownLite content, optional copyText block, and footer.
- Uses `manual-layout-page-per-card` and `manual-layout-compact` class names.

`src/components/CardDetail.tsx` and `src/pages/DetailPage.tsx`:

- Single-card print options exist for summary / tags / source / copyText.
- Screen copy block remains `no-print`.
- Print copyText block is rendered as `print-only` when enabled.

`src/styles/print.css`:

- Defines A4 `@page` margins.
- Defines `--print-*` tokens.
- Hides app chrome and screen-only controls in print.
- Uses constrained reading width.
- Styles cover, TOC, section header, card header, summary, Markdown body, copyText, and footer.
- Compact mode reduces body size, spacing, and removes forced per-card page breaks.

`src/pages/DataManagementPage.tsx`:

- Sync main path now exposes generate sync file / bind sync file / immediate sync.
- `handleImmediateSync()` reads the bound file, generates a sync plan, refuses to write when blockers or conflicts exist, and applies safe changes through `applyBoundSyncDraft()`.
- Sync detail panel keeps read-only difference checking and sync-file import preview as advanced diagnostics.
- Legacy lower-level sync functions remain available in code because they are used by diagnostics and the immediate sync flow.

`src/services/gptImportWorkflowService.ts`:

- Provides reusable GPT generation prompt.
- Provides KnowledgeCard v1 JSON skeleton generation.
- Provides type-specific template prompts.
- Provides import schema tips.

## 7. Explicitly Not Implemented Yet

Verified / recorded as not completed:

- No automatic polling / listener for bound sync file changes.
- No browser-tab-closed background sync.
- No full base/local/remote three-way merge.
- No tombstone delete semantics.
- No diff conflict resolution UI.
- No multi-tab writer lock / BroadcastChannel coordination.
- No automatic recovery of an external sync file if browser/file-system layer partially writes or corrupts it.
- No backend, login, account system, direct cloud API integration, or SaaS sync.
- No PDF generation dependency.
- No large UI framework.

## 8. Current Known Risks

### Highest Current Product Risk

The print CSS has been substantially refactored into a warm modern learning-manual visual system, but it has not yet been verified through the real Chrome system print preview, save-as-PDF, or physical A4 paper output.

Do not claim print QA has passed until these are actually done.

### Highest Current Sync Risk

Rollback after a forced bound-file write failure is still not browser-QA verified. Read-only bound-file preview, read-only plan generation, and disposable remote-add apply success path have been browser-QA tested in earlier work, but rollback must not be trusted with real primary data until tested against a disposable bound file and isolated origin/profile.

### Other Risks

- File System Access API support and file-handle persistence are browser-dependent.
- Permission loss may require rebind/reconnect.
- Current two-way sync cannot distinguish true additions from deletions because tombstones are not implemented.
- Many UI workflows are build-backed but not fully browser-QA verified.

## 9. Verification Status

### Earlier Recorded Build Results

Earlier handoff records mention successful builds after GPT import workflow and print visual work, including a latest recorded print-pass build:

```text
npm run build
PASS
✓ 78 modules transformed
✓ built in 1.03s
```

However, the strict handoff before this refresh was interrupted by repeated CodexPro 502 errors. Because of that, the following were not completed in that previous attempt:

```text
NOT RUN: final npm run build after strict handoff
NOT RUN: show_changes after strict handoff
NOT RUN: TODO/mock/stub static search after strict handoff
NOT RUN: writing the strict handoff state into CURRENT_STATE.md / NEXT_SESSION_PROMPT.md
NOT RUN: adding DECISION_LOG.md decision D-016 for the print visual system
```

### Current Strict Handoff Refresh on 2026-06-27

Completed in this refresh before build:

```text
PASS: Reconfirmed CodexPro could open /Users/menjinqiu/work/codex_workspace/KnowledgeCard.
PASS: Confirmed workspace is not a git repository.
PASS: Read the root canonical documents in order.
PASS: Read the historical/supplemental docs listed in the handoff request.
PASS: Read docs/PRINT_VISUAL_SYSTEM_PHASE_A.md.
PASS: Inspected package.json, src/db/db.ts, PrintCenterPage, PrintPreview, CardDetail, DetailPage, print.css, and gptImportWorkflowService.ts.
PASS: Confirmed Print Center still filters by card.printable.
PASS: Static src/ search found no dangerouslySetInnerHTML / TODO / FIXME / mock / stub / stage6.css.tmp reference.
PASS: Static src/ search found no BroadcastChannel or setInterval usage.
```

Current-session final build after this document refresh:

```text
npm run build
PASS
✓ 78 modules transformed
✓ built in 1.03s
```

This verifies TypeScript/Vite build after the strict handoff documentation refresh. It does not replace browser QA.

### Sync UX Simplification Pass on 2026-06-27

```text
PASS: Simplified Data Management sync UI into three primary actions: generate sync file, bind sync file, immediate sync.
PASS: Added immediate sync handler that performs read-only planning first, blocks on blockers/conflicts, and applies safe changes through the existing guarded apply service.
PASS: Moved read-only difference checking and sync-file import preview into an advanced sync detail panel.
PASS: Demoted persistent storage request, device name, manual recovery snapshot creation, and recovery restore into advanced Local Safety / failure-recovery controls.
PASS: Removed the prominent sync-package export button from the page head and moved manual sync-package export into Backup as a legacy/fallback compatibility path.
PASS: Kept recovery snapshots and rollback path intact; no Dexie schema change and no sync algorithm rewrite.
npm run build
PASS
✓ 78 modules transformed
✓ built in 1.24s
```

PASS: Fixed sync completeness safeguards after user reported incomplete sync symptoms: Quick Access empty auto-created local system collection no longer overrides a non-empty remote Quick Access collection.
PASS: Added sync preflight/apply-draft blocker when cards reference missing directories, preventing directory-page invisible cards after sync.
PASS: Added the same card-directory-reference safety check to normal JSON preview/import so the advanced import path cannot bypass the sync guard.
npm run build
PASS
✓ 78 modules transformed
✓ built in 1.05s

NOT RUN: Browser QA for the simplified sync UI and immediate-sync button.
NOT RUN: Browser QA for Quick Access recovery / missing-directory blocker scenarios.

Current-session show_changes after this document refresh:

```text
CodexPro.show_changes
COMPLETED
status: fatal: not a git repository (or any of the parent directories): .git
changed_files: []
```

Because the workspace is not a git repository, `show_changes` cannot provide a normal git diff. Use the CodexPro write/edit tool diffs from this session as the concrete change record.

## 10. Print QA Status

The following must remain explicitly NOT RUN until actually verified:

```text
NOT RUN: Chrome system print preview QA.
NOT RUN: Save-as-PDF verification.
NOT RUN: Real A4 paper verification.
```

Current 2026-06-27 attempt:

```text
NOT RUN: Print QA could not be executed in this session because browser automation requires an additional browser-control interface that is not available in the current tool namespace. The available project tool can build, read, write, search, and report workspace changes, but it cannot open Chrome system print preview or save a PDF.
```

Required print QA coverage:

- Open `#/print`.
- Select 3–5 real cards.
- Include cards with summary, without summary, with tags, with source, with copyText, long copyText, and long body.
- Check page-per-card mode.
- Check compact continuous mode.
- Toggle summary / tags / source / copyText switches.
- Open Chrome system print preview.
- Check A4 margins, cover, TOC, title hierarchy, summary, body, copyText, footer.
- Save as PDF.
- Record PASS / FAIL / NOT RUN.

Do not keep tuning `src/styles/print.css` blindly before real print preview inspection.

## 11. Documentation Updates Made During This Strict Handoff Refresh

Updated / intended updates in this refresh:

- `CURRENT_STATE.md`: rewritten to distinguish implemented, build-backed, browser-QA verified, and NOT RUN states.
- `NEXT_SESSION_PROMPT.md`: rewritten to be directly usable in a new session and include the print visual system handoff.
- `DECISION_LOG.md`: should include D-016 documenting that printed output is a designed learning manual, not a browser screenshot.

## 12. Next Step Priority

### Recommended First Task After This Refresh

1. Run `npm run build`.
2. Run `CodexPro.show_changes`.
3. If build passes, start print QA.
4. If build fails, fix the build first and do not enter print QA.

### Print QA Order

1. Start `npm run dev`.
2. Open `#/print`.
3. Select 3–5 real printable cards covering summary / no summary / tags / source / copyText / long copyText / long body.
4. Generate preview.
5. Check `page-per-card`.
6. Check `compact` continuous mode.
7. Toggle summary / tags / source / copyText.
8. Open Chrome system print preview.
9. Save as PDF.
10. Record PASS / FAIL / NOT RUN in this document.
11. Fix only concrete issues found.
12. Run `npm run build` after any code fix.
13. Update `CURRENT_STATE.md` and `NEXT_SESSION_PROMPT.md`.

## 13. Do Not Do Next

- Do not use Git commands.
- Do not rely on chat history alone.
- Do not write “discussed” as “implemented”.
- Do not write “planned” as “completed”.
- Do not write “build passed” as “browser QA passed”.
- Do not keep blind-tuning print CSS before real Chrome print preview.
- Do not claim printable-entry weakening/removal has been implemented.
- Do not use real primary data for sync apply or rollback testing.
- Do not implement automatic polling/listening/background sync before manual bound-file apply and rollback paths are browser-QA stable.
- Do not implement conflict diff UI before preflight/apply/rollback QA is stable.
- Do not delete legacy docs or `stage6.css.tmp` unless explicitly approved.
- Do not introduce backend, login, account sync, direct cloud API sync, PDF generation dependencies, large UI frameworks, or unsafe HTML rendering.
