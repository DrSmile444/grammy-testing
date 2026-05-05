# PrivateChat

`PrivateChat` represents a one-to-one direct message conversation between the bot and a user.
By Telegram convention, the chat ID equals the user ID.

```ts
const user = chats.newUser();
// user.privateChat is auto-created — same as:
const dm = chats.newPrivateChat(user);
```

## Properties

| Property   | Type                    | Description                   |
| ---------- | ----------------------- | ----------------------------- |
| `id`       | `number`                | Chat ID (equals `user.id`)    |
| `type`     | `'private'`             | Chat type discriminant        |
| `user`     | `User<TContext>`        | The user this chat belongs to |
| `messages` | `MessagesLog<TContext>` | All bot sends to this chat    |

## PrivateChat.messages vs user.replies

These two look similar but track different things:

|                    | `user.replies` (`RepliesInbox`)                                                       | `privateChat.messages` (`MessagesLog`)                            |
| ------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **What it tracks** | Bot replies _to that user_ (via `ctx.reply` or `sendMessage` with the user's chat ID) | All bot sends _to the private chat_, including proactive messages |
| **Source**         | Derived from `onCapture` matching the user ID                                         | Same — both are routed by `Chats.deriveFromCapture`               |
| **In practice**    | Virtually identical for `PrivateChat`                                                 | Virtually identical for `PrivateChat`                             |

For group chats, `user.replies` tracks _per-user_ replies while `group.messages` tracks all
messages in the group. In private chats both refer to the same conversation.

## Usage

```ts
const { chats } = await prepareBot(bot);
const user = chats.newUser();

// Bot proactively sends a message (not a reply)
await chats.outgoing.respondNext('sendMessage', { message_id: 99 });
await bot.api.sendMessage(user.id, 'Proactive message!');

// Check via messages log
expect(user.privateChat.messages.last?.text).toBe('Proactive message!');
```

Most of the time you'll use `user.replies` — `privateChat.messages` is mainly useful when you
need to inspect messages sent outside of a handler context (e.g. scheduled messages, broadcast
calls, or bot-initiated conversations).
