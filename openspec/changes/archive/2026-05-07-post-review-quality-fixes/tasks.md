## 1. Transformer documentation

- [x] 1.1 Add an inline comment to the `_previous` parameter in `createTransformer` (`src/low-level/transformer.ts`) explaining it is intentionally never called and that calling it would break the snapshot-and-reinstall assumption in `prepareBot`

## 2. Plugin example type safety

- [x] 2.1 In `examples/21-files-bot/bot.ts`: import `FileFlavor` from `@grammyjs/files`, change the bot type to `Bot<FileFlavor<Context>>`, and remove the `as unknown as { getUrl: () => string }` cast — `file.getUrl()` should be typed directly
- [x] 2.2 In `examples/22-hydrate-bot/bot.ts`: confirm `HydrateFlavor<Context>` is already the context type, then remove the `as unknown as { message_id?: number }` cast on `sent` — access `sent.message_id` directly as it is already typed on the `Message` return of `ctx.reply()`

## 3. Test helper cleanup

- [x] 3.1 In `tests/plugins/chat-members.spec.ts`: remove the empty `/** */` JSDoc blocks (including bare `@param` lines) from `makeUser`, `asMember`, `asLeft`, and `makeChatMemberUpdate`

## 4. Spec sync

- [x] 4.1 Update `openspec/specs/examples-catalog/spec.md` by applying the MODIFIED requirements from this change's delta spec: folder count → 23, plugin imports allowed, context flavor requirement added

## 5. Quality gate

- [x] 5.1 Run `npm run lint:fix` and fix any errors
- [x] 5.2 Run `npm run format:md` and fix any errors
- [x] 5.3 Run `npm run typecheck` and fix any errors
- [x] 5.4 Run `npm run lint` and fix any errors
- [x] 5.5 Run `npm run test:run` and fix any failures
- [x] 5.6 Run `npm run test:coverage` and fix any failures

## 6. Changelog and version bump

- [x] 6.1 Add a `## 0.24.1 — <date>` entry to `docs/CHANGELOG.md` covering: transformer terminal-intent comment, plugin example context flavor types, test helper JSDoc cleanup
- [x] 6.2 Bump version to `0.24.1` in both `package.json` and `jsr.json`
