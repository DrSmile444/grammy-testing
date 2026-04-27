## Why

grammY has no first-party testing story — the official docs explicitly call out the gap and ask the community for a framework. Existing attempts are either Deno-only (`grammy_tests`) or hand-rolled inside individual bots (`ua-anti-spam-bot`'s in-repo `src/testing/`). This proposal lands the **low-level foundation** of `@grammyjs/testing`: the primitives that drive a real grammY bot in-process, capture every outgoing API call, and let tests dispatch synthetic updates. Everything in v0.2 (the high-level `Chats`/`User`/`Admin` API) and v0.3 (plugin interop, Deno publish) sits on top of this layer.

## What Changes

- Three explicit entry points that wrap the bot/composer/middleware under test and return `{ chats }`:
  - `prepareBot(bot, options?)`
  - `prepareComposer(composer, options?)`
  - `prepareMiddleware(middleware, options?)`
- `OutgoingRequests` collector reachable as `chats.outgoing`, capturing every grammY API call via a transformer. Surface: `requests`, `length`, `push`, `clear`, `getMethods`, `buildMethods`, `getFirst`, `getLast`, `getTwoLast`, `getThreeLast`, and the `getAll<T...>()` typed-tuple overloads.
- Async settle helper `chats.idle()` that resolves once every promise returned by the captured transformer has settled — covers awaited and unawaited `ctx.api.*` calls. `setTimeout`/`setImmediate` work is explicitly out of scope; the docs recipe combines `chats.idle()` with the runner's own fake timers.
- Canned API response config: `prepareBot(bot, { responses })` accepts either a static value or a `(payload, method) => result` function per method.
- Error-simulation API on `outgoing`: `failNext`, `failAll`, `respondNext`, `clearOverrides`. Each accepts a real `GrammyError` *or* a sugar spec `{ code, description }` that the plugin upgrades to a `GrammyError` internally.
- Context-field mocking: generic `mockContextField(field, remap)` plus specialized `mockSession`, `mockChatSession`, `mockState`. Each returns `{ <field>, <field>Middleware }` for direct mutation between assertions.
- Low-level update-builder primitives behind `.build()` / `.buildOverwrite()` (deepmerge-based): `GenericMockUpdate` (abstract), `MessagePrivateMockUpdate`, `MessageMockUpdate` (supergroup), `NewMemberMockUpdate`, `LeftMemberMockUpdate`, `MyChatMemberMockUpdate`. Generic fixtures (`genericUser`, `genericUser2`, `genericPrivateChat`, `genericGroupChat`, `genericSuperGroup`, `genericChannelChat`, `genericOwner`, `genericAdmin`, `genericUserMember`) exposed from a discoverable entry.
- Public-type discipline: `Uint8Array` (not `Buffer`), `ReadableStream` (not `node:stream`). Node-specific code stays internal — the public surface stays Web-platform-shaped so Bun and Deno work without per-runtime branches.
- Package layout: top-level `@grammyjs/testing` re-exports the entry points, `OutgoingRequests`, error-simulation, async helpers, canned-response config, and context-field mocks. The update-builder primitives are reachable only via `@grammyjs/testing/low-level` — the subpath signals "escape hatch" intentionally.
- Repository transitions from the TypeScript boilerplate state: `package.json` rename to `@grammyjs/testing`, license flip to MIT, `grammy` declared as peer dep.

## Capabilities

### New Capabilities

- `bot-test-harness`: the three entry points (`prepareBot` / `prepareComposer` / `prepareMiddleware`), what they accept, what they return, and the lifecycle guarantees of `chats.idle()`.
- `outgoing-requests-capture`: the `OutgoingRequests` collector, transformer-based capture, canned responses, and the error-simulation API.
- `context-field-mocking`: `mockContextField` and the `mockSession` / `mockChatSession` / `mockState` specializations.
- `update-builders`: low-level update-builder primitives, the `.build()` / `.buildOverwrite()` contract, deepmerge semantics, and the generic fixtures exposed from `@grammyjs/testing/low-level`.

### Modified Capabilities

None — this is the first capability set.

## Impact

- **Source layout**: introduces `src/high-level/` (placeholder for v0.2), `src/low-level/`, `src/index.ts`, and `src/low-level.ts`. Replaces the boilerplate `src/main.ts`.
- **`package.json`**: rename to `@grammyjs/testing`, license MIT, add `exports` map for `.` and `./low-level` (ESM + CJS dual), add `grammy` as peer dependency, add `deepmerge` as the only runtime dep (or inline a minimal copy if zero-dep is preferred during implementation).
- **Tests**: existing `tests/main.spec.ts` from the boilerplate is removed; the plugin's own tests under `tests/` start exercising the primitives directly.
- **Docs**: `docs/project.md` will be updated in a separate `update-project-vision` proposal to remove migration-target language; this change does not edit it. README rewrite is also out of scope here.
- **Out of scope (separate proposals)**: high-level `Chats`/`User`/`Admin`/`Reply` API (v0.2), anti-spam reference test suite (validation gate), grammY plugin interop examples, multi-runtime publish + CI matrix, VitePress site, project-doc rewrite.
