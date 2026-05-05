# Low-Level API

The low-level layer gives you direct access to the machinery underneath the high-level actors.
Import it from the `@grammyjs/testing/low-level` subpath.

## When to use it

Use the low-level layer when you need to:

- **Inspect raw API payloads** — `chats.outgoing.requests[n].payload`
- **Simulate API errors** — `failNext('sendMessage', { code: 403 })`
- **Provide canned responses** — `respondNext('getChat', { ... })`
- **Build unusual update shapes** — `new GenericMockUpdate({ ... }).build()`
- **Mock session or state** — `mockSession({ count: 0 })`
- **Test a composer or middleware in isolation** — `prepareComposer`, `prepareMiddleware`

Most tests don't need any of this — the high-level actors cover the common cases.

## Subpath export

The low-level update builders are only available from the `/low-level` subpath:

```ts
import { GenericMockUpdate, MessageMockUpdate } from '@grammyjs/testing/low-level';
```

Everything else (prepare functions, OutgoingRequests, mock\* helpers) is available from the main
entry point:

```ts
import { prepareBot, OutgoingRequests, mockSession } from '@grammyjs/testing';
```

## What's in this section

| Page                                              | What it covers                                                    |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| [Outgoing Requests](/low-level/outgoing-requests) | Capture store, typed accessors, error / response simulation       |
| [Session Mocking](/low-level/session-mocking)     | `mockSession`, `mockChatSession`, `mockState`, `mockContextField` |
| [Update Builders](/low-level/update-builders)     | Raw update construction for edge cases                            |
| [Response Mocking](/low-level/response-mocking)   | Canned responses via `prepareBot` options                         |
