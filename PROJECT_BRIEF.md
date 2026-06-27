# KnowledgeCard Project Brief

This document is the stable project brief for `KnowledgeCard`. It should stay relatively stable and should not be filled with sprint-level details.

## 1. Project Identity

### Verified Facts

- Project name: `KnowledgeCard`.
- Local path: `/Users/menjinqiu/work/codex_workspace/KnowledgeCard`.
- Product type: local, offline-first, browser-based knowledge card library.
- Current implementation is a Vite + React + TypeScript application using Dexie / IndexedDB.

### Current Understanding

`KnowledgeCard` is intended to become a personal high-value content workstation. It helps the user collect, structure, search, reuse, export, and print durable knowledge assets from AI conversations, personal notes, learning materials, investment reviews, development prompts, and other reusable information.

Core product sentence:

```text
A local high-value content workstation for searchable cards, reusable collections, one-click reusable payloads, and printable manuals.
```

## 2. Long-Term Goal

### Verified Facts

The existing app already supports cards, search/filtering, collections, JSON backup/import, pasted JSON import, print center, Quick Access, and one-click copy payload fields.

### Long-Term Goal

Build a compact, local-first, durable knowledge-card system that can serve as:

- a high-value content archive;
- a prompt/template library;
- a learning material library;
- a reusable checklist and decision-support library;
- a printable manual generator;
- a bridge between ChatGPT-generated structured content and long-term personal knowledge reuse.

## 3. Core Usage Scenarios

### Verified / Existing Scenarios

- Create, edit, read, search, filter, and archive knowledge cards.
- Group cards into collections / topic sets.
- Print cards or collections as A4-style manuals.
- Import and export JSON backups.
- Paste AI-generated KnowledgeCard JSON directly into the app and import after preview.
- Maintain Quick Access current-use cards.
- Store `copyText` payloads for prompt/template cards and copy them from an inline readable block.

### Intended Scenarios

- Ask AI to convert valuable content into KnowledgeCard JSON.
- Paste generated JSON into the data-management page.
- Review imported cards in the card library.
- Use one-click copy blocks for prompts, templates, checklists, and exercise content.
- Curate collections for learning, work, investment review, family decisions, and long-term reusable knowledge.

## 4. Target User

### Verified Facts

- Primary user is a technical user comfortable with local project files and AI-assisted development.
- The user prefers compact, high-density, practical local tools over cloud services or decorative UI.
- The user uses ChatGPT and CodexPro-style workflows for iterative local development.

### Target User Description

The product is optimized for one power user first, not for a broad public SaaS audience. It should prioritize long-session usability, fast retrieval, maintainable local data, and practical reuse.

## 5. Product Boundaries

### In Scope

- Local card CRUD.
- IndexedDB persistence.
- JSON import/export and pasted JSON import.
- Manual sync packages and user-bound local sync JSON file workflow.
- Manual collections / topic sets.
- Quick Access current-use cards.
- Search, filtering, sorting, and archive management.
- Lightweight safe Markdown rendering.
- A4-oriented print center.
- One-click copy payload for prompts/templates/checklists.
- Compact desktop-first UI refinement.

### Out of Scope Unless Explicitly Approved

- Backend service.
- Login or user account system.
- Backend / account-based / direct-cloud-API sync. Local user-bound file sync is allowed because it preserves local-first control.
- AI summarization service inside the app.
- Automatic web clipping service.
- PDF generation dependency.
- Large UI framework replacement.
- Knowledge graph, canvas, mind map, or drag-heavy visual workspace.
- Social sharing, multi-user collaboration, or SaaS packaging.
- Unsafe HTML rendering from user content.

## 6. Forbidden / High-Risk Changes

Do not do the following without explicit approval:

- Add backend, login, account, direct cloud API sync, or account-based cloud sync.
- Add PDF generation libraries.
- Add large UI frameworks or replace the existing CSS system wholesale.
- Change the IndexedDB data model in a way that breaks existing local data.
- Use `dangerouslySetInnerHTML` or unsafe Markdown HTML rendering.
- Reintroduce a full-width global command bar without explicit approval.
- Convert the project into a generic note-taking clone.
- Add features just to look complete if they do not serve the user’s real workflow.

## 7. Technology Stack

### Verified Facts

```text
Vite 6
React 19
React DOM 19
TypeScript 5.7
Dexie 4 / IndexedDB
Plain CSS
Manual hash routing
```

Current scripts:

```bash
npm run dev
npm run build
npm run preview
```

Local dev server is configured in `package.json`:

```text
vite --host 127.0.0.1 --port 5175
```

## 8. Long-Term Design Principles

- Local-first and offline-first.
- User data should remain transparent and exportable.
- Prefer small, coherent refinements over large rewrites.
- UI should be compact but not cramped.
- Every high-impact operation should provide clear feedback.
- Card rows and list items should have clear primary actions.
- Content should remain readable and printable.
- Prompt/template content should not be buried; it should be usable through inline copy blocks.
- Avoid dependency growth unless it clearly reduces long-term maintenance burden.
- Do not mistake visual decoration for productivity.

## 9. AI Collaboration Rules

- Do not rely on chat memory alone. Read project documents and relevant code before meaningful changes.
- Do not write “discussed” as “implemented”.
- Do not write “planned” as “completed”.
- Separate verified facts, current assumptions, open questions, and next tasks.
- Update `DECISION_LOG.md` when product, architecture, data model, boundary, or technical direction changes.
- Update `CURRENT_STATE.md` when current stage, implementation status, bugs, mock/TODOs, or verification results change.
- Keep `PROJECT_BRIEF.md` stable and avoid short-term implementation notes here.
- Keep `NEXT_SESSION_PROMPT.md` independently usable in a fresh conversation.
- Make small coherent changes and run `npm run build` after code changes.
- Report changed files, business impact, verification result, risks, and suggested next step.

## 10. Open Questions

### Confirmed Direction

- Root-level documents are the canonical project documents.
- Older `docs/PROJECT_CONTEXT_LONG_TERM.md` and `docs/NEXT_SESSION_HANDOFF.md` are historical / supplemental and should be gradually migrated or downgraded.
- New card-generation prompts should be stored as importable KnowledgeCard prompt cards.

### Pending Confirmation

- Whether `copyText` should eventually support multiple copy blocks per card. Current direction is no, unless real usage proves it necessary.
- Whether older docs should eventually be archived, renamed, or left in place after migration is complete.
