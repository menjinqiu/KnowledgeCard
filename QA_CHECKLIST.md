# KnowledgeCard Full QA Checklist

This checklist is the current canonical QA plan for KnowledgeCard. Use it before adding more features.

## QA Status Legend

```text
[ ] Not tested
[~] Partially tested / needs recheck
[x] Passed
[!] Failed / needs fix
[n/a] Not applicable
```

## 1. Automated Verification

- [ ] Run `npm run build` in the current session.
- [ ] Confirm TypeScript build passes.
- [ ] Confirm Vite production build passes.
- [ ] Confirm no accidental dependency / backend / UI framework was introduced.
- [ ] Confirm `dangerouslySetInnerHTML` is not used under `src/`.

## 2. App Startup

Command:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5175/
```

Checklist:

- [ ] Confirm 5175 is the intended KnowledgeCard dev server, not another stale process.
- [ ] App loads without blank screen.
- [ ] Left sidebar appears.
- [ ] Main routes can be opened from sidebar.
- [ ] Refreshing the browser does not break hash route recovery.

## 3. Canonical Documentation QA

- [ ] `README.md` points to root-level canonical docs first.
- [ ] `PROJECT_BRIEF.md` records stable goal/boundaries only.
- [ ] `ARCHITECTURE.md` records architecture and data flows.
- [ ] `DECISION_LOG.md` contains major decisions, including directory / knowledge-space decisions.
- [ ] `CURRENT_STATE.md` records current verified state and next tasks.
- [ ] `NEXT_SESSION_PROMPT.md` is copyable into a new session and independent of chat history.
- [ ] Older docs are treated as historical/supplemental, not primary.

## 4. Knowledge Spaces / Directory QA

Route:

```text
#/directory
```

Checklist:

- [ ] Route opens without blank screen.
- [ ] Default state opens Knowledge Spaces home, not a random selected directory.
- [ ] Left mini map loads.
- [ ] Mini map has virtual `常用` node at the top.
- [ ] Mini map shows real directory nodes below `常用`.
- [ ] Mini map shows `未归位` node.
- [ ] Global left sidebar no longer shows the old `当前常用` module.
- [ ] Clicking `常用` opens quick-access card list.
- [ ] `常用` card count is correct.
- [ ] Adding/removing a card from Quick Access refreshes `常用` count/list.
- [ ] Clicking a root space tile enters that space.
- [ ] Clicking a subspace tile enters that space.
- [ ] Breadcrumb buttons navigate to parent spaces.
- [ ] `本空间` mode shows directly assigned cards only.
- [ ] `含子空间` mode shows cards assigned to current space and descendants.
- [ ] Pinned cards appear before normal cards in the same space.
- [ ] Pinned cards have a subtle highlighted background and `置顶` badge.
- [ ] Edit mode `置顶` moves the card to the pinned group.
- [ ] Edit mode `取消置顶` moves the card back to normal ordering.
- [ ] Edit mode `上移` / `下移` changes order inside the card's pinned or normal group.
- [ ] `未归位` view shows cards without primary directory.
- [ ] Space search can jump to a matching space.
- [ ] Space search can jump to a matching card.
- [ ] Browser refresh preserves current route behavior.

## 5. Browse/Edit Mode QA

Route:

```text
#/directory
```

Checklist:

- [ ] Default mode is Browse mode.
- [ ] Browse mode does not show new-space controls.
- [ ] Browse mode does not show new-card controls in the space command area.
- [ ] Browse mode does not show card edit / move / assign buttons.
- [ ] Browse mode does not show delete-space controls.
- [ ] Browse mode is clean enough for normal reading/navigation.
- [ ] Switching to Edit mode works.
- [ ] Edit mode shows create root-space / child-space controls.
- [ ] Edit mode shows card edit controls.
- [ ] Edit mode shows card pin / unpin controls where applicable.
- [ ] Edit mode shows card move up / move down controls where applicable.
- [ ] Edit mode shows move-out-primary-directory controls where applicable.
- [ ] Edit mode shows uncategorized-card assignment controls where applicable.
- [ ] Edit mode exposes space information editing.
- [ ] Switching back to Browse mode hides all edit controls again.
- [ ] Switching back to Browse mode closes open edit/create/info panels.

## 6. Space Structure Editing QA

Route:

```text
#/directory
```

Checklist:

- [ ] Create root space works.
- [ ] Create child space works.
- [ ] Created space appears in mini map and space tiles.
- [ ] Edit space title works.
- [ ] Edit space description works.
- [ ] Edit space sort order works.
- [ ] Edit space parent works.
- [ ] Space cannot set itself as its parent.
- [ ] Space cannot move under one of its own descendants.
- [ ] Edit-space parent selector hides the current space and its descendants.
- [ ] Service layer rejects a descendant parent even if UI is bypassed.
- [ ] Deleting non-empty space is blocked safely.
- [ ] Deleting empty space requires confirmation.
- [ ] Deleted empty space disappears from mini map.
- [ ] Existing cards keep their primary directory after unrelated space edits.

## 7. Card Library QA

Route:

```text
#/library
```

Checklist:

- [ ] Card list loads.
- [ ] Search works for title.
- [ ] Search works for summary.
- [ ] Search works for content.
- [ ] Search works for tags.
- [ ] Search works for `copyText` content.
- [ ] Domain filter works.
- [ ] Type filter works.
- [ ] Tag filter works.
- [ ] Validity filter works.
- [ ] Importance filter works.
- [ ] Favorite filter works.
- [ ] Archive filter works.
- [ ] Sorting by updated time works.
- [ ] Sorting by importance works.
- [ ] Sorting by domain works.
- [ ] Sorting by type works.
- [ ] Normal mode: clicking card row body opens card detail.
- [ ] Favorite button inside row toggles favorite without opening wrong route.
- [ ] Detail/open button inside row opens the correct card.

## 8. Batch Management QA

Route:

```text
#/library
```

Checklist:

- [ ] Enter batch management mode.
- [ ] Batch panel appears.
- [ ] Clicking card row body selects/unselects card.
- [ ] Checkbox still works.
- [ ] `选择当前结果` selects visible cards.
- [ ] `选择当前结果` shows local feedback inside batch panel.
- [ ] `清空选择` clears selection.
- [ ] `清空选择` shows local feedback.
- [ ] Batch primary-directory selector loads directory tree options.
- [ ] Batch setting selected cards' primary directory works.
- [ ] Batch setting primary directory shows success feedback.
- [ ] Batch clearing selected cards' primary directory works.
- [ ] Batch clearing primary directory shows success feedback.
- [ ] Updated cards appear under the new Knowledge Space.
- [ ] Cleared cards appear under `未归位`.
- [ ] Batch setting selected cards printable works.
- [ ] Batch clearing selected cards printable works.
- [ ] Batch favorite selected cards works.
- [ ] Batch unfavorite selected cards works.
- [ ] Batch archive selected cards works.
- [ ] Batch unarchive selected cards works.
- [ ] Batch flag actions show success feedback.
- [ ] Batch archived cards respect the current archive filter behavior.
- [ ] Add selected cards to existing collection.
- [ ] Successful add shows local feedback near the batch panel.
- [ ] Trying to add without selecting cards shows error feedback.
- [ ] Create collection from selected cards.
- [ ] Create collection from visible cards.
- [ ] Newly created collection appears in collections route.
- [ ] Leaving batch mode clears selection or behaves predictably.

## 9. Card Editor QA

Routes:

```text
#/new
#/edit/:id
```

Checklist:

- [ ] Create new card with required title/content.
- [ ] Validation prevents empty title.
- [ ] Validation prevents empty content.
- [ ] Domain select works.
- [ ] Type select works.
- [ ] Tag input works.
- [ ] Summary saves.
- [ ] Content saves.
- [ ] Source saves.
- [ ] Source URL saves.
- [ ] Validity saves.
- [ ] Importance saves.
- [ ] Favorite saves.
- [ ] Printable saves.
- [ ] Archived saves.
- [ ] `copyLabel` saves.
- [ ] `copyText` saves with line breaks preserved.
- [ ] Primary directory selection saves.
- [ ] Editing an existing card preserves old fields.
- [ ] Cancel returns to library without unexpected save.

## 10. Card Detail QA

Route:

```text
#/cards/:id
```

Checklist:

- [ ] Card title displays correctly.
- [ ] Metadata pills display correctly.
- [ ] Tags display correctly.
- [ ] Summary displays correctly.
- [ ] Primary directory breadcrumb / link displays correctly when set.
- [ ] Primary directory link navigates to the correct space.
- [ ] Detail reuse strip appears above card body.
- [ ] Detail reuse strip primary copy button appears when `copyText` exists.
- [ ] Detail reuse strip primary copy button copies `copyText`.
- [ ] Detail reuse strip return-space button navigates to the card's Knowledge Space.
- [ ] Detail reuse strip previous/next sibling buttons appear for cards in the same space.
- [ ] Previous/next sibling buttons navigate to the correct card.
- [ ] Detail reuse strip remains hidden from print.
- [ ] MarkdownLite renders headings.
- [ ] MarkdownLite renders lists.
- [ ] MarkdownLite renders inline code.
- [ ] MarkdownLite renders code blocks safely.
- [ ] No unsafe HTML is rendered from user content.
- [ ] Copy full body content works.
- [ ] Copy full body content shows feedback.
- [ ] Favorite toggle works.
- [ ] Archive toggle works.
- [ ] Add to collection works.
- [ ] Add to collection shows feedback.
- [ ] Add/remove Quick Access works.
- [ ] `常用` virtual node updates after Quick Access change.
- [ ] Export Markdown works.
- [ ] Delete confirmation appears before deletion.

## 11. Inline Copy Payload QA

Route:

```text
#/cards/:id
```

Use a card with `copyLabel` and `copyText`.

Checklist:

- [ ] Inline copy block appears inside the body reading flow, not as a detached panel.
- [ ] Inline copy block visually resembles a clean copyable code/prompt block.
- [ ] Block background is subtle and not visually heavy.
- [ ] Header is compact.
- [ ] Left label is content type such as `提示词`, `模板`, `清单`, not noisy repeated button text.
- [ ] Right copy action is visible but low-noise.
- [ ] Copy button copies exactly `copyText`, not `content`.
- [ ] Copy success feedback appears.
- [ ] Line breaks and indentation are preserved.
- [ ] Long `copyText` scrolls instead of breaking layout.
- [ ] Inline copy block does not appear when `copyText` is empty.
- [ ] Inline copy block is not printed unless intentionally changed later.

## 12. Collections QA

Route:

```text
#/collections
```

Checklist:

- [ ] Collection list loads.
- [ ] New collection form is collapsed by default.
- [ ] New collection can be expanded.
- [ ] Create collection works.
- [ ] Create collection shows feedback.
- [ ] Selecting collection loads its cards.
- [ ] Clicking collection card row body opens card detail.
- [ ] Up/down controls reorder cards.
- [ ] Reorder shows feedback.
- [ ] Remove card from collection works.
- [ ] Remove card shows feedback.
- [ ] Normal collections can be deleted after confirmation.
- [ ] Quick Access system collection cannot be deleted.
- [ ] Current collection route can initialize from `#/collections?collection=:id`.
- [ ] Quick Access ordering can still be managed in collections page.

