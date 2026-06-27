# KnowledgeCard Long-Term Project Context

This document is the stable project memory for KnowledgeCard. It should be updated when the product direction, architecture, data model, design system, or long-term roadmap changes. It is intended for AI session handoff and for future maintainers.

## 1. Project Identity

Project name: `KnowledgeCard`

Local path:

```text
/Users/menjinqiu/work/codex_workspace/KnowledgeCard
```

Purpose:

KnowledgeCard is a local, offline-first web application for managing a personal high-value content card library. It is used to collect, organize, read, reuse, export, and print durable knowledge assets from ChatGPT conversations, web pages, personal summaries, learning materials, investment notes, health notes, development prompts, and other high-value content.

Core product sentence:

```text
A local high-value content workstation for searchable cards, reusable collections, and printable manuals.
```

The project should not become a marketing site, social feed, visual inspiration board, cloud service, account system, or generic note-taking clone.

## 2. User and Product Preferences

Primary user profile:

- Technical user, comfortable with local tools and project files.
- Strong preference for local-first/offline-first applications.
- Uses AI-assisted development through ChatGPT and CodexPro.
- Values high information density, compact layouts, long-session comfort, readable text, practical workflows, and maintainable code.
- Dislikes decorative, sparse, marketing-style UI.

Design preferences:

- Desktop-first.
- High information density without visual clutter.
- Left-side workstation navigation.
- Content-first pages.
- Clear separation between global navigation and page-context actions.
- Printed output must look like formal material, not a browser screenshot.

Development preferences:

- Avoid unnecessary dependencies.
- Do not introduce backend, login, cloud sync, user account, AI summarization service, PDF library, or complex graph features unless explicitly requested.
- Preserve existing local data compatibility.
- Run `npm run build` after implementation.
- Report changed files, business-logic impact, build result, remaining risks, and next step.

## 3. Technology Stack

Current stack:

```text
Vite 6
React 19
React DOM 19
TypeScript 5.7
Dexie 4 / IndexedDB
Plain CSS
Hash routing implemented manually in src/app/App.tsx
```

Scripts:

```bash
npm run dev     # vite --host 127.0.0.1 --port 5175
npm run build   # tsc -b && vite build
npm run preview # vite preview --host 127.0.0.1
```

No current UI library, router library, state-management library, Markdown rendering library, PDF generation library, or backend service.

## 4. Current Main Routes

Hash routes:

```text
#/                       Dashboard
#/library                Card library
#/collections            Collections / topic sets
#/data                   Data management / backup and import preview
#/cards/:id              Card detail
#/new                    New card
#/edit/:id               Edit card
#/print                  Print center
#/print?collection=:id   Print center initialized from a collection
#/style-lab              Design system preview
```

The active navigation state maps detail/new/edit routes back to `/library` because they are card-library subflows.

## 5. Current Product Modules

### 5.1 Dashboard

File:

```text
src/pages/DashboardPage.tsx
```

Purpose:

- Overview metrics.
- Entry points into library, print center, and other workflows.

### 5.2 Card Library

Files:

```text
src/pages/LibraryPage.tsx
src/components/CardList.tsx
src/components/CardListItem.tsx
src/components/SidebarFilters.tsx
src/components/SearchBox.tsx
```

Capabilities:

- Search title, summary, content, tags.
- Filter by domain, type, tag, validity, importance, favorite, archive state.
- Sort by updated time, importance, domain, type.
- Create, open, favorite, jump to print center, jump to data management.
- Toggle batch collection mode.
- Select cards from the library list.
- Batch add selected cards to an existing collection.
- Create a new collection from selected cards or the current filtered result.

Current design status:

- Card list has improved hierarchy: metadata pills, title, summary, importance/update/source, compact tags, visual states.
- Sidebar filters have active-state indicators and grouped sections.
- Batch collection actions live inside a compact card-library panel and reuse existing selectable card list behavior.

Known next improvement:

- Improve collection ordering and preserve that order in print manuals.

### 5.3 Card Detail

Files:

```text
src/pages/DetailPage.tsx
src/components/CardDetail.tsx
src/components/MarkdownLite.tsx
```

Capabilities:

- Read card.
- Edit.
- Copy content.
- Toggle favorite.
- Archive/unarchive.
- Export Markdown.
- Print current card.
- Delete.
- Add card to a collection from the right-side info panel.

Design decision:

The card detail page is primarily a reading page. Collections are auxiliary organization controls and must live in the right-side info panel, not as a full-width block before the content.

Safety rule:

