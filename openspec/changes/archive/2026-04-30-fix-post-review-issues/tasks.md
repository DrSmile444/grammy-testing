## 1. Config & Documentation Fixes

- [x] 1.1 Sync `jsr.json` version from `0.1.0` to `0.7.1`
- [x] 1.2 Relax `package.json` `engines.node` from `>=22.0.0` to `>=18.0.0`
- [x] 1.3 Remove the stray `---` separator from `README.md` (line ~173)
- [x] 1.4 Add a comment to `tsconfig.json` next to `"ignoreDeprecations": "6.0"` explaining which TypeScript 6.0 deprecations are being suppressed
- [x] 1.5 Extract the inline `test:cjs` one-liner from `package.json` into `scripts/verify-cjs.js` and update the `package.json` script to call `node scripts/verify-cjs.js`

## 2. `IdGenerator` — Add `nextUpdateId()`

- [x] 2.1 Add `private updateCounter = 1_000_000` field and `nextUpdateId(): number` method to `src/high-level/id-generator.ts`
- [x] 2.2 Verify `nextUpdateId()` produces values in the 1 000 000+ range distinct from message IDs

## 3. Thread `ids` into Group, Supergroup, Channel

- [x] 3.1 Add `ids: IdGenerator` parameter to `Group` constructor (`src/high-level/group.ts`); store as `private readonly ids`
- [x] 3.2 Add `ids: IdGenerator` parameter to `Supergroup` constructor (`src/high-level/supergroup.ts`); store as `private readonly ids`
- [x] 3.3 Add `ids: IdGenerator` parameter to `Channel` constructor (`src/high-level/channel.ts`); store as `private readonly ids`
- [x] 3.4 Update `Chats.registerChat()` in `src/high-level/chats.ts` to pass `this.ids` to each chat constructor

## 4. Eliminate Module-Level Counters

- [x] 4.1 `src/high-level/dispatch.ts`: remove `mcmCounter`; add `updateId: number` to `MyChatMemberDispatch` spec; use `spec.updateId` in the `Update` object
- [x] 4.2 `src/high-level/dispatch.ts`: remove `serviceMessageCounter`; fix the `update_id` assignment bug — change `spec.updateId + serviceMessageCounter` to `spec.updateId`
- [x] 4.3 `src/high-level/dispatch.ts`: remove `cmCounter`; add `updateId: number` to the `ChatMemberDispatch` spec (if not already present); use `spec.updateId`
- [x] 4.4 `src/high-level/group.ts`: update `changeMemberStatus` and any reaction-count dispatch to pass `this.ids.nextUpdateId()` as `updateId`; convert `reactionCountCounter` module variable to an `ids` call
- [x] 4.5 `src/high-level/supergroup.ts`: same as 4.4 for supergroup
- [x] 4.6 `src/high-level/channel.ts`: convert `postCounter`, `editPostCounter`, and `reactionCountCounter` module variables to `this.ids.nextUpdateId()` calls
- [x] 4.7 `src/high-level/chats.ts`: convert `pollStateCounter` module variable to a `private pollStateCounter = 0` instance field
- [x] 4.8 `src/high-level/business-account.ts`: replace `bizConnectionCounter`, `bizMessageCounter`, `bizEditedMessageCounter`, `bizDeletedMessagesCounter` with `this.ctx.ids.nextMessageId()` / `this.ctx.ids.nextUpdateId()` calls (it already holds `ctx.ids`)

## 5. `outgoing.requests` — Readonly Field

- [x] 5.1 In `src/low-level/outgoing-requests.ts`, rename the public `requests` field to `private _requests: Request[] = []`
- [x] 5.2 Add `get requests(): readonly Request[]` getter that returns `this._requests`
- [x] 5.3 Update `push()` to append to `this._requests`
- [x] 5.4 Update `clear()` to truncate in-place: `this._requests.length = 0`
- [x] 5.5 Update all internal methods (`getFirst`, `getLast`, `getTwoLast`, `getThreeLast`, `getAll`, `getMethods`, `length`) to reference `this._requests`

## 6. Rule 4 Reply Routing — Scope to Chat

- [x] 6.1 In `src/high-level/chats.ts`, change `clickers: Map<string, number>` to `Map<string, { userId: number; chatId: number }>`
- [x] 6.2 Update `deriveFromCapture` to pass `chat.id` when constructing the `Reply` (so `recordClick` receives `chatId`)
- [x] 6.3 Update the `ReplyDeps.recordClick` signature in `src/high-level/reply.ts` to accept `chatId: number`
- [x] 6.4 Update `Reply.clickButton` / wherever `recordClick` is called to pass `this.chat.id`
- [x] 6.5 Update `userReceivesReply` Rule 4 in `Chats` to check `byChatId === chat.id` in addition to `byUserId === entry.user.id`

## 7. `getAll()` Overloads — Raise Cap to 10

- [x] 7.1 In `src/low-level/outgoing-requests.ts`, add overloads 7 through 10 to `getAll()` following the existing pattern (adding one type parameter per overload)

## 8. `deepmerge` Import — Add Explanatory Comment

- [x] 8.1 In `src/low-level/updates/generic-mock.update.ts`, add a one-line comment above the deepmerge workaround line explaining that deepmerge@4 ships CJS-only and some bundlers wrap the default export; the `?? deepmergeImport` fallback handles both shapes

## 9. Fix Affected Test Assertions

- [x] 9.1 Update `tests/reference/messages.spec.ts` line ~163 which asserts `update_id: 999_010` — recalculate the expected value after removing `serviceMessageCounter` from the update_id computation, or replace with `expect.any(Number)` if the exact value is not semantically meaningful