## 13. Data Management QA

Route:

```text
#/data
```

Checklist:

- [ ] Data management route opens.
- [ ] JSON backup export works.
- [ ] Manual sync package export works.
- [ ] Sync package filename starts with `knowledgecard-sync-package-`.
- [ ] Sync package JSON contains `cards`, `collections`, and `directories`.
- [ ] Sync package JSON contains `syncMeta.packageType = manual-sync`.
- [ ] Sync package preview shows source device information.
- [ ] Sync package preview shows skip reasons when records are skipped.
- [ ] Skip reason panel distinguishes local-newer and same-timestamp skips for cards.
- [ ] Skip reason panel distinguishes local-newer and same-timestamp skips for collections.
- [ ] Skip reason panel distinguishes local-newer and same-timestamp skips for directories.
- [ ] Sync package can be imported through the same preview / safety confirmation flow.
- [ ] Sync package merge respects ID + updatedAt behavior.
- [ ] Import preview rejects directories whose `parentId` points to themselves.
- [ ] Import preview rejects directories whose `parentId` points to a descendant and forms a cycle.
- [ ] Import preview rejects directories whose `parentId` points to a missing directory after merge.
- [ ] Actual import also rejects unsafe directory structures if preview is bypassed.
- [ ] Exported JSON contains `cards`.
- [ ] Exported JSON contains `collections`.
- [ ] Exported JSON contains `directories`.
- [ ] JSON file import preview works.
- [ ] Pasted JSON preview works.
- [ ] Pasted JSON import confirmation works.
- [ ] Import confirmation button is disabled until safety checkbox is checked.
- [ ] Safety checkbox resets after choosing a new file / previewing new pasted JSON / clearing preview.
- [ ] Import risk box clearly explains ID + updatedAt merge behavior.
- [ ] Import preview shows card added/updated/skipped/error counts.
- [ ] Import preview shows collection added/updated/skipped counts.
- [ ] Import preview shows directory added/updated/skipped counts.
- [ ] Invalid JSON fails safely without writing data.
- [ ] JSON card with `copyLabel` and `copyText` imports correctly.
- [ ] JSON card with `primaryDirectoryId` imports correctly.
- [ ] Imported prompt cards from `docs/imports/knowledgecard-generation-prompts.json` appear in library.
- [ ] Search can find imported prompt cards by text inside `copyText`.

