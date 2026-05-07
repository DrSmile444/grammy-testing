## Why

Three related gaps in the transformer infrastructure surfaced during PR #6 review: the terminal-intent invariant is enforced only by a prose comment (which can rot or be silently deleted), there is no way to inject a raw `{ ok: false }` response (making autoRetry's retry path fundamentally untestable), and the auto-retry interop spec does not document this limitation or its resolution. All three are fixable in one coordinated change.

## What Changes

- **`TerminalTransformer` type** — a new internal type in `src/low-level/transformer.ts` that omits `_previous` from its signature, making it structurally impossible to call the inner chain. `createTransformer` returns `TerminalTransformer` instead of `Transformer`.
- **`asTransformer` adapter** — a small adapter in `src/low-level/prepare-bot.ts` that converts `TerminalTransformer → Transformer` for `bot.api.config.use()`. The adapter is the single place where ignoring `_previous` is explicit and intentional.
- **4-line comment removed** from `createTransformer` — the type system now enforces what the comment described.
- **`respondNextRaw(method, rawResponse)`** — new method on `OutgoingRequests` that enqueues a one-shot override returning the given value verbatim (bypassing the `ok()` wrapper). Enables injection of `{ ok: false, error_code: 429, parameters: { retry_after: 1 } }` so autoRetry's retry loop can be exercised in tests.
- **Auto-retry spec updated** — documents that retry-on-429 behavior is now testable via `respondNextRaw`, and adds a scenario covering the retry path.

## Capabilities

### New Capabilities

_(none — all changes are requirement updates to existing capabilities)_

### Modified Capabilities

- `mock-transformer-terminal-intent`: requirement changes from "inline comment on `_previous`" to "TerminalTransformer type + asTransformer adapter make the invariant machine-checked."
- `outgoing-requests-capture`: new requirement — `respondNextRaw(method, rawResponse)` is added to the error simulation API, enabling raw not-ok response injection.
- `grammy-plugin-interop`: new requirement — autoRetry retry-on-429 behavior is testable via `respondNextRaw`; the limitation (untestable without it) is documented and resolved.

## Impact

- `src/low-level/transformer.ts` — new `TerminalTransformer` type, `createTransformer` return type changed (internal only, not exported)
- `src/low-level/prepare-bot.ts` — new `asTransformer` adapter wrapping the `createTransformer` result
- `src/low-level/outgoing-requests.ts` — new `respondNextRaw` method + `respond-raw` variant in `OneShotOverride`
- `tests/plugins/auto-retry.spec.ts` — new test covering retry-on-429 via `respondNextRaw`
- No public API changes; no breaking changes; no new dependencies
