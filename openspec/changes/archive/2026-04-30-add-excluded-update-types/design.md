## Context

The framework has dispatch verbs for all common Bot API update types as of v0.6.0. Eight update types remain undispatchable at the high-level API: five Business API updates (`business_connection`, `business_message`, `edited_business_message`, `deleted_business_messages`, `managed_bot`), one payment update (`purchased_paid_media`), one aggregate reaction update (`message_reaction_count`), and one autonomous poll state update (`poll`). All follow the same existing pattern: synthesize a type-correct `Update`, call `bot.handleUpdate`, await settlement.

## Goals / Non-Goals

**Goals:**

- Add dispatch verbs for every remaining Bot API update type
- Introduce `BusinessAccount` as a first-class high-level actor for Business API testing
- Keep the same verb-on-actor, `options?` bag convention throughout

**Non-Goals:**

- Full Telegram Business account simulation (presence, inbox state) — verbs dispatch single updates only
- Validating that `business_connection_id` values are globally unique across tests

## Decisions

### `BusinessAccount` actor — new class in `src/high-level/business-account.ts`

Business API updates all share a `business_connection_id` string. Grouping them on a `BusinessAccount` class keeps the connection ID encapsulated and mirrors the User / Group / Channel actor pattern. `chats.newBusinessAccount(user)` mints an instance and auto-generates a `connection_id` (same style as boost_id: `biz-<messageId>`).

```
BusinessAccount {
  connectionId: string
  user: User<TContext>        // the business account owner

  connect(options?)         → business_connection   (is_enabled: true)
  disconnect(options?)      → business_connection   (is_enabled: false)
  sendMessage(text, options?) → business_message
  editMessage(id, text, options?) → edited_business_message
  deleteMessages(ids, options?) → deleted_business_messages
}
```

`business_message` and `edited_business_message` are plain `Message` objects with `business_connection_id` set. The `from` field reflects the BusinessAccount's user. No `chat` override needed — `chat` is the private chat between the user and the bot (derived from `user.id`).

### `managed_bot` — `user.manageBot(botUser, options?)` on `User`

`ManagedBotUpdated` has `{ user, bot }`. The `user` is who manages the bot; the `bot` is the bot being managed. Placing this on the `User` actor keeps it consistent with how other user-initiated updates work. `botUser` is a plain `UserProfile` (id + first_name minimum) since the managed bot isn't itself a framework actor.

```
update.managed_bot = {
  user: { id: user.id, is_bot: false, first_name, ... },
  bot:  { id: botUser.id, is_bot: true, first_name: botUser.first_name, ... }
}
```

### `purchased_paid_media` — `user.purchasePaidMedia(payload, options?)` on `User`

`PaidMediaPurchased` is `{ from: User, paid_media_payload: string }`. Natural actor is the User.

```
update.purchased_paid_media = {
  from: { id: user.id, ... },
  paid_media_payload: payload
}
```

### `message_reaction_count` — `chat.dispatchReactionCount(messageId, reactions, options?)` on Group, Supergroup, Channel

`MessageReactionCountUpdated` has `{ chat, message_id, date, reactions: ReactionCount[] }`. The chat owns the message, so the method lives on chat actors. `reactions` is an array of `{ type: ReactionType, total_count: number }`.

Because this can appear on groups, supergroups, and channels (but not private chats), the method is added to Group, Supergroup, and Channel only. `ReactionCount[]` is passed directly — callers construct the array.

### `poll` state update — `chats.dispatchPollState(poll, options?)` on the `Chats` orchestrator

`poll` updates have no natural owning actor (they are autonomous server events reporting aggregate state). The `Chats` orchestrator is the right home for server-originated events. `poll` is a full `Poll` object passed directly by the caller — the framework doesn't synthesize poll state.

```
update.poll = poll  // full Poll object from caller
```

### Update ID ranges for new verbs

Following the existing range convention:

- `business_connection`: base `1_700_000`
- `business_message`: base `1_710_000`
- `edited_business_message`: base `1_720_000`
- `deleted_business_messages`: base `1_730_000`
- `managed_bot`: base `1_740_000`
- `purchased_paid_media`: base `1_750_000`
- `message_reaction_count`: base `1_760_000`
- `poll` state: base `1_770_000`

Module-level counters in `business-account.ts` and in each method's owning file, consistent with existing `postCounter`, `editPostCounter` etc.

## Risks / Trade-offs

- **`business_message` chat field** — `BusinessMessagesDeleted.chat` is typed `Chat.PrivateChat`, but `business_message` itself is `Message & Update.Private` (private chat between the bot and the business user). The `chat.id` synthesized as `user.id` (the business account owner's user ID) matches real Telegram behaviour for business messages. If tests need a different chat ID, `options.chatId` can override it.
- **`managed_bot` bot is not a framework actor** — passing a `UserProfile`-shaped object for `botUser` is intentionally lightweight; the `managed_bot` update just carries an identity, not a fully orchestrated actor.
- **`poll` state is caller-constructed** — unlike other verbs that synthesize the payload, `dispatchPollState` takes a raw `Poll` object. This keeps the API surface minimal at the cost of requiring callers to build a valid `Poll` shape.
