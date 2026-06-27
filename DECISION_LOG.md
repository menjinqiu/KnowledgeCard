# KnowledgeCard Decision Log

This file records decisions that materially affect future product, architecture, data model, UI rules, or technical direction. Do not use it as a daily changelog.

## Decision Format

Each decision should record:

- status;
- date;
- background;
- alternatives considered;
- final choice;
- reason;
- tradeoffs / cost;
- follow-up impact.

## D-001: Keep KnowledgeCard Local-First and Offline-First

Status: accepted / active.

Date: established before this document; documented here during long-term documentation initialization.

### Background

The project is a personal high-value content card system. Existing implementation uses browser storage through Dexie / IndexedDB and has no backend or account system.

### Alternatives Considered

1. Keep app local-only.
2. Add backend and account system.
3. Add cloud sync or multi-device sync.

### Final Choice

Keep the app local-first and offline-first. Do not add backend, login, account, or cloud sync without explicit approval.

### Reason

The user values local control, low complexity, speed, data transparency, and long-term maintainability. A backend would multiply scope and maintenance burden.

### Tradeoffs / Cost

- No automatic multi-device sync.
- Data safety depends on export/backup workflows.
- Collaboration is not supported.

### Follow-up Impact

Data management, JSON export/import, and pasted JSON import are important because they are the project’s main data portability mechanism.

## D-002: Use Simple React + Vite + TypeScript + Dexie Architecture

Status: accepted / active.

Date: existing technical direction; documented here during long-term documentation initialization.

### Background

The existing project uses Vite, React, TypeScript, Dexie, plain CSS, and manual hash routing.

### Alternatives Considered

1. Keep the lightweight current stack.
2. Add a UI framework.
3. Add router / state management libraries.
4. Replace local storage with a backend database.

### Final Choice

Keep the current lightweight stack. Add dependencies only when a real repeated pain justifies them and the user approves.

### Reason

The current stack is sufficient for a local, single-user, offline-first tool. Large frameworks or backend services would increase complexity without solving the current core problems.

### Tradeoffs / Cost

- More UI components are hand-built.
- Manual hash routing requires careful maintenance.
- More responsibility for CSS consistency.

### Follow-up Impact

Future features should prefer small service/component additions instead of architectural rewrites.

## D-003: Treat Collections as Curated Topic Sets, Not Folders

Status: accepted / active.

Date: established in existing project context; documented here during long-term documentation initialization.

### Background

Cards may belong to multiple contexts: learning manuals, prompt collections, investment checklists, health references, etc.

### Alternatives Considered

1. Folder-like single membership.
2. Tag-only grouping.
3. Manual multi-card collections.

### Final Choice

Use collections as manually curated topic sets. One card may belong to multiple collections.

### Reason

Topic sets support reusable packages and printable manuals better than folders. Tags alone are too loose for ordered handbooks.

### Tradeoffs / Cost

- More explicit management is required.
- Collections need ordering tools.

### Follow-up Impact

Collection order is stored in `CardCollection.cardIds`. Print center should respect this order when launched from a collection.

## D-004: Implement Quick Access as a System Collection

Status: accepted / active.

Date: implemented before this document; documented here during long-term documentation initialization.

### Background

The user needed a lightweight current-use entry for frequently used cards without confusing it with long-term favorites.

### Alternatives Considered

1. New database table.
2. New card field.
3. Reuse collection model with a system collection.

### Final Choice

Implement Quick Access as the system collection `__quick_access__`.

### Reason

Reusing collections avoids new tables and preserves existing ordering / backup behavior.

### Tradeoffs / Cost

- System collection needs special protections.
- Semantics are slightly different from normal collections.

### Follow-up Impact

Do not delete Quick Access. Keep it lightweight. Do not add automatic expiration, recent-open tracking, or drag-and-drop unless real usage proves necessary.

## D-005: Support Pasted JSON Import for AI-generated Cards

Status: accepted / active.

Date: implemented before this document; documented here during long-term documentation initialization.

### Background

A major workflow is asking AI to generate card JSON, then importing it into the local app.

### Alternatives Considered

1. Require saving `.json` files and using file import.
2. Add pasted JSON import.
3. Build direct AI integration inside the app.

### Final Choice

Add pasted JSON import while reusing the existing validation and merge flow.

### Reason

Pasted JSON reduces friction without requiring backend, accounts, or AI services inside the app.

### Tradeoffs / Cost

- Users must still generate valid JSON outside the app.
- The app must clearly validate and preview imports.

### Follow-up Impact

AI card-generation prompts must follow the import schema. Data-management feedback and validation quality are important.

## D-006: Use Single Primary Copy Payload Per Card

