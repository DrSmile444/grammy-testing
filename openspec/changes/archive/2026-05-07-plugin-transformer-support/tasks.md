## 1. Dependencies

- [x] 1.1 Add `@grammyjs/files`, `@grammyjs/hydrate`, `@grammyjs/auto-retry` to `devDependencies` in `package.json`
- [x] 1.2 Run `npm install` to update `package-lock.json`

## 2. Transformer Chain Fix

- [x] 2.1 In `src/low-level/prepare-bot.ts`, snapshot existing transformers before installing the library's: `const existing = bot.api.config.installedTransformers()`
- [x] 2.2 Install the library transformer via `bot.api.config.use(createTransformer({...}))` as usual
- [x] 2.3 Reinstall snapshotted transformers on top: `if (existing.length > 0) bot.api.config.use(...existing)`

## 3. Default Response Shapes

- [x] 3.1 In `src/high-level/chats.ts` (or wherever `buildDefaultResponses` lives), replace the `getFile: () => true` fallback with a realistic `File` object: `{ file_id, file_unique_id, file_size, file_path }`
- [x] 3.2 Verify `getChatMember` and `getChatAdministrators` defaults are realistic enough for hydrators (update if they return `true`)

## 4. Plugin Tests

- [x] 4.1 Create `tests/plugins/files.spec.ts` — install `hydrateFiles` before `prepareBot`, assert `file.getUrl()` returns a URL string
- [x] 4.2 Create `tests/plugins/hydrate.spec.ts` — install `hydrateApi()` and `hydrate()` middleware, assert hydrated reply has `delete()` method
- [x] 4.3 Create `tests/plugins/auto-retry.spec.ts` — install `autoRetry({ maxRetryAttempts: 1 })`, queue a 429 then a success, assert handler completes

## 5. Examples

- [x] 5.1 Create `examples/21-files-bot/` with `package.json`, a bot using `@grammyjs/files`, and a vitest test demonstrating `file.getUrl()`
- [x] 5.2 Create `examples/22-hydrate-bot/` with `package.json`, a bot using `@grammyjs/hydrate`, and a vitest test demonstrating hydrated message methods
- [x] 5.3 Create `examples/23-auto-retry-bot/` with `package.json`, a bot using `@grammyjs/auto-retry`, and a vitest test demonstrating retry on simulated 429

## 6. VitePress Docs Restructure

- [x] 6.1 Create `site/plugins/` directory
- [x] 6.2 Move `site/recipes/conversations-plugin.md` → `site/plugins/conversations-plugin.md`
- [x] 6.3 Move `site/recipes/menu-plugin.md` → `site/plugins/menu-plugin.md`
- [x] 6.4 Create `site/plugins/files.md` — cover chain fix, default response shape, link to `21-files-bot` example
- [x] 6.5 Create `site/plugins/hydrate.md` — cover bot-level vs context-level install distinction, link to `22-hydrate-bot` example
- [x] 6.6 Create `site/plugins/auto-retry.md` — cover retry-in-tests caveat, show `maxRetryAttempts: 1` pattern, link to `23-auto-retry-bot` example
- [x] 6.7 Create `site/plugins/transformer-throttler.md` — cover delay caveat with `idle()`, no example
- [x] 6.8 Update `site/.vitepress/config.ts` sidebar: add Plugins group with 6 pages, remove conversations/menu from Recipes group

## 7. README Update

- [x] 7.1 Extend the plugin interop table in `README.md` with rows for `@grammyjs/files`, `@grammyjs/hydrate`, and `@grammyjs/auto-retry`
- [x] 7.2 Add examples 21, 22, 23 to the examples list in `README.md`

## 8. Changelog and Version Bump

- [x] 8.1 Add a `## 0.23.0 — 2026-05-07` entry to `docs/CHANGELOG.md` covering: transformer chain fix, new plugin interop (files, hydrate, auto-retry), new examples (21–23), VitePress Plugins section
- [x] 8.2 Bump version to `0.23.0` in `package.json`
- [x] 8.3 Bump version to `0.23.0` in `jsr.json`

## 9. Quality Gate

- [x] 9.1 Run `npm run lint:fix` and fix all errors
- [x] 9.2 Run `npm run format:md` and fix all errors
- [x] 9.3 Run `npm run typecheck` and fix all errors
- [x] 9.4 Run `npm run lint` and fix all errors
- [x] 9.5 Run `npm run test:run` and fix all failures
- [x] 9.6 Run `npm run test:coverage` and verify coverage is acceptable

## 10. hydrateChatMember() Transformer Support

- [x] 10.1 Add `hydrateChatMember()` tests to `tests/plugins/chat-members.spec.ts` — install before `prepareBot`, assert `getChatMember` result has `.is()` method, assert `getChatAdministrators` items have `.is()` method
- [x] 10.2 Create `site/plugins/chat-members.md` — cover `chatMembers(adapter)` middleware (v0.21.0) and `hydrateChatMember()` transformer (v0.23.0), show `.is()` usage pattern
- [x] 10.3 Update `site/.vitepress/config.ts` sidebar — add `{ text: 'Chat Members', link: '/plugins/chat-members' }` to Plugins group
- [x] 10.4 Update `README.md` — update `@grammyjs/chat-members` row to mention `hydrateChatMember()` and `bot.api.config.use()` install; update supported-since to reflect both v0.21.0 (middleware) and v0.23.0 (transformer)
- [x] 10.5 Update `docs/CHANGELOG.md` 0.23.0 entry — add bullet for `hydrateChatMember()` support and `chat-members` doc page

## 11. Custom Payload Transformer Support

- [x] 11.1 Create `tests/plugins/custom-transformer.spec.ts` — install a request-mutating transformer, assert `chats.outgoing.requests` captures the modified payload; also test a response-augmenting transformer
- [x] 11.2 Update `docs/CHANGELOG.md` 0.23.0 entry — add bullet for custom transformer chain support

## 12. Quality Gate (Round 2)

- [x] 12.1 Run `npm run lint:fix` and fix all errors
- [x] 12.2 Run `npm run format:md` and fix all errors
- [x] 12.3 Run `npm run typecheck` and fix all errors
- [x] 12.4 Run `npm run lint` and fix all errors
- [x] 12.5 Run `npm run test:run` and fix all failures
- [x] 12.6 Run `npm run test:coverage` and verify coverage is acceptable
