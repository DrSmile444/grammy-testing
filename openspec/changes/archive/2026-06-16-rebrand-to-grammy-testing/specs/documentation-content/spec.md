## MODIFIED Requirements

### Requirement: Guide — Getting Started page

`site/guide/getting-started.md` SHALL walk a new user from `npm install` to their first passing
test in under five minutes. It SHALL show a complete, runnable Vitest example including
`prepareBot`, `chats.newUser()`, `user.sendText()`, and assertion on `user.replies.lastOrThrow()`.

#### Scenario: Install command is shown

- **WHEN** a user reads Getting Started
- **THEN** the npm install command for `grammy-testing` and `grammy` is shown

#### Scenario: First test example is complete and runnable

- **WHEN** a user copies the first test example
- **THEN** it runs without modification in a project with Vitest and grammY installed

### Requirement: Guide — Framework setup pages

Three pages SHALL exist: `site/guide/with-vitest.md`, `site/guide/with-jest.md`, and
`site/guide/with-deno.md`. Each SHALL show the minimal config/import setup needed to use the
library with that test runner, including any CommonJS/ESM considerations for Jest. During the
third-party phase, the Deno page is a stub: it SHALL show consuming the package via the
`npm:grammy-testing` specifier and SHALL note that native Deno/JSR support arrives with the
official `@grammyjs/testing` release.

#### Scenario: Jest ESM note is present

- **WHEN** a user reads "With Jest"
- **THEN** they see a note about enabling ESM transforms (e.g. `--experimental-vm-modules`)

#### Scenario: Deno npm import is shown

- **WHEN** a user reads "With Deno"
- **THEN** the `npm:grammy-testing` import is shown
- **AND** a note states that native Deno/JSR support arrives with the official release

### Requirement: Low-Level API — Overview page

`site/low-level/overview.md` SHALL explain when to reach for the low-level layer vs the
high-level API, list the exports available only from `grammy-testing/low-level`, and link
to each low-level page.

#### Scenario: Low-level subpath import is documented

- **WHEN** a user reads the Low-Level overview
- **THEN** it shows `import { GenericMockUpdate } from 'grammy-testing/low-level'`

### Requirement: Low-Level API — Update Builders page

`site/low-level/update-builders.md` SHALL document all five mock update classes from the
`grammy-testing/low-level` subpath: `GenericMockUpdate`, `MessagePrivateMockUpdate`,
`MessageMockUpdate`, `NewMemberMockUpdate`, `LeftMemberMockUpdate`, `MyChatMemberMockUpdate`.
It SHALL explain when to use them over the high-level actor dispatch verbs.

#### Scenario: Use case distinction is clear

- **WHEN** a user reads Update Builders
- **THEN** the page explains that update builders are for edge-case update shapes not covered by User methods
