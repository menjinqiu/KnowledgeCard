# KnowledgeCard UI Acceptance Checklist

Use this checklist after every UI-related change. If a change fails any critical item, fix the deviation before adding new UI features.

## 1. Product Fit

- [ ] The page feels like a knowledge workstation, not a marketing website.
- [ ] The interface supports daily long-session use without visual fatigue.
- [ ] The design remains compact and information-dense.
- [ ] The page avoids hero sections, decorative gradients, large empty bands, and promotional copy.

## 2. Layout

- [ ] Navigation, search, filters, list/detail, and actions are visually distinguishable.
- [ ] Desktop layout uses available width efficiently.
- [ ] Main workflows are reachable without excessive scrolling.
- [ ] Sidebar/filter areas are compact and stable.
- [ ] Future three-zone workstation migration is not blocked by the change.

## 3. Tokens

- [ ] New colors use CSS variables from `DESIGN.md`.
- [ ] New spacing uses the shared spacing scale.
- [ ] New radii use the shared radius scale.
- [ ] Shadows are minimal and tokenized.
- [ ] No new magic hex colors are introduced without updating the token system.

## 4. Components

- [ ] Buttons follow primary/secondary/ghost/danger hierarchy.
- [ ] Inputs are compact and have visible focus states.
- [ ] Cards show title, summary or context, metadata, tags, and key states clearly.
- [ ] Tags are restrained and not randomly colored.
- [ ] Empty, loading, error, and success states are compact and understandable.

## 5. Reading and Editing

- [ ] Long text remains readable at 15px-16px with comfortable line height.
- [ ] User content is not rendered via `dangerouslySetInnerHTML`.
- [ ] Prompt/code blocks are readable and safe.
- [ ] Editor keeps content as the primary area and metadata as secondary.

## 6. Print

- [ ] Print output hides navigation, buttons, filters, and screen-only controls.
- [ ] A4 layout remains clean in black and white.
- [ ] Tags and metadata remain legible without color dependence.
- [ ] Long content can span pages without severe section breaks.
- [ ] Print output looks like a manual, not a browser screenshot.

## 7. Accessibility

- [ ] All interactive elements have visible focus states.
- [ ] Color is not the only state indicator.
- [ ] Text contrast is readable.
- [ ] Form labels remain visible.
- [ ] Button text describes the action.

## 8. Functional Safety

- [ ] No business data model changes unless explicitly requested.
- [ ] Existing card create/edit/delete/search/filter/import/export/print flows still work.
- [ ] `npm run build` passes.
- [ ] If lint/test/typecheck scripts exist, they pass or failures are reported.

## 9. Documentation and Handoff

- [ ] If product direction, architecture, data model, routing, backup format, or design rules changed, update `docs/PROJECT_CONTEXT_LONG_TERM.md`.
- [ ] If the current session changed implementation status, risks, or next steps, update `docs/NEXT_SESSION_HANDOFF.md`.
- [ ] If a UI decision changes global layout or visual rules, update `DESIGN.md`.
- [ ] If a decision changes acceptance criteria, update this checklist.
- [ ] The next AI session can continue by reading the long-term and short-term handoff documents without needing the previous chat.

## 10. Visual Self-Check Questions

1. Does this screen still look like KnowledgeCard?
2. Can I scan 20 cards quickly?
3. Can I read a long card comfortably?
4. Can I tell which filters are active?
5. Are high-importance and high-time-sensitivity states clear but not loud?
6. Would this print clearly on A4 in black and white?
7. Would another AI agent know which style rules to follow next time?