`MarkdownLite` currently renders plain text safely. Do not use `dangerouslySetInnerHTML` for user content without explicit approval and sanitization.

### 5.4 Editor

Files:

```text
src/pages/EditorPage.tsx
src/components/TagInput.tsx
src/styles/detail-editor.css
```

Capabilities:

- Create and update cards.
- Main content fields: title, summary, content.
- Side metadata fields: domain, type, tags, validity, importance, favorite, printable, archived, source, source URL.

Design decision:

Editor is content-first: title/summary/body on the left, metadata on the right.

### 5.5 Collections / Topic Sets

Files:

```text
src/pages/CollectionsPage.tsx
src/services/collectionService.ts
src/styles/collections.css
```

Concept:

Collections are not folders. They are manually curated topic sets or reusable content packages. One card may belong to multiple collections.

Examples:

```text
德语 A1 冲刺手册
投资交易检查清单
Codex 开发提示词合集
家庭健康处理手册
赴德求职资料包
```

Current capabilities:

- Create collection.
- View all collections.
- View collection detail.
- Remove cards from a collection.
- Delete collection without deleting cards.
- Generate print manual from a collection.
- Add a card to a collection from the card detail page.
- Batch add selected library cards to an existing collection.
- Create a collection from selected library cards.
- Create a collection from the current library filter result.

Known next improvements:

- Support collection ordering and preserve that order in print manuals.

### 5.6 Print Center

Files:

```text
src/pages/PrintCenterPage.tsx
src/components/PrintPreview.tsx
src/styles/print-center.css
src/styles/print.css
```

Capabilities:

- Select printable cards.
- Generate manual preview.
- Print with browser native `window.print()`.
- Generate cover, table of contents, sections, and card print blocks.
- Configure manual grouping: domain / type / none.
- Show/hide cover, table of contents, summary, tags, and source.
- Initialize preview from a collection route.
- Preserve collection order by defaulting collection-driven previews to no grouping.

Design decision:

Print center uses two modes:

```text
select mode  = choose cards with enough list width
preview mode = inspect generated manual and print
```

Reason:

Do not squeeze filters, card selection, and A4 preview into one cramped three-column screen. Selection and preview are separate workflow phases.

Known next improvements:

- Refine A4 page breaking.
- Add richer print typography controls only if needed.

### 5.7 Data Management

Files:

```text
src/pages/DataManagementPage.tsx
src/services/importExportService.ts
src/services/backupValidationService.ts
src/styles/data-management.css
```

Capabilities:

- View current local data counts for cards and collections.
- Export a complete JSON backup containing cards and collections.
- Preview a KnowledgeCard v1 JSON backup before import.
- Show import impact: added, updated, skipped, invalid records for cards and collections.
- Confirm import only after preview.
- Explain JSON backup schema version separately from Dexie database version.

Design decision:

Data import/export belongs in the dedicated data-management page, not the card library. The card library should link to data management but should not own backup/restore workflows.

### 5.8 Style Lab

Files:

```text
src/pages/StyleLabPage.tsx
```

Purpose:

- Preview design system components.
- Check buttons, controls, cards, states, reading blocks, detail panel, manual preview blocks.

Style Lab should remain a design-system validation page and should not become a production feature.

## 6. Data Model

Main types are in:

```text
src/types/card.ts
```

### 6.1 KnowledgeCard

Key fields:

```text
id
title
domain
type
tags
summary
content
source
sourceUrl
validity
importance
favorite
printable
archived
createdAt
updatedAt
```

Domains, types, validities, and importance levels are constrained by constants in `card.ts`.

### 6.2 CardCollection

Fields:

```text
id
title
description
cardIds
printable
createdAt
updatedAt
```

Collections are many-to-many by convention: a card can appear in multiple collections because membership is stored as card IDs inside each collection.

## 7. Database

File:

```text
src/db/db.ts
```

Database name:

```text
KnowledgeCardDB
```

Current Dexie version:

```text
version(3)
```

Tables:

```text
cards
collections
meta
```

Important compatibility note:

Do not casually downgrade or rewrite database versions. Any change to stores must preserve existing user data or provide explicit migration logic.

## 8. Import / Export / Backup

Files:

```text
src/services/importExportService.ts
src/services/backupValidationService.ts
src/services/fileExportService.ts
src/pages/DataManagementPage.tsx
```

Current JSON export includes:

```text
cards
collections
```

Current JSON import:

