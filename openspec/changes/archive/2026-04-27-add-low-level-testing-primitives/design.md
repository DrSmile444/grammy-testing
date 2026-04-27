## Context

`@grammyjs/testing` has no first-party predecessor. The closest reference is `ua-anti-spam-bot/src/testing/` — a hand-rolled, in-repo testing layer used across ~400 specs in that bot. The grammY docs explicitly invite a community testing framework but do not constrain the design. We are starting from a TypeScript boilerplate (`src/main.ts`, package name `typescript-boilerplate`) — there is no prior art in this repo.

The vision in `docs/project.md` is broad: a layered API (low-level primitives → mid-level fluent builders → high-level `Chats`/`User`/`Admin`), multi-runtime support (Node/Bun/Deno), and multi-runner support (Vitest/Jest). This change scopes down to **only the low-level primitives layer** (v0.1). The high-level layer (v0.2) and runtime/runner matrix (v0.3) are deferred to separate proposals.

A late-stage exploration shifted one strategic constraint: **`ua-anti-spam-bot` is no longer a migration target**. It is an inspiration corpus only. We are NOT promising find-and-replace name parity with its in-repo `@testing/*` primitives. We CAN choose better names where they help.

## Goals / Non-Goals

**Goals:**
- Ship the foundation primitives every higher-level surface depends on.
- Provide three explicit entry points so test authors pick the granularity that matches what they're testing.
- Make outgoing API capture transparent — the bot under test never knows it's being tested.
- Make `await user.send*(...)`-style flows work correctly without polling, `setTimeout(0)`, or other flaky-test escape hatches.
- Keep the public surface Web-platform-shaped so Bun and Deno work without per-runtime branches.

**Non-Goals:**
- High-level `Chats` / `newUser` / `newAdmin` / `Reply` / per-user replies-inbox / `clickButton` API (deferred to `add-high-level-chats-api`, v0.2).
- Anti-spam reference test suite (deferred to its own validation-gate proposal).
- grammY plugin interop examples (deferred — conversations, menu, hydrate, etc.).
- Multi-runtime publish setup and CI matrix (Node/Bun/Deno × Vitest/Jest).
- VitePress docs site, README rewrite.
- Fake timers / clock mocking — explicitly delegated to runner-native fake timers.
- Tracking non-API async work (`setTimeout`, `setImmediate`, raw promises started outside `ctx.api.*`) — explicit non-goal of the async strategy.
- Project-doc rewrite to remove migration-target language (separate `update-project-vision` change).

## Decisions

### D1. Three explicit entry points instead of one polymorphic `prepareBot`

**Decision:** Ship `prepareBot(bot)`, `prepareComposer(composer)`, and `prepareMiddleware(middleware)` as three named exports.

**Rationale:** Composers and middleware can theoretically be wrapped into an internal `Bot` and routed through one polymorphic entry, but separating the names buys two things: (1) per-entry type narrowing — each entry's argument type is unambiguous, no overload ladders; (2) call-site clarity — a reader sees "this test drives a single composer" instantly without checking the variable's type.

**Alternatives considered:** A single `prepareBot(target)` with overloads. Rejected because overload error messages are notoriously confusing and the saved API surface area is small (three exports vs one).

### D2. Async tracking via transformer-promise set ("Strategy 2"), NOT `async_hooks`

**Decision:** The transformer wraps every promise it returns into a tracked set. `chats.idle()` resolves once the set drains. `setTimeout`/`setImmediate`/raw work outside `ctx.api.*` is intentionally not tracked.

**Rationale:** Three properties matter: (a) cross-runtime portability — `async_hooks`/`AsyncLocalStorage` is Node's surface and Deno+Bun support is partial/shaky; (b) observability — promise-set tracking is ~30 lines and easy to debug; (c) honest scope — capturing arbitrary background work creates a false sense of safety because tests would still flake on `setTimeout`. Better to be explicit: "we track API-call work; you handle timer work with `vi.useFakeTimers()`."

**Real impact on the inspiration corpus:** `ua-anti-spam-bot/src/bot/plugins/self-destructed.plugin.ts:53` and `tests/listeners/test-tensor.listener.ts:255` both use `setTimeout`. Tests for those flows will need to combine `await chats.idle()` with `await vi.advanceTimersByTimeAsync(60_000)`. Document this explicitly.

**Alternatives considered:**
- `async_hooks` / `AsyncLocalStorage` instrumentation. Rejected: Node-leaning, observable side-effects, hidden global state.
- "Just `await bot.handleUpdate(u)`" without any tracking. Rejected: misses unawaited `void ctx.api.sendMessage(...)`, which the anti-spam codebase uses in error handlers.

