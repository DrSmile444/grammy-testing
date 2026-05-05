## MODIFIED Requirements

### Requirement: `OutgoingRequests` exposes a documented inspection surface

The collector SHALL expose: `requests` (readonly getter over a private array), `length` (getter), `push(request)`, `clear()`, `getMethods()` (returns `string[]` of method names in capture order), `buildMethods<T>(methods)` (returns the input array typed as `T[]` for typed-tuple comparisons), `getFirst()`, `getLast()`, `getTwoLast()`, `getThreeLast()`, and `getAll<T1,T2,...>()` overloads up to **ten** type arguments returning a typed `Partial<[Request<T1>, ...]>`.

The ten-overload cap on `getAll()` is **intentional**. Tests that need to inspect more than ten captures in a single destructure SHALL split into multiple assertion blocks (e.g., call `clear()` between phases, or use `getMethods()` for ordering checks and individual `getFirst()`/`getLast()` for payload checks). Manual overloads are preferred over variadic TypeScript generics here because they produce cleaner IDE completions and error messages at the cost of a fixed upper bound, which is acceptable for a testing library.

The `requests` field SHALL be read-only externally: consumers may read `chats.outgoing.requests` and iterate it, but SHALL NOT reassign the field or hold a mutable alias that bypasses `push()`/`clear()`.

`clear()` SHALL truncate the underlying array in-place (`length = 0`) so that any external reference to the array observes the empty state after the call.

#### Scenario: getMethods reports captured methods in order

- **WHEN** the bot makes calls in order `getChat`, `sendMessage`, `deleteMessage`
- **THEN** `chats.outgoing.getMethods()` equals `["getChat", "sendMessage", "deleteMessage"]`

#### Scenario: clear empties the collector in-place

- **WHEN** the test calls `chats.outgoing.clear()` after captures exist
- **THEN** `chats.outgoing.requests.length` equals `0`
- **AND** any reference to the array captured before `clear()` also sees zero elements

#### Scenario: getLast returns the most recent request

- **WHEN** the bot has captured `getChat` then `sendMessage`
- **THEN** `chats.outgoing.getLast()` returns an object with `method === "sendMessage"`

#### Scenario: getAll supports up to ten typed type arguments

- **WHEN** the test destructures `const [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10] = outgoing.getAll<'getChat', 'sendMessage', 'deleteMessage', 'sendPhoto', 'sendDocument', 'sendVideo', 'sendAudio', 'pinMessage', 'getMe', 'forwardMessage'>()`
- **THEN** the TypeScript compiler resolves the tuple without error
- **AND** each `ri?.method` is correctly typed as the corresponding method name

#### Scenario: requests field is read-only

- **WHEN** TypeScript code attempts to write `chats.outgoing.requests = []`
- **THEN** the TypeScript compiler emits a type error
