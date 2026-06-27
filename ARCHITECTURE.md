# KnowledgeCard Architecture

This document records the current architecture and technical constraints of `KnowledgeCard`. It should be updated when modules, data flows, dependencies, interfaces, or architecture direction change.

## 1. Architecture Overview

### Verified Facts

- `KnowledgeCard` is a local browser app.
- It uses Vite, React, TypeScript, Dexie, IndexedDB, plain CSS, and manual hash routing.
- There is no backend, no login system, no cloud sync, no router library, and no UI framework.
- Persistence is handled through IndexedDB via Dexie.
- Routes are hash-based and implemented in `src/app/App.tsx`.

### Current Architecture Summary

```text
Browser UI
  ↓
React pages and components
  ↓
Service layer
  ↓
Dexie database wrapper
  ↓
IndexedDB local storage
```

The application is intentionally simple: React components handle UI, service modules hold business operations, Dexie persists data locally, and export/import services handle files / pasted JSON.

## 2. Project Structure

### Verified Structure

```text
src/
  app/
  components/
  db/
  pages/
  services/
  styles/
  types/
  main.tsx

docs/
  PROJECT_CONTEXT_LONG_TERM.md
  NEXT_SESSION_HANDOFF.md
  UI_ACCEPTANCE_CHECKLIST.md
  UI_STYLE_DECISIONS.md
```

Root-level project docs introduced for long-term handoff:

```text
PROJECT_BRIEF.md
ARCHITECTURE.md
DECISION_LOG.md
CURRENT_STATE.md
NEXT_SESSION_PROMPT.md
```

## 3. Runtime and Routing

### Verified Facts

Routes are hash routes. Known routes include:

```text
#/                       Dashboard
#/library                Card library
#/library?domain=:domain Library filtered by domain
#/library?searchBox=1&q=:query Library search focus/query flow
#/collections            Collections / topic sets
#/collections?collection=:id Collection initially selected
#/data                   Data management
#/cards/:id              Card detail
#/new                    New card
#/edit/:id               Edit card
#/print                  Print center
#/print?collection=:id   Print center initialized from collection
#/style-lab              Design preview
```

### Key Constraint

Because routing is manual hash routing, route changes must be kept simple and carefully parsed in `src/app/App.tsx`. Do not introduce a router library without explicit approval.

## 4. Module Breakdown

## 4.1 App Shell and Navigation

### Files

```text
src/app/App.tsx
src/components/TopNav.tsx
src/styles/layout.css
src/styles/sidebar-compact.css
```

### Responsibilities

- Parse hash route.
- Render the correct page.
- Provide left navigation.
- Provide Quick Access current-use card entry.
- Provide left-side card search entry.

## 4.2 Card Library

### Files

```text
src/pages/LibraryPage.tsx
src/components/CardList.tsx
src/components/CardListItem.tsx
src/components/SearchBox.tsx
src/components/SidebarFilters.tsx
src/services/cardService.ts
src/styles/library.css
```

### Responsibilities

- Display cards.
- Search, sort, and filter cards.
- Toggle favorite.
- Open card detail.
- Batch select cards.
- Batch add selected cards to collections.
- Create collection from selected cards or visible filtered results.

### Interaction Rule

- Normal list mode: clicking card row body opens the card.
- Batch selection mode: clicking card row body toggles selection.
- Explicit controls inside rows must not trigger the row primary action.

## 4.3 Card Detail

### Files

```text
src/pages/DetailPage.tsx
src/components/CardDetail.tsx
src/components/MarkdownLite.tsx
src/services/markdownExportService.ts
```

### Responsibilities

- Display a single card.
- Render safe Markdown-lite content.
- Copy full body content.
- Render inline `copyText` block when present.
- Add card to collections.
- Toggle Quick Access.
- Toggle favorite/archive.
- Export Markdown.
- Print current card.
- Delete card.

### Copy Payload Design

`copyText` is not rendered as a detached information panel. It is rendered inside the body reading flow as a ChatGPT-style copyable block:

```text
[content label]                         [copy]
------------------------------------------------
copyText content
```

The inline copy block is marked `no-print` to avoid disrupting A4 print output.

## 4.4 Editor

### Files

```text
src/pages/EditorPage.tsx
src/components/TagInput.tsx
```

### Responsibilities

- Create cards.
- Update cards.
- Maintain title, summary, content.
- Maintain metadata.
- Maintain optional `copyLabel` and `copyText` fields.

## 4.5 Collections / Topic Sets

### Files

```text
src/pages/CollectionsPage.tsx
src/services/collectionService.ts
src/styles/collections.css
```

### Responsibilities

- Create collections.
- Select collection.
- Manage collection card order.
- Open cards from collection rows.
- Move cards up/down.
- Remove cards from collections.
- Protect Quick Access system collection from deletion.

### Data Rule

Collections use `CardCollection.cardIds` to store explicit order. No separate ordering table currently exists.

## 4.6 Quick Access

### Files

```text
src/services/collectionService.ts
src/components/TopNav.tsx
src/pages/DetailPage.tsx
```

### Concept

Quick Access is a system collection:

```text
__quick_access__
```

It is a lightweight current-use working set, not a separate table.

## 4.7 Data Management

### Files

```text
src/pages/DataManagementPage.tsx
src/services/importExportService.ts
src/services/backupValidationService.ts
src/services/syncPersistenceService.ts
src/services/boundSyncFileService.ts
src/services/syncPlanService.ts
src/services/syncApplyService.ts
src/types/sync.ts
```

### Responsibilities

- Export JSON backup.
- Preview JSON import.
- Import JSON file.
- Import pasted JSON text.
- Validate card, collection, and directory data before merge.
- Report added / updated / skipped / invalid records and skip reasons.
- Export manual sync packages with source-device metadata.
- Maintain local sync state, device identity, browser storage status, and recovery snapshots.
- Bind a user-selected local sync JSON file where supported by the browser File System Access API.
- Generate local-vs-bound-file sync plans, preflight checks, and read-only apply drafts.
- Apply non-conflict sync drafts with confirmation, recovery snapshot creation, bound-file write, and automatic IndexedDB rollback if bound-file write fails.

## 4.8 Print Center

### Files

```text
src/pages/PrintCenterPage.tsx
src/components/PrintPreview.tsx
src/styles/print-center.css
src/styles/print.css
```

### Responsibilities

- Select cards for print/manual output.
- Render A4-like screen preview.
- Print cover, table of contents, and manual cards.
- Preserve collection order when launched from a collection.

## 5. Core Data Model

### Verified Fields

`KnowledgeCard` includes these fields:

```text
id
title
domain
type
tags
summary
content
copyLabel
copyText
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

`copyLabel` and `copyText` are optional fields added to support one-click reusable payloads.

`DirectoryNode` provides the Knowledge Spaces location layer. Cards may store one primary location through `primaryDirectoryId` and `directorySortOrder`.

Synchronization support adds two Dexie tables:

```text
syncStates          device identity, mode, file binding metadata, timestamps
recoverySnapshots   cards / collections / directories snapshots for rollback and restore
```

`SyncState.fileHandle` may store a browser-granted `FileSystemFileHandle` when supported. Permission can still be lost or require re-approval after browser restart.

### Data Model Constraints

- Old cards without `copyLabel` / `copyText` must continue to work.
- `copyText` formatting must be preserved as much as possible.
- Tags should be normalized through existing tag service logic.
- `updatedAt` drives conflict resolution during import.

## 6. Core Data Flows

## 6.1 Card Creation / Update

```text
EditorPage
  → createCard/updateCard in cardService
  → knowledgeCardDb.cards
  → IndexedDB
  → navigate to card detail
```

## 6.2 Search and Filter

```text
LibraryPage loads all cards
  → cardService.applyCardFilters
  → cardService.sortCards
  → CardList renders filtered/sorted result