## 14. Print Center QA

Routes:

```text
#/print
#/print?collection=:id
```

Checklist:

- [ ] Print center opens.
- [ ] Cards can be selected for printing.
- [ ] Only cards marked `printable` appear in print selection.
- [ ] Knowledge Space source selector loads directory tree options.
- [ ] Selecting a Knowledge Space selects only printable cards in that space.
- [ ] `只取本空间` excludes child-space cards.
- [ ] `包含子空间` includes descendant-space cards.
- [ ] `直接预览空间手册` opens preview with selected space cards.
- [ ] `#/print?directory=:id` initializes preview from one Knowledge Space.
- [ ] `#/print?directory=:id&scope=deep` initializes preview from a space and descendants.
- [ ] Directory page `打印空间` opens print preview with `scope=deep`.
- [ ] Collection launch preserves collection card order.
- [ ] Collection launch still filters out non-printable cards.
- [ ] A4 preview appears visually close to real A4 page ratio.
- [ ] Cover page appears as own first page when enabled.
- [ ] Cover page has balanced margins, title size, and metadata spacing.
- [ ] Table of contents appears as own page when enabled.
- [ ] Table of contents remains readable with multiple sections.
- [ ] Section header aligns with card pages and does not waste a whole printed page unnecessarily.
- [ ] Card pages are not cramped.
- [ ] Card title, metadata, tags, summary, content, and footer have clear visual hierarchy.
- [ ] Summary block is visually distinct but still black-and-white safe.
- [ ] Long body content paginates naturally instead of overflowing.
- [ ] Headings avoid being left alone at the bottom of a page.
- [ ] Code blocks / prompt blocks wrap safely and remain readable.
- [ ] Tags/metadata remain readable.
- [ ] Browser print preview does not show the inline copy block if it is marked no-print.
- [ ] Black-and-white print readability is acceptable.
- [ ] Actual browser print preview hides all app UI and grid backgrounds.

