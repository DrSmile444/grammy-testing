## ADDED Requirements

### Requirement: `OutgoingRequests` captures every grammY API call

The system SHALL provide an `OutgoingRequests` collector, accessible as `chats.outgoing`, that records every outgoing call made via `bot.api.*` and `ctx.api.*` and via grammY context helpers (`ctx.reply`, `ctx.replyWithPhoto`, etc.). Each captured entry SHALL include the API `method` name, the `payload` argument, and any `signal` passed by the caller.

#### Scenario: Captures a direct ctx.reply call

- **WHEN** middleware executes `await ctx.reply("hello")`
- **THEN** `chats.outgoing.requests` contains an entry with `method === "sendMessage"` and `payload.text === "hello"`

#### Scenario: Captures a bot.api call

- **WHEN** test code executes `await bot.api.sendMessage(chatId, "hi")` after `prepareBot`
- **THEN** `chats.outgoing.requests` contains an entry with `method === "sendMessage"` and `payload.chat_id === chatId`

### Requirement: `OutgoingRequests` exposes a documented inspection surface

The collector SHALL expose: `requests` (the array), `length` (getter), `push(request)`, `clear()`, `getMethods()` (returns `string[]` of method names in capture order), `buildMethods<T>(methods)` (returns the input array typed as `T[]` for typed-tuple comparisons), `getFirst()`, `getLast()`, `getTwoLast()`, `getThreeLast()`, and `getAll<T1,T2,...>()` overloads up to six type arguments returning a typed `Partial<[Request<T1>, ...]>`.

#### Scenario: getMethods reports captured methods in order

- **WHEN** the bot makes calls in order `getChat`, `sendMessage`, `deleteMessage`
- **THEN** `chats.outgoing.getMethods()` equals `["getChat", "sendMessage", "deleteMessage"]`

#### Scenario: clear empties the collector

- **WHEN** the test calls `chats.outgoing.clear()` after captures exist
- **THEN** `chats.outgoing.requests.length` equals `0`

#### Scenario: getLast returns the most recent request

- **WHEN** the bot has captured `getChat` then `sendMessage`
- **THEN** `chats.outgoing.getLast()` returns an object with `method === "sendMessage"`

### Requirement: Canned responses accept static values OR functions

The system SHALL accept a `responses` map in the entry-point options, where each key is a grammY API method name and each value is either (a) a static response value or (b) a function `(payload, method) => result`. When the bot under test calls a method present in the map, the transformer SHALL return the corresponding result without leaving the test process. When the value is a function, the transformer SHALL invoke it with the call's `payload` and `method` and return the function's return value (or its awaited value if a promise is returned).

#### Scenario: Static response is returned verbatim

- **WHEN** the test passes `{ responses: { getChat: { id: 1, type: "supergroup", title: "X" } } }`
- **AND** the bot calls `ctx.api.getChat(1)`
- **THEN** the call resolves with `{ id: 1, type: "supergroup", title: "X" }`

#### Scenario: Function response receives payload and dispatches dynamically

- **WHEN** the test passes `{ responses: { getChatMember: ({ user_id }) => ({ status: "member", user: usersById[user_id] }) } }`
- **AND** the bot calls `ctx.api.getChatMember(chatId, 7)`
- **THEN** the function is invoked with `payload.user_id === 7`
- **AND** the call resolves with the function's return value

#### Scenario: Default fallback when no canned response is configured

- **WHEN** the bot calls a method with no entry in the `responses` map
- **THEN** the transformer resolves the call with a generic success shape
- **AND** the call is still recorded in `chats.outgoing.requests`

### Requirement: Error simulation API forces specific calls to fail

The collector SHALL expose `failNext(method, errorOrSpec)`, `failAll(method, errorOrSpec)`, `respondNext(method, payload)`, and `clearOverrides()`. `failNext` SHALL cause the next call to that method to reject; subsequent calls revert to normal behavior. `failAll` SHALL cause every subsequent call to that method to reject until cleared. `respondNext` SHALL cause the next call to that method to resolve with the given payload, then revert. `clearOverrides` SHALL remove all per-method overrides.

#### Scenario: failNext rejects only the next call

- **WHEN** the test calls `chats.outgoing.failNext("sendMessage", new GrammyError("Forbidden", { ok: false, error_code: 403, description: "Forbidden" }, "sendMessage", {}))`
- **AND** the bot makes two `sendMessage` calls
- **THEN** the first call rejects with the supplied `GrammyError`
- **AND** the second call resolves normally

#### Scenario: failNext accepts a sugar spec and constructs GrammyError

- **WHEN** the test calls `chats.outgoing.failNext("sendMessage", { code: 403, description: "Forbidden: bot was blocked by the user" })`
- **AND** the bot makes a `sendMessage` call
- **THEN** the call rejects with a `GrammyError` whose `error_code` is `403` and whose `description` matches the supplied string

#### Scenario: failAll rejects every matching call until cleared

- **WHEN** the test calls `chats.outgoing.failAll("sendMessage", { code: 429, description: "Too Many Requests" })`
- **AND** the bot makes three `sendMessage` calls
- **THEN** all three calls reject
- **AND** after `clearOverrides()` the next `sendMessage` call resolves normally

#### Scenario: respondNext returns a custom payload once

- **WHEN** the test calls `chats.outgoing.respondNext("getChat", { id: 99, type: "channel", title: "Override" })`
- **AND** the bot makes two `getChat` calls
- **THEN** the first call resolves with the override payload
- **AND** the second call resolves with the configured canned response or the default

### Requirement: Transformer-promise tracking underlies `chats.idle()`

The transformer SHALL track every promise it returns to grammY. The set of unsettled tracked promises SHALL be drained by `chats.idle()`. Tracked promises SHALL be removed from the set on both fulfillment and rejection so that `idle()` is robust against bot error paths.

#### Scenario: Rejected API call still allows idle to resolve

- **WHEN** the test configures `failNext("sendMessage", ...)` and the bot calls `ctx.api.sendMessage(...).catch(...)` without awaiting
- **AND** the test does `await bot.handleUpdate(update)` and `await chats.idle()`
- **THEN** `chats.idle()` resolves
- **AND** the rejected call appears in `chats.outgoing.requests`
