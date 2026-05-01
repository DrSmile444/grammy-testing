## 1. DeletionsLog — new file

- [x] 1.1 Create `src/high-level/deletions-log.ts` with `Deletion<TContext>` interface (`messageId`, `reply`, `raw`) and `DeletionsLog<TContext>` class (`push`, `last`, `lastOrThrow`, `all`, `length`, `clear`)

## 2. DeletionsLog — wire into Chats

- [x] 2.1 Add `DELETE_METHODS_GUARD = { deleteMessage: true }` and `DELETE_METHODS` set to `src/high-level/chats.ts`
- [x] 2.2 Add `chatDeletions: Map<number, DeletionsLog<TContext>>` field to `Chats`
- [x] 2.3 Initialize a `DeletionsLog` entry in `chatDeletions` inside `registerChat()` (covers groups, supergroups, channels)
- [x] 2.4 Initialize a `DeletionsLog` entry in `chatDeletions` inside `privateChatFor()` (covers DMs)
- [x] 2.5 Add `deriveDelete(payload)` private method: reads `chat_id` and `message_id`, looks up chat via `findChatByTelegramId`, resolves `reply` via `messageIdToReply`, pushes `Deletion` to `chatDeletions`
- [x] 2.6 Call `deriveDelete` from `deriveFromCapture` when `DELETE_METHODS.has(request.method)`
- [x] 2.7 Add `deletionsFor(chat: AnyChat<TContext>): DeletionsLog<TContext>` public method (throws for unregistered chat, same pattern as `editsFor`)

## 3. copyMessage / forwardMessage — full treatment

- [x] 3.1 Add `copyMessage` and `forwardMessage` to `MESSAGE_METHODS_GUARD` in `src/high-level/chats.ts`
- [x] 3.2 Add a `copyMessage` resolver to `buildDefaultResponses()` returning `{ message_id: this.lastCapturedReply?.messageId }` (no `date` field)
- [x] 3.3 Add a `forwardMessage` resolver to `buildDefaultResponses()` reusing the existing `syntheticMessage` pattern

## 4. Exports

- [x] 4.1 Export `Deletion` type and `DeletionsLog` class from `src/high-level/chats.ts` (or via `src/index.ts` / `src/low-level.ts` — follow the existing export pattern for `Edit` and `EditsLog`)

## 5. Tests

- [x] 5.1 Write tests for `chats.deletionsFor(group)`: single deletion, multiple deletions, `reply` back-reference populated, `reply` undefined for unknown ID
- [x] 5.2 Write test for `chats.deletionsFor(privateChat)`: deletion in a DM
- [x] 5.3 Write test for `chats.deletionsFor(unknownChat)` throwing
- [x] 5.4 Write tests for `copyMessage` default response: `message_id` equals `chat.messages.last.messageId`, no `date` field, user-override takes precedence
- [x] 5.5 Write test for `copyMessage` follow-up edit: bot reads `copy.message_id`, calls `editMessageText`, `chats.editsFor(user)` captures it
- [x] 5.6 Write tests for `forwardMessage` default response: `message_id` and `date` present, appears in `chat.messages` and `user.replies`
- [x] 5.7 Write test for `forwardMessage` — `reply.text` is `undefined` (hollow Reply)

## 6. Documentation

- [x] 6.1 Add resolved entries to `TODO.md` for items #11 and #12
- [x] 6.2 Bump version in `package.json` (patch or minor depending on project convention)
