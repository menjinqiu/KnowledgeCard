# KnowledgeCard Design System

## 1. Product Personality

KnowledgeCard is a local, offline-first knowledge workstation for high-value reusable content. It should feel precise, quiet, durable, and print-aware.

Personality keywords:

- Structured
- Dense
- Reliable
- Calm
- Engineering-oriented
- Long-session friendly
- Manual/print aware

It must never feel like a marketing landing page, social feed, visual inspiration board, or decorative card wall.

## 2. Visual Goals

The interface should optimize for:

1. Fast capture.
2. Fast scanning.
3. Fast filtering.
4. Comfortable long reading.
5. Low-friction copying/exporting.
6. Clean A4 printing.
7. Long-term visual consistency under AI-assisted iteration.

The default visual mood is light, neutral, compact, and high-contrast enough for daily work.

## 3. Design References

Shared reference library:

```text
/Users/menjinqiu/work/codex_workspace/_shared/references/design/awesome-design-md
```

Main reference translation:

- IBM Carbon-style structure: flat panels, crisp grid, low shadow, small radius, disciplined color.

Local references:

- Mintlify-style reading/manual clarity: documentation hierarchy, code/prompt blocks, three-zone information thinking.
- Linear-style product precision: compact controls, quiet accent, dense technical cards.

Do not copy any third-party brand assets, logos, illustrations, screenshots, proprietary color identity, or marketing layout.

## 4. Layout System

Desktop-first target layout:

```text
Left rail: 220px - 248px
Main content: flexible, dense list/grid/results area
Right panel where useful: about 300px - 460px depending on page context
```

Current shell decision:

```text
Left sidebar = global navigation + global shortcuts
Page header = current page or current card actions
Main content = actual reading, editing, selecting, or previewing work
```

The previous global top command/search band was removed because it duplicated left navigation and wasted valuable vertical space. Do not reintroduce a full-width top navigation/command bar unless the user explicitly requests it.

Long-term workstation structure:

```text
Navigation / Filters | Card List / Search Results | Detail / Editor / Preview
```

Rules:

- Use full desktop width; do not constrain app pages like marketing pages.
- Keep page gutters compact: 20px-28px on desktop.
- Prefer panels and separators over large empty bands.
- No hero sections.
- No full-width marketing banners.

## 5. Color Tokens

Use CSS variables. Do not scatter magic hex values in components.

Core tokens:

```css
--color-bg: #f4f6f8;
--color-bg-subtle: #eef2f5;
--color-surface: #ffffff;
--color-surface-muted: #f8fafb;
--color-surface-strong: #eef3f6;
--color-border: #d9e0e6;
--color-border-strong: #b9c4cf;
--color-text: #172026;
--color-text-muted: #5f6f7b;
--color-text-subtle: #81909c;
--color-accent: #0f766e;
--color-accent-strong: #115e59;
--color-accent-soft: #e4f2f0;
--color-info: #2563eb;
--color-warning: #b7791f;
--color-warning-soft: #fff7e6;
--color-danger: #b42318;
--color-danger-soft: #fee9e7;
--color-success: #247c43;
--color-success-soft: #eef8f1;
```

Accent rules:

- Use teal/blue-green as the KnowledgeCard accent.
- Accent is for primary actions, active navigation, focus, and high-value emphasis only.
- Tags should not each receive random colors.
- Danger red is only for destructive action and error state.
- Warning amber is for high-time-sensitivity, not decoration.

## 6. Typography

Font stack:

```css
Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif
```

Monospace stack:

```css
ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace
```

Type tokens:

```css
--font-size-xs: 12px;
--font-size-sm: 13px;
--font-size-md: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 22px;
--font-size-2xl: 28px;
--line-tight: 1.25;
--line-normal: 1.5;
--line-reading: 1.72;
```

Rules:

- Page titles: 24px-28px, not marketing-scale.
- Card titles: 16px-18px, weight 700/800.
- Metadata: 12px-13px.
- Long reading: 15px-16px with 1.7+ line height.
- Code/prompt blocks: 13px-14px monospace.

## 7. Spacing

