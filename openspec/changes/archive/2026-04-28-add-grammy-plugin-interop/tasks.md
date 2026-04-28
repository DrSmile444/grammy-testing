## 1. Install plugin devDependencies

- [x] 1.1 Install `@grammyjs/conversations`, `@grammyjs/menu`, `@grammyjs/parse-mode`, `@grammyjs/chat-members` as devDependencies (`npm install --save-dev ...`)

## 2. Plugin test files

- [x] 2.1 Create `tests/plugins/conversations.spec.ts` — multi-step conversation recipe; test advances conversation step-by-step via sequential `user.sendText` calls and verifies via side effects (conversations v2 bypasses transformer — documented in JSDoc)
- [x] 2.2 Create `tests/plugins/menu.spec.ts` — menu flow recipe using `@grammyjs/menu`; test dispatches command to receive menu, then calls `reply.clickButton(matcher)` and asserts handler response
- [x] 2.3 Create `tests/plugins/parse-mode.spec.ts` — `fmt`/`b`/`i` marker recipe (v2 API); asserts `reply.text` and `reply.entities` from captured output
- [x] 2.4 Create `tests/plugins/chat-members.spec.ts` — join/leave tracking recipe using `@grammyjs/chat-members`; dispatches `chat_member` updates via `bot.handleUpdate` and inspects adapter state

## 3. Update vitest config

- [x] 3.1 Add `tests/plugins/**/*.spec.ts` to vitest include pattern if not already covered by the existing glob (verified — `**/*.spec.ts` covers it)

## 4. Verification

- [x] 4.1 Run `npx vitest run tests/plugins/` and confirm all plugin tests pass (9/9 passed)
- [x] 4.2 Run full `npx vitest run` and confirm no regressions (145 tests passed, up from 136)
- [x] 4.3 Update `tests/reference/README.md` — added "Plugin interop tests" section cross-referencing `tests/plugins/`
