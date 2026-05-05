## 1. reply.replyMarkup accessor

- [x] 1.1 Add `readonly replyMarkup: Record<string, unknown> | undefined` field to `Reply` class in `src/high-level/reply.ts`
- [x] 1.2 Set it in the constructor: `this.replyMarkup = rawPayload.reply_markup as Record<string, unknown> | undefined`

## 2. reply.replyingTo wiring

- [x] 2.1 Add `resolveReply: (messageId: number) => Reply<TContext> | undefined` to the `ReplyDeps` interface in `src/high-level/reply.ts`
- [x] 2.2 Add `readonly replyingTo: Reply<TContext> | undefined` field to `Reply` class
- [x] 2.3 Set it in the constructor: `this.replyingTo = this.replyToMessageId !== undefined ? deps.resolveReply(this.replyToMessageId) : undefined`
- [x] 2.4 Add `private messageIdToReply = new Map<number, Reply<TContext>>()` to `Chats` in `src/high-level/chats.ts`
- [x] 2.5 Pass `resolveReply: (id) => this.messageIdToReply.get(id)` into the `ReplyDeps` object inside `deriveFromCapture`
- [x] 2.6 Register each reply after construction in `deriveFromCapture`: `this.messageIdToReply.set(reply.messageId, reply)`

## 3. Exports

- [x] 3.1 No new public types to export — `replyMarkup` and `replyingTo` are fields on the existing exported `Reply` class

## 4. Tests

- [x] 4.1 Create `tests/reference/reply-accessors.spec.ts` covering:
  - `replyMarkup` is non-null when bot sends a reply with an inline keyboard
  - `replyMarkup` is `undefined` for a plain text reply
  - `replyingTo` resolves to the earlier `Reply` when the bot replies to one of its own captured messages
  - `replyingTo` is `undefined` when the bot replies to an incoming user message

## 5. Quality gate

- [x] 5.1 Run `npm run typecheck` — passes
- [x] 5.2 Run `npm run lint` — passes
- [x] 5.3 Run `npm run test:run` — passes
- [x] 5.4 Run `npm run test:coverage` — passes at 80%+

## 6. Versioning

- [x] 6.1 Bump `version` in `package.json` from `0.4.0` to `0.4.1` (patch — fills missing accessors on existing public API)
