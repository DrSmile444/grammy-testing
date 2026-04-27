## 1. Repository pivot from boilerplate to plugin

- [x] 1.1 Rename `package.json#name` from `typescript-boilerplate` to `@grammyjs/testing`, set `version` to `0.1.0`, change `license` from `ISC` to `MIT`, update `description` and `keywords`.
- [x] 1.2 Add `grammy` as a peer dependency with the latest stable major version range; add `deepmerge` as a runtime dependency.
- [x] 1.3 Add `package.json#exports` map with `"."` and `"./low-level"` entries (ESM resolution; CJS dual-publish wired in v0.3, leave a TODO).
- [x] 1.4 Delete `src/main.ts`, `tests/main.spec.ts`, `docs/typescript-boilerplate-banner.svg`. Remove the `start` script from `package.json`. Also removed transitive dependents: `src/version.ts`, `src/config/`, `src/interfaces/`, `tests/config/`, `typed-dotenv` runtime dep.
- [x] 1.5 Create the new source layout: `src/low-level/` (subdirectory), `src/index.ts` (top-level re-exports), `src/low-level.ts` (subpath re-exports).
- [x] 1.6 Update `tsconfig.json` `rootDir` / `outDir` if needed; verify `npx tsc --noEmit` passes on the empty layout.

## 2. OutgoingRequests collector

- [x] 2.1 Implement `OutgoingRequests` class in `src/low-level/outgoing-requests.ts` with `requests`, `length`, `push`, `clear`, `getMethods`, `buildMethods`, `getFirst`, `getLast`, `getTwoLast`, `getThreeLast`, and the six `getAll<T...>()` typed-tuple overloads.
- [x] 2.2 Add unit tests in `tests/low-level/outgoing-requests.spec.ts` covering each method, including the typed-tuple overloads.
- [x] 2.3 Implement the canned-responses internal map: static value or `(payload, method) => result` function form. Export the `Responses` type from `src/low-level/responses.ts`.

## 3. Async tracking via transformer-promise set

- [x] 3.1 Implement the transformer factory in `src/low-level/transformer.ts`. Pushes the request into the collector, looks up active per-method overrides (failNext / failAll / respondNext), applies the canned response or default, wraps the resulting promise via `IdleTracker`, returns it. On settle (resolve OR reject), removes the promise from the tracked set.
- [x] 3.2 Implement `chats.idle()` to resolve when the tracked-promise set is empty. Drains stably across multiple awaits via while-loop.
- [x] 3.3 Add tests in `tests/low-level/idle.spec.ts` covering: awaited API call (idle is a no-op), unawaited API call (idle awaits it), rejected unawaited call (idle still resolves), `setTimeout`-scheduled API call (idle does NOT wait — explicit non-coverage documented).

## 4. Error simulation API

- [x] 4.1 Implement `failNext`, `failAll`, `respondNext`, `clearOverrides` on `OutgoingRequests`.
- [x] 4.2 Implement the `GrammyError` sugar-spec upgrader in `src/low-level/grammy-error.ts`: when `failNext`/`failAll` receives `{ code, description }`, construct a `GrammyError` internally. `GrammyError` re-exported from the package root.
- [x] 4.3 Add tests in `tests/low-level/error-simulation.spec.ts` covering: failNext reverts after one call, failAll until clearOverrides, respondNext returns custom payload once, sugar-spec upgrades correctly, clearOverrides drops both queues.

## 5. Three entry points