```

Search currently includes title, summary, content, copyLabel, copyText, and tags.

## 6.3 Collection Membership

```text
LibraryPage / DetailPage / CollectionsPage
  → collectionService
  → knowledgeCardDb.collections
  → cardIds array controls membership and order
```

## 6.4 JSON Import

```text
DataManagementPage
  → file text or pasted JSON text
  → backupValidationService validates objects
  → importExportService previews merge
  → user confirms
  → IndexedDB write transaction
```

## 6.5 One-click Copy Payload

```text
Editor stores copyLabel/copyText
  → CardDetail renders copyText inline with body
  → DetailPage handles clipboard write
  → status message reports success/failure
```

## 6.6 Local Sync and Bound Sync File

```text
DataManagementPage
  → syncPersistenceService maintains device identity, storage status, and recovery snapshots
  → boundSyncFileService creates/binds/reads/writes user-selected knowledgecard-sync.json
  → syncPlanService compares local IndexedDB with bound file and generates plan/preflight/apply draft
  → syncApplyService re-reads file, regenerates plan, creates before-one-click-sync snapshot, writes IndexedDB, writes bound file, rolls back IndexedDB if bound-file write fails
```

Current sync limitations:

- This is local file-bound sync, not backend/cloud-account sync.
- Automatic polling/listening is not implemented.
- Diff conflict-resolution UI is not implemented.
- Tombstone delete semantics are not implemented.
- Current apply logic is two-way, not full base/local/remote three-way merge.

## 7. Key Interfaces / Service Functions

### Card Service

- `getAllCards()`
- `getCard(id)`
- `createCard(draft)`
- `updateCard(id, patch)`
- `deleteCard(id)`
- `setFavorite(id, favorite)`
- `setArchived(id, archived)`
- `applyCardFilters(cards, filters)`
- `sortCards(cards, sortMode)`

### Collection Service

Important known capabilities:

- create collection;
- delete collection;
- add card(s) to collection;
- remove card from collection;
- move card within collection;
- manage Quick Access system collection.

### Import / Export and Sync Services

Important known capabilities:

- export full backup JSON;
- export manual sync package JSON;
- preview import from JSON file;
- preview import from pasted JSON text;
- import from JSON file;
- import from pasted JSON text;
- validate unsafe imported directory structures before preview/apply;
- request browser persistent storage status;
- create/list/restore recovery snapshots;
- create/bind/read/write user-selected local sync JSON file;
- generate sync plan, preflight, and apply draft;
- apply non-conflict bound-file sync draft with rollback if bound-file write fails.

## 8. Dependency Rules

### Current Dependencies

```text
runtime: react, react-dom, dexie
dev: vite, typescript, @vitejs/plugin-react, @types/react, @types/react-dom
```

### Dependency Constraints

Do not add dependencies unless:

- the problem is real and repeatedly painful;
- a small in-house solution would be more fragile;
- the dependency does not compromise local-first behavior;
- the user explicitly approves the tradeoff.

## 9. Important Technical Constraints

- Preserve IndexedDB compatibility.
- Avoid unsafe HTML rendering.
- Keep routes simple under manual hash routing.
- Keep print CSS stable and test through browser print preview when changing print layout.
- Avoid styling changes that reintroduce sparse marketing-style layouts.
- Keep high-impact operations explicit and reversible where possible.

## 10. Future Extension Directions

### Reasonable Future Directions

- Refine import conflict details if real data collisions become hard to understand.
- Improve manual QA around A4 print page breaks.
- Add more card generation prompts and store them as prompt cards.
- Add keyboard shortcuts only after core interactions stabilize.
- Consider multiple copy blocks only if one primary `copyText` proves insufficient.

### Not Recommended Without Strong Evidence

- Drag-and-drop collection sorting.
- Graph / canvas / mind-map.
- Backend sync, account sync, or direct cloud-provider API integration.
- Built-in AI summarization.
- PDF generation dependency.
- UI framework migration.
