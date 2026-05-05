## 1. Config changes (no source code edits)

- [x] 1.1 Add `ctx`, `Ref`, `params`, `prop`, `args`, `cbData` to the `allowList` in `.eslint/node/unicorn.eslint.mjs`
- [x] 1.2 Add a narrow override in `eslint.config.mjs` to disable `no-barrel-files/no-barrel-files` for `src/index.ts` and `src/low-level.ts` only
- [x] 1.3 Remove the `Plugin source overrides` block from `eslint.config.mjs`
- [x] 1.4 Remove the `Test overrides` block from `eslint.config.mjs`
- [x] 1.5 Run `npm run lint` and record remaining error count per rule as baseline

## 2. Auto-fixable and mechanical source fixes

- [x] 2.1 Run `npm run lint:fix` to auto-fix `@typescript-eslint/consistent-type-imports` violations
- [x] 2.2 Replace all `counter++` and `counter--` with `counter += 1` / `counter -= 1` in `src/` (no-plusplus — ~21 occurrences)
- [x] 2.3 Wrap numeric values in template literals with `String()` in `src/` (restrict-template-expressions — ~16 occurrences)
- [x] 2.4 Reorder functions in `src/` to eliminate `no-use-before-define` violations (~8 occurrences)
- [x] 2.5 Remove always-true conditions flagged by `@typescript-eslint/no-unnecessary-condition` in `src/` (~5 occurrences)
- [x] 2.6 Simplify over-parameterised generics flagged by `no-unnecessary-type-parameters` (~4 occurrences)
- [x] 2.7 Fix `no-redundant-type-constituents` violation (1 occurrence)

## 3. Naming convention fixes in source

- [x] 3.1 Rename `ReplyClickButtonMatcher.data` and `FindButtonMatcher.data` to `callbackData` throughout `src/high-level/reply.ts` and update all call sites
- [x] 3.2 Rename type parameter `M` in `src/low-level/outgoing-requests.ts` to `TMethod` (or another compliant name per naming config)
- [x] 3.3 Rename `ContextConstructor` property in `src/low-level/prepare-composer.ts` to camelCase equivalent
- [x] 3.4 Fix remaining `@typescript-eslint/naming-convention` violations in source (~remaining after 3.1–3.3)
- [x] 3.5 Fix 2 `camelcase` violations in source

## 4. JSDoc — source files

- [x] 4.1 Add JSDoc to all exported and non-trivial internal functions in `src/high-level/user.ts`
- [x] 4.2 Add JSDoc to all exported and non-trivial internal functions in `src/high-level/chats.ts`
- [x] 4.3 Add JSDoc to all exported and non-trivial internal functions in `src/high-level/dispatch.ts`
- [x] 4.4 Add JSDoc to all exported and non-trivial internal functions in `src/high-level/reply.ts`
- [x] 4.5 Add JSDoc to all exported and non-trivial internal functions in `src/high-level/group.ts`, `supergroup.ts`, `channel.ts`, `private-chat.ts`
- [x] 4.6 Add JSDoc to all exported and non-trivial internal functions in `src/high-level/business-account.ts`
- [x] 4.7 Add JSDoc to all exported and non-trivial internal functions in remaining `src/` files (`chat.ts`, `messages-log.ts`, `id-generator.ts`, `types.ts`, low-level files)
- [x] 4.8 Run `npm run lint` — zero `jsdoc/*` errors remain in `src/`

## 5. Test quality fixes

- [x] 5.1 Replace all `!` non-null assertions in `tests/reference/modern-update-types.spec.ts` with `expect(value).toBeDefined()` + `if (!value) return` narrowing (~37 occurrences)
- [x] 5.2 Replace `!` non-null assertions in `tests/reference/menu-flows.spec.ts` and `menu.spec.ts` (~7 occurrences)
- [x] 5.3 Replace remaining `!` non-null assertions across all other test files (~6 occurrences)
- [x] 5.4 Fix `vitest/no-conditional-expect` violations in tests (4 occurrences — restructure conditional test logic)
- [x] 5.5 Fix `no-void` violations in tests (3 occurrences)
- [x] 5.6 Fix remaining naming convention violations in tests not covered by allowList additions

## 6. Quality gate

- [x] 6.1 Run `npm run typecheck` — exits 0
- [x] 6.2 Run `npm run lint` — exits 0 with zero errors
- [x] 6.3 Run `npm run test:run` — all tests pass
- [x] 6.4 Run `npm run test:coverage` — coverage stays at or above 80%
