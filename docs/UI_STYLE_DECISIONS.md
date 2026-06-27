# KnowledgeCard UI Style Decisions

## 1. Current UI Problems

KnowledgeCard already has a working MVP UI, but it does not yet have a durable design system. The current interface is usable and restrained, yet future AI-assisted development may easily drift because there is no root `DESIGN.md` and no acceptance checklist.

Observed issues:

1. **No design-system contract**: no `DESIGN.md`, no `docs/` folder, no UI acceptance checklist.
2. **Top-nav-only shell**: current layout is a top navigation bar plus a single main content region. This works for MVP, but it is not yet the intended long-term three-column knowledge workstation.
3. **Global CSS concentration**: most visual rules live in `src/styles/global.css`, which is acceptable for now but makes style drift likely.
4. **Partial token system**: current CSS has some variables, but many colors, radii, spacing values, and font sizes are still hard-coded.
5. **Card hierarchy is functional but not refined**: cards show the right metadata, but title, summary, status, tags, and action hierarchy need stricter rules.
6. **Reading view is safe but plain**: `MarkdownLite` correctly renders user content as text, but long-form reading, prompt blocks, and checklist blocks need clearer future styling.
7. **Print style is basic**: A4 printing works, but the manual-print vision needs cover, contents, sections, grouping, code/prompt blocks, and black-and-white clarity.

## 2. Reference Library

Shared reference library location:

```text
/Users/menjinqiu/work/codex_workspace/_shared/references/design/awesome-design-md
```

This repository is shared infrastructure and must not be copied into the KnowledgeCard project. KnowledgeCard should only contain its own translated design system and decision records.

References read or inspected:

- `README.md` from `awesome-design-md`: confirms the collection is intended to provide `DESIGN.md` files for AI agents and contains design rules, tokens, component styles, layout principles, dos/don'ts, responsive behavior, and prompt guidance.
- `design-md/linear.app/DESIGN.md`: dark, engineer-product, precise, dense, lavender accent.
- `design-md/ibm/DESIGN.md`: Carbon-inspired enterprise structure, flat surfaces, strong grid discipline, blue accent, low-shadow tiles.
- `design-md/mintlify/DESIGN.md`: documentation-oriented, three-column docs layout, Inter + mono for code, green accent, reading surfaces.
- `design-md/raycast/DESIGN.md`: command-palette productivity aesthetic, dense tool chrome, dark surfaces, restrained radius.
- `design-md/vercel/DESIGN.md`: developer platform minimalism, Geist-like type scale, black/white precision, technical captions.
- `design-md/notion/DESIGN.md`: workspace metaphor and warm content organization, but also colorful marketing surfaces.

## 3. Candidate Style Scores

Scoring dimensions: 1-5 points each.

| Candidate | Long-term use | High density | Card library | Long reading | Tags/filters | Local offline tool | Print manual | Avoid marketing | AI reusable | Fast to implement | Total | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| IBM Carbon | 5 | 5 | 4 | 4 | 5 | 5 | 5 | 5 | 5 | 5 | 48 | Strong primary candidate |
| Linear | 5 | 5 | 4 | 3 | 4 | 5 | 3 | 4 | 4 | 4 | 41 | Strong but too dark/product-marketing if copied directly |
| Mintlify | 4 | 4 | 3 | 5 | 4 | 4 | 5 | 3 | 4 | 4 | 40 | Strong reading/manual reference |
| GitHub-like | 5 | 5 | 4 | 5 | 5 | 5 | 4 | 5 | 5 | 5 | 48 | Not directly present as repo reference; use only as general product pattern if needed |
| Vercel | 4 | 4 | 3 | 4 | 4 | 4 | 3 | 3 | 5 | 5 | 39 | Good type and technical polish, but too landing-page-prone |
| Raycast | 4 | 5 | 4 | 3 | 4 | 5 | 2 | 3 | 4 | 3 | 37 | Good command/productivity cues, too dark for KnowledgeCard default |
| Notion | 4 | 3 | 5 | 4 | 5 | 4 | 3 | 2 | 4 | 4 | 38 | Useful workspace reference, but must avoid gray/empty database feel |
| Airtable | 4 | 4 | 5 | 3 | 5 | 4 | 3 | 3 | 4 | 4 | 39 | Useful for structured data, but too colorful/friendly for core style |
| Apple | 3 | 1 | 2 | 4 | 2 | 2 | 3 | 2 | 3 | 3 | 25 | Rejected |
| Stripe | 3 | 3 | 2 | 4 | 3 | 3 | 3 | 2 | 4 | 4 | 31 | Rejected for core style |

