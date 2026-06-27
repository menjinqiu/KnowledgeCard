# KnowledgeCard Next Session Handoff

Read this after `docs/PROJECT_CONTEXT_LONG_TERM.md`.

## Current Session Summary

This session completed **Stage 18: one-click copy payload** after the operation feedback pass, interaction efficiency pass, pasted JSON import, Quick Access, collection ordering, and A4 print work.

The latest implemented change is a dedicated optional copy payload for cards. Cards can now store `copyLabel` and `copyText`; detail pages render `copyText` as an inline copyable block inside the body reading flow, similar to ChatGPT-style copyable code blocks, instead of a detached preview area or top-level copy action.

No backend, login, cloud sync, PDF library, UI framework, database schema change, or AI service was introduced.

## Completed: One-click Copy Payload

Files changed:

```text
src/types/card.ts
src/services/backupValidationService.ts
src/services/cardService.ts
src/services/markdownExportService.ts
src/pages/EditorPage.tsx
src/pages/DetailPage.tsx
src/components/CardDetail.tsx
src/styles/global.css
```

What changed:

- Added optional card fields:
  - `copyLabel?: string`
  - `copyText?: string`
- Editor now has a dedicated “一键复制内容” section.
- Detail page renders `copyText` as an inline copyable block inside the body reading flow when it is non-empty.
- Button label uses `copyLabel` when present, otherwise falls back by card type:
  - 提示词卡 → `复制提示词`
  - 模板卡 → `复制模板`
  - 清单卡 → `复制清单`
  - 练习卡 → `复制练习内容`
  - other → `复制重点内容`
- The inline copy block has a compact ChatGPT-style block header and copy button: weak border, light gray surface, small type label, and a low-noise copy action.
- JSON import validation accepts the optional fields and preserves `copyText` formatting.
- Search includes `copyLabel` and `copyText`.
- Markdown export includes the copy payload section when present.
- Print output remains based on `content`; the inline copy block is marked `no-print` to avoid disrupting A4 output.

Design rule to preserve:

- `content` is for explanation, usage notes, and reading.
- `copyText` is the exact reusable payload to copy, especially for prompt/template cards, but it should be presented inline with the body reading flow rather than as a detached standalone panel.
- Do not add multiple copy blocks until real usage proves one primary payload insufficient.

## Completed: Operation Feedback Pass

Files changed:

```text
src/pages/LibraryPage.tsx
src/styles/library.css
```

What changed:

- Added `batchNotice` state for local feedback inside the batch collection panel.
- `选择当前结果` now confirms how many visible cards were selected.
- `清空选择` now confirms the selection was cleared.
- `加入已有专题集` now shows a local success/error message directly inside the batch panel.
- `创建专题集` now also mirrors success/error feedback inside the batch panel.
- Top-level notice remains in place, but users no longer need to look away from the action area.

Feedback rule to preserve:

- High-impact operations such as add, create, remove, import, export, delete, and save should produce explicit feedback.
- If the operation happens inside a sub-panel, show feedback near that sub-panel, not only at page top.
- Low-impact toggles with visible state changes, such as favorite stars, do not need noisy extra notifications unless real use proves otherwise.

## Completed: Interaction Efficiency Pass

Files changed:

```text
src/components/CardListItem.tsx
src/pages/CollectionsPage.tsx
src/styles/library.css
src/styles/collections.css
```

What changed:

- Card library rows now have a consistent primary row action.
- In normal mode, clicking the card row body opens the card detail.
- In batch-selection mode, clicking the card row body toggles selected/unselected.
- Internal controls such as favorite, detail, checkbox, move up/down, and remove keep their own behavior.
- Card rows now support keyboard Enter/Space for the primary action.
- Selected cards have a clear full-row selected state.
- Collection order rows can be opened by clicking the row body, not only the title.

Interaction rule to preserve:

