# UI Refresh — Validation Checklist

Per-phase sign-off for the `ui-refresh-understandability` branch.

---

## Phase 0 — Fresh start

- [x] Branch created from `master`
- [x] `node --run build` passes on fresh branch

---

## Phase 1 — CSS split

- [x] `light.scss` reduced to import hub (131 lines, was 1758)
- [x] `tokens.scss`, `shell.scss`, `primitives.scss`, `datatable.scss`, `views-compat.scss` created
- [x] `node --run build` passes
- [x] No new `!important` added

---

## Phase 2 — Visual redesign via tokens

- [x] Brand navy / accent orange applied in light
- [x] Dark surface palette applied
- [x] Play button gradient tokens set (`--zengm-cta-from` / `--zengm-cta-to`)
- [x] Hamburger explicit white SVG (no `filter:invert()`)
- [x] `node --run build` passes

---

## Phase 3 — Shell React components

- [x] No `react-bootstrap` imports in any shell component
- [x] `bg-light` / `navbar-light` removed from all shell components
- [x] `navbar-expand-sm` preserved explicitly (Bootstrap flex layout for nav items)
- [x] All glyphicon spans replaced with `<Icon name="..." />`
- [x] `view-root` class added to `<main>` in `Controller/index.tsx`
- [x] `node --run build` passes

---

## Phase 4 — DataTable

- [x] No `react-bootstrap` imports in DataTable components
- [x] `Controls.tsx`, `BulkActions.tsx`, `Header.tsx` use custom dropdowns
- [x] Sort highlight: `thead .sorting_highlight` → `surface-3`; `tbody .sorting_highlight` → brand tint
- [x] Filter inputs use `--zengm-surface-1`, `--zengm-text-strong`, `--zengm-border`
- [x] `node --run build` passes

---

## Phase 5 — View-root bridge

- [x] `--zengm-link` / `--zengm-link-rgb` tokens in `tokens.scss` (light) and `dark.scss` (dark)
- [x] `--bs-link-color/rgb`, `--bs-link-hover-color/rgb` bridges at `:root` in `views-compat.scss`
- [x] `--bs-modal-bg`, `--bs-modal-*-border-color`, `--bs-modal-color` at `:root`
- [x] `--bs-card-bg`, `--bs-card-border-color`, `--bs-card-cap-bg` under `.view-root`
- [x] Mobile ad banner: `var(--zengm-surface-0)` (was hardcoded `rgba(247,247,247,0.8)`)
- [x] `node --run build` passes

---

## Phase 6 — Theme hardening

- [x] `navbar !important` dropped from shell.scss (Phase 3 removed `bg="light"`)
- [x] `--zengm-nav-hover-bg` token added (light: `rgba(255,255,255,0.1)`; dark: `rgba(232,237,245,0.08)`)
- [x] `.play-button-success` dark override removed from `dark.scss` — CTA tokens now sole source of truth
- [x] Body flat in dark — no radial-gradient anywhere; `--bs-body-bg: var(--zengm-surface-0)` resolves to `#14181e`
- [x] Links in dark: `--zengm-link: #5b9dff` in `dark.scss :root`
- [x] League top bar: `surface-1` bg + `--zengm-toolbar-border` confirmed in shell.scss
- [x] `node --run build` passes

---

## Phase 7 — Guardrails and validation

- [x] `node --run lint` passes (0 errors — fixed rules-of-hooks violation in `BulkActions.tsx` and curly-brace lint errors in 4 files)
- [x] `node --run build` passes (223 files, ~8.54 MB)
- [x] Glyphicon grep: 0 remaining in shell TSX files
- [x] Dead CSS audit: `title-bar-right-links`, `dropdown-select-wrapper`, `dropdown-select` — all still live, nothing to remove
- [~] Stylelint `!important` ban — deferred: stylelint not installed; shell's 20 `!important` declarations are Bootstrap specificity overrides (padding/height/margin), not color hacks; all shell colors are tokenized
- [ ] Screenshot matrix — manual sign-off required (see below)

---

## Screenshot matrix (manual — light + dark)

| Page                  | What to check                                 | Status |
| --------------------- | --------------------------------------------- | ------ |
| Dashboard (no league) | Nav brand navy, sidebar white, body cool gray | ☐      |
| Dashboard (in league) | Score strip, nav, sidebar, play button color  | ☐      |
| Roster                | Toolbar segments, DataTable sort highlight    | ☐      |
| Daily Schedule        | Single-selector toolbar                       | ☐      |
| Standings             | Table + toolbar, dark sort column neutral     | ☐      |
| Player profile        | Title bar, modal (check portal colors)        | ☐      |
| Settings              | Cards, form controls, dark-select             | ☐      |
