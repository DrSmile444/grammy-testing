# BusinessAccount

`BusinessAccount` provides actors for testing the [Telegram Business API](https://core.telegram.org/bots/features#telegram-business). It dispatches `business_connection`, `business_message`, `edited_business_message`, and `deleted_business_messages` updates.

```ts
const account = chats.newBusinessAccount();
```

## Methods

### `connect(options?)` → `business_connection` (is_enabled: true)

Dispatches a connection event from the business user to the bot.

```ts
await account.connect();

// With custom options:
await account.connect({ user_chat_id: 12345 });
```

### `disconnect(options?)` → `business_connection` (is_enabled: false)

Dispatches a disconnection event.

```ts
await account.disconnect();
```

### `sendMessage(text, options?)` → `business_message`

Dispatches a business message update.

```ts
await account.sendMessage('Hello from business account');
```

### `editMessage(messageId, newText, options?)` → `edited_business_message`

Dispatches an edit to a previously sent business message.

```ts
await account.editMessage(42, 'Corrected message');
```

### `deleteMessages(messageIds, options?)` → `deleted_business_messages`

Dispatches a deletion event for one or more business messages.

```ts
await account.deleteMessages([42, 43]);
```

## Full example

```ts
const { chats } = await prepareBot(createBot());
const account = chats.newBusinessAccount();

// 1. Connect
await account.connect();
expect(user.replies.lastOrThrow().text).toBe('Business account connected!');

// 2. Send a message
await account.sendMessage('Do you have availability?');
expect(user.replies.lastOrThrow().text).toContain('availability');

// 3. Edit
await account.editMessage(lastMessage.message_id, 'Updated query');

// 4. Disconnect
await account.disconnect();
```

## ConnectOptions

```ts
interface ConnectOptions {
  business_connection_id?: string;
  user_chat_id?: number;
  date?: number;
  can_reply?: boolean;
}
```
