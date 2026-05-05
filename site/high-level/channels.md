# Channel

`Channel` represents a Telegram broadcast channel. Use it to dispatch channel posts and
test bots that listen for `channel_post` or `edited_channel_post`.

```ts
const channel = chats.newChannel({ title: 'Announcements' });
```

## Properties

| Property   | Type                      | Description                       |
| ---------- | ------------------------- | --------------------------------- |
| `id`       | `number`                  | Negative channel ID               |
| `type`     | `'channel'`               | Chat type discriminant            |
| `title`    | `string`                  | Channel title                     |
| `messages` | `MessagesLog<TContext>`   | Bot messages sent to this channel |
| `members`  | `Map<userId, Membership>` | Membership state                  |

## Posting messages

### `postMessageTo(targetChat, text, options?)` → dispatches `channel_post`

Posts a message as the channel identity into a linked group (or the channel itself).

```ts
const group = chats.newSupergroup('Discussion');
const channel = chats.newChannel({ title: 'News' });

// Post from channel into the discussion group
await channel.postMessageTo(group, 'Breaking news!');

expect(group.messages.last?.text).toBe('Breaking news!');
```

The update will have `forward_origin` set to the channel, matching a real "linked channel post
forwarded to the group" scenario.

## Editing posts

### `editPost(messageId, newText, options?)` → dispatches `edited_channel_post`

```ts
const msg = await channel.postMessageTo(group, 'Draft announcement');

await channel.editPost(msg.message_id, 'Final announcement');
```

## Membership events

### `changeMemberStatus(user, transition)` → `my_chat_member`

Dispatches a `my_chat_member` update for the channel (e.g. bot added/removed).

```ts
channel.changeMemberStatus(user, { old_status: 'left', new_status: 'member' });
```

## Reaction counts

### `dispatchReactionCount(messageId, reactions, options?)`

```ts
channel.dispatchReactionCount(msg.message_id, [{ type: 'emoji', emoji: '🔥', total_count: 100 }]);
```

## System messages

### `sendSystemMessage(text, options?)`

```ts
await channel.sendSystemMessage('Channel created');
```

## Full cross-chat example

```ts
const { chats } = await prepareBot(createBot());
const channel = chats.newChannel({ title: 'News' });
const group = chats.newSupergroup('Discussion');

// Bot listens for channel posts forwarded to the group
// and replies with a summary

await channel.postMessageTo(group, 'New article published!');

expect(group.messages.last?.text).toContain('summary');
```