Spacing tokens:

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
```

Rules:

- Dense controls use 8px-12px gaps.
- Cards use 12px-16px internal padding.
- Detail reading panels use 20px-28px internal padding.
- Avoid large 64px+ decorative vertical whitespace except print/manual covers.

## 8. Border Radius

Radius tokens:

```css
--radius-xs: 4px;
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-pill: 999px;
```

Rules:

- Buttons and inputs: 6px-8px.
- Cards/panels: 8px-12px.
- Tags/pills: pill radius.
- Do not mix random radii per page.

## 9. Shadows

Shadow tokens:

```css
--shadow-none: none;
--shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
--shadow-md: 0 8px 24px rgba(15, 23, 42, 0.08);
```

Rules:

- Default panels should use borders, not shadows.
- Shadow is allowed only for floating overlays, drawers, or temporary focus surfaces.
- No heavy SaaS card shadows.

## 10. Component Rules

All components must use shared tokens.

Button hierarchy:

- Primary: main create/save/generate action.
- Secondary: normal navigation/export/import actions.
- Ghost/text: low-emphasis secondary actions.
- Danger: destructive actions only.

Inputs:

- Compact height: 34px-38px.
- Clear focus ring.
- No oversized marketing inputs.

Panels:

- White or muted surface.
- 1px border.
- Small radius.
- Minimal shadow.

## 11. Sidebar

Sidebar rules:

- Width: 220px-248px.
- Sticky on desktop.
- Use compact grouped navigation and filters.
- Active state uses accent-soft background and accent-strong text.
- Avoid icon-only navigation in MVP; text clarity matters more.

## 12. Global Shortcuts / Command Entry

KnowledgeCard currently does not use a full-width global top bar. Global shortcuts live in the left sidebar to preserve vertical content space.

Rules:

- Global navigation belongs in the left sidebar.
- Global search entry and new-card entry may live in the left sidebar as compact quick actions.
- Page headers should only contain actions for the current page or current card.
- Avoid duplicate navigation between sidebar and top area.
- Do not create a marketing header.
- Do not add a full-width top command/search band without explicit user approval.

## 13. Card List / Card Grid

Cards are information units, not decorations.

Each card should clearly expose:

1. Title.
2. Summary.
3. Domain.
4. Type.
5. Tags.
6. Importance.
7. Validity.
8. Updated time.
9. Favorite/archive/printable state.

Rules:

- List view is the default high-density view.
- Grid view may be added later but must remain dense.
- Title first, metadata second, summary third or summary second depending layout.
- Tags are compact and low-noise.
- Archived card: subdued opacity/tone, not hidden when explicitly selected.
- High-value card: subtle border or accent stripe, not bright background.

## 14. Card Detail Panel

Detail view should support long reading and quick action.

Rules:

- Title and metadata visible at top.
- Summary separated from body.
- Tags visible but subdued.
- Actions grouped and clearly separated from reading content.
- Future right panel should be 360px-460px for quick preview, with full reading mode available.

## 15. Search and Filter

Search and filtering are primary workflows.

Rules:

- Search input must be visually prominent.
- Filters should be compact and persistent.
- Active filters should be visible.
- Reset action must be easy to find.
- Search and filters must work together without visual ambiguity.

## 16. Tags and Metadata

Tags:

- Use one restrained style by default.
- No random tag colors.
- Max visual height: about 22px-24px.
- Long tags should wrap or truncate safely.

Metadata pills:

- Domain/type/validity/importance may be rendered as metadata pills.
- High-time-sensitive content may use warning tone.
- Expired content may use muted/danger tone.

## 17. Reading View

Reading view must be safe and calm.

Rules:

- User content must not be rendered via `dangerouslySetInnerHTML`.
- Preserve line breaks.
- Support readable prompt/code/checklist blocks using React text nodes or safe parsing only.
- Text width should not become too wide in full reading mode.
- Use 1.7+ line-height for long body text.

## 18. Editor View

Editor should be efficient, not ceremonial.

Rules:

- Main content textarea should dominate.
- Metadata fields should live in side panel.
- Required fields must be obvious.
- Save action must be stable and visible.
- Later quick-capture mode should ask for title/content first and defer metadata.

## 19. Manual / Print View

Printing is a first-class KnowledgeCard feature.

Manual print should feel like formal material, not a browser screenshot.

Rules:

- A4 page support.
- Hide navigation, buttons, filters, and screen-only controls.
- Use black/white-safe text, borders, and tags.
- Avoid heavy backgrounds and shadows.
- Card sections should have clear page boundaries.
- Long content may span pages, but headings should not be orphaned.

Future manual features:

- Cover.
- Table of contents.
- Section grouping.
- Prompt/code block styling.
- Checklist block styling.
- Source and timestamp footer.

## 20. Collections / Topic Sets

Collections are curated topic sets, not traditional folders. One card may belong to multiple collections.

Rules:

- Collections should support learning packs, reusable material packs, checklists, and print-manual sources.
- Do not replace domain/type/tags with a folder tree.
- Collection controls in card detail belong in the right-side information panel because they are auxiliary organization actions.
- Collection-to-print flow should preserve the idea that a collection can become a manual.
- Batch collection operations should primarily happen from the card library, not by forcing users to open cards one by one.

## 21. Empty States

Empty states must be compact and action-oriented.

Rules:

- Say what is empty.
- Offer one clear next action.
- No large illustrations.
- No marketing copy.

## 21. Loading States

Rules:

- Keep loading text small and stable.
- Avoid flashy spinners.
- Use skeletons only if they preserve layout.

## 22. Error States

Rules:

- Error states use danger text/background.
- Explain what failed.
- Preserve user data where possible.
- Offer recovery action when possible.

## 23. Responsive Rules

Desktop is primary.

Breakpoints:

- Above 1200px: three-zone workstation layout should be supported.
- 960px-1199px: two-column or top-filter layout.
- Below 960px: stack panels vertically.
- Below 620px: mobile basic usability only.

Rules:

- Do not sacrifice desktop density for mobile.
- Touch targets should remain at least 32px-36px high.

## 24. Accessibility Rules

Rules:

- Visible focus state for all interactive elements.
- Button text must describe action.
- Color cannot be the only state indicator.
- Maintain readable contrast.
- Form labels must remain visible.
- Print output must remain understandable in black and white.

## 25. Forbidden Patterns

Forbidden:

1. Hero sections.
2. Large decorative gradients.
3. Marketing copy blocks.
4. Full-bleed imagery.
5. Random tag colors.
6. Heavy shadows.
7. Oversized cards with sparse content.
8. Per-page one-off color systems.
9. Dark-only default app shell.
10. Notion-like empty gray database imitation.
11. Apple-like large whitespace.
12. Copying third-party brand assets.
13. Introducing UI libraries without explicit approval.
14. Breaking existing business logic during visual refactors.

## 26. UI Acceptance Checklist

Before any UI change is accepted:

1. Does the page feel like a knowledge workstation?
2. Is information density high enough?
3. Are search and filters prominent?
4. Are cards easy to scan?
5. Are metadata and tags restrained?
6. Is long text readable?
7. Is print output clean?
8. Are colors, spacing, radii, and shadows tokenized?
9. Are there any magic colors or one-off spacing values?
10. Did the change avoid marketing-page patterns?
11. Did the change preserve existing data and business logic?
12. Does `npm run build` pass?
