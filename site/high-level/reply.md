# Reply

`Reply` is the object you get from `user.replies.lastOrThrow()` and other log accessors.
It normalises an outgoing API call into a clean, queryable structure.

```ts
const reply = user.replies.lastOrThrow();
```

## Accessors

### `text`

The message text. `undefined` for non-text messages (e.g. media-only).

```ts
expect(reply.text).toBe('Hello!');
```

### `parseMode`

The parse mode used, or `undefined` if not specified.

```ts
expect(reply.parseMode).toBe('HTML');
```

### `entities`

Array of `MessageEntity` objects from the outgoing payload.

```ts
const codeEntity = reply.entities?.find((e) => e.type === 'code');
```

### `buttons`

Array of `ReplyButton` objects from the inline keyboard (if any). Empty array if no keyboard.

```ts
expect(reply.buttons).toHaveLength(2);
expect(reply.buttons[0].text).toBe('Yes');
expect(reply.buttons[0].callbackData).toBe('answer:yes');
expect(reply.buttons[0].url).toBeUndefined();
```

### `replyMarkup`

The raw `reply_markup` from the outgoing payload — useful for asserting on reply keyboards,
remove keyboards, or force replies.

```ts
const markup = reply.replyMarkup as ReplyKeyboardMarkup;
expect(markup.keyboard[0][0].text).toBe('Option A');
```

### `chat`

The `AnyChat` this reply was sent to.

```ts
expect(reply.chat.id).toBe(user.id);
```

### `messageId`

The synthetic `message_id` assigned to this message.

```ts
expect(reply.messageId).toBeGreaterThan(0);
```

### `raw`

The full `Message` object as returned by the canned response. Useful for edge-case assertions.

```ts
expect(reply.raw.date).toBeGreaterThan(0);
```

### `replyingTo`

If this reply was sent with `reply_parameters`, the referenced earlier `Reply` object (if captured).

```ts
const original = user.replies.all[0];
const botReply = user.replies.all[1];

expect(botReply.replyingTo?.messageId).toBe(original.messageId);
```

## `clickButton(matcher)`

Dispatches a `callback_query` as if the user clicked a button in this message. Returns a
promise that resolves when the bot finishes handling the callback.

```ts
// By button text
await reply.clickButton('Yes');

// By callback data
await reply.clickButton({ callbackData: 'answer:yes' });
```

After clicking, check the edit that followed:

```ts
await user.sendCommand('/menu');
const menu = user.replies.lastOrThrow();

await menu.clickButton('Confirm');

expect(chats.editsFor(user).lastOrThrow().text).toBe('Confirmed!');
```

## ReplyButton

```ts
interface ReplyButton {
  text: string; // visible button label
  callbackData?: string; // callback_data (inline buttons)
  url?: string; // URL (URL buttons)
  raw: InlineKeyboardButton; // escape hatch for other fields
}
```

## MediaType and ReplyMedia

```ts
type MediaType = 'animation' | 'audio' | 'document' | 'photo' | 'sticker' | 'video' | 'video_note' | 'voice';

interface ReplyMedia {
  type: MediaType;
  fileId: string;
}
```

The `reply.media` field (when present) describes the media type and file ID of the outgoing
message.