## 15. Importable Prompt Cards QA

File:

```text
docs/imports/knowledgecard-generation-prompts.json
```

Checklist:

- [ ] File is valid JSON.
- [ ] File uses full KnowledgeCard import format.
- [ ] Cards include `copyLabel` and `copyText`.
- [ ] Import through `#/data` succeeds.
- [ ] Imported cards are type `提示词卡` or appropriate related type.
- [ ] Inline copy block appears on each imported card.
- [ ] Copy button copies the actual prompt.

## 16. Card Template System QA

Files:

```text
docs/CARD_TEMPLATE_SYSTEM.md
docs/imports/knowledgecard-card-templates.json
```

Checklist:

- [ ] `docs/CARD_TEMPLATE_SYSTEM.md` exists and explains card quality rules.
- [ ] Template system doc explains title / summary / content / copyLabel / copyText / tags / primary directory rules.
- [ ] Template system doc explains prompt, checklist, decision, learning, project handoff, and investment review templates.
- [ ] `docs/imports/knowledgecard-card-templates.json` is valid JSON.
- [ ] Template JSON uses full KnowledgeCard v1 import format.
- [ ] Template JSON contains 6 template cards.
- [ ] Template JSON contains a `KnowledgeCard 模板体系` collection.
- [ ] Template cards include `copyLabel` and `copyText`.
- [ ] Template cards import through `#/data` after safety confirmation.
- [ ] Imported template cards appear in library search.
- [ ] Imported template cards show inline copy block on detail page.
- [ ] Template card copy button copies the template prompt exactly.
- [ ] Data Management sidebar mentions both built-in import files.