- [x] 5.1 Implement `prepareBot(bot, options?)` in `src/low-level/prepare-bot.ts`: install transformer, pre-populate `bot.botInfo` with `genericBotInfo`, await `bot.init()`. Returns `{ chats }`.
- [x] 5.2 Implement `prepareComposer(composer, options?)` in `src/low-level/prepare-composer.ts`: create an internal `Bot`, register the composer via `bot.use(composer)`, delegate to `prepareBot`.
- [x] 5.3 Implement `prepareMiddleware(middleware, options?)` in `src/low-level/prepare-middleware.ts`: create an internal `Bot`, register via `bot.use(middleware)`, delegate to `prepareBot`.
- [x] 5.4 Add tests in `tests/low-level/prepare.spec.ts` covering each entry point: resolves to `{ chats }`, pre-populates botInfo without an extra getMe round-trip, accepts canned responses (static and function), all three return identical surface.

## 6. Context-field mocking

- [x] 6.1 Implement generic `mockContextField<TContext, TField, TResult>(fieldName, remap)` in `src/low-level/mock-context-field.ts`.
- [x] 6.2 Implement `mockSession`, `mockChatSession`, `mockState` specializations in `src/low-level/mock-context-fields.ts`.
- [x] 6.3 Add tests in `tests/low-level/mock-context-field.spec.ts` covering: generic injection, mutation between dispatches, each specialization.

## 7. Update-builder primitives

- [x] 7.1 Implement `GenericMockUpdate` abstract base in `src/low-level/updates/generic-mock.update.ts` with all generic fixtures and the abstract `minimalUpdate` / `build` declarations.
- [x] 7.2 Implement `MessagePrivateMockUpdate`.
- [x] 7.3 Implement `MessageMockUpdate` (supergroup).
- [x] 7.4 Implement `NewMemberMockUpdate` and `LeftMemberMockUpdate`.
- [x] 7.5 Implement `MyChatMemberMockUpdate`.
- [x] 7.6 Implement `.build()` and `.buildOverwrite()` via `deepmerge` with `arrayMerge: (_, source) => source` (arrays REPLACE).
- [x] 7.7 Add tests in `tests/low-level/updates/update-builders.spec.ts` covering each builder's `.build()` and `.buildOverwrite()` paths plus the deep-merge semantics.

## 8. Public-type discipline audit

- [x] 8.1 No `Buffer`, `node:fs`, `node:stream`, `process.` in `src/`. Verified via grep — only `import type` of grammY and type-fest types in public signatures.
- [x] 8.2 Added `tests/low-level/public-types.spec.ts` that imports every symbol from both entries and asserts the surface.

## 9. Layered exports wiring

- [x] 9.1 Wired `src/index.ts` to re-export entry points, `OutgoingRequests`, context-field mocks, error-simulation helpers, `GrammyError`.
- [x] 9.2 Wired `src/low-level.ts` to re-export everything from `src/index.ts` PLUS `GenericMockUpdate`, all five concrete builders.
- [x] 9.3 `package.json#exports` declares `"."` → `./src/index.ts` and `"./low-level"` → `./src/low-level.ts` (sources for now; build pipeline lands in v0.3 alongside CJS dual-publish). Subpath imports verified via test that imports from both entries.
- [x] 9.4 `public-types.spec.ts` confirms `MessagePrivateMockUpdate` etc. are NOT reachable from the default entry.

## 10. End-to-end smoke test

- [x] 10.1 `tests/smoke.spec.ts` Pattern 6: private `/language` command with `bot_command` entity, asserted via `outgoing.getMethods()` and the captured payload's text.
- [x] 10.2 `tests/smoke.spec.ts` Patterns 8: join service message via `NewMemberMockUpdate` and leave via `LeftMemberMockUpdate`, both verified to capture `deleteMessage`.
- [x] 10.3 `npm run test:run` green: 48/48 tests pass in ~600ms, no skips or `.only`.
- [x] 10.4 `npm run lint` clean (0 errors, 0 warnings) and `npm run typecheck` clean.

## 11. Validation against OpenSpec

- [x] 11.1 `openspec validate add-low-level-testing-primitives --strict` reports valid.
- [x] 11.2 Every requirement in `specs/*/spec.md` is exercised by at least one test under `tests/low-level/` or `tests/smoke.spec.ts`.