Status: accepted for MVP / active.

Date: implemented before this document; documented here during long-term documentation initialization.

### Background

Prompt and template cards often need a reusable body that should be copied directly, while card content still needs explanatory context.

### Alternatives Considered

1. Copy the whole `content` only.
2. Add a single `copyText` payload and optional `copyLabel`.
3. Add multiple copy blocks per card.
4. Parse copy blocks from Markdown headings.

### Final Choice

Add optional `copyLabel` and `copyText` fields. Support one primary copy payload per card.

### Reason

Single payload solves the main prompt/template use case while keeping the data model simple.

### Tradeoffs / Cost

- Some cards might eventually need multiple copy payloads.
- `copyText` and `content` can drift if the user maintains both poorly.

### Follow-up Impact

Render `copyText` inside the body reading flow as an inline ChatGPT-style copy block, not as a detached panel. Do not implement multiple copy blocks until real usage proves one primary payload insufficient.

## D-007: High-impact Operations Need Explicit and Local Feedback

Status: accepted / active.

Date: implemented before this document; documented here during long-term documentation initialization.

### Background

The user noticed some operations, such as adding selected cards to an existing collection, did not provide enough visible feedback near the action area.

### Alternatives Considered

1. Use only top-of-page status strips.
2. Use local feedback near each sub-panel.
3. Use global toast notifications.

### Final Choice

Use local in-context feedback for sub-panel actions, while keeping page-level status where useful.

### Reason

The user should not have to look away from the action area to confirm success or failure.

### Tradeoffs / Cost

- More UI state in some pages.
- Need to avoid noisy feedback for low-risk toggles.

### Follow-up Impact

Add, create, remove, import, export, delete, save, and similar high-impact operations should provide explicit feedback. Favorite toggles with visible state changes do not need extra notification unless usage proves otherwise.

## D-008: Card/List Rows Should Have One Clear Primary Action

Status: accepted / active.

Date: implemented before this document; documented here during long-term documentation initialization.

### Background

The user identified inefficient interactions where only small controls were clickable.

### Alternatives Considered

1. Keep small title/button click targets.
2. Make whole row clickable but risk accidental actions.
3. Define row primary action and protect inner controls.

### Final Choice

Use clear row primary actions. Normal card row click opens; batch-selection row click selects; inner controls keep their own behavior.

### Reason

This improves speed and reduces precision burden while preserving control safety.

### Tradeoffs / Cost

- Needs careful event handling to avoid inner-control conflicts.
- Requires clear visual hover/selected states.

### Follow-up Impact

Future list-like UI should follow this pattern.

## D-009: Root-level Docs Are Canonical; Older docs/ Files Are Historical Supplements

Status: accepted / active.

Date: 2026-06-26.

### Background

The user requested a long-term multi-session documentation system with five root-level documents:

```text
PROJECT_BRIEF.md
ARCHITECTURE.md
DECISION_LOG.md
CURRENT_STATE.md
NEXT_SESSION_PROMPT.md
```

The project already had older context documents under `docs/`.

### Alternatives Considered

1. Keep older `docs/` files as primary.
2. Use root-level documents as canonical and keep old docs as historical supplements.
3. Delete older docs immediately.

### Final Choice

The root-level five-document system is now canonical. Older `docs/PROJECT_CONTEXT_LONG_TERM.md` and `docs/NEXT_SESSION_HANDOFF.md` should be gradually migrated and downgraded to historical/supplemental references.

### Reason

The root-level documents match the long-term handoff structure requested by the user and make fresh-session onboarding more predictable.

### Tradeoffs / Cost

- There is temporary duplication between root docs and older docs.
- Future sessions must avoid treating older docs as primary if they conflict with canonical root docs.

### Follow-up Impact

- README must point to the root-level documents first.
- Useful historical detail should be migrated gradually.
- Do not delete older docs until migration is confirmed complete.

## D-010: Next Work Priority Is Full QA Before More Feature Expansion

Status: accepted / active.

Date: 2026-06-26.

### Background

Recent work added or refined several important workflows: pasted JSON import, batch feedback, whole-row interactions, Quick Access, and inline copy payload blocks.

### Alternatives Considered

1. Continue feature development immediately.
2. Do a full QA pass first.
3. Only check the last changed feature.

### Final Choice

Do a full QA pass before continuing feature expansion.

### Reason

The product has enough implemented surface area that unchecked feature growth would increase instability and UI inconsistency.

### Tradeoffs / Cost

- Slower short-term feature progress.
- More focus on verification and refinement.

### Follow-up Impact

QA should cover card CRUD, detail page, inline copy block, pasted JSON import, batch collection feedback, Quick Access, collection ordering, search/filter/sort, data export/import, and print preview.

