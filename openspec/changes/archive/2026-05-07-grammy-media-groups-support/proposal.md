## Why

`grammy-media-groups` is a community plugin that installs via `bot.api.config.use(mediaGroupTransformer(adapter))` and intercepts `sendMediaGroup` API responses to store sent messages, keyed by `media_group_id`. The v0.23.0 transformer chain fix makes this plugin runnable during tests, but the library's synthetic `sendMediaGroup` response is missing two fields the plugin requires: `chat` (for deduplication by `message.chat.id`) and `media_group_id` (for storage grouping). Without these, the plugin silently skips all messages and stores nothing.

## What Changes

- **Fix `syntheticMediaGroup` response shape**: add `chat` and `media_group_id` to every message object returned by the `sendMediaGroup` default response, so `grammy-media-groups` can store and group them correctly
- **Add `grammy-media-groups` devDependency**: `^0.0.5`
- **Add `tests/plugins/media-groups.spec.ts`**: install `mediaGroupTransformer(adapter)` before `prepareBot`, have a bot call `sendMediaGroup`, assert the adapter contains the stored messages keyed by `media_group_id`
- **Add `site/plugins/media-groups.md`**: document the install pattern, the required response shape, and the storage behaviour in tests
- **Update `README.md`**: add `grammy-media-groups` to the plugin interop table
- **Update `docs/CHANGELOG.md`**: add bullet to a new `0.24.0` entry (synthetic response shape change is user-visible)
- **Bump version to `0.24.0`** in `package.json` and `jsr.json`

## Capabilities

### New Capabilities

- `grammy-media-groups-interop`: testing bots that use `grammy-media-groups`'s `mediaGroupTransformer(adapter)` to store outgoing media group messages

### Modified Capabilities

- `synthetic-message-responses`: `syntheticMediaGroup` must return messages with `chat` and `media_group_id` fields so response-hydrating transformers can process them
- `grammy-plugin-interop`: add `grammy-media-groups` as a supported plugin entry
- `plugin-docs-ecosystem`: add `site/plugins/media-groups.md` page to the Plugins sidebar group

## Impact

- `src/high-level/chats.ts` — `syntheticMediaGroup` function
- `site/.vitepress/config.ts` — Plugins sidebar
- `package.json`, `jsr.json`, `package-lock.json`
- `README.md`, `docs/CHANGELOG.md`
- New files: `tests/plugins/media-groups.spec.ts`, `site/plugins/media-groups.md`
