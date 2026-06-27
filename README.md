# KnowledgeCard

KnowledgeCard is a local, offline-first high-value content card library. It is designed for collecting, organizing, reading, reusing, exporting, and printing durable knowledge assets.

## Run Locally

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5175/
```

## Build

```bash
npm run build
```

## Main Routes

```text
#/                       Dashboard
#/library                Card library
#/collections            Collections / topic sets
#/data                   Data management / backup and import
#/cards/:id              Card detail
#/new                    New card
#/edit/:id               Edit card
#/print                  Print center
#/print?collection=:id   Print center initialized from a collection
#/print?directory=:id    Print center initialized from a Knowledge Space
#/print?directory=:id&scope=deep   Print center initialized from a space and descendants
#/style-lab              Design system preview
```

## Canonical Project Documents

The root-level documents are now the canonical long-term project documentation system.

Read these before making meaningful changes:

```text
PROJECT_BRIEF.md        Stable product goal, scope, boundaries, users, principles
ARCHITECTURE.md         Architecture, modules, data flows, interfaces, constraints
DECISION_LOG.md         Major product / architecture / data model / boundary decisions
CURRENT_STATE.md        Current verified state, known issues, TODOs, next priorities
NEXT_SESSION_PROMPT.md  Copyable fresh-session handoff prompt
```

## Historical / Supplemental Documents

The older `docs/` documents are still useful historical context, but they are no longer the primary entry point. Migrate useful information from them gradually; do not delete them until migration is confirmed complete.

```text
docs/PROJECT_CONTEXT_LONG_TERM.md   Historical long-term context and implementation history
docs/NEXT_SESSION_HANDOFF.md        Historical next-session handoff notes
docs/UI_STYLE_DECISIONS.md          UI decision reference
docs/UI_ACCEPTANCE_CHECKLIST.md     UI and handoff acceptance checklist
docs/CARD_TEMPLATE_SYSTEM.md        Card quality rules and template workflow
docs/SYNC_WORKFLOW.md               Manual sync package workflow and safety rules
docs/AUTO_SYNC_DESIGN.md            Bound-file auto sync and conflict-resolution design
DESIGN.md                           Design system and UI rules
```

## Recommended AI Session Startup Sequence

```text
1. Read PROJECT_BRIEF.md
2. Read ARCHITECTURE.md
3. Read DECISION_LOG.md
4. Read CURRENT_STATE.md
5. Read NEXT_SESSION_PROMPT.md
6. Read README.md
7. Read older docs only when historical detail is needed
8. Inspect relevant source files
9. Make small coherent changes
10. Run npm run build after code changes
11. Update DECISION_LOG.md / CURRENT_STATE.md / NEXT_SESSION_PROMPT.md as needed
```

## Current Stack

```text
Vite 6
React 19
TypeScript 5.7
Dexie 4 / IndexedDB
Plain CSS
Manual hash routing
```

## Product Boundaries

Do not add these without explicit approval:

```text
backend
login/account system
cloud sync
PDF generation dependency
unsafe HTML Markdown rendering
AI summarization service
knowledge graph / canvas feature
large UI framework replacement
```