## D-011: Store New Card-generation Prompts as KnowledgeCard Prompt Cards

Status: accepted / active.

Date: 2026-06-26.

### Background

The app now supports prompt/template cards with `copyLabel` and `copyText`, and the user wants the updated card-generation prompts available inside the system itself.

### Alternatives Considered

1. Keep prompts only in chat.
2. Keep prompts only in project docs.
3. Create importable KnowledgeCard JSON prompt cards.

### Final Choice

Create importable KnowledgeCard JSON containing the updated card-generation prompts as prompt/template cards.

### Reason

This dogfoods the system’s core workflow: AI-generated reusable content becomes structured cards, then can be imported through pasted JSON or file import.

### Tradeoffs / Cost

- The file must still be imported by the user through the browser app; filesystem creation alone cannot write into browser IndexedDB.
- Prompt cards need maintenance when the import schema changes.

### Follow-up Impact

Create and maintain `docs/imports/knowledgecard-generation-prompts.json`. The user can import it from `#/data`.

## D-012: Add Directory Tree as Primary Location Layer

Status: accepted / active.

Date: 2026-06-26.

### Background

Short-term use showed that a pure card-library plus flat collection model feels scattered. Search/filtering and topic sets are useful, but they do not create stable spatial memory. The user needs fixed locations to quickly narrow the search area through familiarity.

### Alternatives Considered

1. Keep only card library, filters, tags, and collections.
2. Convert collections into folders.
3. Add a directory tree as a separate primary-location layer while keeping cards, collections, tags, and search.

### Final Choice

Add a directory tree as the primary location layer. Each card may have one `primaryDirectoryId`. Collections remain multi-card topic/manual/task packages. Tags remain horizontal attributes. Card library remains full search and bulk-management surface.

### Reason

A stable directory gives each card a home location and supports path memory. It solves the current scattered feeling without losing the existing ability to reuse cards in multiple collections.

### Tradeoffs / Cost

- Adds a Dexie `directories` table and optional card directory fields.
- Requires users to gradually assign existing cards to main directories.
- Creates another organizational surface that needs clear semantics to avoid becoming a second collection system.

### Follow-up Impact

- Directory is the daily browsing entry.
- Card library is still needed for search and filtering.
- Collections should not be treated as folders; they are for manuals, reusable packages, and task bundles.
- Backup/import must preserve directories and card primary directory fields.

## D-013: Build Template System as Cards and Documentation, Not a Template Engine

Status: accepted / active.

Date: 2026-06-26.

### Background

After stabilizing Knowledge Spaces, batch management, detail reuse, and import safety, the next high-value step is improving the quality and consistency of AI-generated cards. Poorly structured cards would make the library harder to search and maintain over time.

### Alternatives Considered

1. Build a full in-app template engine.
2. Keep templates only as external chat prompts.
3. Create a lightweight template system using a documentation guide plus importable template prompt cards.

### Final Choice

Use a lightweight template system. Create `docs/CARD_TEMPLATE_SYSTEM.md` for card-quality rules and maintain `docs/imports/knowledgecard-card-templates.json` as importable KnowledgeCard template cards.

### Reason

The app already supports prompt/template cards with `copyText`, and data import already supports file/pasted JSON. Reusing those mechanisms avoids overbuilding while still improving long-term content quality.

### Tradeoffs / Cost

- Users must import the template cards manually through `#/data`.
- Templates are maintained as JSON and docs rather than a dedicated UI.
- Template prompts need updating if the card schema changes.

### Follow-up Impact

- Do not add a complex template engine until repeated real use proves that copying template prompts is too slow.
- Template cards should be placed in a KnowledgeCard template collection after import.
- QA must verify template JSON import, copyText behavior, and discoverability from Data Management.

## D-014: Use Local Bound-file Sync Instead of Backend or Account Sync

Status: accepted / active.

Date: 2026-06-26.

### Background

The user clarified that manual sync packages were not enough. The desired direction is file-bound synchronization through a local file placed in Nutstore / iCloud / another synced folder, while still avoiding backend accounts and preserving local control.

### Alternatives Considered

1. Keep only manual export/import sync packages.
2. Add backend/account/cloud-provider API sync.
3. Use a user-selected local sync JSON file via browser file access where supported.

### Final Choice

Use local-first bound-file sync. IndexedDB remains the primary database. The user-selected sync JSON file is a transport / external safety copy, not the only source of truth.

### Reason

This provides a practical multi-device path while preserving the project’s local-first character and avoiding backend/account complexity.

### Tradeoffs / Cost

