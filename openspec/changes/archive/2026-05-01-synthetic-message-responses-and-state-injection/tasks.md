## 1. TODO Housekeeping

- [x] 1.1 Move TODO item #7 (`sendCommand` shorthand) to the Resolved section in `TODO.md`
- [x] 1.2 Move TODO item #10 (`getMethods()` type safety) to the Resolved section in `TODO.md`

## 2. Synthetic Message Responses — `Chats` Layer

- [x] 2.1 Add `private lastCapturedReply: Reply<TContext> | undefined` field to `Chats`
- [x] 2.2 Set `this.lastCapturedReply = reply` at the end of the message-method branch in `Chats.deriveFromCapture`
- [x] 2.3 Add `buildDefaultResponses(): Responses` method to `Chats` that returns a dynamic resolver for each method in `MESSAGE_METHODS`; each resolver reads `this.lastCapturedReply?.messageId` and returns `{ message_id, date }`; `sendMediaGroup` resolver returns `[{ message_id, date }]`; if `lastCapturedReply` is `undefined`, resolver returns `true`

## 3. Synthetic Message Responses — Prepare Functions

- [x] 3.1 In `prepare-bot.ts`, call `chats.buildDefaultResponses()` before creating the transformer; merge with user options: `{ ...chats.buildDefaultResponses(), ...options.responses }`; pass merged map to `createTransformer`

## 4. State Injection

- [x] 4.1 Add `state?: TContext extends { state: infer TState } ? Partial<TState> : never` field to `PrepareWithConstructorOptions` in `prepare-composer.ts`
- [x] 4.2 In `prepareComposer`, if `options.state` is present, call `mockState(options.state)` and insert `bot.use(mockStateMiddleware)` before `bot.use(composer)`
- [x] 4.3 In `prepareMiddleware`, if `options.state` is present, call `mockState(options.state)` and insert `bot.use(mockStateMiddleware)` before `bot.use(middleware)`

## 5. Tests

- [x] 5.1 Write a test: bot calls `ctx.reply()`, reads `sent.message_id`, calls `editMessageText(chatId, sent.message_id, ...)`, assert `chats.editsFor(user).lastOrThrow().text` is correct
- [x] 5.2 Write a test: user-supplied `responses.sendMessage` overrides the synthetic default
- [x] 5.3 Write a test: `sendMediaGroup` default response is a single-element `Message[]` with the correct `message_id`
- [x] 5.4 Write a test: `prepareComposer` with `state` option — composer reads `ctx.state` field correctly
- [x] 5.5 Write a test: `prepareMiddleware` with `state` option — middleware reads `ctx.state` field correctly
- [x] 5.6 Verify that existing tests still pass (no regressions from the new default Message response); update any test asserting `result === true` on message-method captures

## 6. Verification

- [x] 6.1 Run `npm run typecheck` and fix any type errors
- [x] 6.2 Run `npm test` and confirm all tests pass
- [x] 6.3 Run `npm run lint` and fix any lint violations
