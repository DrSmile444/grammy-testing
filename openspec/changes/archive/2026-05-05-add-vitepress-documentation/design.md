## Context

`@grammyjs/testing` lives at `github.com/DrSmile444/grammy-testing`. The `docs/` folder already
exists as an internal project notes directory (CHANGELOG, logos, dev notes). A separate
`eslint-plugin-lintlord` repository owned by the same author has a working standalone VitePress
site deployed to GitHub Pages — its config and workflow are the direct template for this work.
Grammy's own website uses VitePress with extensive customisation; we borrow its brand proximity
(teal + gold) without needing to match its complexity.

The site logo is `docs/Y.svg` (the grammY Y mark). The brand colour uses `#0057b7` (blue) — it
passes WCAG AA on white (6.9:1) but fails on dark backgrounds (~2.5:1), so a lighter tint
(`#4d9eff`, 6.3:1) is used in dark mode.

## Goals / Non-Goals

**Goals:**

- Browsable documentation at `drsmile444.github.io/grammy-testing/`.
- Zero-configuration local preview via `npm run docs:dev`.
- Every public export documented with typed signatures and runnable examples.
- Automatic deploy on every push to `main`.
- WCAG AA compliance for all branded text colours.

**Non-Goals:**

- Algolia search integration (local search is sufficient at this scale).
- i18n / multi-locale (English only for launch).
- Custom Vue components beyond a theme CSS override file.
- Removing or restructuring the existing `docs/` internal notes folder.
- Changes to `src/`, published artefacts, or semver.

## Decisions

### D1 — VitePress root directory: `site/` not `docs/`

`docs/` is already occupied by internal project files (`CHANGELOG.md`, logos, dev notes). Using
`site/` avoids any collision and mirrors Grammy's own `website/site/` repo structure, which is
familiar to the Grammy ecosystem. Alternative: rename `docs/` to `notes/` and use `docs/` for
VitePress — rejected because it creates unnecessary git history churn and breaks existing links in
the CHANGELOG.

### D2 — Dynamic base URL via environment variable

The lintlord pattern:

```ts
function resolveBase(): string {
  if (!process.env.GITHUB_ACTIONS) return '/';
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  return repo ? `/${repo}/` : '/';
}
```

This means the same build works for `npm run docs:dev` (root) and GitHub Pages
(`/grammy-testing/`). No need for separate `.env` files or separate build commands.

### D3 — Dual-mode blue colour palette for WCAG AA compliance

| Token                           | Light mode           | Contrast on white | Dark mode              | Contrast on `#1b1b1f` |
| ------------------------------- | -------------------- | ----------------- | ---------------------- | --------------------- |
| `--vp-c-brand-1` (primary text) | `#0057b7`            | 6.9:1 ✅ AA       | `#4d9eff`              | 6.3:1 ✅ AA           |
| `--vp-c-brand-2` (hover)        | `#0066d6`            | 5.7:1             | `#3d8ef0`              | 5.1:1                 |
| `--vp-c-brand-3` (active)       | `#0074f0`            | 4.9:1             | `#60aaff`              | 7.4:1                 |
| `--vp-c-brand-soft` (bg tint)   | `rgba(0,87,183,.12)` | N/A               | `rgba(77,158,255,.16)` | N/A                   |

`#0057b7` fails on dark backgrounds (~2.5:1), so dark mode uses `#4d9eff` — same brand hue
lightened to pass AA. Alternative considered: gold/yellow from original logo — rejected as it
reads poorly for a blue-themed identity and clashes with link underline conventions.

### D4 — Content lives inside `site/`; `site/public/` holds logo asset

`docs/Y.svg` (the grammY Y mark) is copied to `site/public/logo.svg` for use as the VitePress
`logo` and favicon. The original in `docs/` is retained.

### D5 — VitePress version: latest 1.x stable

Grammy uses VitePress via Deno without pinning. Lintlord used `^2.0.0-alpha.15` (pre-release at
the time). For a fresh install we use the latest stable 1.x (`^1.6.0`) to avoid alpha instability.
We can upgrade when 2.x goes stable.

### D6 — Changelog page mirrors `docs/CHANGELOG.md` via symlink or copy

Rather than duplicating content, `site/reference/changelog.md` either symlinks to
`../../docs/CHANGELOG.md` or includes a note directing readers to the GitHub releases page. If
VitePress resolves symlinks at build time (it does in 1.x), a symlink is preferred to keep a
single source of truth.

### D7 — Five content sections, 35 pages

```
Guide (6)  →  High-Level API (9)  →  Low-Level API (5)  →  Recipes (7)  →  API Reference (14)  →  Reference (1) = 42 pages
```

Each page maps 1:1 to a task in tasks.md, making parallel authoring straightforward.

## Risks / Trade-offs

- **Symlink for changelog** → If VitePress build breaks on the symlink (CI environment), fall back
  to a short redirect page. Mitigation: test in CI with `act` or verify in the first deploy.
- **35+ pages of prose** → Large content surface. Risk: pages written hastily are low-quality.
  Mitigation: every content page has a corresponding example file in `examples/` to draw from;
  quality baseline is "show the example, explain the knob".
- **GitHub Actions OIDC pages deploy** → Requires `pages: write` and `id-token: write`
  permissions and a GitHub Pages source set to "GitHub Actions" in repo settings. The lintlord
  workflow already proves this works; the owner needs to enable Pages in repo settings once.
- **VitePress 1.x EOL** → Grammy is already on latest VitePress via Deno. We may need to upgrade
  before long. Not a blocker for launch.

## Open Questions

- Should `site/reference/changelog.md` use a symlink to `docs/CHANGELOG.md` or a copy? → Decide
  at implementation time based on whether the CI build resolves the symlink.
- Should we add a jsr.io badge to the hero page in addition to the npm badge? → Nice-to-have; add
  if the badge renders cleanly.
