## Context

grammy's `Update` type has 7 update fields that the framework doesn't dispatch yet: `message_reaction`, `poll_answer`, `chat_join_request`, `chat_member`, `edited_channel_post`, `chat_boost`, `removed_chat_boost`. All existing verbs follow the same pattern: synthesize a type-correct `Update` object, call `bot.handleUpdate(update)`, await settlement. This change adds 7 new verbs following the same pattern.

## Goals / Non-Goals

**Goals:**

- Add dispatch verbs for all Tier 1 and Tier 2 update types
- Keep the same conventions: verb on the actor closest to the action, `options?` bag for overrides, `await` resolves after middleware settles
- Document intentional Business API exclusion in README

**Non-Goals:**

- Business API update types (`business_connection`, `business_message`, `edited_business_message`, `deleted_business_messages`, `managed_bot`) — excluded by design
- `message_reaction_count` and `poll` (autonomous) — Telegram-server-originated, no natural user actor
- `purchased_paid_media` — deferred

## Decisions

### `user.reactTo(reply, reaction)` → `message_reaction`

```
update.message_reaction = {
  chat: reply.chat.toTelegramChat(),
  message_id: reply.messageId,
  user: { id, is_bot: false, first_name, ... },
  date: now,
  old_reaction: [],
  new_reaction: [reaction]  // ReactionType
}
```

`reaction` accepts either a `ReactionType` object OR a plain emoji string (auto-wrapped as `{ type: 'emoji', emoji }`). This matches how grammY users actually write bot handlers.

### `user.answerPoll(reply, optionIndices)` → `poll_answer`

The `reply` must be a captured `Reply` containing a poll (`reply.raw.poll`). The `poll_id` is extracted from `reply.raw.poll.id`.

```
update.poll_answer = {
  poll_id: reply.raw.poll.id,
  user: { id, is_bot: false, first_name, ... },
  option_ids: optionIndices
}
```

Throws clearly if `reply.raw.poll` is absent (not a poll reply).

### `user.requestJoin(group)` → `chat_join_request`

```
update.chat_join_request = {
  chat: group.toTelegramChat(),
  from: { id, is_bot: false, first_name, ... },
  user_chat_id: user.id,
  date: now
}
```

Available on `Group` and `Supergroup` only (not `Channel`, not `PrivateChat`).

### `group.dispatchMemberUpdate(fromAdmin, targetUser, newStatus, options?)` → `chat_member`

`chat_member` is what the bot observes when an admin changes another user's status. The `old_chat_member` defaults to `{ status: 'member' }` and can be overridden via `options.oldStatus`.

```
update.chat_member = {
  chat: group.toTelegramChat(),
  from: { id: fromAdmin.id, ... },
  date: now,
  old_chat_member: makeChatMember(targetUser, options.oldStatus ?? 'member', {}),
  new_chat_member: makeChatMember(targetUser, newStatus, options.permissions ?? {})
}
```

Lives on `Group` and `Supergroup` (same types that already have `promote`/`ban`). Uses the existing `makeChatMember` helper from `dispatch.ts`.

### `channel.editPost(messageId, newText, options?)` → `edited_channel_post`

Mirrors how `dispatchEditedMessage` works but for channel posts.

```
update.edited_channel_post = {
  message_id: messageId,
  chat: channel.toTelegramChat(),
  text: newText,
  date: now,
  edit_date: now
}
```

### `user.boostChat(chat)` → `chat_boost`

```
update.chat_boost = {
  chat: chat.toTelegramChat(),
  boost: {
    boost_id: generated-id,
    add_date: now,
    expiration_date: now + 30 days,
    source: { source: 'premium', user: { id, ... } }
  }
}
```

Returns the `boost_id` string so the caller can pass it to `removeBoost`.

### `user.removeBoost(chat, boostId)` → `removed_chat_boost`

```
update.removed_chat_boost = {
  chat: chat.toTelegramChat(),
  boost_id: boostId,
  remove_date: now,
  source: { source: 'premium', user: { id, ... } }
}
```

### Business API — intentional exclusion

Add a section to `README.md` under a "Scope" or "Not covered" heading explicitly naming the excluded update types and the reason (requires verified Telegram Business account; not part of the standard bot API test surface).

## Risks / Trade-offs

- **`chat_member` vs `my_chat_member`**: easy to confuse. JSDoc on `dispatchMemberUpdate` should explicitly contrast it with the existing `promote`/`ban` verbs.
- **`poll_answer` requires accessing `reply.raw.poll.id`**: If the bot's canned response for `sendPoll` doesn't return a real `poll` object, the ID will be missing. The test must either rely on the default canned response including a poll shape or use `responses: { sendPoll: ... }` to provide one. This should be documented in the method's JSDoc.
- **`boostChat` returns a `boostId`** — this changes the return type of a `User` verb from `Promise<void>` to `Promise<string>`. Consistent with the goal of making the API ergonomic; the caller needs the ID to remove the boost.