- A list/card row should have one obvious primary action.
- Explicit controls inside the row must not accidentally trigger the row primary action.
- Selection mode changes the primary action from “open” to “select”.

Business impact:

- Batch management is much faster because users do not need to aim at a small checkbox.
- Card browsing is faster because users can click the row body instead of a small title/detail button.
- The app feels more consistent across card library and collection management.

## Completed: Pasted JSON Batch Import

Files changed:

```text
src/services/importExportService.ts
src/pages/DataManagementPage.tsx
src/styles/data-management.css
```

What changed:

- Added preview/import helpers for JSON text:
  - `previewImportFromPastedJsonText(text)`
  - `importCardsFromPastedJsonText(text)`
- Data Management now supports two import paths:
  - select `.json` file
  - paste JSON directly into a text area
- Pasted JSON uses the same validation, preview counts, and ID-based merge rules as file import.
- Confirmation is still required before writing to IndexedDB.
- No data model, schema version, or dependency changes were introduced.

Business impact:

- AI-generated KnowledgeCard JSON can now be copied directly into the app and batch imported.
- This removes the old copy-to-file-save-select-file friction.
- The workflow now fits high-volume card creation through ChatGPT/Codex-style assistance.

## Completed: Quick Access Current-Use Cards

Files changed:

```text
src/services/collectionService.ts
src/components/TopNav.tsx
src/pages/DetailPage.tsx
src/pages/CollectionsPage.tsx
src/styles/sidebar-compact.css
src/styles/collections.css
```

What changed:

- Added a system collection for current-use cards:
  - `QUICK_ACCESS_COLLECTION_ID = '__quick_access__'`
  - title: `当前常用`
  - `printable: false`
- Added helper APIs:
  - `ensureQuickAccessCollection()`
  - `getQuickAccessCards(limit)`
  - `isCardInQuickAccess(cardId)`
  - `addCardToQuickAccess(cardId)`
  - `removeCardFromQuickAccess(cardId)`
  - `isQuickAccessCollection(collection)`
- Added a `quick-access-updated` browser event so the sidebar updates after add/remove/reorder.
- Left sidebar now displays up to 5 current-use cards in a styled `当前常用` panel.
- Clicking a quick-access row opens that card detail directly.
- Card detail page now has `加入常用` / `已在常用` action.
- Collections page shows the system collection with a `Quick` badge.
- The system collection cannot be deleted; use remove actions to remove cards from it.
- Ordering is managed through the existing collection order panel.

Business impact:

- Frequently used cards now have a one-click path from almost anywhere in the app.
- Favorites remain a long-term value marker; Quick Access becomes the temporary working set.
- The implementation reuses existing collection ordering and backup behavior instead of adding a new table.

## Previous Completed Work Still Relevant

### Collection Card Ordering

Files changed earlier:

```text
src/services/collectionService.ts
src/pages/CollectionsPage.tsx
src/styles/collections.css
```

- Added `moveCardInCollection(collectionId, cardId, direction)`.
- Reused existing `CardCollection.cardIds` order; no data-model change.
- Each collection card row supports open, move up, move down, toggle favorite, and remove.
- Print center inherits collection order when opened from `#/print?collection=:id`.

### A4 Manual Print Visual Refinement

Files changed earlier:

```text
src/components/PrintPreview.tsx
src/styles/print-center.css
src/styles/print.css
```

- Screen preview uses paper-like A4 workspace.
- Cover, table of contents, and manual card pages use `manual-page`.
- Browser print output clears screen backgrounds, rounded corners, and shadows.
- Cover and table of contents break after page.
- Manual cards default to page breaks.

### Markdown Rendering Fix

Files changed earlier:

```text
src/components/MarkdownLite.tsx
src/styles/global.css
```

- Replaced plain-text-only rendering with lightweight safe Markdown parsing.
- Supports headings, ordered lists, unordered lists, bold, inline code, and fenced code blocks.
- No HTML injection and no extra dependency.

### Single Card Print Improvement