### D3. Return `{ chats }` only — `chats.outgoing` is the canonical access

**Decision:** Each entry point resolves to `{ chats }`. The `OutgoingRequests` collector is reachable as `chats.outgoing`. There is no top-level `outgoing` in the return shape.

**Rationale:** The doc sketched `{ chats, outgoing }` but `chats.outgoing` is also exposed, which makes the destructure redundant. Picking one canonical path (the chats-rooted access) keeps tests readable and avoids "which one do I use?" confusion. Test code becomes `const { chats } = await prepareBot(bot)` — one binding.

**Alternative considered:** Keep both for ergonomic destructuring. Rejected: the duplication has zero upside and asymmetric usage in tests would be a recurring "wait, why two?" question.

### D4. Canned responses accept static value OR function

**Decision:** `prepareBot(bot, { responses: { sendMessage: { ok: true, ... } } })` and `prepareBot(bot, { responses: { getChatMember: ({ user_id }) => members[user_id] } })` both work. The function form receives `(payload, method)` and returns the response value.

**Rationale:** Static responses cover the common case (every call returns the same shape). Real tests need dispatch on payload — `getChatMember(user=A)` and `getChatMember(user=B)` returning different things — and the function form is the smallest possible surface to cover that. We do NOT support async responses in v0.1; if a function returns a promise the transformer awaits it, but the documented API is sync.

**Alternative considered:** Accept only static; tell users to write a transformer themselves for dynamic dispatch. Rejected: that defeats the purpose of canned responses.

### D5. Error simulation accepts a `GrammyError` OR a sugar spec `{ code, description }`

**Decision:** `outgoing.failNext('sendMessage', new GrammyError(...))` works. `outgoing.failNext('sendMessage', { code: 403, description: 'Forbidden: bot was blocked by the user' })` also works and the plugin upgrades the spec to a real `GrammyError` internally.

**Rationale:** The `GrammyError` constructor takes four arguments, three of which are boilerplate the test author copies from grammY source. The sugar spec collapses 90% of error tests to a one-line assertion-driving setup.

**Alternatives considered:**
- Sugar only. Rejected: real bots sometimes throw subclasses or carry custom `parameters`; users need a direct-constructor escape hatch.
- Constructor only. Rejected: forces every test to import `GrammyError` and write boilerplate.

### D6. Public types Web-platform-shaped (`Uint8Array`, `ReadableStream`)

**Decision:** Public type signatures use `Uint8Array` for byte sequences and `ReadableStream` for streams. `Buffer`, `node:stream.Readable`, and `node:fs` references stay confined to internal implementation files.

**Rationale:** This is the cheapest way to keep Bun and Deno first-class. `Buffer extends Uint8Array` so internal Node code keeps working; the public surface stays neutral. Deno's `npm:` import and JSR publish both reject Node-only types in public APIs without per-runtime shims, so this discipline is the difference between "works under Deno" and "we ship a Deno-specific build."

**Note:** This proposal does not yet ship the file-capture surface (`CapturedFile.readBuffer()`) — that lands with the high-level layer in v0.2. The discipline is set here so the lower-level primitives that the file-capture API will sit on top of don't paint us into a Node-only corner.

### D7. Layered package exports: `@grammyjs/testing` (curated) and `@grammyjs/testing/low-level` (escape hatch)

**Decision:** Two entry points in `package.json#exports`:
- `.` re-exports the entry points (`prepareBot`/`prepareComposer`/`prepareMiddleware`), `OutgoingRequests` instance methods (via the `chats.outgoing` access path), error-simulation API, async helpers, canned-response config, and context-field mocks (`mockContextField`, `mockSession`, `mockChatSession`, `mockState`).
- `./low-level` re-exports everything in `.` PLUS the update-builder primitives (`GenericMockUpdate`, `MessagePrivateMockUpdate`, etc.) and generic fixtures (`genericUser`, `genericPrivateChat`, etc.).

