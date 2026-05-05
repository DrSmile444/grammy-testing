## Why

`@grammyjs/testing` is a production-grade library with a rich two-layer API, 50+ dispatch verbs,
plugin integration patterns, and subtle behaviours (idle tracking, fire-and-forget, session mocking)
that users cannot discover from the README alone. The library has reached v0.21 with broad feature
coverage but no browsable documentation site — a gap that slows adoption and forces every new user
to read source code.

## What Changes

- New standalone **VitePress documentation site** under `site/` — 35 pages covering every public
  export with real code examples drawn from the existing 40 example files and 25 test files.
- **GitHub Actions workflow** that builds the site and deploys it to GitHub Pages at
  `drsmile444.github.io/grammy-testing/` on every push to `main`.
- **Brand theme** using a blue palette — `#0057b7` in light mode (6.9:1 on white, WCAG AA) and
  `#4d9eff` in dark mode (6.3:1 on dark background, WCAG AA).
- **Logo**: `docs/Y.svg` (the grammY Y mark) used as the site logo and favicon.
- `docs:dev`, `docs:build`, `docs:preview` scripts added to `package.json`.
- Version badge in the site nav (sourced from `package.json`, same pattern as `eslint-plugin-lintlord`).
- Local search (no external service required).
- The existing `docs/` folder is kept intact; the VitePress root is `site/`.

## Capabilities

### New Capabilities

- `vitepress-site`: VitePress documentation infrastructure — directory layout, config, theme,
  brand colours, navigation/sidebar structure, CI/CD workflow, and GitHub Pages deployment.
- `documentation-content`: Full content specification for all 35 pages organised into five
  sections: Guide, High-Level API, Low-Level API, Recipes, and API Reference.

### Modified Capabilities

## Impact

- New dev dependency: `vitepress` (latest 1.x stable).
- New `site/` directory tree added to the repository.
- New `.github/workflows/docs.yml` workflow.
- `package.json`: three new scripts, one new devDependency.
- `jsr.json` and `package.json` version untouched (docs-only change).
- No changes to `src/`, `tests/`, or any published artefacts.