## 17. Sync Workflow Documentation QA

Files:

```text
docs/SYNC_WORKFLOW.md
docs/imports/knowledgecard-sync-workflow.json
```

Checklist:

- [ ] `docs/SYNC_WORKFLOW.md` exists.
- [ ] Sync workflow doc explains manual sync model and current limitations.
- [ ] Sync workflow doc explains ID + updatedAt merge rules.
- [ ] Sync workflow doc explains two-device and bidirectional sync routines.
- [ ] Sync workflow doc explains when to use full backup instead of sync package.
- [ ] Sync workflow doc explains directory safety guard behavior.
- [ ] `docs/imports/knowledgecard-sync-workflow.json` is valid JSON.
- [ ] Sync workflow import file uses full KnowledgeCard v1 import format.
- [ ] Sync workflow import file contains 2 cards.
- [ ] Sync workflow import file contains `KnowledgeCard 同步流程` collection.
- [ ] Sync workflow cards include `copyLabel` and `copyText`.
- [ ] Sync workflow cards import through `#/data` after safety confirmation.
- [ ] Imported sync workflow cards appear in library search.
- [ ] Imported sync workflow cards show inline copy block on detail page.
- [ ] Data Management built-in import list includes `knowledgecard-sync-workflow.json`.

## 18. Sync QA Test Packages

Folder:

```text
docs/test-data/sync/
```

Checklist:

- [ ] `docs/test-data/sync/README.md` exists and explains test order.
- [ ] `00-baseline-local-data.json` imports into a test profile.
- [ ] `01-normal-sync-package.json` produces expected add/update preview after baseline.
- [ ] `02-local-newer-skip-package.json` produces local-newer skip reasons after baseline.
- [ ] `03-same-timestamp-skip-package.json` produces same-timestamp skip reasons after baseline.
- [ ] `04-bad-directory-self-parent.json` is blocked during preview.
- [ ] `05-bad-directory-missing-parent.json` is blocked during preview.
- [ ] `06-bad-directory-cycle.json` is blocked during preview.
- [ ] Test packages show `syncMeta` source device information where expected.
- [ ] Test packages are only used in a test profile or after exporting a full backup.

## 19. Persistence Hardening QA

Route:

```text
#/data
```

Checklist:

- [ ] Data Management shows `本地持久化` section.
- [ ] Browser storage status shows supported / unsupported clearly.
- [ ] Storage usage and quota are displayed when available.
- [ ] `请求持久存储` does not break the page if the browser denies persistence.
- [ ] Granted persistent storage is displayed as `已持久化`.
- [ ] Device identity is created automatically.
- [ ] Device name can be edited and saved.
- [ ] Device name remains after page reload.
- [ ] Recovery snapshot count is displayed.
- [ ] `创建恢复快照` creates a snapshot containing current cards / collections / directories.
- [ ] Recovery snapshot count updates after creation.
- [ ] Recent recovery snapshot list appears after snapshots exist.
- [ ] Snapshot list shows time, reason, card count, collection count, and directory count.
- [ ] Selecting a snapshot reveals restore confirmation.
- [ ] Restore button is disabled until confirmation checkbox is checked.
- [ ] Restoring a snapshot replaces current cards / collections / directories with the snapshot contents.
- [ ] Restore creates a `before-restore` snapshot before replacing current data.
- [ ] Device identity / sync state is not rolled back by snapshot restore.
- [ ] Import confirmation automatically creates a `before-import` recovery snapshot before writing imported records.
- [ ] Reloading the page does not require re-importing existing data.
- [ ] Restarting the dev server does not require re-importing existing IndexedDB data.

