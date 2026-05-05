# Logs

Every actor exposes one or more log objects that accumulate captured API calls. All logs share a
common interface: `.last`, `.all`, `.length`, `.clear()`, and (where meaningful) `.lastOrThrow()`.

## RepliesInbox

Per-user log of all replies the bot sent **to that user** (`sendMessage`, `sendPhoto`, etc. with
the user's chat ID). Accessed via `user.replies` or `chats.repliesFor(user)`.

```ts
user.replies.all; // Reply<TContext>[]
user.replies.last; // Reply<TContext> | undefined
user.replies.length; // number
user.replies.lastOrThrow(); // Reply<TContext> — throws if empty
user.replies.clear();
```

### Example

```ts
await user.sendCommand('/help');

const reply = user.replies.lastOrThrow();
expect(reply.text).toContain('Available commands');
```

---

## MessagesLog

Per-chat log of all messages the bot sent **to a specific chat**. Accessed via `group.messages`,
`channel.messages`, or `privateChat.messages`.

```ts
group.messages.all; // Reply<TContext>[]
group.messages.last; // Reply<TContext> | undefined
group.messages.length; // number
group.messages.byText('Hello'); // Reply<TContext> | undefined — exact match
group.messages.byText(/hello/i); // Reply<TContext> | undefined — regex match
group.messages.clear();
```

### Example

```ts
const group = chats.newSupergroup();
group.join(user);

await user.sendCommand('/welcome', undefined, { chat: group });

expect(group.messages.last?.text).toBe('Welcome to the group!');
expect(group.messages.byText(/welcome/i)).toBeDefined();
```

---

## ActionsLog

Per-user log of all `sendChatAction` calls targeting that user's chat. Accessed via
`chats.actionsFor(user)`.

```ts
chats.actionsFor(user).all; // { action: string }[]
chats.actionsFor(user).last; // { action: string } | undefined
chats.actionsFor(user).length; // number
chats.actionsFor(user).clear();
```

### Example

```ts
await user.sendText('processing...');

expect(chats.actionsFor(user).last?.action).toBe('typing');
```

---

## EditsLog

Per-user log of all `editMessageText`, `editMessageCaption`, and `editMessageMedia` calls
targeting that user's chat. Accessed via `chats.editsFor(user)`.

```ts
chats.editsFor(user).all; // Edit[]
chats.editsFor(user).last; // Edit | undefined
chats.editsFor(user).length; // number
chats.editsFor(user).lastOrThrow(); // Edit — throws if empty
chats.editsFor(user).clear();
```

### Edit interface

```ts
interface Edit {
  text?: string;
  caption?: string;
  messageId: number;
}
```

### Example

```ts
await user.sendCommand('/menu');
const reply = user.replies.lastOrThrow();

await reply.clickButton('Update');

const edit = chats.editsFor(user).lastOrThrow();
expect(edit.text).toBe('Updated!');
```

---

## DeletionsLog

Per-chat log of all `deleteMessage` calls for a chat. Accessed via `chats.deletionsFor(chat)`.

```ts
chats.deletionsFor(group).all; // Deletion<TContext>[]
chats.deletionsFor(group).last; // Deletion<TContext> | undefined
chats.deletionsFor(group).length; // number
chats.deletionsFor(group).lastOrThrow(); // Deletion<TContext> — throws if empty
chats.deletionsFor(group).clear();
```

### Deletion interface

```ts
interface Deletion<TContext> {
  chatId: number;
  messageId: number;
  reply?: Reply<TContext>; // the captured Reply if this message was sent during the test
}
```

### Example

```ts
const msg = await user.sendText('Delete me', { chat: group });
// Bot deletes the message in a handler
await user.sendCommand('/clean', undefined, { chat: group });

const deletion = chats.deletionsFor(group).lastOrThrow();
expect(deletion.messageId).toBe(msg.message_id);
```
