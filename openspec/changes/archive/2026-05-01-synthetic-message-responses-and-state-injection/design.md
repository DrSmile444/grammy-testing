## Context

grammy-testing intercepts Telegram API calls via a grammY transformer. For every outgoing call the transformer invokes two things in order:

1. `onCapture(request)` — a synchronous hook. In the high-level layer this calls `Chats.deriveFromCapture`, which creates a `Reply` object with a synthetic `messageId` and pushes it into the user's inbox.
2. `resolveCall(responses, method, payload)` — async. Returns either a user-supplied canned response or the fallback `{ ok: true, result: true }`.

The ordering guarantee is the foundation for synthetic responses: by the time `resolveCall` runs, the `Reply` is already in place with its `messageId` assigned.

State middleware (`ctx.state`) must run before bot handlers. In `prepareComposer` / `prepareMiddleware` the internal bot is empty at construction time so middleware can be prepended safely. In `prepareBot` the caller's bot is already configured — prepending is not possible without bot surgery.

## Goals / Non-Goals

**Goals:**

- Message-sending methods return a real `Message` (or `Message[]`) shape by default, using the captured Reply's `messageId`. Resolves silent breakage in any bot that reads `sent.message_id`.
- `prepareComposer` / `prepareMiddleware` accept a `state` option that pre-populates `ctx.state` for every update dispatched in the test.
- TODO items #7 and #10 are formally closed in the doc.

**Non-Goals:**

- State injection for `prepareBot` (bot handlers are registered before `prepareBot` is called; middleware cannot be prepended).
- Full synthetic `Message` shape (only `message_id` and `date` are guaranteed; `chat`, `from`, `text` etc. are omitted — bots that need them can supply a custom `responses` entry).
- Changing how the transformer resolves non-message methods.

## Decisions

### 1. Synthetic responses live in `Chats`, not the transformer

The transformer knows nothing about Replies or synthetic IDs. Putting the default-response logic in `Chats.buildDefaultResponses()` keeps that knowledge co-located with `deriveFromCapture` and `messageIdToReply`.

`Chats` exposes a new internal method:

```
buildDefaultResponses(): Responses
```

This returns dynamic resolver functions for every method in `MESSAGE_METHODS`. Each resolver reads `this.lastCapturedReply?.messageId` at call time (not at construction time), which is safe because `onCapture` fires before `resolveCall`.

`Chats` also gains a private `lastCapturedReply: Reply<TContext> | undefined` field that is set at the end of `deriveFromCapture` whenever a message-method Reply is created.

The prepare functions merge defaults with user-supplied responses: `{ ...chats.buildDefaultResponses(), ...options.responses }`. User entries always win.

**Alternative considered:** thread the synthetic ID back via an `onCapture` return value. Rejected — changes the transformer interface and adds indirection for a concern that belongs in `Chats`.

### 2. `sendMediaGroup` returns a single-element `Message[]`

`sendMediaGroup` is a bot-side API call that returns `Message[]`. When the bot calls it, `onCapture` fires once (for the single API call) and creates one `Reply`. The synthetic default response is `[{ message_id: reply.messageId, date: now }]`. This covers the common case (bots that read `sent[0].message_id`). Bots that need the full multi-element array can supply a custom `responses.sendMediaGroup` entry.

### 3. State injection only in `prepareComposer` / `prepareMiddleware`

Both functions construct an internal `Bot` instance, then call `bot.use(target)`, then call `prepareBot`. Injecting state middleware before `bot.use(target)` is trivially correct:

```
new Bot()
  bot.use(mockStateMiddleware)   ← injected by prepareComposer/prepareMiddleware
  bot.use(composer/middleware)   ← the unit under test
  prepareBot(bot, options)
```

`state` is added to `PrepareWithConstructorOptions` (not `PrepareOptions`) to make it clear this option is irrelevant for `prepareBot`. The type uses `TContext extends { state: infer TState } ? Partial<TState> : never` so TypeScript rejects the option when the context type has no `state`.

**Alternative considered:** add to `PrepareOptions` with a runtime warning when called from `prepareBot`. Rejected — a type-level constraint is cleaner and gives compile-time feedback.

### 4. Minimal synthetic `Message` shape

The synthetic response returns only `{ message_id, date }`. Adding `chat` would require resolving `chat_id` back to a full `Chat` object (possible but adds coupling). Adding `from` would require threading bot profile info into the response builder. These can be added incrementally; the footgun being fixed is `message_id === undefined`, which this resolves completely.

## Risks / Trade-offs

- **BREAKING: tests asserting `result === true` for message methods** → Any test that calls `outgoing.getLast()` and asserts on the raw result value will see `{ message_id: N, date: T }` instead of `true`. Tests using the high-level `user.replies` / `chats.editsFor` APIs are unaffected. Mitigation: document clearly in CHANGELOG and TODO Resolved sections; the affected pattern is unusual in well-written tests.

- **State injection scope is limited** → `prepareBot` users still need the manual `mockState` workaround. Mitigation: document in JSDoc on `PrepareOptions` and in the README.

- **`sendMediaGroup` single-element response** → A bot that reads `sent[1].message_id` will get `undefined`. Mitigation: document the limitation; custom `responses.sendMediaGroup` is the escape hatch.

## Migration Plan

1. Update `Chats`: add `lastCapturedReply` field, update `deriveFromCapture`, add `buildDefaultResponses()`.
2. Update `prepare-bot.ts`: merge `chats.buildDefaultResponses()` with `options.responses` before passing to `createTransformer`.
3. Update `prepare-composer.ts` and `prepare-middleware.ts`: add `state` to `PrepareWithConstructorOptions`, inject middleware when present.
4. Update `TODO.md`: move #7 and #10 to Resolved.
5. Update tests: any test asserting `result === true` on message-method captures needs updating.

No rollback concern — this is a library version bump; downstream projects pin versions.

## Open Questions

- Should the synthetic `Message` include `chat` (derived from `payload.chat_id` + `Chats.findChatByTelegramId`)? Adds value for bots that read `sent.chat.id`, low implementation cost, but increases coupling. Deferred to a follow-up.
- Should `prepareBot` detect a `state` option and emit a TypeScript error or runtime warning? Currently it would silently ignore it. A type-level `never` on `PrepareOptions.state` (if added) would make this a compile error. Leaving this to the implementor.
