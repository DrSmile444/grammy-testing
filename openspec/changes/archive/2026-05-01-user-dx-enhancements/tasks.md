## 1. RepliesInbox.lastOrThrow()

- [x] 1.1 Add `lastOrThrow()` method to `RepliesInbox` in `src/high-level/chats.ts` — returns `Reply<TContext>`, throws `"Expected a reply but the reply collection is empty"` when empty
- [x] 1.2 Write tests for `lastOrThrow()`: non-empty inbox returns last reply; empty inbox throws with the expected message

## 2. user.replies shorthand

- [x] 2.1 Add `replies: RepliesInbox<TContext>` to the `UserDeps` interface in `src/high-level/user.ts`
- [x] 2.2 Store the inbox as `this.deps.replies` and expose it via a `get replies()` getter on `User`
- [x] 2.3 In `Chats.newUser()`, create the `RepliesInbox` before constructing `User`, pass it into `UserDeps`, and use the same reference in `UserEntry`
- [x] 2.4 Write tests verifying `user.replies === chats.repliesFor(user)` and that `user.replies` reflects captures after minting

## 3. ActionsLog and chats.actionsFor(user)

- [x] 3.1 Create `ActionsLog<TContext>` class in `src/high-level/chats.ts` (or a dedicated `src/high-level/actions-log.ts`) — stores `string[]`, exposes `.all`, `.length`, `.last`
- [x] 3.2 Add `actions: ActionsLog<TContext>` to `UserEntry`
- [x] 3.3 Add `CHAT_ACTION_METHODS` guard in `src/high-level/chats.ts` covering `sendChatAction`
- [x] 3.4 Extend `deriveFromCapture` to handle `sendChatAction`: extract `action` string, route to matching user entries using `userReceivesReply` logic (pass `chat` resolved from `chat_id`)
- [x] 3.5 Add `actionsFor(user)` method to `Chats` — mirrors `repliesFor`, throws for unknown user
- [x] 3.6 Export `ActionsLog` from `src/index.ts`
- [x] 3.7 Write tests: private-chat typing capture; group-member capture; left-member not captured; unknown user throws

## 4. EditsLog and chats.editsFor(user)

- [x] 4.1 Define `Edit` interface: `{ text: string | undefined; editedMessageId: number; raw: Record<string, unknown> }`
- [x] 4.2 Create `EditsLog<TContext>` class — stores `Edit[]`, exposes `.all`, `.length`, `.last`, `.lastOrThrow()`
- [x] 4.3 Add `edits: EditsLog<TContext>` to `UserEntry`
- [x] 4.4 Add `EDIT_METHODS` guard in `src/high-level/chats.ts` covering `editMessageText`, `editMessageCaption`, `editMessageMedia`
- [x] 4.5 Extend `deriveFromCapture` to handle edit methods: look up `message_id` in `messageIdToReply`, derive chat from the found `Reply`, route to matching user entries; silently skip if message ID is unknown
- [x] 4.6 Add `editsFor(user)` method to `Chats` — mirrors `repliesFor`, throws for unknown user
- [x] 4.7 Export `Edit`, `EditsLog` from `src/index.ts`
- [x] 4.8 Write tests: edit captured with correct text and editedMessageId; multiple edits in order; unknown message ID silently skipped; empty log lastOrThrow throws; unknown user throws

## 5. Docs and housekeeping

- [x] 5.1 Add JSDoc to `ActionsLog`, `EditsLog`, `Edit`, and all new public methods
- [x] 5.2 Update `TODO.md` — mark items 2, 3, 4, 5 as resolved; keep item 1 (detached async) with its existing workaround note
