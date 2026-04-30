## Context

The `@grammyjs/testing` library was bootstrapped in PR #1 from a TypeScript boilerplate. A post-merge review identified 13 module-level counters that bleed state between test runs, a logic bug in reply routing, a mutable public field on `OutgoingRequests`, and several config/polish issues.

All affected files are in `src/high-level/` and `src/low-level/`, with supporting changes in config files. No public consumer-facing APIs are removed; the most visible change is `outgoing.requests` gaining a `readonly` type.

## Goals / Non-Goals

**Goals:**
- Eliminate all module-level mutable counters (test isolation)
- Fix the `dispatchServiceMessage` double-increment bug
- Scope Rule 4 reply routing to the originating chat
- Make `outgoing.requests` safe to read but not externally writable
- Align all config files (jsr.json version, engines, README, tsconfig comment)
- Extract the inline CJS verify script
- Raise `getAll()` overload cap to 10

**Non-Goals:**
- Changing the public `@grammyjs/testing` API surface beyond the `readonly` qualifier on `requests`
- Addressing the `low-level.ts` superset design question (deferred)
- Upgrading `deepmerge` to v5 (comment is sufficient)

## Decisions

### D1: Thread `IdGenerator` into Group, Supergroup, and Channel

**Decision:** Pass `ids: IdGenerator` to `Group`, `Supergroup`, and `Channel` constructors. `Chats.registerChat()` supplies `this.ids`. Each chat class uses `this.ids.nextUpdateId()` wherever an update ID is needed, replacing ad-hoc instance counters.

**Alternatives considered:**
- *Instance counter fields per class*: Simpler diff, but creates multiple independent counters that can produce overlapping IDs when two groups exist in the same test. Using `IdGenerator` gives globally-unique IDs within a `Chats` instance.
- *Optional `updateId` on spec + fallback counter*: Adds noise to the spec type; callers shouldn't need to think about IDs.

**Rationale:** `IdGenerator` is already the authoritative ID source for users, messages, and files. Extending it to update IDs keeps one source of truth per `Chats` instance.

### D2: `IdGenerator.nextUpdateId()` — dedicated range

**Decision:** Add `private updateCounter = 1_000_000` and `nextUpdateId(): number` to `IdGenerator`. The 1 000 000+ range avoids collisions with message IDs (which start at 1) and the hard-coded legacy bases (200 000, 500 000, etc.) still found in `user.ts`.

### D3: `dispatch.ts` pure functions — explicit `updateId` on spec

**Decision:** Add `updateId: number` to `MyChatMemberDispatch`. Remove `mcmCounter`, `serviceMessageCounter`, `cmCounter`. Callers (`group.ts`, `supergroup.ts`) pass `this.ids.nextUpdateId()`.

`serviceMessageCounter` is also a correctness bug: the current code does `spec.updateId + serviceMessageCounter`, meaning the final ID grows with each call rather than being the caller-supplied value. The fix is to use `spec.updateId` directly and drop the counter entirely.

**Alternative considered:** Keep counters inside dispatch as module-level but reset them in a test-setup hook. Rejected: it requires test authors to remember to call the reset, and it's the wrong abstraction level.

### D4: `outgoing.requests` → private field + readonly getter

**Decision:**
```
private _requests: Request[] = []
get requests(): readonly Request[] { return this._requests; }
```
`push()` appends to `this._requests`; `clear()` sets `this._requests.length = 0` (in-place truncation) so that any existing reference to the array sees the empty state. All existing test assertions (`toEqual([])`, `.toHaveLength()`, `[0]?.method`) continue to work unchanged.

**Alternative:** `readonly requests: Request[] = []` (field-level readonly). Rejected: TypeScript's field `readonly` only prevents reassignment of the reference, not mutation of the array contents. It also prevents `clear()` from replacing the array, which would require callers to hold stale references.

**Why in-place truncation for `clear()`?** Allows code that captured a reference to `outgoing.requests` before a clear to observe the emptied array, matching reasonable test expectations.

### D5: Rule 4 reply routing — add chatId to clickers

**Decision:** Change the clickers map:
```
// Before
private readonly clickers = new Map<string, number>()
//                                   callbackData   userId

// After
private readonly clickers = new Map<string, { userId: number; chatId: number }>()
```

`recordClick` gains a `chatId: number` parameter. `Reply` passes `this.chat.id` when calling it. Rule 4 in `userReceivesReply` requires `byChatId === chat.id`.

**Why not clear the clickers map after each reply?** A single click can trigger multiple bot replies (e.g., edit + send). Clearing on first match would miss subsequent replies in the same handler.

**Why not scope by callback data?** The routing goal is "user clicked something in this chat → route the response to them." The specific callback data is irrelevant to the routing decision.

### D6: getAll() overloads raised to 10

Simple mechanical extension of the existing overload pattern. No new logic.

### D7: deepmerge import — comment only

The `deepmerge@4` package ships only a CJS bundle. TypeScript's `moduleResolution: "bundler"` resolves the CJS default export correctly in most environments, but some bundler/runner combinations wrap it in `{ default: fn }`. The existing `?? deepmergeImport` fallback handles both cases. A comment is sufficient; upgrading to deepmerge v5 (ESM-only) is a separate decision.

## Risks / Trade-offs

- **`clear()` in-place truncation**: `this._requests.length = 0` mutates the array object rather than replacing it. If a test captured the array reference and later checks `.length`, it will see 0. This is the correct behavior, but differs from what `this._requests = []` would do for code holding stale references to the old array.

- **`IdGenerator.nextUpdateId()` range**: The 1 000 000 base is an assumption. `user.ts` uses offsets like `+ 100_000` and `+ 200_000` on top of message IDs, which currently start at 1. If message IDs grow large enough (unlikely in tests) they could collide with the update ID range. No mitigation needed in practice.

- **Removing serviceMessageCounter**: One test (`tests/reference/messages.spec.ts:163`) asserts `update_id: 999_010`. After the fix, this value will change because the counter offset is removed. The test assertion must be updated to match the new deterministic value.

## Open Questions

- None. All decisions above are resolved per the user's direction during the explore session.
