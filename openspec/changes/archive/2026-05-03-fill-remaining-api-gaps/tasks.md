## 1. TODO.md — mark already-implemented items resolved

- [x] 1.1 Mark TODO #19 resolved: `user.joinChat(chat)` dispatches `new_chat_members`; `user.leaveChat(chat)` dispatches `left_chat_member`; both update membership state
- [x] 1.2 Mark TODO #20 resolved: `user.editMessage(messageId, text, { chat? })` dispatches an `edited_message` update
- [x] 1.3 Mark TODO #21 resolved: `channel.postMessageTo(target, text, { messageId? })` dispatches a `message` update with `sender_chat = channel`
- [x] 1.4 Mark TODO #23 resolved: full media verb suite (`sendPhoto`, `sendDocument`, `sendVideo`, `sendAudio`, `sendVoice`, `sendVideoNote`, `sendAnimation`, `sendSticker`, `sendMediaGroup`) available on `User`
- [x] 1.5 Mark TODO #25 resolved: `SendTextOptions.reply_to_message?: Message` and `reply_parameters?` already present; pass a raw `Message` shape to simulate any reply-to context
- [x] 1.6 Move all five entries into the `## Resolved` section of TODO.md

## 2. ChatProfile — factory ID override (#24)

- [x] 2.1 Add `export interface ChatProfile { id?: number; title?: string; }` to `src/high-level/chats.ts`
- [x] 2.2 Add shared internal helper `resolveChatProfile(profile, nextId, defaultTitle)` that normalises `string | ChatProfile | undefined` into `{ id: number; title: string }`; default title when id supplied: `TypeName + Math.abs(id)` (passed in via `defaultTitle`)
- [x] 2.3 Update `newGroup` signature to `newGroup(profile?: string | ChatProfile): Group<TContext>` and apply the helper
- [x] 2.4 Update `newSupergroup` signature to `newSupergroup(profile?: string | ChatProfile): Supergroup<TContext>` and apply the helper
- [x] 2.5 Update `newChannel` signature to `newChannel(profile?: string | ChatProfile): Channel<TContext>` and apply the helper
- [x] 2.6 Export `ChatProfile` from `src/index.ts`

## 3. GROUP_ANONYMOUS_BOT constant and anonymous dispatch (#22a)

- [x] 3.1 Define `export const GROUP_ANONYMOUS_BOT = { id: 1_087_968_824, is_bot: false, first_name: 'Group', username: 'GroupAnonymousBot' } as const` in `src/high-level/user.ts` (correct Telegram ID; 136_817_688 is Channel_Bot)
- [x] 3.2 Add `anonymous?: boolean` to `SendTextOptions` in `src/high-level/user.ts`
- [x] 3.3 In `sendText` dispatch logic: when `options.anonymous === true`, validate `options.chat` is `Group | Supergroup` (throw descriptive error if absent or wrong type), then set `message.from = GROUP_ANONYMOUS_BOT` and `message.sender_chat = options.chat.toTelegramChat()`
- [x] 3.4 Add `anonymous?: boolean` to `sendCommand` options type and thread it through to `sendText`
- [x] 3.5 Export `GROUP_ANONYMOUS_BOT` from `src/index.ts`

## 4. sendSystemMessage on Group, Supergroup, Channel (#22b)

- [x] 4.1 Define `export interface SendSystemMessageOptions { messageId?: number; }` — place in `src/high-level/types.ts` (or inline in the first file and re-export)
- [x] 4.2 Implement `sendSystemMessage(text: string, options?: SendSystemMessageOptions): Promise<void>` on `Group`: construct message with `from` absent (`as Message` cast), dispatch via `bot.handleUpdate`
- [x] 4.3 Implement the same method on `Supergroup` (identical body)
- [x] 4.4 Implement the same method on `Channel` (identical body; use `channel.toTelegramChat()` for `message.chat`)
- [x] 4.5 Export `SendSystemMessageOptions` from `src/index.ts`

## 5. Tests

- [x] 5.1 Test `newSupergroup({ id, title })` → correct `id` and `title`
- [x] 5.2 Test `newSupergroup({ id })` without title → title defaults to `Supergroup<abs(id)>`
- [x] 5.3 Test `newGroup({ id, title })` and `newChannel({ id, title })` — same assertions
- [x] 5.4 Test string form `newSupergroup('name')` and no-arg `newSupergroup()` still work
- [x] 5.5 Test `getChatAdministrators` / `getChat` auto-derivation works for a specific-ID chat
- [x] 5.6 Test `sendText` with `anonymous: true` → `message.from.id === 1_087_968_824`, `message.sender_chat.id === group.id`
- [x] 5.7 Test `sendCommand` with `anonymous: true` → same from/sender_chat shape, bot_command entity still present
- [x] 5.8 Test `sendText` with `anonymous: true` and no `chat` → throws
- [x] 5.9 Test `sendText` with `anonymous: true` and `chat: channel` → throws
- [x] 5.10 Test `sendText` without `anonymous` → `message.from.id === user.id`, no `sender_chat`
- [x] 5.11 Test `group.sendSystemMessage('text')` → handler sees `message.from === undefined`, `message.text === 'text'`
- [x] 5.12 Test `channel.sendSystemMessage('text')` → same assertions
- [x] 5.13 Test `options.messageId` is reflected in the dispatched update's `message.message_id`

## 6. Changelog and version bump

- [x] 6.1 Add changelog entry for v0.14.0 covering: `ChatProfile` overload on chat factories, `anonymous` option on `sendText`/`sendCommand`, `GROUP_ANONYMOUS_BOT` export, `sendSystemMessage` on Group/Supergroup/Channel
- [x] 6.2 Bump version in `package.json` to `0.14.0`

## 7. TODO.md — mark new items resolved

- [x] 7.1 Mark TODO #22a resolved: `sendText` / `sendCommand` with `anonymous: true` sets from to GroupAnonymousBot and sender_chat to the target group
- [x] 7.2 Mark TODO #22b resolved: `group.sendSystemMessage(text)` / `supergroup.sendSystemMessage(text)` / `channel.sendSystemMessage(text)` dispatches message with `from` absent
- [x] 7.3 Mark TODO #24 resolved: `newGroup/newSupergroup/newChannel` accept `{ id?, title? }` object profile; any integer id accepted
- [x] 7.4 Move all three entries into the `## Resolved` section of TODO.md
