# examples-catalog Specification

## Purpose

Requirements for the `examples/` directory: structure, content, and integration with the test and build pipeline.

## Requirements

### Requirement: examples/ folder exists with 20 numbered subfolders

The repository SHALL contain an `examples/` directory at the root. It SHALL contain exactly 20 subfolders named `01-echo-bot` through `20-multi-chat-scenario`. Each subfolder SHALL contain `bot.ts` (bot implementation) and `bot.spec.ts` (tests).

#### Scenario: folder structure matches convention

- **WHEN** the `examples/` directory is listed
- **THEN** exactly 20 subfolders are present, numbered 01 through 20
- **AND** each subfolder contains `bot.ts` and `bot.spec.ts`

### Requirement: example bot files export factory functions

Each `examples/<N>-<name>/bot.ts` SHALL export a named factory function (e.g., `createEchoBot()`) that returns a configured `Bot` instance. The factory SHALL NOT use module-level singletons.

#### Scenario: factory returns a fresh Bot instance per call

- **WHEN** the factory function is called twice
- **THEN** two distinct `Bot` instances are returned
- **AND** neither instance shares state with the other

### Requirement: example specs import from @grammyjs/testing

All `bot.spec.ts` files in the examples folder SHALL import testing utilities from `@grammyjs/testing` (not from relative paths into `src/`), so the examples are copy-paste-ready for end users.

#### Scenario: import resolves during vitest run

- **WHEN** `vitest run` is executed
- **THEN** all `examples/*/bot.spec.ts` files are included in the test run
- **AND** `import { prepareBot } from '@grammyjs/testing'` resolves to `src/index.ts` via the vitest alias
- **AND** all tests pass

### Requirement: each example demonstrates a distinct library API surface

The 20 examples SHALL collectively cover the following capabilities, each introduced for the first time in the numbered example that first uses it:

- 01: `prepareBot`, `chats.newUser()`, `user.sendText()`, `user.replies`
- 02: `user.sendCommand()`
- 03: custom user profile options (`firstName`, `username`)
- 04: `chats.newSupergroup()`, `group.own()`, sending into a group, no-reply assertion
- 05: `reply.buttons`, `reply.clickButton()`, `chats.editsFor()`
- 06: `user.sendCallbackQuery()` without a prior captured message
- 07: `mockSession`
- 08: `mockChatSession`
- 09: `user.sendPhoto()`
- 10: `user.sendDocument()`
- 11: `user.answerPoll()`
- 12: membership join dispatch via `group.own()` with welcome message assertion
- 13: `chats.newAdmin()`, admin-only guard with rejection assertion
- 14: `group.ban()`, outgoing API call assertion (`kickChatMember`)
- 15: `chats.newChannel()`, `Channel` actor
- 16: `user.reactTo()`
- 17: `user.sendDice()`
- 18: `prepareMiddleware`
- 19: `prepareComposer`
- 20: multi-actor scenario combining users, a group, and a channel

#### Scenario: test suite covers all advertised surfaces

- **WHEN** all 20 example spec files pass
- **THEN** each of the capabilities listed above has been exercised by at least one assertion

### Requirement: examples are included in the full vitest run

Running `npm run test:run` from the repo root SHALL execute all `examples/*/bot.spec.ts` files alongside the existing `tests/` suite.

#### Scenario: examples run with the standard test command

- **WHEN** `npm run test:run` is executed
- **THEN** test files matching `examples/**/*.spec.ts` are included
- **AND** no separate command is required to run the examples

### Requirement: examples are included in TypeScript type-checking

Running `npm run typecheck` SHALL type-check all files in `examples/`, including `bot.ts` files, without errors.

#### Scenario: typecheck covers example bot files

- **WHEN** `npm run typecheck` is executed
- **THEN** TypeScript checks all `examples/*/bot.ts` and `examples/*/bot.spec.ts` files
- **AND** the check exits with code 0

### Requirement: examples use only grammy and @grammyjs/testing as dependencies

No `bot.ts` or `bot.spec.ts` file SHALL import from packages not already present in the project's `devDependencies`. Examples SHALL rely solely on `grammy` and `@grammyjs/testing`.

#### Scenario: no new dependencies introduced

- **WHEN** the examples are added
- **THEN** `package.json` `devDependencies` is unchanged
- **AND** no `npm install` step is required before the examples run
