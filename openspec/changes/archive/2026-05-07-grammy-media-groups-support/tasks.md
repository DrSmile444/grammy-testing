## 1. Dependencies

- [x] 1.1 Add `grammy-media-groups` to `devDependencies` in `package.json` (`^0.0.5`)
- [x] 1.2 Run `npm install` to update `package-lock.json`

## 2. Core Fix — syntheticMediaGroup Response Shape

- [x] 2.1 In `src/high-level/chats.ts`, update `syntheticMediaGroup` to add a `chat` field to each returned message: `reply.chat?.toTelegramChat() ?? { id: 0, type: 'private' }`
- [x] 2.2 In `src/high-level/chats.ts`, add `media_group_id` to each returned message: generate a unique string per call (e.g. using a counter from `this.ids` or an inline counter in `buildDefaultResponses`)
- [x] 2.3 Verify that all existing `sendMediaGroup`-related tests still pass after the shape change

## 3. Plugin Test

- [x] 3.1 Create `tests/plugins/media-groups.spec.ts` — install `mediaGroupTransformer(adapter)` before `prepareBot`, have the bot call `ctx.api.sendMediaGroup(chatId, media)`, assert the adapter contains the stored messages keyed by `media_group_id`
- [x] 3.2 Add a second test asserting each stored message has `chat.id` accessible
- [x] 3.3 Add a third test asserting all messages in a single `sendMediaGroup` call share the same `media_group_id`

## 4. VitePress Docs

- [x] 4.1 Create `site/plugins/media-groups.md` — cover install pattern, why `chat` and `media_group_id` are now in synthetic responses, how to assert on adapter state, and the middleware vs. transformer distinction
- [x] 4.2 Update `site/.vitepress/config.ts` sidebar — add `{ text: 'Media Groups', link: '/plugins/media-groups' }` to the Plugins group

## 5. README and ESLint

- [x] 5.1 Update `README.md` plugin interop table — add `grammy-media-groups` row with install pattern `bot.api.config.use(mediaGroupTransformer(...))` and supported since v0.24.0
- [x] 5.2 Verify `eslint.config.mjs` already has the `examples/**/*.ts` override (no change needed if present)

## 6. Changelog and Version Bump

- [x] 6.1 Add a `## 0.24.0 — 2026-05-07` entry to `docs/CHANGELOG.md` covering: `syntheticMediaGroup` response now includes `chat` and `media_group_id`, `grammy-media-groups` plugin interop
- [x] 6.2 Bump version to `0.24.0` in `package.json`
- [x] 6.3 Bump version to `0.24.0` in `jsr.json`

## 7. Quality Gate

- [x] 7.1 Run `npm run lint:fix` and fix all errors
- [x] 7.2 Run `npm run format:md` and fix all errors
- [x] 7.3 Run `npm run typecheck` and fix all errors
- [x] 7.4 Run `npm run lint` and fix all errors
- [x] 7.5 Run `npm run test:run` and fix all failures
- [x] 7.6 Run `npm run test:coverage` and verify coverage is acceptable