- Parses and validates cards.
- Parses and validates collections.
- Previews added / updated / skipped / invalid records before writing.
- Requires explicit confirmation before merge.
- Merges by ID.
- Updates only when imported `updatedAt` is newer.
- Reports added / updated / skipped / errors for cards and collections.

Current backup versioning rule:

- `SUPPORTED_BACKUP_VERSION` describes the JSON backup schema.
- Dexie database version describes local IndexedDB store structure.
- Do not treat these two version numbers as the same thing.

Known next improvements:

- Add richer import conflict detail only if real usage demands it.

## 9. Design System

Core design docs:

```text
DESIGN.md
docs/UI_STYLE_DECISIONS.md
docs/UI_ACCEPTANCE_CHECKLIST.md
```

Reference library:

```text
/Users/menjinqiu/work/codex_workspace/_shared/references/design/awesome-design-md
```

Reference direction:

```text
Main reference: IBM Carbon-like structure, flat panels, grid discipline, low-shadow, high-density UI.
Local reading/manual reference: Mintlify.
Local product precision reference: Linear.
```

Rejected as primary style:

```text
Apple, Stripe, Notion, Raycast, Vercel, Airtable as full primary style.
```

Current layout decision:

- Global navigation and global shortcuts live in the left sidebar.
- The previous top command bar was removed because it duplicated left navigation and wasted vertical space.
- Page headers should contain only page-context actions.

Current shell:

```text
Left sidebar:
  brand
  search shortcut
  new card shortcut
  global navigation
  local-first footer
Main area:
  page content begins near the top, no redundant global top bar
```

Forbidden UI patterns:

- Hero sections.
- Decorative gradients as primary structure.
- Marketing banners.
- Duplicate navigation bars.
- Random tag colors.
- Oversized sparse cards.
- Dark-only default shell.
- Notion-like empty gray database imitation.
- Introducing UI library without explicit approval.

## 10. Current Style Files

Current files:

```text
src/styles/global.css
src/styles/layout.css
src/styles/sidebar-compact.css
src/styles/dashboard.css
src/styles/library.css
src/styles/detail-editor.css
src/styles/collections.css
src/styles/print-center.css
src/styles/data-management.css
src/styles/style-lab.css
src/styles/print.css
```

Known issue:

`src/styles/global.css` is still large, but engineering cleanup has started. Completed splits include:

```text
dashboard.css
style-lab.css
layout.css
library.css
```

Remaining possible future splits:

```text
tokens.css
base.css
```

Known cleanup status:

- Stale top-command-bar CSS has been removed from `src/styles/global.css`.
- Stale old print-center layout classes have been removed from `src/styles/global.css` and `src/styles/print.css` where they were clearly unused.
- `src/styles/stage6.css.tmp` still exists because the current tool session did not expose a compliant file deletion action. It should be physically deleted manually or by a future deletion-capable tool.

## 11. Development Workflow

Preferred sequence for AI-assisted work:

1. Read this file first.
2. Read `docs/NEXT_SESSION_HANDOFF.md` second.
3. Read `DESIGN.md` and `docs/UI_ACCEPTANCE_CHECKLIST.md` before UI work.
4. Inspect relevant source files.
5. Make small coherent changes.
6. Run `npm run build`.
7. Update `docs/NEXT_SESSION_HANDOFF.md` at the end of the session.
8. Update this long-term file only when stable architecture, product direction, or roadmap changes.

Report format after changes:

```text
Changed files
What changed
Business logic impact
Build result
Remaining risks
Recommended next step
```

## 12. Current Roadmap

### Stage 9: UI cleanup and project hygiene

Status: mostly complete.

Completed:

- Removed stale top command bar CSS.
- Removed clearly unused old print-center layout CSS.
- Build verification passed after cleanup.

Still pending:

- Physically delete `src/styles/stage6.css.tmp` with a deletion-capable tool or manually.
- Optional browser visual QA for compact sidebar, detail page, and print center spacing.

### Stage 10: Batch collection workflows

Status: complete for MVP.

Completed:

- Added card-library batch collection mode.
- Reused existing selectable `CardList` / `CardListItem` behavior.
- Added batch add selected cards to an existing collection.
- Added create collection from selected cards.
- Added create collection from current filter result.
- Kept `KnowledgeCard` and `CardCollection` fields stable.

Completed follow-up:

- Added explicit collection card ordering with up/down/remove controls.
- Preserved `CardCollection.cardIds` order for print manuals when opened from `#/print?collection=:id`.

### Stage 11: Print manual settings

Status: mostly complete.

Completed:

- Added grouping mode: domain / type / none.
- Added show/hide controls for cover, table of contents, summary, tags, and source.
- Collection-driven previews default to no grouping to preserve collection card order.
- Settings affect the current preview and browser print output only; no card or collection data is changed.

Completed follow-up:

- Refined A4 manual screen preview and browser print CSS.
- Cover and table of contents now break after page.
- Manual cards default to page breaks, with improved black-and-white readability.

Known next improvement:

- Perform manual browser print-preview QA and fix concrete page-break issues if found.

### Stage 12: Data management page

Status: complete for MVP.

Completed:

- Added dedicated `#/data` route and left-sidebar navigation entry.
- Moved JSON backup/restore out of the card library page.
- Added full backup export from the data management page.
- Added import preview before merge.
- Added pasted JSON import so AI-generated KnowledgeCard JSON can be previewed and batch imported without first saving a file.
- Clarified backup schema version vs Dexie database version in the UI and project docs.

Known next improvement:

- Add richer import conflict detail only if needed after real-world use.

### Stage 13: Engineering cleanup

Status: in progress.

Completed:

- Split Style Lab page styles from `global.css` into `src/styles/style-lab.css`.
- Split dashboard page styles from `global.css` into `src/styles/dashboard.css`.
- Split shell, sidebar, navigation, and page-header styles into `src/styles/layout.css`.
- Split card library, filters, card list, and batch collection styles into `src/styles/library.css`.
- Removed confirmed-unused legacy content-rendering styles: `content-heading`, `content-paragraph`, `content-code`, `print-summary`.
- Build verification passed after each coherent cleanup batch.

Still pending:

- Consider whether `tokens.css` / `base.css` split is worth doing; do not split just for aesthetics.
- Extract common UI components such as `PageHead`, `Panel`, `StatCard`, `MetadataPill` only when duplication is obvious.
- Keep no extra UI library unless explicitly approved.

### Stage 14: Quick Access current-use cards

Status: complete for MVP.

Completed:

- Added a system collection `__quick_access__` with title `当前常用`.
- Added card detail action: `加入常用` / `已在常用`.
- Added left-sidebar `当前常用` panel showing up to 5 cards.
- Quick Access cards open directly from the sidebar.
- Reused existing `CardCollection.cardIds` order and existing collection order panel.
- Prevented deletion of the Quick Access system collection.
- No new database table or card-field change was introduced.

Known next improvement:

- Add recent-open tracking or automatic expiry only if real use proves it necessary.
- Do not add drag-and-drop just for aesthetics; up/down ordering is enough for now.

### Stage 18: One-click copy payload

Status: complete for MVP.

Completed:

- Added optional card fields `copyLabel` and `copyText`.
- Editor supports maintaining a dedicated “一键复制内容” block.
- Detail page shows a primary copy button only when `copyText` is non-empty.
- Detail page shows a non-print copy payload preview so users can verify what will be copied.
- Import validation accepts the optional fields and preserves `copyText` formatting.
- Card search includes `copyLabel` and `copyText`.
- Markdown export includes the copy payload section when present.
- Print output remains based on `content`; copy payload preview is marked `no-print`.

Design rule:

- `content` is for explanation, context, usage notes, and reading.
- `copyText` is the exact reusable payload to copy, especially for prompt/template cards.
- Do not upgrade to multiple copy blocks unless real use proves one primary payload insufficient.

## 13. Known Problems / Warnings

- The project is not currently a Git repository in the CodexPro workspace. Do not rely on git diff/status unless this changes.
- `stage6.css.tmp` still exists and should be deleted manually or by a tool that can delete files.
- `src/styles/global.css` is much smaller after splitting Style Lab, dashboard, layout, and library styles; only split tokens/base further if there is a clear maintenance benefit.
- Top command bar React markup and stale CSS have both been removed; do not reintroduce a full-width global command bar without explicit user approval.
- Collections now include explicit card ordering; continue to keep this lightweight unless real use proves drag-and-drop is necessary.
- Print center has A4-focused screen preview and browser print CSS; real browser print-preview QA is still required because page breaks can vary by content and browser.
- Quick Access is implemented as a system collection, not a separate table. Keep it lightweight unless real use proves more controls are needed.

## 14. Do Not Do Without Explicit Approval

- Add backend.
- Add login/account system.
- Add cloud sync.
- Add PDF generation dependency.
- Add Markdown HTML rendering with unsafe HTML.
- Add AI summarization service.
- Add knowledge graph / canvas / mind-map feature.
- Replace the app with a UI framework.
- Change existing data model in a way that breaks old IndexedDB data.
