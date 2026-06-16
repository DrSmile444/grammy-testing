## ADDED Requirements

### Requirement: Site directory structure

The documentation site SHALL live under a `site/` directory at the repository root. The
`site/.vitepress/` directory SHALL contain the VitePress config, theme overrides, and build output.
The `site/public/` directory SHALL hold static assets (logo SVG, favicon).

#### Scenario: Local development works

- **WHEN** a developer runs `npm run docs:dev`
- **THEN** VitePress serves the site at `http://localhost:5173/` with hot reload

#### Scenario: Production build succeeds

- **WHEN** a developer runs `npm run docs:build`
- **THEN** VitePress builds the static site to `site/.vitepress/dist/` without errors

#### Scenario: Build preview works

- **WHEN** a developer runs `npm run docs:preview`
- **THEN** VitePress serves the production build locally for verification

### Requirement: VitePress configuration

`site/.vitepress/config.ts` SHALL define the complete site configuration including title,
description, base URL resolution, navigation, sidebar, search, social links, and theme config.
The config SHALL import version from `../../package.json` and use it in the nav version dropdown.

#### Scenario: Base URL in development

- **WHEN** the site is built without `GITHUB_ACTIONS` env variable set
- **THEN** `base` resolves to `'/'` (root)

#### Scenario: Base URL on GitHub Pages

- **WHEN** the site is built with `GITHUB_ACTIONS=true` and `GITHUB_REPOSITORY=DrSmile444/grammy-testing`
- **THEN** `base` resolves to `'/grammy-testing/'`

#### Scenario: Version badge in nav

- **WHEN** any page is rendered
- **THEN** the nav contains a dropdown showing `v{current version}` sourced from `package.json`

#### Scenario: Changelog link in version dropdown

- **WHEN** a user opens the version dropdown
- **THEN** it shows `v{current version} (current)`, `Changelog`, and `Release Notes` links

### Requirement: Brand colour theme

`site/.vitepress/theme/style/vars.css` SHALL override VitePress CSS custom properties to apply the
blue brand palette. Light mode brand primary SHALL have a contrast ratio ≥ 4.5:1 against white
(`#FFFFFF`). Dark mode brand primary SHALL have a contrast ratio ≥ 4.5:1 against the VitePress dark
background (`#1b1b1f`).

#### Scenario: Light mode brand colour is accessible

- **WHEN** brand text (`--vp-c-brand-1`) is rendered on white in light mode
- **THEN** the colour is `#0057b7` with a contrast ratio of 6.9:1 (WCAG AA compliant)

#### Scenario: Dark mode brand colour is accessible

- **WHEN** brand text (`--vp-c-brand-1`) is rendered on the dark background in dark mode
- **THEN** the colour is `#4d9eff` with a contrast ratio of 6.3:1 (WCAG AA compliant)

### Requirement: Logo and favicon

The grammY Y mark (`docs/Y.svg`) SHALL be copied to `site/public/logo.svg` and referenced as both
the site logo in the navbar and the favicon via `<link rel="icon">`.

#### Scenario: Logo appears in navbar

- **WHEN** any page is rendered
- **THEN** the grammy-testing logo SVG appears to the left of the site title in the navbar

#### Scenario: Favicon is set

- **WHEN** a browser tab is open to any page
- **THEN** the favicon displays the grammy-testing logo

### Requirement: Navigation structure

The site navbar SHALL contain four top-level items: `Guide`, `High-Level API`, `Low-Level API`,
and the version dropdown. The sidebar SHALL organise all pages into five collapsible groups:
Guide, High-Level API, Low-Level API, Recipes, and API Reference. A sixth group `Reference`
SHALL contain only the Changelog page.

#### Scenario: Guide nav item links correctly

- **WHEN** a user clicks `Guide` in the navbar
- **THEN** they are taken to `/guide/introduction`

#### Scenario: High-Level API nav item links correctly

- **WHEN** a user clicks `High-Level API` in the navbar
- **THEN** they are taken to `/high-level/overview`

#### Scenario: Sidebar shows all five section groups

- **WHEN** any page is open
- **THEN** the sidebar shows Guide, High-Level API, Low-Level API, Recipes, API Reference groups

### Requirement: Local search

The site SHALL use VitePress's built-in local search provider. No external Algolia or search
service SHALL be required.

#### Scenario: Search finds page content

- **WHEN** a user types a symbol name (e.g. `prepareBot`) into the search box
- **THEN** results include the Getting Started page and the prepareBot API reference page

### Requirement: Social links

The site footer/navbar SHALL include social links to the GitHub repository and the npm package page.

#### Scenario: GitHub link present

- **WHEN** any page is rendered
- **THEN** a GitHub icon link pointing to `github.com/DrSmile444/grammy-testing` is visible

#### Scenario: npm link present

- **WHEN** any page is rendered
- **THEN** an npm icon link pointing to `npmjs.com/package/grammy-testing` is visible

### Requirement: GitHub Actions deployment workflow

`.github/workflows/docs.yml` SHALL build the VitePress site on every push to `main` and on manual
dispatch, then deploy the output to GitHub Pages using the `actions/upload-pages-artifact` and
`actions/deploy-pages` actions. The workflow SHALL use Node.js 20 and `npm ci`.

#### Scenario: Deployment triggers on push to main

- **WHEN** a commit is pushed to the `main` branch
- **THEN** the docs workflow starts, builds the site, and deploys to GitHub Pages

#### Scenario: Manual deployment trigger works

- **WHEN** a maintainer triggers `workflow_dispatch` from the Actions UI
- **THEN** the site rebuilds and deploys

#### Scenario: Jekyll is disabled

- **WHEN** the Pages artifact is uploaded
- **THEN** a `.nojekyll` file exists in the dist directory to prevent GitHub Pages Jekyll processing

#### Scenario: Site is live at the correct URL

- **WHEN** the deploy job completes successfully
- **THEN** the site is accessible at `https://drsmile444.github.io/grammy-testing/`

### Requirement: Package scripts

`package.json` SHALL include three new scripts: `docs:dev`, `docs:build`, and `docs:preview`.
VitePress SHALL be added as a devDependency (`^1.6.0` or latest stable 1.x at install time).

#### Scenario: docs:dev runs

- **WHEN** `npm run docs:dev` is executed
- **THEN** VitePress starts the dev server without errors

#### Scenario: docs:build runs

- **WHEN** `npm run docs:build` is executed
- **THEN** VitePress builds the site and exits with code 0

### Requirement: .gitignore entries for VitePress

`.gitignore` SHALL exclude `site/.vitepress/cache` and `site/.vitepress/dist` from version
control. The logo copy at `site/public/logo.svg` SHALL be tracked.

#### Scenario: Cache and dist are ignored

- **WHEN** `git status` is run after a local build
- **THEN** `site/.vitepress/cache` and `site/.vitepress/dist` do not appear as untracked files