- Browser file permissions can be revoked or require re-approval.
- File binding depends on browser File System Access API support.
- It is not true background sync after the tab is closed.
- Browser QA is mandatory before trusting it with real data.

### Follow-up Impact

- Local persistence and recovery snapshots must exist before sync writes.
- Data Management owns sync setup, file binding, plan generation, and guarded apply.
- Automatic polling/listening and diff conflict UI remain future work, not completed features.

## D-015: Sync Apply Must Be Guarded by Plans, Recovery Snapshots, and Rollback

Status: accepted / active.

Date: 2026-06-26.

### Background

Applying a sync plan can modify both IndexedDB and an external sync file. If local write succeeds but external file write fails, local and remote can diverge.

### Alternatives Considered

1. Write directly without a snapshot.
2. Create snapshot but require manual recovery only.
3. Re-read remote, regenerate plan, create recovery snapshot, apply guarded draft, and automatically roll back IndexedDB if file write fails.

### Final Choice

Use a guarded apply flow: re-read bound file, regenerate plan, require preflight/apply-draft safety, require user confirmation, create `before-one-click-sync` recovery snapshot, write IndexedDB, write bound file, and roll back IndexedDB to the snapshot if the bound-file write fails.

### Reason

This reduces the highest-risk failure mode without introducing a backend or complex transaction system across browser storage and the file system.

### Tradeoffs / Cost

- Rollback protects IndexedDB, but cannot guarantee recovery of an external file if the browser/file-system layer partially writes or corrupts it before throwing.
- Current apply logic is still two-way, not full base/local/remote three-way merge.
- Tombstone/delete semantics are not implemented, so one-side records are treated conservatively.

### Follow-up Impact

- Browser QA must explicitly test successful apply and simulated/forced file-write failure.
- Do not implement automatic polling until the apply path is manually verified.
- Full conflict diff UI and tombstones remain future work.

## D-016: Treat Printed Output as a Designed Learning Manual, Not a Browser Screenshot

Status: accepted / active.

Date: 2026-06-27.

### Background

KnowledgeCard printing is no longer just a technical browser-output feature. The product direction now treats print output as a first-class long-term learning and review artifact. Recent print work introduced page-per-card and compact continuous modes, optional cover / TOC / summary / tags / source / copyText controls, print-only copyText blocks, and a warm A4-oriented paper visual system in `src/styles/print.css` with a supporting design note in `docs/PRINT_VISUAL_SYSTEM_PHASE_A.md`.

A previous strict handoff attempt was interrupted by repeated CodexPro 502 errors, so this decision was discussed and partially implemented but was not yet recorded as a major design decision.

### Alternatives Considered

1. Keep print output as a simple rendering of existing web UI.
2. Treat print output as a browser screenshot with minor `@media print` cleanup.
3. Treat print output as a designed learning manual with its own paper hierarchy, typography, spacing, low-saturation accents, and QA standards.

### Final Choice

Treat KnowledgeCard printed output as a designed modern learning manual, not as a webpage screenshot. The print experience should use a restrained paper visual system: black / white / gray as the main body, low-saturation accents only for structure and emphasis, controlled A4 margins, readable body width, clear cover / TOC / card / summary / body / copyText / footer hierarchy, and two output densities for archival vs paper-saving use.

### Reason

Printed cards are a core KnowledgeCard use case: learning, reviewing, sharing with family, preserving high-value prompts and checklists, and creating durable offline manuals. A raw webpage printout would weaken that core value and make long-term paper use feel accidental instead of intentional.

### Tradeoffs / Cost

- Print CSS becomes a real design surface, not just a hide-navigation stylesheet.
- Chrome print preview, save-as-PDF, and physical A4 checks become mandatory before claiming print QA success.
- More care is required when changing detail page or print preview markup because screen copy blocks and print-only copy blocks have separate purposes.
- Some screen UI choices should not be copied into print if they reduce paper readability.

### Follow-up Impact

- Do not keep blind-tuning `src/styles/print.css`; inspect real Chrome system print preview first.
- Do not claim `npm run build` proves print quality.
- Keep `docs/PRINT_VISUAL_SYSTEM_PHASE_A.md` as the current print visual reference.
- Future print work must record PASS / FAIL / NOT RUN separately for page-per-card, compact continuous, system print preview, save-as-PDF, and physical A4 paper output.
- The current Print Center still filters candidate cards by `card.printable`; any future weakening/removal of that gate is a separate decision and is not part of this decision.

## Pending / Not Yet Accepted Decisions

These are not accepted decisions. They need user confirmation or real-use evidence before implementation:

- Whether to add multiple copy blocks per card.
- Whether to add keyboard shortcuts.
- Whether to add richer import conflict detail.
- Whether to remove older docs after migration is complete.