**Rationale:** The update-builder primitives are explicitly an escape hatch (per the doc's "API design principles"). Putting them under `/low-level` makes the import statement itself signal "I'm reaching into the unsafe layer" — same pattern as React's `react-dom/server` or Node's `node:fs/promises`. The default `.` import gives the curated, future-stable surface.

**Alternatives considered:**
- Single entry exporting everything. Rejected: removes the signaling value; users would reach for builders before trying the (eventually higher-level) curated surface.
- Separate package `@grammyjs/testing-low-level`. Rejected: dual-package version-drift hazard, more publish overhead, no upside over a subpath export. Subpath exports work natively in Node, Bun, JSR, and Deno (`npm:@grammyjs/testing@x/low-level`).

### D8. Update-builder shape: deepmerge-based `.build()` / `.buildOverwrite()`

**Decision:** Each builder class extends `GenericMockUpdate` (an abstract base that exposes the generic fixtures). `.build()` returns the canonical update for that type. `.buildOverwrite(partialUpdate)` deep-merges `partialUpdate` into the canonical update. Deep-merge semantics: arrays replace, objects merge, primitives replace.

**Rationale:** This is the shape proven by `ua-anti-spam-bot/src/testing/updates/`. We are not migrating that bot, but its 400-spec usage validates that this surface shape is sufficient for real-world tests. Reinventing the shape risks introducing a less-proven contract.

**Naming change vs. inspiration source:** The inspiration uses `prepareBotForTesting`; we use `prepareBot`. The inspiration's `OutgoingRequests` keeps its name (it's already a great name). The mock update class names are kept (`MessagePrivateMockUpdate`, etc.) because they are descriptive and renaming gives no real value. Generic fixtures keep their names for the same reason.

### D9. `bot.init()` runs inside `prepareBot`; setup is awaited

**Decision:** `prepareBot` calls `bot.init()` internally and awaits it. The user's `await prepareBot(bot)` resolves only after `botInfo` is populated and the transformer is installed. This matches the inspiration's behavior.

**Rationale:** Without `bot.init()`, grammY refuses to dispatch updates. Surfacing this as a separate user step would be a footgun. Doing it inside `prepareBot` is invisible-correctness — exactly the testing framework's job.

**Implementation detail:** Order is (1) install transformer, (2) pre-populate `bot.botInfo` with the `genericUserBot` fixture, (3) call `await bot.init()`. grammY's `init()` short-circuits the `getMe` round-trip when `botInfo` is already set, so `chats.outgoing.requests` is empty after `prepareBot` resolves. This keeps every test's outgoing log clean — only test-driven calls appear there.

## Risks / Trade-offs

- **Strategy-2 async tracking misses non-API work** → Mitigation: documented explicitly in the recipe page (separate proposal); tests that use `setTimeout`-based bot logic combine `chats.idle()` with runner fake timers. We accept this gap by design.
- **Subpath exports require modern bundlers / Node 16+** → Mitigation: declare `engines.node >= 18` in `package.json` (matches grammY itself); document the floor in README when that lands.
- **`bot.init()` calling `getMe` adds a "noisy" first request to every test** → Mitigation: document the behavior; v0.2 high-level API can filter setup-phase requests if it becomes a real DX issue.
- **Update-builder names collide with future Telegram update types we haven't modeled** → Mitigation: keep the v0.1 list small (the six already proven in the inspiration); v0.2+ can extend without breaking.
- **Repository pivot from boilerplate** → Mitigation: this is a single concentrated PR (rename, license, source layout) so reviewers see all the boilerplate-removal in one place. Existing boilerplate scaffolding for ESLint/Prettier/Vitest stays — only `src/main.ts` and the boilerplate package metadata change.
- **`deepmerge` runtime dependency** → Mitigation: 700-line, zero-dep, MIT-licensed package used by the inspiration corpus. Acceptable. If a reviewer pushes back during implementation, we inline a 30-line variant.

## Migration Plan

This is a greenfield change — no migration needed. However, the boilerplate-to-plugin transition is mildly invasive and warrants explicit steps in the implementation tasks:
1. Delete `src/main.ts`, `tests/main.spec.ts`, and `docs/typescript-boilerplate-banner.svg`.
2. Rename `package.json#name` to `@grammyjs/testing`, license to MIT, set `version` to `0.1.0`, add `exports` map, peer-deps, etc.
3. Create the new source layout (`src/low-level/`, `src/index.ts`, `src/low-level.ts`).
4. Land the implementation per `tasks.md`.

Rollback: `git revert` the merge commit. No external state to undo.

## Open Questions

- Do we want `chats.outgoing.failOnce` as a synonym for `failNext`? `failNext` is the established name in similar fixture libraries (e.g., `nock`); flagging in case the team prefers `failOnce` for symmetry with `respondNext`. **Default for now: keep `failNext`.**
- Should `mockContextField` accept a function form `(prev) => next` for tests that need to derive the mocked value from the real one? Useful for partial-overrides but adds API surface. **Default for now: static value only; revisit if a real test demands it.**
- Do `prepareComposer` / `prepareMiddleware` need their own `botInfo` fixture, or do they reuse the same one as `prepareBot`? **Default for now: reuse the same `genericUserBot` fixture; document.**
