# Group & Supergroup

`Group` and `Supergroup` represent Telegram group chats. They share the same API — the only
difference is the `type` field: `'group'` vs `'supergroup'`.

```ts
const group = chats.newGroup('My Group');
const sg = chats.newSupergroup('Tech Chat');
```

## Properties

| Property   | Type                        | Description                        |
| ---------- | --------------------------- | ---------------------------------- |
| `id`       | `number`                    | Negative chat ID                   |
| `type`     | `'group'` \| `'supergroup'` | Chat type discriminant             |
| `title`    | `string`                    | Chat title                         |
| `messages` | `MessagesLog<TContext>`     | All bot messages sent to this chat |
| `members`  | `Map<userId, Membership>`   | Per-user membership state          |

## Membership management

These methods update local state only — they do **not** dispatch updates to the bot.

### `join(user)`

Adds a user as a `member`.

```ts
group.join(alice);
group.join(bob);
```

### `own(user)`

Sets a user's status to `creator`.

```ts
group.own(alice);
```

### `promote(user, permissions?)`

Sets the user's status to `administrator` and optionally dispatches a `my_chat_member` update.

```ts
group.promote(alice); // all admin permissions

group.promote(alice, {
  can_delete_messages: true,
  can_restrict_members: true,
});
```

### `restrict(user, permissions?)`

Sets the user's status to `restricted`.

```ts
group.restrict(bob, {
  can_send_messages: false,
  until_date: Math.floor(Date.now() / 1000) + 3600,
});
```

## Dispatching membership events

### `changeMemberStatus(user, transition)` → `my_chat_member`

Dispatches a `my_chat_member` update (bot's own membership changing).

```ts
group.changeMemberStatus(user, { old_status: 'left', new_status: 'member' });
```

### `dispatchMemberUpdate(admin, target, newStatus, options?)` → `chat_member`

Dispatches a `chat_member` update (another member's status changed by an admin).

```ts
group.dispatchMemberUpdate(admin, alice, 'kicked');
```

## Reaction counts

### `dispatchReactionCount(messageId, reactions, options?)` → `message_reaction_count`

```ts
group.dispatchReactionCount(msg.message_id, [{ type: 'emoji', emoji: '👍', total_count: 5 }]);
```

## System messages

### `sendSystemMessage(text, options?)` → message without `from`

Sends a service-type message (e.g. "Alice joined the group") dispatched without a user sender.

```ts
await group.sendSystemMessage('Chat created by Alice');
```

### `postRelayMessage(text, options?)` → channel-forwarded message

Sends a message as if forwarded from a linked channel.

```ts
const relayMsg = await group.postRelayMessage('Forwarded post', { channel });
```

## Checking membership

```ts
const membership = alice.in(group);
expect(membership?.status).toBe('administrator');
```

Or access the map directly:

```ts
const entry = group.members.get(alice.id);
```
