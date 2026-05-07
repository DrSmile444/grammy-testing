## ADDED Requirements

### Requirement: Dedicated Plugins section in VitePress

The system SHALL have a dedicated Plugins section in the VitePress documentation site, separate from Recipes. The Plugins section SHALL contain one page per supported transformer-using plugin. Existing plugin pages (`conversations-plugin.md`, `menu-plugin.md`) SHALL be moved from `site/recipes/` to `site/plugins/`. The Recipes section SHALL retain only general-pattern pages (sessions, keyboards, error simulation, multi-chat, fire-and-forget).

#### Scenario: Plugins sidebar group is present

- **WHEN** the VitePress site is built
- **THEN** the sidebar contains a "Plugins" group distinct from "Recipes"
- **AND** the Plugins group contains entries for conversations, menu, files, hydrate, auto-retry, and transformer-throttler

#### Scenario: Recipes section does not contain plugin pages

- **WHEN** the VitePress site is built
- **THEN** the Recipes sidebar group does NOT contain conversations-plugin or menu-plugin entries
- **AND** the Recipes group contains only general-pattern pages

### Requirement: Plugin documentation page for @grammyjs/files

The system SHALL have a VitePress page at `site/plugins/files.md` documenting how to test bots that use `@grammyjs/files`. The page SHALL cover: the transformer chain fix that makes the plugin work, how to provide a realistic `getFile` response (or rely on the default), and a complete runnable example referencing example `21-files-bot`.

#### Scenario: files.md exists and is linked in sidebar

- **WHEN** the VitePress site is built
- **THEN** `site/plugins/files.md` is present
- **AND** it appears in the Plugins sidebar group

### Requirement: Plugin documentation page for @grammyjs/hydrate

The system SHALL have a VitePress page at `site/plugins/hydrate.md` documenting how to test bots that use `@grammyjs/hydrate`. The page SHALL explain the difference between bot-level and context-level transformer installation, and reference example `22-hydrate-bot`.

#### Scenario: hydrate.md exists and is linked in sidebar

- **WHEN** the VitePress site is built
- **THEN** `site/plugins/hydrate.md` is present
- **AND** it appears in the Plugins sidebar group

### Requirement: Plugin documentation page for @grammyjs/auto-retry

The system SHALL have a VitePress page at `site/plugins/auto-retry.md` documenting how to test bots that use `@grammyjs/auto-retry`. The page SHALL explain that after the chain fix, auto-retry will actually retry on simulated errors, and show how to test retry behaviour intentionally (use `maxRetryAttempts: 1`, provide a second `respondNext` for the retry). It SHALL reference example `23-auto-retry-bot`.

#### Scenario: auto-retry.md exists and is linked in sidebar

- **WHEN** the VitePress site is built
- **THEN** `site/plugins/auto-retry.md` is present
- **AND** it appears in the Plugins sidebar group

### Requirement: Plugin documentation page for @grammyjs/transformer-throttler

The system SHALL have a VitePress page at `site/plugins/transformer-throttler.md` documenting the caveat that throttler-related delays will affect `idle()` wait times in tests after the chain fix is applied. The page SHALL NOT include a runnable example.

#### Scenario: transformer-throttler.md exists and is linked in sidebar

- **WHEN** the VitePress site is built
- **THEN** `site/plugins/transformer-throttler.md` is present
- **AND** it appears in the Plugins sidebar group

### Requirement: Examples 21, 22, 23 exist for files, hydrate, and auto-retry

The system SHALL include runnable examples in the `examples/` directory for each transformer-using plugin. Each example SHALL be a self-contained directory with its own `package.json` and a working bot that installs the plugin before `prepareBot`.

#### Scenario: 21-files-bot example runs without errors

- **WHEN** the tests in `examples/21-files-bot/` are executed
- **THEN** they pass, demonstrating `@grammyjs/files` hydration of the `getFile` response

#### Scenario: 22-hydrate-bot example runs without errors

- **WHEN** the tests in `examples/22-hydrate-bot/` are executed
- **THEN** they pass, demonstrating `@grammyjs/hydrate` hydration of API responses

#### Scenario: 23-auto-retry-bot example runs without errors

- **WHEN** the tests in `examples/23-auto-retry-bot/` are executed
- **THEN** they pass, demonstrating `@grammyjs/auto-retry` retry behaviour under controlled failure
