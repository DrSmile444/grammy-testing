# Reply (API Reference)

```ts
class Reply<TContext extends Context = Context>
```

## Properties

| Property      | Type                           | Description                                    |
| ------------- | ------------------------------ | ---------------------------------------------- |
| `text`        | `string \| undefined`          | Message text                                   |
| `parseMode`   | `ParseMode \| undefined`       | Parse mode used                                |
| `entities`    | `MessageEntity[] \| undefined` | Text entities                                  |
| `buttons`     | `ReplyButton[]`                | Inline keyboard buttons (empty if no keyboard) |
| `replyMarkup` | `unknown`                      | Raw `reply_markup` from the payload            |
| `chat`        | `AnyChat<TContext>`            | Target chat                                    |
| `messageId`   | `number`                       | Synthetic message ID                           |
| `raw`         | `Message`                      | Full raw Message object                        |
| `replyingTo`  | `Reply<TContext> \| undefined` | Referenced earlier reply (if any)              |
| `media`       | `ReplyMedia \| undefined`      | Media type and file ID (if media message)      |

## Methods

### `clickButton(matcher): Promise<void>`

Dispatches a callback query as if the user clicked the button.

```ts
// By visible text:
await reply.clickButton('Yes');

// By callback data:
await reply.clickButton({ callbackData: 'answer:yes' });
```

## ReplyButton

```ts
interface ReplyButton {
  text: string;
  callbackData?: string;
  url?: string;
  raw: InlineKeyboardButton;
}
```

## ReplyMedia

```ts
type MediaType = 'animation' | 'audio' | 'document' | 'photo' | 'sticker' | 'video' | 'video_note' | 'voice';

interface ReplyMedia {
  type: MediaType;
  fileId: string;
}
```

## ReplyClickButtonMatcher

```ts
interface ReplyClickButtonMatcher {
  callbackData: string;
}
```

`clickButton` accepts either a `string` (matched against button text) or a
`ReplyClickButtonMatcher` (matched against `callbackData`).

## See also

- [Reply guide](/high-level/reply)