Files changed earlier:

```text
src/styles/print.css
```

- Improved direct single-card browser print layout.
- Reduced web-page feel and improved paper handout readability.

## Verification Done

Latest build:

```text
PASS
vite v6.4.3 building for production...
✓ 70 modules transformed.
✓ built in 577ms
```

Targeted implementation now includes the one-click copy payload feature:

```text
copyLabel
copyText
copyPrimaryPayload
copy-payload-preview
```

## Current Known Risks

- Browser visual QA has still not been performed by the assistant.
- Actual printer/PDF preview behavior can vary by browser and printer driver, so manual print preview inspection is still required.
- `src/styles/stage6.css.tmp` may still exist and should be physically deleted manually if present.
- Quick Access is intentionally lightweight. Do not add automatic expiration, recent-open tracking, or drag-and-drop until real use proves it necessary.

## Recommended Manual QA

One-click copy payload checks:

```text
#/new
#/edit/:id
#/cards/:id
#/data
```

- Create or edit a `提示词卡` and fill `一键复制内容`.
- Confirm the detail page shows a primary `复制提示词` button.
- Click it and confirm the clipboard receives `copyText`, not `content`.
- Confirm the copy payload preview is visible on detail but does not print.
- Import a JSON card containing `copyLabel` and `copyText`; confirm both persist.
- Search for text that only exists in `copyText`; confirm the card is found.

Operation feedback checks:

```text
#/library
```

- Enter batch collection mode.
- Click `选择当前结果` and confirm feedback appears inside the batch panel.
- Select cards and click `加入已有专题集`; confirm local success feedback appears near the operation area.
- Click `清空选择` and confirm local feedback appears.
- Create a collection from selected or visible cards and confirm local success/error feedback appears.

Interaction efficiency checks:

```text
#/library
#/collections
```

- In normal library mode, click the body of a card row and confirm it opens the card.
- In batch collection mode, click the body of a card row and confirm it toggles selected/unselected.
- Confirm favorite/detail/checkbox controls still perform their own actions.
- In collection order list, click the body of a card row and confirm it opens the card.
- Confirm 上移 / 下移 / 收藏 / 移除 still perform their own actions without opening the card.

Pasted JSON import checks:

```text
#/data
```

- Paste a valid full KnowledgeCard JSON object into `粘贴 JSON`.
- Click `预览粘贴内容`.
- Confirm preview counts show added/updated/skipped/errors before writing.
- Click `确认导入并合并` and confirm cards appear in `#/library`.
- Paste malformed JSON and confirm it fails safely without changing IndexedDB.
- Confirm file import still works through `选择 JSON 文件`.

Quick Access checks:

```text
#/cards/:id
#/collections
```

- Open a card detail page.
- Click `加入常用`.
- Confirm the left sidebar shows the card under `当前常用`.
- Click the sidebar quick card and confirm it opens the card detail directly.
- Click `已在常用` to remove it.
- Add 3+ cards to Quick Access, then go to `#/collections` and open `当前常用`.
- Use 上移 / 下移 and confirm the left sidebar order updates.
- Confirm `当前常用` cannot be deleted.

Wider smoke test:

```text
#/
#/library
#/collections
#/data
#/print
#/style-lab
#/new
#/edit/:id
#/cards/:id
```

A4 print checks remain important:

- Generate a manual from a collection.
- Use browser print preview.
- Confirm cover appears as its own first page.
- Confirm table of contents appears as its own page when enabled.
- Confirm each card starts cleanly and does not look cramped.
- Confirm summary block, tags, metadata, and footer remain readable in black and white.

## Recommended Next Step

Stop feature work and do manual visual QA. Fix only concrete issues found during use.

Do not add PDF export, drag-and-drop libraries, AI summarization, cloud sync, login, or a UI framework unless explicitly approved.

## Last Updated

Updated on 2026-06-26 after one-click copy payload was implemented and build verification passed.
