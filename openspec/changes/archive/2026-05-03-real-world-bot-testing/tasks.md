<!-- Tasks 3–11 run in PARALLEL after task group 2 completes. Spawn one agent per bot. -->

## 1. Pre-flight

- [x] 1.1 Confirm each target repo URL is accessible (`gh repo view <owner>/<repo>` or curl); note any inaccessible repos
- [x] 1.2 Confirm `dcdunkan/file-upload-bot` runtime (Deno or Node) by checking repo root for `deno.json` / `package.json`

## 2. Setup Agent: Clone & README

- [x] 2.1 Create directory `../_grammy-testing-integration/`
- [x] 2.2 Clone all accessible repos into `_grammy-testing-integration/<repo-name>/`
- [x] 2.3 Write `_grammy-testing-integration/README.md` with a table: repo, runtime, grammy version, status (cloned / skipped)

## 3. Bot Tests: bot-base/telegram-bot-template (Node, Agent 1)

- [x] 3.1 Install `@grammyjs/testing` and `vitest` as dev dependencies
- [x] 3.2 Write handler-layer `*.spec.ts` tests covering all commands and composers
- [x] 3.3 Run `npx vitest run`; confirm all tests pass
- [x] 3.4 Document any raw `handleUpdate` fallbacks as new entries in `grammy-testing/docs/TODO.md`

## 4. Bot Tests: bot-base/scan-tool-bot (Node, Agent 2)

- [x] 4.1 Install `@grammyjs/testing` and `vitest` as dev dependencies
- [x] 4.2 Write handler-layer `*.spec.ts` tests covering all commands and composers
- [x] 4.3 Run `npx vitest run`; confirm all tests pass
- [x] 4.4 Document any raw `handleUpdate` fallbacks in `grammy-testing/docs/TODO.md`

## 5. Bot Tests: ptkdev/aboutmeinfo-telegram-bot (Node, Agent 3)

- [x] 5.1 Install `@grammyjs/testing` and `vitest` as dev dependencies
- [x] 5.2 Write handler-layer `*.spec.ts` tests covering all commands and composers
- [x] 5.3 Run `npx vitest run`; confirm all tests pass
- [x] 5.4 Document any raw `handleUpdate` fallbacks in `grammy-testing/docs/TODO.md`

## 6. Bot Tests: JinsoRaj/TorrentConverter (Node, Agent 4)

- [x] 6.1 Install `@grammyjs/testing` and `vitest` as dev dependencies
- [x] 6.2 Identify all external service calls (torrent API, etc.) and stub them with `vi.fn()` or mock modules
- [x] 6.3 Write handler-layer `*.spec.ts` tests; if a handler is inseparable from its service, mark as "untestable without refactor" in README and skip
- [x] 6.4 Run `npx vitest run`; confirm all tests pass
- [x] 6.5 Document any raw `handleUpdate` fallbacks in `grammy-testing/docs/TODO.md`

## 7. Bot Tests: grinev/opencode-telegram-bot (Node, Agent 5)

- [x] 7.1 Install `@grammyjs/testing` and `vitest` as dev dependencies
- [x] 7.2 Write handler-layer `*.spec.ts` tests covering all commands and composers
- [x] 7.3 Run `npx vitest run`; confirm all tests pass
- [x] 7.4 Document any raw `handleUpdate` fallbacks in `grammy-testing/docs/TODO.md`

## 8. Bot Tests: remoodle/remoodle → apps/telegram-bot (Node, Agent 6)

- [x] 8.1 Navigate to `apps/telegram-bot`; confirm `package.json` exists there
- [x] 8.2 Install `@grammyjs/testing` and `vitest` as dev dependencies within `apps/telegram-bot`
- [x] 8.3 Write handler-layer `*.spec.ts` tests covering all commands and composers
- [x] 8.4 Run `npx vitest run` from `apps/telegram-bot`; confirm all tests pass
- [x] 8.5 Document any raw `handleUpdate` fallbacks in `grammy-testing/docs/TODO.md`

## 9. Bot Tests: dcdunkan/show-json-bot (Deno, Agent 7)

- [x] 9.1 Update `deps.ts` grammy import URL from `v1.31.3` to `v1.42.0`
- [x] 9.2 Add `"@grammyjs/testing": "../../grammy-testing/src/index.ts"` to `deno.jsonc` imports (local path — JSR publish not available yet)
- [x] 9.3 Run `deno check`; fix type errors — added `.ts` extensions to all grammy-testing internal imports and `allowImportingTsExtensions: true` to tsconfig.json
- [x] 9.4 Write `*.test.ts` files using `Deno.test` + `@std/expect` (21 tests across 5 handlers)
- [x] 9.5 Run `deno test`; all 21 tests pass
- [x] 9.6 Record `deno test` outcome — ✅ 21 passed
- [x] 9.7 Documented `reply_markup` gap in `print.test.ts` — `clickButton()` dispatches correctly but `callback_query.message.reply_markup` is `undefined` in handler because `toCapturedMessage()` omits it

## 10. Bot Tests: ArnabXD/AnimeDB-tgbot (Deno, Agent 8)

- [x] 10.1 Update `import_map.json` grammy version from `v1.11.0` to the latest `v1.x` on `deno.land/x`
- [x] 10.2 Run `deno check`; if type errors extend beyond test files into bot source, mark as "too stale" in README and stop
- [x] 10.3 Add `"@grammyjs/testing": "jsr:@grammyjs/testing"` to `deno.json` (or `import_map.json`) imports
- [x] 10.4 Write `*.test.ts` files using `Deno.test` + `@std/expect`; stub GraphQL client calls
- [x] 10.5 Run `deno test`; confirm all tests pass
- [x] 10.6 Record `deno test` outcome in the README table
- [x] 10.7 Document any raw `handleUpdate` fallbacks or Deno runtime errors in `grammy-testing/docs/TODO.md`

## 11. Bot Tests: dcdunkan/file-upload-bot (Agent 9)

- [x] 11.1 Determine runtime from repo root (`deno.json` → Deno; `package.json` → Node)
- [x] 11.2 Follow Node path (tasks 3.1–3.4) or Deno path (tasks 9.2–9.7) accordingly
- [x] 11.3 Document any raw `handleUpdate` fallbacks or runtime errors in `grammy-testing/docs/TODO.md`

## 12. Consolidate Findings

- [x] 12.1 Review all new entries added to `grammy-testing/docs/TODO.md` across all agents; remove duplicates and ensure consistent numbering
- [x] 12.2 Update `_grammy-testing-integration/README.md` with final test counts and finding counts per bot

## 13. Quality Gate (grammy-testing repo)

- [x] 13.1 Run `npm run lint:fix`
- [x] 13.2 Run `npm run format:md`
- [x] 13.3 Run `npm run typecheck`
- [x] 13.4 Run `npm run lint`
- [x] 13.5 Run `npm run test:run`
- [x] 13.6 Run `npm run test:coverage`