## 4. Final Reference Choice

### Main reference: IBM Carbon-inspired structure

Use IBM/Carbon-like discipline as the primary translation target:

- Flat, structured, low-shadow surfaces.
- Clear grid and panel boundaries.
- Enterprise-grade information density.
- Small radius, crisp borders, restrained color.
- Strong suitability for filters, tables, dashboards, and print.

This does not mean copying IBM branding. KnowledgeCard will use its own neutral/slate/teal-blue palette, not IBM Blue as a brand imitation.

### Local reading/manual reference: Mintlify

Borrow only the documentation and reading mechanics:

- Long-form reading hierarchy.
- Sidebar/content/metadata thinking.
- Code and prompt block handling.
- Documentation/manual-print clarity.

Do not borrow Mintlify marketing gradients or sky hero surfaces.

### Local productivity reference: Linear

Borrow only the product precision:

- Compact tool feel.
- Quiet high-value accents.
- Dense cards with hairline borders.
- Engineer-oriented clarity.

Do not convert the app into a dark marketing page or copy Linear's lavender brand identity.

## 5. Rejected Styles and Reasons

- **Apple**: too much premium white space, image-first, not suitable for high-density daily knowledge work.
- **Stripe**: polished but gradient/marketing prone; useful for documentation snippets, not the core app shell.
- **Raycast**: excellent command-tool atmosphere but dark-first and visually intense for long daily reading.
- **Notion as primary**: useful workspace metaphor, but too easy to become low-density, gray, and database-like.
- **Airtable as primary**: structured and useful, but the color system can become too playful/noisy.
- **Vercel as primary**: strong developer polish, but too homepage/product-launch oriented if AI follows it literally.

## 6. Borrowed Elements

Allowed:

1. IBM-like flat panels, grid discipline, low shadow, crisp borders.
2. Mintlify-like long reading, code blocks, and documentation/manual logic.
3. Linear-like precision, compact controls, quiet accent emphasis.
4. GitHub-like practical navigation and scannable metadata patterns, only as general product intuition.

Forbidden:

1. Copying third-party logos, brand assets, illustrations, screenshots, or proprietary copy.
2. Hero sections, large gradients, marketing banners, cinematic product showcases.
3. Dark-first full app shell for default mode.
4. Colorful tag chaos.
5. Large Apple-like whitespace.
6. Notion-like blank gray database emptiness.
7. Stripe-like decorative gradient systems.

## 7. KnowledgeCard Direction

KnowledgeCard should feel like a local knowledge workstation:

```text
Structured, quiet, dense, reliable, print-aware.
```

It should support daily use by a developer/learner/investor without visual fatigue. The design system must optimize for scanning, filtering, reading, copying, and printing rather than brand drama.

## 8. Implementation Guardrails

1. Build design tokens first.
2. Create Style Lab before migrating business pages.
3. Keep current business logic untouched during design-system phases.
4. Avoid new dependencies.
5. Use CSS variables instead of scattered magic values.
6. Keep desktop density high; mobile only needs basic usability.
7. Print styles remain first-class, not an afterthought.

## 9. Later Product Decisions

### 9.1 No duplicated global top bar

After the left workstation sidebar was introduced, a full-width top command/search bar was tested and rejected. It duplicated the left navigation and wasted vertical content space.

Current rule:

```text
Left sidebar = global navigation + global shortcuts
Page header = current-page/current-card actions only
```

Global search/new-card shortcuts are allowed in the left sidebar. A full-width top global command bar should not be reintroduced without explicit user approval.

### 9.2 Collections instead of folders

Traditional folder-tree navigation was rejected. KnowledgeCard uses Collections / Topic Sets instead.

Reason:

- A card may belong to multiple reusable packages.
- Collections can become print manuals.
- Domain/type/tags remain the primary metadata system.
- Folder trees would create classification conflicts and maintenance burden.

Collections should be treated as curated sets, not as exclusive directories.
