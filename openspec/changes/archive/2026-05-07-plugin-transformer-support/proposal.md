## Why

Bot-level transformers installed via `bot.api.config.use()` — including `@grammyjs/files`, `@grammyjs/hydrate`, and `@grammyjs/auto-retry` — are silently skipped during tests because the library installs its mock transformer last (outermost), never calling the rest of the chain. This makes the library incompatible with a significant portion of the grammY plugin ecosystem. The issue was raised by a grammY team member during the official adoption discussion, making it a blocker for that process.

## What Changes

- **Fix transformer chain ordering**: the library's mock terminal is repositioned to be the innermost transformer so all user-installed transformers run and can process synthetic responses normally
- **Fix default response shapes**: `buildDefaultResponses` returns realistic `File`, `ChatMember`, and `ChatAdministrator` objects for methods that hydrators need to process, replacing the generic `true` fallback
- **Add `@grammyjs/files` interop**: new plugin test (`tests/plugins/files.spec.ts`) and example (`examples/21-files-bot/`)
- **Add `@grammyjs/hydrate` interop**: new plugin test (`tests/plugins/hydrate.spec.ts`) and example (`examples/22-hydrate-bot/`)
- **Add `@grammyjs/auto-retry` interop**: new plugin test (`tests/plugins/auto-retry.spec.ts`) and example (`examples/23-auto-retry-bot/`)
- **Add new devDependencies**: `@grammyjs/files`, `@grammyjs/hydrate`, `@grammyjs/auto-retry`
- **Restructure VitePress docs**: extract a dedicated Plugins section from Recipes, moving existing plugin pages (conversations, menu) and adding new pages for files, hydrate, auto-retry, and transformer-throttler
- **Update README**: extend the plugin interop table and examples list
- **Version bump**: 0.22.0 → 0.23.0

## Capabilities

### New Capabilities

- `transformer-chain-ordering`: requirements for correct chain ordering — the library's transformer is innermost, all bot-level transformers execute and can process synthetic responses
- `plugin-docs-ecosystem`: requirements for a dedicated Plugins section in VitePress with full documentation and examples for every supported transformer-using plugin

### Modified Capabilities

- `grammy-plugin-interop`: extend existing spec with interop requirements for `@grammyjs/files`, `@grammyjs/hydrate`, and `@grammyjs/auto-retry`

## Impact

- **`src/low-level/prepare-bot.ts`**: transformer installation reordered
- **`src/high-level/chats.ts`**: `buildDefaultResponses` updated with realistic shapes for `getFile`, `getChatMember`, `getChatAdministrators`
- **`tests/plugins/`**: three new spec files
- **`examples/`**: three new example directories (21, 22, 23)
- **`site/plugins/`**: new VitePress section (6 pages); `site/recipes/` loses 2 plugin pages
- **`site/.vitepress/config.ts`**: sidebar updated
- **`README.md`**: plugin interop and examples sections updated
- **`docs/CHANGELOG.md`**: 0.23.0 entry
- **`package.json` + `jsr.json`**: version bump
- **No breaking changes to the public API**