## 20. Bound Sync File MVP QA

Route:

```text
#/data
```

Checklist:

- [ ] Data Management shows `绑定同步文件` section.
- [ ] Unsupported browsers clearly show file access as unsupported and disable bound-file actions.
- [ ] Supported browsers allow creating `knowledgecard-sync.json` through file picker.
- [ ] Created sync file contains valid KnowledgeCard v1 JSON.
- [ ] Created sync file contains `syncMeta.packageType = bound-sync-file`.
- [ ] Existing sync file can be selected and bound.
- [ ] Bound file name is displayed after binding.
- [ ] Bound file state remains after page reload if browser keeps the file handle permission.
- [ ] Permission loss shows a readable error and does not clear local IndexedDB data.
- [ ] `写入本地数据到文件` writes current local cards / collections / directories into the bound file.
- [ ] `读取文件并预览导入` reads the bound file and shows the normal import preview.
- [ ] `生成同步计划` reads the bound file and shows a read-only local-vs-remote plan.
- [ ] Sync plan shows local-add, remote-add, local-newer, remote-newer, same, and conflict counts.
- [ ] Sync plan item list shows entity type, action, title, and reason.
- [ ] Sync plan preflight shows pass / not-pass status.
- [ ] Sync plan preflight shows blocker and warning counts.
- [ ] Sync plan preflight blocks same-timestamp different-content conflicts.
- [ ] Sync plan preflight warns when one side has records the other side does not have because tombstone deletion semantics are not implemented yet.
- [ ] Sync plan preflight blocks unsafe remote directory structure.
- [ ] Sync plan shows read-only apply draft status.
- [ ] Apply draft shows expected cards / collections / directories counts.
- [ ] Apply draft shows local chosen, remote chosen, same kept, and unresolved counts.
- [ ] Apply draft reports blockers when conflicts or final directory risks exist.
- [ ] Apply draft generation does not write to IndexedDB.
- [ ] Apply draft generation does not write to the bound file.
- [ ] Apply button only appears when apply draft can generate and preflight has no blockers.
- [ ] Apply button is disabled until the user checks the confirmation checkbox.
- [ ] Applying the draft re-reads the bound file before writing.
- [ ] Applying the draft creates a `before-one-click-sync` recovery snapshot.
- [ ] Applying the draft writes merged cards / collections / directories to IndexedDB.
- [ ] Applying the draft writes the merged result back to the bound sync file.
- [ ] Applying the draft shows final counts and written filename.
- [ ] If file write fails after local write, IndexedDB is automatically rolled back to the `before-one-click-sync` snapshot.
- [ ] If file write fails and rollback also fails, the error message clearly tells the user to restore manually from recovery snapshots.
- [ ] Sync plan generation does not write to IndexedDB.
- [ ] Sync plan generation does not write to the bound file.
- [ ] Reading bound file does not write to IndexedDB before safety confirmation.
- [ ] Confirming import from bound file still creates a `before-import` recovery snapshot.
- [ ] Bound-file read/write timestamps update after successful operations.
- [ ] No automatic polling or automatic merge occurs in this MVP.

## 21. QA Findings Log

Record findings here during manual QA.

```text
Finding ID:
Route:
Steps:
Expected:
Actual:
Severity: low / medium / high / blocker
Fix suggestion:
Status: open / fixed / wontfix
```

## 22. Stop Conditions

Stop feature work and fix before continuing if any of these occur:

- Data import corrupts existing cards.
- Card editing loses fields.
- `copyText` is not preserved.
- `primaryDirectoryId` is lost after card edit/import/export.
- Directory tree / Knowledge Spaces route loads blank.
- Browse mode leaks destructive edit controls.
- Edit mode cannot access core maintenance actions.
- Batch add creates wrong collection membership.
- Delete action occurs without confirmation.
- Browser build fails.
- App loads blank screen.
- Print route becomes unusable.
