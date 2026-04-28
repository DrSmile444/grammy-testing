## Why

Submitting `@grammyjs/testing` to the grammY team requires demonstrating that it works with the official plugin ecosystem, not just the core `grammy` package. Bot authors use `@grammyjs/conversations`, `@grammyjs/menu`, `@grammyjs/sessions`, and others every day — if the testing framework can't support those, it can't claim to be a general-purpose testing library for grammY bots.

## What Changes

- Add `tests/plugins/` directory with one spec file per plugin, each demonstrating how to test a bot that uses that plugin.
- Add `@grammyjs/conversations`, `@grammyjs/menu`, `@grammyjs/parse-mode`, `@grammyjs/hydrate`, `@grammyjs/chat-members` as devDependencies (plugins needed to actually run the tests).
- `@grammyjs/runner`, `@grammyjs/files`, and `@grammyjs/fluent` are deferred — `runner` changes the event loop model (incompatible with synchronous test dispatch), `files` requires an actual Telegram file download (out of scope), and `fluent` adds i18n complexity with no new testing patterns.
- No changes to the public API surface — plugin interop is entirely on the test author's side.

## Capabilities

### New Capabilities

- `grammy-plugin-interop`: Demonstrates and documents how `@grammyjs/testing` works alongside each supported grammY plugin — patterns, recipes, and known constraints per plugin.

### Modified Capabilities

None — no existing spec requirements change.

## Impact

- `tests/plugins/` — 5 new spec files (one per supported plugin)
- `package.json` devDependencies — 5 new grammY plugins
- `package-lock.json` — updated
- No public API changes; no breaking changes
