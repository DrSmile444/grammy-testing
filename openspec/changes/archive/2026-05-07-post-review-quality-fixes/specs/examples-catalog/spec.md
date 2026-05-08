## MODIFIED Requirements

### Requirement: examples/ folder exists with 23 numbered subfolders

The repository SHALL contain an `examples/` directory at the root. It SHALL contain exactly 23 subfolders named `01-echo-bot` through `23-auto-retry-bot`. Each subfolder SHALL contain `bot.ts` (bot implementation) and `bot.spec.ts` (tests).

#### Scenario: folder structure matches convention

- **WHEN** the `examples/` directory is listed
- **THEN** exactly 23 subfolders are present, numbered 01 through 23
- **AND** each subfolder contains `bot.ts` and `bot.spec.ts`

### Requirement: each example demonstrates a distinct library API surface

The 23 examples SHALL collectively cover the following capabilities, each introduced for the first time in the numbered example that first uses it:

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
- 21: `@grammyjs/files` — `hydrateFiles` transformer with `FileFlavor<Context>` and `file.getUrl()`
- 22: `@grammyjs/hydrate` — `hydrateApi()` + `hydrate()` with `HydrateFlavor<Context>` and `sent.message_id`
- 23: `@grammyjs/auto-retry` — `autoRetry` with broadcast and per-chat error handling

#### Scenario: test suite covers all advertised surfaces

- **WHEN** all 23 example spec files pass
- **THEN** each of the capabilities listed above has been exercised by at least one assertion

### Requirement: plugin example bot.ts files use context flavor types

Plugin example `bot.ts` files (examples 21–23) SHALL use the context flavor type exported by the plugin rather than `as unknown as` casts to access plugin-augmented properties.

- Example 21 (`@grammyjs/files`) SHALL use `FileFlavor<Context>` as the bot's context type parameter so that `file.getUrl()` is typed without casting.
- Example 22 (`@grammyjs/hydrate`) SHALL use `HydrateFlavor<Context>` as the bot's context type parameter so that hydrated properties on API results and context objects are typed without casting.

#### Scenario: FileFlavor gives typed getUrl() access

- **WHEN** `createFilesBot` is type-checked
- **THEN** `file.getUrl()` compiles without any `as unknown as` cast
- **AND** the bot is typed as `Bot<FileFlavor<Context>>`

#### Scenario: HydrateFlavor gives typed message_id access on sent messages

- **WHEN** `createHydrateBot` is type-checked
- **THEN** `sent.message_id` compiles as `number` without any cast
- **AND** the bot is typed as `Bot<HydrateFlavor<Context>>`

### Requirement: examples may import plugin devDependencies

`bot.ts` files in plugin-demonstration examples (examples 21–23) MAY import from plugin packages listed in `devDependencies` (e.g., `@grammyjs/files`, `@grammyjs/hydrate`, `@grammyjs/auto-retry`). The ESLint `import/no-extraneous-dependencies` and `n/no-unpublished-import` rules SHALL be relaxed for `examples/**/*.ts` to permit these imports. No new runtime dependencies MAY be added to `dependencies` (only `devDependencies`).

#### Scenario: plugin example compiles and runs without install step

- **WHEN** `npm run test:run` is executed after a clean `npm install`
- **THEN** all `examples/*/bot.spec.ts` files pass, including examples 21–23
- **AND** the plugin packages are resolved from `devDependencies`
