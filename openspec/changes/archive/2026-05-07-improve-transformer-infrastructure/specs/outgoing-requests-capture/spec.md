## ADDED Requirements

### Requirement: `respondNextRaw` injects a verbatim raw response for the next matching call

`OutgoingRequests` SHALL expose a `respondNextRaw(method, rawResponse)` method that enqueues a one-shot override causing the next call to that method to return `rawResponse` exactly as supplied, without wrapping it in `{ ok: true, result }`. This enables injection of `{ ok: false }` responses — including rate-limit shapes with `parameters.retry_after` — that outer transformers such as `@grammyjs/auto-retry` can observe and act on. After the one-shot is consumed the method reverts to normal resolution (canned response or default).

#### Scenario: respondNextRaw returns a not-ok response verbatim

- **WHEN** the test calls `chats.outgoing.respondNextRaw('sendMessage', { ok: false, error_code: 429, description: 'Too Many Requests: retry after 1', parameters: { retry_after: 1 } })`
- **AND** an outer transformer (e.g. autoRetry) makes a `sendMessage` call
- **THEN** the transformer receives `{ ok: false, error_code: 429, ... }` as the raw response
- **AND** the second `sendMessage` call (the retry) resolves with the normal synthetic response

#### Scenario: respondNextRaw is one-shot — subsequent calls resolve normally

- **WHEN** the test calls `respondNextRaw('sendMessage', { ok: false, error_code: 429, ... })`
- **AND** the bot makes two `sendMessage` calls
- **THEN** the first call returns the raw not-ok response
- **AND** the second call resolves with `{ ok: true, result: ... }` as usual

#### Scenario: respondNextRaw with an ok:true value behaves like respondNext

- **WHEN** the test calls `respondNextRaw('getChat', { ok: true, result: { id: 42, type: 'private' } })`
- **AND** the bot calls `ctx.api.getChat(123)`
- **THEN** the resolved raw return value equals `{ ok: true, result: { id: 42, type: 'private' } }`
