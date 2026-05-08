## Context

The library's mock transformer (`createTransformer`) is intentionally terminal — it intercepts every API call and returns a synthetic response without forwarding to the real Telegram API. This invariant is currently enforced only by a 4-line prose comment on the `_previous` parameter. The comment can be deleted or ignored; it cannot be verified by the compiler.

Separately, the `OutgoingRequests` error simulation API (`failNext`, `failAll`, `respondNext`) always produces either a thrown `GrammyError` or a `{ ok: true }` wrapped response. There is no path to return a raw `{ ok: false }` response, which is the signal autoRetry (and similar transformers) use to decide whether to retry. This makes autoRetry's retry-on-429 path structurally untestable.

## Goals / Non-Goals

**Goals:**

- Replace the prose comment with a type-level invariant that the compiler enforces
- Add `respondNextRaw` to `OutgoingRequests` so raw not-ok responses can be injected
- Add an auto-retry retry-on-429 test using `respondNextRaw`
- Zero public API breaking changes

**Non-Goals:**

- Changing `Transformer` semantics in grammY itself
- Adding `respondNextRaw` sticky (failAll-style) variant — one-shot is sufficient for retry testing; sticky can be added later if needed
- Supporting raw not-ok responses for non-one-shot paths

## Decisions

### D1 — `TerminalTransformer` type + `asTransformer` adapter instead of a comment

`createTransformer` returns a `TerminalTransformer` — an internal type whose signature omits `_previous` entirely:

```ts
type TerminalTransformer = (method: Methods, payload: Payload<Methods>, signal?: AbortSignal) => Promise<OkReturn>;
```

`prepare-bot.ts` converts it for grammY via `asTransformer`:

```ts
function asTransformer(t: TerminalTransformer): Transformer {
  return ((_prev, method, payload, signal) => t(method, payload, signal)) as Transformer;
}

bot.api.config.use(asTransformer(createTransformer({...})));
```

The adapter is the single, explicit location where `_previous` is structurally discarded. No comment required — the type says it.

**Alternative considered — keep the comment, shorten to one line**: Simpler, but prose can be deleted without a compiler error. The 8-line type approach is a permanent machine-checked invariant. Preferred for a library entering formal ecosystem adoption.

**Alternative considered — private field access to prepend**: Accessing grammY internals to `unshift` the library transformer before user transformers. Rejected in the original fix (PR #6) for fragility; same reasoning applies here.

### D2 — `respondNextRaw` as a one-shot override returning the value verbatim

Add `{ kind: 'respond-raw'; response: unknown }` to `OneShotOverride` and a corresponding `respondNextRaw(method, response)` method. In `resolveCall`, the `respond-raw` branch returns `oneShot.response as OkReturn` — no `ok()` wrapping.

This is the minimal, most general primitive. Callers supply the full raw response shape; the library does not interpret it.

```ts
chats.outgoing.respondNextRaw('sendMessage', {
  ok: false,
  error_code: 429,
  description: 'Too Many Requests: retry after 1',
  parameters: { retry_after: 1 },
});
```

**Alternative considered — `failNextRetryable(method, retryAfterSeconds)` high-level API**: Ergonomic but couples the library to autoRetry's internal response contract. Any other transformer reading raw not-ok responses would need its own API. Rejected in favour of the general primitive.

**Alternative considered — sticky `respondAllRaw`**: Not needed for the autoRetry retry test (one retry = one not-ok response, then normal). Omitted to keep the API surface minimal.

## Risks / Trade-offs

- **`asTransformer` cast `as Transformer`**: The cast is unavoidable because grammY's `Transformer` type includes `_previous`. The cast is confined to one function in `prepare-bot.ts` — same file that already manages the reinstall pattern.
- **`respond-raw` misuse**: A caller who passes `{ ok: true, result: X }` to `respondNextRaw` gets identical behaviour to `respondNext(method, X)` — harmless redundancy, not a correctness risk.
- **autoRetry retry test timing**: autoRetry uses `setTimeout` for the retry delay. The test will need `retryAfter: 0` (or equivalent) to avoid real wall-clock delays in CI.

## Open Questions

_(none — design is complete)_
